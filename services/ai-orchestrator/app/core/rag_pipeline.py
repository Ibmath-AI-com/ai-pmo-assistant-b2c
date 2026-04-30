from __future__ import annotations

import os
from dataclasses import dataclass, field
from uuid import UUID

import httpx


@dataclass
class RetrievedChunk:
    document_id: str
    chunk_id: str | None
    content: str
    relevance_score: float
    document_title: str | None = None


class RAGPipeline:
    def __init__(self, knowledge_service_url: str | None = None):
        self._url = (knowledge_service_url or os.getenv("KNOWLEDGE_SERVICE_URL", "http://localhost:8005")).rstrip("/")

    async def retrieve(
        self,
        query: str,
        persona_id: str | None = None,
        filters: dict | None = None,
        top_k: int = 5,
    ) -> list[RetrievedChunk]:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                payload = {"query": query, "top_k": top_k}
                if persona_id:
                    payload["persona_id"] = persona_id
                if filters:
                    payload.update(filters)
                resp = await client.post(f"{self._url}/api/v1/knowledge/search", json=payload)
                if resp.status_code != 200:
                    return []
                data = resp.json()
                chunks = []
                for item in data.get("results", []):
                    chunks.append(RetrievedChunk(
                        document_id=item.get("document_id", ""),
                        chunk_id=item.get("chunk_id"),
                        content=item.get("content", ""),
                        relevance_score=item.get("score", 0.0),
                        document_title=item.get("document_title"),
                    ))
                return chunks
        except Exception:
            return []

    def format_context(self, chunks: list[RetrievedChunk]) -> str:
        if not chunks:
            return ""
        parts = ["### Relevant Knowledge Base Context\n"]
        for i, chunk in enumerate(chunks, 1):
            title = chunk.document_title or f"Document {i}"
            parts.append(f"**[{i}] {title}** (relevance: {chunk.relevance_score:.2f})\n{chunk.content}\n")
        return "\n".join(parts)
