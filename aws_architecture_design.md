# AWS Architecture Design & FinOps Plan
**Project**: SaaS HR Multi-Tenant (FastAPI + ReactJS)
**Region**: ap-southeast-1 (Singapore) · Single AWS Account
**Pattern**: Standard 3-tier web application, Multi-AZ
**Cost**: realistic **~$130 / month** (24/7), near $0 when torn down

---

## 1. System Architecture Diagram

A standard three-tier architecture: CloudFront + S3 for the presentation tier, ECS Fargate behind an ALB for the application tier, and RDS MySQL Multi-AZ for the data tier — all inside one VPC across two Availability Zones. Async events use SQS, identity uses Cognito, monitoring uses CloudWatch + SNS.

![SaaS HR Multi-Tenant AWS Architecture Diagram](aws_architecture_diagram.png)

### Architecture Components Summary

| Layer / Zone | AWS Service | Role | Placement |
|:--|:--|:--|:--|
| **Edge** | Amazon CloudFront | CDN + single entry point (static + API) | Global (edge) |
| **TLS** | AWS Certificate Manager (ACM) | Viewer certificate for CloudFront | `us-east-1` |
| **Static Hosting** | Amazon S3 (Static) | React build artifacts (private via OAC) | Region |
| **Identity** | AWS Cognito (User Pools) | Authentication, JWT (`custom:tenant_id` + role) | Region |
| **Secrets** | SSM Parameter Store | SecureString config (DB password, SQS URL, Cognito IDs) | Region |
| **Async** | Amazon SQS | `tenant-service` → queue → `hr-service` (+ DLQ) | Region |
| **Networking** | Internet Gateway + **1 NAT Gateway** | IGW = inbound to ALB + outbound exit; NAT = private→internet egress | VPC |
| **Load Balancing** | Application Load Balancer | Path-routing `/api/v1/*` to ECS target groups | Public subnets |
| **Compute** | Amazon ECS Fargate (3 services) | auth / tenant / hr microservices (no EC2) | Private-app subnets (2 AZ) |
| **Registry** | Amazon ECR (3 repos) | Container images | Region |
| **Database** | Amazon RDS MySQL `db.t4g.micro` **Multi-AZ** | Primary + Standby, `auth_db`/`tenant_db`/`hr_db`, 7-day backups | Private-data subnets (2 AZ) |
| **Monitoring** | Amazon CloudWatch + SNS | Logs + CPU≥80% alarm → email | Region |

---

## 2. Monthly Cost Estimation (Ranges — Singapore, 24/7)

| AWS Service | Config | Est. / Month |
| :--- | :--- | :---: |
| **NAT Gateway** | 1 NAT (shared, public-AZ1) | **$43 – 50** |
| **RDS MySQL Multi-AZ** | db.t4g.micro ×2 + 20 GB gp3 + 7-day backups | **$30 – 38** |
| **ALB** | 1 ALB + ~1 LCU | **$22 – 26** |
| **ECS Fargate** | 4–6 tasks @ 0.25 vCPU / 0.5 GB | **$12 – 18** |
| **Data Transfer / CloudWatch** | logs (7-day), inter-AZ, NAT data | **$5 – 12** |
| **Route 53 + CloudFront + S3 + ECR** | DNS, edge, static, images | **$3 – 8** |
| **Cognito · SQS · SNS · ACM · IGW** | free tier | **$0** |
| **Total / Month** | | **≈ $115 – 155 (~$130)** |

> [!NOTE]
> The two biggest costs are the **NAT Gateway (~$45)** and **RDS Multi-AZ (~$34)** — the "HA tax". For a demo, tear the stack down when idle (both bill hourly). A **$130 AWS Budgets alert** is the safety net.

---

## 3. Core FinOps Notes

### Single NAT Gateway (cost vs HA)
One shared NAT Gateway in public-AZ1 serves both private-app subnets. This saves ~$45/mo versus one-NAT-per-AZ, at the cost of single-AZ egress: if AZ-1 fails, AZ-2 tasks lose outbound. Acceptable for a demo; production would use one NAT per AZ.

### Consolidated Multi-Tenant Database
A single `db.t4g.micro` hosts three logical databases (`auth_db`, `tenant_db`, `hr_db`), preserving the database-per-service pattern without 3× instance cost. **Multi-AZ** is enabled for high availability; **7-day automated backups** protect against data loss (employee PII).

