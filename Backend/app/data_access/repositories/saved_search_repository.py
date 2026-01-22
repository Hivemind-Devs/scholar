from app.data_access.repositories.base import BaseRepository
from app.data_access.models import SavedSearch
from sqlalchemy.future import select
from sqlalchemy import desc
from uuid import UUID
from typing import List, Optional

class SavedSearchRepository(BaseRepository[SavedSearch]):
    def __init__(self, session):
        super().__init__(SavedSearch, session)
    
    async def get_by_user(self, user_id: UUID, skip: int = 0, limit: int = 100) -> List[SavedSearch]:
        """Get all saved searches for a user, ordered by created_at DESC (most recent first)."""
        result = await self.session.execute(
            select(SavedSearch)
            .filter(SavedSearch.user_id == user_id)
            .order_by(desc(SavedSearch.created_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()
    
    async def get_by_user_and_id(self, user_id: UUID, search_id: UUID) -> Optional[SavedSearch]:
        """Get a specific saved search by ID for a user."""
        result = await self.session.execute(
            select(SavedSearch).filter(
                SavedSearch.search_id == search_id,
                SavedSearch.user_id == user_id
            )
        )
        return result.scalar_one_or_none()

