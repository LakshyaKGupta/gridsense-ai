from sqlalchemy import Column, Integer, String, Enum
from app.database import Base
import enum

class Role(enum.Enum):
    admin = "admin"
    operator = "operator"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(Enum(Role), default=Role.operator)