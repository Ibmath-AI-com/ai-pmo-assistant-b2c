import uuid
import pytest


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


@pytest.mark.asyncio
async def test_knowledge_collections(client):
    create_resp = await client.post("/api/v1/personas", json={
        "persona_code": "KB-01",
        "persona_name": "KB Test",
        "persona_category": "Strategy",
    })
    persona_id = create_resp.json()["persona_id"]

    c1 = str(uuid.uuid4())
    c2 = str(uuid.uuid4())
    c3 = str(uuid.uuid4())
    resp = await client.put(f"/api/v1/personas/{persona_id}/knowledge", json={
        "collection_ids": [c1, c2, c3]
    })
    assert resp.status_code == 200
    assert len(resp.json()) == 3
    assert {r["knowledge_collection_id"] for r in resp.json()} == {c1, c2, c3}

    # Replace with 1
    resp2 = await client.put(f"/api/v1/personas/{persona_id}/knowledge", json={
        "collection_ids": [c1]
    })
    assert len(resp2.json()) == 1
    assert resp2.json()[0]["knowledge_collection_id"] == c1
