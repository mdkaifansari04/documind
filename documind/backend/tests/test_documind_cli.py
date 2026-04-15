from __future__ import annotations

import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

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
        return {"status": "success", "data": {"instances": []}, "meta": {}, "text": "ok"}

    def create_instance(self, **kwargs):
        self.calls.append(("create_instance", kwargs))
        return {"status": "success", "data": {"instance": {"id": "inst-new"}}, "meta": {}, "text": "ok"}

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
        return {
            "status": "success",
            "data": {"context_id": kwargs.get("context_id", "default")},
            "meta": {},
            "text": "ok",
        }


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
                ],
                service=service,
            )

        self.assertEqual(exit_code, 1)
        rendered = json.loads(buffer.getvalue())
        self.assertEqual(rendered["status"], "error")

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
                ["instance-create", "--name", "Hackathon A", "--description", "test"],
                service=service,
            )

        self.assertEqual(exit_code, 0)
        self.assertEqual(len(service.calls), 1)
        name, payload = service.calls[0]
        self.assertEqual(name, "create_instance")
        self.assertEqual(payload["name"], "Hackathon A")
        self.assertEqual(payload["description"], "test")


if __name__ == "__main__":
    unittest.main()
