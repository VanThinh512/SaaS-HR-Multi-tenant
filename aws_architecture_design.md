# AWS Architecture Design & Extreme FinOps Optimization Plan
**Project**: SaaS HR Multi-Tenant (FastAPI + ReactJS + Nginx Gateway)  
**Budget Target**: $100 - $120 / Month (Targeting < $70 / Month)  
**Security Requirements**: Zero-Trust Network, AWS WAF, Wazuh SIEM/SOC, Cognito Integration  
**Architect**: AWS Cloud Architect & FinOps Expert Team  

---

## 1. System Architecture Diagram
The following architecture leverages Amazon CloudFront for edge delivery, AWS WAF for application protection, an Application Load Balancer (ALB) for request routing, ECS Fargate Spot for container orchestration, RDS for managed database services, and a dedicated EC2 instance for the Wazuh SOC Manager.

![SaaS HR Multi-Tenant AWS Architecture Diagram](aws_architecture_diagram.png)

### Architecture Components Summary

| Layer | AWS Service | Role | Subnet/Zone |
|:------|:-----------|:-----|:------------|
| **DNS** | Amazon Route 53 | Domain name resolution → CloudFront | Global (Edge) |
| **CDN & Security** | Amazon CloudFront + AWS WAF | Edge caching, DDoS protection, Web ACL filtering | Global (Edge) |
| **Static Hosting** | Amazon S3 | Serve React frontend build artifacts | Global |
| **Identity** | AWS Cognito (User Pools) | User authentication, JWT token management | Regional |
| **Load Balancing** | Application Load Balancer (ALB) | Path-based routing `/api/v1/*` to ECS target groups | Public Subnet (Multi-AZ) |
| **Compute** | Amazon ECS Fargate Spot (4 Tasks) | Nginx Gateway + 3 FastAPI microservices | Public Subnet (Multi-AZ) |
| **Database** | Amazon RDS MySQL (db.t4g.micro) | Single instance hosting `auth_db`, `tenant_db`, `hr_db` | Private Subnet (Multi-AZ) |
| **SIEM/SOC** | EC2 t3.small (Wazuh Manager) | Centralized security monitoring & log analysis | Public Subnet (SOC VPC) |

---

## 2. Monthly Cost Estimation (FinOps Spreadsheet)
This calculation shows the contrast between standard AWS deployments and our **Extreme FinOps Optimized** configuration. Prices are estimated for `us-east-1` (N. Virginia).

| AWS Service | Unit Config Detail | Standard Cost (24/7, No Spot) | FinOps Optimized Cost | Cost Optimization Strategy |
| :--- | :--- | :---: | :---: | :--- |
| **AWS WAF** | 1 Web ACL, 3 Managed Rules (Core, SQLi, IP Rep) | $8.60 | **$8.60** | Attached to CloudFront to protect edge and ALB. |
| **CloudFront & S3** | 100 GB Data Transfer Out, S3 Storage (React App) | $9.50 | **$0.50** | S3 Static Hosting, CloudFront Free Tier (1TB free/mo). |
| **AWS ALB** | 1 Load Balancer, 1 LCU | $22.27 | **$22.27** | Essential for routing and path-based target groups. |
| **ECS Fargate** | 4 Tasks (0.25 vCPU, 0.5 GB RAM each) | $32.40 | **$9.72** | **Fargate Spot** (saves 70% compared to On-Demand). |
| **RDS MySQL** | 1 db.t4g.micro Instance (2 vCPU, 1GB RAM) + 20GB gp3 | $13.98 | **$5.70** | **Auto-Stop Scheduler** (running 10h/day, Mon-Fri). |
| **EC2 (Wazuh)** | 1 t3.small Instance (2 vCPU, 2GB RAM) + 30GB gp3 | $17.58 | **$6.20** | **Spot EC2 Instance** + Auto-Stop outside testing. |
| **AWS Cognito** | Cognito User Pools (Auth & Registration) | $0.00 | **$0.00** | **Free Tier** covers up to 50,000 Monthly Active Users. |
| **NAT Gateway** | 1 NAT Gateway (Standard VPC requirement) | $32.85 | **$0.00** | **NAT-Less VPC Design** (ECS tasks run in public subnets). |
| **Data Transfer/CloudWatch** | Logs, Inter-AZ bandwidth | $10.00 | **$3.00** | Log rotation & retention set to 7 days. |
| **Total / Month** | | **$147.18** | **$56.99** | **Total savings: ~61% ($90.19 saved/mo)** |

