from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.core.redis import get_redis_client

router = APIRouter(prefix="/api/v1/tenants", tags=["Health"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    health_status = {"status": "healthy", "database": "up", "redis": "up", "service": "tenant-service"}
    try:
        # Check database health
        db.execute(text("SELECT 1"))
    except Exception:
        health_status["database"] = "down"
        health_status["status"] = "unhealthy"

    
    try:
        # Check Redis connection
        r = get_redis_client()
        r.ping()
    except Exception:
        health_status["redis"] = "down"
        health_status["status"] = "unhealthy"
        
    if health_status["status"] == "unhealthy":
        raise HTTPException(status_code=503, detail=health_status)
        
    return health_status
