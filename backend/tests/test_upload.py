import io
import uuid
from pathlib import Path
from unittest.mock import patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_upload_unsupported_format(client: AsyncClient):
    file_content = b"dummy content"
    response = await client.post(
        "/api/upload",
        files={"file": ("test.txt", io.BytesIO(file_content), "text/plain")},
    )
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_pdf_success(
    client: AsyncClient,
    tmp_upload_dir: Path,
    mock_pdf_service,
    mock_vector_service,
):
    pdf_content = b"%PDF-1.4 mock content"

    with patch("app.api.upload.vector_service", mock_vector_service), \
         patch("app.api.upload.pdf_service", mock_pdf_service):

        response = await client.post(
            "/api/upload",
            files={"file": ("test.pdf", io.BytesIO(pdf_content), "application/pdf")},
        )

    assert response.status_code == 201
    data = response.json()
    assert "file_id" in data
    assert data["filename"] == "test.pdf"
    assert data["status"] == "completed"


@pytest.mark.asyncio
async def test_upload_audio_success(
    client: AsyncClient,
    tmp_upload_dir: Path,
    mock_whisper_service,
    mock_vector_service,
):
    audio_content = b"RIFF mock wav content"

    with patch("app.api.upload.vector_service", mock_vector_service), \
         patch("app.api.upload.whisper_service", mock_whisper_service):

        response = await client.post(
            "/api/upload",
            files={"file": ("test.wav", io.BytesIO(audio_content), "audio/wav")},
        )

    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "completed"


@pytest.mark.asyncio
async def test_get_file_metadata_not_found(client: AsyncClient):
    random_id = uuid.uuid4()
    response = await client.get(f"/api/files/{random_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_file_metadata_success(
    client: AsyncClient,
    tmp_upload_dir: Path,
    mock_pdf_service,
    mock_vector_service,
):
    pdf_content = b"%PDF-1.4 mock content"

    with patch("app.api.upload.vector_service", mock_vector_service), \
         patch("app.api.upload.pdf_service", mock_pdf_service):

        upload_resp = await client.post(
            "/api/upload",
            files={"file": ("document.pdf", io.BytesIO(pdf_content), "application/pdf")},
        )

    assert upload_resp.status_code == 201
    file_id = upload_resp.json()["file_id"]

    meta_resp = await client.get(f"/api/files/{file_id}")
    assert meta_resp.status_code == 200
    data = meta_resp.json()
    assert data["id"] == file_id
    assert data["file_type"] == "pdf"
