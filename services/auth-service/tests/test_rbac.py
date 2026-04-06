import uuid
import pytest


async def _register_and_login(client, unique: str) -> dict:
    resp = await client.post("/api/v1/auth/register", json={
        "username": f"rbacuser_{unique}",
        "email": f"rbac_{unique}@example.com",
        "password": "testpass123",
    })
    assert resp.status_code == 201
    return resp.json()


async def _create_org(client, token: str, unique: str) -> dict:
    resp = await client.post(
        "/api/v1/organizations",
        json={
            "organization_code": f"ORG_{unique}",
            "organization_name": f"Test Org {unique}",
            "tenant_type": "B2B",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    return resp.json()


@pytest.mark.asyncio
async def test_create_role(client):
    unique = uuid.uuid4().hex[:8]
    reg = await _register_and_login(client, unique)
    org = await _create_org(client, reg["access_token"], unique)

    resp = await client.post(
        "/api/v1/roles",
        json={
            "organization_id": str(org["organization_id"]),
            "role_code": f"ADMIN_{unique}",
            "role_name": "Administrator",
            "description": "Full access",
        },
        headers={"Authorization": f"Bearer {reg['access_token']}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["role_code"] == f"ADMIN_{unique}"
    assert data["permissions"] == []


@pytest.mark.asyncio
async def test_list_roles(client):
    unique = uuid.uuid4().hex[:8]
    reg = await _register_and_login(client, unique)
    org = await _create_org(client, reg["access_token"], unique)

    # Create a role
    await client.post(
        "/api/v1/roles",
        json={
            "organization_id": str(org["organization_id"]),
            "role_code": f"VIEWER_{unique}",
            "role_name": "Viewer",
        },
        headers={"Authorization": f"Bearer {reg['access_token']}"},
    )

    resp = await client.get(
        f"/api/v1/roles?org_id={org['organization_id']}",
        headers={"Authorization": f"Bearer {reg['access_token']}"},
    )
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


@pytest.mark.asyncio
async def test_update_role(client):
    unique = uuid.uuid4().hex[:8]
    reg = await _register_and_login(client, unique)
    org = await _create_org(client, reg["access_token"], unique)

    create = await client.post(
        "/api/v1/roles",
        json={
            "organization_id": str(org["organization_id"]),
            "role_code": f"EDITOR_{unique}",
            "role_name": "Editor",
        },
        headers={"Authorization": f"Bearer {reg['access_token']}"},
    )
    role_id = create.json()["role_id"]

    resp = await client.put(
        f"/api/v1/roles/{role_id}",
        json={"role_name": "Senior Editor"},
        headers={"Authorization": f"Bearer {reg['access_token']}"},
    )
    assert resp.status_code == 200
    assert resp.json()["role_name"] == "Senior Editor"


@pytest.mark.asyncio
async def test_list_permissions(client):
    unique = uuid.uuid4().hex[:8]
    reg = await _register_and_login(client, unique)

    resp = await client.get(
        "/api/v1/roles/permissions",
        headers={"Authorization": f"Bearer {reg['access_token']}"},
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
