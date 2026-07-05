"""
WebSocket endpoint for real-time sync.

Browsers can't set custom headers on the WebSocket handshake, so the JWT
access token is passed as a query parameter: `wss://.../ws?token=<jwt>`.
Use short-lived access tokens (not the refresh token) here.
"""
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import decode_token
from app.models.user import User
from app.services.ws_manager import manager

router = APIRouter(tags=["websocket"])


def _authenticate_ws_token(token: str) -> uuid.UUID | None:
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        return uuid.UUID(payload["sub"])
    except (JWTError, ValueError, KeyError):
        return None


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    user_id = _authenticate_ws_token(token)
    if user_id is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    db: Session = SessionLocal()
    try:
        user = db.get(User, user_id)
        if not user or not user.is_active:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    finally:
        db.close()

    await manager.connect(user_id, websocket)
    try:
        while True:
            # Clients don't need to send anything; this just keeps the
            # connection open and lets us detect disconnects.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
