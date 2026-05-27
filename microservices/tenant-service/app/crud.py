from sqlalchemy.orm import Session
import uuid
from typing import Optional, List
from app.models import Tenant

def get_tenant_by_id(db: Session, id: str) -> Optional[Tenant]:
    return db.query(Tenant).filter(Tenant.id == id).first()

def get_all_tenants(db: Session, skip: int = 0, limit: int = 100) -> List[Tenant]:
    return db.query(Tenant).order_by(Tenant.created_at.desc()).offset(skip).limit(limit).all()

def get_tenant_by_subdomain(db: Session, subdomain: str) -> Optional[Tenant]:
    return db.query(Tenant).filter(Tenant.subdomain == subdomain).first()

def create_tenant(db: Session, name: str, subdomain: str, plan_tier: str) -> Tenant:
    db_tenant = Tenant(
        id=f"tenant_{uuid.uuid4()}",
        name=name,
        subdomain=subdomain,
        plan_tier=plan_tier,
        status="active"
    )
    db.add(db_tenant)
    db.commit()
    db.refresh(db_tenant)
    return db_tenant

def update_tenant(db: Session, tenant: Tenant, status: Optional[str] = None, plan_tier: Optional[str] = None) -> Tenant:
    if status:
        tenant.status = status
    if plan_tier:
        tenant.plan_tier = plan_tier
    db.commit()
    db.refresh(tenant)
    return tenant


def update_tenant_self(db: Session, tenant: Tenant, name: Optional[str] = None) -> Tenant:
    """Cho phép owner tự cập nhật tên doanh nghiệp."""
    if name:
        tenant.name = name
    db.commit()
    db.refresh(tenant)
    return tenant


def delete_tenant(db: Session, tenant_id: str) -> bool:
    """Xóa hoàn toàn tenant khỏi hệ thống (hard delete). Dùng cho platform admin."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        return False
    db.delete(tenant)
    db.commit()
    return True
