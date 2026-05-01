"""
In-process cosine similarity search over inline-stored embeddings.

Loads all vectors for the relevant collection into memory per query.
Acceptable for MVP; replace with Qdrant/pgvector queries at scale.
"""
import json
import math
import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models.knowledge import DocumentChunk, DocumentEmbedding, KnowledgeDocument

log = logging.getLogger(__name__)


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


async def search(
    db: AsyncSession,
    query_vector: list[float],
    collection_id: UUID | None = None,
    top_k: int = 10,
    min_score: float = 0.0,
) -> list[dict]:
    """
    Return the top-k most similar chunks, ordered by cosine similarity descending.
    Each result dict contains: score, chunk_id, chunk_no, chunk_title, chunk_text,
    document_id, document_title, collection_id.
    """
    stmt = (
        select(DocumentEmbedding, DocumentChunk, KnowledgeDocument)
        .join(DocumentChunk, DocumentEmbedding.document_chunk_id == DocumentChunk.document_chunk_id)
        .join(KnowledgeDocument, DocumentEmbedding.knowledge_document_id == KnowledgeDocument.knowledge_document_id)
        .where(DocumentEmbedding.vector_store == "inline")
        .where(KnowledgeDocument.status != "deleted")
    )
    if collection_id:
        stmt = stmt.where(KnowledgeDocument.knowledge_collection_id == collection_id)

    result = await db.execute(stmt)
    rows = result.all()

    scored: list[tuple[float, DocumentEmbedding, DocumentChunk, KnowledgeDocument]] = []
    for embedding, chunk, doc in rows:
        if not embedding.vector_id:
            continue
        try:
            vector = json.loads(embedding.vector_id)
        except (json.JSONDecodeError, TypeError):
            continue
        score = _cosine_similarity(query_vector, vector)
        if score >= min_score:
            scored.append((score, embedding, chunk, doc))

    scored.sort(key=lambda x: x[0], reverse=True)

    return [
        {
            "score": round(score, 4),
            "chunk_id": str(chunk.document_chunk_id),
            "chunk_no": chunk.chunk_no,
            "chunk_title": chunk.chunk_title,
            "chunk_text": chunk.chunk_text,
            "document_id": str(doc.knowledge_document_id),
            "document_title": doc.title,
            "collection_id": str(doc.knowledge_collection_id),
        }
        for score, _, chunk, doc in scored[:top_k]
    ]
