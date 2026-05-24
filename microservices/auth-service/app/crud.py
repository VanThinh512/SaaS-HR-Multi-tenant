from sqlalchemy.orm import Session
import uuid
from typing import Optional
from app.models import User, UserTenant
from app.core.security import get_password_hash, verify_password

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, email: str, password_raw: str) -> User:
    hashed_pwd = get_password_hash(password_raw)
    db_user = User(
        id=f"usr_{uuid.uuid4()}",
        email=email,
        password_hash=hashed_pwd,
        status="active"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def link_user_to_tenant(db: Session, user_id: str, tenant_id: str, role: str) -> UserTenant:
    db_link = UserTenant(
        id=f"ut_{uuid.uuid4()}",
        user_id=user_id,
        tenant_id=tenant_id,
        role=role,
        is_active=True
    )
    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    return db_link

def get_user_tenant_link(db: Session, user_id: str, tenant_id: str) -> Optional[UserTenant]:
    return db.query(UserTenant).filter(
        UserTenant.user_id == user_id,
        UserTenant.tenant_id == tenant_id
    ).first()
