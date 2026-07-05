"""
Append-only audit log. Every state-changing action in the system writes one
row here via app.services.audit_service.record(). Never update or delete rows
in this table from application code.
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Enum as SAEnum, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.database import Base
from app.models.enums import AuditAction, UserRole


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    user_role: Mapped[Optional[UserRole]] = mapped_column(SAEnum(UserRole, name="audit_user_role"), nullable=True)

    action: Mapped[AuditAction] = mapped_column(SAEnum(AuditAction, name="audit_action"), nullable=False, index=True)
    request_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("requests.id", ondelete="SET NULL"), nullable=True, index=True)

    previous_status: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    new_status: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    details: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)
