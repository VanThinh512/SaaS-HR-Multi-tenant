import os
from pydantic_settings import BaseSettings


def _from_ssm_or_env(ssm_path: str, env_key: str, default: str = "") -> str:
    if os.getenv("AWS_SSM_PREFIX"):
        try:
            from shared.aws_params import get_param
            return get_param(ssm_path)
        except Exception:
            pass
    return os.getenv(env_key, default)


class Settings(BaseSettings):
    DATABASE_URL: str = _from_ssm_or_env(
        "/saashr/db/url/hr",
        "DATABASE_URL",
        "mysql+pymysql://root:strongpassword123@localhost:3306/hr_db",
    )
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "RS256")
    JWT_PUBLIC_KEY: str = _from_ssm_or_env(
        "/saashr/jwt/public_key",
        "JWT_PUBLIC_KEY",
        "",
    )
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
