import os
from pydantic_settings import BaseSettings


def _from_ssm_or_env(ssm_path: str, env_key: str, default: str = "") -> str:
    """
    If AWS_SSM_PREFIX is set, fetch value from SSM Parameter Store.
    Otherwise fall back to environment variable (local dev / docker-compose).
    """
    if os.getenv("AWS_SSM_PREFIX"):
        try:
            from shared.aws_params import get_param
            return get_param(ssm_path)
        except Exception:
            pass  # fall through to env var on error
    return os.getenv(env_key, default)


class Settings(BaseSettings):
    DATABASE_URL: str = _from_ssm_or_env(
        "/saashr/db/url/auth",
        "DATABASE_URL",
        "mysql+pymysql://root:strongpassword123@localhost:3306/auth_db",
    )
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "RS256")
    JWT_PRIVATE_KEY: str = _from_ssm_or_env(
        "/saashr/jwt/private_key",
        "JWT_PRIVATE_KEY",
        "",
    )
    JWT_PUBLIC_KEY: str = _from_ssm_or_env(
        "/saashr/jwt/public_key",
        "JWT_PUBLIC_KEY",
        "",
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
