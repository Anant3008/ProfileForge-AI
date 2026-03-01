"""
Database connection and session management
Using original Kalvium schema from .sqlite file
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import os
from pathlib import Path

# Get the directory where this file lives (backend/)
BASE_DIR = Path(__file__).resolve().parent

# Database URL - defaults to data/database.sqlite in the project
# Can be overridden via DATABASE_URL environment variable
DEFAULT_DB_PATH = BASE_DIR / "data" / "database.sqlite"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False  # Set to True for SQL debugging
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency for FastAPI endpoints to get database session
    Usage: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Initialize database - create all tables if they don't exist
    Call this on application startup
    """
    # Ensure data directory exists
    data_dir = BASE_DIR / "data"
    data_dir.mkdir(exist_ok=True)
    
    from models import Base
    Base.metadata.create_all(bind=engine)
    print(f"✅ Database initialized - connected to {DATABASE_URL}")
