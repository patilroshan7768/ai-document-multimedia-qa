import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.file_model import UploadedFile
from app.schemas.chat_schema import ChatRequest, ChatResponse
from app.services.rag_service import rag_service
from app.services.vector_service import vector_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    """Answer a question about an uploaded document using RAG."""
    # Verify the file exists and is processed
    result = await db.execute(
        select(UploadedFile).where(UploadedFile.id == request.file_id)
    )
    file_record: UploadedFile | None = result.scalar_one_or_none()

    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File with id={request.file_id} not found.",
        )

    if file_record.status == "processing":
        raise HTTPException(
            status_code=status.HTTP_202_ACCEPTED,
            detail="File is still being processed. Please try again shortly.",
        )

    if file_record.status == "failed":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File processing failed. Cannot answer questions.",
        )

    if not vector_service.index_exists(request.file_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vector index not found for this file. Please re-upload.",
        )

    try:
        rag_result = await rag_service.answer(
            file_id=request.file_id,
            question=request.question,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except RuntimeError as exc:
        logger.error(f"RAG error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate answer. Please try again.",
        ) from exc

    return ChatResponse(
        answer=rag_result["answer"],
        timestamp=rag_result.get("timestamp"),
        source_text=rag_result.get("source_text"),
        file_id=request.file_id,
    )
