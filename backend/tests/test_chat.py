import io
import uuid
from pathlib import Path
from unittest.mock import patch, AsyncMock

import pytest
from httpx import AsyncClient


async def _upload_pdf(client: AsyncClient, mock_pdf_service, mock_vector_service) -> str:
    """Helper to upload a PDF and return the file_id."""
    pdf_content = b"%PDF-1.4 mock content"
    with patch("app.api.upload.vector_service", mock_vector_service), \
         patch("app.api.upload.pdf_service", mock_pdf_service):
        resp = await client.post(
            "/api/upload",
            files={"file": ("doc.pdf", io.BytesIO(pdf_content), "application/pdf")},
        )
    assert resp.status_code == 201
    return resp.json()["file_id"]


@pytest.mark.asyncio
async def test_chat_file_not_found(client: AsyncClient):
    response = await client.post(
        "/api/chat",
        json={"question": "What is this about?", "file_id": str(uuid.uuid4())},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_chat_success(
    client: AsyncClient,
    tmp_upload_dir: Path,
    mock_pdf_service,
    mock_vector_service,
    mock_vector_service_chat,
    mock_rag_service,
):
    file_id = await _upload_pdf(client, mock_pdf_service, mock_vector_service)

    with patch("app.api.chat.vector_service", mock_vector_service_chat), \
         patch("app.api.chat.rag_service", mock_rag_service):
        response = await client.post(
            "/api/chat",
            json={"question": "What is discussed about authentication?", "file_id": file_id},
        )

    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert data["answer"] == "OAuth is used for authentication."
    assert data["timestamp"] == 45.0
    assert "source_text" in data
    assert data["file_id"] == file_id


@pytest.mark.asyncio
async def test_chat_invalid_question_empty(client: AsyncClient):
    response = await client.post(
        "/api/chat",
        json={"question": "", "file_id": str(uuid.uuid4())},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_chat_missing_fields(client: AsyncClient):
    response = await client.post("/api/chat", json={"question": "Hello?"})
    assert response.status_code == 422
