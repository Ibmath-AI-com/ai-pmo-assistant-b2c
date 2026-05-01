import pytest


async def _create_template(client, code="CT001"):
    resp = await client.post("/api/v1/templates", json={
        "template_code": code,
        "template_name": f"Template {code}",
        "template_body": "original: {{ value }}",
        "status": "active",
    })
    assert resp.status_code == 201
    return resp.json()["template_id"]


async def _create_version(client, tid):
    resp = await client.post(f"/api/v1/templates/{tid}/versions", json={})
    assert resp.status_code == 201
    return resp.json()["template_version_id"]


@pytest.mark.asyncio
async def test_create_custom(client):
    tid = await _create_template(client, "CC001")
    vid = await _create_version(client, tid)
    resp = await client.post(f"/api/v1/templates/{tid}/custom", json={
        "template_version_id": vid,
        "custom_name": "My Custom",
        "custom_body": "custom: {{ value }}",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["custom_body"] == "custom: {{ value }}"
    assert data["custom_name"] == "My Custom"


@pytest.mark.asyncio
async def test_get_custom(client):
    tid = await _create_template(client, "GC001")
    vid = await _create_version(client, tid)
    await client.post(f"/api/v1/templates/{tid}/custom", json={"template_version_id": vid, "custom_body": "get custom body"})
    resp = await client.get(f"/api/v1/templates/{tid}/custom")
    assert resp.status_code == 200
    assert resp.json()["custom_body"] == "get custom body"


@pytest.mark.asyncio
async def test_update_custom(client):
    tid = await _create_template(client, "UC001")
    vid = await _create_version(client, tid)
    await client.post(f"/api/v1/templates/{tid}/custom", json={"template_version_id": vid, "custom_body": "initial body"})
    resp = await client.put(f"/api/v1/templates/{tid}/custom", json={"custom_body": "updated body"})
    assert resp.status_code == 200
    assert resp.json()["custom_body"] == "updated body"


@pytest.mark.asyncio
async def test_get_custom_not_found(client):
    tid = await _create_template(client, "NC001")
    resp = await client.get(f"/api/v1/templates/{tid}/custom")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_duplicate_custom_rejected(client):
    tid = await _create_template(client, "DC001")
    vid = await _create_version(client, tid)
    await client.post(f"/api/v1/templates/{tid}/custom", json={"template_version_id": vid, "custom_body": "body1"})
    resp = await client.post(f"/api/v1/templates/{tid}/custom", json={"template_version_id": vid, "custom_body": "body2"})
    assert resp.status_code == 409
