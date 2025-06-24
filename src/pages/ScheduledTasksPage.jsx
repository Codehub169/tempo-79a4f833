import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Input from '../components/Input';
import { useNotifications } from '../hooks/useNotifications.jsx';
import * as api from '../api';

const ScheduledTasksPage = () => {
    const navigate = useNavigate();
    const { addNotification } = useNotifications();

    const [tasks, setTasks] = useState([]);
    const [taskName, setTaskName] = useState('');
    const [selectedCodebase, setSelectedCodebase] = useState('');
    const [availableCodebases, setAvailableCodebases] = useState([]);
    const [selectedApiEndpoint, setSelectedApiEndpoint] = useState('');
    const [taskCommitId, setTaskCommitId] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');

    useEffect(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 5);
        setScheduleTime(now.toISOString().slice(0, 16));
    }, []);

    useEffect(() => {
        const fetchCodebases = async () => {
            try {
                const response = await api.listDockerContainers();
                setAvailableCodebases(response.data);
            } catch (error) {
                console.error("Error fetching codebases:", error);
                addNotification("Failed to load available codebases.", "error");
            }
        };
        fetchCodebases();
    }, []);

    useEffect(() => {
        const storedTasks = JSON.parse(localStorage.getItem('scheduledTasks')) || [];
        setTasks(storedTasks);

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

        setTaskName('');
        setSelectedCodebase('');
        setSelectedApiEndpoint('');
        setTaskCommitId('');
        const now = new Date();
        now.setMinutes(now.getMinutes() + 5);
        setScheduleTime(now.toISOString().slice(0, 16));

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
            let apiCall;
            let args = [task.codebase];
            if (task.endpoint === '/rollback_server') {
                apiCall = api.rollbackServer;
                args = [task.commitId, task.codebase];
            } else if (task.endpoint === '/execute_codebase') {
                apiCall = api.processStartupSh;
            } else if (task.endpoint === '/code_server') {
                apiCall = api.startCodeserver;
            } else if (task.endpoint === '/stop_process') {
                apiCall = api.stopProcess;
            } else {
                throw new Error('Unknown API endpoint.');
            }

            await apiCall(...args);

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

    return (
        <main className="flex-grow p-8 flex flex-col space-y-8 bg-background-color text-text-color">
            <header className="pb-6 border-b border-border-color mb-4">
                <h1 className="text-4xl font-bold text-text-color drop-shadow-md">Scheduled Tasks</h1>
            </header>
            <section className="bg-card-background p-8 rounded-xl shadow-2xl border border-border-color">
                <h2 className="text-3xl font-semibold mb-6 text-primary-color pb-3 border-b border-border-color drop-shadow-sm">Create New Task</h2>
                <form onSubmit={handleScheduleTask} className="grid grid-cols-1 md:grid-cols-2 gap-6 task-form">
                    <div className="form-group">
                        <label htmlFor="taskName" className="text-secondary-text-color text-sm font-medium mb-1 block">Task Name</label>
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
                        <label htmlFor="codebaseSelect" className="text-secondary-text-color text-sm font-medium mb-1 block">Codebase</label>
                        <select
                            id="codebaseSelect"
                            className="input-field block w-full"
                            value={selectedCodebase}
                            onChange={(e) => setSelectedCodebase(e.target.value)}
                            required
                        >
                            <option value="">Select Codebase</option>
                            {availableCodebases.map(container => (
                                <option key={container.id} value={container.dir_name}>
                                    {container.dir_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="apiEndpoint" className="text-secondary-text-color text-sm font-medium mb-1 block">API Endpoint</label>
                        <select
                            id="apiEndpoint"
                            className="input-field block w-full"
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
                            <label htmlFor="taskCommitId" className="text-secondary-text-color text-sm font-medium mb-1 block">Commit ID (for Rollback)</label>
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
                        <label htmlFor="scheduleTime" className="text-secondary-text-color text-sm font-medium mb-1 block">Schedule Time</label>
                        <Input
                            id="scheduleTime"
                            type="datetime-local"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" variant="primary" className="col-span-full mt-4">
                        Schedule Task
                    </Button>
                </form>
            </section>
            <section className="bg-card-background p-8 rounded-xl shadow-2xl border border-border-color">
                <h2 className="text-3xl font-semibold mb-6 text-primary-color pb-3 border-b border-border-color drop-shadow-sm">Scheduled Tasks List</h2>
                <div id="scheduledTasksList" className="flex flex-col gap-4">
                    {tasks.length === 0 ? (
                        <p className="text-secondary-text-color text-center p-4">No tasks scheduled yet. Create one above!</p>
                    ) : (
                        tasks.map(task => (
                            <div key={task.id} className="bg-sidebar-background rounded-xl p-6 shadow-lg border border-border-color transition-all duration-300 ease-out hover:translate-y-[-5px] hover:shadow-xl hover:shadow-primary-color/20 relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-color to-pink-500 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                                <div className="flex justify-between items-center pb-4 mb-4 border-b border-border-color/50">
                                    <h3 className="text-xl font-semibold text-text-color">{task.name}</h3>
                                    <span className={`px-3 py-1 rounded-md text-sm font-semibold uppercase
                                        ${task.status === 'pending' ? 'bg-warning-color/20 text-warning-color'
                                        : task.status === 'completed' ? 'bg-success-color/20 text-success-color'
                                        : task.status === 'failed' ? 'bg-danger-color/20 text-danger-color'
                                        : 'bg-info-color/20 text-info-color'}`}>{task.status}</span>
                                </div>
                                <div className="text-secondary-text-color text-sm mb-5 space-y-1">
                                    <p><strong>Codebase:</strong> <span className="text-text-color">{task.codebase}</span></p>
                                    <p><strong>Endpoint:</strong> <span className="text-text-color">{task.endpoint}</span></p>
                                    <p><strong>Scheduled:</strong> <span className="text-text-color">{new Date(task.scheduleTime).toLocaleString()}</span></p>
                                    {task.commitId && <p><strong>Commit ID:</strong> <span className="text-text-color">{task.commitId}</span></p>}
                                    <p><strong>Last Run:</strong> <span className="text-text-color">{task.lastRun}</span></p>
                                    <p><strong>Run Count:</strong> <span className="text-text-color">{task.runCount}</span></p>
                                </div>
                                <div className="flex flex-wrap gap-3 pt-4 border-t border-border-color/50">
                                    <Button variant="secondary" onClick={() => addNotification(`Edit functionality for task '${task.name}' is not yet implemented.`, 'info')}>Edit</Button>
                                    <Button variant="danger" onClick={() => handleDeleteTask(task.id)}>Delete</Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </main>
    );
};

export default ScheduledTasksPage;
