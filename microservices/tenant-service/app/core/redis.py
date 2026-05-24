import redis
import json
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize connection pool
redis_pool = redis.ConnectionPool.from_url(settings.REDIS_URL, decode_responses=True)

def get_redis_client():
    return redis.Redis(connection_pool=redis_pool)

def publish_tenant_status_event(tenant_id: str, status: str):
    try:
        r = get_redis_client()
        event_payload = {
            "tenant_id": tenant_id,
            "status": status
        }
        # Publish event on 'tenant.status.changed' channel
        r.publish("tenant.status.changed", json.dumps(event_payload))
        logger.info(f"Published status change event to Redis for tenant {tenant_id}: {status}")
    except Exception as e:
        logger.error(f"Failed to publish status change event to Redis: {str(e)}")
