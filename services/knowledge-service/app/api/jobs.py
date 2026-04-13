from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db
from app.services.ingestion_service import get_job, list_jobs

router = APIRouter()


class JobResponse(BaseModel):
    document_ingestion_job_id: UUID
    knowledge_document_id: UUID
    job_type: str
    job_status: str
    total_chunks: int | None
    processed_chunks: int | None
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class JobDetailResponse(JobResponse):
    progress_pct: float | None = None

    @classmethod
    def from_job(cls, job) -> "JobDetailResponse":
        data = cls.model_validate(job)
        if job.total_chunks and job.total_chunks > 0:
            data.progress_pct = round((job.processed_chunks or 0) / job.total_chunks * 100, 1)
        return data


@router.get("", response_model=list[JobResponse])
async def list_all(
    document_id: UUID | None = Query(None),
    job_status: str | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return await list_jobs(db, document_id=document_id, job_status=job_status)


@router.get("/{job_id}", response_model=JobDetailResponse)
async def get_one(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    job = await get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return JobDetailResponse.from_job(job)
