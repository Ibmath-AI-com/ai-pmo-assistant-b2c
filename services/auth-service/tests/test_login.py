import uuid
import pytest


async def _register(client, unique: str) -> dict:
    resp = await client.post("/api/v1/auth/register", json={
        "username": f"loginuser_{unique}",
        "email": f"login_{unique}@example.com",
        "password": "testpass123",
    })
    assert resp.status_code == 201
    return resp.json()


@pytest.mark.asyncio
async def test_login_success(client):
    unique = uuid.uuid4().hex[:8]
    await _register(client, unique)

    resp = await client.post("/api/v1/auth/login", json={
        "email": f"login_{unique}@example.com",
        "password": "testpass123",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    unique = uuid.uuid4().hex[:8]
    await _register(client, unique)

    resp = await client.post("/api/v1/auth/login", json={
        "email": f"login_{unique}@example.com",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_email(client):
    resp = await client.post("/api/v1/auth/login", json={
        "email": "nobody@nowhere.com",
        "password": "pass123",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token(client):
    unique = uuid.uuid4().hex[:8]
    reg = await _register(client, unique)

    resp = await client.post("/api/v1/auth/refresh", json={
        "refresh_token": reg["refresh_token"],
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_refresh_with_access_token_fails(client):
    unique = uuid.uuid4().hex[:8]
    reg = await _register(client, unique)

    resp = await client.post("/api/v1/auth/refresh", json={
        "refresh_token": reg["access_token"],  # wrong token type
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_logout(client):
    unique = uuid.uuid4().hex[:8]
    reg = await _register(client, unique)

    resp = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {reg['access_token']}"},
    )
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_protected_route_without_token(client):
    resp = await client.get("/api/v1/users/me")
    assert resp.status_code == 401  # HTTPBearer returns 401 when no credentials


@pytest.mark.asyncio
async def test_protected_route_with_token(client):
    unique = uuid.uuid4().hex[:8]
    reg = await _register(client, unique)

    resp = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {reg['access_token']}"},
    )
    assert resp.status_code == 200
    assert resp.json()["email"] == f"login_{unique}@example.com"
