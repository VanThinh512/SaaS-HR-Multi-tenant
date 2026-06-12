"""
microservices/shared/aws_params.py
Shared SSM Parameter Store helper for all 3 FastAPI services.

Usage:
    from shared.aws_params import get_param

    db_url = get_param("/saashr/db/url/auth")

Decision #11: values are STATIC (no rotation) -> cached in RAM for process lifetime.
The cache never goes stale — no TTL needed.

Environment variable AWS_SSM_PREFIX controls whether SSM is used:
  - Set (any non-empty value) -> fetch from SSM (ECS/AWS environment)
  - Not set                   -> skip SSM; app reads from env vars / .env (local dev)
"""

import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# In-memory cache: param_name -> decrypted_value
# Static values set once at startup and never updated during process lifetime.
_cache: dict[str, str] = {}


def _get_boto3_client():
    """Lazy-import boto3 so local dev (no boto3) doesn't fail at import time."""
    try:
        import boto3  # type: ignore
        return boto3.client("ssm", region_name=os.getenv("AWS_REGION", "ap-southeast-1"))
    except ImportError:
        raise RuntimeError(
            "boto3 is not installed. Add boto3 to requirements.txt before running on AWS."
        )


def get_param(name: str, decrypt: bool = True) -> str:
    """
    Fetch a parameter from SSM Parameter Store with in-memory caching.

    Args:
        name:    Full SSM parameter path, e.g. "/saashr/db/url/auth"
        decrypt: True for SecureString parameters (default)

    Returns:
        The parameter value as a plain string.

    Raises:
        RuntimeError: if SSM_PREFIX is set but the parameter cannot be fetched.
    """
    if name in _cache:
        return _cache[name]

    client = _get_boto3_client()

    try:
        response = client.get_parameter(Name=name, WithDecryption=decrypt)
        value = response["Parameter"]["Value"]
        _cache[name] = value
        logger.info("SSM: loaded parameter %s", name)
        return value
    except Exception as exc:
        logger.error("SSM: failed to load parameter %s — %s", name, exc)
        raise RuntimeError(f"Cannot load SSM parameter '{name}': {exc}") from exc


def get_param_optional(name: str, default: Optional[str] = None) -> Optional[str]:
    """
    Same as get_param but returns `default` instead of raising on error.
    Useful for optional / transitional parameters.
    """
    try:
        return get_param(name)
    except Exception:
        return default
