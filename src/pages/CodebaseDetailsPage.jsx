import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import * as api from '../api';
import { useNotifications } from '../hooks/useNotifications.jsx';

const CodebaseDetailsPage = () => {
  const { dir_name } = useParams();
  const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false);
  const [commitId, setCommitId] = useState('');
  const [loadingAction, setLoadingAction] = useState(null);
  const [allLogs, setAllLogs] = useState([]);
  const [logFilter, setLogFilter] = useState('');
  const logOutputRef = useRef(null);
  const logIntervalRef = useRef(null);

  const { addNotification } = useNotifications();

  const fetchLogs = async () => {
    try {
      const response = await api.getContainerLogs(dir_name);
      setAllLogs(response.data.logs.split('\n').filter(Boolean));
    } catch (error) {
      console.error(`Error fetching logs for ${dir_name}:`, error);
      addNotification(`Failed to fetch logs for ${dir_name}.`, 'error');
      setAllLogs(prev => [...prev, `${new Date().toISOString().replace('T', ' ').substring(0, 19)} [ERROR] Failed to fetch logs: ${error.message || 'Unknown error'}`]);
    }
  };

  const startLogStream = () => {
    if (logIntervalRef.current) clearInterval(logIntervalRef.current);
    fetchLogs();
    logIntervalRef.current = setInterval(fetchLogs, 5000);
  };

  const stopLogStream = () => {
    if (logIntervalRef.current) {
      clearInterval(logIntervalRef.current);
      logIntervalRef.current = null;
    }
  };

  useEffect(() => {
    startLogStream();
    return () => stopLogStream();
  }, [dir_name]);

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

  const openRollbackModal = () => {
    setCommitId('');
    setIsRollbackModalOpen(true);
  };

  const closeRollbackModal = () => {
    setIsRollbackModalOpen(false);
    setCommitId('');
  };

  const handleAction = async (actionFn, actionType) => {
    setLoadingAction(actionType);
    try {
      await actionFn(dir_name);
      addNotification(`Successfully ${actionType} for ${dir_name}.`, 'success');
      if (actionType === 'started code server') {
        startLogStream();
      } else if (actionType === 'stopped process') {
        stopLogStream();
        setAllLogs(prev => [...prev, `${new Date().toISOString().replace('T', ' ').substring(0, 19)} [INFO] [System] Codebase ${dir_name} process stopped.`]);
      }
    } catch (error) {
      console.error(`Error ${actionType} for ${dir_name}:`, error);
      addNotification(`Failed to ${actionType} for ${dir_name}. ${error.message || 'Please try again.'}`, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRollback = async () => {
    if (!commitId) {
      addNotification('Please enter a Commit ID.', 'error');
      return;
    }
    setLoadingAction('rolled back server');
    try {
      await api.rollbackServer(commitId, dir_name);
      addNotification(`Codebase ${dir_name} rolled back to ${commitId}.`, 'success');
      startLogStream();
      setAllLogs(prev => [...prev, `${new Date().toISOString().replace('T', ' ').substring(0, 19)} [INFO] [System] Codebase ${dir_name} rolled back to commit ${commitId}.`]);
      closeRollbackModal();
    } catch (error) {
      console.error(`Error rolling back ${dir_name}:`, error);
      addNotification(`Failed to rollback ${dir_name}. ${error.message || 'Please try again.'}`, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <main className="flex-grow p-8 flex flex-col space-y-8 bg-background-color text-text-color">
      <header className="pb-6 border-b border-border-color mb-4">
        <h1 className="text-4xl font-bold text-text-color drop-shadow-md">Codebase Details: <span className="text-primary-color">{dir_name}</span></h1>
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
          {filteredLogs.join('\n')}
        </pre>
      </section>

      <Modal isOpen={isRollbackModalOpen} onClose={closeRollbackModal} title="Rollback Codebase">
        <p className="text-secondary-text-color mb-4">
          Rollback <strong className="text-text-color">{dir_name}</strong> to a specific commit ID.
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
    </main>
  );
};

export default CodebaseDetailsPage;
