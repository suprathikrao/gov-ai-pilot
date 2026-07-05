"""
Creates a Notification row and pushes it to the user's live WebSocket
connection (if any) in the same call, so REST history and real-time delivery
never fall out of sync.
"""
import uuid

from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.enums import NotificationType
from app.services.ws_manager import manager


async def notify(
    db: Session,
    *,
    user_id: uuid.UUID,
    type_: NotificationType,
    message: str,
    request_id: uuid.UUID | None = None,
) -> Notification:
    notification = Notification(user_id=user_id, request_id=request_id, type=type_, message=message)
    db.add(notification)
    db.flush()

    await manager.send_to_user(
        user_id,
        {
            "event": "notification",
            "id": str(notification.id),
            "type": type_.value,
            "message": message,
            "request_id": str(request_id) if request_id else None,
            "created_at": notification.created_at,
        },
    )
    return notification
