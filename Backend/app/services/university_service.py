from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, timedelta
from app.data_access.repositories.university_repository import UniversityRepository
from app.data_access.models import University


_top_publications_cache: Optional[List[Tuple[University, int]]] = None
_top_publications_cache_expiry: Optional[datetime] = None
_cache_ttl_seconds = 3600

class UniversityService:
    def __init__(self, university_repo: UniversityRepository):
        self.university_repo = university_repo
    
    async def get_top_universities_by_publication_count(
        self, 
        limit: int, 
        force_refresh: bool = False
    ) -> List[Tuple[University, int]]:
        """Get top universities by publication count with caching."""
        global _top_publications_cache, _top_publications_cache_expiry
        
        if not force_refresh and _top_publications_cache is not None and _top_publications_cache_expiry is not None:
            if datetime.now() < _top_publications_cache_expiry:
                return _top_publications_cache[:limit] if limit <= len(_top_publications_cache) else _top_publications_cache
        
        results = await self.university_repo.get_top_universities_by_publication_count(limit)
        
        _top_publications_cache = results
        _top_publications_cache_expiry = datetime.now() + timedelta(seconds=_cache_ttl_seconds)
        
        return results
    
    def invalidate_cache(self):
        global _top_publications_cache, _top_publications_cache_expiry
        _top_publications_cache = None
        _top_publications_cache_expiry = None

