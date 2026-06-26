# Kế hoạch Triển khai AWS — SaaS HR Multi-Tenant (Manual Console)

Di chuyển môi trường Docker Compose cục bộ sang kiến trúc AWS 3-tier mô tả trong [aws_architecture_design.md](aws_architecture_design.md). **Tạo thủ công bằng tay trên AWS Console** (không Terraform, không CI/CD).

> **Region: `ap-southeast-1`** · **1 VPC / 2 AZ / 6 subnet** · **1 NAT Gateway** · **RDS MySQL Multi-AZ** · **ECS Fargate (auth/tenant/hr)** · **Async: SQS** · **Auth: Cognito** · **Giám sát: CloudWatch + SNS** · **Deploy: thủ công** · **~$130/tháng (24/7)**

---

## 1. Các Quyết định Đã Chốt

| # | Hạng mục | Quyết định |
|:--|:--|:--|
| 1 | **Region** | `ap-southeast-1` (Singapore). `us-east-1` chỉ để cấp cert ACM cho CloudFront. |
| 2 | **Mạng** | 1 VPC `10.0.0.0/16`, 2 AZ, **6 subnet**: mỗi AZ = 1 public + 1 private-app + 1 private-data. |
| 3 | **NAT** | **1 NAT Gateway** (ở public-AZ1, dùng chung) — đánh đổi chi phí, egress chỉ 1 AZ. |
| 4 | **Compute** | **ECS Fargate**, 3 service (auth/tenant/hr) trong **private-app**, sau ALB. Không EC2. |
| 5 | **Database** | **RDS MySQL `db.t4g.micro` Multi-AZ** (Primary + Standby) trong **private-data**. Backup 7 ngày. |
| 6 | **Async** | **Amazon SQS** (`tenant-service` → queue → `hr-service`). **Bỏ Redis.** |
| 7 | **Danh tính** | **AWS Cognito** User Pool. auth-service trung gian login qua `InitiateAuth`; mọi service verify JWT qua JWKS. |
| 8 | **Secret** | **SSM Parameter Store `SecureString`** (free), tham chiếu từ ECS task definition. |
| 9 | **Frontend** | **React** build trên **S3 (Static, private + OAC)**, phân phối qua **CloudFront**. |
| 10 | **Giám sát** | **CloudWatch** (log + alarm CPU≥80%) → **SNS** → email. |
| 11 | **Deploy** | **Thủ công** (build image → ECR → `ecs update-service`; React → S3 → invalidate CloudFront). |
| 12 | **Đã bỏ** | ~~Redis~~ ~~Cloud Map~~ ~~Wazuh/SOC~~ ~~WAF~~ ~~CI/CD~~ ~~NAT-less~~ ~~Terraform~~ — ngoài phạm vi 3-tier gọn này. |

---

## 2. Ánh xạ Hiện trạng → Mục tiêu

| Thành phần | Hiện tại | Mục tiêu AWS (`ap-southeast-1`) |
|:--|:--|:--|
| API Gateway | Nginx container | **ALB** (định tuyến `/api/v1/*`) |
| auth / tenant / hr | FastAPI 8000/8001/8002 | 3 × **ECS Fargate** service (private-app) |
| Message broker | **Redis** container | **Amazon SQS** (queue) |
| Frontend | Vite React → Nginx | **S3 (Static)** + **CloudFront** |
| Database | MySQL 8.0 container | **RDS MySQL Multi-AZ** (private-data) |
| Danh tính app | JWT RS256 tự ký | **AWS Cognito** |
| Secret | `.env` | **SSM Parameter Store** |
| Giám sát | — | **CloudWatch + SNS** |

---

## 3. Tạo Thủ Công Trên AWS Console — Từng Bước

> Thứ tự quan trọng: mạng trước, rồi data/identity, rồi compute, cuối cùng edge. Hiện bạn có **1 IAM admin user** — bắt đầu từ đó.

### Bước 0 — Chuẩn bị tài khoản
1. Đăng nhập **IAM admin user** (root đã khóa, bật MFA).
2. **Billing → Budgets** → tạo **budget $130/tháng**, cảnh báo email tại 80% / 100%. (Free, lưới an toàn chi phí.)

