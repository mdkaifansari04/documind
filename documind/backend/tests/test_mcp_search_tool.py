from __future__ import annotations

import unittest

import httpx

from mcp_server.service import DocuMindMCPService, MCPTimeouts


class FakeContextStore:
    def __init__(self):
        self._contexts: dict[str, dict] = {}

    def get(self, context_id: str):
        row = self._contexts.get(context_id)
        if not row:
            return None

        class _Active:
            def __init__(self, payload: dict):
                self.context_id = payload["context_id"]
                self.instance_id = payload["instance_id"]
                self.namespace_id = payload["namespace_id"]
                self.updated_at = payload["updated_at"]

            def as_dict(self):
                return {
                    "context_id": self.context_id,
                    "instance_id": self.instance_id,
                    "namespace_id": self.namespace_id,
                    "updated_at": self.updated_at,
                }

        return _Active(row)

    def set(self, *, context_id: str, instance_id: str, namespace_id: str):
        payload = {
            "context_id": context_id,
            "instance_id": instance_id,
            "namespace_id": namespace_id,
            "updated_at": "2026-04-15T00:00:00",
        }
        self._contexts[context_id] = payload
        return self.get(context_id)


class FakeAPIClient:
    def __init__(self, post_responses=None, get_responses=None):
        self._post_responses = list(post_responses or [])
        self._get_responses = list(get_responses or [])
        self.post_calls: list[tuple[str, dict, int]] = []
        self.get_calls: list[tuple[str, dict, int]] = []

    def post_json(self, path: str, payload: dict, timeout_seconds: int) -> tuple[int, dict]:
        self.post_calls.append((path, payload, timeout_seconds))
        if not self._post_responses:
            raise AssertionError("No fake POST response left for call")
        return self._post_responses.pop(0)

    def get_json(self, path: str, params: dict, timeout_seconds: int) -> tuple[int, dict]:
        self.get_calls.append((path, params, timeout_seconds))
        if not self._get_responses:
            raise AssertionError("No fake GET response left for call")
        return self._get_responses.pop(0)


class FailingGetAPIClient(FakeAPIClient):
    def __init__(self, exc: Exception):
        super().__init__(post_responses=[], get_responses=[])
        self._exc = exc

    def get_json(self, path: str, params: dict, timeout_seconds: int) -> tuple[int, dict]:
        self.get_calls.append((path, params, timeout_seconds))
        raise self._exc


class UnwritableContextStore(FakeContextStore):
    def set(self, *, context_id: str, instance_id: str, namespace_id: str):
        raise PermissionError("Operation not permitted")


