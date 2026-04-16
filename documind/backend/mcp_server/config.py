from __future__ import annotations

import os
import tempfile
from dataclasses import dataclass
from pathlib import Path

from .service import MCPTimeouts


@dataclass(frozen=True)
class MCPServerSettings:
    api_url: str
    timeouts: MCPTimeouts
    context_store_path: str
    default_context_id: str


def _is_context_store_writable(path: Path) -> bool:
    resolved = path.expanduser()
    if resolved.exists():
        return os.access(resolved, os.W_OK)
    parent = resolved.parent
    try:
        parent.mkdir(parents=True, exist_ok=True)
    except OSError:
        return False
    return os.access(parent, os.W_OK)


def _resolve_context_store_path() -> str:
    configured = os.getenv("DOCUMIND_CONTEXT_STORE_PATH", "").strip()
    if configured:
        return configured

    default_path = (Path.home() / ".documind" / "contexts.json").expanduser()
    if _is_context_store_writable(default_path):
        return str(default_path)

    fallback_path = Path(tempfile.gettempdir()) / "documind" / "contexts.json"
    return str(fallback_path)


def load_settings() -> MCPServerSettings:
    return MCPServerSettings(
        api_url=os.getenv("DOCUMIND_API_URL", "http://localhost:8000"),
        timeouts=MCPTimeouts(
            search_seconds=int(os.getenv("DOCUMIND_SEARCH_TIMEOUT_SECONDS", "8")),
            ask_seconds=int(os.getenv("DOCUMIND_ASK_TIMEOUT_SECONDS", "25")),
            ingest_seconds=int(os.getenv("DOCUMIND_INGEST_TIMEOUT_SECONDS", "20")),
        ),
        context_store_path=_resolve_context_store_path(),
        default_context_id=os.getenv("DOCUMIND_CONTEXT_ID", "default"),
    )
