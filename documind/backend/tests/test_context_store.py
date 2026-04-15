from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from mcp_server.context_store import ActiveContextStore


class ActiveContextStoreTests(unittest.TestCase):
    def test_set_and_get_context(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            store_path = Path(temp_dir) / "contexts.json"
            store = ActiveContextStore(str(store_path))

            saved = store.set(context_id="default", instance_id="inst-1", namespace_id="company_docs")
            loaded = store.get("default")

            self.assertEqual(saved.instance_id, "inst-1")
            self.assertIsNotNone(loaded)
            self.assertEqual(loaded.instance_id, "inst-1")
            self.assertEqual(loaded.namespace_id, "company_docs")

    def test_returns_none_when_context_missing(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            store_path = Path(temp_dir) / "contexts.json"
            store = ActiveContextStore(str(store_path))
            self.assertIsNone(store.get("missing"))


if __name__ == "__main__":
    unittest.main()
