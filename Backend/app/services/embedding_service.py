from typing import List
import json
from sentence_transformers import SentenceTransformer
import numpy as np

class EmbeddingService:
    def __init__(self):

        self.model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2', device='cpu')
    
    def generate_embedding(self, text: str) -> List[float]:
        if not text or not text.strip():
            return None
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding.tolist()
    
    def generate_embedding_from_list(self, texts: List[str]) -> List[float]:
        if not texts or len(texts) == 0:
            return None
        combined_text = " ".join([t for t in texts if t and t.strip()])
        if not combined_text.strip():
            return None
        return self.generate_embedding(combined_text)
    
    def generate_scholar_profile_vector(self, research_areas: List[str], publication_titles: List[str] = None) -> List[float]:
        texts = []
        if research_areas:
            texts.extend(research_areas)
        if publication_titles:
            texts.extend(publication_titles)
        return self.generate_embedding_from_list(texts)
    
    def generate_embeddings_batch(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """
        Generate embeddings for multiple texts in batch.
        This is much faster than calling generate_embedding() multiple times.
        """
        if not texts or len(texts) == 0:
            return []
        

        valid_texts = []
        valid_indices = []
        for i, text in enumerate(texts):
            if text and text.strip():
                valid_texts.append(text)
                valid_indices.append(i)
        
        if not valid_texts:
            return [None] * len(texts)
        

        embeddings = self.model.encode(
            valid_texts,
            batch_size=batch_size,
            convert_to_numpy=True,
            show_progress_bar=False
        )
        

        result = [None] * len(texts)
        for idx, embedding in zip(valid_indices, embeddings):
            result[idx] = embedding.tolist()
        
        return result
    
    def generate_scholar_profile_vectors_batch(self, scholar_texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """
        Generate profile vectors for multiple scholars in batch.
        Each scholar_text is a combined string of research areas and publication titles.
        """
        return self.generate_embeddings_batch(scholar_texts, batch_size)
    
    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        if not vec1 or not vec2:
            return 0.0
        vec1_np = np.array(vec1)
        vec2_np = np.array(vec2)
        dot_product = np.dot(vec1_np, vec2_np)
        norm1 = np.linalg.norm(vec1_np)
        norm2 = np.linalg.norm(vec2_np)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return float(dot_product / (norm1 * norm2))
    
    def find_matching_terms(self, user_interests: List[str], scholar_research_areas: List[str]) -> List[str]:
        user_interests_lower = [interest.lower() for interest in user_interests]
        matching = []
        for area in scholar_research_areas:
            area_lower = area.lower()
            for interest in user_interests_lower:
                if interest in area_lower or area_lower in interest:
                    if area not in matching:
                        matching.append(area)
        return matching

