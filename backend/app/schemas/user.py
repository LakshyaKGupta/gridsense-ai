from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import Role

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: Optional[Role] = Role.operator

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None