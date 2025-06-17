import React from 'react';

interface GameControlsProps {
    onSubmit: () => void;
    onReset: () => void;
    onLeave?: () => void; // Optionnel pour le bouton Leave
    onStart?: () => void; // AJOUTÉ : pour le bouton Start
    canSubmit: boolean;
    canStart?: boolean; // AJOUTÉ : pour activer/désactiver le bouton Start
    gameStatus?: string; // AJOUTÉ : pour connaître le statut du jeu
    remainingAttempts?: number;
    currentScore: number;
    isLeaving?: boolean; // Pour l'état de chargement du bouton Leave
    isStarting?: boolean; // AJOUTÉ : pour l'état de chargement du bouton Start
}

export const GameControls: React.FC<GameControlsProps> = ({
                                                              onSubmit,
                                                              onReset,
                                                              onLeave,
                                                              onStart,
                                                              canSubmit,
                                                              canStart = false,
                                                              gameStatus,
                                                              remainingAttempts,
                                                              currentScore,
                                                              isLeaving = false,
                                                              isStarting = false
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
                            Tentatives restantes: {remainingAttempts}
                        </span>
                    )}
                </div>
                <div className="text-sm text-gray-600">
                    <span className="font-medium text-green-600">Score: {currentScore}</span>
                </div>
            </div>

            {/* Boutons d'action principaux */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Bouton Start (si le jeu n'est pas encore démarré) */}
                {onStart && canStart && gameStatus === 'waiting' && (
                    <button
                        onClick={onStart}
                        disabled={isStarting}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all transform ${
                            isStarting
                                ? 'bg-green-400 text-white cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 text-white hover:scale-105 shadow-lg'
                        }`}
                        title="Démarrer la partie"
                    >
                        {isStarting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent inline-block mr-2"></div>
                                Démarrage...
                            </>
                        ) : (
                            '🚀 Démarrer la partie'
                        )}
                    </button>
                )}

                {/* Bouton Valider (uniquement si le jeu est actif) */}
                {gameStatus === 'active' && (
                    <button
                        onClick={onSubmit}
                        disabled={!canSubmit}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all transform ${
                            canSubmit
                                ? 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 shadow-lg'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        title={canSubmit ? 'Valider votre combinaison' : 'Complétez d\'abord votre combinaison'}
                    >
                        {canSubmit ? '✓ Valider la tentative' : '⚠️ Complétez la combinaison'}
                    </button>
                )}

                {/* Bouton Réinitialiser (uniquement si le jeu est actif) */}
                {gameStatus === 'active' && (
                    <button
                        onClick={onReset}
                        className="sm:w-auto px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                        title="Effacer la combinaison actuelle"
                    >
                        🔄 Réinitialiser
                    </button>
                )}
            </div>

            {/* Bouton Leave (optionnel) */}
            {onLeave && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                        onClick={onLeave}
                        disabled={isLeaving}
                        className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
                        title="Quitter la partie définitivement"
                    >
                        {isLeaving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                <span>Sortie en cours...</span>
                            </>
                        ) : (
                            <>
                                <span>🚪</span>
                                <span>Quitter la partie</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Indicateurs visuels supplémentaires */}
            {remainingAttempts !== undefined && remainingAttempts <= 5 && (
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
            {!canSubmit && (
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