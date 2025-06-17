import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/common/Modal';
import { COLOR_PALETTE } from '@/utils/constants';

interface EliminationModalProps {
    isOpen: boolean;
    onClose: () => void;
    attemptsMade: number;
    maxAttempts: number;
    score: number;
    difficulty: string;
    gameMode: 'solo' | 'multiplayer';
    gameFinished?: boolean;
    otherPlayersRemaining?: number;
    solution?: number[];
}

export const EliminationModal: React.FC<EliminationModalProps> = ({
                                                                      isOpen,
                                                                      onClose,
                                                                      attemptsMade,
                                                                      maxAttempts,
                                                                      score,
                                                                      difficulty,
                                                                      gameMode,
                                                                      gameFinished = false,
                                                                      otherPlayersRemaining = 0,
                                                                      solution
                                                                  }) => {
    const navigate = useNavigate();

    const handleNewGame = () => {
        navigate('/solo');
    };

    const handleBackToMenu = () => {
        navigate('/modes');
    };

    const handleContinueWatching = () => {
        onClose();
    };

    const getEncouragementMessage = () => {
        const percentage = (attemptsMade / maxAttempts) * 100;

        if (percentage === 100) {
            return "Vous avez donné le maximum ! Chaque tentative vous rapproche de la maîtrise.";
        } else if (percentage >= 80) {
            return "Excellent effort ! Vous étiez sur la bonne voie.";
        } else if (percentage >= 60) {
            return "Belle performance ! Continuez à vous améliorer.";
        } else {
            return "Chaque partie est une leçon ! Analysez vos tentatives pour progresser.";
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {}}
            title=""
            showCloseButton={false}
        >
            <div className="text-center space-y-6">
                {/* Icône principale animée */}
                <div className="text-8xl animate-bounce">💀</div>

                {/* Titre */}
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-red-600">ÉLIMINÉ !</h2>
                    <div className="inline-block bg-red-100 border border-red-300 rounded-lg px-4 py-2">
                        <span className="text-red-700 font-medium">
                            Difficulté {difficulty} - {attemptsMade}/{maxAttempts} tentatives
                        </span>
                    </div>
                </div>

                {/* Message principal */}
                <div className="space-y-3">
                    <p className="text-lg text-gray-800">
                        {gameMode === 'solo'
                            ? `Vous avez épuisé vos ${maxAttempts} tentatives sans trouver la solution...`
                            : gameFinished
                                ? `Vous avez été éliminé ! Toutes vos ${maxAttempts} tentatives ont été utilisées.`
                                : `Vous avez été éliminé ! ${otherPlayersRemaining} joueur(s) continue(nt) la partie.`
                        }
                    </p>

                    <p className="text-base text-gray-600 italic">
                        {getEncouragementMessage()}
                    </p>
                </div>

                {/* Statistiques */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-red-700 mb-3">📊 Votre performance</h3>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{attemptsMade}</div>
                            <div className="text-gray-600">Tentatives</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{score}</div>
                            <div className="text-gray-600">Points</div>
                        </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="mt-4">
                        <div className="text-xs text-gray-600 mb-1">
                            Tentatives utilisées: {Math.round((attemptsMade / maxAttempts) * 100)}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-1000"
                                style={{ width: `${(attemptsMade / maxAttempts) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Affichage de la solution */}
                {solution && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-blue-700 mb-2">🔍 La solution était :</h4>
                        <div className="flex justify-center space-x-2">
                            {solution.map((color, index) => (
                                <div
                                    key={index}
                                    className="w-8 h-8 rounded-full border-2 border-gray-600 shadow-sm relative"
                                    style={{
                                        backgroundColor: COLOR_PALETTE[color - 1] || '#gray',
                                        boxShadow: `0 2px 4px ${COLOR_PALETTE[color - 1] || '#gray'}40, inset 0 -1px 2px rgba(0,0,0,0.2)`
                                    }}
                                    title={`Position ${index + 1}: couleur ${color}`}
                                >
                                    <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full opacity-50" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Conseils */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-purple-700 mb-2">💡 Conseils pour la prochaine fois</h4>
                    <ul className="text-xs text-purple-600 space-y-1 text-left">
                        <li>• Analysez les indices de chaque tentative</li>
                        <li>• Commencez par éliminer des couleurs</li>
                        <li>• Utilisez une stratégie systématique</li>
                        <li>• Prenez votre temps pour réfléchir</li>
                    </ul>
                </div>

                {/* Boutons d'action */}
                <div className="space-y-3 pt-4">
                    {(gameMode === 'solo' || gameFinished) ? (
                        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                            <button
                                onClick={handleNewGame}
                                className="flex-1 bg-red-600 text-white py-4 px-6 rounded-lg hover:bg-red-700 transition-all font-medium transform hover:scale-105"
                            >
                                🔄 Nouvelle partie
                            </button>
                            <button
                                onClick={handleBackToMenu}
                                className="flex-1 bg-gray-500 text-white py-4 px-6 rounded-lg hover:bg-gray-600 transition-all font-medium transform hover:scale-105"
                            >
                                🏠 Menu principal
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                            <button
                                onClick={handleContinueWatching}
                                className="flex-1 bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-all font-medium transform hover:scale-105"
                            >
                                👁️ Observer
                            </button>
                            <button
                                onClick={handleBackToMenu}
                                className="flex-1 bg-gray-500 text-white py-4 px-6 rounded-lg hover:bg-gray-600 transition-all font-medium transform hover:scale-105"
                            >
                                🚪 Quitter
                            </button>
                        </div>
                    )}

                    <p className="text-xs text-gray-500 mt-4">
                        "Dans chaque défaite se cache une future victoire" 🎯
                    </p>
                </div>
            </div>
        </Modal>
    );
};
