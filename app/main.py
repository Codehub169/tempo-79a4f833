import os
import uvicorn
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session

# Actual imports for configuration, database, Docker, and task management
from .config import settings
from .database import init_db, SessionLocal
from .docker_manager import DockerManager
from .task_manager import TaskManager
from . import scheduler # Import scheduler directly for start/shutdown

# Initialize DockerManager globally as it doesn't directly depend on a DB session per request
docker_manager_instance = DockerManager()

# Dependency to get DB session for each request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Lifespan context manager for application startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup event: Initialize database and start the scheduler
    print("Application startup: Initializing database and starting scheduler...")
    init_db() # Create database tables if they don't exist

    # TaskManager for the scheduler needs its own session, independent of request lifecycles
    db_for_scheduler = SessionLocal()
    try:
        task_manager_for_scheduler = TaskManager(db_for_scheduler, docker_manager_instance)
        scheduler.start_scheduler(task_manager_for_scheduler)
    except Exception as e:
        print(f"Error during scheduler startup: {e}")
    finally:
        # The session for the scheduler is managed internally by TaskManager/scheduler.
        # We close the initial session used for starting the scheduler.
        db_for_scheduler.close()

    yield # Application runs

    # Shutdown event: Gracefully shut down the scheduler
    print("Application shutdown: Shutting down scheduler...")
    scheduler.shutdown_scheduler()
    print("Application shutdown complete.")

# Initialize FastAPI app with the defined lifespan events
app = FastAPI(
    title="Codehub Execution Engine",
    version="0.1.0",
    description="API for managing codebase execution and server processes.",
    lifespan=lifespan # Attach the lifespan context manager
)

# Configure CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files for the frontend (React build)
# This must be mounted last to prevent conflicts with API routes
if os.path.exists(settings.FRONTEND_DIR):
    print(f"Serving frontend from: {settings.FRONTEND_DIR}")
    app.mount("/", StaticFiles(directory=settings.FRONTEND_DIR, html=True), name="frontend")
else:
    print(f"Warning: Frontend build directory not found at {settings.FRONTEND_DIR}")
    print("Please run 'npm run build' in the frontend directory.")

# Pydantic models for request body validation
class DirNameRequest(BaseModel):
    dir_name: str

class RollbackRequest(BaseModel):
    commit_id: str
    dir_name: str

class StopProcessRequest(BaseModel):
    dir_name: str
    ides: bool = False

# API Endpoints: Each endpoint creates a TaskManager instance with a new DB session
# and the global DockerManager instance.
@app.post("/execute_codebase")
async def process_startup_sh(dir_name: str = Form(...), db: Session = Depends(get_db)):
    """Process and execute startup.sh file content."""
    task_manager = TaskManager(db, docker_manager_instance)
    result = task_manager.process_startup_sh(dir_name)
    return JSONResponse(content=result)

@app.post("/code_server")
async def start_codeserver(dir_name: str = Form(...), db: Session = Depends(get_db)):
    """Start a code server"""
    task_manager = TaskManager(db, docker_manager_instance)
    result = task_manager.start_codeserver(dir_name)
    return JSONResponse(content=result)

@app.post("/rollback_server")
async def rollback_server(commit_id: str = Form(...), dir_name: str = Form(...), db: Session = Depends(get_db)):
    """Rollback the repository to a specific commit and restart the container."""
    task_manager = TaskManager(db, docker_manager_instance)
    result = task_manager.rollback_server(dir_name, commit_id)
    return JSONResponse(content=result)

@app.get("/logs/{dir_name}")
async def get_container_logs(dir_name: str, db: Session = Depends(get_db)):
    """Fetch logs from the Docker container associated with the directory."""
    task_manager = TaskManager(db, docker_manager_instance)
    logs = task_manager.get_container_logs(dir_name)
    return JSONResponse(content=logs)

@app.get("/containers")
async def list_docker_containers(db: Session = Depends(get_db)):
    """List all Docker containers with their details in JSON format."""
    task_manager = TaskManager(db, docker_manager_instance)
    containers = task_manager.list_docker_containers()
    return JSONResponse(content=containers)

@app.post("/stop_process")
async def stop_process(dir_name: str = Form(...), ides: bool = Form(False), db: Session = Depends(get_db)):
    """Stop a process or IDE for a given directory."""
    task_manager = TaskManager(db, docker_manager_instance)
    result = task_manager.stop_process(dir_name, ides)
    return JSONResponse(content=result)

@app.post("/upload_image")
async def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload a binary file (e.g., Docker image)."""
    task_manager = TaskManager(db, docker_manager_instance)
    try:
        file_content = await file.read() # File reading is an async operation
        result = task_manager.upload_image(file_content, file.filename)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {e}")
