import React from 'react';
import { Attempt } from '@/types/game';
import { COLOR_PALETTE } from '@/utils/constants';

interface AttemptHistoryProps {
    attempts: Attempt[];
    maxAttempts?: number;
    combinationLength?: number;
}

export const AttemptHistory: React.FC<AttemptHistoryProps> = ({
                                                                  attempts,
                                                                  maxAttempts,
                                                                  combinationLength = 4
                                                              }) => {

    // Fonction pour générer les indicateurs en grille (max 4 par ligne)
    const generateIndicatorGrid = (count: number, color: string, title: string) => {
        const indicators = [];
        const maxPerRow = 4;
        const totalRows = Math.ceil(count / maxPerRow);

        for (let row = 0; row < totalRows; row++) {
            const indicatorsInThisRow = [];
            const startIndex = row * maxPerRow;
            const endIndex = Math.min(startIndex + maxPerRow, count);

            // Ajouter les indicateurs pleins pour cette ligne
            for (let i = startIndex; i < endIndex; i++) {
                indicatorsInThisRow.push(
                    <span key={`filled-${i}`} className={`${color} font-bold text-lg`} title={title}>
                        ●
                    </span>
                );
            }

            // Compléter la ligne avec des indicateurs vides si nécessaire (seulement pour la dernière ligne)
            if (row === totalRows - 1) {
                const remaining = maxPerRow - (endIndex - startIndex);
                for (let i = 0; i < remaining; i++) {
                    indicatorsInThisRow.push(
                        <span key={`empty-${row}-${i}`} className="text-gray-300 font-bold text-lg" title="Vide">
                            ○
                        </span>
                    );
                }
            }

            indicators.push(
                <div key={`row-${row}`} className="flex justify-center space-x-1">
                    {indicatorsInThisRow}
                </div>
            );
        }

        return indicators;
    };

    return (
        <div className="w-full h-full bg-gradient-to-br from-amber-50 to-amber-100 border-l-4 border-amber-300 shadow-lg">
            <div className="h-full flex flex-col bg-white rounded-l-lg shadow-inner">
                {/* Header fixe */}
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 rounded-tl-lg flex-shrink-0">
                    <div className="text-center">
                        <h3 className="text-lg font-bold">📊 Historique des tentatives</h3>
                        <div className="text-amber-100 text-sm mt-1">
                            {attempts.length}{maxAttempts ? ` / ${maxAttempts}` : ''} tentatives
                        </div>
                    </div>
                </div>

                {/* Contenu scrollable */}
                <div className="flex-1 overflow-y-auto p-4">
                    {attempts.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-gray-400 text-4xl mb-2">🎯</div>
                            <p className="text-gray-500">Aucune tentative pour le moment</p>
                            <p className="text-xs text-gray-400 mt-1">Faites votre première tentative !</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {attempts.map((attempt) => (
                                <div
                                    key={attempt.id}
                                    className={`
                                        p-3 rounded-lg border-2 transition-all
                                        ${attempt.is_correct
                                        ? 'bg-green-50 border-green-300 shadow-green-100'
                                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                    }
                                    `}
                                >
                                    {/* Ligne 1: Numéro de tentative + Combinaison */}
                                    <div className="flex items-center space-x-3 mb-4">
                                        {/* Numéro de tentative */}
                                        <div className={`
                                            w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                                            ${attempt.is_correct
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-400 text-white'
                                        }
                                        `}>
                                            {attempt.attempt_number}
                                        </div>

                                        {/* Combinaison */}
                                        <div className="flex space-x-1 flex-grow justify-center">
                                            {attempt.combination.map((color, index) => (
                                                <div
                                                    key={index}
                                                    className="w-6 h-6 rounded-full border-2 border-gray-600 shadow-sm relative"
                                                    style={{
                                                        backgroundColor: COLOR_PALETTE[color - 1],
                                                        boxShadow: `0 1px 3px ${COLOR_PALETTE[color - 1]}40, inset 0 -1px 2px rgba(0,0,0,0.2)`
                                                    }}
                                                    title={`Position ${index + 1}`}
                                                >
                                                    {/* Glossy effect */}
                                                    <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full opacity-50"></div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Badge victoire */}
                                        {attempt.is_correct && (
                                            <div className="flex-shrink-0">
                                                <span className="bg-green-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold">
                                                    🏆
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Section des indicateurs côte à côte */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Bien placées */}
                                        <div className="text-center">
                                            <div className="font-medium text-green-700 text-xs mb-2">
                                                Bien placées ({attempt.correct_positions})
                                            </div>
                                            <div className="space-y-1">
                                                {generateIndicatorGrid(
                                                    attempt.correct_positions,
                                                    "text-green-600",
                                                    "Bonne couleur, bonne position"
                                                )}
                                            </div>
                                        </div>

                                        {/* Mal placées */}
                                        <div className="text-center">
                                            <div className="font-medium text-orange-600 text-xs mb-2">
                                                Mal placées ({attempt.correct_colors})
                                            </div>
                                            <div className="space-y-1">
                                                {generateIndicatorGrid(
                                                    attempt.correct_colors,
                                                    "text-orange-500",
                                                    "Bonne couleur, mauvaise position"
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer avec légende - fixe */}
                <div className="border-t border-gray-200 p-3 bg-gray-50 rounded-bl-lg flex-shrink-0">
                    <div className="text-xs text-gray-600 space-y-1">
                        <div className="font-medium text-gray-700 mb-2">Légende :</div>
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                                <span className="text-green-600 font-bold">●</span>
                                <span>Bonne couleur, bonne position</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-orange-500 font-bold">●</span>
                                <span>Bonne couleur, mauvaise position</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-gray-300 font-bold">○</span>
                                <span>Aucune correspondance</span>
                            </div>
                        </div>
                        <div className="text-xs text-amber-600 mt-2 italic">
                            * Affichage en grille, max 4 indicateurs par ligne
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};