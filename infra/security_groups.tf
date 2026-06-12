# ============================================================
# infra/security_groups.tf
# Phase 1: Security Groups — tach rules ra aws_security_group_rule
# de tranh circular dependency khi cac SG tham chieu lan nhau
#
# Traffic flow:
#   Internet -> sg_alb -> sg_ecs_fargate -> sg_rds
#   sg_ecs_fargate -> sg_wazuh (port 1514/1515)
#   Team IPs -> sg_wazuh (port 443)
# ============================================================

# -------------------------------------------------------
# Tao cac Security Group (khong co inline rules)
# -------------------------------------------------------

resource "aws_security_group" "alb" {
  name        = "${var.project}-sg-alb-gateway"
  description = "ALB: accept HTTP/HTTPS from internet, forward to ECS"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${var.project}-sg-alb-gateway"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "ecs_fargate" {
  name        = "${var.project}-sg-ecs-fargate"
  description = "ECS Fargate tasks: ingress from ALB, egress to RDS/Redis/Wazuh/internet"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${var.project}-sg-ecs-fargate"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "rds" {
  name        = "${var.project}-sg-rds-db"
  description = "RDS MySQL: ingress from ECS only, no egress"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${var.project}-sg-rds-db"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "wazuh" {
  name        = "${var.project}-sg-wazuh-soc"
  description = "Wazuh SOC: agent ingress from ECS, dashboard from team IPs only"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${var.project}-sg-wazuh-soc"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# -------------------------------------------------------
# ALB rules
# -------------------------------------------------------

resource "aws_security_group_rule" "alb_ingress_http" {
  type              = "ingress"
  description       = "HTTP from internet"
  security_group_id = aws_security_group.alb.id
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
}

resource "aws_security_group_rule" "alb_ingress_https" {
  type              = "ingress"
  description       = "HTTPS from internet"
  security_group_id = aws_security_group.alb.id
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
}

resource "aws_security_group_rule" "alb_egress_to_ecs" {
  type                     = "egress"
  description              = "Forward all to ECS Fargate tasks"
  security_group_id        = aws_security_group.alb.id
  from_port                = 0
  to_port                  = 65535
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.ecs_fargate.id
}

# -------------------------------------------------------
# ECS Fargate rules
# -------------------------------------------------------

resource "aws_security_group_rule" "ecs_ingress_from_alb_80" {
  type                     = "ingress"
  description              = "HTTP from ALB"
  security_group_id        = aws_security_group.ecs_fargate.id
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
}

resource "aws_security_group_rule" "ecs_ingress_from_alb_fastapi" {
  type                     = "ingress"
  description              = "FastAPI ports 8000-8002 from ALB"
  security_group_id        = aws_security_group.ecs_fargate.id
  from_port                = 8000
  to_port                  = 8002
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
}

resource "aws_security_group_rule" "ecs_egress_to_rds" {
  type                     = "egress"
  description              = "MySQL to RDS"
  security_group_id        = aws_security_group.ecs_fargate.id
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.rds.id
}

resource "aws_security_group_rule" "ecs_egress_redis_self" {
  type              = "egress"
  description       = "Redis pub/sub intra-SG (ECS tasks to Redis ECS task)"
  security_group_id = aws_security_group.ecs_fargate.id
  from_port         = 6379
  to_port           = 6379
  protocol          = "tcp"
  self              = true
}

resource "aws_security_group_rule" "ecs_ingress_redis_self" {
  type              = "ingress"
  description       = "Redis pub/sub intra-SG ingress"
  security_group_id = aws_security_group.ecs_fargate.id
  from_port         = 6379
  to_port           = 6379
  protocol          = "tcp"
  self              = true
}

resource "aws_security_group_rule" "ecs_egress_wazuh_1514" {
  type                     = "egress"
  description              = "Wazuh agent syslog"
  security_group_id        = aws_security_group.ecs_fargate.id
  from_port                = 1514
  to_port                  = 1514
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.wazuh.id
}

resource "aws_security_group_rule" "ecs_egress_wazuh_1515" {
  type                     = "egress"
  description              = "Wazuh agent comms"
  security_group_id        = aws_security_group.ecs_fargate.id
  from_port                = 1515
  to_port                  = 1515
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.wazuh.id
}

resource "aws_security_group_rule" "ecs_egress_https" {
  type              = "egress"
  description       = "HTTPS to internet (ECR, Secrets Manager, SSM, Cognito)"
  security_group_id = aws_security_group.ecs_fargate.id
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
}

# -------------------------------------------------------
# RDS rules
# -------------------------------------------------------

resource "aws_security_group_rule" "rds_ingress_from_ecs" {
  type                     = "ingress"
  description              = "MySQL from ECS Fargate tasks"
  security_group_id        = aws_security_group.rds.id
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.ecs_fargate.id
}
# Khong co egress rule -> RDS bi co lap hoan toan

# -------------------------------------------------------
# Wazuh SOC rules
# -------------------------------------------------------

resource "aws_security_group_rule" "wazuh_ingress_1514" {
  type                     = "ingress"
  description              = "Wazuh syslog from ECS agents"
  security_group_id        = aws_security_group.wazuh.id
  from_port                = 1514
  to_port                  = 1514
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.ecs_fargate.id
}

resource "aws_security_group_rule" "wazuh_ingress_1515" {
  type                     = "ingress"
  description              = "Wazuh agent registration from ECS"
  security_group_id        = aws_security_group.wazuh.id
  from_port                = 1515
  to_port                  = 1515
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.ecs_fargate.id
}

# Dashboard HTTPS - chi mo khi team_ip_allowlist khong rong
resource "aws_security_group_rule" "wazuh_ingress_dashboard" {
  count = length(var.team_ip_allowlist) > 0 ? 1 : 0

  type              = "ingress"
  description       = "Wazuh dashboard HTTPS from team IPs only"
  security_group_id = aws_security_group.wazuh.id
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = var.team_ip_allowlist
}

resource "aws_security_group_rule" "wazuh_egress_https" {
  type              = "egress"
  description       = "HTTPS outbound for Wazuh updates"
  security_group_id = aws_security_group.wazuh.id
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
}
