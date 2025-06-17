import React, { useEffect, useState } from 'react';

interface EliminationNotificationProps {
    playerName: string;
    attempts: number;
    maxAttempts: number;
    show: boolean;
    onClose: () => void;
}

export const EliminationNotification: React.FC<EliminationNotificationProps> = ({
                                                                                    playerName,
                                                                                    attempts,
                                                                                    maxAttempts,
                                                                                    show,
                                                                                    onClose
                                                                                }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (show) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(onClose, 300);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    if (!show) return null;

    return (
        <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
            visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}>
            <div className="bg-red-500 text-white rounded-lg shadow-lg border-l-4 border-red-700 max-w-sm">
                <div className="p-4">
                    <div className="flex items-start space-x-3">
                        <div className="text-2xl animate-bounce">💀</div>
                        <div className="flex-1">
                            <div className="text-sm font-bold">Joueur éliminé !</div>
                            <div className="text-xs mt-1 opacity-90">
                                <span className="font-medium">{playerName}</span> a épuisé ses tentatives
                            </div>
                            <div className="text-xs mt-1 opacity-75">
                                {attempts}/{maxAttempts} tentatives utilisées
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setVisible(false);
                                setTimeout(onClose, 300);
                            }}
                            className="text-white hover:text-red-200 transition-colors duration-200"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
