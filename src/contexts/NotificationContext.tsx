// src/contexts/NotificationContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Toast } from '@/components/common/Toast';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
    id: string;
    message: string;
    type: NotificationType;
}

interface NotificationContextType {
    showNotification: (message: string, type: NotificationType) => void;
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
    showWarning: (message: string) => void;
    showInfo: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const showNotification = (message: string, type: NotificationType) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newNotification: Notification = { id, message, type };

        setNotifications(prev => [...prev, newNotification]);
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };

    const showSuccess = (message: string) => showNotification(message, 'success');
    const showError = (message: string) => showNotification(message, 'error');
    const showWarning = (message: string) => showNotification(message, 'warning');
    const showInfo = (message: string) => showNotification(message, 'info');

    return (
        <NotificationContext.Provider value={{
            showNotification,
            showSuccess,
            showError,
            showWarning,
            showInfo
        }}>
            {children}

            {/* Container des toasts - Centre haut de l'écran */}
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-3 max-w-md w-full px-4">
                {notifications.map((notification, index) => (
                    <Toast
                        key={notification.id}
                        message={notification.message}
                        type={notification.type}
                        isVisible={true}
                        onClose={() => removeNotification(notification.id)}
                        duration={5000}
                        index={index}
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

export const useNotification = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};