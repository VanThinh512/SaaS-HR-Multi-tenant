from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import settings

security = HTTPBearer()

def get_current_tenant_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.JWT_PUBLIC_KEY.replace("\\n", "\n"),
            algorithms=[settings.JWT_ALGORITHM]
        )
        tenant_id: str = payload.get("tenant_id")
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        email: str = payload.get("email")

        if not tenant_id or not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token validation failed: missing tenant_id or user identity claims."
            )
        return {"tenant_id": tenant_id, "user_id": user_id, "role": role, "email": email}
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}"
        )
