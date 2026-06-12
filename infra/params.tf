# ============================================================
# infra/params.tf
# Phase 2: SSM Parameter Store (replaces Secrets Manager)
# Free tier, KMS-encrypted SecureString, no rotation
# Decision #11: static values cached in RAM at app startup
# ============================================================

# -------------------------------------------------------
# Generate DB password once — stored as SSM SecureString
# Terraform keeps it in state (encrypted at rest in S3)
# -------------------------------------------------------
resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}:?"   # exclude chars that break MySQL DSN
}

# -------------------------------------------------------
# SSM Parameters — all SecureString, encrypted with default KMS
# -------------------------------------------------------

# /saashr/db/password — RDS master password
resource "aws_ssm_parameter" "db_password" {
  name        = "/saashr/db/password"
  description = "RDS MySQL master password for saashr_admin"
  type        = "SecureString"
  value       = random_password.db_password.result

  tags = {
    Name = "saashr-db-password"
  }
}

# /saashr/db/url — full SQLAlchemy DSN per service
# Written after RDS is created (db endpoint known at apply time)
resource "aws_ssm_parameter" "db_url_auth" {
  name        = "/saashr/db/url/auth"
  description = "SQLAlchemy DATABASE_URL for auth-service"
  type        = "SecureString"
  value       = "mysql+pymysql://saashr_admin:${random_password.db_password.result}@${aws_db_instance.mysql.endpoint}/auth_db"

  tags = {
    Name = "saashr-db-url-auth"
  }

  depends_on = [aws_db_instance.mysql]
}

resource "aws_ssm_parameter" "db_url_tenant" {
  name        = "/saashr/db/url/tenant"
  description = "SQLAlchemy DATABASE_URL for tenant-service"
  type        = "SecureString"
  value       = "mysql+pymysql://saashr_admin:${random_password.db_password.result}@${aws_db_instance.mysql.endpoint}/tenant_db"

  tags = {
    Name = "saashr-db-url-tenant"
  }

  depends_on = [aws_db_instance.mysql]
}

resource "aws_ssm_parameter" "db_url_hr" {
  name        = "/saashr/db/url/hr"
  description = "SQLAlchemy DATABASE_URL for hr-service"
  type        = "SecureString"
  value       = "mysql+pymysql://saashr_admin:${random_password.db_password.result}@${aws_db_instance.mysql.endpoint}/hr_db"

  tags = {
    Name = "saashr-db-url-hr"
  }

  depends_on = [aws_db_instance.mysql]
}

# /saashr/jwt/private_key — RS256 private key (transitional until Cognito cutover)
# Populate with actual key via: aws ssm put-parameter --name /saashr/jwt/private_key --value "$(cat private.pem)" --type SecureString --overwrite --profile saashr
resource "aws_ssm_parameter" "jwt_private_key" {
  name        = "/saashr/jwt/private_key"
  description = "RS256 private key for JWT signing (transitional — replaced by Cognito in Phase 6)"
  type        = "SecureString"
  value       = "PLACEHOLDER — replace with actual RS256 private key PEM before deploying ECS"

  lifecycle {
    # Prevent Terraform from overwriting the key after initial creation
    # Update manually: aws ssm put-parameter --overwrite
    ignore_changes = [value]
  }

  tags = {
    Name = "saashr-jwt-private-key"
  }
}

# /saashr/jwt/public_key — RS256 public key
resource "aws_ssm_parameter" "jwt_public_key" {
  name        = "/saashr/jwt/public_key"
  description = "RS256 public key for JWT verification (transitional — replaced by Cognito JWKS in Phase 6)"
  type        = "SecureString"
  value       = "PLACEHOLDER — replace with actual RS256 public key PEM before deploying ECS"

  lifecycle {
    ignore_changes = [value]
  }

  tags = {
    Name = "saashr-jwt-public-key"
  }
}
