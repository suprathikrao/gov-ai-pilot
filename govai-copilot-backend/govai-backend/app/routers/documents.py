"""
Document upload + OCR endpoints.

OCR runs synchronously in-request for simplicity in this phase. For
production scale under load, move `run_ocr_pipeline` into a background task
queue (Celery/RQ/arq) and have the frontend poll `GET .../ocr` or receive a
WebSocket "ocr_complete" event instead.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User, Citizen
from app.models.request import ServiceRequest
from app.models.document import Document, OCRData
from app.models.enums import DocumentStatus, UserRole, AuditAction
from app.schemas.document import DocumentOut, OCRResultOut, OCRFieldsUpdate
from app.services.file_storage import save_upload
from app.services.ocr_service import run_ocr_pipeline
from app.services import audit_service

router = APIRouter(prefix="/api/requests/{request_id}/documents", tags=["documents"])


def _get_request_or_404(db: Session, request_id: uuid.UUID) -> ServiceRequest:
    req = db.get(ServiceRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found.")
    return req


def _authorize(db: Session, req: ServiceRequest, user: User) -> None:
    if user.role == UserRole.CITIZEN:
        citizen = db.query(Citizen).filter(Citizen.user_id == user.id).first()
        if not citizen or req.citizen_id != citizen.id:
            raise HTTPException(status_code=403, detail="You do not have access to this request's documents.")


@router.post("", response_model=OCRResultOut, status_code=201)
async def upload_document(
    request_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    req = _get_request_or_404(db, request_id)
    _authorize(db, req, current_user)

    stored_path, size_bytes = await save_upload(file, str(request_id))

    document = Document(
        request_id=req.id,
        original_filename=file.filename or "upload",
        stored_path=stored_path,
        mime_type=file.content_type,
        size_bytes=size_bytes,
        status=DocumentStatus.OCR_PROCESSING,
    )
    db.add(document)
    db.flush()

    try:
        raw_text, extracted_fields = run_ocr_pipeline(stored_path, file.content_type)
        document.status = DocumentStatus.OCR_COMPLETE
    except Exception as exc:  # OCR is best-effort; upload still succeeds
        document.status = DocumentStatus.OCR_FAILED
        raw_text, extracted_fields = None, {}

    ocr_data = OCRData(
        document_id=document.id,
        raw_text=raw_text,
        extracted_fields=extracted_fields,
        corrected_fields=extracted_fields,
    )
    db.add(ocr_data)

    audit_service.record(
        db,
        action=AuditAction.DOCUMENT_UPLOADED,
        user_id=current_user.id,
        user_role=current_user.role,
        request_id=req.id,
        details={"filename": document.original_filename},
    )
    audit_service.record(
        db,
        action=AuditAction.OCR_COMPLETED,
        user_id=current_user.id,
        user_role=current_user.role,
        request_id=req.id,
        details={"status": document.status.value},
    )

    db.commit()
    db.refresh(ocr_data)

    return OCRResultOut(
        document_id=str(document.id),
        raw_text=ocr_data.raw_text,
        extracted_fields=ocr_data.extracted_fields,
        corrected_fields=ocr_data.corrected_fields,
        confidence=ocr_data.confidence,
    )


@router.get("", response_model=list[DocumentOut])
def list_documents(
    request_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    req = _get_request_or_404(db, request_id)
    _authorize(db, req, current_user)
    return db.query(Document).filter(Document.request_id == req.id).order_by(Document.uploaded_at.desc()).all()


@router.get("/{document_id}/ocr", response_model=OCRResultOut)
def get_ocr_result(
    request_id: uuid.UUID,
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    req = _get_request_or_404(db, request_id)
    _authorize(db, req, current_user)

    ocr = db.query(OCRData).filter(OCRData.document_id == document_id).first()
    if not ocr:
        raise HTTPException(status_code=404, detail="OCR data not found for this document.")

    return OCRResultOut(
        document_id=str(document_id),
        raw_text=ocr.raw_text,
        extracted_fields=ocr.extracted_fields,
        corrected_fields=ocr.corrected_fields,
        confidence=ocr.confidence,
    )


@router.put("/{document_id}/ocr", response_model=OCRResultOut)
def update_ocr_fields(
    request_id: uuid.UUID,
    document_id: uuid.UUID,
    payload: OCRFieldsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Citizen reviews and edits OCR-extracted fields before final submission."""
    req = _get_request_or_404(db, request_id)
    _authorize(db, req, current_user)

    ocr = db.query(OCRData).filter(OCRData.document_id == document_id).first()
    if not ocr:
        raise HTTPException(status_code=404, detail="OCR data not found for this document.")

    ocr.corrected_fields = payload.corrected_fields
    db.commit()
    db.refresh(ocr)

    return OCRResultOut(
        document_id=str(document_id),
        raw_text=ocr.raw_text,
        extracted_fields=ocr.extracted_fields,
        corrected_fields=ocr.corrected_fields,
        confidence=ocr.confidence,
    )
