import { QuantumProbabilities, QuantumPositionProbability, Attempt } from '@/types/game';

/**
 * Simulateur de données quantiques pour les parties Quantum Mastermind
 * Utilisé quand le backend ne fournit pas encore les vraies données quantiques
 */
export class QuantumSimulator {

    /**
     * Génère des données quantiques simulées réalistes pour une tentative
     */
    static generateQuantumData(
        attempt: Attempt,
        combinationLength: number,
        targetSolution?: number[]
    ): QuantumProbabilities {
        const positionProbabilities: QuantumPositionProbability[] = [];

        for (let i = 0; i < combinationLength; i++) {
            const attemptColor = attempt.combination[i];

            // Simuler différents types de correspondances avec des probabilités réalistes
            let matchType: 'exact_match' | 'color_present' | 'no_match';
            let probability: number;
            let confidence: 'high' | 'medium' | 'low';

            // Si on a la solution réelle, calculer les vraies correspondances
            if (targetSolution && i < targetSolution.length) {
                if (targetSolution[i] === attemptColor) {
                    // Position exacte
                    matchType = 'exact_match';
                    probability = 0.85 + Math.random() * 0.14; // 85-99%
                    confidence = Math.random() > 0.1 ? 'high' : 'medium';
                } else if (targetSolution.includes(attemptColor)) {
                    // Couleur présente ailleurs
                    matchType = 'color_present';
                    probability = 0.25 + Math.random() * 0.55; // 25-80%
                    confidence = Math.random() > 0.4 ? 'medium' : 'low';
                } else {
                    // Aucune correspondance
                    matchType = 'no_match';
                    probability = Math.random() * 0.12; // 0-12%
                    confidence = Math.random() > 0.6 ? 'high' : 'medium';
                }
            } else {
                // Simulation basée sur les résultats réels de la tentative
                const exactMatches = attempt.correct_positions || 0;
                const colorMatches = attempt.correct_colors || 0;
                const totalPositions = combinationLength;

                // Probabilités basées sur les statistiques réelles
                const exactRatio = exactMatches / totalPositions;
                const colorRatio = colorMatches / totalPositions;

                if (Math.random() < exactRatio * 1.5) { // Un peu de randomness
                    matchType = 'exact_match';
                    probability = 0.70 + Math.random() * 0.29;
                    confidence = Math.random() > 0.2 ? 'high' : 'medium';
                } else if (Math.random() < colorRatio * 1.3) {
                    matchType = 'color_present';
                    probability = 0.20 + Math.random() * 0.65;
                    confidence = Math.random() > 0.5 ? 'medium' : 'low';
                } else {
                    matchType = 'no_match';
                    probability = Math.random() * 0.15;
                    confidence = Math.random() > 0.7 ? 'high' : 'medium';
                }
            }

            // Simuler les mesures quantiques (shots)
            const totalShots = 1024;
            const measurements = Math.floor(probability * totalShots * (0.9 + Math.random() * 0.2));

            positionProbabilities.push({
                position: i,
                exact_match_probability: probability,
                match_type: matchType,
                confidence,
                attempt_color: attemptColor,
                quantum_measurements: Math.min(measurements, totalShots),
                total_shots: totalShots
            });
        }

        // Calculer les correspondances totales basées sur les probabilités
        const exactMatches = positionProbabilities.filter(p => p.match_type === 'exact_match').length;
        const wrongPosition = positionProbabilities.filter(p => p.match_type === 'color_present').length;

        return {
            exact_matches: exactMatches,
            wrong_position: wrongPosition,
            position_probabilities: positionProbabilities,
            quantum_calculated: true,
            shots_used: 1024
        };
    }

    /**
     * Enrichit une tentative avec des données quantiques simulées
     */
    static enrichAttemptWithQuantumData(
        attempt: Attempt,
        combinationLength: number,
        targetSolution?: number[]
    ): Attempt {
        // Si déjà enrichi, ne pas re-enrichir
        if (attempt.quantum_calculated) {
            return attempt;
        }

        const quantumData = this.generateQuantumData(attempt, combinationLength, targetSolution);

        return {
            ...attempt,
            quantum_calculated: true,
            quantum_probabilities: quantumData,
            quantum_hint_used: Math.random() > 0.75, // 25% de chance d'avoir utilisé un indice
            exact_matches: quantumData.exact_matches,
            position_matches: quantumData.wrong_position
        };
    }

