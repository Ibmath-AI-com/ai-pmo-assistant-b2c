import os
import tempfile
from pathlib import Path


SUPPORTED_SUFFIXES = {".pdf", ".docx", ".pptx", ".xlsx", ".html", ".htm", ".png", ".jpg", ".jpeg", ".tiff", ".bmp"}


def parse(file_path: str) -> str:
    """
    Parse a document at file_path using Docling and return markdown content.
    Supports: PDF, DOCX, PPTX, XLSX, HTML, and images (with OCR).
    Raises ValueError for unsupported types, RuntimeError for parse failures.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    suffix = path.suffix.lower()
    if suffix not in SUPPORTED_SUFFIXES:
        raise ValueError(f"Unsupported file type: {suffix}")

    try:
        from docling.document_converter import DocumentConverter

        converter = DocumentConverter()
        result = converter.convert(file_path)
        return result.document.export_to_markdown()
    except ImportError:
        raise RuntimeError("Docling is not installed. Install it with: pip install docling")
    except Exception as exc:
        raise RuntimeError(f"Failed to parse document '{path.name}': {exc}") from exc


def parse_bytes(file_bytes: bytes, filename: str) -> str:
    """
    Write bytes to a temp file, parse it, then clean up.
    Returns markdown content string.
    """
    suffix = Path(filename).suffix.lower()
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        return parse(tmp_path)
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
