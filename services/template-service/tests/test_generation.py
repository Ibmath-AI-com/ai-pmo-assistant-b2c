import pytest
from unittest.mock import patch, MagicMock


JINJA_TEMPLATE = "# {{ project_name }}\nManager: {{ pm_name }}\n{% for r in risks %}\n- {{ r.name }}\n{% endfor %}"


async def _create_template(client, code="GEN001", body=None):
    resp = await client.post("/api/v1/templates", json={
        "template_code": code,
        "template_name": f"Template {code}",
        "template_body": body or JINJA_TEMPLATE,
        "output_format": "pdf",
        "status": "active",
    })
    assert resp.status_code == 201
    return resp.json()["template_id"]


INPUT_DATA = {
    "project_name": "Alpha Project",
    "pm_name": "Jane Doe",
    "risks": [{"name": "Budget Risk"}, {"name": "Timeline Risk"}],
}


@pytest.mark.asyncio
async def test_render_service_basic():
    from app.services.render_service import render
    result = render("Hello {{ name }}!", {"name": "World"})
    assert result == "Hello World!"


@pytest.mark.asyncio
async def test_render_service_loop():
    from app.services.render_service import render
    tmpl = "{% for item in items %}- {{ item }}\n{% endfor %}"
    result = render(tmpl, {"items": ["a", "b", "c"]})
    assert "- a" in result
    assert "- b" in result


@pytest.mark.asyncio
async def test_render_service_missing_variable():
    from app.services.render_service import render
    result = render("Hello {{ missing_var }}!", {})
    assert "Hello" in result
    assert "missing_var" not in result


@pytest.mark.asyncio
async def test_render_to_html():
    from app.services.render_service import render_to_html
    html = render_to_html("# Title\n## Section\n- bullet", {})
    assert "<h1>" in html
    assert "<h2>" in html
    assert "<li>" in html


@pytest.mark.asyncio
async def test_generate_pdf_mock(client):
    tid = await _create_template(client, "PDF001")
    fake_path = "/tmp/test.pdf"
    fake_bytes = b"%PDF-fake"

    with patch("app.services.export_pdf.create_temp_pdf", return_value=fake_path), \
         patch("app.services.storage_service.upload_generated", return_value="generated/test.pdf"), \
         patch("app.services.storage_service.get_download_url", return_value="http://minio/test.pdf"), \
         patch("os.path.exists", return_value=False):
        resp = await client.post("/api/v1/generate", json={
            "template_id": tid,
            "input_data": INPUT_DATA,
            "output_format": "pdf",
        })
    assert resp.status_code == 201
    data = resp.json()
    assert data["document_format"] == "pdf"
    assert "download_url" in data


@pytest.mark.asyncio
async def test_generate_docx_mock(client):
    tid = await _create_template(client, "DOC001")
    fake_path = "/tmp/test.docx"

    with patch("app.services.export_docx.create_temp_docx", return_value=fake_path), \
         patch("app.services.storage_service.upload_generated", return_value="generated/test.docx"), \
         patch("app.services.storage_service.get_download_url", return_value="http://minio/test.docx"), \
         patch("os.path.exists", return_value=False):
        resp = await client.post("/api/v1/generate", json={
            "template_id": tid,
            "input_data": INPUT_DATA,
            "output_format": "docx",
        })
    assert resp.status_code == 201
    assert resp.json()["document_format"] == "docx"


@pytest.mark.asyncio
async def test_generate_pptx_mock(client):
    tid = await _create_template(client, "PPT001")
    fake_path = "/tmp/test.pptx"

    with patch("app.services.export_pptx.create_temp_pptx", return_value=fake_path), \
         patch("app.services.storage_service.upload_generated", return_value="generated/test.pptx"), \
         patch("app.services.storage_service.get_download_url", return_value="http://minio/test.pptx"), \
         patch("os.path.exists", return_value=False):
        resp = await client.post("/api/v1/generate", json={
            "template_id": tid,
            "input_data": INPUT_DATA,
            "output_format": "pptx",
        })
    assert resp.status_code == 201
    assert resp.json()["document_format"] == "pptx"


@pytest.mark.asyncio
async def test_preview_template(client):
    tid = await _create_template(client, "PRV001", body="# {{ title }}\n## {{ subtitle }}")
    resp = await client.post(f"/api/v1/templates/{tid}/preview", json={
        "input_data": {"title": "My Report", "subtitle": "Q1 2026"}
    })
    assert resp.status_code == 200
    html = resp.json()["html"]
    assert "My Report" in html
    assert "Q1 2026" in html
