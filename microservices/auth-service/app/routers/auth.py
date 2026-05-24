from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import httpx
from typing import Dict, Any
from app.database import get_db
from app.schemas import LoginRequest, TokenResponse, RegisterRequest
from app.crud import get_user_by_email, create_user, link_user_to_tenant, get_user_tenant_link
from app.core.security import verify_password, create_access_token

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

TENANT_SERVICE_URL = "http://saashr-tenant:8001/api/v1/tenants"

async def fetch_tenant_by_subdomain(subdomain: str) -> Dict[str, Any]:
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{TENANT_SERVICE_URL}/subdomain/{subdomain}", timeout=5.0)
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            pass
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Workspace subdomain '{subdomain}' not found or tenant-service unavailable."
    )

async def create_tenant_context(name: str, subdomain: str) -> Dict[str, Any]:
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                TENANT_SERVICE_URL,
                json={"name": name, "subdomain": subdomain, "plan_tier": "basic"},
                timeout=5.0
            )
            if response.status_code == 201:
                return response.json()
            elif response.status_code == 409:
                raise HTTPException(status_code=409, detail="Tenant subdomain already registered.")
        except HTTPException as he:
            raise he
        except Exception:
            pass
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to register tenant workspace in tenant-service."
    )

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: Session = Depends(get_db)):
    # 1. Fetch user by email
    db_user = get_user_by_email(db, payload.email)
    if not db_user or not verify_password(payload.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # 2. Get tenant ID from tenant-service using subdomain
    tenant = await fetch_tenant_by_subdomain(payload.subdomain)
    tenant_id = tenant["id"]

    # 3. Check if user belongs to this tenant
    link = get_user_tenant_link(db, db_user.id, tenant_id)
    if not link or not link.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have access rights to this tenant workspace."
        )

    # 4. Generate Asymmetric RS256 token
    token_payload = {
        "sub": db_user.id,
        "email": db_user.email,
        "tenant_id": tenant_id,
        "role": link.role
    }
    access_token = create_access_token(data=token_payload)

    return TokenResponse(
        access_token=access_token,
        email=db_user.email,
        active_tenant_id=tenant_id,
        role=link.role
    )

@router.post("/register")
async def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    # 1. Check if user already exists in auth_db
    existing_user = get_user_by_email(db, payload.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered.")

    # 2. Create the tenant context in tenant-service
    tenant = await create_tenant_context(payload.tenant_name, payload.subdomain)
    tenant_id = tenant["id"]

    # 3. Create the user
    new_user = create_user(db, payload.email, payload.password)

    # 4. Link user to tenant as Owner
    link_user_to_tenant(db, new_user.id, tenant_id, "owner")

    return {"message": "Registration successful. Workspace created.", "tenant_id": tenant_id, "user_id": new_user.id}
