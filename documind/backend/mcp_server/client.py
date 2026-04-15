from __future__ import annotations

from typing import Any

import httpx


class DocuMindAPIClient:
    def __init__(self, base_url: str):
        self._base_url = base_url.rstrip("/")

    def _url(self, path: str) -> str:
        normalized_path = path if path.startswith("/") else f"/{path}"
        return f"{self._base_url}{normalized_path}"

    def post_json(self, path: str, payload: dict[str, Any], timeout_seconds: int) -> tuple[int, dict[str, Any]]:
        response = httpx.post(
            self._url(path),
            json=payload,
            timeout=timeout_seconds,
        )
        return response.status_code, self._safe_json(response)

    def get_json(self, path: str, params: dict[str, Any], timeout_seconds: int) -> tuple[int, dict[str, Any]]:
        response = httpx.get(
            self._url(path),
            params=params,
            timeout=timeout_seconds,
        )
        return response.status_code, self._safe_json(response)

    @staticmethod
    def _safe_json(response: httpx.Response) -> dict[str, Any]:
        try:
            loaded = response.json()
        except Exception:
            return {}
        if isinstance(loaded, dict):
            return loaded
        return {"data": loaded}
