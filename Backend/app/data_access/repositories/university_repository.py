from app.data_access.repositories.base import BaseRepository
from app.data_access.models import University, Department, Scholar, Publication
from sqlalchemy.future import select
from sqlalchemy import func, desc

class UniversityRepository(BaseRepository[University]):
    def __init__(self, session):
        super().__init__(University, session)

    async def get_by_name(self, name: str):
        result = await self.session.execute(select(University).filter(University.name == name))
        return result.scalars().first()

    async def get_top_universities_by_publication_count(self, limit: int):
        query = (
            select(University, func.count(Publication.pub_id).label("publication_count"))
            .join(Department, University.university_id == Department.university_id)
            .join(Scholar, Department.department_id == Scholar.department_id)
            .join(Publication, Scholar.scholar_id == Publication.scholar_id)
            .group_by(University)
            .order_by(desc("publication_count"))
            .limit(limit)
        )
        
        result = await self.session.execute(query)

        return result.all()