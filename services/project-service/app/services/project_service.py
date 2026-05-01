from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db.models.project import Project, ProjectFile
from db.models.file import File


async def create_project(db: AsyncSession, data: dict) -> Project:
    project = Project(**data)
    db.add(project)
    await db.flush()
    await db.refresh(project)
    return project


async def list_projects(
    db: AsyncSession,
    user_id: UUID,
    limit: int = 5,
    skip: int = 0,
) -> list[Project]:
    stmt = (
        select(Project)
        .where(Project.created_by == user_id)
        .where(Project.status != "deleted")
        .order_by(Project.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_project(db: AsyncSession, project_id: UUID, user_id: UUID) -> Project:
    project = await db.get(Project, project_id)
    if not project or project.created_by != user_id or project.status == "deleted":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


async def update_project(db: AsyncSession, project: Project, data: dict) -> Project:
    for key, value in data.items():
        setattr(project, key, value)
    await db.flush()
    await db.refresh(project)
    return project


async def soft_delete_project(db: AsyncSession, project: Project) -> Project:
    project.status = "deleted"
    project.deleted_at = datetime.now(timezone.utc)
    await db.flush()
    return project


async def add_project_file(
    db: AsyncSession,
    project_id: UUID,
    uploaded_by: UUID,
    file_bytes: bytes,
    filename: str,
    mime_type: str,
    source: str = "upload",
) -> tuple[ProjectFile, File]:
    from app.services.storage_service import upload_file as minio_upload

    storage_path, checksum = minio_upload(file_bytes, filename)

    file_row = File(
        uploaded_by_id=uploaded_by,
        original_file_name=filename,
        mime_type=mime_type,
        storage_path=storage_path,
        file_size_bytes=len(file_bytes),
        checksum=checksum,
        upload_status="completed",
        status="active",
    )
    db.add(file_row)
    await db.flush()

    pf = ProjectFile(
        project_id=project_id,
        file_id=file_row.file_id,
        source=source,
    )
    db.add(pf)
    await db.flush()
    await db.refresh(pf)
    return pf, file_row


async def list_project_files(db: AsyncSession, project_id: UUID) -> list[tuple[ProjectFile, File]]:
    stmt = (
        select(ProjectFile, File)
        .join(File, ProjectFile.file_id == File.file_id)
        .where(ProjectFile.project_id == project_id)
        .where(File.status != "deleted")
        .order_by(ProjectFile.created_at)
    )
    result = await db.execute(stmt)
    return list(result.all())


async def remove_project_file(
    db: AsyncSession, project_file_id: UUID, project_id: UUID
) -> None:
    from app.services.storage_service import delete_file as minio_delete

    stmt = (
        select(ProjectFile, File)
        .join(File, ProjectFile.file_id == File.file_id)
        .where(ProjectFile.project_file_id == project_file_id)
        .where(ProjectFile.project_id == project_id)
    )
    result = await db.execute(stmt)
    row = result.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    pf, file_row = row
    try:
        if file_row.storage_path:
            minio_delete(file_row.storage_path)
    except Exception:
        pass

    file_row.status = "deleted"
    await db.delete(pf)
    await db.flush()
