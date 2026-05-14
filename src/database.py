from sqlmodel import SQLModel, create_engine, Session
from contextlib import contextmanager

DATABASE_URL = "sqlite:///database.db"

engine = create_engine(DATABASE_URL, echo=False)


@contextmanager
def get_session():
    with Session(engine) as session:
        yield session
