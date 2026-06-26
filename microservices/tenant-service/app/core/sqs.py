import json
import logging
import boto3
from app.core.config import settings

logger = logging.getLogger(__name__)

_sqs_client = None


def _get_sqs():
    # Lazy singleton — credentials come from the ECS task role at runtime.
    global _sqs_client
    if _sqs_client is None:
        _sqs_client = boto3.client("sqs", region_name=settings.AWS_REGION)
    return _sqs_client


def publish_tenant_status_event(tenant_id: str, new_status: str):
    """Send a tenant.status.changed event to SQS for hr-service to consume."""
    if not settings.SQS_QUEUE_URL:
        logger.warning("SQS_QUEUE_URL not set — skipping event publish (local dev?).")
        return
    try:
        message = {
            "event": "tenant.status.changed",
            "tenant_id": tenant_id,
            "status": new_status,
        }
        _get_sqs().send_message(
            QueueUrl=settings.SQS_QUEUE_URL,
            MessageBody=json.dumps(message),
        )
        logger.info(f"Published status change event to SQS for tenant {tenant_id}: {new_status}")
    except Exception as e:
        logger.error(f"Failed to publish status change event to SQS: {str(e)}")
