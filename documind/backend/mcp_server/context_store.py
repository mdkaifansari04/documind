from __future__ import annotations

import json
import threading
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class ActiveContext:
    context_id: str
    instance_id: str
    namespace_id: str
    updated_at: str

    def as_dict(self) -> dict[str, Any]:
        return {
            "context_id": self.context_id,
            "instance_id": self.instance_id,
            "namespace_id": self.namespace_id,
            "updated_at": self.updated_at,
        }


class ActiveContextStore:
    def __init__(self, file_path: str):
        self._path = Path(file_path).expanduser()
        self._lock = threading.Lock()

    @staticmethod
    def _now() -> str:
        return datetime.utcnow().isoformat()

    def _load_unlocked(self) -> dict[str, Any]:
        if not self._path.exists():
            return {"version": 1, "contexts": {}}
        try:
            content = self._path.read_text(encoding="utf-8")
            data = json.loads(content)
        except Exception:
            return {"version": 1, "contexts": {}}
        if not isinstance(data, dict):
            return {"version": 1, "contexts": {}}
        contexts = data.get("contexts")
        if not isinstance(contexts, dict):
            data["contexts"] = {}
        data.setdefault("version", 1)
        return data

    def _save_unlocked(self, data: dict[str, Any]) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(json.dumps(data, indent=2, sort_keys=True), encoding="utf-8")

    def get(self, context_id: str) -> ActiveContext | None:
        resolved_context_id = context_id.strip()
        if not resolved_context_id:
            return None
        with self._lock:
            data = self._load_unlocked()
            raw = data.get("contexts", {}).get(resolved_context_id)
            if not isinstance(raw, dict):
                return None
            instance_id = str(raw.get("instance_id", "")).strip()
            namespace_id = str(raw.get("namespace_id", "")).strip()
            updated_at = str(raw.get("updated_at", "")).strip()
            if not instance_id or not namespace_id:
                return None
            return ActiveContext(
                context_id=resolved_context_id,
                instance_id=instance_id,
                namespace_id=namespace_id,
                updated_at=updated_at or self._now(),
            )

    def set(self, *, context_id: str, instance_id: str, namespace_id: str) -> ActiveContext:
        resolved_context_id = context_id.strip()
        resolved_instance_id = instance_id.strip()
        resolved_namespace_id = namespace_id.strip()
        if not resolved_context_id or not resolved_instance_id or not resolved_namespace_id:
            raise ValueError("context_id, instance_id, and namespace_id are required")

        active = ActiveContext(
            context_id=resolved_context_id,
            instance_id=resolved_instance_id,
            namespace_id=resolved_namespace_id,
            updated_at=self._now(),
        )
        with self._lock:
            data = self._load_unlocked()
            contexts = data.setdefault("contexts", {})
            if not isinstance(contexts, dict):
                contexts = {}
                data["contexts"] = contexts
            contexts[resolved_context_id] = {
                "instance_id": resolved_instance_id,
                "namespace_id": resolved_namespace_id,
                "updated_at": active.updated_at,
            }
            self._save_unlocked(data)
        return active
