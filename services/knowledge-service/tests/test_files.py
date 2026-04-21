import io
import uuid
from unittest.mock import MagicMock, patch
import pytest


FAKE_STORAGE_PATH = "uploads/ab/cd/abcd1234-test.pdf"
FAKE_PRESIGNED_URL = "http://localhost:9000/ai-pmo-files/uploads/ab/cd/abcd1234-test.pdf?X-Amz-Signature=fake"


@pytest.mark.asyncio
async def test_upload_file(client):
    with patch("app.services.storage_service.upload_file", return_value=(FAKE_STORAGE_PATH, "abc123")):
        resp = await client.post(
            "/api/v1/files/upload",
            files={"file": ("test.pdf", io.BytesIO(b"%PDF-1.4 fake content"), "application/pdf")},
        )
    assert resp.status_code == 201
    data = resp.json()
    assert data["original_file_name"] == "test.pdf"
    assert data["upload_status"] == "completed"
    assert data["storage_path"] == FAKE_STORAGE_PATH
    assert data["checksum"] == "abc123"


@pytest.mark.asyncio
async def test_get_file_metadata(client):
    with patch("app.services.storage_service.upload_file", return_value=(FAKE_STORAGE_PATH, "abc123")):
        upload_resp = await client.post(
            "/api/v1/files/upload",
            files={"file": ("meta.pdf", io.BytesIO(b"content"), "application/pdf")},
        )
    file_id = upload_resp.json()["file_id"]

    resp = await client.get(f"/api/v1/files/{file_id}")
    assert resp.status_code == 200
    assert resp.json()["file_id"] == file_id


@pytest.mark.asyncio
async def test_download_presigned_url(client):
    with patch("app.services.storage_service.upload_file", return_value=(FAKE_STORAGE_PATH, "abc123")):
        upload_resp = await client.post(
            "/api/v1/files/upload",
            files={"file": ("dl.pdf", io.BytesIO(b"content"), "application/pdf")},
        )
    file_id = upload_resp.json()["file_id"]

    with patch("app.services.storage_service.get_download_url", return_value=FAKE_PRESIGNED_URL):
        resp = await client.get(f"/api/v1/files/{file_id}/download")

    assert resp.status_code == 200
    assert resp.json()["download_url"] == FAKE_PRESIGNED_URL


@pytest.mark.asyncio
async def test_get_file_not_found(client):
    resp = await client.get(f"/api/v1/files/{uuid.uuid4()}")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_download_file_not_found(client):
    resp = await client.get(f"/api/v1/files/{uuid.uuid4()}/download")
    assert resp.status_code == 404
