import uuid
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from db.base import get_db
from db.models.file import File
from auth.dependencies import CurrentUser, get_current_user
from app.services import storage_service

router = APIRouter()


class FileResponse(BaseModel):
    file_id: UUID
    original_file_name: str
    mime_type: str | None
    storage_path: str | None
    file_size_bytes: int | None
    checksum: str | None
    upload_status: str
    status: str

    model_config = {"from_attributes": True}


@router.post("/upload", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    file_bytes = await file.read()

    storage_path, checksum = storage_service.upload_file(
        file_bytes=file_bytes,
        filename=file.filename or "upload",
    )

    record = File(
        uploaded_by_id=current_user.user_id,
        original_file_name=file.filename or "upload",
        mime_type=file.content_type,
        storage_path=storage_path,
        file_size_bytes=len(file_bytes),
        checksum=checksum,
        upload_status="completed",
        status="active",
    )
    db.add(record)
    await db.flush()
    await db.refresh(record)
    return record


@router.get("/{file_id}", response_model=FileResponse)
async def get_file(
    file_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.get(File, file_id)
    if not result or result.status == "deleted":
        raise HTTPException(status_code=404, detail="File not found")
    return result


class DownloadResponse(BaseModel):
    download_url: str


@router.get("/{file_id}/download", response_model=DownloadResponse)
async def download_file(
    file_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.get(File, file_id)
    if not result or result.status == "deleted":
        raise HTTPException(status_code=404, detail="File not found")
    if not result.storage_path:
        raise HTTPException(status_code=404, detail="File has no storage path")

    url = storage_service.get_download_url(result.storage_path)
    return {"download_url": url}
