from __future__ import annotations

import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

from documind_cli import MAX_INGEST_BYTES, run_cli


class FakeService:
    def __init__(self):
        self.calls: list[tuple[str, dict]] = []
        self.ask_response = {
            "status": "success",
            "data": {"answer": "ok", "sources": []},
            "meta": {},
            "text": "ok",
        }
        self.instances_response = {"status": "success", "data": {"instances": []}, "meta": {}, "text": "ok"}
        self.create_instance_response = {
            "status": "success",
            "data": {"instance": {"id": "inst-new", "name": "New"}},
            "meta": {},
            "text": "ok",
        }
        self.set_context_response = {
            "status": "success",
            "data": {"context_id": "default", "instance_id": "inst-new", "namespace_id": "company_docs"},
            "meta": {},
            "text": "ok",
        }

    def search_docs(self, **kwargs):
        self.calls.append(("search_docs", kwargs))
        return {"status": "success", "data": {"results": []}, "meta": {}, "text": "ok"}

    def ask_docs(self, **kwargs):
        self.calls.append(("ask_docs", kwargs))
        return self.ask_response

    def ingest_text(self, **kwargs):
        self.calls.append(("ingest_text", kwargs))
        return {"status": "success", "data": {"chunks_indexed": 1}, "meta": {}, "text": "ok"}

    def list_knowledge_bases(self, **kwargs):
        self.calls.append(("list_knowledge_bases", kwargs))
        return {"status": "success", "data": {"knowledge_bases": []}, "meta": {}, "text": "ok"}

    def list_instances(self, **kwargs):
        self.calls.append(("list_instances", kwargs))
        return self.instances_response

    def create_instance(self, **kwargs):
        self.calls.append(("create_instance", kwargs))
        return self.create_instance_response

    def list_namespaces(self, **kwargs):
        self.calls.append(("list_namespaces", kwargs))
        return {"status": "success", "data": {"namespaces": ["company_docs"]}, "meta": {}, "text": "ok"}

    def get_active_context(self, **kwargs):
        self.calls.append(("get_active_context", kwargs))
        return {
            "status": "success",
            "data": {"context_id": "default", "instance_id": "inst-1", "namespace_id": "company_docs"},
            "meta": {},
            "text": "ok",
        }

    def set_active_context(self, **kwargs):
        self.calls.append(("set_active_context", kwargs))
        return self.set_context_response


