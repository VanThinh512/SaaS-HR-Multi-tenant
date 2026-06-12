#!/usr/bin/env bash
# ============================================================
# scripts/rds_init.sh
# One-time: bootstrap RDS schemas via SSM Session Manager port forwarding
# No public bastion needed — tunnels through an EC2 with SSM agent
#
# Prerequisites:
#   1. aws sso login --profile saashr
#   2. An EC2 instance in the same VPC with SSM agent (e.g. Wazuh EC2 from Phase 6,
#      or a temporary t3.nano for this one-time task)
#   3. mysql client installed locally
#   4. session-manager-plugin installed:
#      https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html
#
# Usage:
#   ./scripts/rds_init.sh <ec2-instance-id> [local-port]
#   ./scripts/rds_init.sh i-0123456789abcdef0
#   ./scripts/rds_init.sh i-0123456789abcdef0 13306
# ============================================================

set -euo pipefail

PROFILE="${AWS_PROFILE:-saashr}"
REGION="${AWS_REGION:-ap-southeast-1}"
EC2_INSTANCE_ID="${1:-}"
LOCAL_PORT="${2:-13306}"   # use 13306 to avoid conflict with local MySQL
SQL_FILE="$(dirname "$0")/../database/init.sql"

# -------------------------------------------------------
# Validate inputs
# -------------------------------------------------------
if [[ -z "$EC2_INSTANCE_ID" ]]; then
  echo "ERROR: EC2 instance ID is required."
  echo "Usage: $0 <ec2-instance-id> [local-port]"
  echo ""
  echo "Find your EC2 instance ID:"
  echo "  aws ec2 describe-instances --filters Name=tag:Name,Values=saashr-wazuh \\"
  echo "    --query 'Reservations[0].Instances[0].InstanceId' \\"
  echo "    --output text --profile $PROFILE"
  exit 1
fi

if [[ ! -f "$SQL_FILE" ]]; then
  echo "ERROR: init.sql not found at: $SQL_FILE"
  exit 1
fi

# -------------------------------------------------------
# Fetch RDS endpoint and credentials from SSM
# -------------------------------------------------------
echo "==> Fetching RDS endpoint from SSM..."
RDS_ENDPOINT=$(aws ssm get-parameter \
  --name "/saashr/db/url/auth" \
  --with-decryption \
  --query "Parameter.Value" \
  --output text \
  --profile "$PROFILE" \
  --region "$REGION" | sed 's|mysql+pymysql://[^:]*:[^@]*@||' | cut -d'/' -f1)

RDS_HOST=$(echo "$RDS_ENDPOINT" | cut -d':' -f1)
RDS_PORT=$(echo "$RDS_ENDPOINT" | cut -d':' -f2)
RDS_PORT="${RDS_PORT:-3306}"

DB_PASSWORD=$(aws ssm get-parameter \
  --name "/saashr/db/password" \
  --with-decryption \
  --query "Parameter.Value" \
  --output text \
  --profile "$PROFILE" \
  --region "$REGION")

echo "    RDS Host : $RDS_HOST"
echo "    RDS Port : $RDS_PORT"
echo "    Tunnel   : localhost:$LOCAL_PORT -> $RDS_HOST:$RDS_PORT via $EC2_INSTANCE_ID"

# -------------------------------------------------------
# Open SSM port-forwarding tunnel in background
# -------------------------------------------------------
echo ""
echo "==> Opening SSM tunnel (background)..."
aws ssm start-session \
  --target "$EC2_INSTANCE_ID" \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters "{\"host\":[\"$RDS_HOST\"],\"portNumber\":[\"$RDS_PORT\"],\"localPortNumber\":[\"$LOCAL_PORT\"]}" \
  --profile "$PROFILE" \
  --region "$REGION" &

SSM_PID=$!

# Wait for tunnel to be ready
echo "    Waiting for tunnel to establish..."
sleep 5

# Ensure tunnel is killed on exit
trap 'echo "Closing SSM tunnel..."; kill $SSM_PID 2>/dev/null || true' EXIT

# -------------------------------------------------------
# Run init.sql against RDS through the tunnel
# -------------------------------------------------------
echo ""
echo "==> Running database/init.sql through tunnel..."
mysql \
  --host="127.0.0.1" \
  --port="$LOCAL_PORT" \
  --user="saashr_admin" \
  --password="$DB_PASSWORD" \
  --protocol=TCP \
  < "$SQL_FILE"

echo ""
echo "==> init.sql executed successfully!"
echo ""
echo "    Databases created: auth_db, tenant_db, hr_db"
echo "    Seed data inserted."
echo ""
echo "    Verify:"
echo "    mysql -h 127.0.0.1 -P $LOCAL_PORT -u saashr_admin -p\$DB_PASSWORD -e 'SHOW DATABASES;'"
