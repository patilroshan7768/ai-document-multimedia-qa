import io
import uuid
from pathlib import Path
from unittest.mock import patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_summary_file_not_found(client: AsyncClient):
    response = await client.get(f"/api/summary/{uuid.uuid4()}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_summary_success(
    client: AsyncClient,
    tmp_upload_dir: Path,
    mock_pdf_service,
    mock_vector_service,
    mock_llm_service,
):
    # Upload a file first
    pdf_content = b"%PDF-1.4 mock content"
    with patch("app.api.upload.vector_service", mock_vector_service), \
         patch("app.api.upload.pdf_service", mock_pdf_service):
        upload_resp = await client.post(
            "/api/upload",
            files={"file": ("report.pdf", io.BytesIO(pdf_content), "application/pdf")},
        )
    assert upload_resp.status_code == 201
    file_id = upload_resp.json()["file_id"]

    # Request summary
    with patch("app.services.summary_service.llm_service", mock_llm_service):
        summary_resp = await client.get(f"/api/summary/{file_id}")

    assert summary_resp.status_code == 200
    data = summary_resp.json()
    assert data["file_id"] == file_id
    assert "summary" in data
    assert len(data["summary"]) > 0


@pytest.mark.asyncio
async def test_summary_cached(
    client: AsyncClient,
    tmp_upload_dir: Path,
    mock_pdf_service,
    mock_vector_service,
    mock_llm_service,
):
    """Second request should return cached summary without calling LLM again."""
    pdf_content = b"%PDF-1.4 mock content"
    with patch("app.api.upload.vector_service", mock_vector_service), \
         patch("app.api.upload.pdf_service", mock_pdf_service):
        upload_resp = await client.post(
            "/api/upload",
            files={"file": ("cached.pdf", io.BytesIO(pdf_content), "application/pdf")},
        )
    file_id = upload_resp.json()["file_id"]

    with patch("app.services.summary_service.llm_service", mock_llm_service):
        resp1 = await client.get(f"/api/summary/{file_id}")
        resp2 = await client.get(f"/api/summary/{file_id}")

    assert resp1.status_code == 200
    assert resp2.status_code == 200
    # LLM should only be called once
    assert mock_llm_service.chat_completion.call_count == 1
