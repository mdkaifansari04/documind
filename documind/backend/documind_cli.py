from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any

from mcp_server.client import DocuMindAPIClient
from mcp_server.config import load_settings
from mcp_server.context_store import ActiveContextStore
from mcp_server.service import DocuMindMCPService


MAX_INGEST_BYTES = 200 * 1024


def _error_response(*, message: str, error: str = "validation_error") -> dict[str, Any]:
    return {
        "status": "error",
        "data": {},
        "meta": {"error": error},
        "text": message,
    }


def _build_service(api_url: str | None = None) -> DocuMindMCPService:
    settings = load_settings()
    resolved_api_url = api_url or settings.api_url
    return DocuMindMCPService(
        api_client=DocuMindAPIClient(resolved_api_url),
        timeouts=settings.timeouts,
        context_store=ActiveContextStore(settings.context_store_path),
        default_context_id=settings.default_context_id,
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="documind", description="DocuMind CLI (Phase 2 hackathon)")
    parser.add_argument(
        "--api-url",
        default=os.getenv("DOCUMIND_API_URL", "http://localhost:8000"),
        help="DocuMind backend URL (default: %(default)s)",
    )
    parser.add_argument(
        "--context-id",
        default=os.getenv("DOCUMIND_CONTEXT_ID", "default"),
        help="Active context id for saved instance/namespace (default: %(default)s)",
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    search_parser = subparsers.add_parser("search-docs", help="Search docs by instance_id + namespace_id")
    search_parser.add_argument("--query", required=True)
    search_parser.add_argument("--instance-id", default="")
    search_parser.add_argument("--namespace-id", default="")
    search_parser.add_argument("--top-k", type=int, default=5)

    ask_parser = subparsers.add_parser("ask-docs", help="Ask docs with grounded sources")
    ask_parser.add_argument("--question", required=True)
    ask_parser.add_argument("--instance-id", default="")
    ask_parser.add_argument("--namespace-id", default="")
    ask_parser.add_argument("--top-k", type=int, default=5)

    ingest_parser = subparsers.add_parser("ingest-text", help="Ingest inline text or a text file")
    ingest_parser.add_argument("--instance-id", default="")
    ingest_parser.add_argument("--namespace-id", default="")
    ingest_parser.add_argument("--source-ref", default="inline")
    ingest_content_group = ingest_parser.add_mutually_exclusive_group(required=True)
    ingest_content_group.add_argument("--content")
    ingest_content_group.add_argument("--content-file")

    list_parser = subparsers.add_parser("list-kbs", help="List knowledge bases")
    list_parser.add_argument("--instance-id", default="")

    subparsers.add_parser("instances", help="List available instances")

    instance_create_parser = subparsers.add_parser("instance-create", help="Create a new instance")
    instance_create_parser.add_argument("--name", required=True)
    instance_create_parser.add_argument("--description", default="")

    namespaces_parser = subparsers.add_parser("namespaces", help="List namespaces for an instance")
    namespaces_parser.add_argument("--instance-id", default="")

    subparsers.add_parser("context-show", help="Show active context")

    context_set_parser = subparsers.add_parser("context-set", help="Set active context")
    context_set_parser.add_argument("--instance-id", required=True)
    context_set_parser.add_argument("--namespace-id", required=True)

    return parser


def _resolve_ingest_content(args: argparse.Namespace) -> tuple[str | None, dict[str, Any] | None]:
    if args.content is not None:
        content = args.content
    else:
        path = Path(args.content_file)
        try:
            content = path.read_text(encoding="utf-8")
        except FileNotFoundError:
            return None, _error_response(message=f"content-file not found: {path}")
        except OSError as exc:
            return None, _error_response(message=f"failed to read content-file: {exc}", error="server_error")

    size_bytes = len(content.encode("utf-8"))
    if size_bytes > MAX_INGEST_BYTES:
        return (
            None,
            _error_response(
                message=f"content is too large ({size_bytes} bytes). Max allowed is {MAX_INGEST_BYTES} bytes.",
            ),
        )
    return content, None


def execute_command(args: argparse.Namespace, service: DocuMindMCPService) -> dict[str, Any]:
    if args.command == "search-docs":
        return service.search_docs(
            query=args.query,
            instance_id=args.instance_id,
            namespace_id=args.namespace_id,
            top_k=args.top_k,
            context_id=args.context_id,
        )

    if args.command == "ask-docs":
        return service.ask_docs(
            question=args.question,
            instance_id=args.instance_id,
            namespace_id=args.namespace_id,
            top_k=args.top_k,
            context_id=args.context_id,
        )

    if args.command == "ingest-text":
        content, error = _resolve_ingest_content(args)
        if error:
            return error
        return service.ingest_text(
            content=content or "",
            instance_id=args.instance_id,
            namespace_id=args.namespace_id,
            source_ref=args.source_ref,
            context_id=args.context_id,
        )

    if args.command == "list-kbs":
        resolved_instance_id = args.instance_id.strip() or None
        return service.list_knowledge_bases(instance_id=resolved_instance_id)

    if args.command == "instances":
        return service.list_instances()

    if args.command == "instance-create":
        return service.create_instance(name=args.name, description=args.description)

    if args.command == "namespaces":
        return service.list_namespaces(instance_id=args.instance_id, context_id=args.context_id)

    if args.command == "context-show":
        return service.get_active_context(context_id=args.context_id)

    if args.command == "context-set":
        return service.set_active_context(
            instance_id=args.instance_id,
            namespace_id=args.namespace_id,
            context_id=args.context_id,
        )

    return _error_response(message=f"unsupported command: {args.command}", error="server_error")


def run_cli(argv: list[str] | None = None, *, service: DocuMindMCPService | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    active_service = service or _build_service(args.api_url)
    response = execute_command(args, active_service)
    print(json.dumps(response, indent=2))
    return 0 if response.get("status") == "success" else 1


if __name__ == "__main__":
    raise SystemExit(run_cli())
