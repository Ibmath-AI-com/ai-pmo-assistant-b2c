import uuid
import pytest


@pytest.mark.asyncio
async def test_access_control(client):
    create_resp = await client.post("/api/v1/personas", json={
        "persona_code": "ACC-01",
        "persona_name": "Access Test",
        "persona_category": "Risk",
    })
    persona_id = create_resp.json()["persona_id"]

    user_ids = [str(uuid.uuid4()) for _ in range(3)]

    resp = await client.put(f"/api/v1/personas/{persona_id}/access", json={"user_ids": user_ids})
    assert resp.status_code == 200
    assert len(resp.json()) == 3

    # Verify nested in GET
    detail = await client.get(f"/api/v1/personas/{persona_id}")
    assert len(detail.json()["access_roles"]) == 3

    # Remove one by re-setting with 2 users
    resp2 = await client.put(f"/api/v1/personas/{persona_id}/access", json={"user_ids": user_ids[:2]})
    assert resp2.status_code == 200
    assert len(resp2.json()) == 2


@pytest.mark.asyncio
async def test_domain_tags(client):
    create_resp = await client.post("/api/v1/personas", json={
        "persona_code": "TAG-01",
        "persona_name": "Tag Test",
        "persona_category": "Portfolio",
    })
    persona_id = create_resp.json()["persona_id"]

    tags = [
        {"tag_name": "Agile", "tag_type": "sdlc"},
        {"tag_name": "Waterfall", "tag_type": "sdlc"},
        {"tag_name": "Infrastructure", "tag_type": "domain"},
        {"tag_name": "Finance", "tag_type": "domain"},
        {"tag_name": "IT", "tag_type": "project_type"},
    ]
    resp = await client.put(f"/api/v1/personas/{persona_id}/domain-tags", json={"tags": tags})
    assert resp.status_code == 200
    assert len(resp.json()) == 5

    # Remove 2 by re-setting with 3
    resp2 = await client.put(f"/api/v1/personas/{persona_id}/domain-tags", json={"tags": tags[:3]})
    assert resp2.status_code == 200
    assert len(resp2.json()) == 3
