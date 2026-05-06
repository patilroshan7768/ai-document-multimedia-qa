import json
import logging
import uuid
from pathlib import Path

import faiss
import numpy as np

from app.core.config import settings
from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)


class VectorService:
    """Service for managing FAISS vector indices per file."""

    def __init__(self) -> None:
        self.vector_store_dir = Path(settings.VECTOR_STORE_DIR)
        self.vector_store_dir.mkdir(parents=True, exist_ok=True)

    def _get_index_path(self, file_id: str | uuid.UUID) -> Path:
        return self.vector_store_dir / f"{file_id}.faiss"

    def _get_metadata_path(self, file_id: str | uuid.UUID) -> Path:
        return self.vector_store_dir / f"{file_id}.json"

    def create_index(
        self,
        file_id: str | uuid.UUID,
        texts: list[str],
        metadatas: list[dict] | None = None,
    ) -> None:
        """Create and persist a FAISS index for a given file.

        Args:
            file_id: UUID of the uploaded file.
            texts: List of text chunks to index.
            metadatas: Optional list of metadata dicts (one per chunk).
        """
        if not texts:
            logger.warning(f"No texts provided for file {file_id}. Skipping index.")
            return

        embeddings = embedding_service.embed_texts(texts)
        dim = embeddings.shape[1]

        index = faiss.IndexFlatIP(dim)  # Inner-product (cosine with normalized vecs)
        index.add(embeddings.astype(np.float32))

        index_path = self._get_index_path(file_id)
        faiss.write_index(index, str(index_path))
        logger.info(f"FAISS index saved: {index_path} ({index.ntotal} vectors)")

        meta = metadatas if metadatas else [{} for _ in texts]
        metadata_payload = [
            {"text": text, **m} for text, m in zip(texts, meta, strict=False)
        ]
        metadata_path = self._get_metadata_path(file_id)
        metadata_path.write_text(json.dumps(metadata_payload, ensure_ascii=False))

    def search(
        self,
        file_id: str | uuid.UUID,
        query: str,
        top_k: int = 5,
    ) -> list[dict]:
        """Search the FAISS index for the most similar chunks.

        Args:
            file_id: UUID of the file to search.
            query: Query string.
            top_k: Number of top results to return.

        Returns:
            List of result dicts with 'text', 'score', and optional metadata.

        Raises:
            FileNotFoundError: If the index for file_id does not exist.
        """
        index_path = self._get_index_path(file_id)
        metadata_path = self._get_metadata_path(file_id)

        if not index_path.exists():
            raise FileNotFoundError(
                f"No vector index found for file_id={file_id}. "
                "The file may still be processing."
            )

        index = faiss.read_index(str(index_path))
        with open(metadata_path, encoding="utf-8") as f:
            metadata_list: list[dict] = json.load(f)

        query_vec = embedding_service.embed_query(query).reshape(1, -1).astype(np.float32)
        scores, indices = index.search(query_vec, min(top_k, index.ntotal))

        results: list[dict] = []
        for score, idx in zip(scores[0], indices[0], strict=False):
            if idx == -1:
                continue
            entry = metadata_list[idx].copy()
            entry["score"] = float(score)
            results.append(entry)

        return results

    def delete_index(self, file_id: str | uuid.UUID) -> None:
        """Remove the FAISS index and metadata for a file."""
        for path in [self._get_index_path(file_id), self._get_metadata_path(file_id)]:
            if path.exists():
                path.unlink()
                logger.info(f"Deleted: {path}")

    def index_exists(self, file_id: str | uuid.UUID) -> bool:
        """Check if a FAISS index exists for the given file."""
        return self._get_index_path(file_id).exists()


vector_service = VectorService()
