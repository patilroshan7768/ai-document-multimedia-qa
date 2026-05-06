import uuid

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    file_id: uuid.UUID


class ChatResponse(BaseModel):
    answer: str
    timestamp: float | None = None
    source_text: str | None = None
    file_id: uuid.UUID