### Bước 1 — VPC + 6 subnet + IGW + NAT
1. **VPC** → Create VPC (tên `saashr-vpc`, CIDR `10.0.0.0/16`).
2. **Subnet** (tạo 6 cái):
   | Subnet | AZ | CIDR |
   |:--|:--|:--|
   | `public-1a` | 1a | `10.0.1.0/24` |
   | `public-1b` | 1b | `10.0.2.0/24` |
   | `app-1a` (private) | 1a | `10.0.11.0/24` |
   | `app-1b` (private) | 1b | `10.0.12.0/24` |
   | `data-1a` (private) | 1a | `10.0.21.0/24` |
   | `data-1b` (private) | 1b | `10.0.22.0/24` |
3. **Internet Gateway** → tạo `saashr-igw` → **attach vào VPC**.
4. **NAT Gateway** → tạo **1** cái trong `public-1a`, cấp 1 Elastic IP. (Một NAT dùng chung.)
5. **Route table**:
   - `rt-public` → route `0.0.0.0/0` → **IGW** → gán `public-1a`, `public-1b`.
   - `rt-app` → route `0.0.0.0/0` → **NAT Gateway** → gán `app-1a`, `app-1b`.
   - `rt-data` → **không có route internet** (chỉ local) → gán `data-1a`, `data-1b`.

### Bước 2 — Security Group
- **`sg-alb`**: Ingress 80/443 từ `0.0.0.0/0`; Egress all.
- **`sg-ecs`**: Ingress cổng app (vd 8000-8002) **chỉ từ `sg-alb`**; Egress all (cần NAT để gọi Cognito/SQS/ECR/CloudWatch).
- **`sg-rds`**: Ingress 3306 **chỉ từ `sg-ecs`**; không egress.

### Bước 3 — RDS MySQL Multi-AZ
1. **RDS → Subnet group** → `saashr-db-subnets` = `data-1a` + `data-1b`.
2. **Create database** → MySQL → `db.t4g.micro` → **Multi-AZ: Yes (tạo standby)**.
3. VPC = `saashr-vpc`, subnet group = `saashr-db-subnets`, **không public access**, SG = `sg-rds`.
4. Storage 20 GB gp3; **backup tự động 7 ngày**.
5. Sau khi tạo, chạy `database/init.sql` (tạo `auth_db`, `tenant_db`, `hr_db`) qua bastion tạm hoặc client local qua SSM port-forward.

### Bước 4 — Secret (SSM Parameter Store)
- Tạo param SecureString: `/saashr/db/host`, `/saashr/db/password`, `/saashr/sqs/url`, `/saashr/cognito/pool_id`, `/saashr/cognito/client_id`. (Free, ECS task def tham chiếu.)

### Bước 5 — Cognito
1. **Cognito → Create User Pool** (đăng nhập email, chính sách mật khẩu).
2. **App client** → bật **`USER_PASSWORD_AUTH`**.
3. Custom attribute `custom:tenant_id`; group `owner`/`admin`/`employee`.
4. Ghi lại **Pool ID** + **App Client ID** + **JWKS URL** → lưu vào SSM.

### Bước 6 — SQS
- **SQS → Create queue** (Standard) `saashr-events`. Thêm **Dead-Letter Queue** `saashr-events-dlq` (maxReceive 5). Ghi **Queue URL** → SSM.

### Bước 7 — SNS (cảnh báo)
- **SNS → Create topic** `saashr-alerts` (Standard) → **Subscribe** email của bạn → **xác nhận** email.

### Bước 8 — ECR + push image
1. **ECR** → tạo 3 repo: `saashr-auth`, `saashr-tenant`, `saashr-hr`.
2. Build + push từng cái:
   ```bash
   aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin <acct>.dkr.ecr.ap-southeast-1.amazonaws.com
   docker build -t saashr-auth ./microservices/auth-service
   docker tag saashr-auth:latest <acct>.dkr.ecr.ap-southeast-1.amazonaws.com/saashr-auth:latest
   docker push <acct>.dkr.ecr.ap-southeast-1.amazonaws.com/saashr-auth:latest
   ```

