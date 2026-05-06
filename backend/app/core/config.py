import os
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Document & Multimedia Q&A API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/docqa"

    # Groq
    GROQ_API_KEY: str = ""

    # Security
    SECRET_KEY: str = "change-me-in-production"

    # Paths
    UPLOAD_DIR: str = "uploads"
    VECTOR_STORE_DIR: str = "vector_store"

    # Embedding
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"

    # Whisper
    WHISPER_MODEL_SIZE: str = "base"

    # Chunking
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50

    # LLM
    GROQ_MODEL: str = "llama3-8b-8192"

    # CORS
    CORS_ORIGINS: list[str] = ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
