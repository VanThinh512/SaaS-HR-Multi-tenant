# ============================================================
# infra/variables.tf
# Biến dùng chung cho toàn bộ infra
# ============================================================

variable "environment" {
  description = "Môi trường triển khai"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region chính (Singapore)"
  type        = string
  default     = "ap-southeast-1"
}

variable "aws_region_global" {
  description = "AWS region cho tài nguyên global (CloudFront cert + WAF)"
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Tên project — dùng làm prefix cho tất cả tài nguyên"
  type        = string
  default     = "saashr"
}

variable "aws_account_id" {
  description = "AWS Account ID"
  type        = string
  default     = "016461465939"
}

# -------------------------------------------------------
# Networking
# -------------------------------------------------------
variable "vpc_cidr" {
  description = "CIDR block cho VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR cho 2 public subnets (ALB, NAT-less)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR cho 2 private subnets (ECS, RDS)"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "availability_zones" {
  description = "AZs dùng trong ap-southeast-1"
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b"]
}

# -------------------------------------------------------
# Security
# -------------------------------------------------------
variable "team_ip_allowlist" {
  description = "Danh sách IP của team — dùng cho Wazuh dashboard (port 443)"
  type        = list(string)
  default     = []   # điền IP thực trước khi apply Phase 6
}

# -------------------------------------------------------
# Domain
# -------------------------------------------------------
variable "domain_name" {
  description = "Tên miền đã đăng ký trong Route 53"
  type        = string
  default     = ""   # điền tên miền thực trước khi apply Phase 4
}
