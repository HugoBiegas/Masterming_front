// src/hooks/useGame.ts - Version avec debug du flow de données
import { useState, useEffect, useCallback } from 'react';
import { Game, AttemptRequest, AttemptResult, GameStatus } from '@/types/game';
import { gameService } from '@/services/game';

interface UseGameReturn {
    game: Game | null;
    loading: boolean;
    error: string | null;
    fetchGame: (id: string) => Promise<void>;
    makeAttempt: (attempt: AttemptRequest) => Promise<AttemptResult | null>;
    isGameFinished: boolean;
    isGameActive: boolean;
    refreshGame: () => Promise<void>;
    clearError: () => void;
}

export const useGame = (gameId?: string): UseGameReturn => {
    const [game, setGame] = useState<Game | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const fetchGame = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔍 Fetching game data for ID:', id);
            const gameData = await gameService.getGame(id);

            // 🔍 DEBUG: Examiner les données reçues
            console.log('📦 Raw game data from backend:', gameData);
            console.log('📊 Game attempts:', gameData.attempts);

            if (gameData.attempts && gameData.attempts.length > 0) {
                gameData.attempts.forEach((attempt, index) => {
                    console.log(`🎯 Attempt ${index + 1}:`, {
                        id: attempt.id,
                        attempt_number: attempt.attempt_number,
                        quantum_calculated: attempt.quantum_calculated,
                        quantum_probabilities: attempt.quantum_probabilities,
                        exact_matches: attempt.exact_matches,
                        position_matches: attempt.position_matches,
                        // Propriétés legacy
                        correct_positions: (attempt as any).correct_positions,
                        correct_colors: (attempt as any).correct_colors,
                        // Structure complète
                        full_object: attempt
                    });
                });
            }

            setGame(gameData);
        } catch (err: any) {
            console.error('❌ Erreur lors du chargement de la partie:', err);

            let errorMessage = 'Erreur lors du chargement de la partie';

            if (err.response?.status === 404) {
                errorMessage = 'Partie non trouvée';
            } else if (err.response?.status === 403) {
                errorMessage = 'Accès non autorisé à cette partie';
            } else if (err.response?.status === 401) {
                errorMessage = 'Session expirée. Reconnectez-vous.';
            } else if (!err.response) {
                errorMessage = 'Erreur de connexion réseau';
            } else if (err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshGame = useCallback(async () => {
        if (game?.id) {
            await fetchGame(game.id);
        } else if (gameId) {
            await fetchGame(gameId);
        }
    }, [game?.id, gameId, fetchGame]);

    const makeAttempt = useCallback(async (attempt: AttemptRequest): Promise<AttemptResult | null> => {
        if (!game) {
            setError('Aucune partie active');
            return null;
        }

        try {
            setError(null);

            console.log('🎯 Making attempt:', attempt);
            const result = await gameService.makeAttempt(game.id, attempt);

            // 🔍 DEBUG: Examiner le résultat de la tentative
            console.log('✅ Attempt result from backend:', result);
            console.log('🔮 Quantum data in result:', {
                quantum_calculated: result.quantum_calculated,
                quantum_probabilities: result.quantum_probabilities
            });

            // ⚠️ PROBLÈME POTENTIEL: On refresh la partie après la tentative
            // Ça peut écraser les données quantiques !
            console.log('🔄 Refreshing game data...');
            await fetchGame(game.id);

            return result;
        } catch (err: any) {
            console.error('❌ Erreur lors de la tentative:', err);

            let errorMessage = 'Erreur lors de la tentative';

            if (err.response?.status === 400) {
                errorMessage = err.response.data?.detail || 'Tentative invalide';
            } else if (err.response?.status === 409) {
                errorMessage = 'Partie non active ou terminée';
            } else if (err.response?.status === 403) {
                errorMessage = 'Vous ne pouvez pas faire de tentative dans cette partie';
            } else if (!err.response) {
                errorMessage = 'Erreur de connexion réseau';
            } else if (err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            }

            setError(errorMessage);
            return null;
        }
    }, [game, fetchGame]);

    // Auto-fetch game when gameId changes
    useEffect(() => {
        if (gameId && gameId.trim() !== '') {
            fetchGame(gameId);
        } else {
            setGame(null);
            setError(null);
        }
    }, [gameId, fetchGame]);

    // Computed values
    const isGameFinished = game?.status === GameStatus.FINISHED || game?.status === GameStatus.CANCELLED;
    const isGameActive = game?.status === GameStatus.ACTIVE;

    return {
        game,
        loading,
        error,
        fetchGame,
        makeAttempt,
        isGameFinished,
        isGameActive,
        refreshGame,
        clearError
    };
};