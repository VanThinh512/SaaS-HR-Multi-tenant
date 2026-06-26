# AWS Build Plan — SaaS HR Multi-Tenant (Manual Console)

Migrate the local Docker Compose setup to the AWS 3-tier architecture in [aws_architecture_design.md](aws_architecture_design.md). **Built by hand in the AWS Console** (no Terraform, no CI/CD).

> **Region: `ap-southeast-1`** · **1 VPC / 2 AZ / 6 subnets** · **1 NAT Gateway** · **RDS MySQL Multi-AZ** · **ECS Fargate (auth/tenant/hr)** · **Async: SQS** · **Auth: Cognito** · **Monitor: CloudWatch + SNS** · **Deploy: manual** · **~$130/mo (24/7)**

---

## 1. Finalized Decisions

| # | Topic | Decision |
|:--|:--|:--|
| 1 | **Region** | `ap-southeast-1` (Singapore). `us-east-1` only for the CloudFront ACM certificate. |
| 2 | **Network** | 1 VPC `10.0.0.0/16`, 2 AZ, **6 subnets**: per AZ = 1 public + 1 private-app + 1 private-data. |
| 3 | **NAT** | **1 NAT Gateway** (in public-AZ1, shared) — cost trade-off, egress is single-AZ. |
| 4 | **Compute** | **ECS Fargate**, 3 services (auth/tenant/hr) in **private-app** subnets, behind ALB. No EC2. |
| 5 | **Database** | **RDS MySQL `db.t4g.micro` Multi-AZ** (Primary + Standby) in **private-data** subnets. 7-day backups. |
| 6 | **Async** | **Amazon SQS** (`tenant-service` → queue → `hr-service`). **Redis removed.** |
| 7 | **Identity** | **AWS Cognito** User Pool. auth-service brokers login via `InitiateAuth`; all services validate JWT via JWKS. |
| 8 | **Secrets** | **SSM Parameter Store `SecureString`** (free), referenced by the ECS task definition. |
| 9 | **Frontend** | **React** build on **S3 (Static, private + OAC)**, served via **CloudFront**. |
| 10 | **Monitoring** | **CloudWatch** (logs + CPU≥80% alarm) → **SNS** → email. |
| 11 | **Deploy** | **Manual** (build image → ECR → `ecs update-service`; React → S3 → CloudFront invalidate). |
| 12 | **Removed** | ~~Redis~~ ~~Cloud Map~~ ~~Wazuh/SOC~~ ~~WAF~~ ~~CI/CD~~ ~~NAT-less~~ ~~Terraform~~ — out of scope for this simplified 3-tier. |

---

## 2. Current State → Target Mapping

| Component | Current | Target AWS (`ap-southeast-1`) |
|:--|:--|:--|
| API Gateway | Nginx container | **ALB** (path routing `/api/v1/*`) |
| auth / tenant / hr | FastAPI on 8000/8001/8002 | 3 × **ECS Fargate** services (private-app) |
| Message broker | **Redis** container | **Amazon SQS** (queue) |
| Frontend | Vite React → Nginx | **S3 (Static)** + **CloudFront** |
| Database | MySQL 8.0 container | **RDS MySQL Multi-AZ** (private-data) |
| App identity | Custom RS256 JWT | **AWS Cognito** |
| Secrets | `.env` | **SSM Parameter Store** |
| Monitoring | — | **CloudWatch + SNS** |

---

## 3. Manual AWS Console Build — Step by Step

> Order matters: networking first, then data/identity, then compute, then edge. You currently have **one IAM admin user** — start there.

### Step 0 — Account prep
1. Sign in as the **IAM admin user** (root locked, MFA on).
2. **Billing → Budgets** → create a **$130 monthly budget** with email alert at 80% / 100%. (Free, the cost safety net.)

### Step 1 — VPC + 6 subnets + IGW + NAT
1. **VPC** → Create VPC (name `saashr-vpc`, CIDR `10.0.0.0/16`).
2. **Subnets** (create 6):
   | Subnet | AZ | CIDR |
   |:--|:--|:--|
   | `public-1a` | 1a | `10.0.1.0/24` |
   | `public-1b` | 1b | `10.0.2.0/24` |
   | `app-1a` (private) | 1a | `10.0.11.0/24` |
   | `app-1b` (private) | 1b | `10.0.12.0/24` |
   | `data-1a` (private) | 1a | `10.0.21.0/24` |
   | `data-1b` (private) | 1b | `10.0.22.0/24` |
3. **Internet Gateway** → create `saashr-igw` → **attach to VPC**.
4. **NAT Gateway** → create **1** in `public-1a`, allocate an Elastic IP. (One NAT, shared.)
5. **Route tables**:
   - `rt-public` → route `0.0.0.0/0` → **IGW** → associate `public-1a`, `public-1b`.
   - `rt-app` → route `0.0.0.0/0` → **NAT Gateway** → associate `app-1a`, `app-1b`.
   - `rt-data` → **no internet route** (local only) → associate `data-1a`, `data-1b`.

