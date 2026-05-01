"""Tests for RAGPipeline — retrieval with mocked HTTP, error handling, context formatting."""
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "shared"))


@pytest.fixture
def pipeline():
    from app.core.rag_pipeline import RAGPipeline
    return RAGPipeline(knowledge_service_url="http://fake-knowledge:8005")


@pytest.mark.asyncio
async def test_retrieve_returns_chunks_on_success(pipeline):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "results": [
            {
                "document_id": "doc-1",
                "chunk_id": "chunk-1",
                "content": "Project risk should be assessed quarterly.",
                "score": 0.92,
                "document_title": "Risk Guide",
            },
            {
                "document_id": "doc-2",
                "chunk_id": "chunk-2",
                "content": "RAID log must be updated weekly.",
                "score": 0.78,
                "document_title": "RAID Template",
            },
        ]
    }

    mock_client = AsyncMock()
    mock_client.post.return_value = mock_response
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("app.core.rag_pipeline.httpx.AsyncClient", return_value=mock_client):
        chunks = await pipeline.retrieve("What is the risk assessment process?", top_k=5)

    assert len(chunks) == 2
    assert chunks[0].document_id == "doc-1"
    assert chunks[0].relevance_score == 0.92
    assert chunks[0].document_title == "Risk Guide"
    assert chunks[1].content == "RAID log must be updated weekly."


@pytest.mark.asyncio
async def test_retrieve_returns_empty_on_non_200(pipeline):
    mock_response = MagicMock()
    mock_response.status_code = 503
    mock_response.json.return_value = {}

    mock_client = AsyncMock()
    mock_client.post.return_value = mock_response
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("app.core.rag_pipeline.httpx.AsyncClient", return_value=mock_client):
        chunks = await pipeline.retrieve("query")

    assert chunks == []


@pytest.mark.asyncio
async def test_retrieve_returns_empty_on_network_error(pipeline):
    mock_client = AsyncMock()
    mock_client.post.side_effect = Exception("Connection refused")
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("app.core.rag_pipeline.httpx.AsyncClient", return_value=mock_client):
        chunks = await pipeline.retrieve("query")

    assert chunks == []


def test_format_context_with_chunks(pipeline):
    from app.core.rag_pipeline import RetrievedChunk
    chunks = [
        RetrievedChunk("doc-1", "c-1", "Risk must be tracked.", 0.9, "Risk Guide"),
        RetrievedChunk("doc-2", "c-2", "Templates help structure.", 0.75, None),
    ]
    context = pipeline.format_context(chunks)
    assert "Relevant Knowledge Base Context" in context
    assert "Risk Guide" in context
    assert "Risk must be tracked." in context
    assert "0.90" in context or "0.9" in context


def test_format_context_with_empty_list(pipeline):
    context = pipeline.format_context([])
    assert context == ""


@pytest.mark.asyncio
async def test_retrieve_passes_persona_id_and_filters(pipeline):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"results": []}

    mock_client = AsyncMock()
    mock_client.post.return_value = mock_response
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch("app.core.rag_pipeline.httpx.AsyncClient", return_value=mock_client):
        await pipeline.retrieve("query", persona_id="pid-123", filters={"domain": "Risk"}, top_k=3)

    call_kwargs = mock_client.post.call_args
    payload = call_kwargs[1]["json"] if call_kwargs[1] else call_kwargs[0][1]
    assert payload["persona_id"] == "pid-123"
    assert payload["top_k"] == 3
    assert payload["domain"] == "Risk"
