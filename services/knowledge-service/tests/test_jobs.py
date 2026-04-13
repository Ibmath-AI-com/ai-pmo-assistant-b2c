import uuid
from unittest.mock import patch
import pytest


async def _make_document(client) -> str:
    col_resp = await client.post("/api/v1/knowledge/collections", json={
        "collection_code": f"JC-{uuid.uuid4().hex[:6]}",
        "collection_name": "Jobs Collection",
    })
    col_id = col_resp.json()["knowledge_collection_id"]
    doc_resp = await client.post("/api/v1/knowledge/documents", json={
        "knowledge_collection_id": col_id,
        "title": f"Jobs Doc {uuid.uuid4().hex[:6]}",
    })
    return doc_resp.json()["knowledge_document_id"]


@pytest.mark.asyncio
async def test_reindex_creates_job(client):
    doc_id = await _make_document(client)
    with patch("app.api.documents.dispatch_ingestion"):
        resp = await client.post(f"/api/v1/knowledge/documents/{doc_id}/reindex")
    assert resp.status_code == 202
    data = resp.json()
    assert data["job_type"] == "reindex"
    assert data["job_status"] == "queued"
    assert data["knowledge_document_id"] == doc_id


@pytest.mark.asyncio
async def test_list_jobs(client):
    doc_id = await _make_document(client)
    with patch("app.api.documents.dispatch_ingestion"):
        await client.post(f"/api/v1/knowledge/documents/{doc_id}/reindex")

    resp = await client.get("/api/v1/knowledge/jobs")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1


@pytest.mark.asyncio
async def test_list_jobs_filter_by_document(client):
    doc_id = await _make_document(client)
    with patch("app.api.documents.dispatch_ingestion"):
        await client.post(f"/api/v1/knowledge/documents/{doc_id}/reindex")

    resp = await client.get(f"/api/v1/knowledge/jobs?document_id={doc_id}")
    assert resp.status_code == 200
    jobs = resp.json()
    assert all(j["knowledge_document_id"] == doc_id for j in jobs)


@pytest.mark.asyncio
async def test_list_jobs_filter_by_status(client):
    doc_id = await _make_document(client)
    with patch("app.api.documents.dispatch_ingestion"):
        await client.post(f"/api/v1/knowledge/documents/{doc_id}/reindex")

    resp = await client.get("/api/v1/knowledge/jobs?status=queued")
    assert resp.status_code == 200
    jobs = resp.json()
    assert all(j["job_status"] == "queued" for j in jobs)


@pytest.mark.asyncio
async def test_get_job_detail(client):
    doc_id = await _make_document(client)
    with patch("app.api.documents.dispatch_ingestion"):
        job_resp = await client.post(f"/api/v1/knowledge/documents/{doc_id}/reindex")
    job_id = job_resp.json()["document_ingestion_job_id"]

    resp = await client.get(f"/api/v1/knowledge/jobs/{job_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["document_ingestion_job_id"] == job_id
    assert "progress_pct" in data


@pytest.mark.asyncio
async def test_get_job_not_found(client):
    resp = await client.get(f"/api/v1/knowledge/jobs/{uuid.uuid4()}")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_multiple_reindex_creates_multiple_jobs(client):
    doc_id = await _make_document(client)
    with patch("app.api.documents.dispatch_ingestion"):
        await client.post(f"/api/v1/knowledge/documents/{doc_id}/reindex")
        await client.post(f"/api/v1/knowledge/documents/{doc_id}/reindex")

    resp = await client.get(f"/api/v1/knowledge/jobs?document_id={doc_id}")
    assert len(resp.json()) >= 2
