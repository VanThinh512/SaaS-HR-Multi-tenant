# ============================================================
# infra/bootstrap/main.tf
# One-time: tạo S3 bucket lưu Terraform remote state
# Chạy một lần bằng tay: cd infra/bootstrap && terraform init && terraform apply
# Bucket này KHÔNG thể tự lưu state của chính nó -> dùng local state
# ============================================================

terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  # Không dùng backend S3 ở đây — bucket này chính là nơi lưu state
  # Local state (terraform.tfstate) cho bootstrap là chấp nhận được
}

provider "aws" {
  region  = "ap-southeast-1"
  profile = "saashr"
}

# -------------------------------------------------------
# S3 Bucket — lưu Terraform state cho toàn bộ infra/
# -------------------------------------------------------
resource "aws_s3_bucket" "tfstate" {
  bucket = "saashr-tfstate-016461465939"

  tags = {
    Project     = "saashr"
    ManagedBy   = "terraform-bootstrap"
    Description = "Terraform remote state - DO NOT DELETE"
  }
}

# Bật versioning — lưu lịch sử state, rollback được nếu state bị hỏng
resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Bật mã hóa AES-256 — bắt buộc vì state chứa thông tin nhạy cảm
resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Chặn toàn bộ public access — state KHÔNG được public
resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# -------------------------------------------------------
# Outputs
# -------------------------------------------------------
output "tfstate_bucket_name" {
  description = "Tên S3 bucket lưu Terraform state — dùng trong infra/providers.tf"
  value       = aws_s3_bucket.tfstate.bucket
}

output "tfstate_bucket_arn" {
  description = "ARN của S3 bucket"
  value       = aws_s3_bucket.tfstate.arn
}
