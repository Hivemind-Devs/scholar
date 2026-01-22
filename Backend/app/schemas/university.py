from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime

class DepartmentResponse(BaseModel):
    department_id: UUID
    name: str
    url: Optional[str] = None
    
    class Config:
        from_attributes = True

class UniversityResponse(BaseModel):
    university_id: UUID
    name: str
    location: Optional[str] = None
    website_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class UniversityDetailResponse(UniversityResponse):
    departments: List[DepartmentResponse] = []


class UniversityPublicationStats(UniversityResponse):
    publication_count: int

    class Config:
        from_attributes = True



