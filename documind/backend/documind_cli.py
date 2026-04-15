from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

from mcp_server.client import DocuMindAPIClient
from mcp_server.config import load_settings
from mcp_server.context_store import ActiveContextStore
from mcp_server.service import DocuMindMCPService


MAX_INGEST_BYTES = 200 * 1024


class _DocuMindHelpFormatter(argparse.RawTextHelpFormatter, argparse.ArgumentDefaultsHelpFormatter):
    """Help formatter that keeps docs readable and shows defaults."""


INIT_BANNER = "\n".join(
    [
        "██████╗  ██████╗██╗     ██╗",
        "██╔══██╗██╔════╝██║     ██║",
        "██║  ██║██║     ██║     ██║",
        "██║  ██║██║     ██║     ██║",
        "██████╔╝╚██████╗███████╗██║",
        "╚═════╝  ╚═════╝╚══════╝╚═╝",
    ]
)


def _show_init_banner() -> None:
    if not sys.stdout.isatty():
        return
    # Soft cyan accent with graceful fallback when ANSI is unsupported.
    cyan = "\033[96m"
    dim = "\033[2m"
    reset = "\033[0m"
    print(f"{cyan}{INIT_BANNER}{reset}")
    print(f"{dim}DocuMind CLI init{reset}")


def _parse_bool(value: str | bool | None) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return True
    normalized = value.strip().lower()
    if normalized in {"1", "true", "t", "yes", "y", "on"}:
        return True
    if normalized in {"0", "false", "f", "no", "n", "off"}:
        return False
    raise argparse.ArgumentTypeError("expected boolean value: true/false")


def _add_bot_argument(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--bot",
        nargs="?",
        const=True,
        default=False,
        type=_parse_bool,
        metavar="true|false",
        help="Output mode: true = JSON for agents, false = human-readable text.",
    )


