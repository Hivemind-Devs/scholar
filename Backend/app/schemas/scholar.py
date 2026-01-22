from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class PublicationResponse(BaseModel):
    pub_id: UUID
    title: str
    year: Optional[str] = None
    doi: Optional[str] = None
    venue: Optional[str] = None
    type: Optional[str] = None
    publication_index: Optional[str] = None
    category: Optional[str] = None
    authors: Optional[List[str]] = Field(default=None, description="Co-authors from authors_json field")

    class Config:
        from_attributes = True


class EducationHistoryResponse(BaseModel):
    edu_id: UUID
    year_range: Optional[str] = None
    degree: Optional[str] = None
    university: Optional[str] = None
    department_info: Optional[str] = None
    thesis_title: Optional[str] = None

    class Config:
        from_attributes = True


class AcademicHistoryResponse(BaseModel):
    acad_id: UUID
    year: Optional[str] = None
    position: Optional[str] = None
    university: Optional[str] = None
    department_info: Optional[str] = None

    class Config:
        from_attributes = True


class CourseResponse(BaseModel):
    course_id: UUID
    academic_year: Optional[str] = None
    name: Optional[str] = None
    language: Optional[str] = None
    hours: Optional[str] = None

    class Config:
        from_attributes = True


class ThesisSupervisionResponse(BaseModel):
    thesis_id: UUID
    year: Optional[str] = None
    student_name: Optional[str] = None
    title: Optional[str] = None
    institution: Optional[str] = None

    class Config:
        from_attributes = True


class AdministrativeDutyResponse(BaseModel):
    duty_id: UUID
    year_range: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None

    class Config:
        from_attributes = True


class ScholarListItemResponse(BaseModel):
    scholar_id: UUID
    yok_id: Optional[str] = None
    full_name: str
    title: Optional[str] = None
    email: Optional[str] = None
    research_areas: Optional[List[str]] = None
    institution: Optional[str] = None
    department: Optional[str] = None
    image: Optional[str] = Field(default=None, description="Base64 encoded image data")
    h_index: Optional[int] = None
    citation_count: Optional[int] = None
    publication_count: Optional[int] = None

    class Config:
        from_attributes = True


class ScholarsListResponse(BaseModel):
    scholars: List[ScholarListItemResponse]
    total: int
    page: int
    total_pages: int

    class Config:
        from_attributes = True


class ScholarProfileResponse(BaseModel):
    scholar_id: UUID
    yok_id: Optional[str] = None
    full_name: str
    title: Optional[str] = None
    orcid: Optional[str] = None
    profile_url: Optional[str] = None
    email: Optional[str] = None
    research_areas: Optional[List[str]] = None
    
    institution: Optional[str] = None
    department: Optional[str] = None
    
    image: Optional[str] = Field(default=None, description="Base64 encoded image data")
    
    h_index: Optional[int] = None
    citation_count: Optional[int] = None
    
    publications: List[PublicationResponse] = Field(default_factory=list)
    education: List[EducationHistoryResponse] = Field(default_factory=list)
    academic_history: List[AcademicHistoryResponse] = Field(default_factory=list)
    courses: List[CourseResponse] = Field(default_factory=list)
    thesis_supervisions: List[ThesisSupervisionResponse] = Field(default_factory=list)
    administrative_duties: List[AdministrativeDutyResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True

