# ============================================================
# infra/providers.tf
# Terraform providers + S3 remote backend
# Chạy: terraform init (sau khi infra/bootstrap/main.tf đã apply xong)
# ============================================================

terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  # Remote state: S3 bucket tạo bởi infra/bootstrap/main.tf
  # use_lockfile = true -> native S3 locking (Terraform >= 1.10), không cần DynamoDB
  backend "s3" {
    bucket       = "saashr-tfstate-016461465939"
    key          = "global/saashr.tfstate"
    region       = "ap-southeast-1"
    encrypt      = true
    use_lockfile = true   # native S3 state locking — no DynamoDB needed
    profile      = "saashr"
  }
}

# -------------------------------------------------------
# Provider mặc định — Singapore (ap-southeast-1)
# Dùng cho ~95% tài nguyên: VPC, ECS, RDS, ALB, ECR, ...
# -------------------------------------------------------
provider "aws" {
  region  = "ap-southeast-1"
  profile = "saashr"

  default_tags {
    tags = {
      Project     = "saashr"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# -------------------------------------------------------
# Provider alias — N. Virginia (us-east-1)
# CHỈ dùng cho 2 tài nguyên global:
#   1. ACM certificate cho CloudFront viewer domain
#   2. WAF Web ACL scope=CLOUDFRONT
# Hai tài nguyên này chạy ở edge gần Việt Nam;
# us-east-1 chỉ là nơi control-plane của chúng.
# -------------------------------------------------------
provider "aws" {
  alias   = "us_east_1"
  region  = "us-east-1"
  profile = "saashr"

  default_tags {
    tags = {
      Project     = "saashr"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
