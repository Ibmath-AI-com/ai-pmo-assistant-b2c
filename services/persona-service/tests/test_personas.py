import uuid
import pytest


PERSONA_PAYLOAD = {
    "persona_code": "PMO-ADV",
    "persona_name": "PMO Advisor",
    "persona_category": "PMO",
    "short_description": "A PMO advisor persona",
}


@pytest.mark.asyncio
async def test_create_persona(client):
    resp = await client.post("/api/v1/personas", json=PERSONA_PAYLOAD)
    assert resp.status_code == 201
    data = resp.json()
    assert data["persona_code"] == "PMO-ADV"
    assert data["status"] == "active"


@pytest.mark.asyncio
async def test_list_personas(client):
    await client.post("/api/v1/personas", json={**PERSONA_PAYLOAD, "persona_code": "LIST-1"})
    await client.post("/api/v1/personas", json={**PERSONA_PAYLOAD, "persona_code": "LIST-2", "persona_category": "Risk"})
    resp = await client.get("/api/v1/personas")
    assert resp.status_code == 200
    assert len(resp.json()) >= 2


@pytest.mark.asyncio
async def test_filter_by_category(client):
    await client.post("/api/v1/personas", json={**PERSONA_PAYLOAD, "persona_code": "RISK-1", "persona_category": "Risk"})
    resp = await client.get("/api/v1/personas?category=Risk")
    assert resp.status_code == 200
    for p in resp.json():
        assert p["persona_category"] == "Risk"


@pytest.mark.asyncio
async def test_get_persona_detail(client):
    create_resp = await client.post("/api/v1/personas", json=PERSONA_PAYLOAD)
    persona_id = create_resp.json()["persona_id"]
    resp = await client.get(f"/api/v1/personas/{persona_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert "behavior_setting" in data
    assert "model_policy" in data
    assert "domain_tags" in data
    assert "access_roles" in data
    assert "workspace_mappings" in data


@pytest.mark.asyncio
async def test_update_persona(client):
    create_resp = await client.post("/api/v1/personas", json=PERSONA_PAYLOAD)
    persona_id = create_resp.json()["persona_id"]
    resp = await client.put(f"/api/v1/personas/{persona_id}", json={"persona_name": "Updated Advisor"})
    assert resp.status_code == 200
    assert resp.json()["persona_name"] == "Updated Advisor"


@pytest.mark.asyncio
async def test_deactivate_persona(client):
    create_resp = await client.post("/api/v1/personas", json=PERSONA_PAYLOAD)
    persona_id = create_resp.json()["persona_id"]
    resp = await client.patch(f"/api/v1/personas/{persona_id}/status", json={"status": "inactive"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "inactive"
