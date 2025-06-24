import docker
import os
import time

class DockerManager:
    """Manages Docker container operations."""

    def __init__(self):
        try:
            self.client = docker.from_env()
            # Test connection to Docker daemon
            self.client.ping()
            print("Successfully connected to Docker daemon.")
        except docker.errors.DockerException as e:
            print(f"Error connecting to Docker daemon: {e}")
            self.client = None # Set client to None if connection fails

    def _get_container_by_dir_name(self, dir_name: str):
        """Helper to find a container by its directory name (assumed as part of container name/label)."""
        if not self.client:
            raise ConnectionError("Not connected to Docker daemon.")
        # Assuming container name or a label contains the dir_name
        # For simplicity, let's assume container name contains dir_name
        for container in self.client.containers.list(all=True):
            if dir_name in container.name:
                return container
        return None

    def list_containers(self):
        """Lists all Docker containers with their status and names."""
        if not self.client:
            return []

        containers_info = []
        for container in self.client.containers.list(all=True):
            # Attempt to get creation time for 'last activity'
            try:
                container_status = container.status
                # For 'last_activity', we can use container.attrs['Created'] or container.attrs['State']['StartedAt']
                # Let's use StartedAt if running, otherwise Created
                created_at = container.attrs['Created']
                started_at = container.attrs['State']['StartedAt']

                last_activity = started_at if container_status == 'running' else created_at
                # Format to a more human-readable string (e.g., 'YYYY-MM-DD HH:MM:SS')
                # Python 3.7+ can parse ISO 8601 directly with datetime.fromisoformat
                from datetime import datetime
                try:
                    dt_object = datetime.fromisoformat(last_activity.replace('Z', '+00:00'))
                    formatted_last_activity = dt_object.strftime('%Y-%m-%d %H:%M:%S')
                except ValueError:
                    formatted_last_activity = last_activity # Fallback if parsing fails

                containers_info.append({
                    "id": container.id,
                    "dir_name": container.name, # Using container name as dir_name for simplicity
                    "status": container_status,
                    "last_activity": formatted_last_activity
                })
            except Exception as e:
                print(f"Error processing container {container.name}: {e}")
                # Fallback for containers that might not have all attrs or parsing issues
                containers_info.append({
                    "id": container.id,
                    "dir_name": container.name,
                    "status": container.status,
                    "last_activity": "N/A"
                })
        return containers_info

    def execute_command(self, dir_name: str, command: str) -> str:
        """Executes a command inside the specified container."""
        container = self._get_container_by_dir_name(dir_name)
        if not container:
            raise ValueError(f"Container for directory '{dir_name}' not found.")

        try:
            # Ensure container is running to execute command
            if container.status != 'running':
                container.start()
                time.sleep(2) # Give container a moment to start

            exec_result = container.exec_run(command, stream=False, demux=True)
            stdout = (exec_result.output[0] or b'').decode('utf-8').strip()
            stderr = (exec_result.output[1] or b'').decode('utf-8').strip()

            if exec_result.exit_code != 0:
                error_message = f"Command failed with exit code {exec_result.exit_code}. Stderr: {stderr}"
                print(error_message)
                raise Exception(error_message)

            return stdout
        except docker.errors.APIError as e:
            raise Exception(f"Docker API error executing command: {e}")
        except Exception as e:
            raise Exception(f"Error executing command in container {dir_name}: {e}")

    def start_container(self, dir_name: str):
        """Starts the Docker container associated with the directory name."""
        container = self._get_container_by_dir_name(dir_name)
        if not container:
            raise ValueError(f"Container for directory '{dir_name}' not found.")

        if container.status == 'running':
            return f"Container '{dir_name}' is already running."

        try:
            container.start()
            return f"Container '{dir_name}' started successfully."
        except docker.errors.APIError as e:
            raise Exception(f"Docker API error starting container: {e}")
        except Exception as e:
            raise Exception(f"Error starting container '{dir_name}': {e}")

    def stop_container(self, dir_name: str):
        """Stops the Docker container associated with the directory name."""
        container = self._get_container_by_dir_name(dir_name)
        if not container:
            raise ValueError(f"Container for directory '{dir_name}' not found.")

        if container.status == 'exited':
            return f"Container '{dir_name}' is already stopped."

        try:
            container.stop()
            return f"Container '{dir_name}' stopped successfully."
        except docker.errors.APIError as e:
            raise Exception(f"Docker API error stopping container: {e}")
        except Exception as e:
            raise Exception(f"Error stopping container '{dir_name}': {e}")

    def get_container_logs(self, dir_name: str, tail: int = None) -> str:
        """Fetches logs from the Docker container associated with the directory."""
        container = self._get_container_by_dir_name(dir_name)
        if not container:
            raise ValueError(f"Container for directory '{dir_name}' not found.")

        try:
            # Get logs, decode to utf-8
            logs = container.logs(tail=tail).decode('utf-8')
            return logs
        except docker.errors.APIError as e:
            raise Exception(f"Docker API error fetching logs: {e}")
        except Exception as e:
            raise Exception(f"Error fetching logs for container '{dir_name}': {e}")

    def rollback_repository(self, dir_name: str, commit_id: str):
        """Simulates rolling back the repository to a specific commit and restarting.
        In a real scenario, this would involve git commands inside the container.
        For this prototype, it's a simulated command execution.
        """
        print(f"Simulating rollback for {dir_name} to commit {commit_id}")
        try:
            # Stop, simulate git checkout, then start
            self.stop_container(dir_name)
            # Simulate git checkout command
            # In a real app, you'd ensure git is installed in the container and the repo is mounted
            simulated_command = f"cd /app/codebases/{dir_name} && git checkout {commit_id}"
            self.execute_command(dir_name, simulated_command)
            self.start_container(dir_name)
            return f"Successfully rolled back '{dir_name}' to commit '{commit_id}' and restarted."
        except Exception as e:
            raise Exception(f"Failed to rollback '{dir_name}' to commit '{commit_id}': {e}")

    def upload_image_file(self, file_content: bytes, filename: str):
        """Simulates uploading a binary file (e.g., Docker image, project archive).
        In a real scenario, this would involve saving the file to a designated location
        on the host server where Docker could access it (e.g., to build an image),
        or pushing directly to a registry.
        For this prototype, we'll simulate saving it to a temp directory.
        """
        upload_dir = "./uploaded_files"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, filename)
        try:
            with open(file_path, "wb") as f:
                f.write(file_content)
            print(f"Simulated file upload: '{filename}' saved to '{file_path}'")
            return f"File '{filename}' uploaded and saved successfully on the host."
        except Exception as e:
            raise Exception(f"Failed to save uploaded file '{filename}': {e}")

