"""
Application entrypoint. Wires together middleware, rate limiting, and routers.
Run with: uvicorn app.main:app --reload
"""
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import settings
from app.routers import auth, requests as requests_router, documents, officers, notifications, audit, ws

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("govai")

limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.rate_limit_per_minute}/minute"])

app = FastAPI(
    title="Government AI Copilot API",
    version="1.0.0",
    description="Backend for citizen service requests, OCR intake, officer review, and real-time status sync.",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url)
    return JSONResponse(status_code=500, content={"detail": "Internal server error."})


@app.get("/api/health", tags=["health"])
def health_check():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(requests_router.router)
app.include_router(documents.router)
app.include_router(officers.router)
app.include_router(notifications.router)
app.include_router(audit.router)
app.include_router(ws.router)
