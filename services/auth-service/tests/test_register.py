import uuid
import pytest


@pytest.mark.asyncio
async def test_register_b2c_success(client):
    unique = uuid.uuid4().hex[:8]
    resp = await client.post("/api/v1/auth/register", json={
        "username": f"testuser_{unique}",
        "email": f"test_{unique}@example.com",
        "password": "securepass123",
        "first_name": "Test",
        "last_name": "User",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert "user_id" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    unique = uuid.uuid4().hex[:8]
    payload = {
        "username": f"user_{unique}",
        "email": f"dup_{unique}@example.com",
        "password": "pass123",
    }
    r1 = await client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 201

    # Same email, different username
    payload["username"] = f"user2_{unique}"
    r2 = await client.post("/api/v1/auth/register", json=payload)
    assert r2.status_code == 409


@pytest.mark.asyncio
async def test_register_duplicate_username(client):
    unique = uuid.uuid4().hex[:8]
    payload = {
        "username": f"sameuser_{unique}",
        "email": f"first_{unique}@example.com",
        "password": "pass123",
    }
    r1 = await client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 201

    payload["email"] = f"second_{unique}@example.com"
    r2 = await client.post("/api/v1/auth/register", json=payload)
    assert r2.status_code == 409


@pytest.mark.asyncio
async def test_register_short_password(client):
    resp = await client.post("/api/v1/auth/register", json={
        "username": "shortpass",
        "email": "shortpass@example.com",
        "password": "abc",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_register_invalid_email(client):
    resp = await client.post("/api/v1/auth/register", json={
        "username": "bademail",
        "email": "not-an-email",
        "password": "validpass123",
    })
    assert resp.status_code == 422
