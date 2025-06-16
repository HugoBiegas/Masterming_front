import React, { useEffect, useState } from 'react';

interface ToastProps {
    message: string;
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
                                                duration = 5000,
                                                index = 0
                                            }) => {
    const [isClosing, setIsClosing] = useState(false);
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {
        console.log(`🍞 Toast ${type} initialisé: "${message}" (visible: ${isVisible}, durée: ${duration}ms, index: ${index})`);

        if (isVisible && duration > 0) {
            // Timer principal pour fermer la notification
            const mainTimer = setTimeout(() => {
                console.log(`⏰ Toast ${type} - Timer expiré après ${duration}ms`);
                setIsClosing(true);
                setTimeout(() => {
                    console.log(`🗑️ Toast ${type} - Fermeture automatique`);
                    onClose();
                }, 300); // Temps pour l'animation de sortie
            }, duration);

            // Timer pour mettre à jour le temps restant
            const countdownTimer = setInterval(() => {
                setTimeLeft(prev => Math.max(0, prev - 100));
            }, 100);

            return () => {
                console.log(`🧹 Toast ${type} - Nettoyage des timers`);
                clearTimeout(mainTimer);
                clearInterval(countdownTimer);
            };
        }
    }, [isVisible, duration, onClose, message, type, index]);

    if (!isVisible) {
        console.log(`👻 Toast ${type} non visible - pas de rendu`);
        return null;
    }

    const getToastStyles = () => {
        const baseStyles = `
            w-full p-4 rounded-lg shadow-2xl transition-all duration-300 transform relative overflow-hidden border-2
            ${isClosing ? 'animate-slide-out opacity-0 scale-95' : 'animate-slide-in'}
        `;

        switch (type) {
            case 'success':
                return `${baseStyles} bg-green-500 text-white border-green-700 shadow-green-500/50`;
            case 'error':
                return `${baseStyles} bg-red-500 text-white border-red-700 shadow-red-500/50`;
            case 'warning':
                return `${baseStyles} bg-yellow-500 text-white border-yellow-700 shadow-yellow-500/50`;
            case 'info':
                return `${baseStyles} bg-blue-500 text-white border-blue-700 shadow-blue-500/50`;
            default:
                return `${baseStyles} bg-gray-500 text-white border-gray-700 shadow-gray-500/50`;
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

    const handleCloseClick = () => {
        console.log(`🔘 Toast ${type} - Fermeture manuelle demandée`);
        setIsClosing(true);
        setTimeout(() => {
            console.log(`🗑️ Toast ${type} - Fermeture manuelle effectuée`);
            onClose();
        }, 300);
    };

    console.log(`🎨 Rendu Toast ${type} (index ${index}): "${message}"`);

    return (
        <div
            className={getToastStyles()}
            style={{
                animationDelay: `${index * 100}ms`, // Décalage pour l'animation en cascade
                zIndex: 9999 + index, // Z-index progressif pour éviter les superpositions
                position: 'relative'
            }}
        >
            {/* Barre de progression */}
            {duration > 0 && (
                <div
                    className="absolute bottom-0 left-0 h-1 bg-white bg-opacity-30 transition-all duration-100"
                    style={{ width: `${progressPercentage}%` }}
                ></div>
            )}

            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                    <span className="text-xl flex-shrink-0 mt-0.5 drop-shadow-sm">{getIcon()}</span>
                    <div className="flex-1">
                        <p className="font-medium text-sm leading-relaxed drop-shadow-sm">{message}</p>
                    </div>
                </div>

                <button
                    onClick={handleCloseClick}
                    className="ml-3 text-white hover:text-gray-200 transition-colors flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 drop-shadow-sm"
                    title="Fermer"
                >
                    <span className="text-sm font-bold">✕</span>
                </button>
            </div>

            {/* Debug indicator en développement */}
            {process.env.NODE_ENV === 'development' && (
                <div className="absolute top-1 right-8 text-xs opacity-50 bg-black bg-opacity-25 px-1 rounded">
                    #{index + 1} | {Math.round(timeLeft / 1000)}s
                </div>
            )}
        </div>
    );
};