def _resolve_init_namespace(args: argparse.Namespace) -> str | None:
    namespace_id = args.namespace_id.strip()
    if namespace_id:
        return namespace_id
    if not sys.stdin.isatty():
        return None
    while True:
        entered = input("Enter namespace_id to initialize context: ").strip()
        if entered:
            return entered
        print("namespace_id is required. Please enter a non-empty value.")


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
    parser = argparse.ArgumentParser(
        prog="documind",
        formatter_class=_DocuMindHelpFormatter,
        description=(
            "DocuMind CLI (Phase 2 hackathon)\n"
            "CLI-first interface for instance_id + namespace_id retrieval workflows."
        ),
        epilog=(
            "Command quick map:\n"
            "  init            -> bootstrap active context for current context-id\n"
            "  context-show    -> read saved context (instance_id + namespace_id)\n"
            "  context-set     -> set saved context manually (--instance-id --namespace-id)\n"
            "  instances       -> list instances\n"
            "  instance-create -> create instance (--name, -d/--description)\n"
            "  namespaces      -> list namespaces for an instance (--instance-id optional)\n"
            "  list-kbs        -> list knowledge bases (--instance-id optional)\n"
            "  search-docs     -> fast retrieval (--qr/--query, --top-k)\n"
            "  ask-docs        -> grounded answer (-qs/--question, --top-k)\n"
            "  ingest-text     -> add inline/file text (--content or --content-file)\n"
            "  --bot=true      -> force JSON response for agent/tool consumption\n\n"
            "Examples:\n"
            "  documind init --namespace-id company_docs\n"
            "  documind search-docs --qr \"deploy command\" --top-k 5\n"
            "  documind ask-docs -qs \"How do I deploy?\" --top-k 5\n"
            "  documind context-show --bot=true"
        ),
    )
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

    subparsers = parser.add_subparsers(
        dest="command",
        required=True,
        title="Commands",
        metavar="<command>",
        description="Run `documind <command> -h` for command-specific flags and examples.",
    )

    search_parser = subparsers.add_parser(
        "search-docs",
        formatter_class=_DocuMindHelpFormatter,
        help="Fast semantic search in docs.",
        description=(
            "Fast semantic retrieval over a namespace.\n"
            "Uses explicit --instance-id/--namespace-id when provided; otherwise falls back to active context."
        ),
        epilog=(
            "Examples:\n"
            "  documind search-docs --qr \"deploy command\" --top-k 5\n"
            "  documind search-docs --qr \"auth token\" --instance-id <iid> --namespace-id company_docs"
        ),
    )
    search_parser.add_argument("--qr", "--query", dest="query", required=True, help="Search query text.")
    search_parser.add_argument(
        "--instance-id",
        default="",
        help="Target instance_id. If omitted, active context instance_id is used.",
    )
    search_parser.add_argument(
        "--namespace-id",
        default="",
        help="Target namespace_id. If omitted, active context namespace_id is used.",
    )
    search_parser.add_argument("--top-k", type=int, default=5, help="Maximum results to return.")
    _add_bot_argument(search_parser)

    ask_parser = subparsers.add_parser(
        "ask-docs",
        formatter_class=_DocuMindHelpFormatter,
        help="RAG answer with citations.",
        description=(
            "Generate a grounded answer using retrieved documents.\n"
            "Uses explicit --instance-id/--namespace-id when provided; otherwise falls back to active context."
        ),
        epilog=(
            "Examples:\n"
            "  documind ask-docs -qs \"What is the deploy command?\" --top-k 5\n"
            "  documind ask-docs -qs \"How auth works?\" --instance-id <iid> --namespace-id company_docs"
        ),
    )
    ask_parser.add_argument("-qs", "--question", required=True, help="Natural language question.")
    ask_parser.add_argument(
        "--instance-id",
        default="",
        help="Target instance_id. If omitted, active context instance_id is used.",
    )
    ask_parser.add_argument(
        "--namespace-id",
        default="",
        help="Target namespace_id. If omitted, active context namespace_id is used.",
    )
    ask_parser.add_argument("--top-k", type=int, default=5, help="Maximum retrieved chunks to use.")
    _add_bot_argument(ask_parser)

    ingest_parser = subparsers.add_parser(
        "ingest-text",
        formatter_class=_DocuMindHelpFormatter,
        help="Index inline text or file content.",
        description=(
            "Ingest plaintext/markdown content into a namespace.\n"
            "Provide exactly one of --content or --content-file."
        ),
        epilog=(
            "Examples:\n"
            "  documind ingest-text --content \"hello world\" --source-ref notes\n"
            "  documind ingest-text --content-file README.md --source-ref readme"
        ),
    )
    ingest_parser.add_argument(
        "--instance-id",
        default="",
        help="Target instance_id. If omitted, active context instance_id is used.",
    )
    ingest_parser.add_argument(
        "--namespace-id",
        default="",
        help="Target namespace_id. If omitted, active context namespace_id is used.",
    )
    ingest_parser.add_argument(
        "--source-ref",
        default="inline",
        help="Logical source name stored with indexed chunks.",
    )
    ingest_content_group = ingest_parser.add_mutually_exclusive_group(required=True)
    ingest_content_group.add_argument("--content", help="Inline content to index.")
    ingest_content_group.add_argument("--content-file", help="Path to text/markdown file.")
    _add_bot_argument(ingest_parser)

    list_parser = subparsers.add_parser(
        "list-kbs",
        formatter_class=_DocuMindHelpFormatter,
        help="List available knowledge bases.",
        description="List knowledge bases, optionally filtered by instance_id.",
    )
    list_parser.add_argument("--instance-id", default="", help="Optional instance_id filter.")
    _add_bot_argument(list_parser)

    instances_parser = subparsers.add_parser(
        "instances",
        formatter_class=_DocuMindHelpFormatter,
        help="List all instances.",
        description="List available instances from the backend.",
    )
    _add_bot_argument(instances_parser)

    instance_create_parser = subparsers.add_parser(
        "instance-create",
        formatter_class=_DocuMindHelpFormatter,
        help="Create a new instance.",
        description="Create a new DocuMind instance.",
        epilog="Example:\n  documind instance-create --name \"My Instance\" -d \"local test\"",
    )
    instance_create_parser.add_argument("--name", required=True, help="Instance display name.")
    instance_create_parser.add_argument("-d", "--description", default="", help="Optional description.")
    _add_bot_argument(instance_create_parser)

    namespaces_parser = subparsers.add_parser(
        "namespaces",
        formatter_class=_DocuMindHelpFormatter,
        help="List namespaces.",
        description=(
            "List namespaces for an instance.\n"
            "If --instance-id is omitted, active context instance_id is used."
        ),
    )
    namespaces_parser.add_argument(
        "--instance-id",
        default="",
        help="Target instance_id. If omitted, active context instance_id is used.",
    )
    _add_bot_argument(namespaces_parser)

    context_show_parser = subparsers.add_parser(
        "context-show",
        formatter_class=_DocuMindHelpFormatter,
        help="Show active context.",
        description="Show currently saved context values (context_id, instance_id, namespace_id).",
    )
    _add_bot_argument(context_show_parser)

    context_set_parser = subparsers.add_parser(
        "context-set",
        formatter_class=_DocuMindHelpFormatter,
        help="Set active context.",
        description="Persist context for future commands so ids can be omitted.",
        epilog="Example:\n  documind context-set --instance-id <iid> --namespace-id company_docs",
    )
    context_set_parser.add_argument("--instance-id", required=True, help="Instance id to persist in context.")
    context_set_parser.add_argument("--namespace-id", required=True, help="Namespace id to persist in context.")
    _add_bot_argument(context_set_parser)

    init_parser = subparsers.add_parser(
        "init",
        formatter_class=_DocuMindHelpFormatter,
        help="Bootstrap context for first-time use.",
        description=(
            "Initialize active context quickly.\n"
            "Selection order:\n"
            "  1) use --instance-id if provided\n"
            "  2) else use latest existing instance\n"
            "  3) else create a new instance with --instance-name/-description"
        ),
        epilog=(
            "Examples:\n"
            "  documind init --namespace-id company_docs\n"
            "  documind init --instance-id <iid> --namespace-id semester_1"
        ),
    )
    init_parser.add_argument(
        "--instance-id",
        default="",
        help="Existing instance_id to bind. If omitted, latest instance is picked or created.",
    )
    init_parser.add_argument(
        "--instance-name",
        default="DocuMind Instance",
        help="Used only when init must create a new instance.",
    )
    init_parser.add_argument(
        "--instance-description",
        default="Created by dcli init",
        help="Description for auto-created instance.",
    )
    init_parser.add_argument(
        "--namespace-id",
        default="",
        help="Namespace to store in active context. If omitted, init prompts in interactive shells.",
    )
    _add_bot_argument(init_parser)

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
    if args.command == "init":
        namespace_id = _resolve_init_namespace(args)
        if not namespace_id:
            return _error_response(
                message=(
                    "namespace_id is required for init in non-interactive mode. "
                    "Pass --namespace-id <value>."
                )
            )

        list_result = service.list_instances()
        if list_result.get("status") != "success":
            return list_result

        instances = list_result.get("data", {}).get("instances", [])
        selected_instance_id = args.instance_id.strip()
        created_instance = False
        selection_mode = ""

        if selected_instance_id:
            known_ids = {str(item.get("id", "")).strip() for item in instances if isinstance(item, dict)}
            if selected_instance_id not in known_ids:
                return _error_response(
                    error="not_found",
                    message=f"instance_id not found: {selected_instance_id}. Use `dcli instances` to list valid ids.",
                )
            selection_mode = "explicit"
        else:
            if instances:
                selected_instance_id = str(instances[0].get("id", "")).strip()
                selection_mode = "latest_existing"
            else:
                create_result = service.create_instance(
                    name=args.instance_name,
                    description=args.instance_description,
                )
                if create_result.get("status") != "success":
                    return create_result
                selected_instance_id = str(
                    create_result.get("data", {}).get("instance", {}).get("id", "")
                ).strip()
                if not selected_instance_id:
                    return _error_response(
                        error="server_error",
                        message="init failed: create_instance response missing instance id.",
                    )
                created_instance = True
                selection_mode = "created_new"

        set_result = service.set_active_context(
            instance_id=selected_instance_id,
            namespace_id=namespace_id,
            context_id=args.context_id,
        )
        if set_result.get("status") != "success":
            return set_result

        data = dict(set_result.get("data", {}))
        meta = dict(set_result.get("meta", {}))
        data["created_instance"] = created_instance
        data["selection_mode"] = selection_mode
        data["available_instances"] = len(instances)
        text = (
            f"Initialized context '{args.context_id}' -> "
            f"{selected_instance_id}/{namespace_id} ({selection_mode})."
        )
        return {
            "status": "success",
            "data": data,
            "meta": meta,
            "text": text,
        }

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


