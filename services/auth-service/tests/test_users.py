import uuid
import pytest


async def _register(client, unique: str) -> dict:
    resp = await client.post("/api/v1/auth/register", json={
        "username": f"cruduser_{unique}",
        "email": f"crud_{unique}@example.com",
        "password": "testpass123",
        "first_name": "John",
        "last_name": "Doe",
    })
    assert resp.status_code == 201
    return resp.json()


@pytest.mark.asyncio
async def test_get_me(client):
    unique = uuid.uuid4().hex[:8]
    reg = await _register(client, unique)

    resp = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {reg['access_token']}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == f"crud_{unique}@example.com"
    assert data["first_name"] == "John"
    assert data["last_name"] == "Doe"


@pytest.mark.asyncio
async def test_get_user_by_id(client):
    unique = uuid.uuid4().hex[:8]
    reg = await _register(client, unique)

    resp = await client.get(
        f"/api/v1/users/{reg['user_id']}",
        headers={"Authorization": f"Bearer {reg['access_token']}"},
    )
    assert resp.status_code == 200
    assert resp.json()["user_id"] == reg["user_id"]


@pytest.mark.asyncio
async def test_get_unknown_user(client):
    unique = uuid.uuid4().hex[:8]
    reg = await _register(client, unique)

    resp = await client.get(
        f"/api/v1/users/{uuid.uuid4()}",
        headers={"Authorization": f"Bearer {reg['access_token']}"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_user_profile(client):
    unique = uuid.uuid4().hex[:8]
    reg = await _register(client, unique)

    resp = await client.put(
        f"/api/v1/users/{reg['user_id']}",
        json={"first_name": "Jane", "job_title": "PMO Manager"},
        headers={"Authorization": f"Bearer {reg['access_token']}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["first_name"] == "Jane"
    assert data["job_title"] == "PMO Manager"


@pytest.mark.asyncio
async def test_patch_user_status(client):
    unique = uuid.uuid4().hex[:8]
    reg = await _register(client, unique)

    resp = await client.patch(
        f"/api/v1/users/{reg['user_id']}/status",
        json={"status": "inactive"},
        headers={"Authorization": f"Bearer {reg['access_token']}"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "inactive"


@pytest.mark.asyncio
async def test_patch_invalid_status(client):
    unique = uuid.uuid4().hex[:8]
    reg = await _register(client, unique)

    resp = await client.patch(
        f"/api/v1/users/{reg['user_id']}/status",
        json={"status": "deleted"},
        headers={"Authorization": f"Bearer {reg['access_token']}"},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_list_users(client):
    unique = uuid.uuid4().hex[:8]
    reg = await _register(client, unique)

    resp = await client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {reg['access_token']}"},
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1
