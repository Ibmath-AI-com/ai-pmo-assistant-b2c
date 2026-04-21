import pytest


@pytest.mark.asyncio
async def test_create_and_update_behavior(client):
    create_resp = await client.post("/api/v1/personas", json={
        "persona_code": "BEH-01",
        "persona_name": "Behavior Test",
        "persona_category": "PMO",
    })
    persona_id = create_resp.json()["persona_id"]

    # Set behavior
    resp = await client.put(f"/api/v1/personas/{persona_id}/behavior", json={
        "system_instruction": "You are a helpful PMO advisor.",
        "tone_of_voice": "Executive",
        "response_format_preference": "Bullet Points",
        "default_language": "en",
        "temperature": 0.8,
        "max_response_length": 1024,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["tone_of_voice"] == "Executive"
    assert data["temperature"] == 0.8

    # GET persona — behavior nested
    detail = await client.get(f"/api/v1/personas/{persona_id}")
    assert detail.json()["behavior_setting"]["tone_of_voice"] == "Executive"

    # Update behavior
    resp2 = await client.put(f"/api/v1/personas/{persona_id}/behavior", json={
        "system_instruction": "Updated instruction.",
        "tone_of_voice": "Analytical",
        "temperature": 0.5,
        "max_response_length": 2048,
    })
    assert resp2.status_code == 200
    assert resp2.json()["tone_of_voice"] == "Analytical"
