import uuid
import pytest
from unittest.mock import patch


async def _setup_generated_doc(client):
    create_resp = await client.post("/api/v1/templates", json={
        "template_code": f"EXP{uuid.uuid4().hex[:4].upper()}",
        "template_name": "Export Test",
        "template_body": "Hello {{ name }}",
        "output_format": "pdf",
        "status": "active",
    })
    tid = create_resp.json()["template_id"]

    fake_path = "/tmp/fake.pdf"
    with patch("app.services.export_pdf.create_temp_pdf", return_value=fake_path), \
         patch("app.services.storage_service.upload_generated", return_value="generated/fake.pdf"), \
         patch("app.services.storage_service.get_download_url", return_value="http://minio/fake.pdf"), \
         patch("os.path.getsize", return_value=512), \
         patch("os.path.exists", return_value=False):
        gen_resp = await client.post("/api/v1/generate", json={
            "template_id": tid,
            "input_data": {"name": "Test"},
            "output_format": "pdf",
        })
    assert gen_resp.status_code == 201
    return gen_resp.json()["generated_document_id"]


@pytest.mark.asyncio
async def test_list_generated(client):
    await _setup_generated_doc(client)
    resp = await client.get("/api/v1/generated")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1


@pytest.mark.asyncio
async def test_get_generated_detail(client):
    doc_id = await _setup_generated_doc(client)
    resp = await client.get(f"/api/v1/generated/{doc_id}")
    assert resp.status_code == 200
    assert resp.json()["generated_document_id"] == doc_id


@pytest.mark.asyncio
async def test_download_generated(client):
    """Generate endpoint returns a presigned download_url for the stored file."""
    create_resp = await client.post("/api/v1/templates", json={
        "template_code": f"DL{uuid.uuid4().hex[:6].upper()}",
        "template_name": "Download Test",
        "template_body": "Content: {{ val }}",
        "output_format": "pdf",
        "status": "active",
    })
    tid = create_resp.json()["template_id"]

    with patch("app.services.export_pdf.create_temp_pdf", return_value="/tmp/t.pdf"), \
         patch("app.services.storage_service.upload_generated", return_value="generated/t.pdf"), \
         patch("app.services.storage_service.get_download_url", return_value="http://minio/presigned"), \
         patch("os.path.exists", return_value=False):
        gen_resp = await client.post("/api/v1/generate", json={
            "template_id": tid,
            "input_data": {"val": "test"},
            "output_format": "pdf",
        })

    assert gen_resp.status_code == 201
    assert "download_url" in gen_resp.json()
    assert gen_resp.json()["download_url"] == "http://minio/presigned"


@pytest.mark.asyncio
async def test_get_generated_not_found(client):
    fake_id = str(uuid.uuid4())
    resp = await client.get(f"/api/v1/generated/{fake_id}")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_list_generated_filter_by_template(client):
    """All generated documents for the authenticated user are listed."""
    doc_id = await _setup_generated_doc(client)

    resp = await client.get("/api/v1/generated")
    assert resp.status_code == 200
    doc_ids = [d["generated_document_id"] for d in resp.json()]
    assert doc_id in doc_ids
