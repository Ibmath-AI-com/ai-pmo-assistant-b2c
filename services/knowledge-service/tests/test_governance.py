import uuid
import pytest


async def _make_document(client) -> str:
    col_resp = await client.post("/api/v1/knowledge/collections", json={
        "collection_code": f"GC-{uuid.uuid4().hex[:6]}",
        "collection_name": "Gov Collection",
    })
    col_id = col_resp.json()["knowledge_collection_id"]
    doc_resp = await client.post("/api/v1/knowledge/documents", json={
        "knowledge_collection_id": col_id,
        "title": f"Gov Doc {uuid.uuid4().hex[:6]}",
    })
    return doc_resp.json()["knowledge_document_id"]


@pytest.mark.asyncio
async def test_set_governance(client):
    doc_id = await _make_document(client)
    resp = await client.put(f"/api/v1/knowledge/documents/{doc_id}/governance", json={
        "classification_level": "Internal",
        "department": "Engineering",
        "document_owner": "Alice",
        "review_status": "pending",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["classification_level"] == "Internal"
    assert data["department"] == "Engineering"
    assert data["document_owner"] == "Alice"
    assert data["knowledge_document_id"] == doc_id


@pytest.mark.asyncio
async def test_governance_appears_in_document_detail(client):
    doc_id = await _make_document(client)
    await client.put(f"/api/v1/knowledge/documents/{doc_id}/governance", json={
        "classification_level": "Confidential",
        "department": "Legal",
    })
    resp = await client.get(f"/api/v1/knowledge/documents/{doc_id}")
    assert resp.status_code == 200
    gov = resp.json()["governance"]
    assert gov is not None
    assert gov["classification_level"] == "Confidential"
    assert gov["department"] == "Legal"


@pytest.mark.asyncio
async def test_update_governance(client):
    doc_id = await _make_document(client)
    await client.put(f"/api/v1/knowledge/documents/{doc_id}/governance", json={
        "classification_level": "Public",
    })
    # Update
    resp = await client.put(f"/api/v1/knowledge/documents/{doc_id}/governance", json={
        "classification_level": "Restricted",
        "document_owner": "Bob",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["classification_level"] == "Restricted"
    assert data["document_owner"] == "Bob"
    # Same governance record (upsert)
    assert data["knowledge_document_id"] == doc_id


@pytest.mark.asyncio
async def test_governance_with_dates(client):
    doc_id = await _make_document(client)
    resp = await client.put(f"/api/v1/knowledge/documents/{doc_id}/governance", json={
        "classification_level": "Internal",
        "effective_date": "2026-01-01",
        "review_date": "2026-06-01",
        "expiry_date": "2027-01-01",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["effective_date"] == "2026-01-01"
    assert data["review_date"] == "2026-06-01"
    assert data["expiry_date"] == "2027-01-01"