> [!NOTE]  
> The **$56.99/month** total is well below your **$100-$120** budget ceiling. This provides your team with a $40-$60 buffer for traffic spikes, database growth, or additional testing instances.

---

## 3. Core FinOps Cost-Killing Strategies

### Strategy 1: Fargate Spot for Container Workloads (70% Savings)
*   **Action**: Configure the ECS Service to use `FARGATE_SPOT` instead of `FARGATE` for task placement.
*   **Rationale**: Fargate Spot utilizes spare AWS capacity at a 70% discount. Because your microservice backend is stateless (state is saved in RDS), a task interruption (notified 2 minutes in advance) is seamlessly handled by ECS spinning up a replacement task on another spot node without breaking application uptime.

### Strategy 2: RDS & Wazuh Auto-Scheduling (60% Savings)
*   **Action**: Deploy an AWS Systems Manager (SSM) automation or a simple Lambda function to automatically stop the RDS MySQL instance and the EC2 Wazuh Manager at 8:00 PM and start them at 8:00 AM (Monday to Friday), keeping them off on weekends.
*   **Rationale**: Development and university testing happen during waking hours. Turning these instances off overnight and on weekends reduces billing time from 730 hours to ~200 hours per month.

### Strategy 3: The "NAT-Less" VPC Architecture (Saves $32.85/mo)
*   **Action**: Run ECS Fargate tasks in **Public Subnets** but assign them a Security Group that blocks all direct internet ingress. The tasks use the Internet Gateway for outbound connectivity (to download Python dependencies, talk to Cognito, ECR, etc.) for free, bypassing the need for a dedicated AWS NAT Gateway ($32.85/month).
*   **Rationale**: A NAT Gateway charges $0.045/hour just to exist. Eliminating it is the single biggest architectural cost-saver for small teams on AWS. Zero-trust security is maintained strictly via Security Group rules.

### Strategy 4: Consolidated Multi-Tenant Database
*   **Action**: Use a single `db.t4g.micro` RDS instance but initialize three distinct databases inside it (`auth_db`, `tenant_db`, and `hr_db`).
*   **Rationale**: Avoid deploying separate RDS instances for each microservice. A single `db.t4g.micro` has enough CPU/RAM for testing and small workloads, and separating data logically inside one MySQL cluster preserves the microservice database pattern without the 3x instance costs.

---

## 4. VPC Network Subnet Design
To maintain high availability and security, we segment the VPC (`10.0.0.0/16`) across two Availability Zones (AZ-A and AZ-B):

```
VPC CIDR Block: 10.0.0.0/16
├── Availability Zone A (us-east-1a)
│   ├── Public Subnet A  (10.0.1.0/24)  --> Host ALB, ECS Tasks (AZ-A), Wazuh EC2
│   └── Private Subnet A (10.0.11.0/24) --> Host RDS Primary Instance
└── Availability Zone B (us-east-1b)
    ├── Public Subnet B  (10.0.2.0/24)  --> Host ALB, ECS Tasks (AZ-B)
    └── Private Subnet B (10.0.12.0/24) --> Host RDS Standby (Optional/Disabled for Cost)
```

*   **Public Subnets (10.0.1.0/24 & 10.0.2.0/24)**:
    *   **ALB**: Must live in the public subnets to receive traffic from CloudFront.
    *   **ECS Fargate Tasks**: Deployed here to utilize the Internet Gateway for direct, free outbound calls (avoiding NAT Gateway costs).
    *   **EC2 Wazuh Manager**: Deployed in Public Subnet A.