class DocuMindCLITests(unittest.TestCase):
    def test_search_docs_dispatch(self) -> None:
        service = FakeService()
        buffer = io.StringIO()
        with redirect_stdout(buffer):
            exit_code = run_cli(
                [
                    "search-docs",
                    "--query",
                    "deploy",
                    "--instance-id",
                    "inst-1",
                    "--namespace-id",
                    "company_docs",
                    "--top-k",
                    "7",
                ],
                service=service,
            )

        self.assertEqual(exit_code, 0)
        self.assertEqual(len(service.calls), 1)
        name, payload = service.calls[0]
        self.assertEqual(name, "search_docs")
        self.assertEqual(payload["instance_id"], "inst-1")
        self.assertEqual(payload["namespace_id"], "company_docs")
        self.assertEqual(payload["top_k"], 7)
        self.assertEqual(payload["context_id"], "default")

    def test_search_docs_qr_alias_dispatch(self) -> None:
        service = FakeService()
        buffer = io.StringIO()
        with redirect_stdout(buffer):
            exit_code = run_cli(
                [
                    "search-docs",
                    "--qr",
                    "deploy",
                    "--instance-id",
                    "inst-1",
                    "--namespace-id",
                    "company_docs",
                ],
                service=service,
            )

        self.assertEqual(exit_code, 0)
        self.assertEqual(len(service.calls), 1)
        name, payload = service.calls[0]
        self.assertEqual(name, "search_docs")
        self.assertEqual(payload["query"], "deploy")

    def test_ask_docs_error_returns_non_zero(self) -> None:
        service = FakeService()
        service.ask_response = {
            "status": "error",
            "data": {},
            "meta": {"error": "timeout"},
            "text": "timeout",
        }
        buffer = io.StringIO()
        with redirect_stdout(buffer):
            exit_code = run_cli(
                [
                    "ask-docs",
                    "--question",
                    "what is auth flow?",
                    "--instance-id",
                    "inst-1",
                    "--namespace-id",
                    "company_docs",
                    "--bot=true",
                ],
                service=service,
            )

        self.assertEqual(exit_code, 1)
        rendered = json.loads(buffer.getvalue())
        self.assertEqual(rendered["status"], "error")

    def test_ask_docs_qs_alias_dispatch(self) -> None:
        service = FakeService()
        buffer = io.StringIO()
        with redirect_stdout(buffer):
            exit_code = run_cli(
                [
                    "ask-docs",
                    "-qs",
                    "what is auth flow?",
                    "--instance-id",
                    "inst-1",
                    "--namespace-id",
                    "company_docs",
                ],
                service=service,
            )

        self.assertEqual(exit_code, 0)
        self.assertEqual(len(service.calls), 1)
        name, payload = service.calls[0]
        self.assertEqual(name, "ask_docs")
        self.assertEqual(payload["question"], "what is auth flow?")

    def test_ingest_text_from_file(self) -> None:
        service = FakeService()
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_file = Path(temp_dir) / "sample.md"
            temp_file.write_text("hello world", encoding="utf-8")

            buffer = io.StringIO()
            with redirect_stdout(buffer):
                exit_code = run_cli(
                    [
                        "ingest-text",
                        "--instance-id",
                        "inst-1",
                        "--namespace-id",
                        "company_docs",
                        "--content-file",
                        str(temp_file),
                        "--source-ref",
                        "sample.md",
                    ],
                    service=service,
                )

        self.assertEqual(exit_code, 0)
        self.assertEqual(len(service.calls), 1)
        name, payload = service.calls[0]
        self.assertEqual(name, "ingest_text")
        self.assertEqual(payload["content"], "hello world")
        self.assertEqual(payload["source_ref"], "sample.md")

    def test_ingest_text_rejects_oversized_content(self) -> None:
        service = FakeService()
        oversized = "x" * (MAX_INGEST_BYTES + 1)
        buffer = io.StringIO()
        with redirect_stdout(buffer):
            exit_code = run_cli(
                [
                    "ingest-text",
                    "--instance-id",
                    "inst-1",
                    "--namespace-id",
                    "company_docs",
                    "--content",
                    oversized,
                    "--bot=true",
                ],
                service=service,
            )

        self.assertEqual(exit_code, 1)
        self.assertEqual(service.calls, [])
        rendered = json.loads(buffer.getvalue())
        self.assertEqual(rendered["meta"]["error"], "validation_error")

    def test_list_kbs_optional_instance_id_maps_to_none(self) -> None:
        service = FakeService()
        buffer = io.StringIO()
        with redirect_stdout(buffer):
            exit_code = run_cli(["list-kbs"], service=service)

        self.assertEqual(exit_code, 0)
        self.assertEqual(len(service.calls), 1)
        name, payload = service.calls[0]
        self.assertEqual(name, "list_knowledge_bases")
        self.assertIsNone(payload["instance_id"])

    def test_context_set_and_show_commands(self) -> None:
        service = FakeService()
        buffer = io.StringIO()
        with redirect_stdout(buffer):
            exit_code_set = run_cli(
                [
                    "--context-id",
                    "work",
                    "context-set",
                    "--instance-id",
                    "inst-2",
                    "--namespace-id",
                    "ops",
                ],
                service=service,
            )
            exit_code_show = run_cli(["--context-id", "work", "context-show"], service=service)

        self.assertEqual(exit_code_set, 0)
        self.assertEqual(exit_code_show, 0)
        self.assertEqual(service.calls[0][0], "set_active_context")
        self.assertEqual(service.calls[0][1]["context_id"], "work")
        self.assertEqual(service.calls[1][0], "get_active_context")
        self.assertEqual(service.calls[1][1]["context_id"], "work")

    def test_context_show_human_output_by_default(self) -> None:
        service = FakeService()
        buffer = io.StringIO()
        with redirect_stdout(buffer):
            exit_code = run_cli(["context-show"], service=service)

        self.assertEqual(exit_code, 0)
        output = buffer.getvalue()
        self.assertIn("Active Context", output)
        self.assertNotIn('{\n  "status":', output)

    def test_context_show_json_output_when_bot_enabled(self) -> None:
        service = FakeService()
        buffer = io.StringIO()
        with redirect_stdout(buffer):
            exit_code = run_cli(["context-show", "--bot=true"], service=service)

        self.assertEqual(exit_code, 0)
        rendered = json.loads(buffer.getvalue())
        self.assertEqual(rendered["status"], "success")
        self.assertEqual(rendered["data"]["context_id"], "default")

    def test_namespaces_command_uses_context_id(self) -> None:
        service = FakeService()
        buffer = io.StringIO()
        with redirect_stdout(buffer):
            exit_code = run_cli(["--context-id", "team-a", "namespaces"], service=service)

        self.assertEqual(exit_code, 0)
        self.assertEqual(len(service.calls), 1)
        name, payload = service.calls[0]
        self.assertEqual(name, "list_namespaces")
        self.assertEqual(payload["context_id"], "team-a")

    def test_instance_create_dispatch(self) -> None:
        service = FakeService()
        buffer = io.StringIO()
        with redirect_stdout(buffer):
            exit_code = run_cli(
                ["instance-create", "--name", "Hackathon A", "-d", "test"],
                service=service,
            )

        self.assertEqual(exit_code, 0)
        self.assertEqual(len(service.calls), 1)
        name, payload = service.calls[0]
        self.assertEqual(name, "create_instance")
        self.assertEqual(payload["name"], "Hackathon A")
        self.assertEqual(payload["description"], "test")

    def test_init_creates_instance_when_none_exist(self) -> None:
        service = FakeService()
        service.instances_response = {"status": "success", "data": {"instances": []}, "meta": {}, "text": "ok"}
        service.create_instance_response = {
            "status": "success",
            "data": {"instance": {"id": "inst-created"}},
            "meta": {},
            "text": "ok",
        }
        service.set_context_response = {
            "status": "success",
            "data": {"context_id": "default", "instance_id": "inst-created", "namespace_id": "company_docs"},
            "meta": {},
            "text": "ok",
        }
        buffer = io.StringIO()
        with redirect_stdout(buffer):
            exit_code = run_cli(["init", "--namespace-id", "company_docs", "--bot=true"], service=service)

        self.assertEqual(exit_code, 0)
        self.assertEqual([name for name, _ in service.calls], ["list_instances", "create_instance", "set_active_context"])
        rendered = json.loads(buffer.getvalue())
        self.assertEqual(rendered["status"], "success")
        self.assertTrue(rendered["data"]["created_instance"])
        self.assertEqual(rendered["data"]["selection_mode"], "created_new")

    def test_init_uses_latest_instance_when_available(self) -> None:
        service = FakeService()
        service.instances_response = {
            "status": "success",
            "data": {"instances": [{"id": "inst-latest"}, {"id": "inst-older"}]},
            "meta": {},
            "text": "ok",
        }
        service.set_context_response = {
            "status": "success",
            "data": {"context_id": "default", "instance_id": "inst-latest", "namespace_id": "company_docs"},
            "meta": {},
            "text": "ok",
        }
        buffer = io.StringIO()
        with redirect_stdout(buffer):
            exit_code = run_cli(["init", "--namespace-id", "company_docs", "--bot=true"], service=service)

        self.assertEqual(exit_code, 0)
        self.assertEqual([name for name, _ in service.calls], ["list_instances", "set_active_context"])
        set_payload = service.calls[1][1]
        self.assertEqual(set_payload["instance_id"], "inst-latest")
        rendered = json.loads(buffer.getvalue())
        self.assertEqual(rendered["data"]["selection_mode"], "latest_existing")

    def test_init_with_invalid_instance_id_fails(self) -> None:
        service = FakeService()
        service.instances_response = {
            "status": "success",
            "data": {"instances": [{"id": "inst-1"}]},
            "meta": {},
            "text": "ok",
        }
        buffer = io.StringIO()
        with redirect_stdout(buffer):
            exit_code = run_cli(
                ["init", "--instance-id", "bad-id", "--namespace-id", "company_docs", "--bot=true"],
                service=service,
            )

        self.assertEqual(exit_code, 1)
        self.assertEqual([name for name, _ in service.calls], ["list_instances"])
        rendered = json.loads(buffer.getvalue())
        self.assertEqual(rendered["status"], "error")
        self.assertEqual(rendered["meta"]["error"], "not_found")

    def test_init_requires_namespace_in_non_interactive_mode(self) -> None:
        service = FakeService()
        buffer = io.StringIO()
        with patch("documind_cli.sys.stdin.isatty", return_value=False):
            with redirect_stdout(buffer):
                exit_code = run_cli(["init", "--bot=true"], service=service)

        self.assertEqual(exit_code, 1)
        self.assertEqual(service.calls, [])
        rendered = json.loads(buffer.getvalue())
        self.assertEqual(rendered["status"], "error")
        self.assertEqual(rendered["meta"]["error"], "validation_error")


if __name__ == "__main__":
    unittest.main()
