import os
import uvicorn
from fastapi import FastAPI, Request, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Assuming these will be created in subsequent steps
# from .config import settings
# from .database import database
# from .docker_manager import DockerManager
# from .task_manager import TaskManager

# Placeholder for settings, DockerManager, TaskManager until files are generated
class Settings:
    PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    FRONTEND_DIR = os.path.join(PROJECT_ROOT, 'dist') # Assuming React build output is 'dist'

settings = Settings()

# Initialize FastAPI app
app = FastAPI(
    title="Codehub Execution Engine",
    version="0.1.0",
    description="API for managing codebase execution and server processes."
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files for the frontend (React build)
# This should be mounted last to prevent conflicts with API routes
if os.path.exists(settings.FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=settings.FRONTEND_DIR, html=True), name="frontend")
else:
    print(f"Warning: Frontend build directory not found at {settings.FRONTEND_DIR}")
    print("Please run 'npm run build' in the frontend directory.")

# Pydantic models for request bodies
class DirNameRequest(BaseModel):
    dir_name: str

class RollbackRequest(BaseModel):
    commit_id: str
    dir_name: str

class StopProcessRequest(BaseModel):
    dir_name: str
    ides: bool = False

# API Endpoints
@app.post("/execute_codebase")
async def process_startup_sh(request: Request, dir_name: str = Form(...)):
    """Process and execute startup.sh file content."""
    # Placeholder for actual DockerManager call
    print(f"Executing startup.sh for directory: {dir_name}")
    # await DockerManager.execute_startup_sh(dir_name)
    return JSONResponse(content={"message": f"Startup script for {dir_name} initiated."})

@app.post("/code_server")
async def start_codeserver(request: Request, dir_name: str = Form(...)):
    """Start a code server"""
    # Placeholder for actual DockerManager call
    print(f"Starting code server for directory: {dir_name}")
    # await DockerManager.start_codeserver(dir_name)
    return JSONResponse(content={"message": f"Code server for {dir_name} started."})

@app.post("/rollback_server")
async def rollback_server(request: Request, commit_id: str = Form(...), dir_name: str = Form(...)):
    """Rollback the repository to a specific commit and restart the container."""
    # Placeholder for actual DockerManager call
    print(f"Rolling back {dir_name} to commit: {commit_id}")
    # await DockerManager.rollback_server(dir_name, commit_id)
    return JSONResponse(content={"message": f"Repository {dir_name} rolled back to {commit_id}."})

@app.get("/logs/{dir_name}")
async def get_container_logs(dir_name: str):
    """Fetch logs from the Docker container associated with the directory."""
    # Placeholder for actual DockerManager call
    print(f"Fetching logs for directory: {dir_name}")
    # logs = await DockerManager.get_container_logs(dir_name)
    # Simulate logs for now
    simulated_logs = f"[INFO] {dir_name} log entry 1\n[WARN] {dir_name} log entry 2\n[ERROR] {dir_name} log entry 3\n"
    return JSONResponse(content={"logs": simulated_logs})

@app.get("/containers")
async def list_docker_containers():
    """List all Docker containers with their details in JSON format."""
    # Placeholder for actual DockerManager call
    print("Listing Docker containers")
    # containers = await DockerManager.list_containers()
    # Simulate containers for now
    simulated_containers = [
        {"id": "abc1", "name": "my-project-repo", "status": "running"},
        {"id": "def2", "name": "backend-service", "status": "stopped"},
        {"id": "ghi3", "name": "frontend-app", "status": "running"}
    ]
    return JSONResponse(content=simulated_containers)

@app.post("/stop_process")
async def stop_process(request: Request, dir_name: str = Form(...), ides: bool = Form(False)):
    """Stop a process or IDE for a given directory.""" 
    # Placeholder for actual DockerManager call
    print(f"Stopping process for directory: {dir_name}, IDES: {ides}")
    # await DockerManager.stop_process(dir_name, ides)
    return JSONResponse(content={"message": f"Process for {dir_name} stopped."})

@app.post("/upload_image")
async def upload_image(file: UploadFile = File(...)):
    """Upload a binary file (e.g., Docker image)."""
    try:
        # In a real scenario, you'd save the file and then process it (e.g., load into Docker)
        file_location = f"/tmp/{file.filename}"
        with open(file_location, "wb") as f:
            while contents := await file.read(1024 * 1024):
                f.write(contents)
        print(f"File '{file.filename}' uploaded to {file_location}")
        return JSONResponse(content={"message": f"File '{file.filename}' uploaded successfully.", "filename": file.filename})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {e}")

# Example of how to run the app (for development)
# if __name__ == "__main__":
#     uvicorn.run(app, host="0.0.0.0", port=8000)
