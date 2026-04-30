from __future__ import annotations

import tempfile
import os


def generate_pdf(html_content: str, output_path: str) -> str:
    from weasyprint import HTML
    HTML(string=html_content).write_pdf(output_path)
    return output_path


def generate_pdf_bytes(html_content: str) -> bytes:
    from weasyprint import HTML
    return HTML(string=html_content).write_pdf()


def create_temp_pdf(html_content: str) -> str:
    tmp = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
    tmp.close()
    generate_pdf(html_content, tmp.name)
    return tmp.name
