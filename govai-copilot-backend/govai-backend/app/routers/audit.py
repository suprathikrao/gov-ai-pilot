import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.audit import AuditLog
from app.models.enums import UserRole

router = APIRouter(prefix="/api/audit-logs", tags=["audit"])


@router.get("")
def list_audit_logs(
    request_id: uuid.UUID | None = None,
    limit: int = 200,
    _=Depends(require_roles(UserRole.ADMIN, UserRole.SUPERVISOR)),
    db: Session = Depends(get_db),
):
    query = db.query(AuditLog)
    if request_id:
        query = query.filter(AuditLog.request_id == request_id)
    return query.order_by(AuditLog.timestamp.desc()).limit(min(limit, 1000)).all()
