import logging
from contextvars import ContextVar

# Context variable to hold the correlation ID for the current request context
correlation_id_ctx: ContextVar[str] = ContextVar("correlation_id", default="system")

class CorrelationIdFilter(logging.Filter):
    def filter(self, record):
        record.correlation_id = correlation_id_ctx.get()
        return True

def setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    # Remove default handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)

    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [TraceID: %(correlation_id)s] [%(name)s]: %(message)s"
    )
    handler.setFormatter(formatter)
    handler.addFilter(CorrelationIdFilter())
    logger.addHandler(handler)
