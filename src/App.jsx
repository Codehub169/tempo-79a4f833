import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage'; // Will be created in a later batch
import CodebaseDetailsPage from './pages/CodebaseDetailsPage'; // Will be created in a later batch
import ScheduledTasksPage from './pages/ScheduledTasksPage'; // Will be created in a later batch
import Sidebar from './components/Sidebar'; // Will be created in a later batch
import Notification from './components/Notification'; // Will be created in a later batch
import { NotificationProvider } from './hooks/useNotifications'; // Will be created in a later batch

function App() {
  return (
    <NotificationProvider>
      <Router>
        <div className="flex min-h-screen bg-background-color text-text-color font-inter">
          {/* Sidebar will be a separate component */}
          {/* <Sidebar /> */}
          <aside className="w-72 bg-sidebar-background p-8 flex flex-col border-r border-border-color shadow-dark flex-shrink-0 sticky top-0 h-screen">
            <div className="text-4xl font-bold bg-gradient-to-br from-primary-color to-pink-500 bg-clip-text text-transparent mb-8 text-center tracking-wider drop-shadow-lg">Codehub</div>
            <nav className="flex flex-col space-y-3">
              <a href="/" className="flex items-center p-4 text-secondary-text-color hover:bg-primary-color/15 hover:text-text-color rounded-xl transition-all duration-300 ease-out hover:translate-x-1 font-medium text-lg">
                <span className="mr-3 text-2xl">📊</span> Dashboard
              </a>
              <a href="/scheduled-tasks" className="flex items-center p-4 text-secondary-text-color hover:bg-primary-color/15 hover:text-text-color rounded-xl transition-all duration-300 ease-out hover:translate-x-1 font-medium text-lg">
                <span className="mr-3 text-2xl">✨</span> Scheduled Tasks
              }
              </a>
              <a href="#" className="flex items-center p-4 text-secondary-text-color hover:bg-primary-color/15 hover:text-text-color rounded-xl transition-all duration-300 ease-out hover:translate-x-1 font-medium text-lg">
                <span className="mr-3 text-2xl">⬆️</span> Upload Image
              </a>
            </nav>
          </aside>

          <main className="flex-grow p-8 lg:p-12 flex flex-col space-y-8">
            <Routes>
              {/* Placeholder routes - actual components will be imported in later batches */}
              <Route path="/" element={<h1 className="text-4xl font-bold text-text-color pb-4 border-b border-border-color mb-4 drop-shadow-md">Dashboard Overview</h1>} />
              <Route path="/codebase/:dir_name" element={<h1 className="text-4xl font-bold text-text-color pb-4 border-b border-border-color mb-4 drop-shadow-md">Codebase Details</h1>} />
              <Route path="/scheduled-tasks" element={<h1 className="text-4xl font-bold text-text-color pb-4 border-b border-border-color mb-4 drop-shadow-md">Scheduled Tasks</h1>} />
            </Routes>
          </main>
        </div>
        {/* Notification component will be rendered here */}
        {/* <Notification /> */}
      </Router>
    </NotificationProvider>
  );
}

export default App;
