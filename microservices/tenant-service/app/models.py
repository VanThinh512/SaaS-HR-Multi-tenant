from sqlalchemy import Column, String, Enum, DateTime, func
from app.database import Base

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String(36), primary_key=True)
    name = Column(String(100), nullable=False)
    subdomain = Column(String(50), unique=True, nullable=False)
    status = Column(Enum("active", "suspended", "trial_expired"), default="active")
    plan_tier = Column(Enum("basic", "pro", "enterprise"), default="basic")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
