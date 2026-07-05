from datetime import datetime

from pydantic import BaseModel

from app.models.enums import DocumentStatus


class DocumentOut(BaseModel):
    id: str
    original_filename: str
    mime_type: str
    size_bytes: int
    status: DocumentStatus
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class OCRResultOut(BaseModel):
    document_id: str
    raw_text: str | None
    extracted_fields: dict
    corrected_fields: dict
    confidence: float | None

    model_config = {"from_attributes": True}


class OCRFieldsUpdate(BaseModel):
    """Citizen-submitted corrections after reviewing OCR output."""
    corrected_fields: dict
