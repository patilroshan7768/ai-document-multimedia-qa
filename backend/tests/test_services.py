import json
import uuid
from pathlib import Path
from unittest.mock import MagicMock, patch

import numpy as np
import pytest

from app.utils.chunking import chunk_text, chunk_transcript_segments


# --- Chunking tests ---

def test_chunk_text_basic():
    text = "Hello world. " * 100
    chunks = chunk_text(text, chunk_size=100, chunk_overlap=20)
    assert len(chunks) > 1
    for chunk in chunks:
        assert isinstance(chunk, str)
        assert len(chunk) > 0


def test_chunk_text_empty():
    assert chunk_text("") == []
    assert chunk_text("   ") == []


def test_chunk_text_short():
    text = "Short text."
    chunks = chunk_text(text, chunk_size=500)
    assert len(chunks) == 1
    assert chunks[0] == text


def test_chunk_transcript_segments_basic():
    segments = [
        {"text": "Hello.", "start_time": 0.0, "end_time": 1.0},
        {"text": "How are you?", "start_time": 1.0, "end_time": 3.0},
        {"text": "I am fine.", "start_time": 3.0, "end_time": 5.0},
    ]
    chunks = chunk_transcript_segments(segments, max_chars=20)
    assert len(chunks) >= 1
    for chunk in chunks:
        assert "text" in chunk
        assert "start_time" in chunk
        assert "end_time" in chunk


def test_chunk_transcript_empty():
    assert chunk_transcript_segments([]) == []


# --- Embedding service tests ---

def test_embedding_service_embed_texts():
    from app.services.embedding_service import EmbeddingService

    service = EmbeddingService()
    mock_model = MagicMock()
    mock_model.encode.return_value = np.random.rand(3, 384).astype(np.float32)
    mock_model.get_sentence_embedding_dimension.return_value = 384
    service._model = mock_model

    texts = ["Hello world", "Test sentence", "Another chunk"]
    result = service.embed_texts(texts)
    assert result.shape == (3, 384)


def test_embedding_service_embed_empty():
    from app.services.embedding_service import EmbeddingService

    service = EmbeddingService()
    result = service.embed_texts([])
    assert len(result) == 0


# --- Vector service tests ---

def test_vector_service_create_and_search(tmp_path):
    from app.services.vector_service import VectorService
    from app.services.embedding_service import EmbeddingService

    service = VectorService()
    service.vector_store_dir = tmp_path

    mock_embedding = MagicMock(spec=EmbeddingService)
    dim = 384
    mock_embedding.embed_texts.return_value = np.random.rand(3, dim).astype(np.float32)
    mock_embedding.embed_query.return_value = np.random.rand(dim).astype(np.float32)

    file_id = uuid.uuid4()
    texts = ["OAuth is used for auth.", "FastAPI is a web framework.", "PostgreSQL stores data."]
    metadatas = [{"start_time": 0.0, "end_time": 5.0} for _ in texts]

    with patch("app.services.vector_service.embedding_service", mock_embedding):
        service.create_index(file_id, texts, metadatas)
        results = service.search(file_id, "authentication", top_k=2)

    assert len(results) <= 2
    assert "text" in results[0]
    assert "score" in results[0]


def test_vector_service_index_exists(tmp_path):
    from app.services.vector_service import VectorService

    service = VectorService()
    service.vector_store_dir = tmp_path
    file_id = uuid.uuid4()

    assert not service.index_exists(file_id)


def test_vector_service_search_missing_index(tmp_path):
    from app.services.vector_service import VectorService

    service = VectorService()
    service.vector_store_dir = tmp_path

    with pytest.raises(FileNotFoundError):
        service.search(uuid.uuid4(), "query")


# --- PDF service tests ---

def test_pdf_service_file_not_found():
    from app.services.pdf_service import PDFService

    service = PDFService()
    with pytest.raises(ValueError, match="File not found"):
        service.extract_text("/nonexistent/path/file.pdf")
