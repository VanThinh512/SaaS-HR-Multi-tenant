from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TenantCreate(BaseModel):
    name: str
    subdomain: str
    plan_tier: Optional[str] = "basic"

class TenantUpdate(BaseModel):
    status: Optional[str] = None
    plan_tier: Optional[str] = None

class TenantSelfUpdate(BaseModel):
    name: Optional[str] = None

class TenantOut(BaseModel):
    id: str
    name: str
    subdomain: str
    status: str
    plan_tier: str
    created_at: datetime

    class Config:
        from_attributes = True
