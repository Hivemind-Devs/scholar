import asyncio
import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.data_access.database import AsyncSessionLocal
from app.data_access.repositories.user_repository import UserRepository
from app.data_access.repositories.recommendation_repository import RecommendationRepository
from app.services.embedding_service import EmbeddingService
from app.services.user_service import UserService
from app.services.recommendation_service import RecommendationService
from app.data_access.repositories.scholar_repository import ScholarRepository

async def main():
    print("Starting user vector regeneration and recommendation recalculation...")
    print("-" * 50)
    
    async with AsyncSessionLocal() as session:
        user_repo = UserRepository(session)
        scholar_repo = ScholarRepository(session)
        recommendation_repo = RecommendationRepository(session)
        embedding_service = EmbeddingService()
        user_service = UserService(user_repo, embedding_service)
        recommendation_service = RecommendationService(
            recommendation_repo,
            scholar_repo,
            user_repo,
            embedding_service,
            user_service
        )
        
        users = await user_repo.get_all()
        
        stats = {
            "total_users": len(users),
            "processed": 0,
            "regenerated_vectors": 0,
            "recalculated_recommendations": 0,
            "skipped_no_interests": 0
        }
        
        for user in users:
            try:
                interests = user_service.get_user_interests(user)
                
                if not interests or len(interests) == 0:
                    stats["skipped_no_interests"] += 1
                    stats["processed"] += 1
                    continue
                
                user_vector = embedding_service.generate_embedding_from_list(interests)
                if user_vector:
                    await user_repo.update_user_vector(user.user_id, user_vector)
                    stats["regenerated_vectors"] += 1
                    
                    await recommendation_service.recalculate_recommendations(user.user_id)
                    stats["recalculated_recommendations"] += 1
                
                stats["processed"] += 1
                
                if stats["processed"] % 10 == 0:
                    print(f"Processed {stats['processed']}/{stats['total_users']} users...")
                    
            except Exception as e:
                print(f"Error processing user {user.user_id}: {str(e)}")
                continue
        
        print("-" * 50)
        print("User vector regeneration completed!")
        print(f"Total users: {stats['total_users']}")
        print(f"Processed: {stats['processed']}")
        print(f"Regenerated vectors: {stats['regenerated_vectors']}")
        print(f"Recalculated recommendations: {stats['recalculated_recommendations']}")
        print(f"Skipped (no interests): {stats['skipped_no_interests']}")

if __name__ == "__main__":
    asyncio.run(main())

