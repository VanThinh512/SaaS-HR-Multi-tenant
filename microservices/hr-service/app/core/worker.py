import json
import threading
import time
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


def start_sqs_consumer():
    """Background worker: long-poll SQS for tenant.status.changed events."""
    def consume():
        if not settings.SQS_QUEUE_URL:
            logger.warning("SQS_QUEUE_URL not set — SQS consumer disabled (local dev?).")
            return
        logger.info("Background worker started: polling SQS for tenant.status.changed events")
        while True:
            try:
                sqs = _get_sqs()
                resp = sqs.receive_message(
                    QueueUrl=settings.SQS_QUEUE_URL,
                    MaxNumberOfMessages=10,
                    WaitTimeSeconds=20,  # long polling — cheap, no busy loop
                )
                for msg in resp.get("Messages", []):
                    try:
                        data = json.loads(msg["Body"])
                        tenant_id = data.get("tenant_id")
                        status = data.get("status")
                        logger.info(
                            f"Background worker processed event -> Tenant ID: {tenant_id} changed to status: {status}"
                        )
                        # Enforce dynamic behavior: suspend/unsuspend cache, flag DB contexts, etc.

                        # Delete only AFTER successful processing, so failures are retried / go to the DLQ.
                        sqs.delete_message(
                            QueueUrl=settings.SQS_QUEUE_URL,
                            ReceiptHandle=msg["ReceiptHandle"],
                        )
                    except Exception as e:
                        logger.error(f"Failed to process SQS message (left for retry/DLQ): {str(e)}")
            except Exception as e:
                logger.error(f"SQS consumer connection error: {str(e)}. Retrying in 5 seconds...")
                time.sleep(5)

    thread = threading.Thread(target=consume, daemon=True)
    thread.start()
