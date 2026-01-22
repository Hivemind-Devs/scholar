from app.data_access.repositories.base import BaseRepository
from app.data_access.models import Department
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from uuid import UUID

class DepartmentRepository(BaseRepository[Department]):
    def __init__(self, session):
        super().__init__(Department, session)

    async def get_by_name_and_university(self, name: str, university_id: UUID):
        result = await self.session.execute(
            select(Department)
            .filter(Department.name == name)
            .filter(Department.university_id == university_id)
        )
        return result.scalars().first()

    async def get_all(self, skip: int = 0, limit: int = 100):

        result = await self.session.execute(
            select(self.model)
            .options(selectinload(Department.university))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()
