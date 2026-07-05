"""
In-app notifications, pushed to the citizen (and optionally officer) whenever
something on their request changes. Delivered over the WebSocket channel in
real time and also listable via REST for a notifications inbox / read history.
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Enum as SAEnum, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base
from app.models.enums import NotificationType


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    request_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("requests.id", ondelete="CASCADE"), nullable=True, index=True)

    type: Mapped[NotificationType] = mapped_column(SAEnum(NotificationType, name="notification_type"), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)
