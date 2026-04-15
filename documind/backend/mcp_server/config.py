from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from .service import MCPTimeouts


@dataclass(frozen=True)
class MCPServerSettings:
    api_url: str
    timeouts: MCPTimeouts
    context_store_path: str
    default_context_id: str


def load_settings() -> MCPServerSettings:
    default_context_store_path = str(Path.home() / ".documind" / "contexts.json")
    return MCPServerSettings(
        api_url=os.getenv("DOCUMIND_API_URL", "http://localhost:8000"),
        timeouts=MCPTimeouts(
            search_seconds=int(os.getenv("DOCUMIND_SEARCH_TIMEOUT_SECONDS", "8")),
            ask_seconds=int(os.getenv("DOCUMIND_ASK_TIMEOUT_SECONDS", "25")),
            ingest_seconds=int(os.getenv("DOCUMIND_INGEST_TIMEOUT_SECONDS", "20")),
        ),
        context_store_path=os.getenv("DOCUMIND_CONTEXT_STORE_PATH", default_context_store_path),
        default_context_id=os.getenv("DOCUMIND_CONTEXT_ID", "default"),
    )
