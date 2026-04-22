import uuid
import pytest


async def _make_collection(client) -> str:
    resp = await client.post("/api/v1/knowledge/collections", json={
        "collection_code": f"C-{uuid.uuid4().hex[:6]}",
        "collection_name": f"Col {uuid.uuid4().hex[:6]}",
    })
    assert resp.status_code == 201
    return resp.json()["knowledge_collection_id"]


@pytest.mark.asyncio
async def test_create_document(client):
    col_id = await _make_collection(client)
    resp = await client.post("/api/v1/knowledge/documents", json={
        "knowledge_collection_id": col_id,
        "title": "My First Document",
        "document_type": "policy",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "My First Document"
    assert data["status"] == "draft"


@pytest.mark.asyncio
async def test_list_documents(client):
    col_id = await _make_collection(client)
    await client.post("/api/v1/knowledge/documents", json={
        "knowledge_collection_id": col_id,
        "title": "List Doc",
    })
    resp = await client.get("/api/v1/knowledge/documents")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1


@pytest.mark.asyncio
async def test_list_filter_by_collection(client):
    col_id = await _make_collection(client)
    await client.post("/api/v1/knowledge/documents", json={
        "knowledge_collection_id": col_id,
        "title": "Filtered Doc",
    })
    resp = await client.get(f"/api/v1/knowledge/documents?knowledge_collection_id={col_id}")
    assert resp.status_code == 200
    assert all(d["knowledge_collection_id"] == col_id for d in resp.json())


@pytest.mark.asyncio
async def test_list_filter_by_title(client):
    col_id = await _make_collection(client)
    unique = uuid.uuid4().hex[:8]
    await client.post("/api/v1/knowledge/documents", json={
        "knowledge_collection_id": col_id,
        "title": f"UniqueTitle-{unique}",
    })
    resp = await client.get(f"/api/v1/knowledge/documents?search=UniqueTitle-{unique}")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


@pytest.mark.asyncio
async def test_list_filter_by_status(client):
    col_id = await _make_collection(client)
    await client.post("/api/v1/knowledge/documents", json={
        "knowledge_collection_id": col_id,
        "title": "Draft Doc",
    })
    resp = await client.get("/api/v1/knowledge/documents?status=draft")
    assert resp.status_code == 200
    assert all(d["status"] == "draft" for d in resp.json())


@pytest.mark.asyncio
async def test_get_document_detail(client):
    col_id = await _make_collection(client)
    resp = await client.post("/api/v1/knowledge/documents", json={
        "knowledge_collection_id": col_id,
        "title": "Detail Doc",
    })
    doc_id = resp.json()["knowledge_document_id"]

    resp = await client.get(f"/api/v1/knowledge/documents/{doc_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert "governance" in data
    assert "tags" in data
    assert "access_entries" in data
    assert "chunk_count" in data


@pytest.mark.asyncio
async def test_update_document(client):
    col_id = await _make_collection(client)
    resp = await client.post("/api/v1/knowledge/documents", json={
        "knowledge_collection_id": col_id,
        "title": "Old Title",
    })
    doc_id = resp.json()["knowledge_document_id"]

    resp = await client.put(f"/api/v1/knowledge/documents/{doc_id}", json={
        "title": "New Title",
        "summary_description": "Updated summary",
    })
    assert resp.status_code == 200
    assert resp.json()["title"] == "New Title"


@pytest.mark.asyncio
async def test_change_status(client):
    col_id = await _make_collection(client)
    resp = await client.post("/api/v1/knowledge/documents", json={
        "knowledge_collection_id": col_id,
        "title": "Status Doc",
    })
    doc_id = resp.json()["knowledge_document_id"]

    resp = await client.patch(f"/api/v1/knowledge/documents/{doc_id}/status", json={
        "status": "active",
    })
    assert resp.status_code == 200
    assert resp.json()["status"] == "active"


@pytest.mark.asyncio
async def test_archive_document(client):
    col_id = await _make_collection(client)
    resp = await client.post("/api/v1/knowledge/documents", json={
        "knowledge_collection_id": col_id,
        "title": "Archive Doc",
    })
    doc_id = resp.json()["knowledge_document_id"]

    resp = await client.patch(f"/api/v1/knowledge/documents/{doc_id}/status", json={
        "status": "archived",
    })
    assert resp.status_code == 200
    assert resp.json()["status"] == "archived"


@pytest.mark.asyncio
async def test_document_not_found(client):
    resp = await client.get(f"/api/v1/knowledge/documents/{uuid.uuid4()}")
    assert resp.status_code == 404
