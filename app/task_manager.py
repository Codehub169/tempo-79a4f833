from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app import database, scheduler
from app.docker_manager import DockerManager

class TaskManager:
    """Manages execution of various tasks, interacting with Docker and the database."""

    def __init__(self, db_session: Session):
        self.db_session = db_session
        self.docker_manager = DockerManager()

    async def process_startup_sh(self, dir_name: str):
        """Processes and executes the startup.sh file content for a given directory."""
        try:
            # Assuming startup.sh is at /app/codebases/{dir_name}/startup.sh
            # This command needs to be robust for various startup.sh contents.
            # For a real system, you might have a dedicated entrypoint or a wrapper script.
            # For this prototype, we'll just execute a placeholder command.
            command = f"bash /app/codebases/{dir_name}/startup.sh"
            result = self.docker_manager.execute_command(dir_name, command)
            return {"message": f"Startup script executed for {dir_name}: {result}"}
        except Exception as e:
            raise Exception(f"Failed to execute startup script for {dir_name}: {e}")

    async def start_codeserver(self, dir_name: str):
        """Starts a code server for the specified directory."""
        try:
            message = self.docker_manager.start_container(dir_name)
            return {"message": message}
        except Exception as e:
            raise Exception(f"Failed to start code server for {dir_name}: {e}")

    async def rollback_server(self, dir_name: str, commit_id: str):
        """Rollback the repository to a specific commit and restart the container."""
        try:
            message = self.docker_manager.rollback_repository(dir_name, commit_id)
            return {"message": message}
        except Exception as e:
            raise Exception(f"Failed to rollback server for {dir_name}: {e}")

    async def stop_process(self, dir_name: str, ides: bool = False):
        """Stops the process/server for the specified directory."""
        try:
            message = self.docker_manager.stop_container(dir_name)
            # 'ides' parameter is not currently used in docker_manager, but kept for API spec
            return {"message": message}
        except Exception as e:
            raise Exception(f"Failed to stop process for {dir_name}: {e}")

    async def get_container_logs(self, dir_name: str):
        """Fetches logs from the Docker container associated with the directory."""
        try:
            logs = self.docker_manager.get_container_logs(dir_name)
            return {"logs": logs}
        except Exception as e:
            raise Exception(f"Failed to get container logs for {dir_name}: {e}")

    async def list_docker_containers(self):
        """Lists all Docker containers with their details."""
        try:
            containers = self.docker_manager.list_containers()
            return containers
        except Exception as e:
            raise Exception(f"Failed to list Docker containers: {e}")

    async def upload_image(self, file_content: bytes, filename: str):
        """Uploads a binary image file."""
        try:
            message = self.docker_manager.upload_image_file(file_content, filename)
            return {"message": message}
        except Exception as e:
            raise Exception(f"Failed to upload image file '{filename}': {e}")

    # --- Scheduled Task Management ---
    def add_scheduled_task(self, name: str, codebase: str, endpoint: str, schedule_time: datetime, commit_id: Optional[str] = None):
        """Adds a new task to the database and schedules it."""
        db_task = database.ScheduledTask(
            name=name,
            codebase=codebase,
            endpoint=endpoint,
            schedule_time=schedule_time,
            commit_id=commit_id,
            status="pending"
        )
        self.db_session.add(db_task)
        self.db_session.commit()
        self.db_session.refresh(db_task)

        # Schedule the job with APScheduler
        job_id = scheduler.add_scheduled_job(
            task_id=db_task.id,
            run_date=schedule_time,
            task_func=self.execute_scheduled_task
        )
        db_task.job_id = job_id
        self.db_session.add(db_task)
        self.db_session.commit()
        self.db_session.refresh(db_task)

        return db_task

    def get_scheduled_tasks(self):
        """Retrieves all scheduled tasks from the database."""
        return self.db_session.query(database.ScheduledTask).all()

    def delete_scheduled_task(self, task_id: int):
        """Deletes a scheduled task from the database and the scheduler."""
        db_task = self.db_session.query(database.ScheduledTask).filter(database.ScheduledTask.id == task_id).first()
        if db_task:
            if db_task.job_id:
                scheduler.remove_scheduled_job(db_task.job_id)
            self.db_session.delete(db_task)
            self.db_session.commit()
            return True
        return False

    async def execute_scheduled_task(self, task_id: int):
        """Executes a scheduled task based on its ID."""
        db_session_for_task = database.SessionLocal() # New session for this job
        try:
            task = db_session_for_task.query(database.ScheduledTask).filter(database.ScheduledTask.id == task_id).first()
            if not task:
                print(f"Scheduled task with ID {task_id} not found. Skipping execution.")
                return

            task.status = "running"
            task.last_run = datetime.now()
            task.run_count += 1
            db_session_for_task.add(task)
            db_session_for_task.commit()
            db_session_for_task.refresh(task)

            print(f"Executing scheduled task: {task.name} (ID: {task.id})")

            # Execute the corresponding API call
            if task.endpoint == "/execute_codebase":
                await self.process_startup_sh(task.codebase)
            elif task.endpoint == "/code_server":
                await self.start_codeserver(task.codebase)
            elif task.endpoint == "/rollback_server":
                if not task.commit_id:
                    raise ValueError("Commit ID is required for rollback task.")
                await self.rollback_server(task.codebase, task.commit_id)
            elif task.endpoint == "/stop_process":
                await self.stop_process(task.codebase)
            else:
                raise ValueError(f"Unknown API endpoint for task: {task.endpoint}")

            task.status = "completed"
            print(f"Scheduled task {task.name} (ID: {task.id}) completed successfully.")

        except Exception as e:
            print(f"Error executing scheduled task {task.name} (ID: {task.id}): {e}")
            task.status = "failed"
            db_session_for_task.rollback()
        finally:
            db_session_for_task.add(task)
            db_session_for_task.commit()
            db_session_for_task.close()

