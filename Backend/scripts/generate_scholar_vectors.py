import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.data_access.database import AsyncSessionLocal
from app.data_access.repositories.scholar_repository import ScholarRepository
from app.services.embedding_service import EmbeddingService
from app.services.scholar_vector_service import ScholarVectorService

async def main():
    force_regenerate = "--force" in sys.argv
    batch_size = 100
    
    if "--batch-size" in sys.argv:
        try:
            idx = sys.argv.index("--batch-size")
            batch_size = int(sys.argv[idx + 1])
        except (IndexError, ValueError):
            print("Invalid batch-size argument, using default: 100")
    
    print(f"Starting vector generation for scholars...")
    print(f"Force regenerate: {force_regenerate}")
    print(f"Batch size: {batch_size}")
    print("-" * 50)
    
    async with AsyncSessionLocal() as session:
        scholar_repo = ScholarRepository(session)
        embedding_service = EmbeddingService()
        vector_service = ScholarVectorService(scholar_repo, embedding_service)
        
        stats = await vector_service.generate_vectors_for_all_scholars(
            batch_size=batch_size,
            force_regenerate=force_regenerate
        )
        
        print("-" * 50)
        print("Vector generation completed!")
        print(f"Total processed: {stats['total_processed']}")
        print(f"Successful: {stats['successful']}")
        print(f"Failed: {stats['failed']}")
        print(f"Skipped: {stats['skipped']}")

if __name__ == "__main__":
    asyncio.run(main())

