from app.data_access.repositories.base import BaseRepository
from app.data_access.models import Recommendation
from sqlalchemy.future import select
from uuid import UUID
from typing import List, Optional

class RecommendationRepository(BaseRepository[Recommendation]):
    def __init__(self, session):
        super().__init__(Recommendation, session)
    
    async def get_by_user_id(self, user_id: UUID, skip: int = 0, limit: int = 100, exclude_dismissed: bool = True) -> List[Recommendation]:
        query = select(Recommendation).filter(Recommendation.user_id == user_id)
        if exclude_dismissed:
            query = query.filter(Recommendation.is_dismissed == False)
        query = query.order_by(Recommendation.similarity_score.desc()).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def get_by_id(self, rec_id: UUID) -> Optional[Recommendation]:
        result = await self.session.execute(select(Recommendation).filter(Recommendation.rec_id == rec_id))
        return result.scalars().first()
    
    async def dismiss_recommendation(self, rec_id: UUID, user_id: UUID) -> Optional[Recommendation]:
        recommendation = await self.get_by_id(rec_id)
        if not recommendation or recommendation.user_id != user_id:
            return None
        recommendation.is_dismissed = True
        await self.session.commit()
        await self.session.refresh(recommendation)
        return recommendation
    
    async def delete_by_user_id(self, user_id: UUID):
        result = await self.session.execute(
            select(Recommendation).filter(Recommendation.user_id == user_id)
        )
        recommendations = result.scalars().all()
        for rec in recommendations:
            await self.session.delete(rec)
        await self.session.commit()
    
    async def create_recommendation(self, user_id: UUID, scholar_id: UUID, similarity_score: float, explanation: dict) -> Recommendation:
        recommendation = Recommendation(
            user_id=user_id,
            scholar_id=scholar_id,
            similarity_score=similarity_score,
            explanation=explanation
        )
        self.session.add(recommendation)
        await self.session.commit()
        await self.session.refresh(recommendation)
        return recommendation
    
    async def get_existing_recommendation(self, user_id: UUID, scholar_id: UUID) -> Optional[Recommendation]:
        result = await self.session.execute(
            select(Recommendation).filter(
                Recommendation.user_id == user_id,
                Recommendation.scholar_id == scholar_id
            )
        )
        return result.scalars().first()

