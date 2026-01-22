from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from app.schemas.recommendation import RecommendationResponse, RecommendationsListResponse, DismissResponse
from app.services.recommendation_service import RecommendationService
from app.api import deps

router = APIRouter()

@router.get("/", response_model=RecommendationsListResponse)
async def get_recommendations(
    skip: int = Query(0, ge=0, description="Number of recommendations to skip"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of recommendations to return"),
    interests: str = Query(None, description="Optional research interests to recalculate recommendations (comma-separated)"),
    current_user = Depends(deps.get_current_active_user),
    recommendation_service: RecommendationService = Depends(deps.get_recommendation_service),
    user_service = Depends(deps.get_user_service),
    research_areas_service = Depends(deps.get_research_areas_service)
):
    """
    Retrieve personalized scholar recommendations for the current user.
    
    This endpoint provides scholar recommendations based on the user's research interests
    and profile information. Recommendations are calculated using similarity matching
    between user interests and scholar profiles. If research interests are provided,
    they will update the user's profile and trigger a recalculation of recommendations.
    
    Args:
        skip: Number of recommendations to skip for pagination.
        limit: Maximum number of recommendations to return (between 1 and 100).
        interests: Optional comma-separated list of research interests. If provided,
                  this will update the user's interests and recalculate recommendations.
    
    Returns:
        A paginated list of scholar recommendations with similarity scores and
        explanations, along with pagination metadata.
    """
    if interests:

        interests_list = [interest.strip() for interest in interests.split(",") if interest.strip()]
        
        if interests_list:
            valid_areas = await research_areas_service.get_unique_research_areas()
            await user_service.update_research_interests(
                user_id=current_user.user_id,
                interests=interests_list,
                valid_areas=valid_areas
            )
            await recommendation_service.recalculate_recommendations(current_user.user_id)
    
    recommendations = await recommendation_service.get_recommendations(
        user_id=current_user.user_id,
        skip=skip,
        limit=limit
    )
    
    return RecommendationsListResponse(
        recommendations=recommendations,
        total=len(recommendations),
        skip=skip,
        limit=limit
    )

@router.patch("/{rec_id}/dismiss", response_model=DismissResponse)
async def dismiss_recommendation(
    rec_id: UUID,
    current_user = Depends(deps.get_current_active_user),
    recommendation_service: RecommendationService = Depends(deps.get_recommendation_service)
):
    """
    Dismiss a specific recommendation for the current user.
    
    This endpoint allows users to dismiss recommendations they are not interested in.
    Once dismissed, the recommendation will not appear in future recommendation lists
    for that user.
    
    Args:
        rec_id: Unique identifier of the recommendation to dismiss.
    
    Returns:
        A confirmation response indicating that the recommendation has been
        successfully dismissed.
    
    Raises:
        HTTPException: 404 if the recommendation is not found or does not belong
                       to the current user.
    """
    success = await recommendation_service.dismiss_recommendation(rec_id, current_user.user_id)
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Recommendation not found or you don't have permission to dismiss it"
        )
    
    return DismissResponse(success=True)

