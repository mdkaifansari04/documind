from __future__ import annotations

from enum import Enum
import re

from app.embeddings import EmbeddingProfile


class LLMProfile(str, Enum):
    FAST = "fast"
    BALANCED = "balanced"
    QUALITY = "quality"


class RoutingService:
    _CODE_SOURCE_TYPES = {
        "code",
        "source_code",
        "repository",
        "repo",
        "github",
        "code_snippet",
    }
    _MULTIMODAL_SOURCE_TYPES = {
        "image",
        "images",
        "image_text",
        "multimodal",
        "vision",
    }
    _BALANCED_SOURCE_TYPES = {
        "pdf",
        "url",
        "webpage",
    }
    _MEMORY_SOURCE_TYPES = {
        "conversation_history_json",
        "transcript",
    }

    @staticmethod
    def _looks_like_code(text: str) -> bool:
        if not text:
            return False
        lowered = text.lower()
        keyword_hits = sum(
            phrase in lowered
            for phrase in ("def ", "class ", "function ", "import ", "return ", "select ", "from ", "const ", "let ", "var ", "public ", "private ", "protected ", "interface ", "implements ", "extends ")
        )
        symbol_hits = len(re.findall(r"[{}();<>#]", text))
        return keyword_hits >= 1 and symbol_hits >= 2

    def recommend_embedding_profile(
        self,
        *,
        source_type: str,
        explicit_profile: str | EmbeddingProfile | None = None,
        hint_text: str | None = None,
    ) -> EmbeddingProfile:
        if explicit_profile:
            return EmbeddingProfile(explicit_profile)

        normalized = source_type.strip().lower()
        if normalized in self._CODE_SOURCE_TYPES:
            return EmbeddingProfile.CODE_SEARCH
        if normalized in self._MULTIMODAL_SOURCE_TYPES:
            return EmbeddingProfile.MULTIMODAL_TEXT_IMAGE
        if normalized in self._MEMORY_SOURCE_TYPES:
            return EmbeddingProfile.GENERAL_TEXT_SEARCH
        if normalized in self._BALANCED_SOURCE_TYPES:
            return EmbeddingProfile.BALANCED_TEXT

        if hint_text and self._looks_like_code(hint_text):
            return EmbeddingProfile.CODE_SEARCH
        return EmbeddingProfile.GENERAL_TEXT_SEARCH

    def recommend_llm_profile(
        self,
        *,
        question: str,
        explicit_profile: str | LLMProfile | None = None,
        retrieved_source_count: int = 0,
        latency_sensitive: bool = False,
    ) -> LLMProfile:
        if explicit_profile:
            return LLMProfile(explicit_profile)
        if latency_sensitive:
            return LLMProfile.FAST

        token_count = len(question.split())
        lowered = question.lower()
        complexity_signals = sum(
            phrase in lowered
            for phrase in ("explain", "compare", "tradeoff", "migration", "architecture", "step by step")
        )

        if token_count <= 4 and retrieved_source_count <= 2:
            return LLMProfile.FAST
        if retrieved_source_count >= 8 or token_count >= 22 or complexity_signals >= 2:
            return LLMProfile.QUALITY
        return LLMProfile.BALANCED
