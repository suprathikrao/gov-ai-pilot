"""
Authentication endpoints: citizen self-registration, login (citizens and
officers share this endpoint — role comes from the DB record), token refresh.

Officers/Admins are provisioned out-of-band (seed script / admin panel), not
via public self-registration.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.deps import get_client_ip
from app.models.user import User, Citizen
from app.models.enums import UserRole, AuditAction
from app.schemas.auth import CitizenRegister, Token, TokenRefreshRequest, UserOut
from app.services import audit_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_citizen(payload: CitizenRegister, db: Session = Depends(get_db)):
    if db.query(User).filter((User.username == payload.username) | (User.email == payload.email)).first():
        raise HTTPException(status_code=400, detail="Username or email already registered.")

    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=UserRole.CITIZEN,
    )
    db.add(user)
    db.flush()

    citizen = Citizen(user_id=user.id, full_name=payload.full_name, phone=payload.phone, address=payload.address)
    db.add(citizen)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password.")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled.")

    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    refresh_token = create_refresh_token(subject=str(user.id))

    audit_service.record(
        db,
        action=AuditAction.LOGIN,
        user_id=user.id,
        user_role=user.role,
        ip_address=get_client_ip(request),
    )
    db.commit()

    return Token(access_token=access_token, refresh_token=refresh_token, role=user.role)


@router.post("/refresh", response_model=Token)
def refresh_token(payload: TokenRefreshRequest, db: Session = Depends(get_db)):
    try:
        decoded = decode_token(payload.refresh_token)
        if decoded.get("type") != "refresh":
            raise ValueError("Not a refresh token")
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.")

    user = db.get(User, uuid.UUID(decoded["sub"]))
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive.")

    new_access = create_access_token(subject=str(user.id), role=user.role.value)
    new_refresh = create_refresh_token(subject=str(user.id))
    return Token(access_token=new_access, refresh_token=new_refresh, role=user.role)
