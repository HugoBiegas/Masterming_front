import React, { useCallback, useState, useRef } from 'react';
import { COLOR_PALETTE } from '@/utils/constants';
import { QuantumIndicators } from '@/components/game/QuantumIndicators';

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
        exact_matches?: number;
        wrong_position?: number;
    };
    // Support pour quantum_probabilities (alias)
    quantum_probabilities?: {
        quantum_calculated: boolean;
        position_probabilities?: any[];
        exact_matches?: number;
        wrong_position?: number;
    };
}

interface ExtendedGameRoom {
    id?: string;
    code?: string;
    game_type?: string;
    quantum_enabled?: boolean;
    settings?: {
        game_type?: string;
        quantum_enabled?: boolean;
    };
}

interface MultiplayerAttemptHistoryProps {
    attempts: MultiplayerAttempt[];
    maxAttempts?: number;
    combinationLength?: number;
    isQuantumMode?: boolean;
    difficultyConfig?: any;
    className?: string;
    room?: ExtendedGameRoom; // NOUVEAU: Pour la détection automatique
}

export const MultiplayerAttemptHistory: React.FC<MultiplayerAttemptHistoryProps> = ({
                                                                                        attempts,
                                                                                        maxAttempts,
                                                                                        combinationLength = 4,
                                                                                        isQuantumMode = false,
                                                                                        difficultyConfig,
                                                                                        className = "",
                                                                                        room
                                                                                    }) => {

    // ===============================================
    // DÉTECTION QUANTIQUE AMÉLIORÉE
    // ===============================================
    const detectQuantumMode = useCallback((room: ExtendedGameRoom | undefined, attempts: MultiplayerAttempt[]) => {
        // SIMPLE: Si c'est une room quantique, c'est quantique !
        const isQuantumRoom = room?.game_type === 'quantum' || room?.quantum_enabled === true;

        console.log('🔮 QUANTUM SIMPLE CHECK:', {
            game_type: room?.game_type,
            quantum_enabled: room?.quantum_enabled,
            result: isQuantumRoom
        });

        return isQuantumRoom;
    }, []);


    // Utiliser la détection automatique ou le prop manuel
    const autoDetectedQuantumMode = detectQuantumMode(room, attempts);
    const finalQuantumMode = isQuantumMode || autoDetectedQuantumMode;

    const forceQuantumMode = room?.game_type === 'quantum' || room?.quantum_enabled === true;
    const realFinalQuantumMode = isQuantumMode || autoDetectedQuantumMode || forceQuantumMode;

    console.log('🔮 QUANTUM MODE CHECK:', {
        roomGameType: room?.game_type,
        quantumEnabled: room?.quantum_enabled,
        isQuantumMode,
        autoDetected: autoDetectedQuantumMode,
        forceQuantum: forceQuantumMode,
        finalResult: realFinalQuantumMode
    });

    // ===============================================
    // DÉTECTION DONNÉES QUANTIQUES PAR TENTATIVE
    // ===============================================
    const hasQuantumData = useCallback((attempt: MultiplayerAttempt): boolean => {
        // Vérifier quantum_data (format principal)
        const quantumData = attempt.quantum_data;
        const hasMainQuantumData = (quantumData?.quantum_calculated === true) &&
            !!quantumData?.position_probabilities?.length;

        // Vérifier quantum_probabilities (format alternatif)
        const quantumProbs = attempt.quantum_probabilities;
        const hasAltQuantumData = (quantumProbs?.quantum_calculated === true) &&
            !!quantumProbs?.position_probabilities?.length;

        const result = hasMainQuantumData || hasAltQuantumData;

        if (result) {
            console.log('🔮 Tentative quantique détectée:', {
                attemptId: attempt.id,
                hasMainData: hasMainQuantumData,
                hasAltData: hasAltQuantumData,
                quantumData: quantumData,
                quantumProbs: quantumProbs
            });
        }

        return result;
    }, []);

    // ===============================================
    // EXTRACTION DONNÉES QUANTIQUES
    // ===============================================
    const getQuantumData = useCallback((attempt: MultiplayerAttempt) => {
        // Priorité à quantum_data, fallback sur quantum_probabilities
        const quantumData = attempt.quantum_data || attempt.quantum_probabilities;

        if (!quantumData) return null;

        return {
            quantum_calculated: quantumData.quantum_calculated || false,
            position_probabilities: quantumData.position_probabilities || [],
            exact_matches: quantumData.exact_matches || attempt.correct_positions || 0,
            wrong_position: quantumData.wrong_position || attempt.correct_colors || 0
        };
    }, []);

    // ===============================================
    // INDICATEURS CLASSIQUES
    // ===============================================
    const generateClassicIndicatorGrid = useCallback((count: number, color: string, title: string) => {
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
    }, []);

    // ===============================================
    // STATISTIQUES
    // ===============================================
    const quantumAttemptsCount = attempts.filter(hasQuantumData).length;
    const totalAttempts = attempts.length;
    const successfulAttempts = attempts.filter(attempt => attempt.is_correct).length;

    // ===============================================
    // RENDU PRINCIPAL
    // ===============================================
    return (
        <div className={`w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 border-l-4 border-blue-300 shadow-lg ${className}`}>
            <div className="h-full flex flex-col bg-white rounded-l-lg shadow-inner">
                {/* Header */}
                <div className={`text-white p-4 rounded-tl-lg flex-shrink-0 ${
                    finalQuantumMode || quantumAttemptsCount > 0
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                }`}>
                    <div className="text-center">
                        <h3 className="text-lg font-bold">
                            {finalQuantumMode || quantumAttemptsCount > 0 ? '🔮 Mes Tentatives Quantiques' : '🎯 Mes Tentatives'}
                        </h3>
                        <div className={`text-sm mt-1 ${
                            finalQuantumMode || quantumAttemptsCount > 0 ? 'text-purple-100' : 'text-blue-100'
                        }`}>
                            {totalAttempts}{maxAttempts ? ` / ${maxAttempts}` : ''} tentatives
                            {quantumAttemptsCount > 0 && (
                                <span className="ml-2">• {quantumAttemptsCount} quantiques</span>
                            )}
                            {successfulAttempts > 0 && (
                                <span className="ml-2">• {successfulAttempts} réussies</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Contenu scrollable */}
                <div className="flex-1 overflow-y-auto p-4 history-scroll-container">
                    {totalAttempts === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-gray-400 text-4xl mb-2">
                                {finalQuantumMode || quantumAttemptsCount > 0 ? '🔮' : '🎯'}
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
                                    const quantumData = getQuantumData(attempt);

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
                                                        <span className="bg-green-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold">
                                                            🏆
                                                        </span>
                                                    )}
                                                    {shouldShowQuantum && (
                                                        <span className="bg-purple-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold">
                                                            🔮
                                                        </span>
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
                                                            className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm relative"
                                                            style={{
                                                                backgroundColor: difficultyConfig?.colorPalette?.[colorIndex - 1] || COLOR_PALETTE[colorIndex - 1] || '#gray'
                                                            }}
                                                            title={`Position ${position + 1}: Couleur ${colorIndex}`}
                                                        >
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <span className="text-white font-bold text-xs drop-shadow-sm">
                                                                    {colorIndex}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Résultats */}
                                            <div className="border-t border-gray-200 pt-3">
                                                {shouldShowQuantum && quantumData ? (
                                                    // ===============================================
                                                    // AFFICHAGE QUANTIQUE
                                                    // ===============================================
                                                    <div className="space-y-4">
                                                        <div className="text-center">
                                                            <div className="text-sm font-medium text-purple-700 mb-2">
                                                                🔮 Analyse Quantique
                                                            </div>
                                                            <div className="text-xs text-purple-600">
                                                                Bien placées: {quantumData.exact_matches} •
                                                                Mal placées: {quantumData.wrong_position}
                                                            </div>
                                                        </div>

                                                        {/* Indicateurs quantiques */}
                                                        <div className="quantum-tooltip-container">
                                                            <QuantumIndicators
                                                                positionProbabilities={quantumData.position_probabilities}
                                                                combinationLength={combinationLength}
                                                                showDetailedTooltips={true}
                                                                compactMode={true}
                                                            />
                                                        </div>

                                                        {/* Résumé quantique */}
                                                        <div className="bg-purple-100 border border-purple-300 rounded p-2 text-xs">
                                                            <div className="text-purple-700 font-medium text-center">
                                                                Analyse probabiliste réalisée
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // ===============================================
                                                    // AFFICHAGE CLASSIQUE
                                                    // ===============================================
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
                                                )}
                                            </div>

                                            {/* Message de victoire */}
                                            {attempt.is_correct && (
                                                <div className="mt-3 text-center bg-green-100 border border-green-300 rounded p-2">
                                                    <span className="text-green-700 font-medium text-sm">
                                                        🎉 Mastermind résolu !
                                                    </span>
                                                    {shouldShowQuantum && (
                                                        <div className="text-xs text-purple-600 mt-1">
                                                            Solution trouvée avec l'aide quantique
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>

                {/* Footer avec légende améliorée */}
                <div className="border-t border-gray-200 p-3 bg-gray-50 rounded-bl-lg flex-shrink-0">
                    <div className="text-xs text-gray-600 space-y-1">
                        <div className="font-medium text-gray-700 mb-2">
                            Légende :
                        </div>

                        {finalQuantumMode || quantumAttemptsCount > 0 ? (
                            // ===============================================
                            // LÉGENDE QUANTIQUE
                            // ===============================================
                            <div className="grid grid-cols-1 gap-1">
                                <div className="flex items-center space-x-2">
                                    <span className="text-green-600 font-bold">●</span>
                                    <span>Bien placées (position et couleur correctes)</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-orange-500 font-bold">●</span>
                                    <span>Mal placées (couleur correcte, position incorrecte)</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-purple-600">🔮</span>
                                    <span>Analyse quantique avec probabilités</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-green-600">🏆</span>
                                    <span>Solution trouvée</span>
                                </div>
                                <div className="mt-2 text-xs text-gray-500 italic">
                                    Les cercles colorés montrent les probabilités d'exactitude par position
                                </div>
                            </div>
                        ) : (
                            // ===============================================
                            // LÉGENDE CLASSIQUE
                            // ===============================================
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
                                <div className="flex items-center space-x-2">
                                    <span className="text-green-600">🎯</span>
                                    <span>Mode classique</span>
                                </div>
                            </div>
                        )}

                        {/* Statistiques */}
                        {totalAttempts > 0 && (
                            <div className="mt-3 pt-2 border-t border-gray-200">
                                <div className="text-xs text-gray-500">
                                    Statistiques: {successfulAttempts}/{totalAttempts} réussies
                                    {quantumAttemptsCount > 0 && (
                                        <span className="ml-2">({quantumAttemptsCount} quantiques)</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};