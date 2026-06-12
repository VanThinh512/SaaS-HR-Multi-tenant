# ============================================================
# infra/rds.tf
# Phase 2: RDS MySQL 8.0 — db.t4g.micro, 24/7, private subnets
# No auto-stop scheduler (Decision #12)
# ============================================================

# -------------------------------------------------------
# DB Subnet Group — private subnets A + B
# -------------------------------------------------------
resource "aws_db_subnet_group" "main" {
  name        = "${var.project}-db-subnet-group"
  description = "Private subnets for RDS MySQL"
  subnet_ids  = aws_subnet.private[*].id

  tags = {
    Name = "${var.project}-db-subnet-group"
  }
}

# -------------------------------------------------------
# DB Parameter Group — utf8mb4 character set
# -------------------------------------------------------
resource "aws_db_parameter_group" "mysql8" {
  name        = "${var.project}-mysql8-params"
  family      = "mysql8.0"
  description = "SaaS HR MySQL 8.0 - utf8mb4"

  parameter {
    name  = "character_set_server"
    value = "utf8mb4"
  }

  parameter {
    name  = "character_set_client"
    value = "utf8mb4"
  }

  parameter {
    name  = "collation_server"
    value = "utf8mb4_unicode_ci"
  }

  tags = {
    Name = "${var.project}-mysql8-params"
  }
}

# -------------------------------------------------------
# RDS MySQL 8.0 — db.t4g.micro (Graviton, cost-optimised)
# Single-AZ, 20 GB gp3, 24/7 (no scheduler)
# -------------------------------------------------------
resource "aws_db_instance" "mysql" {
  identifier = "${var.project}-mysql"

  # Engine
  engine               = "mysql"
  engine_version       = "8.0"
  instance_class       = "db.t4g.micro"
  parameter_group_name = aws_db_parameter_group.mysql8.name

  # Storage
  allocated_storage     = 20
  max_allocated_storage = 0   # disable autoscaling for cost control
  storage_type          = "gp3"
  storage_encrypted     = true

  # Credentials — password comes from SSM random_password (see params.tf)
  db_name  = null             # no default DB; init.sql creates auth_db/tenant_db/hr_db
  username = "saashr_admin"
  password = random_password.db_password.result

  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # Availability
  multi_az               = false   # Single-AZ (cost saving; not prod-critical for demo)
  availability_zone      = var.availability_zones[0]

  # Backup — 7-day automated snapshots (Decision)
  backup_retention_period = 7
  backup_window           = "18:00-19:00"   # 01:00-02:00 ICT (low traffic)
  maintenance_window      = "Sun:19:00-Sun:20:00"
  copy_tags_to_snapshot   = true

  # Demo settings — flip both for real production
  deletion_protection  = false
  skip_final_snapshot  = true

  tags = {
    Name = "${var.project}-mysql"
  }

  # Depend on SSM password existing before RDS is created
  depends_on = [aws_ssm_parameter.db_password]
}
