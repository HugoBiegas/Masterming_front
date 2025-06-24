import React from 'react';
import { COLOR_PALETTE } from '@/utils/constants';

interface MultiplayerAttempt {
    id: string;
    combination: number[];
    correct_positions?: number;
    correct_colors?: number;
    attempt_number: number;
    attempt_score?: number;
    is_correct?: boolean;
    created_at: string;
    time_taken?: number;
    // Support quantique optionnel
    quantum_data?: {
        quantum_calculated: boolean;
        position_probabilities?: any[];
    };
}

interface MultiplayerAttemptHistoryProps {
    attempts: MultiplayerAttempt[];
    maxAttempts?: number;
    combinationLength?: number;
    isQuantumMode?: boolean;
    difficultyConfig?: any;
    className?: string;
}

export const MultiplayerAttemptHistory: React.FC<MultiplayerAttemptHistoryProps> = ({
                                                                                        attempts,
                                                                                        maxAttempts,
                                                                                        combinationLength = 4,
                                                                                        isQuantumMode = false,
                                                                                        difficultyConfig,
                                                                                        className = ""
                                                                                    }) => {

    // Vérifier si une tentative a des données quantiques
    const hasQuantumData = (attempt: MultiplayerAttempt): boolean => {
        const quantumData = attempt.quantum_data;
        return (quantumData?.quantum_calculated === true) &&
            !!quantumData?.position_probabilities?.length;
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
        <div className={`w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 border-l-4 border-blue-300 shadow-lg ${className}`}>
            <div className="h-full flex flex-col bg-white rounded-l-lg shadow-inner">
                {/* Header */}
                <div className={`text-white p-4 rounded-tl-lg flex-shrink-0 ${
                    isQuantumMode || quantumAttemptsCount > 0
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                }`}>
                    <div className="text-center">
                        <h3 className="text-lg font-bold">
                            {isQuantumMode || quantumAttemptsCount > 0 ? '🔮 Mes Tentatives Quantiques' : '🎯 Mes Tentatives'}
                        </h3>
                        <div className={`text-sm mt-1 ${
                            isQuantumMode || quantumAttemptsCount > 0 ? 'text-purple-100' : 'text-blue-100'
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
                                                    : 'bg-gray-50 border-gray-200'
                                            }
                                        `}
                                        >
                                            {/* Header de la tentative */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-2">
                                                    <span className={`font-bold text-lg ${
                                                        attempt.is_correct ? 'text-green-600' : 'text-gray-700'
                                                    }`}>
                                                        #{attempt.attempt_number}
                                                    </span>
                                                    {attempt.is_correct && (
                                                        <span className="text-green-600 text-xl">🎉</span>
                                                    )}
                                                    {shouldShowQuantum && (
                                                        <span className="text-purple-600 text-lg">🔮</span>
                                                    )}
                                                </div>
                                                <div className="text-right text-sm">
                                                    <div className="font-medium text-gray-700">
                                                        {attempt.attempt_score || 0} pts
                                                    </div>
                                                    {attempt.time_taken && (
                                                        <div className="text-gray-500 text-xs">
                                                            {Math.round(attempt.time_taken)}s
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Combinaison */}
                                            <div className="mb-3">
                                                <div className="text-xs font-medium text-gray-600 mb-2">
                                                    Combinaison :
                                                </div>
                                                <div className="flex justify-center space-x-2">
                                                    {attempt.combination.map((colorIndex, position) => (
                                                        <div
                                                            key={position}
                                                            className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm"
                                                            style={{
                                                                backgroundColor: difficultyConfig?.colorPalette?.[colorIndex] || COLOR_PALETTE[colorIndex] || '#gray'
                                                            }}
                                                            title={`Position ${position + 1}: Couleur ${colorIndex + 1}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Résultats */}
                                            <div className="border-t border-gray-200 pt-3">
                                                <div className="grid grid-cols-2 gap-4 text-center">
                                                    {/* Bien placées */}
                                                    <div className="text-center">
                                                        <div className="font-medium text-green-600 text-xs mb-2">
                                                            Bien placées ({attempt.correct_positions || 0})
                                                        </div>
                                                        <div className="space-y-1">
                                                            {generateClassicIndicatorGrid(
                                                                attempt.correct_positions || 0,
                                                                "text-green-600",
                                                                "Bonne couleur, bonne position"
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Mal placées */}
                                                    <div className="text-center">
                                                        <div className="font-medium text-orange-600 text-xs mb-2">
                                                            Mal placées ({attempt.correct_colors || 0})
                                                        </div>
                                                        <div className="space-y-1">
                                                            {generateClassicIndicatorGrid(
                                                                attempt.correct_colors || 0,
                                                                "text-orange-500",
                                                                "Bonne couleur, mauvaise position"
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Message de victoire */}
                                            {attempt.is_correct && (
                                                <div className="mt-3 text-center bg-green-100 border border-green-300 rounded p-2">
                                                    <span className="text-green-700 font-medium text-sm">
                                                        🎉 Mastermind résolu !
                                                    </span>
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
                            <div className="grid grid-cols-1 gap-1">
                                <div className="flex items-center space-x-2">
                                    <span className="text-green-600 font-bold">●</span>
                                    <span>Bien placées</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-orange-500 font-bold">●</span>
                                    <span>Mal placées</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-purple-600">🔮</span>
                                    <span>Mode quantique</span>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-1">
                                <div className="flex items-center space-x-2">
                                    <span className="text-green-600 font-bold">●</span>
                                    <span>Bien placées (couleur et position correctes)</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-orange-500 font-bold">●</span>
                                    <span>Mal placées (couleur correcte, position incorrecte)</span>
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
