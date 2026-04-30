from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db
from app.services import chat_service as svc

router = APIRouter()


def _attachment_out(a) -> dict:
    return {
        "attachment_id": str(a.attachment_id),
        "session_id": str(a.session_id),
        "message_id": str(a.message_id) if a.message_id else None,
        "file_id": str(a.file_id) if a.file_id else None,
        "attachment_type": a.attachment_type,
        "original_file_name": a.original_file_name,
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }


@router.post("/sessions/{session_id}/attachments", status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    session_id: UUID,
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await svc.get_session(db, session_id, current_user.user_id)
    mime = file.content_type or "application/octet-stream"
    att_type = "image" if mime.startswith("image/") else "document"
    att = await svc.add_attachment(
        db, session_id, None, None, att_type, file.filename
    )
    await db.commit()
    return _attachment_out(att)


@router.get("/sessions/{session_id}/attachments")
async def list_attachments(
    session_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await svc.get_session(db, session_id, current_user.user_id)
    attachments = await svc.list_attachments(db, session_id)
    return [_attachment_out(a) for a in attachments]