    /**
     * Enrichit toutes les tentatives d'un jeu avec des données quantiques
     */
    static enrichGameWithQuantumData(
        attempts: Attempt[],
        combinationLength: number,
        targetSolution?: number[]
    ): Attempt[] {
        return attempts.map(attempt =>
            this.enrichAttemptWithQuantumData(attempt, combinationLength, targetSolution)
        );
    }

    /**
     * Vérifie si les données quantiques sont valides et cohérentes
     */
    static validateQuantumData(quantumProbs: QuantumProbabilities): boolean {
        if (!quantumProbs.position_probabilities || !Array.isArray(quantumProbs.position_probabilities)) {
            return false;
        }

        return quantumProbs.position_probabilities.every(pos =>
            pos.exact_match_probability >= 0 &&
            pos.exact_match_probability <= 1 &&
            pos.quantum_measurements <= pos.total_shots &&
            pos.quantum_measurements >= 0 &&
            pos.total_shots > 0 &&
            pos.position >= 0 &&
            ['exact_match', 'color_present', 'no_match'].includes(pos.match_type) &&
            ['high', 'medium', 'low'].includes(pos.confidence)
        );
    }

    /**
     * Génère des données quantiques plus réalistes en tenant compte de l'historique
     */
    static generateAdvancedQuantumData(
        attempt: Attempt,
        combinationLength: number,
        previousAttempts: Attempt[] = [],
        targetSolution?: number[]
    ): QuantumProbabilities {
        // Pour l'instant, utilise la méthode standard
        // TODO: Implémenter une logique plus avancée basée sur l'historique
        return this.generateQuantumData(attempt, combinationLength, targetSolution);
    }

    /**
     * Utilitaire pour déboguer les données quantiques
     */
    static debugQuantumData(attempt: Attempt): void {
        if (process.env.NODE_ENV === 'development') {
            console.log('🔮 Quantum Debug for attempt', attempt.attempt_number, ':', {
                hasQuantumData: attempt.quantum_calculated,
                quantumProbabilities: attempt.quantum_probabilities,
                positionCount: attempt.quantum_probabilities?.position_probabilities?.length,
                isValid: attempt.quantum_probabilities ? this.validateQuantumData(attempt.quantum_probabilities) : false
            });
        }
    }
}

/**
 * Hook React pour utiliser le simulateur quantique de façon réactive
 */
import { useState, useCallback, useMemo } from 'react';

export const useQuantumSimulator = (enabled: boolean = false) => {
    const [isSimulating, setIsSimulating] = useState(enabled);
    const [lastEnrichmentTime, setLastEnrichmentTime] = useState<number>(0);

    const enrichAttempts = useCallback((
        attempts: Attempt[],
        combinationLength: number,
        targetSolution?: number[]
    ): Attempt[] => {
        if (!isSimulating || attempts.length === 0) {
            return attempts;
        }

        const startTime = Date.now();
        console.log('🔮 Starting quantum simulation for', attempts.length, 'attempts');

        const enriched = QuantumSimulator.enrichGameWithQuantumData(
            attempts,
            combinationLength,
            targetSolution
        );

        const duration = Date.now() - startTime;
        setLastEnrichmentTime(duration);

        console.log('✅ Quantum simulation complete in', duration, 'ms');
        return enriched;
    }, [isSimulating]);

    const toggleSimulation = useCallback(() => {
        setIsSimulating(prev => {
            const newState = !prev;
            console.log('🔮 Quantum simulation', newState ? 'enabled' : 'disabled');
            return newState;
        });
    }, []);

    const simulationStats = useMemo(() => ({
        isActive: isSimulating,
        lastEnrichmentDuration: lastEnrichmentTime,
        performance: lastEnrichmentTime < 50 ? 'excellent' :
            lastEnrichmentTime < 100 ? 'good' :
                lastEnrichmentTime < 200 ? 'fair' : 'slow'
    }), [isSimulating, lastEnrichmentTime]);

    return {
        isSimulating,
        enrichAttempts,
        toggleSimulation,
        simulationStats
    };
};