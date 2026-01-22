from datetime import datetime, timedelta
from typing import Optional, Any, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings


pwd_context = CryptContext(
    schemes=["argon2"], 
    deprecated="auto",
)

ALGORITHM = settings.algorithm

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    if not isinstance(password, str):
        password = str(password)
        
    return pwd_context.hash(password)
