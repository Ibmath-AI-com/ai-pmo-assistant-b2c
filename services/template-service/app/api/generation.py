from __future__ import annotations

import os
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db
from db.models.template import GeneratedDocument
from app.services.template_service import TemplateService
from app.services import render_service, export_pdf, export_docx, export_pptx, storage_service
from app.events.publishers import publish_event

router = APIRouter()
_svc = TemplateService()


class GenerateRequest(BaseModel):
    template_id: uuid.UUID
    input_data: dict = Field(default_factory=dict)
    output_format: str = Field(..., pattern="^(pdf|docx|pptx)$")
    document_name: str | None = None


class PreviewRequest(BaseModel):
    input_data: dict = Field(default_factory=dict)


def _doc_out(d) -> dict[str, Any]:
    return {
        "generated_document_id": str(d.generated_document_id),
        "file_id": str(d.file_id) if d.file_id else None,
        "generated_output_id": str(d.generated_output_id) if d.generated_output_id else None,
        "document_format": d.document_format,
        "generated_by": str(d.generated_by) if d.generated_by else None,
        "created_at": d.created_at.isoformat() if d.created_at else None,
    }


@router.post("/generate", status_code=201)
async def generate_document(
    body: GenerateRequest,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    template = await _svc.get_by_id(db, body.template_id)

    custom = await _svc.get_custom(db, body.template_id, user.organization_id)
    template_body = custom.custom_body if custom else (template.template_body or "")

    doc_record = GeneratedDocument(
        generated_document_id=uuid.uuid4(),
        document_format=body.output_format,
        generated_by=user.user_id,
    )
    db.add(doc_record)
    await db.flush()

    tmp_path = None
    storage_key = None
    try:
        if body.output_format == "pdf":
            html = render_service.render_to_html(template_body, body.input_data)
            tmp_path = export_pdf.create_temp_pdf(html)
        elif body.output_format == "docx":
            rendered = render_service.render(template_body, body.input_data)
            tmp_path = export_docx.create_temp_docx(rendered)
        elif body.output_format == "pptx":
            tmp_path = export_pptx.create_temp_pptx(body.input_data)

        filename = body.document_name or f"{template.template_name}.{body.output_format}"
        storage_key = storage_service.upload_generated(tmp_path, filename)

    except Exception as exc:
        await db.commit()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)

    await db.commit()

    download_url = storage_service.get_download_url(storage_key) if storage_key else None
    await publish_event("document.generated", {"generated_document_id": str(doc_record.generated_document_id)})

    return {**_doc_out(doc_record), "download_url": download_url}


@router.get("/generated")
async def list_generated(
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    stmt = select(GeneratedDocument).where(GeneratedDocument.generated_by == user.user_id)
    result = await db.execute(stmt)
    return [_doc_out(d) for d in result.scalars().all()]


@router.get("/generated/{doc_id}")
async def get_generated(
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    stmt = select(GeneratedDocument).where(
        GeneratedDocument.generated_document_id == doc_id,
        GeneratedDocument.generated_by == user.user_id,
    )
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Generated document not found")
    return _doc_out(doc)


@router.post("/templates/{template_id}/preview")
async def preview_template(
    template_id: uuid.UUID,
    body: PreviewRequest,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    template = await _svc.get(db, template_id, user.organization_id)
    custom = await _svc.get_custom(db, template_id, user.organization_id)
    template_body = custom.custom_body if custom else (template.template_body or "")
    html = render_service.render_to_html(template_body, body.input_data)
    return {"html": html}
