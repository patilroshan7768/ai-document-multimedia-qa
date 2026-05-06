import logging

from groq import AsyncGroq

from app.core.config import settings

logger = logging.getLogger(__name__)


class LLMService:
    """Service for interacting with the Groq LLM API."""

    def __init__(self) -> None:
        self._client: AsyncGroq | None = None

    def _get_client(self) -> AsyncGroq:
        if self._client is None:
            if not settings.GROQ_API_KEY:
                raise ValueError("GROQ_API_KEY is not set in environment variables.")
            self._client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        return self._client

    async def chat_completion(
        self,
        system_prompt: str,
        user_message: str,
        temperature: float = 0.3,
        max_tokens: int = 1024,
    ) -> str:
        """Send a chat completion request to Groq.

        Args:
            system_prompt: The system context/instructions.
            user_message: The user's message or question.
            temperature: Sampling temperature.
            max_tokens: Maximum tokens in the response.

        Returns:
            The LLM response as a string.
        """
        client = self._get_client()
        logger.debug(f"Sending request to Groq model: {settings.GROQ_MODEL}")

        try:
            response = await client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            answer = response.choices[0].message.content or ""
            logger.debug(f"Groq response received ({len(answer)} chars).")
            return answer
        except Exception as exc:
            logger.error(f"Groq API error: {exc}")
            raise RuntimeError(f"LLM request failed: {exc}") from exc


llm_service = LLMService()
