import React, { useEffect, useMemo } from 'react';
import { Attempt } from '@/types/game';
import { COLOR_PALETTE } from '@/utils/constants';
import { QuantumIndicators } from './QuantumIndicators';
import { QuantumSimulator } from '@/utils/quantumSimulator';

interface AttemptHistoryProps {
    attempts: Attempt[];
    maxAttempts?: number;
    combinationLength?: number;
    isQuantumMode?: boolean;
    gameType?: string;
    enableSimulation?: boolean;
    targetSolution?: number[];
}

export const AttemptHistory: React.FC<AttemptHistoryProps> = ({
                                                                  attempts,
                                                                  maxAttempts,
                                                                  combinationLength = 4,
                                                                  isQuantumMode = false,
                                                                  gameType,
                                                                  enableSimulation = true,
                                                                  targetSolution
                                                              }) => {

    // 🔮 Enrichir automatiquement les tentatives pour les jeux quantiques
    const enrichedAttempts = useMemo(() => {
        if (!isQuantumMode) {
            return attempts;
        }

        // Vérifier si des données quantiques réelles existent déjà
        const hasRealQuantumData = attempts.some(attempt =>
            attempt.quantum_calculated === true &&
            attempt.quantum_probabilities?.position_probabilities &&
            Array.isArray(attempt.quantum_probabilities.position_probabilities) &&
            attempt.quantum_probabilities.position_probabilities.length > 0
        );

        if (hasRealQuantumData) {
            console.log('✅ Real quantum data detected, using original attempts');
            return attempts;
        }

        if (!enableSimulation) {
            console.log('⚠️ No quantum data and simulation disabled');
            return attempts;
        }

        // Utiliser la simulation quantique
        console.log('🔮 No real quantum data found, enriching with simulation...');
        const simulated = QuantumSimulator.enrichGameWithQuantumData(
            attempts,
            combinationLength,
            targetSolution
        );

        console.log('✅ Quantum simulation complete for', simulated.length, 'attempts');
        return simulated;
    }, [attempts, isQuantumMode, enableSimulation, combinationLength, targetSolution]);

    // 🔍 Debug logging
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('🔮 AttemptHistory Debug:', {
                gameType,
                isQuantumMode,
                enableSimulation,
                attemptsCount: attempts.length,
                enrichedAttemptsCount: enrichedAttempts.length,
                hasRealQuantumData: attempts.some(a => a.quantum_calculated === true),
                hasSimulatedQuantumData: enrichedAttempts.some(a => a.quantum_calculated === true),
                firstAttemptComparison: attempts.length > 0 ? {
                    original: {
                        quantum_calculated: attempts[0].quantum_calculated,
                        hasQuantumProbabilities: !!attempts[0].quantum_probabilities
                    },
                    enriched: {
                        quantum_calculated: enrichedAttempts[0].quantum_calculated,
                        hasQuantumProbabilities: !!enrichedAttempts[0].quantum_probabilities
                    }
                } : null
            });
        }
    }, [attempts, enrichedAttempts, isQuantumMode, gameType, enableSimulation]);

    // Fonction pour générer les indicateurs classiques en grille
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

            if (row === totalRows - 1 && endIndex < count) {
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

    // Déterminer si une tentative a des données quantiques valides
    const hasQuantumData = (attempt: Attempt) => {
        return attempt.quantum_calculated === true &&
            attempt.quantum_probabilities?.position_probabilities &&
            Array.isArray(attempt.quantum_probabilities.position_probabilities) &&
            attempt.quantum_probabilities.position_probabilities.length > 0;
    };

    // Détecter si on utilise des données simulées
    const usingSimulation = isQuantumMode &&
        enableSimulation &&
        !attempts.some(a => hasQuantumData(a)) &&
        enrichedAttempts.some(a => hasQuantumData(a));

    return (
        <div className="w-full h-full bg-gradient-to-br from-amber-50 to-amber-100 border-l-4 border-amber-300 shadow-lg">
            <div className="h-full flex flex-col bg-white rounded-l-lg shadow-inner">
                {/* Header avec informations */}
                <div className={`text-white p-4 rounded-tl-lg flex-shrink-0 ${
                    isQuantumMode
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600'
                }`}>
                    <div className="text-center">
                        <h3 className="text-lg font-bold">
                            {isQuantumMode ? '🔮 Historique Quantique' : '📊 Historique des tentatives'}
                        </h3>
                        <div className={`text-sm mt-1 ${
                            isQuantumMode ? 'text-purple-100' : 'text-amber-100'
                        }`}>
                            {enrichedAttempts.length}{maxAttempts ? ` / ${maxAttempts}` : ''} tentatives
                            {isQuantumMode && (
                                <span>
                                    {' • Mode Quantique '}
                                    {usingSimulation ? '(Simulé)' : '(Réel)'}
                                </span>
                            )}
                        </div>

                        {/* Notification de simulation */}
                        {usingSimulation && (
                            <div className="text-xs mt-1 text-purple-200 bg-purple-700 bg-opacity-30 rounded px-2 py-1">
                                💡 Interface de démonstration - Données simulées
                            </div>
                        )}
                    </div>
                </div>

                {/* Contenu scrollable */}
                <div className="flex-1 overflow-y-auto p-4 history-scroll-container">
                    {enrichedAttempts.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-gray-400 text-4xl mb-2">
                                {isQuantumMode ? '🔮' : '🎯'}
                            </div>
                            <p className="text-gray-500">Aucune tentative pour le moment</p>
                            <p className="text-xs text-gray-400 mt-1">
                                {isQuantumMode
                                    ? 'Votre première analyse quantique apparaîtra ici !'
                                    : 'Faites votre première tentative !'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {enrichedAttempts.map((attempt, index) => {
                                const hasQuantum = hasQuantumData(attempt);
                                const shouldShowQuantum = isQuantumMode && hasQuantum;

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
                                        {/* Badge de type de données */}
                                        {shouldShowQuantum && (
                                            <div className="absolute top-2 right-2 text-xs px-2 py-1 rounded-full font-medium">
                                                {usingSimulation ? (
                                                    <span className="bg-orange-500 text-white" title="Données simulées">
                                                        SIM
                                                    </span>
                                                ) : (
                                                    <span className="bg-purple-500 text-white" title="Données réelles du backend">
                                                        REAL
                                                    </span>
                                                )}
                                            </div>
                                        )}

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

                                        {/* Section des indicateurs - Conditionnel selon le mode */}
                                        {shouldShowQuantum ? (
                                            // Affichage quantique
                                            <div className="mt-4">
                                                <QuantumIndicators
                                                    positionProbabilities={attempt.quantum_probabilities!.position_probabilities}
                                                    combinationLength={combinationLength}
                                                    showDetailedTooltips={true}
                                                    compactMode={false}
                                                />

                                                {/* Informations quantiques supplémentaires */}
                                                <div className="mt-3 bg-purple-100 border border-purple-200 rounded-lg p-2">
                                                    <div className="text-xs text-purple-700 space-y-1">
                                                        <div className="flex justify-between">
                                                            <span>Mesures quantiques totales:</span>
                                                            <span className="font-semibold">{attempt.quantum_probabilities!.shots_used}</span>
                                                        </div>
                                                        {attempt.quantum_hint_used && (
                                                            <div className="text-purple-600 font-medium">
                                                                💡 Indice quantique utilisé
                                                            </div>
                                                        )}
                                                        {usingSimulation && (
                                                            <div className="text-orange-600 font-medium text-xs italic">
                                                                ⚠️ Données simulées - Interface de démonstration
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            // Affichage classique
                                            <div className="grid grid-cols-2 gap-3">
                                                {/* Bien placées */}
                                                <div className="text-center">
                                                    <div className="font-medium text-green-700 text-xs mb-2">
                                                        Bien placées ({attempt.correct_positions || attempt.exact_matches || 0})
                                                    </div>
                                                    <div className="space-y-1">
                                                        {generateClassicIndicatorGrid(
                                                            attempt.correct_positions || attempt.exact_matches || 0,
                                                            "text-green-600",
                                                            "Bonne couleur, bonne position"
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Mal placées */}
                                                <div className="text-center">
                                                    <div className="font-medium text-orange-600 text-xs mb-2">
                                                        Mal placées ({attempt.correct_colors || attempt.position_matches || 0})
                                                    </div>
                                                    <div className="space-y-1">
                                                        {generateClassicIndicatorGrid(
                                                            attempt.correct_colors || attempt.position_matches || 0,
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

                {/* Footer avec légende - fixe */}
                <div className="border-t border-gray-200 p-3 bg-gray-50 rounded-bl-lg flex-shrink-0">
                    <div className="text-xs text-gray-600 space-y-1">
                        <div className="font-medium text-gray-700 mb-2">
                            {isQuantumMode ? 'Légende quantique :' : 'Légende classique :'}
                        </div>

                        {isQuantumMode ? (
                            <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                    <span className="text-purple-600 font-bold">🔮</span>
                                    <span>Analyse quantique {usingSimulation ? '(simulée)' : 'activée'}</span>
                                </div>
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

                        <div className="text-xs text-gray-500 mt-2 italic">
                            {isQuantumMode
                                ? `* Les vagues circulaires indiquent les probabilités quantiques ${usingSimulation ? '(simulées)' : ''}`
                                : '* Affichage en grille, max 4 indicateurs par ligne'
                            }
                        </div>

                        {/* Info simulation */}
                        {usingSimulation && (
                            <div className="text-xs text-orange-600 mt-2 border-t pt-2">
                                💡 Simulation activée pour démonstration d'interface
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};