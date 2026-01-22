from typing import List
from pydantic import BaseModel, Field, field_validator

class ResearchAreasResponse(BaseModel):
    research_areas: List[str] = Field(..., description="Sorted list of unique research areas")

class UserInterestsUpdate(BaseModel):
    interests: List[str] = Field(..., description="List of research interests", min_length=0, max_length=15)
    
    @field_validator('interests')
    @classmethod
    def validate_interests(cls, v: List[str]) -> List[str]:
        seen = set()
        unique_interests = []
        for interest in v:
            interest_clean = interest.strip()
            if interest_clean and interest_clean.lower() not in seen:
                seen.add(interest_clean.lower())
                unique_interests.append(interest_clean)
        return unique_interests

class UserInterestsResponse(BaseModel):
    interests: List[str] = Field(..., description="User's current research interests")

class UserInterestAdd(BaseModel):
    interest: str = Field(..., description="Single research interest to add", min_length=1)

class UserInterestRemove(BaseModel):
    interest: str = Field(..., description="Single research interest to remove", min_length=1)

