import pytest


@pytest.mark.asyncio
async def test_create_template(client):
    resp = await client.post("/api/v1/templates", json={
        "template_code": "RPT001",
        "template_name": "Status Report",
        "template_body": "# {{ project_name }}\nDate: {{ report_date }}",
        "output_format": "pdf",
        "status": "active",
    })

    assert resp.status_code == 201
    data = resp.json()
    assert data["template_code"] == "RPT001"
    assert data["template_body"] == "# {{ project_name }}\nDate: {{ report_date }}"


@pytest.mark.asyncio
async def test_list_templates(client):
    await client.post("/api/v1/templates", json={
        "template_code": "LST001",
        "template_name": "List Template",
        "status": "active",
    })

    resp = await client.get("/api/v1/templates")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_filter_by_status(client):
    await client.post("/api/v1/templates", json={
        "template_code": "DFT001",
        "template_name": "Draft Template",
        "status": "draft",
    })

    resp = await client.get("/api/v1/templates?status=draft")
    assert resp.status_code == 200

    items = resp.json()
    assert all(t["status"] == "draft" for t in items)


@pytest.mark.asyncio
async def test_get_template(client):
    create_resp = await client.post("/api/v1/templates", json={
        "template_code": "GET001",
        "template_name": "Get Test",
        "template_body": "Hello {{ name }}",
        "status": "active",
    })

    tid = create_resp.json()["template_id"]

    resp = await client.get(f"/api/v1/templates/{tid}")
    assert resp.status_code == 200
    assert resp.json()["template_id"] == tid
    assert "template_body" in resp.json()


@pytest.mark.asyncio
async def test_update_template(client):
    create_resp = await client.post("/api/v1/templates", json={
        "template_code": "UPD001",
        "template_name": "Update Test",
        "template_body": "original",
        "status": "active",
    })

    tid = create_resp.json()["template_id"]

    resp = await client.put(
        f"/api/v1/templates/{tid}",
        json={"template_name": "Updated Name", "template_body": "updated body"}
    )

    assert resp.status_code == 200
    assert resp.json()["template_name"] == "Updated Name"


@pytest.mark.asyncio
async def test_status_change(client):
    create_resp = await client.post("/api/v1/templates", json={
        "template_code": "STS001",
        "template_name": "Status Test",
        "status": "active",
    })

    tid = create_resp.json()["template_id"]

    resp = await client.patch(
        f"/api/v1/templates/{tid}/status",
        json={"status": "inactive"}
    )

    assert resp.status_code == 200
    assert resp.json()["status"] == "inactive"


@pytest.mark.asyncio
async def test_list_families(client):
    resp = await client.get("/api/v1/templates/families")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)