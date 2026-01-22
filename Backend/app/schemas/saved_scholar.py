from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel
from app.schemas.scholar import ScholarListItemResponse

class SavedScholarCreate(BaseModel):
    scholar_id: UUID
    note: Optional[str] = None

class SavedScholarResponse(BaseModel):
    saved_scholar_id: UUID
    user_id: UUID
    scholar_id: UUID
    note: Optional[str] = None
    created_at: datetime
    scholar: Optional[ScholarListItemResponse] = None

    class Config:
        from_attributes = True

