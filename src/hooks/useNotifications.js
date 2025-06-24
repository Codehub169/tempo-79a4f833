import React, { useState, useCallback, useContext, createContext } from 'react';
import { createPortal } from 'react-dom';
import Notification from '../components/Notification';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now(); // Simple unique ID
        setNotifications(prevNotifications => [
            ...prevNotifications,
            { id, message, type, duration, onClose: () => removeNotification(id) }
        ]);
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prevNotifications => prevNotifications.filter(notif => notif.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ addNotification }}>
            {children}
            {createPortal(
                <div className="notification-area">
                    {notifications.map(notif => (
                        <Notification
                            key={notif.id}
                            id={notif.id}
                            message={notif.message}
                            type={notif.type}
                            duration={notif.duration}
                            onClose={notif.onClose}
                        />
                    ))}
                </div>,
                document.body
            )}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
