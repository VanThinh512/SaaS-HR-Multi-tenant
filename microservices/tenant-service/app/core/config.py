import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://root:strongpassword123@localhost:3306/tenant_db")
    AWS_REGION: str = os.getenv("AWS_REGION", "ap-southeast-1")
    SQS_QUEUE_URL: str = os.getenv("SQS_QUEUE_URL", "")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "RS256")
    JWT_PUBLIC_KEY: str = os.getenv("JWT_PUBLIC_KEY", "")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
