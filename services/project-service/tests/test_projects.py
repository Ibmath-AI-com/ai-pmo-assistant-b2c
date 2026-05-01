import io
import pytest

PROJECT_PAYLOAD = {
    "project_name": "Alpha Initiative",
    "objective": "Improve delivery speed by 30%",
    "instructions": "Follow PMI methodology",
}


# ── Project CRUD ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_project(client):
    resp = await client.post("/api/v1/projects", json=PROJECT_PAYLOAD)
    assert resp.status_code == 201
    data = resp.json()
    assert data["project_name"] == "Alpha Initiative"
    assert data["status"] == "active"
    assert "project_id" in data


@pytest.mark.asyncio
async def test_create_project_missing_name(client):
    resp = await client.post("/api/v1/projects", json={"objective": "no name"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_list_projects_returns_only_own_org(client):
    await client.post("/api/v1/projects", json={**PROJECT_PAYLOAD, "project_name": "Proj A"})
    await client.post("/api/v1/projects", json={**PROJECT_PAYLOAD, "project_name": "Proj B"})
    resp = await client.get("/api/v1/projects")
    assert resp.status_code == 200
    names = [p["project_name"] for p in resp.json()]
    assert "Proj A" in names
    assert "Proj B" in names


@pytest.mark.asyncio
async def test_list_projects_default_limit_5(client):
    for i in range(7):
        await client.post("/api/v1/projects", json={**PROJECT_PAYLOAD, "project_name": f"Limit Test {i}"})
    resp = await client.get("/api/v1/projects")
    assert resp.status_code == 200
    assert len(resp.json()) <= 5


@pytest.mark.asyncio
async def test_get_project(client):
    create_resp = await client.post("/api/v1/projects", json=PROJECT_PAYLOAD)
    project_id = create_resp.json()["project_id"]
    resp = await client.get(f"/api/v1/projects/{project_id}")
    assert resp.status_code == 200
    assert resp.json()["project_id"] == project_id


@pytest.mark.asyncio
async def test_update_project(client):
    create_resp = await client.post("/api/v1/projects", json=PROJECT_PAYLOAD)
    project_id = create_resp.json()["project_id"]
    resp = await client.patch(f"/api/v1/projects/{project_id}", json={"project_name": "Updated Name"})
    assert resp.status_code == 200
    assert resp.json()["project_name"] == "Updated Name"


@pytest.mark.asyncio
async def test_soft_delete_project(client):
    create_resp = await client.post("/api/v1/projects", json=PROJECT_PAYLOAD)
    project_id = create_resp.json()["project_id"]

    del_resp = await client.delete(f"/api/v1/projects/{project_id}")
    assert del_resp.status_code == 204

    get_resp = await client.get(f"/api/v1/projects/{project_id}")
    assert get_resp.status_code == 404

    list_resp = await client.get("/api/v1/projects?limit=100")
    ids = [p["project_id"] for p in list_resp.json()]
    assert project_id not in ids


# ── Project Files ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_upload_file_to_project(client):
    create_resp = await client.post("/api/v1/projects", json=PROJECT_PAYLOAD)
    project_id = create_resp.json()["project_id"]

    resp = await client.post(
        f"/api/v1/projects/{project_id}/files",
        files={"file": ("report.txt", io.BytesIO(b"hello world"), "text/plain")},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["original_file_name"] == "report.txt"
    assert data["project_id"] == project_id


@pytest.mark.asyncio
async def test_list_files_for_project(client):
    create_resp = await client.post("/api/v1/projects", json=PROJECT_PAYLOAD)
    project_id = create_resp.json()["project_id"]

    await client.post(
        f"/api/v1/projects/{project_id}/files",
        files={"file": ("a.txt", io.BytesIO(b"aaa"), "text/plain")},
    )
    await client.post(
        f"/api/v1/projects/{project_id}/files",
        files={"file": ("b.txt", io.BytesIO(b"bbb"), "text/plain")},
    )

    resp = await client.get(f"/api/v1/projects/{project_id}/files")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_delete_file_from_project(client):
    create_resp = await client.post("/api/v1/projects", json=PROJECT_PAYLOAD)
    project_id = create_resp.json()["project_id"]

    upload_resp = await client.post(
        f"/api/v1/projects/{project_id}/files",
        files={"file": ("del.txt", io.BytesIO(b"delete me"), "text/plain")},
    )
    project_file_id = upload_resp.json()["project_file_id"]

    del_resp = await client.delete(f"/api/v1/projects/{project_id}/files/{project_file_id}")
    assert del_resp.status_code == 204

    list_resp = await client.get(f"/api/v1/projects/{project_id}/files")
    ids = [f["project_file_id"] for f in list_resp.json()]
    assert project_file_id not in ids
