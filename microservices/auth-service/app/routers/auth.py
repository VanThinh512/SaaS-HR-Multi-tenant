from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import httpx
from typing import Dict, Any, List
from app.database import get_db
from app.schemas import (
    LoginRequest, TokenResponse, RegisterRequest,
    WorkspaceMemberOut, UpdateRoleRequest,
    MeOut, ChangePasswordRequest, InviteUserRequest,
)
from app.crud import (
    get_user_by_email, get_user_by_id, create_user, link_user_to_tenant, get_user_tenant_link,
    get_users_by_tenant, update_user_role_in_tenant, remove_user_from_tenant,
    update_user_password, invite_user_to_tenant,
)
from app.core.security import verify_password, create_access_token, get_current_tenant_user

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


# --- Workspace Users Management ---

@router.get("/tenants/users", response_model=List[WorkspaceMemberOut])
def list_workspace_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_tenant_user)
):
    """Liệt kê tất cả thành viên đang active trong doanh nghiệp. Chỉ admin/owner mới xem được."""
    if current_user["role"] not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Permission denied. Admin role required.")

    rows = get_users_by_tenant(db, tenant_id=current_user["tenant_id"])
    return [
        WorkspaceMemberOut(
            user_id=user.id,
            email=user.email,
            status=user.status,
            role=link.role,
            is_active=link.is_active,
        )
        for link, user in rows
    ]


@router.put("/tenants/users/{user_id}/role", response_model=WorkspaceMemberOut)
def update_member_role(
    user_id: str,
    payload: UpdateRoleRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_tenant_user)
):
    """Cập nhật vai trò thành viên. Chỉ owner mới có quyền."""
    if current_user["role"] != "owner":
        raise HTTPException(status_code=403, detail="Permission denied. Owner role required.")
    if payload.role not in ["owner", "admin", "employee"]:
        raise HTTPException(status_code=422, detail="Invalid role. Must be owner, admin, or employee.")
    if user_id == current_user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot change your own role.")

    link = update_user_role_in_tenant(db, target_user_id=user_id, tenant_id=current_user["tenant_id"], new_role=payload.role)
    if not link:
        raise HTTPException(status_code=404, detail="User not found in this tenant workspace.")

    user = get_user_by_email(db, link.user_id)  # fallback: look up by id
    from app.models import User as UserModel
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    return WorkspaceMemberOut(
        user_id=link.user_id,
        email=user.email,
        status=user.status,
        role=link.role,
        is_active=link.is_active,
    )


@router.delete("/tenants/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_workspace_member(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_tenant_user)
):
    """Trục xuất thành viên ra khỏi tenant (vô hiệu hóa quyền truy cập). Chỉ admin/owner."""
    if current_user["role"] not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Permission denied. Admin role required.")
    if user_id == current_user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot remove yourself from the workspace.")

    success = remove_user_from_tenant(db, target_user_id=user_id, tenant_id=current_user["tenant_id"])
    if not success:
        raise HTTPException(status_code=404, detail="User not found or already removed from this tenant.")


# --- Current User (Me) ---

