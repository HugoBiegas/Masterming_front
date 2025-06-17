import React, { useState } from 'react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface StartGameButtonProps {
    onStartGame: () => Promise<void>;
    disabled?: boolean;
}

export const StartGameButton: React.FC<StartGameButtonProps> = ({
                                                                    onStartGame,
                                                                    disabled = false
                                                                }) => {
    const [isStarting, setIsStarting] = useState(false);

    const handleClick = async () => {
        if (disabled || isStarting) return;

        setIsStarting(true);
        try {
            await onStartGame();
        } catch (error) {
            console.error('Erreur lors du démarrage:', error);
        } finally {
            setIsStarting(false);
        }
    };

    return (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-40 animate-slide-in">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-full shadow-2xl border-2 border-green-400">
                <div className="flex items-center space-x-4">
                    <div className="text-3xl animate-pulse">🚀</div>
                    <div className="text-center">
                        <h3 className="text-lg font-bold">Partie prête !</h3>
                        <p className="text-sm text-green-100">Cliquez pour commencer votre défi</p>
                    </div>
                    <button
                        onClick={handleClick}
                        disabled={disabled || isStarting}
                        className="bg-white text-green-600 px-6 py-3 rounded-full font-bold hover:bg-green-50 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {isStarting ? (
                            <div className="flex items-center space-x-2">
                                <LoadingSpinner size="sm" />
                                <span>Démarrage...</span>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <span>🎮</span>
                                <span>DÉMARRER</span>
                            </div>
                        )}
                    </button>
                </div>
            </div>

            {/* Pulsation d'attention */}
            <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20 pointer-events-none"></div>
        </div>
    );
};