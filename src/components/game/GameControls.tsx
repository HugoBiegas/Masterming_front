import React from 'react';

interface GameControlsProps {
    onSubmit: () => void;
    onReset: () => void;
    canSubmit: boolean;
    remainingAttempts?: number;
    currentScore: number;
}

export const GameControls: React.FC<GameControlsProps> = ({
                                                              onSubmit,
                                                              onReset,
                                                              canSubmit,
                                                              remainingAttempts,
                                                              currentScore
                                                          }) => {
    return (
        <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-600">
                    {remainingAttempts !== undefined && (
                        <span>Tentatives restantes: {remainingAttempts}</span>
                    )}
                </div>
                <div className="text-sm text-gray-600">
                    Score: {currentScore}
                </div>
            </div>

            <div className="flex space-x-2">
                <button
                    onClick={onSubmit}
                    disabled={!canSubmit}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Valider la tentative
                </button>

                <button
                    onClick={onReset}
                    className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
                >
                    Réinitialiser
                </button>
            </div>
        </div>
    );
};
