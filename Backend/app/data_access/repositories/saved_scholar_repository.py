from sqlalchemy.future import select
from app.data_access.repositories.base import BaseRepository
from app.data_access.models import SavedScholar, Scholar, Department
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import joinedload, selectinload

class SavedScholarRepository(BaseRepository[SavedScholar]):
    def __init__(self, session):
        super().__init__(SavedScholar, session)

    async def get_by_user(self, user_id: UUID, skip: int = 0, limit: int = 100) -> List[SavedScholar]:
        result = await self.session.execute(
            select(SavedScholar)
            .options(
                joinedload(SavedScholar.scholar).joinedload(Scholar.image),
                joinedload(SavedScholar.scholar).selectinload(Scholar.publications),
                joinedload(SavedScholar.scholar).joinedload(Scholar.department_rel).joinedload(Department.university)
            )
            .filter(SavedScholar.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .order_by(SavedScholar.created_at.desc())
        )
        return result.scalars().all()

    async def get_by_user_and_scholar(self, user_id: UUID, scholar_id: UUID) -> Optional[SavedScholar]:
        result = await self.session.execute(
            select(SavedScholar).filter(
                SavedScholar.user_id == user_id,
                SavedScholar.scholar_id == scholar_id
            )
        )
        return result.scalars().first()

