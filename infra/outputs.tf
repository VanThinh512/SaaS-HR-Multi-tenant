# ============================================================
# infra/outputs.tf
# Outputs quan trọng — hiển thị sau terraform apply
# Sẽ được bổ sung thêm khi các phase tiếp theo hoàn thành
# ============================================================

# -------------------------------------------------------
# Phase 1 outputs (sẽ uncomment sau khi vpc.tf apply xong)
# -------------------------------------------------------
# output "vpc_id" {
#   description = "ID của VPC"
#   value       = aws_vpc.main.id
# }
#
# output "public_subnet_ids" {
#   description = "IDs của public subnets (ALB)"
#   value       = aws_subnet.public[*].id
# }
#
# output "private_subnet_ids" {
#   description = "IDs của private subnets (ECS, RDS)"
#   value       = aws_subnet.private[*].id
# }

# -------------------------------------------------------
# Phase 2 outputs
# -------------------------------------------------------
# output "rds_endpoint" {
#   description = "RDS MySQL endpoint"
#   value       = aws_db_instance.mysql.endpoint
#   sensitive   = true
# }

# -------------------------------------------------------
# Phase 3 outputs
# -------------------------------------------------------
# output "alb_dns_name" {
#   description = "ALB DNS name — trỏ CloudFront origin vào đây"
#   value       = aws_lb.main.dns_name
# }
#
# output "ecr_auth_url" {
#   description = "ECR URL cho auth-service"
#   value       = aws_ecr_repository.auth.repository_url
# }

# -------------------------------------------------------
# Phase 4 outputs
# -------------------------------------------------------
# output "cloudfront_domain" {
#   description = "CloudFront distribution domain"
#   value       = aws_cloudfront_distribution.frontend.domain_name
# }

# -------------------------------------------------------
# Phase 5 outputs
# -------------------------------------------------------
# output "cognito_user_pool_id" {
#   description = "Cognito User Pool ID"
#   value       = aws_cognito_user_pool.main.id
# }
#
# output "cognito_app_client_id" {
#   description = "Cognito App Client ID — dùng trong frontend"
#   value       = aws_cognito_user_pool_client.frontend.id
# }
