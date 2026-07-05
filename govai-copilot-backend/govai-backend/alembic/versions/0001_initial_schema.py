"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-07-05

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

user_role_enum = postgresql.ENUM("citizen", "officer", "supervisor", "admin", name="user_role")
audit_user_role_enum = postgresql.ENUM("citizen", "officer", "supervisor", "admin", name="audit_user_role")
request_status_enum = postgresql.ENUM(
    "pending", "in_review", "more_info_required", "approved", "rejected", name="request_status"
)
document_status_enum = postgresql.ENUM("uploaded", "ocr_processing", "ocr_complete", "ocr_failed", name="document_status")
notification_type_enum = postgresql.ENUM(
    "status_change", "officer_remark", "more_info_request", "system", name="notification_type"
)
audit_action_enum = postgresql.ENUM(
    "request_submitted", "document_uploaded", "ocr_completed", "ai_response_generated",
    "status_changed", "remark_added", "login", "logout", name="audit_action"
)


def upgrade() -> None:
    bind = op.get_bind()
    user_role_enum.create(bind, checkfirst=True)
    audit_user_role_enum.create(bind, checkfirst=True)
    request_status_enum.create(bind, checkfirst=True)
    document_status_enum.create(bind, checkfirst=True)
    notification_type_enum.create(bind, checkfirst=True)
    audit_action_enum.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("username", sa.String(64), nullable=False, unique=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", user_role_enum, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_users_username", "users", ["username"])
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "citizens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("address", sa.String(500), nullable=True),
        sa.Column("aadhaar_number_masked", sa.String(20), nullable=True),
    )
    op.create_index("ix_citizens_user_id", "citizens", ["user_id"])

    op.create_table(
        "officers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("department", sa.String(120), nullable=False),
        sa.Column("designation", sa.String(120), nullable=True),
    )
    op.create_index("ix_officers_user_id", "officers", ["user_id"])
    op.create_index("ix_officers_department", "officers", ["department"])

    op.create_table(
        "requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("request_number", sa.String(40), nullable=False, unique=True),
        sa.Column("citizen_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("citizens.id", ondelete="CASCADE"), nullable=False),
        sa.Column("service_type", sa.String(120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", request_status_enum, nullable=False, server_default="pending"),
        sa.Column("assigned_officer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("officers.id", ondelete="SET NULL"), nullable=True),
        sa.Column("officer_remarks", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_requests_request_number", "requests", ["request_number"])
    op.create_index("ix_requests_citizen_id", "requests", ["citizen_id"])
    op.create_index("ix_requests_service_type", "requests", ["service_type"])
    op.create_index("ix_requests_status", "requests", ["status"])
    op.create_index("ix_requests_assigned_officer_id", "requests", ["assigned_officer_id"])
    op.create_index("ix_requests_created_at", "requests", ["created_at"])

    op.create_table(
        "documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("request_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("requests.id", ondelete="CASCADE"), nullable=False),
        sa.Column("original_filename", sa.String(255), nullable=False),
        sa.Column("stored_path", sa.String(500), nullable=False),
        sa.Column("mime_type", sa.String(100), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("status", document_status_enum, nullable=False, server_default="uploaded"),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_documents_request_id", "documents", ["request_id"])

    op.create_table(
        "ocr_data",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("document_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("raw_text", sa.Text(), nullable=True),
        sa.Column("extracted_fields", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("corrected_fields", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_ocr_data_document_id", "ocr_data", ["document_id"])

    op.create_table(
        "ai_responses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("request_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("requests.id", ondelete="CASCADE"), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("response_text", sa.Text(), nullable=False),
        sa.Column("model_used", sa.String(120), nullable=False),
        sa.Column("retrieved_context", postgresql.JSONB(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_ai_responses_request_id", "ai_responses", ["request_id"])

    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("request_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("requests.id", ondelete="CASCADE"), nullable=True),
        sa.Column("type", notification_type_enum, nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])
    op.create_index("ix_notifications_request_id", "notifications", ["request_id"])
    op.create_index("ix_notifications_created_at", "notifications", ["created_at"])

    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("user_role", audit_user_role_enum, nullable=True),
        sa.Column("action", audit_action_enum, nullable=False),
        sa.Column("request_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("requests.id", ondelete="SET NULL"), nullable=True),
        sa.Column("previous_status", sa.String(40), nullable=True),
        sa.Column("new_status", sa.String(40), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("details", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"])
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"])
    op.create_index("ix_audit_logs_request_id", "audit_logs", ["request_id"])
    op.create_index("ix_audit_logs_timestamp", "audit_logs", ["timestamp"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("notifications")
    op.drop_table("ai_responses")
    op.drop_table("ocr_data")
    op.drop_table("documents")
    op.drop_table("requests")
    op.drop_table("officers")
    op.drop_table("citizens")
    op.drop_table("users")

    bind = op.get_bind()
    audit_action_enum.drop(bind, checkfirst=True)
    notification_type_enum.drop(bind, checkfirst=True)
    document_status_enum.drop(bind, checkfirst=True)
    request_status_enum.drop(bind, checkfirst=True)
    audit_user_role_enum.drop(bind, checkfirst=True)
    user_role_enum.drop(bind, checkfirst=True)