def _styled(text: str, *, color: str | None = None, bold: bool = False, dim: bool = False) -> str:
    if not sys.stdout.isatty():
        return text
    codes: list[str] = []
    if bold:
        codes.append("1")
    if dim:
        codes.append("2")
    if color:
        codes.append(color)
    if not codes:
        return text
    return f"\033[{';'.join(codes)}m{text}\033[0m"


def _format_scalar(value: Any) -> str:
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False)
    if value is None:
        return "-"
    return str(value)


def _render_kv_block(title: str, mapping: dict[str, Any]) -> str:
    keys = [key for key, value in mapping.items() if value not in ("", None)]
    if not keys:
        return ""
    width = max(len(key) for key in keys)
    lines = [_styled(title, bold=True, color="96")]
    for key in keys:
        label = key.replace("_", " ")
        lines.append(f"  {label.ljust(width)} : {_format_scalar(mapping[key])}")
    return "\n".join(lines)


def _render_table(headers: list[str], rows: list[list[Any]]) -> str:
    if not rows:
        return ""
    string_rows = [[_format_scalar(cell) for cell in row] for row in rows]
    widths = [len(header) for header in headers]
    for row in string_rows:
        for idx, cell in enumerate(row):
            widths[idx] = max(widths[idx], len(cell))
    header_line = " | ".join(headers[idx].ljust(widths[idx]) for idx in range(len(headers)))
    sep = "-+-".join("-" * widths[idx] for idx in range(len(headers)))
    lines = [header_line, sep]
    for row in string_rows:
        lines.append(" | ".join(row[idx].ljust(widths[idx]) for idx in range(len(headers))))
    return "\n".join(lines)


