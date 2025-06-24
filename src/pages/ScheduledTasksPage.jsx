import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { useNotifications } from '../hooks/useNotifications';
import * as api from '../api'; // Import your API client

const SimulatedContainers = [
    { id: '1', dir_name: 'my-project-repo' },
    { id: '2', dir_name: 'backend-service' },
    { id: '3', dir_name: 'frontend-app' },
    { id: '4', dir_name: 'data-pipeline' },
    { id: '5', dir_name: 'ml-model-dev' },
];

const ScheduledTasksPage = () => {
    const navigate = useNavigate();
    const { addNotification } = useNotifications();

    const [tasks, setTasks] = useState([]);
    const [taskName, setTaskName] = useState('');
    const [selectedCodebase, setSelectedCodebase] = useState('');
    const [selectedApiEndpoint, setSelectedApiEndpoint] = useState('');
    const [taskCommitId, setTaskCommitId] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [fileToUpload, setFileToUpload] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Effect to set default schedule time to current time + 5 minutes on load
    useEffect(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 5);
        setScheduleTime(now.toISOString().slice(0, 16));
    }, []);

    // Simulate API call for tasks (replace with actual backend calls)
    useEffect(() => {
        // In a real app, you would fetch scheduled tasks from the backend here
        // For now, we'll just use an empty array or load from localStorage for persistence
        const storedTasks = JSON.parse(localStorage.getItem('scheduledTasks')) || [];
        setTasks(storedTasks);

        // Simulate immediate execution for tasks that are due or past due
        storedTasks.forEach(task => {
            if (task.status === 'pending') {
                const scheduleDate = new Date(task.scheduleTime);
                const now = new Date();
                if (scheduleDate <= now) {
                    executeTask(task);
                } else {
                    const delay = scheduleDate.getTime() - now.getTime();
                    setTimeout(() => executeTask(task), delay);
                }
            }
        });
    }, []);

    useEffect(() => {
        localStorage.setItem('scheduledTasks', JSON.stringify(tasks));
    }, [tasks]);

    const handleScheduleTask = async (e) => {
        e.preventDefault();

        if (!taskName || !selectedCodebase || !selectedApiEndpoint || !scheduleTime) {
            addNotification('Please fill all required fields.', 'error');
            return;
        }

        if (selectedApiEndpoint === '/rollback_server' && !taskCommitId) {
            addNotification('Commit ID is required for Rollback tasks.', 'error');
            return;
        }

        const taskId = Date.now().toString();
        const newTask = {
            id: taskId,
            name: taskName,
            codebase: selectedCodebase,
            endpoint: selectedApiEndpoint,
            scheduleTime: scheduleTime,
            commitId: selectedApiEndpoint === '/rollback_server' ? taskCommitId : null,
            status: 'pending',
            lastRun: 'N/A',
            runCount: 0,
        };

        setTasks(prevTasks => [...prevTasks, newTask]);
        addNotification(`Task '${taskName}' scheduled successfully!`, 'success');

        // Reset form
        setTaskName('');
        setSelectedCodebase('');
        setSelectedApiEndpoint('');
        setTaskCommitId('');
        const now = new Date();
        now.setMinutes(now.getMinutes() + 5);
        setScheduleTime(now.toISOString().slice(0, 16));

        // Simulate execution after scheduling
        simulateTaskExecution(newTask);
    };

    const executeTask = async (task) => {
        setTasks(prevTasks =>
            prevTasks.map(t =>
                t.id === task.id ? { ...t, status: 'running' } : t
            )
        );
        addNotification(`Executing scheduled task: '${task.name}'...`, 'info');

        try {
            const data = { dir_name: task.codebase };
            if (task.endpoint === '/rollback_server') {
                data.commit_id = task.commitId;
            }
            // Replace with actual API call to backend's /execute_scheduled_task endpoint
            // For now, directly simulate the action
            await api.simulateApiCall(task.endpoint, data, 2000, Math.random() > 0.1);

            setTasks(prevTasks =>
                prevTasks.map(t =>
                    t.id === task.id
                        ? { ...t, status: 'completed', lastRun: new Date().toLocaleString(), runCount: t.runCount + 1 }
                        : t
                )
            );
            addNotification(`Task '${task.name}' completed successfully!`, 'success');
        } catch (error) {
            setTasks(prevTasks =>
                prevTasks.map(t =>
                    t.id === task.id
                        ? { ...t, status: 'failed', lastRun: new Date().toLocaleString(), runCount: t.runCount + 1 }
                        : t
                )
            );
            addNotification(`Task '${task.name}' failed: ${error.message}`, 'error');
        }
    };

    const handleDeleteTask = (id) => {
        const taskToDelete = tasks.find(task => task.id === id);
        if (window.confirm(`Are you sure you want to delete task '${taskToDelete.name}'?`)) {
            setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
            addNotification(`Task '${taskToDelete.name}' deleted.`, 'info');
        }
    };

    const simulateTaskExecution = (task) => {
        const now = new Date();
        const scheduleDate = new Date(task.scheduleTime);

        if (scheduleDate <= now) {
            executeTask(task);
        } else {
            const delay = scheduleDate.getTime() - now.getTime();
            setTimeout(() => executeTask(task), delay);
        }
    };

    const handleUploadImage = async () => {
        if (!fileToUpload) {
            addNotification('Please select a file to upload.', 'error');
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', fileToUpload);
            await api.uploadImage(formData);
            addNotification(`File '${fileToUpload.name}' uploaded successfully.`, 'success');
            setIsUploadModalOpen(false);
            setFileToUpload(null);
        } catch (error) {
            addNotification(`Upload failed: ${error.message || 'Unknown error'}`, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="app-container">
            <Sidebar onUploadImageClick={() => setIsUploadModalOpen(true)} />
            <main className="main-content">
                <header className="page-header">
                    <h1>Scheduled Tasks</h1>
                </header>
                <section className="card-section">
                    <h2>Create New Task</h2>
                    <form onSubmit={handleScheduleTask} className="task-form">
                        <div className="form-group">
                            <label htmlFor="taskName">Task Name</label>
                            <Input
                                id="taskName"
                                type="text"
                                placeholder="e.g., Daily Backend Restart"
                                value={taskName}
                                onChange={(e) => setTaskName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="codebaseSelect">Codebase</label>
                            <select
                                id="codebaseSelect"
                                className="input-field"
                                value={selectedCodebase}
                                onChange={(e) => setSelectedCodebase(e.target.value)}
                                required
                            >
                                <option value="">Select Codebase</option>
                                {SimulatedContainers.map(container => (
                                    <option key={container.id} value={container.dir_name}>
                                        {container.dir_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="apiEndpoint">API Endpoint</label>
                            <select
                                id="apiEndpoint"
                                className="input-field"
                                value={selectedApiEndpoint}
                                onChange={(e) => setSelectedApiEndpoint(e.target.value)}
                                required
                            >
                                <option value="">Select API Endpoint</option>
                                <option value="/execute_codebase">Execute Startup Script</option>
                                <option value="/code_server">Start Code Server</option>
                                <option value="/rollback_server">Rollback Server</option>
                                <option value="/stop_process">Stop Process</option>
                            </select>
                        </div>
                        {selectedApiEndpoint === '/rollback_server' && (
                            <div className="form-group">
                                <label htmlFor="taskCommitId">Commit ID (for Rollback)</label>
                                <Input
                                    id="taskCommitId"
                                    type="text"
                                    placeholder="e.g., abc123def456"
                                    value={taskCommitId}
                                    onChange={(e) => setTaskCommitId(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                        <div className="form-group">
                            <label htmlFor="scheduleTime">Schedule Time</label>
                            <Input
                                id="scheduleTime"
                                type="datetime-local"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" variant="primary" className="col-span-full">
                            Schedule Task
                        </Button>
                    </form>
                </section>
                <section className="card-section">
                    <h2>Scheduled Tasks List</h2>
                    <div id="scheduledTasksList" className="task-list">
                        {tasks.length === 0 ? (
                            <p className="text-secondary-text-color text-center p-4">No tasks scheduled yet. Create one above!</p>
                        ) : (
                            tasks.map(task => (
                                <div key={task.id} className="task-item">
                                    <div className="task-header">
                                        <h3>{task.name}</h3>
                                        <span className={`task-status status-${task.status}`}>{task.status}</span>
                                    </div>
                                    <div className="task-details">
                                        <p><strong>Codebase:</strong> {task.codebase}</p>
                                        <p><strong>Endpoint:</strong> {task.endpoint}</p>
                                        <p><strong>Scheduled:</strong> {new Date(task.scheduleTime).toLocaleString()}</p>
                                        {task.commitId && <p><strong>Commit ID:</strong> {task.commitId}</p>}
                                        <p><strong>Last Run:</strong> {task.lastRun}</p>
                                        <p><strong>Run Count:</strong> {task.runCount}</p>
                                    </div>
                                    <div className="task-actions">
                                        <Button variant="secondary" onClick={() => addNotification(`Edit functionality for task '${task.name}' is not yet implemented.`, 'info')}>Edit</Button>
                                        <Button variant="danger" onClick={() => handleDeleteTask(task.id)}>Delete</Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>

            <Modal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                title="Upload Image"
                actions={(
                    <>
                        <Button variant="secondary" onClick={() => setIsUploadModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleUploadImage} disabled={isUploading}>
                            {isUploading ? 'Uploading...' : 'Upload'}
                        </Button>
                    </>
                )}
            >
                <p className="text-secondary-text-color mb-4">Select a binary file (e.g., Docker image, project archive) to upload.</p>
                <input
                    type="file"
                    id="imageFileInput"
                    className="file-input"
                    onChange={(e) => setFileToUpload(e.target.files[0])}
                />
            </Modal>
        </div>
    );
};

export default ScheduledTasksPage;
