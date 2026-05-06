import uuid
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app

# --- In-memory SQLite for tests ---
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db():
    """Create all tables once per test session."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session():
    """Yield a fresh DB session per test."""
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession):
    """AsyncClient with DB dependency overridden to use test DB."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def sample_file_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.fixture
def tmp_upload_dir(tmp_path: Path, monkeypatch) -> Path:
    """Redirect uploads to a temp directory."""
    monkeypatch.setattr("app.core.config.settings.UPLOAD_DIR", str(tmp_path / "uploads"))
    monkeypatch.setattr(
        "app.core.config.settings.VECTOR_STORE_DIR", str(tmp_path / "vector_store")
    )
    (tmp_path / "uploads").mkdir()
    (tmp_path / "vector_store").mkdir()
    return tmp_path


@pytest.fixture
def mock_pdf_service():
    with patch("app.api.upload.pdf_service") as mock:
        mock.extract_text.return_value = "This is a sample PDF text for testing."
        yield mock


@pytest.fixture
def mock_whisper_service():
    with patch("app.api.upload.whisper_service") as mock:
        mock.transcribe.return_value = [
            {"text": "Hello world.", "start_time": 0.0, "end_time": 2.5},
            {"text": "This is a test.", "start_time": 2.5, "end_time": 5.0},
        ]
        yield mock


@pytest.fixture
def mock_vector_service():
    with patch("app.api.upload.vector_service") as mock:
        mock.create_index.return_value = None
        yield mock


@pytest.fixture
def mock_vector_service_chat():
    with patch("app.api.chat.vector_service") as mock:
        mock.index_exists.return_value = True
        yield mock


@pytest.fixture
def mock_rag_service():
    with patch("app.api.chat.rag_service") as mock:
        mock.answer = AsyncMock(
            return_value={
                "answer": "OAuth is used for authentication.",
                "timestamp": 45.0,
                "source_text": "OAuth authentication is explained in detail here.",
            }
        )
        yield mock


@pytest.fixture
def mock_llm_service():
    with patch("app.services.summary_service.llm_service") as mock:
        mock.chat_completion = AsyncMock(
            return_value="This document covers key topics including authentication, APIs, and data models."
        )
        yield mock
