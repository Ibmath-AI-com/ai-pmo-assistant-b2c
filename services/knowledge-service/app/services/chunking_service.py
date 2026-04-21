import re
from dataclasses import dataclass, field
from uuid import UUID, uuid4


@dataclass
class ChunkResult:
    chunk_id: UUID
    chunk_no: int
    chunk_title: str | None
    chunk_text: str
    token_count: int
    parent_chunk_id: UUID | None = None


def _count_tokens(text: str) -> int:
    try:
        import tiktoken
        enc = tiktoken.get_encoding("cl100k_base")
        return len(enc.encode(text))
    except ImportError:
        # Fallback: approximate 4 chars per token
        return max(1, len(text) // 4)


def _split_by_headings(markdown: str) -> list[tuple[str | None, str]]:
    """
    Split markdown into (heading, body) sections at # / ## / ### boundaries.
    Returns a list of (title, content) tuples.
    """
    heading_pattern = re.compile(r"^(#{1,3})\s+(.+)$", re.MULTILINE)
    sections: list[tuple[str | None, str]] = []
    last_end = 0
    last_title: str | None = None

    for match in heading_pattern.finditer(markdown):
        body = markdown[last_end:match.start()].strip()
        if body or last_title is not None:
            sections.append((last_title, body))
        last_title = match.group(2).strip()
        last_end = match.end()

    # Remaining content after last heading
    tail = markdown[last_end:].strip()
    if tail or last_title is not None:
        sections.append((last_title, tail))

    return sections


def _split_text_to_fit(text: str, max_tokens: int, overlap: int) -> list[str]:
    """
    Split a text block into token-limited pieces with overlap (by sentences/lines).
    """
    # Split on sentence/line boundaries
    lines = re.split(r"(?<=[.!?])\s+|\n+", text)
    chunks: list[str] = []
    current_lines: list[str] = []
    current_tokens = 0

    for line in lines:
        line_tokens = _count_tokens(line)
        if current_tokens + line_tokens > max_tokens and current_lines:
            chunks.append(" ".join(current_lines))
            # Keep overlap lines for context continuity
            overlap_lines: list[str] = []
            overlap_tokens = 0
            for ol in reversed(current_lines):
                t = _count_tokens(ol)
                if overlap_tokens + t <= overlap:
                    overlap_lines.insert(0, ol)
                    overlap_tokens += t
                else:
                    break
            current_lines = overlap_lines
            current_tokens = overlap_tokens

        current_lines.append(line)
        current_tokens += line_tokens

    if current_lines:
        chunks.append(" ".join(current_lines))

    return [c for c in chunks if c.strip()]


def chunk_text(
    markdown: str,
    max_tokens: int = 512,
    overlap: int = 50,
) -> list[ChunkResult]:
    """
    Split markdown into ChunkResult list.
    - Respects heading boundaries; sections that exceed max_tokens are sub-chunked.
    - Sub-chunks carry parent_chunk_id pointing to the section's parent chunk.
    """
    sections = _split_by_headings(markdown)
    results: list[ChunkResult] = []
    chunk_no = 1

    for title, body in sections:
        if not body.strip() and not title:
            continue

        section_text = f"# {title}\n\n{body}".strip() if title else body.strip()
        section_tokens = _count_tokens(section_text)

        if section_tokens <= max_tokens:
            results.append(
                ChunkResult(
                    chunk_id=uuid4(),
                    chunk_no=chunk_no,
                    chunk_title=title,
                    chunk_text=section_text,
                    token_count=section_tokens,
                    parent_chunk_id=None,
                )
            )
            chunk_no += 1
        else:
            # Create a parent chunk for the heading, then sub-chunks for body
            parent_id = uuid4()
            parent_text = f"# {title}" if title else section_text[:200]
            results.append(
                ChunkResult(
                    chunk_id=parent_id,
                    chunk_no=chunk_no,
                    chunk_title=title,
                    chunk_text=parent_text,
                    token_count=_count_tokens(parent_text),
                    parent_chunk_id=None,
                )
            )
            chunk_no += 1

            sub_texts = _split_text_to_fit(body, max_tokens, overlap)
            for sub_text in sub_texts:
                results.append(
                    ChunkResult(
                        chunk_id=uuid4(),
                        chunk_no=chunk_no,
                        chunk_title=title,
                        chunk_text=sub_text,
                        token_count=_count_tokens(sub_text),
                        parent_chunk_id=parent_id,
                    )
                )
                chunk_no += 1

    return results
