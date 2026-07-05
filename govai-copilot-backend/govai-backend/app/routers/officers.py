from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.user import Officer
from app.models.enums import UserRole

router = APIRouter(prefix="/api/officers", tags=["officers"])


@router.get("")
def list_officers(
    department: str | None = None,
    _=Depends(require_roles(UserRole.ADMIN, UserRole.SUPERVISOR)),
    db: Session = Depends(get_db),
):
    query = db.query(Officer)
    if department:
        query = query.filter(Officer.department == department)
    return query.all()
