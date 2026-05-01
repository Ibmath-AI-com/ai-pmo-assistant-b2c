import uuid
import pytest


@pytest.mark.asyncio
async def test_create_collection(client):
    resp = await client.post("/api/v1/knowledge/collections", json={
        "collection_code": f"COL-{uuid.uuid4().hex[:6]}",
        "collection_name": "Test Collection",
        "description": "A test collection",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["collection_name"] == "Test Collection"
    assert data["status"] == "active"
    assert "knowledge_collection_id" in data


@pytest.mark.asyncio
async def test_list_collections(client):
    code = uuid.uuid4().hex[:6]
    await client.post("/api/v1/knowledge/collections", json={
        "collection_code": f"LIST-{code}",
        "collection_name": f"List Test {code}",
    })
    resp = await client.get("/api/v1/knowledge/collections")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1


@pytest.mark.asyncio
async def test_create_three_and_list(client):
    codes = [uuid.uuid4().hex[:6] for _ in range(3)]
    for c in codes:
        await client.post("/api/v1/knowledge/collections", json={
            "collection_code": f"BULK-{c}",
            "collection_name": f"Bulk {c}",
        })
    resp = await client.get("/api/v1/knowledge/collections")
    assert resp.status_code == 200
    assert len(resp.json()) >= 3


@pytest.mark.asyncio
async def test_get_collection_detail(client):
    resp = await client.post("/api/v1/knowledge/collections", json={
        "collection_code": f"DET-{uuid.uuid4().hex[:6]}",
        "collection_name": "Detail Test",
    })
    col_id = resp.json()["knowledge_collection_id"]

    resp = await client.get(f"/api/v1/knowledge/collections/{col_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert "document_count" in data
    assert data["document_count"] == 0


@pytest.mark.asyncio
async def test_update_collection(client):
    resp = await client.post("/api/v1/knowledge/collections", json={
        "collection_code": f"UPD-{uuid.uuid4().hex[:6]}",
        "collection_name": "Original Name",
    })
    col_id = resp.json()["knowledge_collection_id"]

    resp = await client.put(f"/api/v1/knowledge/collections/{col_id}", json={
        "collection_name": "Updated Name",
    })
    assert resp.status_code == 200
    assert resp.json()["collection_name"] == "Updated Name"


@pytest.mark.asyncio
async def test_org_isolation(client):
    """Collections created by org1 are not visible when querying as org2."""
    from app.main import app
    from auth.dependencies import get_current_user
    from tests.conftest import USER2_ID, make_current_user

    col_name = f"User1Only-{uuid.uuid4().hex[:6]}"
    resp = await client.post("/api/v1/knowledge/collections", json={
        "collection_code": f"ISO-{uuid.uuid4().hex[:6]}",
        "collection_name": col_name,
    })
    assert resp.status_code == 201

    # Switch to user2 and verify the collection is not visible
    app.dependency_overrides[get_current_user] = lambda: make_current_user(user_id=USER2_ID)
    resp2 = await client.get("/api/v1/knowledge/collections")
    app.dependency_overrides[get_current_user] = lambda: make_current_user()  # restore

    names = [c["collection_name"] for c in resp2.json()]
    assert col_name not in names


@pytest.mark.asyncio
async def test_get_collection_not_found(client):
    resp = await client.get(f"/api/v1/knowledge/collections/{uuid.uuid4()}")
    assert resp.status_code == 404
