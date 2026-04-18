import uuid

import pytest
import pytest_asyncio


@pytest_asyncio.fixture
async def make_skill():
    from db.models.skill import Skill
    from tests.conftest import TestSessionLocal

    async def _create(code: str = "TEST_SKILL", skill_type: str = "prompt_chain") -> uuid.UUID:
        sid = uuid.uuid4()
        async with TestSessionLocal() as session:
            skill = Skill(
                skill_id=sid,
                skill_code=code,
                skill_name=f"Skill {code}",
                skill_type=skill_type,
                skill_config_json={},
            )
            session.add(skill)
            await session.commit()
        return sid

    return _create


@pytest.mark.asyncio
async def test_map_skill_to_persona(client, make_skill):
    persona = await client.post("/api/v1/personas", json={
        "persona_code": "SK-01",
        "persona_name": "Skill Test",
        "persona_category": "PMO",
    })
    persona_id = persona.json()["persona_id"]
    skill_id = str(await make_skill("PMO_CHAIN"))

    resp = await client.post(f"/api/v1/personas/{persona_id}/skills", json={
        "skill_id": skill_id,
        "priority_order": 3,
        "is_auto_trigger": True,
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["skill_id"] == skill_id
    assert data["priority_order"] == 3
    assert data["is_auto_trigger"] is True


@pytest.mark.asyncio
async def test_list_persona_skills(client, make_skill):
    persona = await client.post("/api/v1/personas", json={
        "persona_code": "SK-02",
        "persona_name": "List Test",
        "persona_category": "PMO",
    })
    persona_id = persona.json()["persona_id"]
    s1 = str(await make_skill("CHAIN_A"))
    s2 = str(await make_skill("FILTER_B", "rag_filter"))

    await client.post(f"/api/v1/personas/{persona_id}/skills", json={"skill_id": s1})
    await client.post(f"/api/v1/personas/{persona_id}/skills", json={"skill_id": s2})

    resp = await client.get(f"/api/v1/personas/{persona_id}/skills")
    assert resp.status_code == 200
    rows = resp.json()
    assert len(rows) == 2
    skill_ids = {r["skill_id"] for r in rows}
    assert {s1, s2} == skill_ids
    assert all("skill" in r and r["skill"]["skill_code"] for r in rows)


@pytest.mark.asyncio
async def test_remap_skill_updates_fields(client, make_skill):
    persona = await client.post("/api/v1/personas", json={
        "persona_code": "SK-03",
        "persona_name": "Remap Test",
        "persona_category": "PMO",
    })
    persona_id = persona.json()["persona_id"]
    skill_id = str(await make_skill("REMAP_S"))

    r1 = await client.post(f"/api/v1/personas/{persona_id}/skills", json={
        "skill_id": skill_id,
        "priority_order": 1,
    })
    assert r1.status_code == 201

    r2 = await client.post(f"/api/v1/personas/{persona_id}/skills", json={
        "skill_id": skill_id,
        "priority_order": 7,
        "is_auto_trigger": True,
    })
    assert r2.status_code == 201
    assert r2.json()["priority_order"] == 7
    assert r2.json()["is_auto_trigger"] is True

    list_resp = await client.get(f"/api/v1/personas/{persona_id}/skills")
    assert len(list_resp.json()) == 1  # still one mapping


@pytest.mark.asyncio
async def test_unmap_skill(client, make_skill):
    persona = await client.post("/api/v1/personas", json={
        "persona_code": "SK-04",
        "persona_name": "Unmap Test",
        "persona_category": "PMO",
    })
    persona_id = persona.json()["persona_id"]
    skill_id = str(await make_skill("UNMAP_S"))

    await client.post(f"/api/v1/personas/{persona_id}/skills", json={"skill_id": skill_id})

    resp = await client.delete(f"/api/v1/personas/{persona_id}/skills/{skill_id}")
    assert resp.status_code == 204

    list_resp = await client.get(f"/api/v1/personas/{persona_id}/skills")
    assert list_resp.json() == []


@pytest.mark.asyncio
async def test_map_nonexistent_skill(client):
    persona = await client.post("/api/v1/personas", json={
        "persona_code": "SK-05",
        "persona_name": "Bad Skill",
        "persona_category": "PMO",
    })
    persona_id = persona.json()["persona_id"]

    resp = await client.post(f"/api/v1/personas/{persona_id}/skills", json={
        "skill_id": str(uuid.uuid4()),
    })
    assert resp.status_code == 404
