from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas import TenantCreate, TenantUpdate, TenantSelfUpdate, TenantOut
from app.crud import (
    get_tenant_by_id, get_tenant_by_subdomain, get_all_tenants,
    create_tenant, update_tenant, update_tenant_self, delete_tenant
)
from app.core.redis import publish_tenant_status_event
from app.core.security import get_current_tenant_user

router = APIRouter(prefix="/api/v1/tenants", tags=["Tenants"])

@router.post("", response_model=TenantOut, status_code=status.HTTP_201_CREATED)
def register_tenant(payload: TenantCreate, db: Session = Depends(get_db)):
    existing = get_tenant_by_subdomain(db, payload.subdomain)
    if existing:
        raise HTTPException(status_code=409, detail="Subdomain already registered.")
    
    tenant = create_tenant(db, payload.name, payload.subdomain, payload.plan_tier)
    return tenant

@router.get("", response_model=List[TenantOut])
def list_tenants(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_tenant_user)
):
    """Liệt kê tất cả tenants trong hệ thống. Yêu cầu quyền owner."""
    if current_user["role"] != "owner":
        raise HTTPException(status_code=403, detail="Permission denied. Owner role required.")
    return get_all_tenants(db, skip=skip, limit=limit)

@router.get("/subdomain/{subdomain}", response_model=TenantOut)
def get_tenant_subdomain(subdomain: str, db: Session = Depends(get_db)):
    tenant = get_tenant_by_subdomain(db, subdomain)
    if not tenant:
        raise HTTPException(status_code=404, detail="Subdomain not found.")
    return tenant


# --- Self-service endpoints (requires JWT) — phải đặt TRƯỚC /{id} để tránh conflict ---

@router.get("/my-tenant", response_model=TenantOut)
def get_my_tenant(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_tenant_user)
):
    """Xem thông tin doanh nghiệp của chính mình (dành cho user đã đăng nhập)."""
    tenant = get_tenant_by_id(db, current_user["tenant_id"])
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant workspace not found.")
    return tenant


@router.put("/my-tenant", response_model=TenantOut)
def update_my_tenant(
    payload: TenantSelfUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_tenant_user)
):
    """Cập nhật tên doanh nghiệp. Chỉ owner mới có quyền."""
    if current_user["role"] != "owner":
        raise HTTPException(status_code=403, detail="Permission denied. Only the workspace owner can update tenant info.")

    tenant = get_tenant_by_id(db, current_user["tenant_id"])
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant workspace not found.")

    updated = update_tenant_self(db, tenant, name=payload.name)
    return updated


@router.get("/{id}", response_model=TenantOut)
def get_tenant(id: str, db: Session = Depends(get_db)):
    tenant = get_tenant_by_id(db, id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found.")
    return tenant


@router.put("/{id}", response_model=TenantOut)
def admin_update_tenant(
    id: str,
    payload: TenantUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_tenant_user)
):
    """Cập nhật trạng thái / gói dịch vụ của tenant (platform admin). Yêu cầu quyền owner."""
    if current_user["role"] != "owner":
        raise HTTPException(status_code=403, detail="Permission denied. Owner role required.")

    tenant = get_tenant_by_id(db, id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found.")

    updated = update_tenant(db, tenant, status=payload.status, plan_tier=payload.plan_tier)

    # Phát sự kiện Redis nếu trạng thái thay đổi (để hr-service cập nhật dữ liệu liên quan)
    if payload.status and payload.status != tenant.status:
        publish_tenant_status_event(tenant_id=id, new_status=payload.status)

    return updated


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_tenant(
    id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_tenant_user)
):
    """Xóa hoàn toàn tenant khỏi hệ thống (hard delete). Yêu cầu quyền owner."""
    if current_user["role"] != "owner":
        raise HTTPException(status_code=403, detail="Permission denied. Owner role required.")

    tenant = get_tenant_by_id(db, id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found.")

    # Phát sự kiện xóa tenant trước khi xóa
    publish_tenant_status_event(tenant_id=id, new_status="deleted")

    success = delete_tenant(db, id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete tenant.")
