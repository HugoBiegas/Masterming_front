// src/hooks/useGame.ts - Version corrigée pour comptage des tentatives

import { useState, useEffect, useCallback } from 'react';
import { Game, AttemptRequest, AttemptResult, GameStatus } from '@/types/game';
import { gameService } from '@/services/game';

interface UseGameReturn {
    game: Game | null;
    loading: boolean;
    error: string | null;
    makeAttempt: (attempt: AttemptRequest) => Promise<AttemptResult | null>;
    isGameFinished: boolean;
    isGameActive: boolean;
    refreshGame: () => Promise<void>;

    // NOUVEAU: Ajout minimal pour la solution
    revealedSolution: number[] | null;
    solutionReason: 'victory' | 'elimination' | 'game_finished' | null;
    clearRevealedSolution: () => void;
}

export const useGame = (gameId?: string): UseGameReturn => {
    const [game, setGame] = useState<Game | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // NOUVEAU: États pour la solution (ajout minimal)
    const [revealedSolution, setRevealedSolution] = useState<number[] | null>(null);
    const [solutionReason, setSolutionReason] = useState<'victory' | 'elimination' | 'game_finished' | null>(null);

    // === LOGIQUE EXISTANTE (ne pas modifier) ===

    const fetchGame = useCallback(async (id: string) => {
        if (!id) return;

        try {
            setLoading(true);
            setError(null);

            console.log('🔍 Fetching game with ID:', id);
            const gameData = await gameService.getGame(id);
            console.log('📦 Game data received:', gameData);

            setGame(gameData);
        } catch (err: any) {
            console.error('❌ Error fetching game:', err);

            let errorMessage = 'Erreur lors du chargement de la partie';
            if (err.response?.status === 404) {
                errorMessage = 'Partie non trouvée';
            } else if (err.response?.status === 403) {
                errorMessage = 'Accès non autorisé à cette partie';
            } else if (err.response?.status === 401) {
                errorMessage = 'Session expirée. Reconnectez-vous.';
            } else if (err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            }

            setError(errorMessage);
            setGame(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // Charger le jeu au montage
    useEffect(() => {
        if (gameId) {
            console.log('🎮 useGame: Loading game with ID:', gameId);
            fetchGame(gameId);
        }
    }, [gameId, fetchGame]);

    const refreshGame = useCallback(async () => {
        if (gameId) {
            await fetchGame(gameId);
        }
    }, [gameId, fetchGame]);

    // 🔧 CORRECTION: makeAttempt avec rafraîchissement systématique
    const makeAttempt = useCallback(async (attempt: AttemptRequest): Promise<AttemptResult | null> => {
        if (!game) {
            setError('Aucune partie active');
            return null;
        }

        try {
            setError(null);
            console.log('🎯 Making attempt:', attempt);

            const result = await gameService.makeAttempt(game.id, attempt);
            console.log('✅ Attempt result:', result);

            // NOUVEAU: Gestion automatique de la solution
            if (result && result.solution && result.solution.length > 0) {
                console.log('🎯 Solution révélée automatiquement:', result.solution);

                let reason: 'victory' | 'elimination' | 'game_finished' = 'game_finished';
                if (result.is_winning || result.is_correct) {
                    reason = 'victory';
                } else if (result.remaining_attempts === 0) {
                    reason = 'elimination';
                } else if (result.game_finished) {
                    reason = 'game_finished';
                }

                setRevealedSolution(result.solution);
                setSolutionReason(reason);
                console.log(`🎯 Solution révélée pour: ${reason}`);
            }

            // 🔧 CORRECTION PRINCIPALE: Rafraîchir TOUJOURS le jeu après une tentative
            // Cela garantit que la tentative gagnante soit incluse dans l'historique
            if (result) {
                console.log('🔄 Rafraîchissement du jeu pour inclure la nouvelle tentative...');
                setTimeout(() => {
                    refreshGame();
                    console.log('✅ Jeu rafraîchi, tentatives mises à jour');
                }, 500);
            }

            return result;
        } catch (err: any) {
            console.error('❌ Error making attempt:', err);

            let errorMessage = 'Erreur lors de la tentative';
            if (err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            }

            setError(errorMessage);
            return null;
        }
    }, [game, refreshGame]);

    // NOUVEAU: Fonction pour nettoyer la solution
    const clearRevealedSolution = useCallback(() => {
        setRevealedSolution(null);
        setSolutionReason(null);
    }, []);

    // États calculés (compatible avec votre code)
    const isGameFinished = game?.status === GameStatus.FINISHED || false;
    const isGameActive = game?.status === GameStatus.ACTIVE || false;

    // Nettoyer la solution si le jeu change
    useEffect(() => {
        if (!game || game.status === 'waiting') {
            setRevealedSolution(null);
            setSolutionReason(null);
        }
    }, [game?.id, game?.status]);

    return {
        game,
        loading,
        error,
        makeAttempt,
        isGameFinished,
        isGameActive,
        refreshGame,

        // Solution automatique
        revealedSolution,
        solutionReason,
        clearRevealedSolution
    };
};