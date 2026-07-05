"""
Import every model module here so `Base.metadata` is fully populated for
Alembic autogenerate and for `Base.metadata.create_all()` in dev/test setups.
"""
from app.models.user import User, Citizen, Officer  # noqa: F401
from app.models.request import ServiceRequest  # noqa: F401
from app.models.document import Document, OCRData  # noqa: F401
from app.models.ai_response import AIResponse  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.audit import AuditLog  # noqa: F401
