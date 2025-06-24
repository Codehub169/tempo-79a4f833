import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import * as api from '../api';
import { useNotifications } from '../hooks/useNotifications';

const CodebaseDetailsPage = () => {
  const { dirName } = useParams(); // Get dir_name from URL parameters
  const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [commitId, setCommitId] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);
  const [allLogs, setAllLogs] = useState([]);
  const [logFilter, setLogFilter] = useState('');
  const logOutputRef = useRef(null);
  const logIntervalRef = useRef(null);

  const { addNotification } = useNotifications();

  // --- Log Generation and Management ---
  const generateLogEntry = (codebaseName) => {
    const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
    const services = ['API', 'DB', 'Worker', 'Auth', 'Cache', 'System', 'Deploy'];
    const messages = [
      `Processing request for ${codebaseName}...`,
      `Successfully connected to database.`,
      `User 'admin' logged in.`,
      `Failed to fetch data from external service. Retrying...`,
      `Cache cleared.`,
      `Container health check passed.`,
      `Starting new task: ${Math.random().toString(36).substring(7)}`,
      `Disk usage at 80%. Consider cleanup.`,
      `Build completed successfully.`,
      `Deployment initiated.`,
      `Error: Unable to bind to port 8080.`,
      `Received heartbeat from client.`,
      `Applying configuration changes.`,
      `Rollback initiated by user.`,
      `Process exited with code 0.`,
      `Fetching latest updates for ${codebaseName}.`,
      `Dependency 'axios@1.0.0' installed.`
    ];

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const level = levels[Math.floor(Math.random() * levels.length)];
    const service = services[Math.floor(Math.random() * services.length)];
    const message = messages[Math.floor(Math.random() * messages.length)];

    return `${timestamp} [${level}] [${service}] ${message}\n`;
  };

  const startLogStream = () => {
    if (logIntervalRef.current) clearInterval(logIntervalRef.current);
    logIntervalRef.current = setInterval(() => {
      setAllLogs(prevLogs => [...prevLogs, generateLogEntry(dirName)]);
    }, 500 + Math.random() * 1000); // Random interval for more realistic feel
  };

  const stopLogStream = () => {
    if (logIntervalRef.current) {
      clearInterval(logIntervalRef.current);
      logIntervalRef.current = null;
    }
  };

  useEffect(() => {
    // Start log stream when component mounts or dirName changes
    startLogStream();

    // Cleanup interval on unmount
    return () => stopLogStream();
  }, [dirName]);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logOutputRef.current) {
      logOutputRef.current.scrollTop = logOutputRef.current.scrollHeight;
    }
  }, [allLogs]);

  const filteredLogs = allLogs.filter(log =>
    log.toLowerCase().includes(logFilter.toLowerCase())
  );

  const handleClearLogs = () => {
    setAllLogs([]);
    setLogFilter('');
    addNotification('Logs cleared.', 'info');
  };

  // --- Modal Handlers --- (Rollback & Upload)
  const openRollbackModal = () => {
    setCommitId(''); // Clear previous input
    setIsRollbackModalOpen(true);
  };

  const closeRollbackModal = () => {
    setIsRollbackModalOpen(false);
    setCommitId('');
  };

  const openUploadModal = () => {
    setFileToUpload(null);
    setIsUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setFileToUpload(null);
  };

  // --- Action Handlers --- (API Calls)
  const handleAction = async (actionFn, actionType, extraData = {}) => {
    setLoadingAction(actionType);
    try {
      const response = await actionFn({ dir_name: dirName, ...extraData });
      addNotification(`Successfully ${actionType} for ${dirName}.`, 'success');
      if (actionType === 'started code server') {
        startLogStream(); // Restart log stream on server start
      } else if (actionType === 'stopped process') {
        stopLogStream(); // Stop log stream on server stop
        setAllLogs(prev => [...prev, `${new Date().toISOString().replace('T', ' ').substring(0, 19)} [INFO] [System] Codebase ${dirName} process stopped.\n`]);
      } else if (actionType === 'rolled back server') {
        startLogStream(); // Assume rollback restarts server and logs
        setAllLogs(prev => [...prev, `${new Date().toISOString().replace('T', ' ').substring(0, 19)} [INFO] [System] Codebase ${dirName} rolled back to commit ${commitId}.\n`]);
      } else if (actionType === 'executed startup script') {
        setAllLogs(prev => [...prev, `${new Date().toISOString().replace('T', ' ').substring(0, 19)} [INFO] [System] Executing startup.sh for ${dirName}.\n`]);
      }

    } catch (error) {
      console.error(`Error ${actionType} for ${dirName}:`, error);
      addNotification(`Failed to ${actionType} for ${dirName}. ${error.message || 'Please try again.'}`, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRollback = async () => {
    if (!commitId) {
      addNotification('Please enter a Commit ID.', 'error');
      return;
    }
    await handleAction(api.rollbackServer, 'rolled back server', { commit_id: commitId });
    closeRollbackModal();
  };

  const handleUploadImage = async () => {
    if (!fileToUpload) {
      addNotification('Please select a file to upload.', 'error');
      return;
    }
    setLoadingAction('upload-image');
    try {
      await api.uploadImage({ file: fileToUpload });
      addNotification(`File '${fileToUpload.name}' uploaded successfully.`, 'success');
      closeUploadModal();
    } catch (error) {
      console.error('Error uploading image:', error);
      addNotification(`Failed to upload image. ${error.message || 'Please try again.'}`, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <main className="flex-grow p-8 flex flex-col space-y-8 bg-background-color text-text-color">
      <header className="pb-6 border-b border-border-color mb-4">
        <h1 className="text-4xl font-bold text-text-color drop-shadow-md">Codebase Details: <span className="text-primary-color">{dirName}</span></h1>
      </header>

      <section className="bg-card-background p-8 rounded-xl shadow-2xl border border-border-color">
        <h2 className="text-3xl font-semibold mb-6 text-primary-color pb-3 border-b border-border-color drop-shadow-sm">Server Controls</h2>
        <div className="flex flex-wrap gap-4">
          <Button
            variant="primary"
            onClick={() => handleAction(api.startCodeserver, 'started code server')}
            disabled={loadingAction === 'started code server'}
          >
            {loadingAction === 'started code server' ? 'Starting...' : 'Start Code Server'}
          </Button>
          <Button
            variant="danger"
            onClick={() => handleAction(api.stopProcess, 'stopped process')}
            disabled={loadingAction === 'stopped process'}
          >
            {loadingAction === 'stopped process' ? 'Stopping...' : 'Stop Process'}
          </Button>
          <Button
            variant="warning"
            onClick={openRollbackModal}
            disabled={loadingAction === 'rolled back server'}
          >
            {loadingAction === 'rolled back server' ? 'Opening Rollback...' : 'Rollback Server'}
          </Button>
          <Button
            variant="info"
            onClick={() => handleAction(api.processStartupSh, 'executed startup script')}
            disabled={loadingAction === 'executed startup script'}
          >
            {loadingAction === 'executed startup script' ? 'Executing...' : 'Execute startup.sh'}
          </Button>
        </div>
      </section>

      <section className="bg-card-background p-8 rounded-xl shadow-2xl border border-border-color">
        <h2 className="text-3xl font-semibold mb-6 text-primary-color pb-3 border-b border-border-color drop-shadow-sm">Real-time Logs</h2>
        <div className="flex gap-4 mb-6">
          <Input
            type="text"
            placeholder="Filter logs..."
            value={logFilter}
            onChange={(e) => setLogFilter(e.target.value)}
            className="flex-grow"
          />
          <Button variant="secondary" onClick={handleClearLogs}>Clear Logs</Button>
        </div>
        <pre
          ref={logOutputRef}
          className="bg-sidebar-background p-6 rounded-xl border border-border-color h-96 overflow-y-auto text-sm font-mono text-gray-300 leading-relaxed shadow-inner"
          style={{ fontFamily: 'Fira Code, monospace' }}
        >
          {filteredLogs.join('')}
        </pre>
      </section>

      {/* Rollback Modal */}
      <Modal isOpen={isRollbackModalOpen} onClose={closeRollbackModal} title="Rollback Codebase">
        <p className="text-secondary-text-color mb-4">
          Rollback <strong className="text-text-color">{dirName}</strong> to a specific commit ID.
        </p>
        <Input
          type="text"
          placeholder="Enter Commit ID (e.g., abc123def456)"
          value={commitId}
          onChange={(e) => setCommitId(e.target.value)}
          className="mb-6"
        />
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={closeRollbackModal}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleRollback}
            disabled={loadingAction === 'rolled back server'}
          >
            {loadingAction === 'rolled back server' ? 'Rolling back...' : 'Rollback'}
          </Button>
        </div>
      </Modal>

      {/* Image Upload Modal */}
      <Modal isOpen={isUploadModalOpen} onClose={closeUploadModal} title="Upload Image">
        <p className="text-secondary-text-color mb-4">
          Select a binary file (e.g., Docker image, project archive) to upload.
        </p>
        <input
          type="file"
          onChange={(e) => setFileToUpload(e.target.files[0])}
          className="file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-gradient-to-r from-primary-color to-pink-500 file:text-background-color
            hover:file:opacity-90 transition-opacity duration-200
            cursor-pointer text-secondary-text-color"
        />
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="secondary" onClick={closeUploadModal}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleUploadImage}
            disabled={loadingAction === 'upload-image'}
          >
            {loadingAction === 'upload-image' ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </Modal>
    </main>
  );
};

export default CodebaseDetailsPage;
