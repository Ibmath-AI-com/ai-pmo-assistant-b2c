import pytest


@pytest.mark.asyncio
async def test_persona_workspace_mapping(client):
    ws_resp = await client.post("/api/v1/workspaces", json={"workspace_name": "Map WS"})
    ws_id = ws_resp.json()["workspace_id"]

    p_resp = await client.post("/api/v1/personas", json={
        "persona_code": "MAP-01",
        "persona_name": "Map Persona",
        "persona_category": "PMO",
    })
    persona_id = p_resp.json()["persona_id"]

    # Map persona → workspace
    map_resp = await client.post(f"/api/v1/personas/{persona_id}/workspaces", json={
        "workspace_id": ws_id,
        "is_default": True,
    })
    assert map_resp.status_code == 201
    assert map_resp.json()["is_default"] is True

    # List from persona side
    list_resp = await client.get(f"/api/v1/personas/{persona_id}/workspaces")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 1

    # List from workspace side
    ws_list_resp = await client.get(f"/api/v1/workspaces/{ws_id}/personas")
    assert ws_list_resp.status_code == 200
    assert len(ws_list_resp.json()) >= 1

    # Set as default persona on workspace
    default_resp = await client.put(f"/api/v1/workspaces/{ws_id}/default-persona", json={"persona_id": persona_id})
    assert default_resp.status_code == 200
    assert default_resp.json()["default_persona_id"] == persona_id

    # Unmap
    del_resp = await client.delete(f"/api/v1/personas/{persona_id}/workspaces/{ws_id}")
    assert del_resp.status_code == 204
