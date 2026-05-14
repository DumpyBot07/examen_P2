from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import select
from datetime import timedelta
from ..database import get_session
from ..models import User
from ..dependencies import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from typing import Optional
from pwdlib import PasswordHash

router = APIRouter()

# single PasswordContext instance using Argon2
# use the recommended PasswordHash (Argon2)
_pwd_ctx = PasswordHash.recommended()

# precompute a dummy hash to use for timing-attack mitigation
DUMMY_HASH = _pwd_ctx.hash("dummy_password_for_timing")


def hash_password(password: str) -> str:
    return _pwd_ctx.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_ctx.verify(plain, hashed)


def dummy_verify(password: str):
    # verify against a precomputed dummy hash to normalize timing
    try:
        _pwd_ctx.verify(password, DUMMY_HASH)
    except Exception:
        # ignore errors; goal is to spend time hashing
        pass


@router.post("/token")
async def login_for_access_token(response: Response, form_data: OAuth2PasswordRequestForm = Depends()):
    username = form_data.username
    password = form_data.password

    with get_session() as session:
        user = session.exec(select(User).where(User.username == username)).first()

    if not user:
        dummy_verify(password)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    if not verify_password(password, user.password_hashed):
        # run dummy verify to equalize timing
        dummy_verify(password)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.username}, expires_delta=access_token_expires)

    # set HttpOnly cookie
    response.set_cookie(key="access_token", value=f"Bearer {access_token}", httponly=True, max_age=int(access_token_expires.total_seconds()), samesite="lax")

    return {"access_token": access_token, "token_type": "bearer"}