### Step 2 — Security Groups
- **`sg-alb`**: Ingress 80/443 from `0.0.0.0/0`; Egress all.
- **`sg-ecs`**: Ingress on the app port (e.g. 8000-8002) **from `sg-alb` only**; Egress all (needs NAT for Cognito/SQS/ECR/CloudWatch).
- **`sg-rds`**: Ingress 3306 **from `sg-ecs` only**; no egress.

### Step 3 — RDS MySQL Multi-AZ
1. **RDS → Subnet group** → `saashr-db-subnets` = `data-1a` + `data-1b`.
2. **Create database** → MySQL → `db.t4g.micro` → **Multi-AZ: Yes (create a standby)**.
3. VPC = `saashr-vpc`, subnet group = `saashr-db-subnets`, **no public access**, SG = `sg-rds`.
4. Storage 20 GB gp3; **automated backups 7 days**.
5. After create, run `database/init.sql` (creates `auth_db`, `tenant_db`, `hr_db`) via a temporary bastion or local client through SSM port-forward.

### Step 4 — Secrets (SSM Parameter Store)
- Create SecureString params: `/saashr/db/host`, `/saashr/db/password`, `/saashr/sqs/url`, `/saashr/cognito/pool_id`, `/saashr/cognito/client_id`. (Free, referenced by ECS task def.)

### Step 5 — Cognito
1. **Cognito → Create User Pool** (email sign-in, password policy).
2. **App client** (no secret for SPA, or with secret for the auth-service broker) → enable **`USER_PASSWORD_AUTH`**.
3. Custom attribute `custom:tenant_id`; groups `owner`/`admin`/`employee`.
4. Note the **Pool ID** + **App Client ID** + **JWKS URL** → put in SSM.

### Step 6 — SQS
- **SQS → Create queue** (Standard) `saashr-events`. Add a **Dead-Letter Queue** `saashr-events-dlq` (maxReceive 5). Note the **Queue URL** → SSM.

### Step 7 — SNS (alerts)
- **SNS → Create topic** `saashr-alerts` (Standard) → **Subscribe** your email → **confirm** the email.

### Step 8 — ECR + push images
1. **ECR** → create 3 repos: `saashr-auth`, `saashr-tenant`, `saashr-hr`.
2. Build + push each:
   ```bash
   aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin <acct>.dkr.ecr.ap-southeast-1.amazonaws.com
   docker build -t saashr-auth ./microservices/auth-service
   docker tag saashr-auth:latest <acct>.dkr.ecr.ap-southeast-1.amazonaws.com/saashr-auth:latest
   docker push <acct>.dkr.ecr.ap-southeast-1.amazonaws.com/saashr-auth:latest
   ```

### Step 9 — ALB
1. **EC2 → Load Balancers → Create Application Load Balancer** `saashr-alb`, **internet-facing**, subnets = `public-1a` + `public-1b`, SG = `sg-alb`.
2. **Target groups** (type **IP**, one per service): `tg-auth`, `tg-tenant`, `tg-hr`, health check `/api/v1/{service}/health`.
3. **Listener 80** → rules: `/api/v1/auth/*`→`tg-auth`, `/api/v1/tenants/*`→`tg-tenant`, `/api/v1/hr/*`→`tg-hr`.

### Step 10 — ECS Fargate
1. **ECS → Create cluster** `saashr-cluster` (Fargate).
2. **Task definitions** (one per service, Fargate, 0.25 vCPU / 0.5 GB):
   - container image = ECR repo, port = app port.
   - **Task role**: `sqs:SendMessage`/`ReceiveMessage`/`DeleteMessage` (tenant/hr), `cognito-idp:*` (auth, minimal), `ssm:GetParameters`.
   - **Execution role**: ECR pull + CloudWatch Logs + SSM read.
   - **secrets** from SSM (DB password, SQS URL, Cognito IDs); log driver `awslogs` → `/ecs/saashr/{service}`.
3. **Services** (one per task def): launch type Fargate, subnets = **`app-1a` + `app-1b`** (private), SG = `sg-ecs`, **assign public IP = DISABLED**, desired count 2, attach to the matching **target group**.

### Step 11 — S3 (Static) + frontend
1. **S3 → Create bucket** `saashr-frontend-<acct>`, **Block all public access ON**.
2. `npm run build`, then `aws s3 sync dist/ s3://saashr-frontend-<acct> --delete`.

### Step 12 — ACM + CloudFront
1. **ACM (in `us-east-1`)** → request a public cert for your domain → DNS-validate.
2. **CloudFront → Create distribution**:
   - **Origin 1** = S3 bucket (via **OAC**, default behavior `/*`).
   - **Origin 2** = ALB DNS (behavior `/api/v1/*`, forward all headers/cookies, no cache).
   - SPA error pages: 403/404 → `/index.html` (200).
   - Viewer cert = the us-east-1 ACM cert.

### Step 13 — CloudWatch alarm → SNS
- **CloudWatch → Alarms** → metric ECS service **CPUUtilization ≥ 80%** → action = **SNS `saashr-alerts`**.

### Step 14 — (optional) Route 53
- Hosted zone → **A/ALIAS** `app.<domain>` → CloudFront.

---

