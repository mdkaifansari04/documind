from __future__ import annotations

from typing import Any

from app.config import settings
from app.routing import LLMProfile


class UpstreamLLMError(RuntimeError):
    """Raised when configured upstream LLM provider fails and fallback is disabled."""


class AgentService:
    def __init__(
        self,
        *,
        openai_key: str | None = None,
        openai_timeout_seconds: float | None = None,
        allow_fallback_on_error: bool | None = None,
    ):
        self._openai_key = settings.openai_api_key if openai_key is None else openai_key
        self._openai_timeout_seconds = (
            settings.openai_timeout_seconds
            if openai_timeout_seconds is None
            else openai_timeout_seconds
        )
        self._allow_fallback_on_error = (
            settings.llm_fallback_on_error
            if allow_fallback_on_error is None
            else allow_fallback_on_error
        )

    @staticmethod
    def _build_context(sources: list[dict[str, Any]]) -> str:
        blocks = []
        for idx, src in enumerate(sources, start=1):
            source_ref = src.get("source_ref", "unknown")
            score = src.get("score", 0.0)
            text = src.get("text", "")
            blocks.append(f"[{idx}] Source: {source_ref} (score: {score:.3f})\n{text}")
        return "\n\n---\n\n".join(blocks)

    @staticmethod
    def _local_answer(
        question: str,
        sources: list[dict[str, Any]],
        *,
        error_reason: str | None = None,
    ) -> str:
        if not sources:
            return "I don't know based on the current knowledge base."

        lines: list[str] = []
        for idx, src in enumerate(sources[:3], start=1):
            source_ref = str(src.get("source_ref", "unknown"))
            text = " ".join(str(src.get("text", "")).split())
            if len(text) > 220:
                text = f"{text[:217].rstrip()}..."
            lines.append(f"{idx}. {text} (source: {source_ref})")

        heading = "Retrieval-only fallback answer"
        if error_reason:
            heading = "OpenAI unavailable; returning retrieval-only fallback answer"

        return (
            f"{heading}.\n\n"
            f"Question: {question}\n\n"
            "Most relevant evidence:\n"
            f"{chr(10).join(lines)}"
        )

    @staticmethod
    def _resolve_model_for_profile(profile: LLMProfile) -> str:
        if profile == LLMProfile.FAST:
            return settings.llm_fast_model
        if profile == LLMProfile.QUALITY:
            return settings.llm_quality_model
        return settings.llm_balanced_model

    def _openai_answer(self, question: str, context: str, llm_profile: LLMProfile) -> str:
        import httpx
        import openai

        with httpx.Client(timeout=self._openai_timeout_seconds) as http_client:
            client = openai.OpenAI(
                api_key=self._openai_key,
                timeout=self._openai_timeout_seconds,
                http_client=http_client,
            )
            response = client.chat.completions.create(
                model=self._resolve_model_for_profile(llm_profile),
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a grounded assistant. Only answer using the provided context. "
                            "If context is insufficient, say you don't know."
                        ),
                    },
                    {
                        "role": "user",
                        "content": f"Context:\n{context}\n\nQuestion: {question}",
                    },
                ],
                temperature=0.2,
                max_tokens=500,
            )
        return response.choices[0].message.content or "I don't know."

    def answer(
        self,
        *,
        question: str,
        sources: list[dict[str, Any]],
        llm_profile: LLMProfile | str | None = None,
    ) -> str:
        context = self._build_context(sources)
        profile = LLMProfile(llm_profile) if llm_profile else LLMProfile.BALANCED
        if not self._openai_key:
            return self._local_answer(question, sources)

        try:
            return self._openai_answer(question, context, profile)
        except Exception as exc:
            if self._allow_fallback_on_error:
                return self._local_answer(
                    question,
                    sources,
                    error_reason=f"{type(exc).__name__}: {exc}",
                )
            raise UpstreamLLMError(f"OpenAI request failed: {type(exc).__name__}: {exc}") from exc
