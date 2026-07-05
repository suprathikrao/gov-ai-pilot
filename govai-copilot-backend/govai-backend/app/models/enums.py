"""
Shared enums for roles, statuses, and log actions.
Using Python enums backed by Postgres native ENUM types keeps invalid states
out of the database, not just out of the API layer.
"""
import enum


class UserRole(str, enum.Enum):
    CITIZEN = "citizen"
    OFFICER = "officer"
    SUPERVISOR = "supervisor"
    ADMIN = "admin"


class RequestStatus(str, enum.Enum):
    PENDING = "pending"
    IN_REVIEW = "in_review"
    MORE_INFO_REQUIRED = "more_info_required"
    APPROVED = "approved"
    REJECTED = "rejected"


class DocumentStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    OCR_PROCESSING = "ocr_processing"
    OCR_COMPLETE = "ocr_complete"
    OCR_FAILED = "ocr_failed"


class NotificationType(str, enum.Enum):
    STATUS_CHANGE = "status_change"
    OFFICER_REMARK = "officer_remark"
    MORE_INFO_REQUEST = "more_info_request"
    SYSTEM = "system"


class AuditAction(str, enum.Enum):
    REQUEST_SUBMITTED = "request_submitted"
    DOCUMENT_UPLOADED = "document_uploaded"
    OCR_COMPLETED = "ocr_completed"
    AI_RESPONSE_GENERATED = "ai_response_generated"
    STATUS_CHANGED = "status_changed"
    REMARK_ADDED = "remark_added"
    LOGIN = "login"
    LOGOUT = "logout"
