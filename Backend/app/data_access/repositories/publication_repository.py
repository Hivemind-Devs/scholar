from app.data_access.repositories.base import BaseRepository
from app.data_access.models import Publication
from app.services.scholar_vector_service import ScholarVectorService
from app.services.embedding_service import EmbeddingService
from app.data_access.repositories.scholar_repository import ScholarRepository
from uuid import UUID

class PublicationRepository(BaseRepository[Publication]):
    def __init__(self, session):
        super().__init__(Publication, session)
        self.session = session
    
    def _get_vector_service(self):
        return ScholarVectorService(ScholarRepository(self.session), EmbeddingService())
    
    async def create(self, **kwargs) -> Publication:
        instance = await super().create(**kwargs)
        if instance and instance.scholar_id:
            vector_service = self._get_vector_service()
            await vector_service.generate_vector_for_scholar(instance.scholar_id)
        return instance
    
    async def update(self, id: UUID, **kwargs) -> Publication:
        instance = await self.get(id)
        if instance:
            result = await super().update(id, **kwargs)
            if result and result.scholar_id:
                vector_service = self._get_vector_service()
                await vector_service.generate_vector_for_scholar(result.scholar_id)
            return result
        return None
    
    async def delete(self, id: UUID) -> bool:
        instance = await self.get(id)
        scholar_id = instance.scholar_id if instance else None
        result = await super().delete(id)
        if result and scholar_id:
            vector_service = self._get_vector_service()
            await vector_service.generate_vector_for_scholar(scholar_id)
        return result

