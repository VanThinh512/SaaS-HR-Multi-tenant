from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
import redis
from app.core.config import settings

router = APIRouter(prefix="/api/v1/hr", tags=["Health"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    health_status = {"status": "healthy", "database": "up", "redis": "up", "service": "hr-service"}
    try:
        # Check database
        db.execute(text("SELECT 1"))
    except Exception:
        health_status["database"] = "down"
        health_status["status"] = "unhealthy"

    
    try:
        # Check Redis
        r = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
        r.ping()
    except Exception:
        health_status["redis"] = "down"
        health_status["status"] = "unhealthy"
        
    if health_status["status"] == "unhealthy":
        raise HTTPException(status_code=503, detail=health_status)
        
    return health_status
