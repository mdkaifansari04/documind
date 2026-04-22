from __future__ import annotations

import unittest

from app.routing import LLMProfile
from app.services.agent import AgentService, UpstreamLLMError


class AgentServiceTests(unittest.TestCase):
    def test_returns_local_fallback_when_openai_key_missing(self) -> None:
        service = AgentService(openai_key="", allow_fallback_on_error=True)

        answer = service.answer(
            question="How do we deploy?",
            sources=[
                {
                    "id": 1,
                    "text": "Merge PR, wait for CI, then promote stable image",
                    "score": 0.91,
                    "source_ref": "deploy.md",
                }
            ],
            llm_profile=LLMProfile.FAST,
        )

        self.assertIn("retrieval-only fallback", answer.lower())
        self.assertIn("deploy.md", answer)

    def test_raises_upstream_error_when_openai_fails_and_fallback_disabled(self) -> None:
        service = AgentService(openai_key="sk-test", allow_fallback_on_error=False)

        def _boom(question: str, context: str, llm_profile: LLMProfile) -> str:
            raise RuntimeError("connection down")

        service._openai_answer = _boom  # type: ignore[method-assign]

        with self.assertRaises(UpstreamLLMError) as exc:
            service.answer(
                question="How do we deploy?",
                sources=[{"id": 1, "text": "chunk", "score": 0.7, "source_ref": "ops.md"}],
                llm_profile=LLMProfile.FAST,
            )

        self.assertIn("OpenAI request failed", str(exc.exception))

    def test_uses_local_fallback_when_openai_fails_and_fallback_enabled(self) -> None:
        service = AgentService(openai_key="sk-test", allow_fallback_on_error=True)

        def _boom(question: str, context: str, llm_profile: LLMProfile) -> str:
            raise RuntimeError("connection down")

        service._openai_answer = _boom  # type: ignore[method-assign]

        answer = service.answer(
            question="How do we deploy?",
            sources=[{"id": 1, "text": "chunk", "score": 0.7, "source_ref": "ops.md"}],
            llm_profile=LLMProfile.FAST,
        )

        self.assertIn("retrieval-only fallback", answer.lower())


if __name__ == "__main__":
    unittest.main()
