from fastapi import APIRouter, Depends, HTTPException, Query
from app.services.research_areas_service import ResearchAreasService
from app.schemas.research import ResearchAreasResponse
from app.api import deps

router = APIRouter()

@router.get("/research-areas", response_model=ResearchAreasResponse)
async def get_research_areas(
    force_refresh: bool = Query(False, description="Force refresh from database, bypassing cache"),
    research_areas_service: ResearchAreasService = Depends(deps.get_research_areas_service)
):
    """
    Retrieve all unique research areas available in the system.
    
    This endpoint returns a comprehensive list of research areas or interests that
    are associated with scholars in the database. Results are cached for improved
    performance, but can be refreshed by setting the force_refresh parameter.
    
    Args:
        force_refresh: If set to True, bypasses the cache and retrieves fresh data
                      directly from the database.
    
    Returns:
        A response object containing a list of all unique research area names.
    
    Raises:
        HTTPException: 500 if there is an error retrieving research areas from the database.
    """
    try:
        areas = await research_areas_service.get_unique_research_areas(force_refresh=force_refresh)
        return ResearchAreasResponse(research_areas=areas)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch research areas: {str(e)}")

