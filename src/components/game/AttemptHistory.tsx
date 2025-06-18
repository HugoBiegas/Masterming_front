import React from 'react';
import { Attempt } from '@/types/game';
import { COLOR_PALETTE } from '@/utils/constants';
import { QuantumIndicators } from './QuantumIndicators';

interface AttemptHistoryProps {
    attempts: Attempt[];
    maxAttempts?: number;
    combinationLength?: number;
    isQuantumMode?: boolean;
    gameType?: string;
}

export const AttemptHistory: React.FC<AttemptHistoryProps> = ({
                                                                  attempts,
                                                                  maxAttempts,
                                                                  combinationLength = 4,
                                                                  isQuantumMode = false,
                                                                  gameType
                                                              }) => {

    // Simple: a-t-on des données quantiques ?
    const hasQuantumData = (attempt: Attempt): boolean => {
        // 🔧 CORRECTION: Le backend renvoie "quantum_data" et non "quantum_probabilities"
        const quantumData = (attempt as any).quantum_data;

        const hasQuantum = (quantumData?.quantum_calculated === true) &&
            !!quantumData?.position_probabilities?.length;

        return hasQuantum;
    };

    // Fonction pour les indicateurs classiques
    const generateClassicIndicatorGrid = (count: number, color: string, title: string) => {
        if (count === 0) {
            return (
                <div className="flex justify-center space-x-1">
                    <span className="text-gray-300 font-bold text-lg" title="Aucune correspondance">○</span>
                </div>
            );
        }

        const indicators = [];
        const maxPerRow = 4;
        const totalRows = Math.ceil(count / maxPerRow);

        for (let row = 0; row < totalRows; row++) {
            const indicatorsInThisRow = [];
            const startIndex = row * maxPerRow;
            const endIndex = Math.min(startIndex + maxPerRow, count);

            for (let i = startIndex; i < endIndex; i++) {
                indicatorsInThisRow.push(
                    <span key={`filled-${i}`} className={`${color} font-bold text-lg`} title={title}>
                        ●
                    </span>
                );
            }

            indicators.push(
                <div key={`row-${row}`} className="flex justify-center space-x-1">
                    {indicatorsInThisRow}
                </div>
            );
        }

        return indicators;
    };

    // Compter les tentatives quantiques
    const quantumAttemptsCount = attempts.filter(hasQuantumData).length;

    return (
        <div className="w-full h-full bg-gradient-to-br from-amber-50 to-amber-100 border-l-4 border-amber-300 shadow-lg">
            <div className="h-full flex flex-col bg-white rounded-l-lg shadow-inner">
                {/* Header */}
                <div className={`text-white p-4 rounded-tl-lg flex-shrink-0 ${
                    isQuantumMode || quantumAttemptsCount > 0
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600'
                }`}>
                    <div className="text-center">
                        <h3 className="text-lg font-bold">
                            {isQuantumMode || quantumAttemptsCount > 0 ? '🔮 Historique Quantique' : '📊 Historique des tentatives'}
                        </h3>
                        <div className={`text-sm mt-1 ${
                            isQuantumMode || quantumAttemptsCount > 0 ? 'text-purple-100' : 'text-amber-100'
                        }`}>
                            {attempts.length}{maxAttempts ? ` / ${maxAttempts}` : ''} tentatives
                            {quantumAttemptsCount > 0 && (
                                <span className="ml-2">• {quantumAttemptsCount} quantiques</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Contenu scrollable */}
                <div className="flex-1 overflow-y-auto p-4 history-scroll-container">
                    {attempts.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-gray-400 text-4xl mb-2">
                                {isQuantumMode || quantumAttemptsCount > 0 ? '🔮' : '🎯'}
                            </div>
                            <p className="text-gray-500">Aucune tentative pour le moment</p>
                            <p className="text-xs text-gray-400 mt-1">
                                Faites votre première tentative !
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {[...attempts]
                                .sort((a, b) => a.attempt_number - b.attempt_number)
                                .map((attempt) => {
                                    const shouldShowQuantum = hasQuantumData(attempt);

                                    return (
                                        <div
                                            key={attempt.id}
                                            className={`
                                            p-4 rounded-lg border-2 transition-all relative
                                            ${attempt.is_correct
                                                ? 'bg-green-50 border-green-300 shadow-green-100'
                                                : shouldShowQuantum
                                                    ? 'bg-purple-50 border-purple-300 shadow-purple-100'
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
                                                    : shouldShowQuantum
                                                        ? 'bg-purple-500 text-white'
                                                        : 'bg-gray-400 text-white'
                                                }
                                            `}>
                                                    {attempt.attempt_number}
                                                </div>

                                                {/* Combinaison */}
                                                <div className="flex space-x-1 flex-grow justify-center">
                                                    {attempt.combination.map((color, colorIndex) => (
                                                        <div
                                                            key={colorIndex}
                                                            className="w-6 h-6 rounded-full border-2 border-gray-600 shadow-sm relative"
                                                            style={{
                                                                backgroundColor: COLOR_PALETTE[color - 1],
                                                                boxShadow: `0 1px 3px ${COLOR_PALETTE[color - 1]}40, inset 0 -1px 2px rgba(0,0,0,0.2)`
                                                            }}
                                                            title={`Position ${colorIndex + 1}`}
                                                        >
                                                            <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full opacity-50"></div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Badge de statut */}
                                                <div className="flex-shrink-0">
                                                    {attempt.is_correct ? (
                                                        <span className="bg-green-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold">
                                                        🏆
                                                    </span>
                                                    ) : shouldShowQuantum ? (
                                                        <span className="bg-purple-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold">
                                                        🔮
                                                    </span>
                                                    ) : null}
                                                </div>
                                            </div>

                                            {/* Section des indicateurs */}
                                            {shouldShowQuantum ? (
                                                // Affichage quantique avec vraies données
                                                <div className="mt-4">
                                                    <QuantumIndicators
                                                        positionProbabilities={(attempt as any).quantum_data.position_probabilities}
                                                        combinationLength={combinationLength}
                                                        showDetailedTooltips={true}
                                                        compactMode={false}
                                                    />
                                                </div>
                                            ) : (
                                                // Affichage classique
                                                <div className="grid grid-cols-2 gap-3">
                                                    {/* Bien placées */}
                                                    <div className="text-center">
                                                        <div className="font-medium text-green-700 text-xs mb-2">
                                                            Bien placées ({(attempt as any).correct_positions || 0})
                                                        </div>
                                                        <div className="space-y-1">
                                                            {generateClassicIndicatorGrid(
                                                                (attempt as any).correct_positions || 0,
                                                                "text-green-600",
                                                                "Bonne couleur, bonne position"
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Mal placées */}
                                                    <div className="text-center">
                                                        <div className="font-medium text-orange-600 text-xs mb-2">
                                                            Mal placées ({(attempt as any).correct_colors || 0})
                                                        </div>
                                                        <div className="space-y-1">
                                                            {generateClassicIndicatorGrid(
                                                                (attempt as any).correct_colors || 0,
                                                                "text-orange-500",
                                                                "Bonne couleur, mauvaise position"
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>

                {/* Footer avec légende */}
                <div className="border-t border-gray-200 p-3 bg-gray-50 rounded-bl-lg flex-shrink-0">
                    <div className="text-xs text-gray-600 space-y-1">
                        <div className="font-medium text-gray-700 mb-2">
                            Légende :
                        </div>

                        {quantumAttemptsCount > 0 ? (
                            <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                    <span>🎯</span>
                                    <span>Position exacte (haute probabilité)</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span>🔶</span>
                                    <span>Couleur présente (probabilité variable)</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span>❌</span>
                                    <span>Aucune correspondance détectée</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-green-600 font-bold">●</span>
                                    <span>Bonne couleur, bonne position (classique)</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-orange-500 font-bold">●</span>
                                    <span>Bonne couleur, mauvaise position (classique)</span>
                                </div>
                            </div>
                        ) : (
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
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};