from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config import settings

# SQLAlchemy database URL
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Create the SQLAlchemy engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False} # Needed for SQLite
)

# Create a SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declare a Base for our models
Base = declarative_base()

class ScheduledTask(Base):
    __tablename__ = "scheduled_tasks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    codebase = Column(String)
    endpoint = Column(String)
    schedule_time = Column(DateTime)
    commit_id = Column(String, nullable=True)
    status = Column(String, default="pending") # pending, running, completed, failed
    last_run = Column(DateTime, nullable=True)
    run_count = Column(Integer, default=0)
    job_id = Column(String, unique=True, nullable=True) # APScheduler job ID

    def __repr__(self):
        return f"<ScheduledTask(id={self.id}, name='{self.name}', status='{self.status}')>"

def init_db():
    """Initializes the database by creating all tables."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created.")