*   **Private Subnets (10.0.11.0/24 & 10.0.12.0/24)**:
    *   **RDS MySQL**: Kept strictly private. No internet traffic can ever reach these subnets. Databases communicate only with the private IP addresses of the Fargate tasks in the public subnets.

---

## 5. Security Groups: Zero-Trust Network Rules
Traffic is strictly controlled using Stateful Security Groups (SGs). No component accepts connections unless explicitly required.

```
       [ Internet / CloudFront ]
                  │ (HTTPS)
                  ▼
         [ sg-alb-gateway ]
                  │ (Port 80/443 ONLY)
                  ▼
         [ sg-ecs-fargate ]
           │              │
           │ (Port 3306)  │ (Port 1514/1515)
           ▼              ▼
     [ sg-rds-db ]   [ sg-wazuh-soc ]
```

### 1. ALB Security Group (`sg-alb-gateway`)
*   **Ingress (Inbound)**:
    *   Allow TCP Port `443` and `80` from `Anywhere (0.0.0.0/0)` (Or restrict to CloudFront IP ranges using AWS managed prefix lists for extreme protection).
*   **Egress (Outbound)**:
    *   Allow TCP Port `80/443` to `sg-ecs-fargate` (private IP scope of ECS tasks).

### 2. ECS Fargate Security Group (`sg-ecs-fargate`)
*   **Ingress (Inbound)**:
    *   Allow TCP Port `80` (or target container ports) ONLY from source `sg-alb-gateway`. *This blocks anyone on the internet from connecting directly to the containers, even though they have public IPs.*
*   **Egress (Outbound)**:
    *   Allow TCP Port `3306` to `sg-rds-db`.
    *   Allow TCP Ports `1514` (Wazuh Agent registration) and `1515` (Wazuh Agent keepalive/logs) to `sg-wazuh-soc`.
    *   Allow TCP Port `443` to `Anywhere (0.0.0.0/0)` (to download packages, fetch ECR, and connect to AWS Cognito).

### 3. RDS Security Group (`sg-rds-db`)
*   **Ingress (Inbound)**:
    *   Allow TCP Port `3306` (MySQL) ONLY from source `sg-ecs-fargate`. *Direct database access from the internet or other resources is physically impossible.*
*   **Egress (Outbound)**:
    *   Deny all outbound traffic (database has no reason to connect out to the internet).

### 4. Wazuh SOC Security Group (`sg-wazuh-soc`)
*   **Ingress (Inbound)**:
    *   Allow TCP Ports `1514` and `1515` from `sg-ecs-fargate` (Wazuh Agents inside FastAPI/Nginx).
    *   Allow TCP Port `443` (Wazuh Dashboard UI) ONLY from your team's specific static IP addresses.
*   **Egress (Outbound)**:
    *   Allow TCP Port `443` to `Anywhere` (for Wazuh updates/rulesets).

---

## 6. How this Highlights Microservices & AWS Synergy
*   **Stateless Scaling**: By segregating states into Cognito (Auth) and RDS (Data), backend Fargate containers can be scale-tested, destroyed, and restarted instantly across different AZs using cheap Spot capacity.
*   **Dynamic Routing at the Edge**: CloudFront and ALB act as the routing gateway. Front-end React pages are served directly from an S3 bucket at the Edge, while API calls `/api/v1/auth`, `/api/v1/tenants`, and `/api/v1/hr` are dynamically routed to the appropriate backend target groups on ECS.
*   **SOC Auditing**: Wazuh agents embedded in the Fargate tasks stream security telemetry logs (failed logins, container modifications, SQL queries) to the EC2 Wazuh Manager in real time, demonstrating enterprise compliance (SOC2/ISO27001 readiness) under a bootstrapping budget.
