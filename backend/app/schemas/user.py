from typing import Literal, Optional

from pydantic import BaseModel, EmailStr

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


class SessionExchangeRequest(BaseModel):
    upstream_token: str
    uid: str
    email: EmailStr
    role: Literal["operator", "user"]
    name: str
    is_demo: bool = False
