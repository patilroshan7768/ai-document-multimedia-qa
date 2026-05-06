import logging

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["health"])


class HealthResponse(BaseModel):
    status: str
    database: str
    version: str


@router.get("/health", response_model=HealthResponse)
async def health_check(db: AsyncSession = Depends(get_db)) -> HealthResponse:
    """Return health status of the API and its dependencies."""
    db_status = "healthy"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as exc:
        logger.warning(f"Database health check failed: {exc}")
        db_status = "unhealthy"

    from app.core.config import settings

    return HealthResponse(
        status="healthy",
        database=db_status,
        version=settings.APP_VERSION,
    )
