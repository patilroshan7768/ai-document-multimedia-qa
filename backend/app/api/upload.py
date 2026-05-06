import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.file_model import UploadedFile
from app.models.transcript_model import TranscriptChunk
from app.schemas.upload_schema import FileMetadata, UploadResponse
from app.services.embedding_service import embedding_service
from app.services.pdf_service import pdf_service
from app.services.vector_service import vector_service
from app.services.whisper_service import whisper_service
from app.utils.chunking import chunk_text, chunk_transcript_segments
from app.utils.ffmpeg_utils import extract_audio_from_video

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["upload"])

SUPPORTED_EXTENSIONS = {"pdf", "mp3", "wav", "mp4", "mov"}
AUDIO_EXTENSIONS = {"mp3", "wav"}
VIDEO_EXTENSIONS = {"mp4", "mov"}
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB


@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
) -> UploadResponse:
    """Upload a PDF, audio, or video file and process it for Q&A."""
    # Validate extension
    filename = file.filename or "unknown"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Supported: {SUPPORTED_EXTENSIONS}",
        )

    # Read file content
    content = await file.read()
    file_size = len(content)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds the 500 MB limit.",
        )

    # Create DB record
    file_id = uuid.uuid4()
    safe_filename = f"{file_id}.{ext}"
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / safe_filename

    file_path.write_bytes(content)
    logger.info(f"File saved: {file_path}")

    db_file = UploadedFile(
        id=file_id,
        filename=safe_filename,
        original_filename=filename,
        file_type=ext,
        file_size=file_size,
        status="processing",
    )
    db.add(db_file)
    await db.flush()

    try:
        chunks = await _process_file(file_path, ext, file_id, db)
        logger.info(f"Processed {len(chunks)} chunks for file_id={file_id}")
        db_file.status = "completed"
    except Exception as exc:
        logger.error(f"Processing failed for {file_id}: {exc}", exc_info=True)
        db_file.status = "failed"
        db_file.error_message = str(exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File processing failed: {exc}",
        ) from exc
    finally:
        db.add(db_file)
        await db.commit()

    return UploadResponse(
        file_id=file_id,
        filename=filename,
        status=db_file.status,
    )


async def _process_file(
    file_path: Path,
    ext: str,
    file_id: uuid.UUID,
    db: AsyncSession,
) -> list[TranscriptChunk]:
    """Process an uploaded file: extract text, embed, index, and persist chunks."""
    db_chunks: list[TranscriptChunk] = []

    if ext == "pdf":
        text = pdf_service.extract_text(file_path)
        raw_chunks = chunk_text(text)
        chunk_dicts = [{"text": c, "start_time": None, "end_time": None} for c in raw_chunks]
    elif ext in AUDIO_EXTENSIONS:
        segments = whisper_service.transcribe(file_path)
        chunk_dicts = chunk_transcript_segments(segments)
    elif ext in VIDEO_EXTENSIONS:
        audio_path = file_path.with_suffix(".wav")
        extract_audio_from_video(file_path, audio_path)
        segments = whisper_service.transcribe(audio_path)
        chunk_dicts = chunk_transcript_segments(segments)
        # Clean up extracted audio
        if audio_path.exists():
            audio_path.unlink()
    else:
        raise ValueError(f"Unhandled extension: {ext}")

    # Persist chunks to PostgreSQL
    for idx, chunk in enumerate(chunk_dicts):
        db_chunk = TranscriptChunk(
            id=uuid.uuid4(),
            file_id=file_id,
            chunk_index=idx,
            chunk_text=chunk["text"],
            start_time=chunk.get("start_time"),
            end_time=chunk.get("end_time"),
        )
        db.add(db_chunk)
        db_chunks.append(db_chunk)

    await db.flush()

    # Build FAISS index
    texts = [c["text"] for c in chunk_dicts]
    metadatas = [
        {"start_time": c.get("start_time"), "end_time": c.get("end_time")}
        for c in chunk_dicts
    ]
    vector_service.create_index(file_id=file_id, texts=texts, metadatas=metadatas)

    return db_chunks


@router.get("/files/{file_id}", response_model=FileMetadata)
async def get_file_metadata(
    file_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> FileMetadata:
    """Retrieve metadata for an uploaded file."""
    from sqlalchemy import select

    result = await db.execute(select(UploadedFile).where(UploadedFile.id == file_id))
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="File not found."
        )

    return FileMetadata.model_validate(record)
