// src/contexts/NotificationContext.tsx
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Toast } from '@/components/common/Toast';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
    id: string;
    message: string;
    type: NotificationType;
    timestamp: number;
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

const MAX_NOTIFICATIONS = 3; // RÉDUIT à 3 toasts maximum
const NOTIFICATION_DURATION = 1500; // RÉDUIT à 1.5 secondes

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Fonction optimisée pour ajouter des notifications
    const showNotification = useCallback((message: string, type: NotificationType) => {
        // Éviter les doublons récents (même message dans les 300ms) - RÉDUIT
        const now = Date.now();
        const isDuplicate = notifications.some(notification =>
            notification.message === message &&
            notification.type === type &&
            (now - notification.timestamp) < 300 // RÉDUIT de 500ms à 300ms
        );

        if (isDuplicate) {
            return; // Ignorer les doublons
        }

        const id = Math.random().toString(36).substr(2, 9);
        const newNotification: Notification = {
            id,
            message,
            type,
            timestamp: now
        };

        setNotifications(prev => {
            const updated = [...prev, newNotification];

            // Si on dépasse la limite, supprimer les plus anciens
            if (updated.length > MAX_NOTIFICATIONS) {
                return updated.slice(-MAX_NOTIFICATIONS);
            }

            return updated;
        });
    }, [notifications]);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, []);

    // Fonctions spécialisées pour chaque type
    const showSuccess = useCallback((message: string) => showNotification(message, 'success'), [showNotification]);
    const showError = useCallback((message: string) => showNotification(message, 'error'), [showNotification]);
    const showWarning = useCallback((message: string) => showNotification(message, 'warning'), [showNotification]);
    const showInfo = useCallback((message: string) => showNotification(message, 'info'), [showNotification]);

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
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-1.5 max-w-md w-full px-4">
                {notifications.slice(-MAX_NOTIFICATIONS).map((notification, index) => (
                    <Toast
                        key={notification.id}
                        message={notification.message}
                        type={notification.type}
                        isVisible={true}
                        onClose={() => removeNotification(notification.id)}
                        duration={NOTIFICATION_DURATION}
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