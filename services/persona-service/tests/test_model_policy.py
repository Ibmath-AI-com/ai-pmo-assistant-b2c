import pytest


@pytest.mark.asyncio
async def test_create_and_update_model_policy(client):
    create_resp = await client.post("/api/v1/personas", json={
        "persona_code": "POL-01",
        "persona_name": "Policy Test",
        "persona_category": "Strategy",
    })
    persona_id = create_resp.json()["persona_id"]

    resp = await client.put(f"/api/v1/personas/{persona_id}/model-policy", json={
        "chat_mode": "assistant",
        "use_rag": False,
        "use_internal_llm": True,
        "use_external_llm": False,
        "classification_limit": "Internal",
        "allow_file_upload": True,
        "allow_external_sources": False,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["classification_limit"] == "Internal"
    assert data["use_internal_llm"] is True
    assert data["use_rag"] is False

    # GET — policy nested
    detail = await client.get(f"/api/v1/personas/{persona_id}")
    assert detail.json()["model_policy"]["classification_limit"] == "Internal"
    assert detail.json()["model_policy"]["use_internal_llm"] is True

    # Update
    resp2 = await client.put(f"/api/v1/personas/{persona_id}/model-policy", json={
        "use_external_llm": True,
        "classification_limit": "Confidential",
        "allow_file_upload": False,
        "allow_external_sources": True,
    })
    assert resp2.status_code == 200
    assert resp2.json()["classification_limit"] == "Confidential"
    assert resp2.json()["allow_file_upload"] is False
    assert resp2.json()["allow_external_sources"] is True


@pytest.mark.asyncio
async def test_set_allowed_models(client):
    import uuid
    create_resp = await client.post("/api/v1/personas", json={
        "persona_code": "AM-01",
        "persona_name": "Allowed Models Test",
        "persona_category": "Strategy",
    })
    persona_id = create_resp.json()["persona_id"]

    m1 = str(uuid.uuid4())
    m2 = str(uuid.uuid4())
    resp = await client.put(f"/api/v1/personas/{persona_id}/allowed-models", json={
        "models": [
            {"model_id": m1, "priority_order": 1, "is_default": True},
            {"model_id": m2, "priority_order": 2, "is_default": False},
        ]
    })
    assert resp.status_code == 200
    rows = resp.json()
    assert len(rows) == 2
    assert {r["model_id"] for r in rows} == {m1, m2}
    default = next(r for r in rows if r["is_default"])
    assert default["model_id"] == m1

    # Replace with a single model
    m3 = str(uuid.uuid4())
    resp2 = await client.put(f"/api/v1/personas/{persona_id}/allowed-models", json={
        "models": [{"model_id": m3, "priority_order": 1, "is_default": True}]
    })
    assert len(resp2.json()) == 1
    assert resp2.json()[0]["model_id"] == m3
