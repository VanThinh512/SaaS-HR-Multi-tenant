# scripts/ — Manual Deployment Scripts (No CI/CD)

> Tất cả deploy đều **manual / script-based** theo thiết kế (không dùng GitHub Actions / CodePipeline).  
> Chạy từ laptop đã xác thực: `aws sso login --profile saashr`

---

## 🚀 Onboarding — Lần đầu setup (mỗi developer)

### Điều kiện: Admin phải thêm bạn vào IAM Identity Center trước
> Dev A (Admin) vào **AWS Console → IAM Identity Center → Users → Add user**, tạo tài khoản với email của Dev B.  
> Dev B sẽ nhận email mời, đặt mật khẩu SSO của mình.

### Bước duy nhất — Chạy setup script
Sau khi clone repo từ GitHub:

```powershell
.\scripts\setup_aws_sso.ps1
```

Script sẽ tự động:
1. ✅ Tải & cài **AWS CLI v2** (nếu chưa có)
2. ✅ Ghi profile `saashr` vào `~/.aws/config` (SSO URL + Account ID đã được pre-fill sẵn)
3. ✅ Mở browser để login SSO → xác nhận mã hiển thị
4. ✅ Verify identity (`aws sts get-caller-identity`)

> **Không cần nhập URL hay Account ID** — đã được cấu hình sẵn trong script.

---

## 🔄 Daily — Refresh Credentials (mỗi sáng)

Short-lived credentials hết hạn sau **8 giờ**. Chạy khi bắt đầu làm việc:

```powershell
aws sso login --profile saashr
# Hoặc dùng script tiện lợi hơn:
.\scripts\sso_login.ps1
```

Verify nhanh:
```powershell
aws sts get-caller-identity --profile saashr
```

---

## 📋 Tất cả Deployment Scripts

| Script | Loại | Mục đích | Khi nào chạy |
|:--|:--|:--|:--|
| `setup_aws_sso.ps1` | `.ps1` Windows | Cài AWS CLI + cấu hình SSO (one-time) | Lần đầu setup máy |
| `sso_login.ps1` | `.ps1` Windows | Refresh SSO credentials (daily) | Mỗi sáng / khi hết hạn |
| `push_ecr.sh` | `.sh` WSL/Git Bash | Build + tag + push images, force ECS redeploy | Sau mỗi thay đổi code |
| `deploy_frontend.sh` | `.sh` WSL/Git Bash | Build React + S3 sync + CloudFront invalidation | Sau mỗi thay đổi frontend |
| `rds_init.sh` | `.sh` WSL/Git Bash | Bootstrap RDS schemas via SSM (one-time) | Sau khi RDS được tạo |
| `migrate_users_cognito.sh` | `.sh` WSL/Git Bash | Import seed users vào Cognito User Pool (one-time) | Phase 5 — sau khi Cognito tạo xong |

---

## 🔐 ~/.aws/config — Profile `saashr` (tham khảo)

File này **KHÔNG được commit lên GitHub** (đã có trong `.gitignore`).  
Script `setup_aws_sso.ps1` sẽ tạo file này tự động cho mỗi developer.

```ini
[profile saashr]
sso_start_url  = https://d-9667aa1ea5.awsapps.com/start
sso_region     = ap-southeast-1
sso_account_id = 016461465939
sso_role_name  = AdminAccess
region         = ap-southeast-1
output         = json
```

Set default profile cho session PowerShell hiện tại:
```powershell
$env:AWS_PROFILE = "saashr"
```

---

## 🏗️ Terraform — Workflow chuẩn

```bash
cd infra/
terraform init          # lần đầu hoặc sau khi thêm provider/module
terraform plan          # luôn plan trước khi apply
terraform apply         # apply sau khi review plan
```

> **Quy tắc 2 devs**: Luôn `terraform plan` trước, **thông báo cho nhau** trước khi `apply`.  
> Native S3 lockfile (`use_lockfile = true`) ngăn 2 `apply` đồng thời làm hỏng state.
