# Thiết Kế Kiến Trúc AWS & Kế Hoạch FinOps
**Dự án**: SaaS HR Multi-Tenant (FastAPI + ReactJS)
**Vùng**: ap-southeast-1 (Singapore) · Một Tài Khoản AWS
**Mô hình**: Ứng dụng web 3-tier chuẩn, Multi-AZ
**Chi phí**: thực tế **~$130 / tháng** (24/7), gần $0 khi destroy

---

## 1. Sơ Đồ Kiến Trúc Hệ Thống

Kiến trúc ba tầng chuẩn: CloudFront + S3 cho tầng giao diện, ECS Fargate sau ALB cho tầng ứng dụng, RDS MySQL Multi-AZ cho tầng dữ liệu — tất cả trong một VPC trải hai Availability Zone. Sự kiện bất đồng bộ dùng SQS, danh tính dùng Cognito, giám sát dùng CloudWatch + SNS.

![Sơ đồ kiến trúc AWS - SaaS HR Multi-Tenant](aws_architecture_diagram.png)

### Bảng Tổng Hợp Thành Phần

| Tầng / Vùng | Dịch vụ AWS | Vai trò | Vị trí |
|:--|:--|:--|:--|
| **Edge** | Amazon CloudFront | CDN + entry point duy nhất (tĩnh + API) | Global (edge) |
| **TLS** | AWS Certificate Manager (ACM) | Cert viewer cho CloudFront | `us-east-1` |
| **Hosting tĩnh** | Amazon S3 (Static) | File build React (private qua OAC) | Region |
| **Danh tính** | AWS Cognito (User Pools) | Xác thực, JWT (`custom:tenant_id` + vai trò) | Region |
| **Secret** | SSM Parameter Store | Config SecureString (mật khẩu DB, SQS URL, Cognito ID) | Region |
| **Async** | Amazon SQS | `tenant-service` → queue → `hr-service` (+ DLQ) | Region |
| **Mạng** | Internet Gateway + **1 NAT Gateway** | IGW = vào ALB + đường ra; NAT = egress private→internet | VPC |
| **Cân bằng tải** | Application Load Balancer | Định tuyến `/api/v1/*` đến target group ECS | Public subnet |
| **Compute** | Amazon ECS Fargate (3 service) | microservice auth / tenant / hr (không EC2) | Private-app subnet (2 AZ) |
| **Registry** | Amazon ECR (3 repo) | Container image | Region |
| **Database** | Amazon RDS MySQL `db.t4g.micro` **Multi-AZ** | Primary + Standby, `auth_db`/`tenant_db`/`hr_db`, backup 7 ngày | Private-data subnet (2 AZ) |
| **Giám sát** | Amazon CloudWatch + SNS | Log + alarm CPU≥80% → email | Region |

---

## 2. Bảng Ước Tính Chi Phí Hàng Tháng (Khoảng — Singapore, 24/7)

| Dịch vụ AWS | Cấu hình | Ước tính / Tháng |
| :--- | :--- | :---: |
| **NAT Gateway** | 1 NAT (dùng chung, public-AZ1) | **$43 – 50** |
| **RDS MySQL Multi-AZ** | db.t4g.micro ×2 + 20 GB gp3 + backup 7 ngày | **$30 – 38** |
| **ALB** | 1 ALB + ~1 LCU | **$22 – 26** |
| **ECS Fargate** | 4–6 task @ 0.25 vCPU / 0.5 GB | **$12 – 18** |
| **Data Transfer / CloudWatch** | log (7 ngày), inter-AZ, NAT data | **$5 – 12** |
| **Route 53 + CloudFront + S3 + ECR** | DNS, edge, tĩnh, image | **$3 – 8** |
| **Cognito · SQS · SNS · ACM · IGW** | free tier | **$0** |
| **Tổng / Tháng** | | **≈ $115 – 155 (~$130)** |

> [!NOTE]
> Hai khoản đắt nhất là **NAT Gateway (~$45)** và **RDS Multi-AZ (~$34)** — "thuế HA". Demo thì destroy khi không dùng (cả hai tính theo giờ). **Cảnh báo AWS Budgets $130** là lưới an toàn.

---

## 3. Ghi chú FinOps

### Một NAT Gateway (chi phí vs HA)
Một NAT Gateway dùng chung ở public-AZ1 phục vụ cả 2 private-app subnet. Tiết kiệm ~$45/tháng so với mỗi-AZ-một-NAT, đổi lại egress chỉ 1 AZ: AZ-1 chết thì task ở AZ-2 mất đường ra. Chấp nhận được cho demo; production nên 1 NAT mỗi AZ.

### Gộp Database đa tenant
Một `db.t4g.micro` chứa 3 database logic (`auth_db`, `tenant_db`, `hr_db`), giữ pattern database-per-service mà không tốn gấp 3 instance. **Multi-AZ** bật cho HA; **backup tự động 7 ngày** chống mất dữ liệu (PII nhân viên).

