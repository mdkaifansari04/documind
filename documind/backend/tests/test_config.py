from __future__ import annotations

import os
import tempfile
import unittest
from unittest.mock import patch

from mcp_server.config import _resolve_context_store_path, load_settings


class MCPConfigTests(unittest.TestCase):
    def test_load_settings_honors_explicit_context_store_env(self) -> None:
        with patch.dict(os.environ, {"DOCUMIND_CONTEXT_STORE_PATH": "/tmp/custom-contexts.json"}, clear=False):
            settings = load_settings()
        self.assertEqual(settings.context_store_path, "/tmp/custom-contexts.json")

    def test_context_store_path_falls_back_to_tmp_when_default_unwritable(self) -> None:
        with patch.dict(os.environ, {}, clear=True):
            with patch("mcp_server.config._is_context_store_writable", return_value=False):
                resolved = _resolve_context_store_path()
        expected_prefix = tempfile.gettempdir()
        self.assertTrue(resolved.startswith(expected_prefix))
        self.assertTrue(resolved.endswith("documind/contexts.json"))


if __name__ == "__main__":
    unittest.main()
