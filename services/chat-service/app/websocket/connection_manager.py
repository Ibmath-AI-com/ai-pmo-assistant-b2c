from __future__ import annotations

import asyncio
import json
import uuid
from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self._connections: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, session_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[session_id].append(websocket)

    def disconnect(self, session_id: str, websocket: WebSocket) -> None:
        conns = self._connections.get(session_id, [])
        if websocket in conns:
            conns.remove(websocket)

    async def send_to_session(self, session_id: str, data: dict) -> None:
        dead = []
        for ws in list(self._connections.get(session_id, [])):
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(session_id, ws)

    async def broadcast(self, data: dict) -> None:
        for session_id in list(self._connections.keys()):
            await self.send_to_session(session_id, data)


manager = ConnectionManager()
