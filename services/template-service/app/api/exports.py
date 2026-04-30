from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db
from db.models.template import GeneratedDocument
from app.services import storage_service

router = APIRouter()


def _doc_out(d) -> dict[str, Any]:
    return {
        "generated_document_id": str(d.generated_document_id),
        "template_id": str(d.template_id) if d.template_id else None,
        "organization_id": str(d.organization_id) if d.organization_id else None,
        "document_name": d.document_name,
        "document_format": d.document_format,
        "document_url": d.document_url,
        "document_size_bytes": d.document_size_bytes,
        "status": d.status,
        "created_at": d.created_at.isoformat() if d.created_at else None,
    }


@router.get("")
async def list_generated(
    template_id: uuid.UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    stmt = select(GeneratedDocument).where(GeneratedDocument.organization_id == user.organization_id)
    if template_id:
        stmt = stmt.where(GeneratedDocument.template_id == template_id)
    stmt = stmt.order_by(GeneratedDocument.created_at.desc())
    result = await db.execute(stmt)
    return [_doc_out(d) for d in result.scalars().all()]


@router.get("/{doc_id}")
async def get_generated(
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    stmt = select(GeneratedDocument).where(
        GeneratedDocument.generated_document_id == doc_id,
        GeneratedDocument.organization_id == user.organization_id,
    )
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Generated document not found")
    return _doc_out(doc)


@router.get("/{doc_id}/download")
async def download_generated(
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    stmt = select(GeneratedDocument).where(
        GeneratedDocument.generated_document_id == doc_id,
        GeneratedDocument.organization_id == user.organization_id,
    )
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Generated document not found")
    if not doc.document_url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not available")
    url = storage_service.get_download_url(doc.document_url)
    return {"download_url": url, "document_name": doc.document_name, "document_format": doc.document_format}
