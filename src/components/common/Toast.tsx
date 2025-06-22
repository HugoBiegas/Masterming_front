// src/components/common/Toast.tsx
import React, { useEffect, useState } from 'react';

interface ToastProps {
    message: string | any;
    type: 'success' | 'error' | 'warning' | 'info';
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
    index?: number;
}

export const Toast: React.FC<ToastProps> = ({
                                                message,
                                                type,
                                                isVisible,
                                                onClose,
                                                duration = 2000, // Réduit de 5000ms à 2000ms
                                                index = 0
                                            }) => {
    const [isClosing, setIsClosing] = useState(false);
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {
        if (isVisible && duration > 0) {
            // Timer principal pour fermer la notification
            const mainTimer = setTimeout(() => {
                setIsClosing(true);
                setTimeout(() => {
                    onClose();
                }, 300); // Temps pour l'animation de sortie
            }, duration);

            // Timer pour mettre à jour le temps restant (optionnel, pour une barre de progression)
            const countdownTimer = setInterval(() => {
                setTimeLeft(prev => Math.max(0, prev - 100));
            }, 100);

            return () => {
                clearTimeout(mainTimer);
                clearInterval(countdownTimer);
            };
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    const getToastStyles = () => {
        const baseStyles = `
            w-full p-3 rounded-lg shadow-lg transition-all duration-300 transform relative overflow-hidden
            ${isClosing ? 'animate-slide-out opacity-0 scale-95' : 'animate-slide-in'}
        `;

        switch (type) {
            case 'success':
                return `${baseStyles} bg-green-500 text-white border-l-4 border-green-700`;
            case 'error':
                return `${baseStyles} bg-red-500 text-white border-l-4 border-red-700`;
            case 'warning':
                return `${baseStyles} bg-yellow-500 text-white border-l-4 border-yellow-700`;
            case 'info':
                return `${baseStyles} bg-blue-500 text-white border-l-4 border-blue-700`;
            default:
                return `${baseStyles} bg-gray-500 text-white border-l-4 border-gray-700`;
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            case 'warning':
                return '⚠️';
            case 'info':
                return 'ℹ️';
            default:
                return '📋';
        }
    };

    const progressPercentage = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;

    return (
        <div
            className={getToastStyles()}
            style={{
                animationDelay: `${index * 50}ms` // Réduit le délai d'animation
            }}
        >
            {/* Barre de progression */}
            {duration > 0 && (
                <div className="absolute bottom-0 left-0 h-1 bg-white bg-opacity-30 transition-all duration-100"
                     style={{ width: `${progressPercentage}%` }}></div>
            )}

            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2 flex-1">
                    <span className="text-base flex-shrink-0 mt-0.5">{getIcon()}</span>
                    <div className="flex-1">
                        <p className="font-medium text-sm leading-relaxed">{message}</p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        setIsClosing(true);
                        setTimeout(onClose, 300);
                    }}
                    className="ml-2 text-white hover:text-gray-200 transition-colors flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20"
                    title="Fermer"
                >
                    <span className="text-xs font-bold">✕</span>
                </button>
            </div>
        </div>
    );
};