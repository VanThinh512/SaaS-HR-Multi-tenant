from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import TenantCreate, TenantUpdate, TenantOut
from app.crud import get_tenant_by_id, get_tenant_by_subdomain, create_tenant, update_tenant
from app.core.redis import publish_tenant_status_event

router = APIRouter(prefix="/api/v1/tenants", tags=["Tenants"])

@router.post("", response_model=TenantOut, status_code=status.HTTP_201_CREATED)
def register_tenant(payload: TenantCreate, db: Session = Depends(get_db)):
    existing = get_tenant_by_subdomain(db, payload.subdomain)
    if existing:
        raise HTTPException(status_code=409, detail="Subdomain already registered.")
    
    tenant = create_tenant(db, payload.name, payload.subdomain, payload.plan_tier)
    return tenant

@router.get("/subdomain/{subdomain}", response_model=TenantOut)
def get_tenant_subdomain(subdomain: str, db: Session = Depends(get_db)):
    tenant = get_tenant_by_subdomain(db, subdomain)
    if not tenant:
        raise HTTPException(status_code=404, detail="Subdomain not found.")
    return tenant

@router.get("/{id}", response_model=TenantOut)
def get_tenant(id: str, db: Session = Depends(get_db)):
    tenant = get_tenant_by_id(db, id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found.")
    return tenant

@router.put("/{id}", response_model=TenantOut)
def modify_tenant(id: str, payload: TenantUpdate, db: Session = Depends(get_db)):
    tenant = get_tenant_by_id(db, id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found.")
    
    old_status = tenant.status
    updated = update_tenant(db, tenant, payload.status, payload.plan_tier)
    
    # If tenant status changes, publish a Redis event
    if payload.status and payload.status != old_status:
        publish_tenant_status_event(updated.id, updated.status)
        
    return updated
