from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db
from app.services import project_service as svc
from app.events.publishers import publish_event

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    project_name: str = Field(..., min_length=1, max_length=256)
    objective: str | None = None
    instructions: str | None = None


class ProjectUpdate(BaseModel):
    project_name: str | None = Field(None, min_length=1, max_length=256)
    objective: str | None = None
    instructions: str | None = None


class ProjectOut(BaseModel):
    project_id: UUID
    created_by: UUID
    project_name: str
    objective: str | None
    instructions: str | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FileOut(BaseModel):
    project_file_id: UUID
    project_id: UUID
    file_id: UUID
    source: str
    original_file_name: str
    mime_type: str | None
    file_size_bytes: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _project_out(p) -> dict:
    return {
        "project_id": str(p.project_id),
        "created_by": str(p.created_by),
        "project_name": p.project_name,
        "objective": p.objective,
        "instructions": p.instructions,
        "status": p.status,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }


def _file_out(pf, f) -> dict:
    return {
        "project_file_id": str(pf.project_file_id),
        "project_id": str(pf.project_id),
        "file_id": str(pf.file_id),
        "source": pf.source,
        "original_file_name": f.original_file_name,
        "mime_type": f.mime_type,
        "file_size_bytes": f.file_size_bytes,
        "created_at": pf.created_at.isoformat() if pf.created_at else None,
    }


# ── Project CRUD ──────────────────────────────────────────────────────────────

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await svc.create_project(db, {
        "created_by": current_user.user_id,
        "project_name": body.project_name,
        "objective": body.objective,
        "instructions": body.instructions,
    })
    await db.commit()
    await publish_event("project.created", {"project_id": str(project.project_id)})
    return _project_out(project)


@router.get("")
async def list_projects(
    limit: int = Query(default=5, ge=1, le=100),
    skip: int = Query(default=0, ge=0),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    projects = await svc.list_projects(db, current_user.user_id, limit=limit, skip=skip)
    return [_project_out(p) for p in projects]


@router.get("/{project_id}")
async def get_project(
    project_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await svc.get_project(db, project_id, current_user.user_id)
    return _project_out(project)


@router.patch("/{project_id}")
async def update_project(
    project_id: UUID,
    body: ProjectUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await svc.get_project(db, project_id, current_user.user_id)
    updated = await svc.update_project(db, project, body.model_dump(exclude_none=True))
    await db.commit()
    await publish_event("project.updated", {"project_id": str(project_id)})
    return _project_out(updated)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await svc.get_project(db, project_id, current_user.user_id)
    await svc.soft_delete_project(db, project)
    await db.commit()
    await publish_event("project.deleted", {"project_id": str(project_id)})


# ── Project Files ─────────────────────────────────────────────────────────────

@router.post("/{project_id}/files", status_code=status.HTTP_201_CREATED)
async def upload_file(
    project_id: UUID,
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await svc.get_project(db, project_id, current_user.user_id)

    file_bytes = await file.read()
    pf, f = await svc.add_project_file(
        db,
        project_id=project_id,
        uploaded_by=current_user.user_id,
        file_bytes=file_bytes,
        filename=file.filename or "upload",
        mime_type=file.content_type or "application/octet-stream",
        source="upload",
    )
    await db.commit()
    return _file_out(pf, f)


@router.get("/{project_id}/files")
async def list_files(
    project_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await svc.get_project(db, project_id, current_user.user_id)
    rows = await svc.list_project_files(db, project_id)
    return [_file_out(pf, f) for pf, f in rows]


@router.delete("/{project_id}/files/{project_file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    project_id: UUID,
    project_file_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await svc.get_project(db, project_id, current_user.user_id)
    await svc.remove_project_file(db, project_file_id, project_id)
    await db.commit()
