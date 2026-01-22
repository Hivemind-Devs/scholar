from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field

class RecommendationExplanation(BaseModel):
    matching_research_areas: List[str] = Field(..., description="Research areas that matched user interests")
    similarity_score: float = Field(..., description="Normalized similarity score")
    user_interests_count: int = Field(..., description="Number of user interests")
    scholar_research_areas_count: int = Field(..., description="Number of scholar research areas")

class RecommendationResponse(BaseModel):
    rec_id: UUID
    scholar_id: UUID
    scholar_name: str
    scholar_title: Optional[str] = None
    scholar_institution: Optional[str] = None
    scholar_image: Optional[str] = None
    similarity_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="Similarity score between 0 and 1")
    explanation: Optional[Dict[str, Any]] = None
    generated_at: Optional[str] = None

    class Config:
        from_attributes = True

class RecommendationsListResponse(BaseModel):
    recommendations: List[RecommendationResponse]
    total: int
    skip: int
    limit: int

class DismissResponse(BaseModel):
    success: bool
    message: str = "Recommendation dismissed successfully"

