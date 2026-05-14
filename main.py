from fastapi import FastAPI
from contextlib import asynccontextmanager
from sqlmodel import SQLModel
from dotenv import load_dotenv
from src.database import engine
from src.routers import auth, users

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
	# create tables at startup
	SQLModel.metadata.create_all(engine)
	yield


app = FastAPI(lifespan=lifespan)

app.include_router(auth.router)
app.include_router(users.router)
