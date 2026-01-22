from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    email: EmailStr
    is_active: Optional[bool] = True
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    full_name: Optional[str] = None

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    researchInterests: Optional[str] = None
    research_interests: Optional[str] = None
    old_password: Optional[str] = None
    new_password: Optional[str] = None
    



class UserResponse(UserBase):
    user_id: UUID
    role: str = "USER"
    research_interests: Optional[str] = None

    class Config:
        from_attributes = True