### Fargate over EC2
ECS Fargate runs the containers serverless — no servers to patch or scale-manage. It is the application tier (equivalent to EC2 in a classic 3-tier), but with lower operational overhead.

### Tear-down for demos
NAT Gateway, RDS, and ALB bill by the hour. Running the stack only during testing/defense keeps the real spend to a few dollars.

---

## 4. VPC Network Subnet Design

One VPC (`10.0.0.0/16`) across two AZs, **6 subnets** (textbook 3-tier isolation):

```
VPC 10.0.0.0/16
│
├── Internet Gateway (IGW)            --> inbound to ALB + outbound exit
├── 1 NAT Gateway (in public-1a)      --> egress for private-app subnets
│
├── AZ ap-southeast-1a
│   ├── public-1a   10.0.1.0/24       --> ALB node, NAT Gateway
│   ├── app-1a      10.0.11.0/24      --> ECS Fargate tasks
│   └── data-1a     10.0.21.0/24      --> RDS Primary
└── AZ ap-southeast-1b
    ├── public-1b   10.0.2.0/24       --> ALB node
    ├── app-1b      10.0.12.0/24      --> ECS Fargate tasks
    └── data-1b     10.0.22.0/24      --> RDS Standby
```

**Route tables:**
- `public` → `0.0.0.0/0` → **IGW** (associate public-1a, public-1b)
- `app` → `0.0.0.0/0` → **NAT Gateway** (associate app-1a, app-1b)
- `data` → **local only, no internet** (associate data-1a, data-1b)

**Key points:** ALB is internet-facing in the public subnets; ECS and RDS are in private subnets with **no public IP**. RDS data subnets have **no route to the internet** at all. ECS reaches Cognito/SQS/ECR/CloudWatch **outbound via the NAT Gateway**.

---

## 5. Security Groups (Zero-Trust)

```
        [ Internet / CloudFront ]
                  │ (443/80)
                  ▼
            [ sg-alb ]
                  │ (app port only)
                  ▼
            [ sg-ecs ] ──(egress via NAT: Cognito, SQS, ECR, CloudWatch)
                  │ (3306)
                  ▼
            [ sg-rds ]
```

- **`sg-alb`** — Ingress 80/443 from `0.0.0.0/0`; Egress all.
- **`sg-ecs`** — Ingress on the app port **only from `sg-alb`**; Egress all (outbound to AWS APIs via NAT).
- **`sg-rds`** — Ingress 3306 **only from `sg-ecs`**; no egress. Direct DB access from the internet is impossible.

---

## 6. Microservices & AWS Synergy

- **Path-routing at the edge**: CloudFront is the single entry — static `/` served from S3, API `/api/v1/{auth,tenants,hr}` forwarded to the ALB, which path-routes to the matching ECS service.
- **Centralized identity**: Cognito issues JWTs (`custom:tenant_id` + role group); the auth-service brokers login (`InitiateAuth`), and all three services validate tokens against the Cognito **JWKS**. Tenant isolation is enforced per-request in the app.
- **Decoupled async**: `tenant-service` publishes business events to **SQS**; `hr-service` polls and processes them. The queue absorbs spikes and survives a consumer outage (messages persist; a DLQ catches poison messages).
- **Stateless, multi-AZ compute**: ECS Fargate runs auth/tenant/hr as stateless tasks across both AZs; the ALB load-balances and survives an AZ failure. State lives in RDS (data) and Cognito (identity).
- **Managed data tier**: RDS MySQL Multi-AZ gives synchronous Primary→Standby replication, automatic failover, and automated backups — HA and durability without self-managing a database.
- **Proactive monitoring**: ECS streams logs/metrics to CloudWatch; a CPU≥80% alarm notifies the team via SNS email.

---

## 7. Request Flows (15)

Solid = synchronous; dashed = async/monitoring; all one-way. `.1/.2` = the same flow from each AZ (ECS is active in both AZs — no primary/standby for compute).

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

> Flows 6/9/11 are **logical** arrows (what the app talks to); physically they exit via the **NAT Gateway** (flow 14 → 15). Only flow 7 (ECS→RDS) stays inside the VPC. Both 7.1 and 7.2 target the **Primary** — the Standby is passive (failover only).
