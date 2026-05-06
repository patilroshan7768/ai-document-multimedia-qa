import uuid
from datetime import datetime

from pydantic import BaseModel


class UploadResponse(BaseModel):
    file_id: uuid.UUID
    filename: str
    status: str
    message: str = "File uploaded and processing started."

    model_config = {"from_attributes": True}


class FileMetadata(BaseModel):
    id: uuid.UUID
    filename: str
    original_filename: str
    file_type: str
    file_size: int | None
    upload_time: datetime
    summary: str | None
    status: str

    model_config = {"from_attributes": True}
