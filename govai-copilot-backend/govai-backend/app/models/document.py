"""
Uploaded documents and their OCR extraction results.

Kept as two tables (Document / OCRData) rather than one so a document can
exist (and be viewable) before OCR finishes, and so OCR can be retried
without touching the document record itself.
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, DateTime, ForeignKey, Enum as SAEnum, Text, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.database import Base
from app.models.enums import DocumentStatus


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("requests.id", ondelete="CASCADE"), nullable=False, index=True)

    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_path: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size_bytes: Mapped[int] = mapped_column(nullable=False)

    status: Mapped[DocumentStatus] = mapped_column(
        SAEnum(DocumentStatus, name="document_status"), default=DocumentStatus.UPLOADED, nullable=False
    )
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    request: Mapped["ServiceRequest"] = relationship(back_populates="documents")
    ocr_data: Mapped["OCRData"] = relationship(back_populates="document", uselist=False, cascade="all, delete-orphan")


class OCRData(Base):
    __tablename__ = "ocr_data"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )

    raw_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Extracted structured fields e.g. {"name": "...", "dob": "...", "address": "..."}
    extracted_fields: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    # Fields after citizen review/edit — kept separate so we never lose the raw OCR output
    corrected_fields: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    document: Mapped["Document"] = relationship(back_populates="ocr_data")
