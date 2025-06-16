import { useState, useEffect } from 'react';
import { Game, AttemptRequest, AttemptResult, GameStatus } from '@/types/game';
import { gameService } from '@/services/game';

export const useGame = (gameId?: string) => {
    const [game, setGame] = useState<Game | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchGame = async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            const gameData = await gameService.getGame(id);
            setGame(gameData);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Erreur lors du chargement de la partie');
        } finally {
            setLoading(false);
        }
    };

    const makeAttempt = async (attempt: AttemptRequest): Promise<AttemptResult | null> => {
        if (!game) return null;

        try {
            setError(null);
            const result = await gameService.makeAttempt(game.id, attempt);

            // Refresh game data after attempt
            await fetchGame(game.id);

            return result;
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Erreur lors de la tentative');
            return null;
        }
    };

    useEffect(() => {
        if (gameId) {
            fetchGame(gameId);
        }
    }, [gameId]);

    return {
        game,
        loading,
        error,
        fetchGame,
        makeAttempt,
        isGameFinished: game?.status === GameStatus.FINISHED,
        isGameActive: game?.status === GameStatus.ACTIVE
    };
};
