"""
The core `requests` table — one row per citizen service request.
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, DateTime, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base
from app.models.enums import RequestStatus


class ServiceRequest(Base):
    __tablename__ = "requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Human-friendly, citizen-facing ID e.g. "REV-2026-00042" — generated in the service layer.
    request_number: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)

    citizen_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("citizens.id", ondelete="CASCADE"), nullable=False, index=True)
    service_type: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    status: Mapped[RequestStatus] = mapped_column(
        SAEnum(RequestStatus, name="request_status"), default=RequestStatus.PENDING, nullable=False, index=True
    )
    assigned_officer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("officers.id", ondelete="SET NULL"), nullable=True, index=True
    )
    officer_remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    citizen: Mapped["Citizen"] = relationship()
    assigned_officer: Mapped[Optional["Officer"]] = relationship()
    documents: Mapped[list["Document"]] = relationship(back_populates="request", cascade="all, delete-orphan")
    ai_responses: Mapped[list["AIResponse"]] = relationship(back_populates="request", cascade="all, delete-orphan")
