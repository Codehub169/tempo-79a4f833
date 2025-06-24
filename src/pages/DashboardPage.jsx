import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import * as api from '../api';
import { useNotifications } from '../hooks/useNotifications.jsx';

const DashboardPage = () => {
  const [containers, setContainers] = useState([]);
  const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false);
  const [selectedDirName, setSelectedDirName] = useState('');
  const [commitId, setCommitId] = useState('');
  const [loadingAction, setLoadingAction] = useState(null);

  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  const fetchContainers = async () => {
    try {
      const response = await api.listDockerContainers();
      const formattedContainers = response.data.map(c => ({
        ...c,
        last_activity: c.last_activity || 'N/A'
      }));
      setContainers(formattedContainers);
    } catch (error) {
      console.error("Error fetching containers:", error);
      addNotification("Failed to load containers.", "error");
    }
  };

  useEffect(() => {
    fetchContainers();
    const interval = setInterval(fetchContainers, 15000);
    return () => clearInterval(interval);
  }, []);

  const openRollbackModal = (dirName) => {
    setSelectedDirName(dirName);
    setCommitId('');
    setIsRollbackModalOpen(true);
  };

  const closeRollbackModal = () => {
    setIsRollbackModalOpen(false);
    setSelectedDirName('');
    setCommitId('');
  };

  const handleAction = async (actionFn, dirName, actionType) => {
    setLoadingAction(`${actionType}-${dirName}`);
    try {
      await actionFn(dirName);
      addNotification(`Successfully ${actionType} for ${dirName}.`, 'success');
      setContainers(prevContainers =>
        prevContainers.map(c =>
          c.dir_name === dirName ? { ...c, status: actionType === 'started code server' ? 'running' : (actionType === 'stopped process' ? 'stopped' : c.status) } : c
        )
      );
    } catch (error) {
      console.error(`Error ${actionType} for ${dirName}:`, error);
      addNotification(`Failed to ${actionType} for ${dirName}. ${error.message || 'Please try again.'}`, 'error');
    } finally {
      setLoadingAction(null);
      fetchContainers();
    }
  };

  const handleRollback = async () => {
    if (!commitId) {
      addNotification('Please enter a Commit ID.', 'error');
      return;
    }
    setLoadingAction(`rollback-${selectedDirName}`);
    try {
      await api.rollbackServer(commitId, selectedDirName);
      addNotification(`Codebase ${selectedDirName} rolled back to ${commitId}.`, 'success');
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
      fetchContainers();
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
    </main>
  );
};

export default DashboardPage;
