from pydantic import BaseModel, EmailStr


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetVerify(BaseModel):
    email: EmailStr
    code: str


class PasswordResetComplete(BaseModel):
    email: EmailStr
    code: str
    new_password: str

