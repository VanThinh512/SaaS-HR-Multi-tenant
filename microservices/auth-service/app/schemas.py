from pydantic import BaseModel, EmailStr
from typing import List, Optional

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    subdomain: str # Used to identify the workspace tenant context

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str
    active_tenant_id: str
    role: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    tenant_name: str
    subdomain: str

class TenantRoleOut(BaseModel):
    tenant_id: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True

class UserOut(BaseModel):
    id: str
    email: EmailStr
    status: str
    tenants: List[TenantRoleOut]

    class Config:
        from_attributes = True