def _render_human_response(args: argparse.Namespace, response: dict[str, Any]) -> str:
    status = str(response.get("status", "unknown")).lower()
    text = str(response.get("text", "")).strip()
    data = response.get("data")
    meta = response.get("meta")
    lines: list[str] = []

    if status == "success":
        lines.append(_styled("DocuMind", bold=True, color="96"))
    else:
        lines.append(_styled("DocuMind Error", bold=True, color="91"))

    if text:
        lines.append(text)

    if status != "success":
        if isinstance(meta, dict):
            details = _render_kv_block("Error Details", meta)
            if details:
                lines.append(details)
        return "\n".join(lines)

    if args.command == "context-show" and isinstance(data, dict):
        block = _render_kv_block(
            "Active Context",
            {
                "context_id": data.get("context_id"),
                "instance_id": data.get("instance_id"),
                "namespace_id": data.get("namespace_id"),
                "updated_at": data.get("updated_at"),
            },
        )
        if block:
            lines.append(block)
        return "\n".join(lines)

    if args.command == "instances" and isinstance(data, dict):
        items = data.get("instances") or []
        rows = [
            [item.get("id"), item.get("name"), item.get("description"), item.get("updated_at")]
            for item in items
            if isinstance(item, dict)
        ]
        if rows:
            lines.append(_styled("Instances", bold=True, color="96"))
            lines.append(_render_table(["id", "name", "description", "updated_at"], rows))
        return "\n".join(lines)

    if args.command == "namespaces" and isinstance(data, dict):
        items = data.get("namespaces") or []
        if items:
            lines.append(_styled("Namespaces", bold=True, color="96"))
            for item in items:
                lines.append(f"  - {item}")
        return "\n".join(lines)

    if args.command == "list-kbs" and isinstance(data, dict):
        items = data.get("knowledge_bases") or []
        rows = [
            [item.get("id"), item.get("name"), item.get("namespace_id"), item.get("instance_id")]
            for item in items
            if isinstance(item, dict)
        ]
        if rows:
            lines.append(_styled("Knowledge Bases", bold=True, color="96"))
            lines.append(_render_table(["id", "name", "namespace_id", "instance_id"], rows))
        return "\n".join(lines)

    if args.command == "search-docs" and isinstance(data, dict):
        results = data.get("results") or []
        if results:
            lines.append(_styled("Search Results", bold=True, color="96"))
            for idx, result in enumerate(results, start=1):
                if not isinstance(result, dict):
                    continue
                source_ref = result.get("source_ref", "unknown")
                score = result.get("score", "-")
                text_value = str(result.get("text", "")).strip()
                lines.append(f"  [{idx}] {source_ref} (score: {score})")
                if text_value:
                    lines.append(f"      {text_value}")
        return "\n".join(lines)

    if args.command == "ask-docs" and isinstance(data, dict):
        answer = data.get("answer")
        if answer:
            lines.append(_styled("Answer", bold=True, color="96"))
            lines.append(str(answer))
        sources = data.get("sources") or []
        if sources:
            lines.append(_styled("Sources", bold=True, color="96"))
            for source in sources:
                if not isinstance(source, dict):
                    continue
                source_ref = source.get("source_ref", "unknown")
                score = source.get("score", "-")
                lines.append(f"  - {source_ref} (score: {score})")
        return "\n".join(lines)

    if args.command in {"ingest-text", "context-set", "init", "instance-create"} and isinstance(data, dict):
        block = _render_kv_block("Details", data)
        if block:
            lines.append(block)
        return "\n".join(lines)

    if isinstance(data, dict):
        block = _render_kv_block("Details", data)
        if block:
            lines.append(block)
    elif isinstance(data, list) and data:
        lines.append(_styled("Details", bold=True, color="96"))
        for item in data:
            lines.append(f"  - {_format_scalar(item)}")
    return "\n".join(lines)


def run_cli(argv: list[str] | None = None, *, service: DocuMindMCPService | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.command == "init" and not args.bot:
        _show_init_banner()
    active_service = service or _build_service(args.api_url)
    response = execute_command(args, active_service)
    if args.bot:
        print(json.dumps(response, indent=2))
    else:
        print(_render_human_response(args, response))
    return 0 if response.get("status") == "success" else 1


if __name__ == "__main__":
    raise SystemExit(run_cli())
