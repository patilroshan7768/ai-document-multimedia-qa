import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file_model import UploadedFile
from app.models.transcript_model import TranscriptChunk
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)

SUMMARY_SYSTEM_PROMPT = """You are an expert summarizer. Given the following document or transcript content,
generate a concise, well-structured summary that captures the key points, main topics, and important details.
Keep the summary clear and professional. Aim for 3-5 paragraphs."""


class SummaryService:
    """Service for generating and caching document summaries."""

    async def get_or_generate_summary(
        self,
        file_id: uuid.UUID,
        db: AsyncSession,
    ) -> str:
        """Return cached summary or generate a new one.

        Args:
            file_id: UUID of the uploaded file.
            db: Database session.

        Returns:
            Summary string.

        Raises:
            ValueError: If file not found or processing not complete.
        """
        # Fetch the file record
        result = await db.execute(
            select(UploadedFile).where(UploadedFile.id == file_id)
        )
        file_record: UploadedFile | None = result.scalar_one_or_none()

        if not file_record:
            raise ValueError(f"File not found: {file_id}")

        if file_record.status != "completed":
            raise ValueError(
                f"File is not fully processed yet (status={file_record.status})."
            )

        # Return cached summary if available
        if file_record.summary:
            logger.info(f"Returning cached summary for file_id={file_id}")
            return file_record.summary

        # Gather all text chunks from DB
        chunk_result = await db.execute(
            select(TranscriptChunk)
            .where(TranscriptChunk.file_id == file_id)
            .order_by(TranscriptChunk.chunk_index)
        )
        chunks = chunk_result.scalars().all()

        if not chunks:
            raise ValueError("No content chunks found for this file.")

        # Combine chunks into content (limit to avoid token overflow)
        combined_text = "\n\n".join(c.chunk_text for c in chunks)
        max_chars = 12000
        if len(combined_text) > max_chars:
            combined_text = combined_text[:max_chars] + "\n...[truncated]"

        logger.info(f"Generating summary for file_id={file_id}")
        summary = await llm_service.chat_completion(
            system_prompt=SUMMARY_SYSTEM_PROMPT,
            user_message=f"Please summarize the following content:\n\n{combined_text}",
            temperature=0.3,
            max_tokens=800,
        )

        # Cache summary in DB
        file_record.summary = summary
        db.add(file_record)
        await db.commit()
        logger.info(f"Summary cached for file_id={file_id}")

        return summary


summary_service = SummaryService()
