"""
In-memory WebSocket connection registry, keyed by user_id.

This is intentionally simple (single-process). For multi-instance deployment,
swap the in-memory dict for a Redis pub/sub backplane (same public interface:
connect/disconnect/send_to_user/broadcast) without touching callers.
"""
import json
import uuid
from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[uuid.UUID, set[WebSocket]] = defaultdict(set)

    async def connect(self, user_id: uuid.UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[user_id].add(websocket)

    def disconnect(self, user_id: uuid.UUID, websocket: WebSocket) -> None:
        self._connections[user_id].discard(websocket)
        if not self._connections[user_id]:
            del self._connections[user_id]

    async def send_to_user(self, user_id: uuid.UUID, payload: dict) -> None:
        """Best-effort push; dead sockets are dropped silently."""
        dead: list[WebSocket] = []
        for ws in self._connections.get(user_id, set()):
            try:
                await ws.send_text(json.dumps(payload, default=str))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(user_id, ws)


manager = ConnectionManager()
