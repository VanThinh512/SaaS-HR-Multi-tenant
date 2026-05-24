from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uuid
from app.core.logging import setup_logging, correlation_id_ctx
from app.routers import tenants, health

# 1. Initialize logging
setup_logging()

app = FastAPI(title="SaaS HR Tenant Service", version="1.0.0")

# 2. CORS middleware configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Correlation ID tracking middleware
@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    corr_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
    token = correlation_id_ctx.set(corr_id)
    try:
        response = await call_next(request)
        response.headers["X-Correlation-ID"] = corr_id
        return response
    finally:
        correlation_id_ctx.reset(token)

# 4. Include Routers
app.include_router(health.router)
app.include_router(tenants.router)
