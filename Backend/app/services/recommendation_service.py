from typing import List, Dict, Any
from uuid import UUID
import json
from sqlalchemy import text, select
from sqlalchemy.orm import selectinload
from app.data_access.repositories.recommendation_repository import RecommendationRepository
from app.data_access.repositories.scholar_repository import ScholarRepository
from app.data_access.repositories.user_repository import UserRepository
from app.services.embedding_service import EmbeddingService
from app.services.user_service import UserService
from app.data_access.models import Scholar

class RecommendationService:
    def __init__(
        self,
        recommendation_repo: RecommendationRepository,
        scholar_repo: ScholarRepository,
        user_repo: UserRepository,
        embedding_service: EmbeddingService,
        user_service: UserService
    ):
        self.recommendation_repo = recommendation_repo
        self.scholar_repo = scholar_repo
        self.user_repo = user_repo
        self.embedding_service = embedding_service
        self.user_service = user_service
    
    async def recalculate_recommendations(self, user_id: UUID, top_k: int = 20):
        user = await self.user_repo.get(user_id)
        if not user:
            return
        
        user_interests = self.user_service.get_user_interests(user)
        if not user_interests or len(user_interests) == 0:
            await self.recommendation_repo.delete_by_user_id(user_id)
            await self.user_repo.update_user_vector(user_id, None)
            return
        
        user_vector = user.profile_vector
        if not user_vector:
            user_vector = self.embedding_service.generate_embedding_from_list(user_interests)
            if user_vector:
                await self.user_repo.update_user_vector(user_id, user_vector)
        
        if not user_vector:
            return
        
        await self.recommendation_repo.delete_by_user_id(user_id)
        



        vector_str = '[' + ','.join(str(float(v)) for v in user_vector) + ']'
        

        query = text(f"""
            SELECT 
                scholar_id,
                1 - (profile_vector <=> '{vector_str}'::vector) as similarity_score
            FROM scholar
            WHERE profile_vector IS NOT NULL
            ORDER BY profile_vector <=> '{vector_str}'::vector
            LIMIT :top_k
        """)
        
        result = await self.scholar_repo.session.execute(
            query, {"top_k": top_k}
        )
        
        rows = result.fetchall()
        


        scholar_ids = [UUID(str(row[0])) for row in rows]
        scholars_query = select(Scholar).options(
            selectinload(Scholar.publications)
        ).filter(Scholar.scholar_id.in_(scholar_ids))
        
        scholars_result = await self.scholar_repo.session.execute(scholars_query)
        scholars_dict = {scholar.scholar_id: scholar for scholar in scholars_result.scalars().all()}
        
        recommendations = []
        for row in rows:

            scholar_id = UUID(str(row[0]))
            similarity = float(row[1])
            
            if similarity > 0.0:
                scholar = scholars_dict.get(scholar_id)
                if not scholar:
                    continue
                
                matching_terms = self.embedding_service.find_matching_terms(
                    user_interests,
                    scholar.research_areas or []
                )
                
                explanation = {
                    "matching_research_areas": matching_terms,
                    "similarity_score": round(similarity, 4),
                    "user_interests_count": len(user_interests),
                    "scholar_research_areas_count": len(scholar.research_areas) if scholar.research_areas else 0
                }
                
                recommendations.append({
                    "scholar_id": scholar_id,
                    "similarity_score": similarity,
                    "explanation": explanation
                })
        

        for rec in recommendations:

            existing = await self.recommendation_repo.get_existing_recommendation(
                user_id=user_id,
                scholar_id=rec["scholar_id"]
            )
            
            if existing:

                existing.similarity_score = rec["similarity_score"]
                existing.explanation = rec["explanation"]
                existing.is_dismissed = False

                await self.recommendation_repo.session.commit()
                await self.recommendation_repo.session.refresh(existing)
            else:

                await self.recommendation_repo.create_recommendation(
                    user_id=user_id,
                    scholar_id=rec["scholar_id"],
                    similarity_score=rec["similarity_score"],
                    explanation=rec["explanation"]
                )
    
    async def get_recommendations(self, user_id: UUID, skip: int = 0, limit: int = 20) -> List[Dict[str, Any]]:
        recommendations = await self.recommendation_repo.get_by_user_id(
            user_id=user_id,
            skip=skip,
            limit=limit,
            exclude_dismissed=True
        )
        
        result = []
        for rec in recommendations:
            scholar = await self.scholar_repo.get(rec.scholar_id)
            if scholar:
                result.append({
                    "rec_id": rec.rec_id,
                    "scholar_id": rec.scholar_id,
                    "scholar_name": scholar.full_name,
                    "scholar_title": scholar.title,
                    "scholar_institution": scholar.institution,
                    "similarity_score": rec.similarity_score,
                    "explanation": rec.explanation,
                    "generated_at": rec.generated_at.isoformat() if rec.generated_at else None
                })
        
        return result
    
    async def dismiss_recommendation(self, rec_id: UUID, user_id: UUID) -> bool:
        recommendation = await self.recommendation_repo.dismiss_recommendation(rec_id, user_id)
        return recommendation is not None

