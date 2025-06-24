from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.executors.pool import ThreadPoolExecutor
from datetime import datetime

from app.config import settings
from app import database

# Configure job stores and executors
jobstores = {
    'default': SQLAlchemyJobStore(url=settings.DATABASE_URL)
}
executors = {
    'default': ThreadPoolExecutor(20)
}
job_defaults = {
    'coalesce': False,
    'max_instances': 1
}

scheduler = BackgroundScheduler(jobstores=jobstores, executors=executors, job_defaults=job_defaults)

def start_scheduler(task_manager):
    """Starts the APScheduler and loads/reschedules existing tasks."""
    if scheduler.running:
        print("Scheduler is already running.")
        return

    print("Starting APScheduler...")
    scheduler.start()
    print("APScheduler started.")

    # Load and reschedule tasks from the database
    db = database.SessionLocal()
    try:
        tasks = db.query(database.ScheduledTask).all()
        for task in tasks:
            # Only reschedule pending or failed tasks, or those that need to run again
            if task.status in ["pending", "failed"] or (task.schedule_time and task.schedule_time > datetime.now()):
                try:
                    job = scheduler.add_job(
                        task_manager.execute_scheduled_task,
                        'date',
                        run_date=task.schedule_time,
                        args=[task.id],
                        id=str(task.id), # Use task ID as job ID for easy lookup
                        replace_existing=True
                    )
                    task.job_id = job.id
                    task.status = "pending" # Reset status if it was failed and rescheduled
                    db.add(task)
                    print(f"Rescheduled task {task.name} (ID: {task.id}) for {task.schedule_time}")
                except Exception as e:
                    print(f"Error rescheduling task {task.name} (ID: {task.id}): {e}")
                    task.status = "failed" # Mark as failed if rescheduling fails
                    db.add(task)
            elif task.job_id and scheduler.get_job(task.job_id):
                # Ensure job_id is cleared if task is completed and not recurring
                pass # For now, keep completed jobs in scheduler if needed for history
            else:
                # Remove orphaned job_ids if task is completed and not in scheduler
                if task.job_id:
                    print(f"Removing orphaned job ID {task.job_id} for task {task.id}")
                    task.job_id = None
                    db.add(task)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error loading scheduled tasks: {e}")
    finally:
        db.close()

def shutdown_scheduler():
    """Shuts down the APScheduler."""
    if scheduler.running:
        print("Shutting down APScheduler...")
        scheduler.shutdown()
        print("APScheduler shut down.")

def add_scheduled_job(task_id: int, run_date: datetime, task_func, *args, **kwargs):
    """Adds a new job to the scheduler."""
    try:
        job = scheduler.add_job(
            task_func,
            'date',
            run_date=run_date,
            args=[task_id, *args],
            id=str(task_id), # Use task ID as job ID
            replace_existing=True, # Overwrite if a job with this ID already exists
            **kwargs
        )
        print(f"Job added for task ID {task_id} with job ID {job.id} at {run_date}")
        return job.id
    except Exception as e:
        print(f"Error adding job for task ID {task_id}: {e}")
        raise

def remove_scheduled_job(job_id: str):
    """Removes a job from the scheduler."""
    try:
        scheduler.remove_job(job_id)
        print(f"Job {job_id} removed from scheduler.")
    except Exception as e:
        print(f"Error removing job {job_id}: {e}")
        # Don't re-raise, allow to continue if job not found

