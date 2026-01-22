from typing import List, Optional
from uuid import UUID
import json
from app.data_access.repositories.scholar_repository import ScholarRepository
from app.services.embedding_service import EmbeddingService
from sqlalchemy.orm import selectinload

class ScholarVectorService:
    def __init__(
        self,
        scholar_repo: ScholarRepository,
        embedding_service: EmbeddingService
    ):
        self.scholar_repo = scholar_repo
        self.embedding_service = embedding_service
    
    async def generate_vector_for_scholar(self, scholar_id: UUID) -> Optional[List[float]]:
        from app.data_access.models import Scholar, Publication
        from sqlalchemy.future import select
        
        result = await self.scholar_repo.session.execute(
            select(Scholar)
            .options(selectinload(Scholar.publications))
            .filter(Scholar.scholar_id == scholar_id)
        )
        scholar = result.scalars().first()
        
        if not scholar:
            return None
        
        research_areas = scholar.research_areas or []
        publication_titles = []
        
        if scholar.publications:
            publication_titles = [pub.title for pub in scholar.publications if pub.title]
        
        if not research_areas and not publication_titles:
            return None
        
        vector = self.embedding_service.generate_scholar_profile_vector(
            research_areas=research_areas,
            publication_titles=publication_titles
        )
        
        if vector:
            await self.scholar_repo.update_scholar_vector(scholar_id, vector)
        
        return vector
    
    async def generate_vectors_for_all_scholars(self, batch_size: int = 100, force_regenerate: bool = False, encoding_batch_size: int = 32) -> dict:
        """
        Optimized batch processing for vector generation.
        - Loads scholars with publications in batch using eager loading
        - Encodes all texts in a batch at once using model.encode()
        - Updates vectors in bulk using bulk_update_scholar_vectors()
        """
        from app.data_access.models import Scholar, Publication
        from sqlalchemy.future import select
        
        stats = {
            "total_processed": 0,
            "successful": 0,
            "failed": 0,
            "skipped": 0
        }
        
        if force_regenerate:
            scholars = await self.scholar_repo.get_all_scholars()
        else:
            scholars = await self.scholar_repo.get_scholars_without_vectors()
        
        total = len(scholars)
        stats["total_processed"] = total
        
        print(f"Processing {total} scholars in batches of {batch_size}...")
        
        for i in range(0, total, batch_size):
            batch_scholar_ids = [scholar.scholar_id for scholar in scholars[i:i + batch_size]]
            
            try:

                result = await self.scholar_repo.session.execute(
                    select(Scholar)
                    .options(selectinload(Scholar.publications))
                    .filter(Scholar.scholar_id.in_(batch_scholar_ids))
                )
                batch_scholars = result.scalars().unique().all()
                

                scholar_texts = []
                scholar_id_map = {}
                valid_scholars = []
                
                for scholar in batch_scholars:
                    research_areas = scholar.research_areas or []
                    publication_titles = []
                    
                    if scholar.publications:
                        publication_titles = [pub.title for pub in scholar.publications if pub.title]
                    
                    if not research_areas and not publication_titles:
                        stats["skipped"] += 1
                        continue
                    

                    combined_text = " ".join([t for t in research_areas + publication_titles if t and t.strip()])
                    
                    if combined_text.strip():
                        scholar_texts.append(combined_text)
                        scholar_id_map[len(scholar_texts) - 1] = scholar.scholar_id
                        valid_scholars.append(scholar)
                
                if not scholar_texts:
                    continue
                

                vectors = self.embedding_service.generate_scholar_profile_vectors_batch(
                    scholar_texts,
                    batch_size=encoding_batch_size
                )
                

                scholar_vector_map = {}
                for idx, vector in enumerate(vectors):
                    if vector and idx in scholar_id_map:
                        scholar_id = scholar_id_map[idx]
                        scholar_vector_map[scholar_id] = vector
                

                if scholar_vector_map:
                    updated_count = await self.scholar_repo.bulk_update_scholar_vectors(scholar_vector_map)
                    stats["successful"] += updated_count
                

                processed_so_far = min(i + batch_size, total)
                if processed_so_far % 100 == 0 or processed_so_far == total:
                    print(f"Processed {processed_so_far}/{total} scholars... (Success: {stats['successful']}, Skipped: {stats['skipped']}, Failed: {stats['failed']})")
                    
            except Exception as e:
                stats["failed"] += len(batch_scholar_ids)
                print(f"Error processing batch starting at index {i}: {str(e)}")

                try:
                    await self.scholar_repo.session.rollback()
                except:
                    pass
                continue
        
        return stats

