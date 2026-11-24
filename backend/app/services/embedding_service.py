import logging
import hashlib
import numpy as np
from typing import List, Union
from app.config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self.model_name = settings.EMBEDDING_MODEL_NAME
        self.dimension = settings.VECTOR_DIMENSION
        self.model = None
        self._load_model()

    def _load_model(self):
        """Attempt to load SentenceTransformer model lazily."""
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading embedding model '{self.model_name}'...")
            self.model = SentenceTransformer(self.model_name)
            logger.info("SentenceTransformer model loaded successfully.")
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformer ('{e}'). Using deterministic fallback embedder.")
            self.model = None

    def get_embedding(self, text: str) -> List[float]:
        """Generate a single 384-dimensional dense vector for input text."""
        clean_text = (text or "").strip()
        if not clean_text:
            clean_text = "Empty document text"

        if self.model is not None:
            try:
                embedding = self.model.encode(clean_text, convert_to_numpy=True, normalize_embeddings=True)
                return embedding.tolist()
            except Exception as e:
                logger.error(f"Error encoding text with model: {e}")

        return self._generate_fallback_embedding(clean_text)

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Batch embedding generation for multiple text items."""
        if not texts:
            return []
            
        if self.model is not None:
            try:
                embeddings = self.model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
                return embeddings.tolist()
            except Exception as e:
                logger.error(f"Error encoding batch with model: {e}")

        return [self.get_embedding(t) for t in texts]

    def _generate_fallback_embedding(self, text: str) -> List[float]:
        """
        Generate a deterministic 384-d normalized vector based on text hashing.
        Guarantees exact dimension matching and valid floating-point unit vectors.
        """
        vec = np.zeros(self.dimension, dtype=np.float32)
        words = text.lower().split()
        
        for idx, word in enumerate(words):
            word_hash = int(hashlib.md5(word.encode('utf-8')).hexdigest(), 16)
            dim_idx = word_hash % self.dimension
            weight = 1.0 / (idx + 1)
            vec[dim_idx] += float(weight)
            
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        else:
            vec[0] = 1.0
            
        return vec.tolist()

embedding_service = EmbeddingService()
