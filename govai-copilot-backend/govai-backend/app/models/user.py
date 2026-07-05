"""
Users table plus role-specific profile tables (Citizens, Officers).

Design note: we keep one `users` table for auth (login, hashed password, role)
and separate `citizens` / `officers` tables for role-specific profile data.
This avoids nullable-everywhere columns and keeps RBAC checks on a single
`role` column.
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base
from app.models.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole, name="user_role"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    citizen_profile: Mapped["Citizen"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    officer_profile: Mapped["Officer"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")


class Citizen(Base):
    __tablename__ = "citizens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    aadhaar_number_masked: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # store masked; never full plaintext

    user: Mapped["User"] = relationship(back_populates="citizen_profile")


class Officer(Base):
    __tablename__ = "officers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    department: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    designation: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)

    user: Mapped["User"] = relationship(back_populates="officer_profile")
