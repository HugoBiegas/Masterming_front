import React from 'react';

interface GameControlsProps {
    onSubmit: () => void;
    onReset: () => void;
    canSubmit: boolean;
    gameStatus?: string;
    remainingAttempts?: number;
    currentScore: number;
}

export const GameControls: React.FC<GameControlsProps> = ({
                                                              onSubmit,
                                                              onReset,
                                                              canSubmit,
                                                              gameStatus,
                                                              remainingAttempts,
                                                              currentScore
                                                          }) => {
    return (
        <div className="bg-white rounded-lg shadow p-4">
            {/* Informations de statut */}
            <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-600">
                    {remainingAttempts !== undefined && (
                        <span className={`font-medium ${
                            remainingAttempts <= 3 ? 'text-red-600' :
                                remainingAttempts <= 5 ? 'text-orange-600' : 'text-blue-600'
                        }`}>
                            Tentatives restantes : {remainingAttempts}
                        </span>
                    )}
                </div>
                <div className="text-sm text-gray-600">
                    <span className="font-medium text-green-600">Score : {currentScore}</span>
                </div>
            </div>

            {/* Boutons d'action - UNIQUEMENT si le jeu est actif */}
            {gameStatus === 'active' && (
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Bouton Valider */}
                    <button
                        onClick={onSubmit}
                        disabled={!canSubmit}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all transform ${
                            canSubmit
                                ? 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 shadow-lg'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        title={canSubmit ? 'Valider votre combinaison' : 'Complétez toutes les positions'}
                    >
                        {canSubmit ? '✓ Valider la tentative' : '⚠️ Complétez toutes les positions'}
                    </button>

                    {/* Bouton Réinitialiser */}
                    <button
                        onClick={onReset}
                        className="sm:w-auto px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                        title="Effacer la combinaison actuelle"
                    >
                        🔄 Réinitialiser
                    </button>
                </div>
            )}

            {/* Message si le jeu n'est pas actif */}
            {gameStatus === 'waiting' && (
                <div className="text-center py-4">
                    <div className="text-gray-500 text-sm">
                        <span className="text-2xl mb-2 block">⏳</span>
                        En attente du démarrage de la partie...
                    </div>
                </div>
            )}

            {gameStatus === 'finished' && (
                <div className="text-center py-4">
                    <div className="text-gray-600 text-sm">
                        <span className="text-2xl mb-2 block">🏁</span>
                        Partie terminée
                    </div>
                </div>
            )}

            {/* Indicateurs visuels supplémentaires */}
            {gameStatus === 'active' && remainingAttempts !== undefined && remainingAttempts <= 5 && (
                <div className="mt-3 p-2 rounded-lg bg-yellow-50 border border-yellow-200">
                    <div className="flex items-center gap-2">
                        <span className="text-yellow-600">⚡</span>
                        <span className="text-xs text-yellow-700 font-medium">
                            {remainingAttempts <= 1
                                ? 'Dernière chance ! Réfléchissez bien.'
                                : `Plus que ${remainingAttempts} tentatives. Concentrez-vous !`
                            }
                        </span>
                    </div>
                </div>
            )}

            {/* Conseils pour l'utilisateur */}
            {gameStatus === 'active' && !canSubmit && (
                <div className="mt-3 p-2 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-2">
                        <span className="text-blue-600">💡</span>
                        <span className="text-xs text-blue-700">
                            Astuce : Sélectionnez une couleur puis cliquez sur une position pour la placer.
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};