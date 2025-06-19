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
        <>
            {/* 💀 NOUVEAU: Styles CSS pour les animations de défaite */}
            <style>{`
                @keyframes skullLaugh {
                    0% { transform: scale(1) rotate(0deg); }
                    10% { transform: scale(1.2) rotate(-8deg); }
                    20% { transform: scale(0.9) rotate(5deg); }
                    30% { transform: scale(1.3) rotate(-10deg); }
                    40% { transform: scale(0.8) rotate(8deg); }
                    50% { transform: scale(1.4) rotate(0deg); }
                    60% { transform: scale(0.9) rotate(-5deg); }
                    70% { transform: scale(1.2) rotate(7deg); }
                    80% { transform: scale(1.1) rotate(-3deg); }
                    90% { transform: scale(1.15) rotate(2deg); }
                    100% { transform: scale(1) rotate(0deg); }
                }
                
                @keyframes skullBounce {
                    0%, 100% { transform: translateY(0px); }
                    25% { transform: translateY(-15px); }
                    50% { transform: translateY(-25px); }
                    75% { transform: translateY(-10px); }
                }
                
                @keyframes deathSymbolFloat {
                    0% { 
                        transform: translateY(100px) rotate(0deg); 
                        opacity: 0; 
                    }
                    20% { 
                        opacity: 1; 
                    }
                    80% { 
                        opacity: 1; 
                    }
                    100% { 
                        transform: translateY(-100px) rotate(360deg); 
                        opacity: 0; 
                    }
                }
                
                @keyframes deathSymbolFade {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.8; }
                }
                
                @keyframes graveyardShake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-2px); }
                    75% { transform: translateX(2px); }
                }
                
                @keyframes victoryColorBounce {
                    0%, 100% { transform: translateY(0) scale(1) rotate(0deg); }
                    25% { transform: translateY(-8px) scale(1.1) rotate(-10deg); }
                    50% { transform: translateY(-15px) scale(1.2) rotate(0deg); }
                    75% { transform: translateY(-8px) scale(1.1) rotate(10deg); }
                }
                
                @keyframes victoryColorFloat {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-12px); }
                }
                
                @keyframes victoryColorGlow {
                    0%, 100% { box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6), inset 0 -2px 4px rgba(0,0,0,0.2); }
                    50% { box-shadow: 0 8px 25px rgba(59, 130, 246, 0.9), inset 0 -2px 4px rgba(0,0,0,0.2), 0 0 20px rgba(255, 255, 255, 0.5); }
                }
                
                .skull-laugh {
                    animation: skullLaugh 2s ease-in-out infinite, skullBounce 1.5s ease-in-out infinite;
                }
                
                .death-symbol-float {
                    animation: deathSymbolFloat 4s ease-in-out infinite;
                }
                
                .death-symbol-fade {
                    animation: deathSymbolFade 2s ease-in-out infinite;
                }
                
                .graveyard-shake {
                    animation: graveyardShake 0.5s ease-in-out infinite;
                }
                
                .victory-color-bounce {
                    animation: victoryColorBounce 2s ease-in-out infinite;
                }
                
                .victory-color-float {
                    animation: victoryColorFloat 3s ease-in-out infinite;
                }
                
                .victory-color-glow {
                    animation: victoryColorGlow 2s ease-in-out infinite;
                }
            `}</style>

            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-4 relative overflow-hidden">
                    {/* Animation et icône */}
                    <div className="mb-6 relative">
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
                            <div className="relative">
                                {/* 💀 NOUVEAU: Tête de mort qui rigole */}
                                <div className="text-8xl mb-4 skull-laugh">
                                    💀
                                </div>

                                {/* 💀 NOUVEAU: Arrière-plan avec symboles de mort animés */}
                                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                    {/* Symboles qui flottent */}
                                    {[...Array(12)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="absolute death-symbol-float"
                                            style={{
                                                left: `${10 + i * 8}%`,
                                                animationDelay: `${i * 0.3}s`,
                                                animationDuration: `${4 + (i % 3)}s`
                                            }}
                                        >
                                            {i % 6 === 0 ? '⚰️' :
                                                i % 6 === 1 ? '👻' :
                                                    i % 6 === 2 ? '🦇' :
                                                        i % 6 === 3 ? '🕷️' :
                                                            i % 6 === 4 ? '🔥' : '💀'}
                                        </div>
                                    ))}

                                    {/* Symboles qui clignotent en arrière-plan */}
                                    {[...Array(6)].map((_, i) => (
                                        <div
                                            key={`fade-${i}`}
                                            className="absolute death-symbol-fade text-gray-400 text-2xl"
                                            style={{
                                                left: `${15 + i * 15}%`,
                                                top: `${20 + (i % 2) * 40}%`,
                                                animationDelay: `${i * 0.5}s`
                                            }}
                                        >
                                            {i % 3 === 0 ? '💀' : i % 3 === 1 ? '⚱️' : '🪦'}
                                        </div>
                                    ))}

                                    {/* Effet de cimetière qui tremble */}
                                    <div className="absolute bottom-0 left-0 right-0 graveyard-shake">
                                        <div className="text-6xl opacity-20 flex justify-center space-x-4">
                                            🪦🪦🪦
                                        </div>
                                    </div>
                                </div>
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
                            <span className="bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
                                💀 DÉFAITE ! 💀
                            </span>
                        )}
                    </h2>

                    {/* Message */}
                    <p className="text-lg text-gray-600 mb-6">
                        {isWinner
                            ? `Félicitations ! Vous avez trouvé la solution !`
                            : `Dommage ! La tête de mort rigole de votre défaite ! 😈`
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

                    {/* 💀 NOUVEAU: Statistiques de défaite avec thème sombre */}
                    {!isWinner && (
                        <div className="bg-gradient-to-r from-gray-800 to-red-900 border border-red-400 rounded-xl p-6 mb-6 text-white">
                            <h3 className="text-xl font-bold text-red-200 mb-4">⚰️ Statistiques de la défaite</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-black bg-opacity-30 rounded-lg border border-red-600">
                                    <div className="text-3xl font-bold text-red-400">{playerScore}</div>
                                    <div className="text-sm text-red-200 font-medium">Score final</div>
                                </div>
                                <div className="text-center p-4 bg-black bg-opacity-30 rounded-lg border border-red-600">
                                    <div className="text-3xl font-bold text-orange-400">{playerAttempts}</div>
                                    <div className="text-sm text-red-200 font-medium">Tentatives</div>
                                </div>
                                <div className="text-center p-4 bg-black bg-opacity-30 rounded-lg border border-red-600">
                                    <div className="text-3xl font-bold text-purple-400">{maxAttempts}</div>
                                    <div className="text-sm text-red-200 font-medium">Limite</div>
                                </div>
                            </div>

                            {/* Message de consolation sarcastique */}
                            <div className="mt-4 text-center">
                                <p className="text-red-200 font-medium">
                                    💀 {playerAttempts === maxAttempts ? "Vous avez tout donné... mais ce n'était pas assez ! 😈" :
                                    playerAttempts >= maxAttempts * 0.8 ? "Si proche du but... mais la mort vous a rattrapé ! ⚰️" :
                                        "La tête de mort rigole... essayez encore ! 👻"}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Solution révélée */}
                    <div className={`border-2 rounded-xl p-6 mb-6 ${
                        isWinner
                            ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50'
                            : 'border-red-400 bg-gradient-to-r from-red-50 to-orange-50'
                    }`}>
                        <h3 className={`text-xl font-bold mb-4 ${
                            isWinner ? 'text-green-700' : 'text-red-700'
                        }`}>
                            🎯 Solution correcte {!isWinner && '💀'}
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

                                        {/* Color ball avec animations différentes selon victoire/défaite */}
                                        <div
                                            className={`w-12 h-12 rounded-full border-4 border-white shadow-lg relative mx-auto ${
                                                isWinner
                                                    ? `victory-color-bounce victory-color-glow`
                                                    : 'animate-bounce'
                                            }`}
                                            style={{
                                                backgroundColor: COLOR_PALETTE[color - 1],
                                                boxShadow: isWinner
                                                    ? `0 4px 12px ${COLOR_PALETTE[color - 1]}60, inset 0 -2px 4px rgba(0,0,0,0.2)`
                                                    : `0 4px 12px ${COLOR_PALETTE[color - 1]}60, inset 0 -2px 4px rgba(0,0,0,0.2)`,
                                                animationDelay: `${index * 0.2}s`
                                            }}
                                        >
                                            {/* Couleur numéro */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-white font-bold text-sm drop-shadow-sm">
                                                    {color}
                                                </span>
                                            </div>

                                            {/* Effet de brillance - Plus prononcé pour la victoire */}
                                            <div className={`absolute top-1 left-1 w-2 h-2 bg-white rounded-full ${
                                                isWinner ? 'opacity-80 animate-pulse' : 'opacity-60'
                                            }`}></div>

                                            {/* 🌟 NOUVEAU: Effet supplémentaire pour la victoire */}
                                            {isWinner && (
                                                <div
                                                    className="absolute -top-2 -right-2 text-yellow-400 animate-spin"
                                                    style={{ animationDuration: '3s', animationDelay: `${index * 0.1}s` }}
                                                >
                                                    ✨
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Note explicative */}
                            <div className="text-center mt-4">
                                <p className="text-xs text-gray-500">
                                    La combinaison correcte était : {solution.join(' - ')}
                                    {!isWinner && ' 💀 Elle vous a échappé !'}
                                    {isWinner && ' 🎉 Vous l\'avez trouvée !'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                        <button
                            onClick={onNewGame}
                            className={`flex-1 py-3 px-6 rounded-lg font-medium transform hover:scale-105 shadow-lg transition-all ${
                                isWinner
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                                    : 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700'
                            }`}
                        >
                            {isWinner ? '🎮 Nouvelle partie' : '💀 Revanche !'}
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
        </>
    );
};