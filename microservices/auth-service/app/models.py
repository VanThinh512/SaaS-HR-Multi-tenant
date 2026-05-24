from sqlalchemy import Column, String, Enum, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    status = Column(Enum("active", "inactive"), default="active")
    
    tenants = relationship("UserTenant", back_populates="user", cascade="all, delete-orphan")

class UserTenant(Base):
    __tablename__ = "user_tenants"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(String(36), nullable=False) # Logical reference to tenants table in tenant_db
    role = Column(Enum("owner", "admin", "employee"), default="employee")
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="tenants")
