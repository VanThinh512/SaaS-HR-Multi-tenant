from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db

router = APIRouter(prefix="/api/v1/auth", tags=["Health"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Simple query to verify DB pool connection is active
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "service": "auth-service"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database connection offline: {str(e)}")

