import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const Notification = ({ message, type = 'info', id, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger show animation
    setIsVisible(true);
    // Set a timeout to hide the notification after a delay
    const timer = setTimeout(() => {
      setIsVisible(false);
      // After the exit animation, call onClose to remove from DOM
      const transitionEndHandler = () => {
        onClose(id);
        notificationElement.removeEventListener('transitionend', transitionEndHandler);
      };
      const notificationElement = document.getElementById(`notification-${id}`);
      if (notificationElement) {
        notificationElement.addEventListener('transitionend', transitionEndHandler);
      } else {
        onClose(id); // Fallback if element is not found (e.g., quickly unmounted)
      }
    }, 3000); // Notification stays for 3 seconds before fading out

    return () => clearTimeout(timer);
  }, [id, onClose]);

  const iconMap = {
    success: '✔',
    error: '✖',
    info: 'ℹ',
    warning: '⚠',
  };

  const typeClasses = {
    success: 'border-l-success-color text-success-color',
    error: 'border-l-danger-color text-danger-color',
    info: 'border-l-info-color text-info-color',
    warning: 'border-l-warning-color text-warning-color',
  };

  const backgroundTypeClasses = {
    success: 'bg-success-color/20',
    error: 'bg-danger-color/20',
    info: 'bg-info-color/20',
    warning: 'bg-warning-color/20',
  };

  return (
    <div
      id={`notification-${id}`}
      className={`flex items-center gap-3 p-4 rounded-xl shadow-lg transition-all duration-300 ease-out border border-border-color
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
        ${typeClasses[type]} ${backgroundTypeClasses[type]} text-text-color`}
      style={{ minWidth: '300px', maxWidth: '400px', backgroundColor: 'var(--card-background)' }}
    >
      <span className={`text-2xl leading-none ${typeClasses[type]}`}>{iconMap[type]}</span>
      <span className="flex-grow text-base font-medium text-text-color">{message}</span>
    </div>
  );
};

Notification.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'info', 'warning']),
  id: PropTypes.string.isRequired, // Unique ID for managing notifications
  onClose: PropTypes.func.isRequired, // Callback to remove notification from parent state
};

export default Notification;
