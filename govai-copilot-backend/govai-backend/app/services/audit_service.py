"""
Single write path for audit_logs. Every router that mutates state should call
`record()` in the same DB transaction as the mutation so the audit trail can
never drift from what actually happened.
"""
import uuid

from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.enums import AuditAction, UserRole


def record(
    db: Session,
    *,
    action: AuditAction,
    user_id: uuid.UUID | None,
    user_role: UserRole | None,
    request_id: uuid.UUID | None = None,
    previous_status: str | None = None,
    new_status: str | None = None,
    ip_address: str | None = None,
    details: dict | None = None,
) -> AuditLog:
    entry = AuditLog(
        user_id=user_id,
        user_role=user_role,
        action=action,
        request_id=request_id,
        previous_status=previous_status,
        new_status=new_status,
        ip_address=ip_address,
        details=details or {},
    )
    db.add(entry)
    db.flush()  # get entry.id without committing yet; caller controls commit
    return entry