@router.get("/me", response_model=MeOut)
def get_me(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_tenant_user)
):
    """Xem thông tin profile của user đang đăng nhập."""
    user = get_user_by_id(db, current_user["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
    return MeOut(
        id=user.id,
        email=user.email,
        status=user.status,
        active_tenant_id=current_user["tenant_id"],
        role=current_user["role"],
    )


@router.put("/me/password", status_code=status.HTTP_200_OK)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_tenant_user)
):
    """Đổi mật khẩu. Phải cung cấp đúng mật khẩu hiện tại."""
    user = get_user_by_id(db, current_user["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=422, detail="New password must be at least 8 characters.")
    update_user_password(db, user, payload.new_password)
    return {"message": "Password updated successfully."}


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    current_user: dict = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """
    Gia hạn access token. Gửi token còn hiệu lực, nhận lại token mới với thời gian hết hạn được reset.
    Token cũ vẫn hợp lệ cho đến khi hết hạn tự nhiên (kiến trúc stateless RS256).
    """
    user = get_user_by_id(db, current_user["user_id"])
    if not user or user.status != "active":
        raise HTTPException(status_code=403, detail="User account is inactive or not found.")

    # Verify the user still belongs to this tenant (not removed)
    link = get_user_tenant_link(db, user.id, current_user["tenant_id"])
    if not link or not link.is_active:
        raise HTTPException(status_code=403, detail="Access to this workspace has been revoked.")

    new_token = create_access_token(data={
        "sub": user.id,
        "email": user.email,
        "tenant_id": current_user["tenant_id"],
        "role": link.role,
    })
    return TokenResponse(
        access_token=new_token,
        email=user.email,
        active_tenant_id=current_user["tenant_id"],
        role=link.role,
    )


# --- Invite User to Workspace ---

@router.post("/tenants/users/invite", response_model=WorkspaceMemberOut, status_code=status.HTTP_200_OK)
def invite_member(
    payload: InviteUserRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_tenant_user)
):
    """
    Mời user đã có tài khoản vào tenant hiện tại.
    - Chỉ admin/owner mới có quyền mời.
    - Nếu user chưa có tài khoản → trả về 404 (yêu cầu đăng ký trước).
    - Nếu user đã là thành viên active → trả về 409.
    """
    if current_user["role"] not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Permission denied. Admin role required.")
    if payload.role not in ["owner", "admin", "employee"]:
        raise HTTPException(status_code=422, detail="Invalid role. Must be owner, admin, or employee.")
    if payload.role == "owner" and current_user["role"] != "owner":
        raise HTTPException(status_code=403, detail="Only an owner can invite another owner.")

    # Check target user exists
    target_user = get_user_by_email(db, payload.email)
    if not target_user:
        raise HTTPException(
            status_code=404,
            detail=f"No account found for '{payload.email}'. Ask them to register first."
        )

    link, is_new = invite_user_to_tenant(db, payload.email, current_user["tenant_id"], payload.role)

    if not is_new and link:
        raise HTTPException(status_code=409, detail=f"'{payload.email}' is already an active member of this workspace.")

    return WorkspaceMemberOut(
        user_id=target_user.id,
        email=target_user.email,
        status=target_user.status,
        role=link.role,
        is_active=link.is_active,
    )


# --- List Workspace Members ---

@router.get("/tenants/users", response_model=List[WorkspaceMemberOut])
def list_members(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_tenant_user)
):
    """Liệt kê tất cả thành viên active của tenant hiện tại. Yêu cầu quyền admin/owner."""
    if current_user["role"] not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Permission denied. Admin role required.")
    rows = get_users_by_tenant(db, current_user["tenant_id"])
    return [
        WorkspaceMemberOut(
            user_id=user.id,
            email=user.email,
            status=user.status,
            role=link.role,
            is_active=link.is_active,
        )
        for link, user in rows
    ]


# --- Update Member Role ---

@router.put("/tenants/users/{user_id}/role", response_model=WorkspaceMemberOut)
def update_member_role(
    user_id: str,
    payload: UpdateRoleRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_tenant_user)
):
    """Cập nhật vai trò của thành viên. Chỉ owner mới được gán role 'owner'."""
    if current_user["role"] not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Permission denied. Admin role required.")
    if payload.role not in ["owner", "admin", "employee"]:
        raise HTTPException(status_code=422, detail="Invalid role. Must be owner, admin, or employee.")
    if payload.role == "owner" and current_user["role"] != "owner":
        raise HTTPException(status_code=403, detail="Only an owner can assign the owner role.")
    if user_id == current_user["user_id"]:
        raise HTTPException(status_code=400, detail="You cannot change your own role.")

    link = update_user_role_in_tenant(db, user_id, current_user["tenant_id"], payload.role)
    if not link:
        raise HTTPException(status_code=404, detail="Member not found in this workspace.")

    target_user = get_user_by_id(db, user_id)
    return WorkspaceMemberOut(
        user_id=target_user.id,
        email=target_user.email,
        status=target_user.status,
        role=link.role,
        is_active=link.is_active,
    )


# --- Remove Member from Workspace ---

@router.delete("/tenants/users/{user_id}", status_code=status.HTTP_200_OK)
def remove_member(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_tenant_user)
):
    """Xóa thành viên khỏi workspace (soft delete). Không thể tự xóa chính mình."""
    if current_user["role"] not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Permission denied. Admin role required.")
    if user_id == current_user["user_id"]:
        raise HTTPException(status_code=400, detail="You cannot remove yourself from the workspace.")

    removed = remove_user_from_tenant(db, user_id, current_user["tenant_id"])
    if not removed:
        raise HTTPException(status_code=404, detail="Member not found or already removed.")
    return {"message": "Member removed from workspace."}

