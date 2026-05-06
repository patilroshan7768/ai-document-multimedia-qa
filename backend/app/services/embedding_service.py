import logging

import numpy as np
from sentence_transformers import SentenceTransformer

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating text embeddings using sentence-transformers."""

    def __init__(self) -> None:
        self._model: SentenceTransformer | None = None

    def _load_model(self) -> SentenceTransformer:
        if self._model is None:
            logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
            self._model = SentenceTransformer(settings.EMBEDDING_MODEL)
            logger.info("Embedding model loaded successfully.")
        return self._model

    def embed_texts(self, texts: list[str]) -> np.ndarray:
        """Generate embeddings for a list of texts.

        Args:
            texts: List of text strings to embed.

        Returns:
            Numpy array of shape (len(texts), embedding_dim).
        """
        if not texts:
            return np.array([])

        model = self._load_model()
        logger.debug(f"Generating embeddings for {len(texts)} texts.")
        embeddings = model.encode(
            texts,
            batch_size=32,
            show_progress_bar=False,
            normalize_embeddings=True,
        )
        return embeddings

    def embed_query(self, query: str) -> np.ndarray:
        """Generate embedding for a single query string.

        Args:
            query: The query string.

        Returns:
            Numpy array of shape (embedding_dim,).
        """
        model = self._load_model()
        embedding = model.encode(
            query,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return embedding

    @property
    def embedding_dimension(self) -> int:
        """Return the embedding dimension of the model."""
        model = self._load_model()
        return model.get_sentence_embedding_dimension()


embedding_service = EmbeddingService()
