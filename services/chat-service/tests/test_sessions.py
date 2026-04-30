import pytest


@pytest.mark.asyncio
async def test_create_session(client):
    resp = await client.post("/api/v1/chat/sessions", json={"title": "Test Chat"})
    assert resp.status_code == 201
    data = resp.json()
    assert "chat_session_id" in data
    assert data["title"] == "Test Chat"
    assert data["status"] == "active"


@pytest.mark.asyncio
async def test_list_sessions(client):
    await client.post("/api/v1/chat/sessions", json={"title": "List Test"})
    resp = await client.get("/api/v1/chat/sessions")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert any(s["title"] == "List Test" for s in resp.json())


@pytest.mark.asyncio
async def test_get_session(client):
    create = await client.post("/api/v1/chat/sessions", json={"title": "Get Test"})
    sid = create.json()["chat_session_id"]

    resp = await client.get(f"/api/v1/chat/sessions/{sid}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["chat_session_id"] == sid
    assert "messages" in data


@pytest.mark.asyncio
async def test_update_session(client):
    create = await client.post("/api/v1/chat/sessions", json={"title": "Original Title"})
    sid = create.json()["chat_session_id"]

    resp = await client.put(f"/api/v1/chat/sessions/{sid}", json={"title": "Updated Title"})
    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated Title"


@pytest.mark.asyncio
async def test_archive_session(client):
    create = await client.post("/api/v1/chat/sessions", json={"title": "To Archive"})
    sid = create.json()["chat_session_id"]

    resp = await client.delete(f"/api/v1/chat/sessions/{sid}")
    assert resp.status_code == 204

    get_resp = await client.get(f"/api/v1/chat/sessions/{sid}")
    assert get_resp.json()["status"] == "archived"


@pytest.mark.asyncio
async def test_get_nonexistent_session(client):
    import uuid
    resp = await client.get(f"/api/v1/chat/sessions/{uuid.uuid4()}")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_session_with_no_title(client):
    resp = await client.post("/api/v1/chat/sessions", json={})
    assert resp.status_code == 201
    # title is optional; default is None when not provided
    assert "chat_session_id" in resp.json()


@pytest.mark.asyncio
async def test_list_sessions_pagination(client):
    for i in range(3):
        await client.post("/api/v1/chat/sessions", json={"title": f"Page {i}"})

    resp = await client.get("/api/v1/chat/sessions?limit=2&skip=0")
    assert resp.status_code == 200
    assert len(resp.json()) <= 2
