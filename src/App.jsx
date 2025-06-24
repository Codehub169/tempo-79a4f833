import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import CodebaseDetailsPage from './pages/CodebaseDetailsPage';
import ScheduledTasksPage from './pages/ScheduledTasksPage';
import Sidebar from './components/Sidebar';
import Modal from './components/Modal';
import Button from './components/Button';
import * as api from './api';
import { NotificationProvider, useNotifications } from './hooks/useNotifications.jsx';

// Component to encapsulate logic that needs to consume NotificationContext
const AppContent = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // useNotifications can now be called here as AppContent is rendered inside NotificationProvider
  const { addNotification } = useNotifications();

  const handleOpenUploadModal = () => {
    setFileToUpload(null);
    setIsUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
    setFileToUpload(null);
  };

  const handleUploadImage = async () => {
    if (!fileToUpload) {
      addNotification('Please select a file to upload.', 'error');
      return;
    }
    setIsUploading(true);
    try {
      await api.uploadImage(fileToUpload);
      addNotification(`File '${fileToUpload.name}' uploaded successfully.`, 'success');
      handleCloseUploadModal();
    } catch (error) {
      console.error('Error uploading image:', error);
      addNotification(`Failed to upload image. ${error.message || 'Please try again.'}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Router>
      <div className="flex min-h-screen bg-background-color text-text-color font-inter">
        <Sidebar onUploadImageClick={handleOpenUploadModal} />

        <main className="flex-grow p-8 lg:p-12 flex flex-col space-y-8">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/codebase/:dir_name" element={<CodebaseDetailsPage />} />
            <Route path="/scheduled-tasks" element={<ScheduledTasksPage />} />
          </Routes>
        </main>
      </div>
      <Modal
        isOpen={isUploadModalOpen}
        onClose={handleCloseUploadModal}
        title="Upload Image"
        actions={(
          <>
            <Button variant="secondary" onClick={handleCloseUploadModal}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUploadImage} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </>
        )}
      >
        <p className="text-secondary-text-color mb-4">
          Select a binary file (e.g., Docker image, project archive) to upload.
        </p>
        <input
          type="file"
          id="imageFileInput"
          className="file-input"
          onChange={(e) => setFileToUpload(e.target.files[0])}
        />
      </Modal>
    </Router>
  );
}

function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

export default App;