## 4. Source Code Changes (Redis → SQS, cleanup)

**tenant-service (publisher):**
- [REPLACE] `app/core/redis.py` → `app/core/sqs.py` — `boto3` SQS client, `send_message(QueueUrl, MessageBody=json)`.
- [MODIFY] `app/routers/tenants.py` — replace `redis.publish(...)` with the SQS send.
- [MODIFY] `app/core/config.py` — drop `REDIS_URL`, add `SQS_QUEUE_URL` + region.
- [MODIFY] `app/routers/health.py` — remove the Redis health check.
- [MODIFY] `requirements.txt` — remove `redis`, add `boto3`.

**hr-service (consumer):**
- [REPLACE] `app/core/worker.py` — Redis `subscribe` loop → **SQS long-poll** (`receive_message` → process → `delete_message`).
- [MODIFY] `main.py` — start the SQS poller instead of the Redis subscriber.
- [MODIFY] `app/core/config.py`, `app/routers/health.py`, `requirements.txt` — same as above.

**All 3 services:**
- Keep the `AUTH_PROVIDER=cognito|local` flag; validate JWT against **Cognito JWKS** when `cognito`.
- Fetch DB/SQS/Cognito config from **SSM** (or ECS task-def secrets).

**Infra/scripts cleanup — DONE:**
- `infra/` Terraform — **deleted** (manual console now).
- `scripts/` — **deleted entirely** (Terraform + Identity Center SSO abandoned). For CLI access (ECR push, S3 sync), run `aws configure` with the IAM admin's access keys.
- Redis fully removed (service code + `docker-compose.yml`). No `.github/workflows/` exists.

---

## 5. Verification
- `curl -I https://<cloudfront-domain>/` → React SPA loads.
- `curl https://<cloudfront-domain>/api/v1/auth/health` (+ tenants/hr) → 200.
- Login end-to-end → Cognito issues JWT → authenticated API → RDS read/write works.
- Async: change a tenant status → message lands in **SQS** → `hr-service` consumes it (check CloudWatch logs).
- Force CPU load → CloudWatch alarm fires → SNS email arrives.
- Kill the Primary RDS → Multi-AZ fails over to Standby, app reconnects.

---

## 6. Estimated Monthly Cost — `ap-southeast-1` (24/7)

| Service | Est. / Month |
|:--|:--:|
| 1× NAT Gateway | $43 – 50 |
| RDS MySQL Multi-AZ (`db.t4g.micro` + 20 GB) | $30 – 38 |
| Application Load Balancer | $22 – 26 |
| ECS Fargate (4–6 tasks, Spot optional) | $12 – 18 |
| Data transfer / CloudWatch | $5 – 12 |
| Route 53 + CloudFront + S3 + ECR | $3 – 8 |
| Cognito · SQS · SNS · ACM · IGW | $0 (free tier) |
| **Total** | **≈ $115 – 155 (~$130)** |

> **Demo tip:** this is the 24/7 figure. For a demo, **delete the NAT Gateway + RDS** (or the whole stack) when not in use — they bill by the hour, so the real cost is a few dollars.

---

## 7. Request Flows (Runtime Reference — 15 flows)

The flows shown on [the architecture diagram](aws_architecture_diagram.png). Solid = synchronous; dashed = async/monitoring; all one-way. `.1/.2` = the same flow from each AZ (ECS runs active in both).

| # | Flow | Path | Line |
|:--|:--|:--|:--|
| **1** | User Access | User → CloudFront | solid |
| **2** | Serve Frontend | CloudFront → S3 (Static) | solid |
| **3** | Route API | CloudFront → Internet Gateway | solid |
| **4** | VPC Ingress | IGW → ALB | solid |
| **5** (5.1/5.2) | Dispatch to Service | ALB → ECS (AZ-1 / AZ-2) | solid |
| **6** (6.1/6.2) | Authenticate | ECS (auth) → Cognito | solid |
| **7** (7.1/7.2) | Access Data | ECS → RDS **Primary** | solid |
| **8** | Replicate to Standby | RDS Primary → Standby (synchronous) | solid |
| **9** (9.1/9.2) | Publish Event | tenant-service → SQS | dashed |
| **10** (10.1/10.2) | Consume Event | SQS → hr-service (poll) | dashed |
| **11** (11.1/11.2) | Stream Logs/Metrics | ECS → CloudWatch | dashed |
| **12** | Raise Alert | CloudWatch → SNS (CPU ≥ 80%) | dashed |
| **13** | Notify Team | SNS → Developers (email) | dashed |
| **14** | Egress via NAT | ECS (both AZ) → NAT Gateway (AZ-1) | solid |
| **15** | NAT to Internet | NAT → IGW → Internet | solid |

> **Notes:** ECS tasks are **all-active in both AZ** (no primary/standby) — flows from ECS originate from both (`.1/.2`). Both `7.1` and `7.2` go to the **Primary** (Standby is passive). `10` is a **poll** (hr pulls from SQS). `6/9/11` are logical arrows; physically they exit via the **NAT** (flow 14→15). Only `7` (ECS→RDS) stays inside the VPC.
