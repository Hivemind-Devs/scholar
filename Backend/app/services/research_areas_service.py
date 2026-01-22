from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from app.data_access.repositories.scholar_repository import ScholarRepository


_research_areas_cache: Optional[List[str]] = None
_research_areas_cache_expiry: Optional[datetime] = None
_top_interests_cache: Optional[List[Dict[str, Any]]] = None
_top_interests_cache_expiry: Optional[datetime] = None
_cache_ttl_seconds = 3600

class ResearchAreasService:
    def __init__(self, scholar_repo: ScholarRepository):
        self.scholar_repo = scholar_repo
    
    async def get_unique_research_areas(self, force_refresh: bool = False) -> List[str]:
        global _research_areas_cache, _research_areas_cache_expiry
        
        if not force_refresh and _research_areas_cache is not None and _research_areas_cache_expiry is not None:
            if datetime.now() < _research_areas_cache_expiry:
                return _research_areas_cache
        
        areas = await self.scholar_repo.get_unique_research_areas()
        
        _research_areas_cache = areas
        _research_areas_cache_expiry = datetime.now() + timedelta(seconds=_cache_ttl_seconds)
        
        return areas
    
    async def get_top_research_areas(self, limit: int = 10, force_refresh: bool = False) -> List[Dict[str, Any]]:
        """Get top research areas by scholar count with caching."""
        global _top_interests_cache, _top_interests_cache_expiry
        
        if not force_refresh and _top_interests_cache is not None and _top_interests_cache_expiry is not None:
            if datetime.now() < _top_interests_cache_expiry:
                return _top_interests_cache[:limit] if limit <= len(_top_interests_cache) else _top_interests_cache
        
        top_areas = await self.scholar_repo.get_top_research_areas(limit=limit)
        
        _top_interests_cache = top_areas
        _top_interests_cache_expiry = datetime.now() + timedelta(seconds=_cache_ttl_seconds)
        
        return top_areas
    
    def invalidate_cache(self):
        global _research_areas_cache, _research_areas_cache_expiry, _top_interests_cache, _top_interests_cache_expiry
        _research_areas_cache = None
        _research_areas_cache_expiry = None
        _top_interests_cache = None
        _top_interests_cache_expiry = None

