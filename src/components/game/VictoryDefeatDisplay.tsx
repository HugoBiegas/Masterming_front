// src/components/game/VictoryDefeatDisplay.tsx
import React from 'react';
import { COLOR_PALETTE } from '@/utils/constants';

interface VictoryDefeatDisplayProps {
    isWinner: boolean;
    playerScore: number;
    playerAttempts: number;
    maxAttempts: number;
    solution: number[];
    onNewGame: () => void;
    onBackToMenu: () => void;
}

export const VictoryDefeatDisplay: React.FC<VictoryDefeatDisplayProps> = ({
                                                                              isWinner,
                                                                              playerScore,
                                                                              playerAttempts,
                                                                              maxAttempts,
                                                                              solution,
                                                                              onNewGame,
                                                                              onBackToMenu
                                                                          }) => {
    // Calculer la précision
    const precision = Math.round((playerAttempts / maxAttempts) * 100);
    const efficiency = Math.round(((maxAttempts - playerAttempts + 1) / maxAttempts) * 100);

    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-4">
                {/* Animation et icône */}
                <div className="mb-6">
                    {isWinner ? (
                        <div className="relative">
                            {/* Coupe avec animation */}
                            <div className="text-8xl mb-4 animate-bounce">
                                🏆
                            </div>
                            {/* Confettis animés */}
                            <div className="absolute inset-0 pointer-events-none">
                                {[...Array(8)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute animate-ping"
                                        style={{
                                            left: `${20 + i * 10}%`,
                                            top: `${10 + (i % 3) * 20}%`,
                                            animationDelay: `${i * 0.2}s`,
                                            animationDuration: '2s'
                                        }}
                                    >
                                        {i % 4 === 0 ? '🎉' : i % 4 === 1 ? '✨' : i % 4 === 2 ? '🌟' : '💫'}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-8xl mb-4 animate-pulse">
                            💀
                        </div>
                    )}
                </div>

                {/* Titre */}
                <h2 className="text-3xl font-bold mb-4">
                    {isWinner ? (
                        <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                            🎉 VICTOIRE ! 🎉
                        </span>
                    ) : (
                        <span className="text-red-600">
                            💔 Défaite
                        </span>
                    )}
                </h2>

                {/* Message */}
                <p className="text-lg text-gray-600 mb-6">
                    {isWinner
                        ? `Félicitations ! Vous avez trouvé la solution !`
                        : `Dommage ! Vous avez épuisé vos tentatives.`
                    }
                </p>

                {/* Statistiques de victoire */}
                {isWinner && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6">
                        <h3 className="text-xl font-bold text-green-700 mb-4">📊 Vos statistiques</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-white rounded-lg border">
                                <div className="text-3xl font-bold text-blue-600">{playerScore}</div>
                                <div className="text-sm text-gray-600 font-medium">Score</div>
                            </div>
                            <div className="text-center p-4 bg-white rounded-lg border">
                                <div className="text-3xl font-bold text-green-600">{playerAttempts}</div>
                                <div className="text-sm text-gray-600 font-medium">Tentatives</div>
                            </div>
                            <div className="text-center p-4 bg-white rounded-lg border">
                                <div className="text-3xl font-bold text-purple-600">{efficiency}%</div>
                                <div className="text-sm text-gray-600 font-medium">Efficacité</div>
                            </div>
                        </div>

                        {/* Message de performance */}
                        <div className="mt-4 text-center">
                            <p className="text-green-700 font-medium">
                                {efficiency >= 90 ? "🌟 Performance exceptionnelle !" :
                                    efficiency >= 75 ? "⭐ Très belle performance !" :
                                        efficiency >= 60 ? "👍 Bonne performance !" :
                                            "💪 Continuez à vous améliorer !"}
                            </p>
                        </div>
                    </div>
                )}

                {/* Solution révélée */}
                <div className={`border-2 rounded-xl p-6 mb-6 ${
                    isWinner
                        ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50'
                        : 'border-orange-400 bg-gradient-to-r from-orange-50 to-red-50'
                }`}>
                    <h3 className={`text-xl font-bold mb-4 ${
                        isWinner ? 'text-green-700' : 'text-orange-700'
                    }`}>
                        🎯 Solution correcte
                    </h3>

                    {/* Solution visuelle */}
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-inner">
                        <div className="flex justify-center space-x-3">
                            {solution.map((color, index) => (
                                <div
                                    key={index}
                                    className="text-center"
                                >
                                    {/* Position indicator */}
                                    <div className="text-xs text-gray-500 mb-1 font-medium">
                                        {index + 1}
                                    </div>

                                    {/* Color ball avec animation pour la victoire */}
                                    <div
                                        className={`w-12 h-12 rounded-full border-4 border-white shadow-lg relative mx-auto ${
                                            isWinner ? 'animate-pulse' : ''
                                        }`}
                                        style={{
                                            backgroundColor: COLOR_PALETTE[color - 1],
                                            boxShadow: `0 4px 12px ${COLOR_PALETTE[color - 1]}60, inset 0 -2px 4px rgba(0,0,0,0.2)`
                                        }}
                                    >
                                        {/* Couleur numéro */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-white font-bold text-sm drop-shadow-sm">
                                                {color}
                                            </span>
                                        </div>

                                        {/* Effet de brillance */}
                                        <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full opacity-60"></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Note explicative */}
                        <div className="text-center mt-4">
                            <p className="text-xs text-gray-500">
                                La combinaison correcte était : {solution.join(' - ')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                    <button
                        onClick={onNewGame}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium transform hover:scale-105 shadow-lg"
                    >
                        🎮 Nouvelle partie
                    </button>
                    <button
                        onClick={onBackToMenu}
                        className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-all font-medium transform hover:scale-105"
                    >
                        🏠 Menu principal
                    </button>
                </div>
            </div>
        </div>
    );
};