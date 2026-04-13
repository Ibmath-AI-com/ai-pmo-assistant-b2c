import uuid
import pytest


async def _make_document(client) -> str:
    col_resp = await client.post("/api/v1/knowledge/collections", json={
        "collection_code": f"TC-{uuid.uuid4().hex[:6]}",
        "collection_name": "Tag Collection",
    })
    col_id = col_resp.json()["knowledge_collection_id"]
    doc_resp = await client.post("/api/v1/knowledge/documents", json={
        "knowledge_collection_id": col_id,
        "title": f"Tag Doc {uuid.uuid4().hex[:6]}",
    })
    return doc_resp.json()["knowledge_document_id"]


@pytest.mark.asyncio
async def test_set_tags(client):
    doc_id = await _make_document(client)
    resp = await client.put(f"/api/v1/knowledge/documents/{doc_id}/tags", json=[
        {"tag_name": "python", "tag_type": "keyword"},
        {"tag_name": "backend", "tag_type": "domain"},
        {"tag_name": "v2", "tag_type": "sdlc"},
    ])
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 3
    names = {t["tag_name"] for t in data}
    assert names == {"python", "backend", "v2"}


@pytest.mark.asyncio
async def test_tags_appear_in_document_detail(client):
    doc_id = await _make_document(client)
    await client.put(f"/api/v1/knowledge/documents/{doc_id}/tags", json=[
        {"tag_name": "infra", "tag_type": "domain"},
    ])
    resp = await client.get(f"/api/v1/knowledge/documents/{doc_id}")
    tags = resp.json()["tags"]
    assert any(t["tag_name"] == "infra" for t in tags)


@pytest.mark.asyncio
async def test_replace_tags_removes_old(client):
    doc_id = await _make_document(client)
    await client.put(f"/api/v1/knowledge/documents/{doc_id}/tags", json=[
        {"tag_name": "old1", "tag_type": "keyword"},
        {"tag_name": "old2", "tag_type": "keyword"},
        {"tag_name": "old3", "tag_type": "keyword"},
        {"tag_name": "old4", "tag_type": "keyword"},
        {"tag_name": "old5", "tag_type": "keyword"},
    ])
    # Replace with 3 new tags
    resp = await client.put(f"/api/v1/knowledge/documents/{doc_id}/tags", json=[
        {"tag_name": "new1", "tag_type": "keyword"},
        {"tag_name": "new2", "tag_type": "domain"},
        {"tag_name": "new3", "tag_type": "project_type"},
    ])
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 3
    names = {t["tag_name"] for t in data}
    assert "old1" not in names
    assert "new1" in names


@pytest.mark.asyncio
async def test_clear_tags(client):
    doc_id = await _make_document(client)
    await client.put(f"/api/v1/knowledge/documents/{doc_id}/tags", json=[
        {"tag_name": "remove-me", "tag_type": "keyword"},
    ])
    resp = await client.put(f"/api/v1/knowledge/documents/{doc_id}/tags", json=[])
    assert resp.status_code == 200
    assert resp.json() == []
