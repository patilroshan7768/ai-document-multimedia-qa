import logging
import re

from app.core.config import settings

logger = logging.getLogger(__name__)


def chunk_text(
    text: str,
    chunk_size: int = settings.CHUNK_SIZE,
    chunk_overlap: int = settings.CHUNK_OVERLAP,
) -> list[str]:
    """Split text into overlapping chunks by word boundary.

    Args:
        text: Input text to chunk.
        chunk_size: Target number of characters per chunk.
        chunk_overlap: Number of characters to overlap between chunks.

    Returns:
        List of text chunks.
    """
    if not text or not text.strip():
        return []

    # Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()

    chunks: list[str] = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = start + chunk_size

        if end >= text_len:
            chunk = text[start:].strip()
            if chunk:
                chunks.append(chunk)
            break

        # Try to break at a sentence boundary
        boundary = _find_sentence_boundary(text, end)
        chunk = text[start:boundary].strip()

        if chunk:
            chunks.append(chunk)

        # Move start with overlap
        start = max(boundary - chunk_overlap, start + 1)

    logger.debug(f"Chunked text into {len(chunks)} chunks.")
    return chunks


def _find_sentence_boundary(text: str, position: int) -> int:
    """Find the nearest sentence boundary around the given position."""
    # Look forward up to 100 chars for a sentence-ending punctuation
    search_end = min(position + 100, len(text))
    sub = text[position:search_end]

    for pattern in [". ", "? ", "! ", "\n"]:
        idx = sub.find(pattern)
        if idx != -1:
            return position + idx + len(pattern)

    # Fallback: word boundary
    idx = sub.find(" ")
    if idx != -1:
        return position + idx + 1

    return position


def chunk_transcript_segments(
    segments: list[dict],
    max_chars: int = settings.CHUNK_SIZE,
) -> list[dict]:
    """Group transcript segments into larger chunks while preserving timestamps.

    Args:
        segments: List of dicts with 'text', 'start_time', 'end_time'.
        max_chars: Maximum characters per combined chunk.

    Returns:
        List of chunk dicts with 'text', 'start_time', 'end_time'.
    """
    if not segments:
        return []

    chunks: list[dict] = []
    current_texts: list[str] = []
    current_start: float = segments[0]["start_time"]
    current_end: float = segments[0]["end_time"]
    current_len = 0

    for seg in segments:
        seg_text = seg["text"].strip()
        seg_len = len(seg_text)

        if current_len + seg_len > max_chars and current_texts:
            chunks.append(
                {
                    "text": " ".join(current_texts),
                    "start_time": current_start,
                    "end_time": current_end,
                }
            )
            current_texts = [seg_text]
            current_start = seg["start_time"]
            current_end = seg["end_time"]
            current_len = seg_len
        else:
            current_texts.append(seg_text)
            current_end = seg["end_time"]
            current_len += seg_len

    if current_texts:
        chunks.append(
            {
                "text": " ".join(current_texts),
                "start_time": current_start,
                "end_time": current_end,
            }
        )

    logger.debug(f"Grouped {len(segments)} segments into {len(chunks)} chunks.")
    return chunks
