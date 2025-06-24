import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import * as api from '../api';
import { useNotifications } from '../hooks/useNotifications';

const DashboardPage = () => {
  const [containers, setContainers] = useState([]);
  const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDirName, setSelectedDirName] = useState('');
  const [commitId, setCommitId] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null); // Tracks which action is loading

  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  // --- Fetch Containers --- (Simulated for now, replace with actual API call)
  const fetchContainers = async () => {
    // In a real app, you'd call api.listDockerContainers()
    // For now, simulate data
    const simulatedData = [
      { id: '1', dir_name: 'my-project-repo', status: 'running', last_activity: '2 minutes ago' },
      { id: '2', dir_name: 'backend-service', status: 'stopped', last_activity: '1 hour ago' },
      { id: '3', dir_name: 'frontend-app', status: 'running', last_activity: '5 minutes ago' },
      { id: '4', dir_name: 'data-pipeline', status: 'running', last_activity: '1 day ago' },
      { id: '5', dir_name: 'ml-model-dev', status: 'stopped', last_activity: '3 days ago' },
    ];
    setContainers(simulatedData);
  };

  useEffect(() => {
    fetchContainers();
    // Optionally, set up an interval to refresh containers regularly
    // const interval = setInterval(fetchContainers, 15000); // Refresh every 15 seconds
    // return () => clearInterval(interval);
  }, []);

  // --- Modal Handlers --- (Rollback & Upload)
  const openRollbackModal = (dirName) => {
    setSelectedDirName(dirName);
    setCommitId(''); // Clear previous input
    setIsRollbackModalOpen(true);
  };

  const closeRollbackModal = () => {
    setIsRollbackModalOpen(false);
    setSelectedDirName('');
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

  const handleAction = async (actionFn, dirName, actionType, extraData = {}) => {
    setLoadingAction(`${actionType}-${dirName}`);
    try {
      const response = await actionFn({ dir_name: dirName, ...extraData });
      addNotification(`Successfully ${actionType} for ${dirName}.`, 'success');
      // For start/stop, update status locally for immediate feedback
      setContainers(prevContainers =>
        prevContainers.map(c =>
          c.dir_name === dirName ? { ...c, status: actionType === 'started' ? 'running' : (actionType === 'stopped' ? 'stopped' : c.status) } : c
        )
      );
    } catch (error) {
      console.error(`Error ${actionType} for ${dirName}:`, error);
      addNotification(`Failed to ${actionType} for ${dirName}. ${error.message || 'Please try again.'}`, 'error');
    } finally {
      setLoadingAction(null);
      // In a real app, you might re-fetch containers for definitive status
      // fetchContainers();
    }
  };

  const handleRollback = async () => {
    if (!commitId) {
      addNotification('Please enter a Commit ID.', 'error');
      return;
    }
    setLoadingAction(`rollback-${selectedDirName}`);
    try {
      await api.rollbackServer({ dir_name: selectedDirName, commit_id: commitId });
      addNotification(`Codebase ${selectedDirName} rolled back to ${commitId}.`, 'success');
      // Assuming rollback restarts the server
      setContainers(prevContainers =>
        prevContainers.map(c =>
          c.dir_name === selectedDirName ? { ...c, status: 'running' } : c
        )
      );
      closeRollbackModal();
    } catch (error) {
      console.error(`Error rolling back ${selectedDirName}:`, error);
      addNotification(`Failed to rollback ${selectedDirName}. ${error.message || 'Please try again.'}`, 'error');
    } finally {
      setLoadingAction(null);
    }
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
        <h1 className="text-4xl font-bold text-text-color drop-shadow-md">Dashboard Overview</h1>
      </header>
      <section className="bg-card-background p-8 rounded-xl shadow-2xl border border-border-color">
        <h2 className="text-3xl font-semibold mb-6 text-primary-color pb-3 border-b border-border-color drop-shadow-sm">Active Codebases</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {containers.length === 0 ? (
            <p className="text-secondary-text-color col-span-full text-center">No active containers found.</p>
          ) : (
            containers.map((container) => (
              <div
                key={container.id}
                className="bg-sidebar-background rounded-xl p-6 shadow-lg border border-border-color transition-all duration-300 ease-out hover:translate-y-[-5px] hover:shadow-xl hover:shadow-primary-color/20 relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-color to-pink-500 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                <div className="flex justify-between items-center pb-4 mb-4 border-b border-border-color/50">
                  <h3 className="text-xl font-semibold text-text-color">{container.dir_name}</h3>
                  <span
                    className={`px-3 py-1 rounded-md text-sm font-semibold uppercase
                      ${container.status === 'running' ? 'bg-success-color/20 text-success-color' : 'bg-danger-color/20 text-danger-color'}`}
                  >
                    {container.status}
                  </span>
                </div>
                <p className="text-secondary-text-color text-sm mb-5">Last Activity: {container.last_activity}</p>
                <div className="flex flex-wrap gap-3 pt-4 border-t border-border-color/50">
                  <Button
                    variant="info"
                    onClick={() => handleAction(api.processStartupSh, container.dir_name, 'executed startup script')}
                    disabled={loadingAction === `executed startup script-${container.dir_name}`}
                  >
                    {loadingAction === `executed startup script-${container.dir_name}` ? 'Executing...' : 'Execute Startup'}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleAction(api.startCodeserver, container.dir_name, 'started code server')}
                    disabled={loadingAction === `started code server-${container.dir_name}` || container.status === 'running'}
                  >
                    {loadingAction === `started code server-${container.dir_name}` ? 'Starting...' : 'Start Code Server'}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleAction(api.stopProcess, container.dir_name, 'stopped process')}
                    disabled={loadingAction === `stopped process-${container.dir_name}` || container.status === 'stopped'}
                  >
                    {loadingAction === `stopped process-${container.dir_name}` ? 'Stopping...' : 'Stop Process'}
                  </Button>
                  <Button
                    variant="warning"
                    onClick={() => openRollbackModal(container.dir_name)}
                    disabled={loadingAction === `rollback-${container.dir_name}`}
                  >
                    {loadingAction === `rollback-${container.dir_name}` ? 'Opening...' : 'Rollback Server'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/codebase/${container.dir_name}`)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Rollback Modal */}
      <Modal isOpen={isRollbackModalOpen} onClose={closeRollbackModal} title="Rollback Codebase">
        <p className="text-secondary-text-color mb-4">
          Rollback <strong className="text-text-color">{selectedDirName}</strong> to a specific commit ID.
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
            disabled={loadingAction === `rollback-${selectedDirName}`}
          >
            {loadingAction === `rollback-${selectedDirName}` ? 'Rolling back...' : 'Rollback'}
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

export default DashboardPage;
