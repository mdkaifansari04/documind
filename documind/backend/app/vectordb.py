from __future__ import annotations

from collections.abc import Sequence
from typing import Any

from actian_vectorai import Distance, HnswConfigDiff, PointStruct, VectorAIClient, VectorParams

from app.config import settings


class VectorDBClient:
    DISTANCE_MAP = {
        "cosine": Distance.Cosine,
        "euclid": Distance.Euclid,
        "dot": Distance.Dot,
    }

    def __init__(self, url: str | None = None):
        self._url = url or settings.vectordb_url

    def _client(self) -> VectorAIClient:
        return VectorAIClient(self._url)

    def health_check(self) -> dict[str, Any]:
        with self._client() as client:
            return client.health_check()

    def collection_exists(self, name: str) -> bool:
        with self._client() as client:
            return client.collections.exists(name)

    def list_collections(self) -> list[str]:
        with self._client() as client:
            return client.collections.list()

    def create_collection(self, name: str, dim: int, distance: str = "cosine") -> None:
        metric = self.DISTANCE_MAP.get(distance, Distance.Cosine)
        with self._client() as client:
            if client.collections.exists(name):
                return
            client.collections.create(
                name,
                vectors_config=VectorParams(size=dim, distance=metric),
                hnsw_config=HnswConfigDiff(m=16, ef_construct=200),
            )

    def delete_collection(self, name: str) -> None:
        with self._client() as client:
            if client.collections.exists(name):
                client.collections.delete(name)

    def upsert_points(self, collection_name: str, points: Sequence[PointStruct]) -> None:
        if not points:
            return
        with self._client() as client:
            client.points.upsert(collection_name, list(points))

    def search(self, collection_name: str, vector: list[float], top_k: int = 5, filters: Any = None) -> list[Any]:
        with self._client() as client:
            return client.points.search(
                collection_name,
                vector=vector,
                limit=top_k,
                filter=filters,
            )

    def scroll_points(
        self,
        collection_name: str,
        *,
        limit: int = 100,
        offset: int | str | None = None,
        filters: Any = None,
    ) -> tuple[list[Any], int | str | None]:
        with self._client() as client:
            return client.points.scroll(
                collection_name,
                limit=limit,
                offset=offset,
                filter=filters,
                with_payload=True,
                with_vectors=False,
            )

    def count_points(self, collection_name: str) -> int:
        with self._client() as client:
            return client.points.count(collection_name)


vectordb = VectorDBClient()
