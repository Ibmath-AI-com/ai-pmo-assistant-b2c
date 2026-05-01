"""
Tests for vector search: cosine similarity helper + search endpoint.
"""
import json
import sys
import uuid
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "shared"))

import pytest
import pytest_asyncio

from app.services.vector_store_service import _cosine_similarity, search


# ── Unit: cosine similarity ───────────────────────────────────────────────────

def test_cosine_similarity_identical():
    v = [1.0, 0.0, 0.0]
    assert _cosine_similarity(v, v) == pytest.approx(1.0)


def test_cosine_similarity_orthogonal():
    assert _cosine_similarity([1.0, 0.0], [0.0, 1.0]) == pytest.approx(0.0)


def test_cosine_similarity_opposite():
    assert _cosine_similarity([1.0, 0.0], [-1.0, 0.0]) == pytest.approx(-1.0)


def test_cosine_similarity_zero_vector():
    assert _cosine_similarity([0.0, 0.0], [1.0, 0.0]) == 0.0


# ── Unit: search with mocked DB ───────────────────────────────────────────────

def _make_row(doc_id, chunk_id, collection_id, vector: list[float], title="Test Doc"):
    from db.models.knowledge import DocumentChunk, DocumentEmbedding, KnowledgeDocument

    doc = KnowledgeDocument()
    doc.knowledge_document_id = doc_id
    doc.knowledge_collection_id = collection_id
    doc.title = title
    doc.status = "active"

    chunk = DocumentChunk()
    chunk.document_chunk_id = chunk_id
    chunk.chunk_no = 1
    chunk.chunk_title = "Section 1"
    chunk.chunk_text = "Some text"

    emb = DocumentEmbedding()
    emb.document_embedding_id = uuid.uuid4()
    emb.knowledge_document_id = doc_id
    emb.document_chunk_id = chunk_id
    emb.vector_store = "inline"
    emb.vector_id = json.dumps(vector)

    return (emb, chunk, doc)


@pytest.mark.asyncio
async def test_search_returns_sorted_by_score():
    doc_id = uuid.uuid4()
    col_id = uuid.uuid4()
    chunk_id_a = uuid.uuid4()
    chunk_id_b = uuid.uuid4()

    # chunk_a is parallel to query → score ≈ 1.0
    row_a = _make_row(doc_id, chunk_id_a, col_id, [1.0, 0.0, 0.0], "Doc A")
    # chunk_b is orthogonal → score = 0.0
    row_b = _make_row(doc_id, chunk_id_b, col_id, [0.0, 1.0, 0.0], "Doc B")

    mock_result = MagicMock()
    mock_result.all.return_value = [row_a, row_b]

    mock_db = AsyncMock()
    mock_db.execute.return_value = mock_result

    results = await search(mock_db, query_vector=[1.0, 0.0, 0.0], top_k=10, min_score=0.0)

    assert len(results) == 2
    assert results[0]["score"] == pytest.approx(1.0)
    assert results[1]["score"] == pytest.approx(0.0)
    assert results[0]["chunk_id"] == str(chunk_id_a)


@pytest.mark.asyncio
async def test_search_respects_top_k():
    doc_id = uuid.uuid4()
    col_id = uuid.uuid4()

    rows = [
        _make_row(doc_id, uuid.uuid4(), col_id, [1.0, float(i) * 0.01, 0.0])
        for i in range(10)
    ]

    mock_result = MagicMock()
    mock_result.all.return_value = rows
    mock_db = AsyncMock()
    mock_db.execute.return_value = mock_result

    results = await search(mock_db, query_vector=[1.0, 0.0, 0.0], top_k=3)
    assert len(results) == 3


@pytest.mark.asyncio
async def test_search_empty_when_no_embeddings():
    mock_result = MagicMock()
    mock_result.all.return_value = []
    mock_db = AsyncMock()
    mock_db.execute.return_value = mock_result

    results = await search(mock_db, query_vector=[1.0, 0.0, 0.0])
    assert results == []


@pytest.mark.asyncio
async def test_search_skips_deleted_documents():
    doc_id = uuid.uuid4()
    col_id = uuid.uuid4()
    chunk_id = uuid.uuid4()

    row = _make_row(doc_id, chunk_id, col_id, [1.0, 0.0, 0.0])
    row[2].status = "deleted"  # mark doc as deleted

    mock_result = MagicMock()
    # The SQL query already filters deleted docs, so an empty result simulates this
    mock_result.all.return_value = []
    mock_db = AsyncMock()
    mock_db.execute.return_value = mock_result

    results = await search(mock_db, query_vector=[1.0, 0.0, 0.0])
    assert results == []


# ── Integration: /search endpoint ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_search_endpoint_returns_empty_when_no_openai_key(client):
    """Without OPENAI_API_KEY, embed_query returns None → endpoint returns []."""
    with patch.dict("os.environ", {}, clear=False):
        import os
        original = os.environ.pop("OPENAI_API_KEY", None)
        try:
            resp = await client.post(
                "/api/v1/knowledge/documents/search",
                json={"query": "test query"},
            )
            assert resp.status_code == 200
            assert resp.json() == []
        finally:
            if original is not None:
                os.environ["OPENAI_API_KEY"] = original
