from fastapi import FastAPI
from contextlib import asynccontextmanager
from sqlmodel import SQLModel
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from src.database import engine
from src.routers import auth, users

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
	SQLModel.metadata.create_all(engine)
	yield


app = FastAPI(lifespan=lifespan)

# Configurar CORS para permitir requests desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar los orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
