import uuid
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from app.services.chunking_service import ChunkResult, chunk_text


SAMPLE_MARKDOWN = """# Introduction

This document introduces the system architecture.

## Overview

The system consists of multiple microservices communicating via RabbitMQ.

## Components

Each component has a dedicated database schema.
"""


async def _make_document(client) -> tuple[str, str]:
    col_resp = await client.post("/api/v1/knowledge/collections", json={
        "collection_code": f"ING-{uuid.uuid4().hex[:6]}",
        "collection_name": "Ingestion Collection",
    })
    col_id = col_resp.json()["knowledge_collection_id"]
    doc_resp = await client.post("/api/v1/knowledge/documents", json={
        "knowledge_collection_id": col_id,
        "title": f"Ingestion Doc {uuid.uuid4().hex[:6]}",
    })
    return col_id, doc_resp.json()["knowledge_document_id"]


@pytest.mark.asyncio
async def test_chunk_text_basic():
    chunks = chunk_text(SAMPLE_MARKDOWN)
    assert len(chunks) >= 3
    titles = [c.chunk_title for c in chunks]
    assert "Introduction" in titles or any("Introduction" in (t or "") for t in titles)


@pytest.mark.asyncio
async def test_chunk_text_token_counts():
    chunks = chunk_text(SAMPLE_MARKDOWN)
    assert all(c.token_count > 0 for c in chunks)


@pytest.mark.asyncio
async def test_chunk_text_sequential_nos():
    chunks = chunk_text(SAMPLE_MARKDOWN)
    nos = [c.chunk_no for c in chunks]
    assert nos == list(range(1, len(chunks) + 1))


@pytest.mark.asyncio
async def test_chunk_large_section_creates_parent_children():
    large = "# Big Section\n\n" + ("Long sentence with lots of words. " * 100)
    chunks = chunk_text(large, max_tokens=50)
    parents = [c for c in chunks if c.parent_chunk_id is None]
    children = [c for c in chunks if c.parent_chunk_id is not None]
    assert len(parents) >= 1
    assert len(children) >= 1
    # All children point to a valid parent
    parent_ids = {c.chunk_id for c in parents}
    assert all(c.parent_chunk_id in parent_ids for c in children)


@pytest.mark.asyncio
async def test_reindex_triggers_job(client):
    _, doc_id = await _make_document(client)

    with patch("app.api.documents.dispatch_ingestion") as mock_dispatch:
        resp = await client.post(f"/api/v1/knowledge/documents/{doc_id}/reindex")

    assert resp.status_code == 202
    data = resp.json()
    assert data["job_type"] == "reindex"
    assert data["job_status"] == "queued"
    assert mock_dispatch.called
