// src/components/game/SolutionDisplay.tsx
import React from 'react';
import { COLOR_PALETTE } from '@/utils/constants';

interface SolutionDisplayProps {
    solution: number[];
    isWinner: boolean;
    playerAttempts: number;
    playerScore: number;
    className?: string;
}

export const SolutionDisplay: React.FC<SolutionDisplayProps> = ({
                                                                    solution,
                                                                    isWinner,
                                                                    playerAttempts,
                                                                    playerScore,
                                                                    className = ""
                                                                }) => {
    const getTitle = () => {
        if (isWinner) {
            return "🏆 Félicitations ! Vous avez trouvé la solution !";
        } else {
            return "🎯 Voici la solution correcte :";
        }
    };

    const getMessage = () => {
        if (isWinner) {
            return `Excellent ! Résolu en ${playerAttempts} tentative${playerAttempts > 1 ? 's' : ''} avec ${playerScore} points !`;
        } else {
            return "Ne vous découragez pas, vous ferez mieux la prochaine fois !";
        }
    };

    const getBorderStyle = () => {
        if (isWinner) {
            return 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50';
        } else {
            return 'border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50';
        }
    };

    return (
        <div className={`
            border-2 rounded-xl p-6 shadow-lg mb-6 
            ${getBorderStyle()}
            ${className}
        `}>
            {/* Titre et message */}
            <div className="text-center mb-6">
                <h3 className={`text-xl font-bold mb-2 ${
                    isWinner ? 'text-green-700' : 'text-blue-700'
                }`}>
                    {getTitle()}
                </h3>
                <p className={`text-base ${
                    isWinner ? 'text-green-600' : 'text-blue-600'
                }`}>
                    {getMessage()}
                </p>
            </div>

            {/* Solution visuelle */}
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-inner">
                <div className="text-center mb-3">
                    <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                        Solution correcte
                    </span>
                </div>

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

                            {/* Color ball */}
                            <div
                                className="w-12 h-12 rounded-full border-4 border-white shadow-lg relative mx-auto"
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

            {/* Animation de confettis pour la victoire */}
            {isWinner && (
                <div className="text-center mt-4">
                    <div className="text-2xl animate-bounce">
                        🎉 ✨ 🏆 ✨ 🎉
                    </div>
                </div>
            )}
        </div>
    );
};