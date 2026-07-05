"""
Business logic for creating and transitioning service requests.
Kept separate from the router so the same logic can be reused (e.g. by a
future batch-import job) without going through HTTP.
"""
import re
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.request import ServiceRequest
from app.models.enums import RequestStatus

# Maps a free-text service_type into a short department code used in the
# human-facing request number, e.g. "Aadhaar Update" -> "AAD".
_DEPARTMENT_CODE_OVERRIDES = {
    "aadhaar": "AAD",
    "pan": "PAN",
    "ration card": "RTN",
    "income certificate": "REV",
    "caste certificate": "REV",
    "birth certificate": "MUN",
    "death certificate": "MUN",
    "property tax": "MUN",
    "electricity": "UTL",
    "water": "UTL",
    "pension": "WEL",
    "land record": "LND",
    "grievance": "GRV",
}


def _department_code(service_type: str) -> str:
    lowered = service_type.lower()
    for keyword, code in _DEPARTMENT_CODE_OVERRIDES.items():
        if keyword in lowered:
            return code
    letters = re.sub(r"[^A-Za-z]", "", service_type).upper()
    return (letters[:3] or "GEN").ljust(3, "X")


def generate_request_number(db: Session, service_type: str) -> str:
    """Format: {DEPT}-{YEAR}-{5-digit sequence}, e.g. REV-2026-00042."""
    year = datetime.utcnow().year
    code = _department_code(service_type)
    prefix = f"{code}-{year}-"

    count_stmt = select(func.count()).select_from(ServiceRequest).where(
        ServiceRequest.request_number.like(f"{prefix}%")
    )
    existing_count = db.execute(count_stmt).scalar_one()
    sequence = existing_count + 1
    return f"{prefix}{sequence:05d}"
