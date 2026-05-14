from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import SQLModel
from ..database import get_session
from ..models import User
from ..dependencies import get_current_user
from .auth import hash_password

router = APIRouter()


class UserCreate(BaseModel):
    nombre: str
    username: str
    password: str


@router.post("/users", status_code=201)
def create_user(payload: UserCreate):
    with get_session() as session:
        existing = session.query(User).filter(User.username == payload.username).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
        hashed = hash_password(payload.password)
        user = User(nombre=payload.nombre, username=payload.username, password_hashed=hashed)
        session.add(user)
        session.commit()
        session.refresh(user)
        return {"id": user.id, "nombre": user.nombre, "username": user.username}


@router.get("/users/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "nombre": current_user.nombre, "username": current_user.username}
