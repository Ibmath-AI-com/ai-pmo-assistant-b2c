"""
Embedding service — OpenAI text-embedding-ada-002.

Vectors are stored as JSON strings in DocumentEmbedding.vector_id
with vector_store="inline". This is the MVP approach; replace with
Qdrant/pgvector for production scale.
"""
import json
import logging
import os
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models.knowledge import DocumentChunk, DocumentEmbedding

log = logging.getLogger(__name__)

EMBEDDING_MODEL = "text-embedding-ada-002"
BATCH_SIZE = 100


async def embed_chunks(db: AsyncSession, document_id: UUID, chunk_ids: list[UUID]) -> int:
    """
    Generate embeddings for the given chunk IDs and persist them inline.
    Deletes existing embeddings for the document first (handles reindex).
    Returns the number of embeddings created, or 0 if embeddings are unavailable.
    """
    if not chunk_ids:
        return 0

    await db.execute(
        delete(DocumentEmbedding).where(
            DocumentEmbedding.knowledge_document_id == document_id
        )
    )

    result = await db.execute(
        select(DocumentChunk).where(
            DocumentChunk.document_chunk_id.in_(chunk_ids)
        )
    )
    chunks = list(result.scalars().all())
    if not chunks:
        return 0

    texts = [
        f"{c.chunk_title}\n\n{c.chunk_text}" if c.chunk_title else (c.chunk_text or " ")
        for c in chunks
    ]

    try:
        vectors = await _embed_texts(texts)
    except Exception as exc:
        log.warning("Embedding generation failed: %s — skipping vector storage", exc)
        return 0

    for chunk, vector in zip(chunks, vectors):
        db.add(DocumentEmbedding(
            knowledge_document_id=document_id,
            document_chunk_id=chunk.document_chunk_id,
            embedding_model=EMBEDDING_MODEL,
            vector_store="inline",
            vector_id=json.dumps(vector),
        ))
    await db.flush()
    log.info("Stored %d embeddings for document %s", len(chunks), document_id)
    return len(chunks)


async def embed_query(text: str) -> list[float] | None:
    """
    Embed a single query string.
    Returns None if OpenAI is unavailable — callers should return empty results.
    """
    if not text.strip():
        return None
    try:
        vectors = await _embed_texts([text])
        return vectors[0] if vectors else None
    except Exception as exc:
        log.warning("Query embedding failed: %s", exc)
        return None


async def _embed_texts(texts: list[str]) -> list[list[float]]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set — embeddings unavailable")

    import openai  # lazy import so service starts without openai installed
    client = openai.AsyncOpenAI(api_key=api_key)

    all_vectors: list[list[float]] = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch = [t if t.strip() else " " for t in texts[i : i + BATCH_SIZE]]
        response = await client.embeddings.create(model=EMBEDDING_MODEL, input=batch)
        all_vectors.extend(
            item.embedding for item in sorted(response.data, key=lambda x: x.index)
        )
    return all_vectors
