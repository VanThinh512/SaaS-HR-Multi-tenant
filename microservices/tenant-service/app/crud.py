from sqlalchemy.orm import Session
import uuid
from typing import Optional
from app.models import Tenant

def get_tenant_by_id(db: Session, id: str) -> Optional[Tenant]:
    return db.query(Tenant).filter(Tenant.id == id).first()

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
