import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://root:strongpassword123@localhost:3306/tenant_db")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "RS256")
    JWT_PUBLIC_KEY: str = os.getenv("JWT_PUBLIC_KEY", "")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
