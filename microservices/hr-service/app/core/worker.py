import redis
import json
import threading
import time
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

def start_redis_listener():
    def listen():
        while True:
            try:
                r = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
                pubsub = r.pubsub()
                pubsub.subscribe("tenant.status.changed")
                logger.info("Background worker successfully subscribed to Redis channel: tenant.status.changed")
                for message in pubsub.listen():
                    if message["type"] == "message":
                        data = json.loads(message["data"])
                        tenant_id = data.get("tenant_id")
                        status = data.get("status")
                        logger.info(f"Background worker processed event -> Tenant ID: {tenant_id} changed to status: {status}")
                        # Enforce dynamic behavior: suspend/unsuspend cache, or flag database contexts.
            except Exception as e:
                logger.error(f"Redis listener connection lost: {str(e)}. Reconnecting in 5 seconds...")
                time.sleep(5)

    thread = threading.Thread(target=listen, daemon=True)
    thread.start()
