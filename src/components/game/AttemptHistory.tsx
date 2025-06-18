import React, { useState } from 'react';
import { Attempt } from '@/types/game';
import { COLOR_PALETTE } from '@/utils/constants';

interface AttemptHistoryProps {
    attempts: Attempt[];
    maxAttempts?: number;
    combinationLength?: number; // Ajout pour connaître la longueur de la combinaison
}

export const AttemptHistory: React.FC<AttemptHistoryProps> = ({
                                                                  attempts,
                                                                  maxAttempts,
                                                                  combinationLength = 4 // Valeur par défaut
                                                              }) => {

    const [isExpanded, setIsExpanded] = useState(false);
    const maxIndicators = Math.min(6, combinationLength); // Maximum 6 indicateurs par ligne

    // Fonction pour générer les indicateurs "O" bien placés (verts) - max 6
    const generateCorrectPositionIndicators = (correctPositions: number) => {
        const indicators = [];
        const displayCount = Math.min(correctPositions, maxIndicators);

        // Ajouter les "●" pour les bonnes positions (en vert)
        for (let i = 0; i < displayCount; i++) {
            indicators.push(
                <span key={`pos-${i}`} className="text-green-600 font-bold text-lg" title="Bonne couleur, bonne position">
                    ●
                </span>
            );
        }

        // Compléter avec des "○" vides (en gris) jusqu'à maxIndicators
        for (let i = displayCount; i < maxIndicators; i++) {
            indicators.push(
                <span key={`pos-empty-${i}`} className="text-gray-300 font-bold text-lg" title="Pas bien placé">
                    ○
                </span>
            );
        }

        return indicators;
    };

    // Fonction pour générer les indicateurs "O" mal placés (oranges) - max 6
    const generateCorrectColorIndicators = (correctColors: number) => {
        const indicators = [];
        const displayCount = Math.min(correctColors, maxIndicators);

        // Ajouter les "●" pour les bonnes couleurs mal placées (en orange)
        for (let i = 0; i < displayCount; i++) {
            indicators.push(
                <span key={`col-${i}`} className="text-orange-500 font-bold text-lg" title="Bonne couleur, mauvaise position">
                    ●
                </span>
            );
        }

        // Compléter avec des "○" vides (en gris) jusqu'à maxIndicators
        for (let i = displayCount; i < maxIndicators; i++) {
            indicators.push(
                <span key={`col-empty-${i}`} className="text-gray-300 font-bold text-lg" title="Pas présent ou déjà compté">
                    ○
                </span>
            );
        }

        return indicators;
    };

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <>
            {/* Bouton pour ouvrir l'historique - fixé à droite */}
            <button
                onClick={toggleExpanded}
                className={`fixed top-1/2 right-0 transform -translate-y-1/2 z-50 bg-amber-500 hover:bg-amber-600 text-white p-3 transition-all duration-300 ${
                    isExpanded ? 'rounded-l-lg opacity-0 pointer-events-none' : 'rounded-l-lg shadow-lg hover:shadow-xl'
                }`}
                title="Ouvrir l'historique"
            >
                <div className="flex flex-col items-center space-y-1">
                    <span className="text-sm font-bold">📊</span>
                    <span className="text-xs font-medium writing-mode-vertical transform rotate-180">
                        Historique
                    </span>
                    <span className="text-xs">
                        {attempts.length}{maxAttempts ? `/${maxAttempts}` : ''}
                    </span>
                </div>
            </button>

            {/* Panel d'historique déroulant depuis la droite */}
            <div
                className={`fixed top-0 right-0 h-full w-96 bg-gradient-to-br from-amber-50 to-amber-100 border-l-4 border-amber-300 shadow-2xl z-40 transform transition-transform duration-300 ${
                    isExpanded ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="h-full flex flex-col bg-white rounded-l-lg shadow-inner">
                    {/* Header avec bouton fermer */}
                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 rounded-tl-lg">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold">📊 Historique des tentatives</h3>
                            <button
                                onClick={toggleExpanded}
                                className="text-white hover:text-amber-200 text-xl font-bold hover:scale-110 transition-all p-1 rounded-full hover:bg-amber-700"
                                title="Fermer l'historique"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="text-amber-100 text-sm mt-1">
                            {attempts.length}{maxAttempts ? ` / ${maxAttempts}` : ''} tentatives
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
                                        <div className="flex items-center space-x-3 mb-3">
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
                                                        className="w-7 h-7 rounded-full border-2 border-gray-600 shadow-sm relative"
                                                        style={{
                                                            backgroundColor: COLOR_PALETTE[color - 1],
                                                            boxShadow: `0 1px 3px ${COLOR_PALETTE[color - 1]}40, inset 0 -1px 2px rgba(0,0,0,0.2)`
                                                        }}
                                                        title={`Position ${index + 1}`}
                                                    >
                                                        {/* Glossy effect */}
                                                        <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-white rounded-full opacity-50"></div>
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

                                        {/* Ligne 2: Indicateurs côte à côte */}
                                        <div className="flex items-center justify-between space-x-4 text-xs">
                                            {/* Bien placées */}
                                            <div className="flex items-center space-x-1">
                                                <span className="font-medium text-green-700 whitespace-nowrap">
                                                    Bien placées ({attempt.correct_positions})
                                                </span>
                                                <div className="flex space-x-0.5">
                                                    {generateCorrectPositionIndicators(attempt.correct_positions)}
                                                </div>
                                            </div>

                                            {/* Mal placées */}
                                            <div className="flex items-center space-x-1">
                                                <span className="font-medium text-orange-600 whitespace-nowrap">
                                                    Mal placées ({attempt.correct_colors})
                                                </span>
                                                <div className="flex space-x-0.5">
                                                    {generateCorrectColorIndicators(attempt.correct_colors)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer avec légende */}
                    <div className="border-t border-gray-200 p-3 bg-gray-50 rounded-bl-lg">
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
                            {combinationLength > 6 && (
                                <div className="text-xs text-amber-600 mt-2 italic">
                                    * Max 6 indicateurs affichés par ligne
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlay pour fermer en cliquant à côté */}
            {isExpanded && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-25 z-30"
                    onClick={toggleExpanded}
                ></div>
            )}
        </>
    );
};