class MCPToolSearchTests(unittest.TestCase):
    def setUp(self) -> None:
        self.timeouts = MCPTimeouts(search_seconds=8, ask_seconds=25, ingest_seconds=20)

    def test_search_docs_primary_success_caps_top_k_without_fallback(self) -> None:
        fake_client = FakeAPIClient(
            post_responses=[
                (
                    200,
                    {
                        "kb_id": "kb-1",
                        "results": [
                            {"id": 1, "text": "deploy runbook", "score": 0.91, "source_ref": "ops.md"},
                        ],
                    },
                ),
            ]
        )
        service = DocuMindMCPService(api_client=fake_client, timeouts=self.timeouts)

        result = service.search_docs(
            query="deployment flow",
            instance_id="inst-1",
            namespace_id="company_docs",
            top_k=100,
        )

        self.assertEqual(result["status"], "success")
        self.assertEqual(len(fake_client.post_calls), 1)

        path, payload, timeout = fake_client.post_calls[0]
        self.assertEqual(path, "/search/instance")
        self.assertEqual(payload["top_k"], 20)
        self.assertEqual(timeout, 8)

        self.assertFalse(result["meta"]["fallback_used"])
        self.assertEqual(len(result["data"]["results"]), 1)

    def test_search_docs_uses_advanced_fallback_when_primary_is_empty(self) -> None:
        fake_client = FakeAPIClient(
            post_responses=[
                (200, {"kb_id": "kb-1", "results": []}),
                (
                    200,
                    {
                        "mode": "hybrid",
                        "results": [
                            {"id": 11, "text": "fallback hit", "score": 0.76, "source_ref": "guide.md"},
                        ],
                    },
                ),
            ]
        )
        service = DocuMindMCPService(api_client=fake_client, timeouts=self.timeouts)

        result = service.search_docs(
            query="payment deploy",
            instance_id="inst-1",
            namespace_id="company_docs",
            top_k=5,
        )

        self.assertEqual(result["status"], "success")
        self.assertEqual(len(fake_client.post_calls), 2)

        first_path, _, _ = fake_client.post_calls[0]
        second_path, second_payload, _ = fake_client.post_calls[1]
        self.assertEqual(first_path, "/search/instance")
        self.assertEqual(second_path, "/search/advanced")
        self.assertEqual(second_payload["mode"], "hybrid")
        self.assertEqual(second_payload["hybrid"]["method"], "rrf")
        self.assertTrue(result["meta"]["fallback_used"])
        self.assertEqual(len(result["data"]["results"]), 1)

    def test_search_docs_not_found_error_mapping(self) -> None:
        fake_client = FakeAPIClient(
            post_responses=[
                (404, {"detail": "Knowledge base not found for instance_id + namespace_id"}),
            ]
        )
        service = DocuMindMCPService(api_client=fake_client, timeouts=self.timeouts)

        result = service.search_docs(
            query="x",
            instance_id="inst-1",
            namespace_id="company_docs",
        )

        self.assertEqual(result["status"], "error")
        self.assertEqual(result["meta"]["error"], "not_found")
        self.assertIn("not found", result["text"].lower())


