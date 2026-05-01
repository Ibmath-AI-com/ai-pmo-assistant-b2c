import pytest


async def _create(client, code="VER001", body="v1 body"):
    resp = await client.post("/api/v1/templates", json={
        "template_code": code,
        "template_name": f"Template {code}",
        "template_body": body,
        "status": "active",
    })
    assert resp.status_code == 201
    return resp.json()["template_id"]


@pytest.mark.asyncio
async def test_auto_version_on_update(client):
    tid = await _create(client, "AV001", "original")
    await client.put(f"/api/v1/templates/{tid}", json={"template_body": "update 1"})
    await client.put(f"/api/v1/templates/{tid}", json={"template_body": "update 2"})
    resp = await client.get(f"/api/v1/templates/{tid}/versions")
    assert resp.status_code == 200
    versions = resp.json()
    assert len(versions) >= 2


@pytest.mark.asyncio
async def test_manual_save_version(client):
    tid = await _create(client, "MV001", "saved body")
    resp = await client.post(f"/api/v1/templates/{tid}/versions", json={"effective_from": "2026-01-01T00:00:00"})
    assert resp.status_code == 201
    assert resp.json()["effective_from"] is not None


@pytest.mark.asyncio
async def test_get_specific_version(client):
    tid = await _create(client, "GV001", "body for version")
    save_resp = await client.post(f"/api/v1/templates/{tid}/versions", json={})
    vid = save_resp.json()["template_version_id"]
    resp = await client.get(f"/api/v1/templates/{tid}/versions/{vid}")
    assert resp.status_code == 200
    assert resp.json()["template_version_id"] == vid


@pytest.mark.asyncio
async def test_restore_version(client):
    tid = await _create(client, "RV001", "original body")
    save_resp = await client.post(f"/api/v1/templates/{tid}/versions", json={})
    vid = save_resp.json()["template_version_id"]
    original_body = save_resp.json()["template_body"]

    await client.put(f"/api/v1/templates/{tid}", json={"template_body": "changed body"})

    resp = await client.put(f"/api/v1/templates/{tid}/versions/{vid}/restore")
    assert resp.status_code == 200
    assert resp.json()["template_body"] == original_body


@pytest.mark.asyncio
async def test_versions_ordered_desc(client):
    tid = await _create(client, "ORD001", "v0")
    await client.put(f"/api/v1/templates/{tid}", json={"template_body": "v1"})
    await client.put(f"/api/v1/templates/{tid}", json={"template_body": "v2"})
    await client.put(f"/api/v1/templates/{tid}", json={"template_body": "v3"})
    resp = await client.get(f"/api/v1/templates/{tid}/versions")
    versions = resp.json()
    assert versions[0]["version_no"] > versions[-1]["version_no"]
