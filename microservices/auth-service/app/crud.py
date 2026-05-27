from sqlalchemy.orm import Session
import uuid
from typing import Optional
from app.models import User, UserTenant
from app.core.security import get_password_hash, verify_password

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

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


def get_users_by_tenant(db: Session, tenant_id: str) -> list:
    """Liệt kê tất cả thành viên đang active trong một tenant."""
    return (
        db.query(UserTenant, User)
        .join(User, User.id == UserTenant.user_id)
        .filter(UserTenant.tenant_id == tenant_id, UserTenant.is_active == True)
        .all()
    )


def update_user_role_in_tenant(db: Session, target_user_id: str, tenant_id: str, new_role: str) -> Optional[UserTenant]:
    """Cập nhật vai trò của một thành viên trong tenant."""
    link = db.query(UserTenant).filter(
        UserTenant.user_id == target_user_id,
        UserTenant.tenant_id == tenant_id,
        UserTenant.is_active == True
    ).first()
    if not link:
        return None
    link.role = new_role
    db.commit()
    db.refresh(link)
    return link


def remove_user_from_tenant(db: Session, target_user_id: str, tenant_id: str) -> bool:
    """Vô hiệu hóa quyền truy cập của thành viên ra khỏi tenant (soft delete)."""
    link = db.query(UserTenant).filter(
        UserTenant.user_id == target_user_id,
        UserTenant.tenant_id == tenant_id,
        UserTenant.is_active == True
    ).first()
    if not link:
        return False
    link.is_active = False
    db.commit()
    return True


def update_user_password(db: Session, user: User, new_password_raw: str) -> User:
    """Cập nhật password sau khi đã xác thực password cũ ở tầng router."""
    user.password_hash = get_password_hash(new_password_raw)
    db.commit()
    db.refresh(user)
    return user


def invite_user_to_tenant(db: Session, email: str, tenant_id: str, role: str) -> tuple:
    """
    Thêm user đã có tài khoản vào một tenant với role chỉ định.
    Trả về (UserTenant, is_new: bool):
      - is_new=True nếu vừa tạo link mới
      - is_new=False nếu link đã tồn tại (re-activate hoặc đã active)
    """
    target_user = db.query(User).filter(User.email == email).first()
    if not target_user:
        return None, False

    existing_link = db.query(UserTenant).filter(
        UserTenant.user_id == target_user.id,
        UserTenant.tenant_id == tenant_id
    ).first()

    if existing_link:
        if existing_link.is_active:
            # Đã là thành viên active — trả về link hiện tại, không tạo mới
            return existing_link, False
        # Re-activate nếu bị remove trước đó
        existing_link.is_active = True
        existing_link.role = role
        db.commit()
        db.refresh(existing_link)
        return existing_link, True

    new_link = UserTenant(
        id=f"ut_{uuid.uuid4()}",
        user_id=target_user.id,
        tenant_id=tenant_id,
        role=role,
        is_active=True
    )
    db.add(new_link)
    db.commit()
    db.refresh(new_link)
    return new_link, True