class MCPToolOtherTests(unittest.TestCase):
    def setUp(self) -> None:
        self.timeouts = MCPTimeouts(search_seconds=8, ask_seconds=25, ingest_seconds=20)

    def test_ask_docs_primary_success_without_fallback(self) -> None:
        fake_client = FakeAPIClient(
            post_responses=[
                (
                    200,
                    {
                        "answer": "Use rollout command.",
                        "sources": [{"id": 1, "text": "x", "score": 0.91, "source_ref": "deploy.md"}],
                        "response_ms": 140,
                    },
                )
            ]
        )
        service = DocuMindMCPService(api_client=fake_client, timeouts=self.timeouts)

        result = service.ask_docs(
            question="How to deploy?",
            instance_id="inst-1",
            namespace_id="company_docs",
            top_k=3,
        )

        self.assertEqual(result["status"], "success")
        self.assertEqual(len(fake_client.post_calls), 1)
        self.assertEqual(fake_client.post_calls[0][0], "/query/instance")
        self.assertFalse(result["meta"]["fallback_used"])
        self.assertEqual(result["data"]["answer"], "Use rollout command.")

    def test_ask_docs_fallback_when_no_sources(self) -> None:
        fake_client = FakeAPIClient(
            post_responses=[
                (200, {"answer": "Unsure", "sources": [], "response_ms": 10}),
                (
                    200,
                    {
                        "answer": "Final answer",
                        "sources": [{"id": 2, "text": "y", "score": 0.72, "source_ref": "ops.md"}],
                        "response_ms": 220,
                        "mode": "hybrid",
                    },
                ),
            ]
        )
        service = DocuMindMCPService(api_client=fake_client, timeouts=self.timeouts)

        result = service.ask_docs(
            question="Where is deploy runbook?",
            instance_id="inst-1",
            namespace_id="company_docs",
            top_k=5,
        )

        self.assertEqual(result["status"], "success")
        self.assertEqual(len(fake_client.post_calls), 2)
        self.assertEqual(fake_client.post_calls[0][0], "/query/instance")
        self.assertEqual(fake_client.post_calls[1][0], "/query/advanced")
        self.assertTrue(result["meta"]["fallback_used"])
        self.assertEqual(result["data"]["answer"], "Final answer")

    def test_ingest_text_success(self) -> None:
        fake_client = FakeAPIClient(
            post_responses=[
                (200, {"status": "success", "kb_id": "kb-1", "resource_id": "r-1", "chunks_indexed": 3}),
            ]
        )
        service = DocuMindMCPService(api_client=fake_client, timeouts=self.timeouts)

        result = service.ingest_text(
            content="release notes",
            instance_id="inst-1",
            namespace_id="company_docs",
            source_ref="notes.md",
        )

        self.assertEqual(result["status"], "success")
        self.assertEqual(len(fake_client.post_calls), 1)
        path, payload, timeout = fake_client.post_calls[0]
        self.assertEqual(path, "/resources")
        self.assertEqual(payload["source_type"], "text")
        self.assertEqual(timeout, 20)
        self.assertEqual(result["data"]["chunks_indexed"], 3)

    def test_list_knowledge_bases_success_with_filter(self) -> None:
        fake_client = FakeAPIClient(
            get_responses=[
                (
                    200,
                    {
                        "data": [
                            {"id": "kb-1", "name": "Docs", "namespace_id": "company_docs"},
                            {"id": "kb-2", "name": "Runbooks", "namespace_id": "ops"},
                        ]
                    },
                )
            ]
        )
        service = DocuMindMCPService(api_client=fake_client, timeouts=self.timeouts)

        result = service.list_knowledge_bases(instance_id="inst-1")

        self.assertEqual(result["status"], "success")
        self.assertEqual(len(fake_client.get_calls), 1)
        path, params, timeout = fake_client.get_calls[0]
        self.assertEqual(path, "/knowledge-bases")
        self.assertEqual(params["instance_id"], "inst-1")
        self.assertEqual(timeout, 8)
        self.assertEqual(len(result["data"]["knowledge_bases"]), 2)

    def test_search_docs_uses_active_context_when_ids_missing(self) -> None:
        fake_client = FakeAPIClient(
            post_responses=[(200, {"results": [{"id": 1, "text": "x", "score": 0.9, "source_ref": "a.md"}]})]
        )
        context_store = FakeContextStore()
        context_store.set(context_id="default", instance_id="inst-ctx", namespace_id="ns-ctx")
        service = DocuMindMCPService(
            api_client=fake_client,
            timeouts=self.timeouts,
            context_store=context_store,
            default_context_id="default",
        )

        result = service.search_docs(query="deploy")

        self.assertEqual(result["status"], "success")
        self.assertTrue(result["meta"]["context_used"])
        _, payload, _ = fake_client.post_calls[0]
        self.assertEqual(payload["instance_id"], "inst-ctx")
        self.assertEqual(payload["namespace_id"], "ns-ctx")

    def test_search_docs_errors_when_context_missing_and_ids_missing(self) -> None:
        fake_client = FakeAPIClient()
        service = DocuMindMCPService(
            api_client=fake_client,
            timeouts=self.timeouts,
            context_store=FakeContextStore(),
            default_context_id="default",
        )

        result = service.search_docs(query="deploy")

        self.assertEqual(result["status"], "error")
        self.assertEqual(result["meta"]["error"], "validation_error")
        self.assertEqual(result["meta"]["reason"], "context_missing")
        self.assertEqual(result["meta"]["action_required"], "set_active_context")

    def test_set_and_get_active_context(self) -> None:
        fake_client = FakeAPIClient(
            get_responses=[
                (200, {"data": [{"id": "inst-1", "name": "A"}]}),
                (200, {"data": [{"id": "kb-1", "namespace_id": "company_docs"}]}),
            ]
        )
        context_store = FakeContextStore()
        service = DocuMindMCPService(
            api_client=fake_client,
            timeouts=self.timeouts,
            context_store=context_store,
            default_context_id="default",
        )

        set_result = service.set_active_context(instance_id="inst-1", namespace_id="company_docs")
        get_result = service.get_active_context()

        self.assertEqual(set_result["status"], "success")
        self.assertTrue(set_result["data"]["namespace_known"])
        self.assertEqual(get_result["status"], "success")
        self.assertEqual(get_result["data"]["instance_id"], "inst-1")
        self.assertEqual(get_result["data"]["namespace_id"], "company_docs")

    def test_list_namespaces_from_context(self) -> None:
        fake_client = FakeAPIClient(
            get_responses=[
                (200, {"data": [{"id": "kb-1", "namespace_id": "company_docs"}, {"id": "kb-2", "namespace_id": "ops"}]}),
            ]
        )
        context_store = FakeContextStore()
        context_store.set(context_id="default", instance_id="inst-1", namespace_id="company_docs")
        service = DocuMindMCPService(
            api_client=fake_client,
            timeouts=self.timeouts,
            context_store=context_store,
            default_context_id="default",
        )

        result = service.list_namespaces()

        self.assertEqual(result["status"], "success")
        self.assertEqual(result["meta"]["instance_id"], "inst-1")
        self.assertTrue(result["meta"]["context_used"])
        self.assertEqual(result["data"]["namespaces"], ["company_docs", "ops"])

    def test_create_instance_success(self) -> None:
        fake_client = FakeAPIClient(
            post_responses=[
                (200, {"id": "inst-1", "name": "Hackathon", "description": "desc"}),
            ]
        )
        service = DocuMindMCPService(api_client=fake_client, timeouts=self.timeouts)

        result = service.create_instance(name="Hackathon", description="desc")

        self.assertEqual(result["status"], "success")
        self.assertEqual(len(fake_client.post_calls), 1)
        path, payload, _ = fake_client.post_calls[0]
        self.assertEqual(path, "/instances")
        self.assertEqual(payload["name"], "Hackathon")

    def test_list_namespaces_not_found_for_invalid_instance(self) -> None:
        fake_client = FakeAPIClient(
            get_responses=[
                (200, {"data": []}),  # /knowledge-bases?instance_id=bad
                (200, {"data": [{"id": "inst-1", "name": "Valid"}]}),  # /instances
            ]
        )
        service = DocuMindMCPService(api_client=fake_client, timeouts=self.timeouts)

        result = service.list_namespaces(instance_id="bad-instance")

        self.assertEqual(result["status"], "error")
        self.assertEqual(result["meta"]["error"], "not_found")

    def test_list_instances_surfaces_network_blocked_connect_error(self) -> None:
        req = httpx.Request("GET", "http://localhost:8000/instances")
        fake_client = FailingGetAPIClient(httpx.ConnectError("Operation not permitted", request=req))
        service = DocuMindMCPService(api_client=fake_client, timeouts=self.timeouts)

        result = service.list_instances()

        self.assertEqual(result["status"], "error")
        self.assertEqual(result["meta"]["error"], "network_blocked")
        self.assertEqual(result["meta"]["reason"], "network_permission_denied")
        self.assertIn("Network access is blocked", result["text"])

    def test_set_active_context_returns_structured_error_when_store_unwritable(self) -> None:
        fake_client = FakeAPIClient(
            get_responses=[
                (200, {"data": [{"id": "inst-1", "name": "Valid"}]}),
                (200, {"data": []}),
            ]
        )
        service = DocuMindMCPService(
            api_client=fake_client,
            timeouts=self.timeouts,
            context_store=UnwritableContextStore(),
            default_context_id="default",
        )

        result = service.set_active_context(instance_id="inst-1", namespace_id="company_docs")

        self.assertEqual(result["status"], "error")
        self.assertEqual(result["meta"]["error"], "server_error")
        self.assertEqual(result["meta"]["reason"], "context_store_unwritable")
        self.assertIn("Failed to persist active context", result["text"])


if __name__ == "__main__":
    unittest.main()
