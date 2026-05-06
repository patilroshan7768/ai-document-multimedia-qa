import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.summary_service import summary_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["summary"])


class SummaryResponse(BaseModel):
    file_id: uuid.UUID
    summary: str


@router.get("/summary/{file_id}", response_model=SummaryResponse)
async def get_summary(
    file_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> SummaryResponse:
    """Generate or retrieve a cached summary for an uploaded file."""
    try:
        summary = await summary_service.get_or_generate_summary(
            file_id=file_id, db=db
        )
    except ValueError as exc:
        status_code = (
            status.HTTP_404_NOT_FOUND
            if "not found" in str(exc).lower()
            else status.HTTP_422_UNPROCESSABLE_ENTITY
        )
        raise HTTPException(status_code=status_code, detail=str(exc)) from exc
    except RuntimeError as exc:
        logger.error(f"Summary generation error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate summary. Please try again.",
        ) from exc

    return SummaryResponse(file_id=file_id, summary=summary)