### Bước 9 — ALB
1. **EC2 → Load Balancers → Create Application Load Balancer** `saashr-alb`, **internet-facing**, subnet = `public-1a` + `public-1b`, SG = `sg-alb`.
2. **Target group** (type **IP**, mỗi service 1 cái): `tg-auth`, `tg-tenant`, `tg-hr`, health check `/api/v1/{service}/health`.
3. **Listener 80** → rule: `/api/v1/auth/*`→`tg-auth`, `/api/v1/tenants/*`→`tg-tenant`, `/api/v1/hr/*`→`tg-hr`.

### Bước 10 — ECS Fargate
1. **ECS → Create cluster** `saashr-cluster` (Fargate).
2. **Task definition** (mỗi service 1 cái, Fargate, 0.25 vCPU / 0.5 GB):
   - image = ECR repo, port = cổng app.
   - **Task role**: `sqs:SendMessage`/`ReceiveMessage`/`DeleteMessage` (tenant/hr), `cognito-idp:*` (auth, tối thiểu), `ssm:GetParameters`.
   - **Execution role**: kéo ECR + CloudWatch Logs + đọc SSM.
   - **secrets** từ SSM (mật khẩu DB, SQS URL, Cognito ID); log driver `awslogs` → `/ecs/saashr/{service}`.
3. **Service** (mỗi task def 1 cái): Fargate, subnet = **`app-1a` + `app-1b`** (private), SG = `sg-ecs`, **assign public IP = DISABLED**, desired count 2, gắn vào **target group** tương ứng.

### Bước 11 — S3 (Static) + frontend
1. **S3 → Create bucket** `saashr-frontend-<acct>`, **Block all public access BẬT**.
2. `npm run build`, rồi `aws s3 sync dist/ s3://saashr-frontend-<acct> --delete`.

### Bước 12 — ACM + CloudFront
1. **ACM (ở `us-east-1`)** → request cert public cho domain → xác thực DNS.
2. **CloudFront → Create distribution**:
   - **Origin 1** = bucket S3 (qua **OAC**, behavior mặc định `/*`).
   - **Origin 2** = DNS của ALB (behavior `/api/v1/*`, forward hết header/cookie, không cache).
   - SPA error page: 403/404 → `/index.html` (200).
   - Viewer cert = cert ACM us-east-1.

### Bước 13 — CloudWatch alarm → SNS
- **CloudWatch → Alarms** → metric ECS service **CPUUtilization ≥ 80%** → action = **SNS `saashr-alerts`**.

### Bước 14 — (tùy chọn) Route 53
- Hosted zone → **A/ALIAS** `app.<domain>` → CloudFront.

---

## 4. Thay đổi Source Code (Redis → SQS, dọn dẹp)

**tenant-service (publisher):**
- [THAY] `app/core/redis.py` → `app/core/sqs.py` — client `boto3` SQS, `send_message(QueueUrl, MessageBody=json)`.
- [SỬA] `app/routers/tenants.py` — thay `redis.publish(...)` bằng SQS send.
- [SỬA] `app/core/config.py` — bỏ `REDIS_URL`, thêm `SQS_QUEUE_URL` + region.
- [SỬA] `app/routers/health.py` — bỏ health check Redis.
- [SỬA] `requirements.txt` — bỏ `redis`, thêm `boto3`.

**hr-service (consumer):**
- [THAY] `app/core/worker.py` — vòng `subscribe` Redis → **SQS long-poll** (`receive_message` → xử lý → `delete_message`).
- [SỬA] `main.py` — khởi động SQS poller thay cho Redis subscriber.
- [SỬA] `app/core/config.py`, `app/routers/health.py`, `requirements.txt` — như trên.

**Cả 3 service:**
- Giữ flag `AUTH_PROVIDER=cognito|local`; verify JWT qua **Cognito JWKS** khi `cognito`.
- Lấy config DB/SQS/Cognito từ **SSM** (hoặc secrets trong ECS task def).

