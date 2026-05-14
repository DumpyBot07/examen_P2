from typing import Optional
from sqlmodel import SQLModel, Field


class UserBase(SQLModel):
  nombre: str
  username: str = Field(index=True, unique=True)


class User(UserBase, table=True):
  id: Optional[int] = Field(default=None, primary_key=True)
  password_hashed: str


class UserCreate(UserBase):
  password: str


class UserRead(UserBase):
  id: int
