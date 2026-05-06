import logging
import uuid

from app.services.llm_service import llm_service
from app.services.vector_service import vector_service

logger = logging.getLogger(__name__)

RAG_SYSTEM_PROMPT = """You are an expert assistant that answers questions based solely on the provided context.
If the answer is not found in the context, say "I couldn't find relevant information in this document."
Be concise, accurate, and helpful. Do not hallucinate or add information beyond the context.
"""


class RAGService:
    """RAG pipeline combining vector retrieval and LLM generation."""

    async def answer(
        self,
        file_id: str | uuid.UUID,
        question: str,
        top_k: int = 5,
    ) -> dict:
        """Retrieve relevant chunks and generate an answer.

        Args:
            file_id: UUID of the file to query.
            question: The user's question.
            top_k: Number of context chunks to retrieve.

        Returns:
            Dict with 'answer', 'timestamp', and 'source_text'.

        Raises:
            FileNotFoundError: If no index exists for the file.
        """
        logger.info(f"RAG query for file_id={file_id}: {question[:100]}")

        # Retrieve relevant chunks
        results = vector_service.search(file_id=file_id, query=question, top_k=top_k)

        if not results:
            return {
                "answer": "No relevant content found for your question.",
                "timestamp": None,
                "source_text": None,
            }

        # Build context from retrieved chunks
        context_parts = []
        for i, chunk in enumerate(results, start=1):
            text = chunk.get("text", "")
            start = chunk.get("start_time")
            end = chunk.get("end_time")
            if start is not None:
                context_parts.append(f"[Chunk {i} | {start:.1f}s–{end:.1f}s]: {text}")
            else:
                context_parts.append(f"[Chunk {i}]: {text}")

        context = "\n\n".join(context_parts)
        user_message = f"Context:\n{context}\n\nQuestion: {question}"

        # Generate answer via LLM
        answer_text = await llm_service.chat_completion(
            system_prompt=RAG_SYSTEM_PROMPT,
            user_message=user_message,
        )

        # Extract timestamp from best matching chunk (if available)
        best_chunk = results[0]
        timestamp = best_chunk.get("start_time")
        source_text = best_chunk.get("text", "")

        return {
            "answer": answer_text,
            "timestamp": timestamp,
            "source_text": source_text,
        }


rag_service = RAGService()
