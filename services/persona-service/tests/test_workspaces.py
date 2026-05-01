import uuid
import pytest


@pytest.mark.asyncio
async def test_create_workspace(client):
    resp = await client.post("/api/v1/workspaces", json={
        "workspace_name": "Test Workspace",
        "workspace_code": "TW-001",
        "description": "A test workspace",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["workspace_name"] == "Test Workspace"
    assert data["workspace_code"] == "TW-001"
    assert data["status"] == "active"
    return data["workspace_id"]


@pytest.mark.asyncio
async def test_list_workspaces(client):
    await client.post("/api/v1/workspaces", json={"workspace_name": "List WS 1"})
    await client.post("/api/v1/workspaces", json={"workspace_name": "List WS 2"})
    resp = await client.get("/api/v1/workspaces")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 2


@pytest.mark.asyncio
async def test_get_workspace_detail(client):
    create_resp = await client.post("/api/v1/workspaces", json={"workspace_name": "Detail WS"})
    ws_id = create_resp.json()["workspace_id"]
    resp = await client.get(f"/api/v1/workspaces/{ws_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert "settings" in data
    assert "tags" in data
    assert "content_entities" in data


@pytest.mark.asyncio
async def test_update_workspace(client):
    create_resp = await client.post("/api/v1/workspaces", json={"workspace_name": "Update WS"})
    ws_id = create_resp.json()["workspace_id"]
    resp = await client.put(f"/api/v1/workspaces/{ws_id}", json={"workspace_name": "Updated Name"})
    assert resp.status_code == 200
    assert resp.json()["workspace_name"] == "Updated Name"


@pytest.mark.asyncio
async def test_deactivate_workspace(client):
    create_resp = await client.post("/api/v1/workspaces", json={"workspace_name": "Status WS"})
    ws_id = create_resp.json()["workspace_id"]
    resp = await client.patch(f"/api/v1/workspaces/{ws_id}/status", json={"status": "inactive"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "inactive"


@pytest.mark.asyncio
async def test_upsert_settings(client):
    create_resp = await client.post("/api/v1/workspaces", json={"workspace_name": "Settings WS"})
    ws_id = create_resp.json()["workspace_id"]

    resp = await client.put(f"/api/v1/workspaces/{ws_id}/settings", json={"settings": [
        {"setting_key": "theme", "setting_value": "dark", "value_type": "string"},
        {"setting_key": "max_users", "setting_value": "50", "value_type": "integer"},
        {"setting_key": "enable_ai", "setting_value": "true", "value_type": "boolean"},
    ]})
    assert resp.status_code == 200
    assert len(resp.json()) == 3

    detail = await client.get(f"/api/v1/workspaces/{ws_id}")
    keys = [s["setting_key"] for s in detail.json()["settings"]]
    assert "theme" in keys
    assert "max_users" in keys

    # Update one setting
    resp2 = await client.put(f"/api/v1/workspaces/{ws_id}/settings", json={"settings": [
        {"setting_key": "theme", "setting_value": "light", "value_type": "string"},
    ]})
    assert resp2.status_code == 200
    assert resp2.json()[0]["setting_value"] == "light"