**Dọn infra/scripts — ĐÃ XONG:**
- `infra/` Terraform — **đã xóa** (giờ manual console).
- `scripts/` — **đã xóa hoàn toàn** (bỏ Terraform + Identity Center SSO). Cần CLI (push ECR, sync S3) thì chạy `aws configure` với access key của IAM admin.
- Redis đã gỡ sạch (code service + `docker-compose.yml`). Không có `.github/workflows/`.

---

## 5. Kế hoạch Xác minh
- `curl -I https://<cloudfront-domain>/` → React SPA load được.
- `curl https://<cloudfront-domain>/api/v1/auth/health` (+ tenants/hr) → 200.
- Login đầu-cuối → Cognito cấp JWT → API có xác thực → đọc/ghi RDS chạy.
- Async: đổi trạng thái 1 tenant → message vào **SQS** → `hr-service` tiêu thụ (xem log CloudWatch).
- Ép CPU cao → alarm CloudWatch kích hoạt → email SNS tới.
- Tắt RDS Primary → Multi-AZ failover sang Standby, app kết nối lại.

---

## 6. Chi phí Ước tính Hàng tháng — `ap-southeast-1` (24/7)

| Dịch vụ | Ước tính / Tháng |
|:--|:--:|
| 1× NAT Gateway | $43 – 50 |
| RDS MySQL Multi-AZ (`db.t4g.micro` + 20 GB) | $30 – 38 |
| Application Load Balancer | $22 – 26 |
| ECS Fargate (4–6 task, Spot tùy chọn) | $12 – 18 |
| Data transfer / CloudWatch | $5 – 12 |
| Route 53 + CloudFront + S3 + ECR | $3 – 8 |
| Cognito · SQS · SNS · ACM · IGW | $0 (free tier) |
| **Tổng** | **≈ $115 – 155 (~$130)** |

> **Mẹo demo:** đây là con số 24/7. Demo thì **xóa NAT Gateway + RDS** (hoặc cả stack) khi không dùng — tính theo giờ, nên chi phí thật chỉ vài đô.

---

## 7. Các Luồng Request (Tham chiếu Runtime — 15 flow)

Các flow trên [sơ đồ kiến trúc](aws_architecture_diagram.png). Nét liền = đồng bộ; nét đứt = async/giám sát; tất cả 1 chiều. `.1/.2` = cùng flow từ mỗi AZ (ECS chạy active ở cả 2 AZ).

| # | Flow | Đường đi | Nét |
|:--|:--|:--|:--|
| **1** | User Access | User → CloudFront | liền |
| **2** | Serve Frontend | CloudFront → S3 (Static) | liền |
| **3** | Route API | CloudFront → Internet Gateway | liền |
| **4** | VPC Ingress | IGW → ALB | liền |
| **5** (5.1/5.2) | Dispatch to Service | ALB → ECS (AZ-1 / AZ-2) | liền |
| **6** (6.1/6.2) | Authenticate | ECS (auth) → Cognito | liền |
| **7** (7.1/7.2) | Access Data | ECS → RDS **Primary** | liền |
| **8** | Replicate to Standby | RDS Primary → Standby (đồng bộ) | liền |
| **9** (9.1/9.2) | Publish Event | tenant-service → SQS | đứt |
| **10** (10.1/10.2) | Consume Event | SQS → hr-service (poll) | đứt |
| **11** (11.1/11.2) | Stream Logs/Metrics | ECS → CloudWatch | đứt |
| **12** | Raise Alert | CloudWatch → SNS (CPU ≥ 80%) | đứt |
| **13** | Notify Team | SNS → Developers (email) | đứt |
| **14** | Egress via NAT | ECS (cả 2 AZ) → NAT Gateway (AZ-1) | liền |
| **15** | NAT to Internet | NAT → IGW → Internet | liền |

> **Lưu ý:** ECS task **active ở cả 2 AZ** (không có primary/standby) — flow xuất phát từ ECS đều đi từ cả hai (`.1/.2`). Cả `7.1` và `7.2` đều tới **Primary** (Standby thụ động). `10` là **poll** (hr kéo từ SQS). `6/9/11` là mũi tên logic; vật lý ra ngoài qua **NAT** (flow 14→15). Chỉ `7` (ECS→RDS) là trong VPC.
