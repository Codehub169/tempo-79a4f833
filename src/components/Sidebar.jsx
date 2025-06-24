import React from 'react';
import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';

const Sidebar = ({ onUploadImageClick }) => {
  return (
    <aside className="w-72 bg-sidebar-background p-8 flex flex-col border-r border-border-color shadow-2xl flex-shrink-0 sticky top-0 h-screen">
      <div className="text-4xl font-extrabold bg-gradient-to-br from-primary-color to-pink-500 text-transparent bg-clip-text mb-8 text-center tracking-wider drop-shadow-lg">
        Codehub
      </div>
      <nav className="flex flex-col space-y-3">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 p-4 rounded-xl transition-all duration-300 ease-in-out font-medium text-lg
            ${isActive ? 'bg-gradient-to-r from-primary-color to-pink-500 text-background-color shadow-lg' : 'text-secondary-text-color hover:bg-primary-color/15 hover:text-text-color hover:translate-x-1'}`
          }
        >
          <span className="text-2xl leading-none">📊</span> Dashboard
        </NavLink>
        <NavLink
          to="/scheduled-tasks"
          className={({ isActive }) =>
            `flex items-center gap-3 p-4 rounded-xl transition-all duration-300 ease-in-out font-medium text-lg
            ${isActive ? 'bg-gradient-to-r from-primary-color to-pink-500 text-background-color shadow-lg' : 'text-secondary-text-color hover:bg-primary-color/15 hover:text-text-color hover:translate-x-1'}`
          }
        >
          <span className="text-2xl leading-none">✨</span> Scheduled Tasks
        </NavLink>
        <button
          onClick={onUploadImageClick}
          className="flex items-center gap-3 p-4 rounded-xl transition-all duration-300 ease-in-out font-medium text-lg text-secondary-text-color hover:bg-primary-color/15 hover:text-text-color hover:translate-x-1 w-full text-left"
        >
          <span className="text-2xl leading-none">⬆️</span> Upload Image
        </button>
      </nav>
    </aside>
  );
};

Sidebar.propTypes = {
  onUploadImageClick: PropTypes.func.isRequired, // Function to open the upload image modal
};

export default Sidebar;
