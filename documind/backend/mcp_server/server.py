from __future__ import annotations

from typing import Any

from .client import DocuMindAPIClient
from .config import load_settings
from .context_store import ActiveContextStore
from .service import DocuMindMCPService


def build_mcp_server():
    try:
        from fastmcp import FastMCP
    except ImportError as exc:
        raise RuntimeError(
            "fastmcp is required to run the MCP server. Install it with `pip install fastmcp`."
        ) from exc

    settings = load_settings()
    service = DocuMindMCPService(
        api_client=DocuMindAPIClient(settings.api_url),
        timeouts=settings.timeouts,
        context_store=ActiveContextStore(settings.context_store_path),
        default_context_id=settings.default_context_id,
    )

    mcp = FastMCP(
        "DocuMind",
        instructions=(
            "Use DocuMind tools to search and query internal documentation. "
            "Use search_docs first for factual lookup (counts, lists, exact values). "
            "Use ask_docs only for synthesis. "
            "If instance_id/namespace_id are missing, call get_active_context or set_active_context first."
        ),
    )

    @mcp.tool()
    def search_docs(
        query: str,
        instance_id: str = "",
        namespace_id: str = "",
        top_k: int = 5,
        context_id: str = "",
    ) -> dict[str, Any]:
        """Search docs. Uses active context when instance_id/namespace_id are omitted."""
        return service.search_docs(
            query=query,
            instance_id=instance_id,
            namespace_id=namespace_id,
            top_k=top_k,
            context_id=context_id,
        )

    @mcp.tool()
    def ask_docs(
        question: str,
        instance_id: str = "",
        namespace_id: str = "",
        top_k: int = 5,
        context_id: str = "",
    ) -> dict[str, Any]:
        """Use for synthesized grounded answers. Uses active context when ids are omitted."""
        return service.ask_docs(
            question=question,
            instance_id=instance_id,
            namespace_id=namespace_id,
            top_k=top_k,
            context_id=context_id,
        )

    @mcp.tool()
    def ingest_text(
        content: str,
        instance_id: str = "",
        namespace_id: str = "",
        source_ref: str = "inline",
        context_id: str = "",
    ) -> dict[str, Any]:
        """Ingest plain text/markdown content. Uses active context when ids are omitted."""
        return service.ingest_text(
            content=content,
            instance_id=instance_id,
            namespace_id=namespace_id,
            source_ref=source_ref,
            context_id=context_id,
        )

    @mcp.tool()
    def list_knowledge_bases(instance_id: str = "") -> dict[str, Any]:
        """List available knowledge bases, optionally scoped to one instance."""
        resolved_instance_id = instance_id.strip() or None
        return service.list_knowledge_bases(instance_id=resolved_instance_id)

    @mcp.tool()
    def list_instances() -> dict[str, Any]:
        """List available instances."""
        return service.list_instances()

    @mcp.tool()
    def create_instance(name: str, description: str = "") -> dict[str, Any]:
        """Create a new instance for first-time setup."""
        return service.create_instance(name=name, description=description)

    @mcp.tool()
    def list_namespaces(instance_id: str = "", context_id: str = "") -> dict[str, Any]:
        """List namespaces for an instance, or use active context when instance_id is omitted."""
        return service.list_namespaces(instance_id=instance_id, context_id=context_id)

    @mcp.tool()
    def get_active_context(context_id: str = "") -> dict[str, Any]:
        """Get active context (instance_id + namespace_id) used for default targeting."""
        return service.get_active_context(context_id=context_id)

    @mcp.tool()
    def set_active_context(instance_id: str, namespace_id: str, context_id: str = "") -> dict[str, Any]:
        """Set active context to be used when instance_id/namespace_id are omitted."""
        return service.set_active_context(
            instance_id=instance_id,
            namespace_id=namespace_id,
            context_id=context_id,
        )

    return mcp


def run() -> None:
    build_mcp_server().run()


if __name__ == "__main__":
    run()