### Fargate thay EC2
ECS Fargate chạy container serverless — không cần vá/scale server. Nó là tầng ứng dụng (tương đương EC2 trong 3-tier kinh điển) nhưng nhẹ vận hành hơn.

### Destroy khi demo
NAT Gateway, RDS, ALB tính theo giờ. Chỉ bật stack lúc test/bảo vệ thì chi phí thật chỉ vài đô.

---

## 4. Thiết Kế Mạng VPC & Subnet

Một VPC (`10.0.0.0/16`) trải 2 AZ, **6 subnet** (cách ly 3-tier kinh điển):

```
VPC 10.0.0.0/16
│
├── Internet Gateway (IGW)            --> vào ALB + đường ra
├── 1 NAT Gateway (ở public-1a)       --> egress cho private-app subnet
│
├── AZ ap-southeast-1a
│   ├── public-1a   10.0.1.0/24       --> ALB node, NAT Gateway
│   ├── app-1a      10.0.11.0/24      --> ECS Fargate task
│   └── data-1a     10.0.21.0/24      --> RDS Primary
└── AZ ap-southeast-1b
    ├── public-1b   10.0.2.0/24       --> ALB node
    ├── app-1b      10.0.12.0/24      --> ECS Fargate task
    └── data-1b     10.0.22.0/24      --> RDS Standby
```

**Route table:**
- `public` → `0.0.0.0/0` → **IGW** (gán public-1a, public-1b)
- `app` → `0.0.0.0/0` → **NAT Gateway** (gán app-1a, app-1b)
- `data` → **chỉ local, không internet** (gán data-1a, data-1b)

**Điểm chính:** ALB internet-facing ở public subnet; ECS và RDS ở private subnet **không IP public**. Subnet data của RDS **không có route ra internet**. ECS gọi Cognito/SQS/ECR/CloudWatch **ra ngoài qua NAT Gateway**.

---

## 5. Security Group (Zero-Trust)

```
        [ Internet / CloudFront ]
                  │ (443/80)
                  ▼
            [ sg-alb ]
                  │ (chỉ cổng app)
                  ▼
            [ sg-ecs ] ──(egress qua NAT: Cognito, SQS, ECR, CloudWatch)
                  │ (3306)
                  ▼
            [ sg-rds ]
```

- **`sg-alb`** — Ingress 80/443 từ `0.0.0.0/0`; Egress all.
- **`sg-ecs`** — Ingress cổng app **chỉ từ `sg-alb`**; Egress all (ra AWS API qua NAT).
- **`sg-rds`** — Ingress 3306 **chỉ từ `sg-ecs`**; không egress. Truy cập DB trực tiếp từ internet là không thể.

---

## 6. Điểm Nổi Bật Microservices & AWS

- **Định tuyến tại edge**: CloudFront là entry duy nhất — tĩnh `/` phục vụ từ S3, API `/api/v1/{auth,tenants,hr}` chuyển tới ALB, ALB định tuyến tới ECS service tương ứng.
- **Danh tính tập trung**: Cognito cấp JWT (`custom:tenant_id` + group vai trò); auth-service trung gian login (`InitiateAuth`), cả 3 service verify token qua **JWKS** của Cognito. Cô lập tenant thực thi theo từng request ở app.
- **Async tách rời**: `tenant-service` đẩy sự kiện nghiệp vụ vào **SQS**; `hr-service` poll và xử lý. Queue hấp thụ tải đột biến và sống sót khi consumer chết (message được giữ; DLQ bắt message lỗi).
- **Compute stateless, multi-AZ**: ECS Fargate chạy auth/tenant/hr stateless ở cả 2 AZ; ALB chia tải và sống sót khi 1 AZ lỗi. Trạng thái nằm ở RDS (data) và Cognito (identity).
- **Tầng data managed**: RDS MySQL Multi-AZ cho replication đồng bộ Primary→Standby, tự failover, backup tự động — HA và bền vững mà không tự quản DB.
- **Giám sát chủ động**: ECS đẩy log/metric đến CloudWatch; alarm CPU≥80% báo đội ngũ qua email SNS.

---

## 7. Các Luồng Request (15)

Nét liền = đồng bộ; nét đứt = async/giám sát; tất cả 1 chiều. `.1/.2` = cùng flow từ mỗi AZ (ECS active ở cả 2 AZ — compute không có primary/standby).

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

> Flow 6/9/11 là mũi tên **logic** (app nói chuyện với gì); vật lý ra ngoài qua **NAT Gateway** (flow 14 → 15). Chỉ flow 7 (ECS→RDS) nằm trong VPC. Cả 7.1 và 7.2 đều tới **Primary** — Standby thụ động (chỉ failover).
