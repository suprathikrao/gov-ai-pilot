"""
Core request lifecycle: submit, list-mine (citizen), list-all (officer),
detail view, status update with remarks.

Every state change here: (1) writes the DB row, (2) writes an audit log entry,
(3) pushes a real-time notification — all in one committed transaction so the
three can never disagree with each other.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles, get_client_ip
from app.models.user import User, Citizen, Officer
from app.models.request import ServiceRequest
from app.models.ai_response import AIResponse
from app.models.enums import UserRole, RequestStatus, AuditAction, NotificationType
from app.schemas.request import RequestCreate, RequestOut, RequestDetailOut, RequestStatusUpdate
from app.services import audit_service, notification_service
from app.services.request_service import generate_request_number

router = APIRouter(prefix="/api/requests", tags=["requests"])


def _get_citizen_profile(db: Session, user: User) -> Citizen:
    citizen = db.query(Citizen).filter(Citizen.user_id == user.id).first()
    if not citizen:
        raise HTTPException(status_code=403, detail="Only citizen accounts can submit requests.")
    return citizen


@router.post("", response_model=RequestOut, status_code=status.HTTP_201_CREATED)
async def submit_request(
    payload: RequestCreate,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.CITIZEN)),
    db: Session = Depends(get_db),
):
    citizen = _get_citizen_profile(db, current_user)

    request_number = generate_request_number(db, payload.service_type)
    new_request = ServiceRequest(
        request_number=request_number,
        citizen_id=citizen.id,
        service_type=payload.service_type,
        description=payload.description,
        status=RequestStatus.PENDING,
    )
    db.add(new_request)
    db.flush()

    if payload.ai_prompt and payload.ai_response_text:
        db.add(AIResponse(
            request_id=new_request.id,
            prompt=payload.ai_prompt,
            response_text=payload.ai_response_text,
            model_used="assistant",
        ))

    audit_service.record(
        db,
        action=AuditAction.REQUEST_SUBMITTED,
        user_id=current_user.id,
        user_role=current_user.role,
        request_id=new_request.id,
        new_status=RequestStatus.PENDING.value,
        ip_address=get_client_ip(request),
    )

    await notification_service.notify(
        db,
        user_id=current_user.id,
        type_=NotificationType.SYSTEM,
        message=f"Your request {request_number} has been submitted and is pending review.",
        request_id=new_request.id,
    )

    db.commit()
    db.refresh(new_request)
    return new_request


@router.get("/mine", response_model=list[RequestOut])
def list_my_requests(
    current_user: User = Depends(require_roles(UserRole.CITIZEN)),
    db: Session = Depends(get_db),
):
    citizen = _get_citizen_profile(db, current_user)
    return (
        db.query(ServiceRequest)
        .filter(ServiceRequest.citizen_id == citizen.id)
        .order_by(ServiceRequest.created_at.desc())
        .all()
    )


@router.get("", response_model=list[RequestDetailOut])
def list_all_requests(
    status_filter: RequestStatus | None = None,
    service_type: str | None = None,
    search: str | None = None,
    current_user: User = Depends(require_roles(UserRole.OFFICER, UserRole.SUPERVISOR, UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Officer/supervisor/admin view of all requests, with basic filters."""
    query = db.query(ServiceRequest, Citizen).join(Citizen, ServiceRequest.citizen_id == Citizen.id)

    if status_filter:
        query = query.filter(ServiceRequest.status == status_filter)
    if service_type:
        query = query.filter(ServiceRequest.service_type.ilike(f"%{service_type}%"))
    if search:
        like = f"%{search}%"
        query = query.filter(
            (ServiceRequest.request_number.ilike(like)) | (Citizen.full_name.ilike(like))
        )

    rows = query.order_by(ServiceRequest.created_at.desc()).all()
    results = []
    for req, citizen in rows:
        results.append(RequestDetailOut(
            id=str(req.id),
            request_number=req.request_number,
            service_type=req.service_type,
            description=req.description,
            status=req.status,
            officer_remarks=req.officer_remarks,
            assigned_officer_id=str(req.assigned_officer_id) if req.assigned_officer_id else None,
            created_at=req.created_at,
            updated_at=req.updated_at,
            citizen_name=citizen.full_name,
            citizen_id=str(citizen.id),
        ))
    return results


def _authorize_request_access(db: Session, request_row: ServiceRequest, current_user: User) -> None:
    if current_user.role == UserRole.CITIZEN:
        citizen = _get_citizen_profile(db, current_user)
        if request_row.citizen_id != citizen.id:
            raise HTTPException(status_code=403, detail="You do not have access to this request.")
    # Officers/supervisors/admins can view any request (dashboard scope);
    # tighten to department-scoped access here if required.


@router.get("/{request_id}", response_model=RequestDetailOut)
def get_request_detail(
    request_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    req = db.get(ServiceRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found.")
    _authorize_request_access(db, req, current_user)

    citizen = db.get(Citizen, req.citizen_id)
    return RequestDetailOut(
        id=str(req.id),
        request_number=req.request_number,
        service_type=req.service_type,
        description=req.description,
        status=req.status,
        officer_remarks=req.officer_remarks,
        assigned_officer_id=str(req.assigned_officer_id) if req.assigned_officer_id else None,
        created_at=req.created_at,
        updated_at=req.updated_at,
        citizen_name=citizen.full_name,
        citizen_id=str(citizen.id),
    )


@router.patch("/{request_id}/status", response_model=RequestOut)
async def update_request_status(
    request_id: uuid.UUID,
    payload: RequestStatusUpdate,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.OFFICER, UserRole.SUPERVISOR, UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    req = db.get(ServiceRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found.")

    previous_status = req.status.value
    req.status = payload.status
    if payload.remarks is not None:
        req.officer_remarks = payload.remarks

    officer = db.query(Officer).filter(Officer.user_id == current_user.id).first()
    if officer and req.assigned_officer_id is None:
        req.assigned_officer_id = officer.id

    audit_service.record(
        db,
        action=AuditAction.STATUS_CHANGED,
        user_id=current_user.id,
        user_role=current_user.role,
        request_id=req.id,
        previous_status=previous_status,
        new_status=payload.status.value,
        ip_address=get_client_ip(request),
        details={"remarks": payload.remarks} if payload.remarks else {},
    )

    citizen = db.get(Citizen, req.citizen_id)
    message = f"Your request {req.request_number} status changed to '{payload.status.value.replace('_', ' ')}'."
    if payload.remarks:
        message += f" Officer remarks: {payload.remarks}"
    await notification_service.notify(
        db,
        user_id=citizen.user_id,
        type_=NotificationType.STATUS_CHANGE,
        message=message,
        request_id=req.id,
    )

    db.commit()
    db.refresh(req)
    return req
