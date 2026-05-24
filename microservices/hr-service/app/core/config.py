import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://root:strongpassword123@localhost:3306/hr_db")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "RS256")
    JWT_PUBLIC_KEY: str = os.getenv("JWT_PUBLIC_KEY", "")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
