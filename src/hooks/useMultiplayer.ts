import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { multiplayerService } from '@/services/multiplayer';
import {
    GameRoom,
    PlayerProgress,
    MultiplayerAttemptRequest,
    MultiplayerAttemptResponse,
    PlayerStatus
} from '@/types/multiplayer';

interface UseMultiplayerOptions {
    autoRefresh?: boolean;
    refreshInterval?: number;
}

interface UseMultiplayerReturn {
    // État de la room
    currentRoom: GameRoom | null;
    players: PlayerProgress[];
    loading: boolean;
    error: string | null;

    // État du jeu
    isGameActive: boolean;
    isGameFinished: boolean;
    canStart: boolean;

    // Joueur actuel
    currentPlayer: PlayerProgress | null;
    isHost: boolean;

    // Actions
    refreshRoom: () => Promise<void>;
    startGame: () => Promise<boolean>;
    leaveRoom: () => Promise<void>;
    makeAttempt: (combination: number[]) => Promise<MultiplayerAttemptResponse | null>;

    // Statistiques
    stats: {
        connectedPlayers: number;
        readyPlayers: number;
        finishedPlayers: number;
    };
}

export const useMultiplayer = (
    roomCode?: string,
    options: UseMultiplayerOptions = {}
): UseMultiplayerReturn => {
    const { user } = useAuth();
    const { showError, showSuccess, showWarning } = useNotification();

    const {
        autoRefresh = true,
        refreshInterval = 5000
    } = options;

    // États
    const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
    const [players, setPlayers] = useState<PlayerProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Refs pour éviter les fuites mémoire
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const mountedRef = useRef(true);

    // États calculés
    const isGameActive = currentRoom?.status === 'active';
    const isGameFinished = currentRoom?.status === 'finished';
    const currentPlayer = players.find(p => p.user_id === user?.id) || null;
    const isHost = currentRoom?.creator?.id === user?.id;
    const canStart = isHost &&
        currentRoom?.status === 'waiting' &&
        players.length >= 2 &&
        players.length <= (currentRoom?.max_players || 8);

    // Statistiques
    const stats = {
        connectedPlayers: players.filter(p =>
            p.status !== 'disconnected' && p.status !== 'eliminated'
        ).length,
        readyPlayers: players.filter(p => p.is_ready).length,
        // CORRECTION: Remplacer PlayerStatus.FINISHED par 'finished'
        finishedPlayers: players.filter(p =>
            p.status === 'finished'
        ).length
    };

    // Rafraîchir les données de la room
    const refreshRoom = useCallback(async () => {
        if (!roomCode || !mountedRef.current) return;

        try {
            setError(null);

            // CORRECTION: Utiliser getRoomDetails au lieu de getRoomInfo
            const roomData = await multiplayerService.getRoomDetails(roomCode);
            if (!mountedRef.current) return;

            if (roomData) {
                setCurrentRoom(roomData);
            }

            // Récupérer la liste des joueurs
            const playersData = await multiplayerService.getPlayerProgress(roomCode);
            if (!mountedRef.current) return;

            if (Array.isArray(playersData)) {
                setPlayers(playersData);
            }

        } catch (err: any) {
            if (!mountedRef.current) return;

            console.error('Erreur rafraîchissement room:', err);
            const errorMessage = err.message || 'Erreur lors du rafraîchissement';
            setError(errorMessage);

            // Ne pas afficher d'erreur si l'utilisateur a quitté la room
            if (!err.message?.includes('quitté')) {
                showError(errorMessage);
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [roomCode, showError]);

    // Démarrer la partie
    const startGame = useCallback(async (): Promise<boolean> => {
        if (!currentRoom || !isHost) {
            showError('Vous n\'êtes pas autorisé à démarrer cette partie');
            return false;
        }

        if (!canStart) {
            showWarning('Conditions non remplies pour démarrer la partie');
            return false;
        }

        try {
            // CORRECTION: startGame retourne void, pas un objet avec success/message
            await multiplayerService.startGame(currentRoom.room_code);

            showSuccess('🚀 Partie démarrée !');
            await refreshRoom(); // Rafraîchir l'état
            return true;

        } catch (error: any) {
            console.error('Erreur démarrage partie:', error);
            showError(error.message || 'Impossible de démarrer la partie');
            return false;
        }
    }, [currentRoom, isHost, canStart, showError, showWarning, showSuccess, refreshRoom]);

    // Quitter la room
    const leaveRoom = useCallback(async () => {
        if (!roomCode) return;

        try {
            await multiplayerService.leaveRoom(roomCode);

            // Nettoyer l'état local
            setCurrentRoom(null);
            setPlayers([]);
            setError(null);

            showSuccess('Vous avez quitté la partie');
        } catch (error: any) {
            console.error('Erreur quitter room:', error);
            showError(error.message || 'Erreur lors de la sortie de la partie');
        }
    }, [roomCode, showSuccess, showError]);

    // CORRECTION: Faire une tentative avec conversion de type
    const makeAttempt = useCallback(async (
        combination: number[]
    ): Promise<MultiplayerAttemptResponse | null> => {
        if (!currentRoom || !currentPlayer) {
            showError('Partie non active');
            return null;
        }

        if (!Array.isArray(combination) || combination.length === 0) {
            showError('Combinaison invalide');
            return null;
        }

        try {
            // Créer la requête d'attempt avec le format correct
            const attemptRequest: any = {
                combination,
                room_code: currentRoom.room_code,
                mastermind_number: (currentPlayer.current_mastermind as number) || 1
            };

            // CORRECTION: Le service retourne AttemptResult, on le convertit
            const result = await multiplayerService.makeAttempt(
                currentRoom.room_code,
                attemptRequest
            );

            if (result) {
                // CONVERSION: AttemptResult vers MultiplayerAttemptResponse
                const convertedResult: MultiplayerAttemptResponse = {
                    attempt: {
                        id: (result as any).id || 'temp-id',
                        combination: (result as any).combination || combination,
                        correct_positions: (result as any).correct_positions || 0,
                        correct_colors: (result as any).correct_colors || 0,
                        attempt_number: (result as any).attempt_number || 1,
                        attempt_score: (result as any).score || 0,
                        is_correct: (result as any).is_correct || false,
                        created_at: new Date().toISOString(),
                        time_taken: (result as any).time_taken
                    },
                    mastermind_completed: (result as any).is_correct || false,
                    score: (result as any).score || 0,
                    // Propriétés ajoutées pour compatibilité
                    is_correct: (result as any).is_correct || false,
                    correct_positions: (result as any).correct_positions || 0,
                    correct_colors: (result as any).correct_colors || 0
                };

                // Rafraîchir l'état des joueurs après la tentative
                await refreshRoom();
                return convertedResult;
            }

            return null;
        } catch (error: any) {
            console.error('Erreur tentative:', error);
            showError(error.message || 'Erreur lors de la tentative');
            return null;
        }
    }, [currentRoom, currentPlayer, showError, refreshRoom]);

    // Effet pour le chargement initial
    useEffect(() => {
        if (roomCode) {
            setLoading(true);
            refreshRoom();
        }
    }, [roomCode, refreshRoom]);

    // Effet pour le rafraîchissement automatique
    useEffect(() => {
        if (!autoRefresh || !roomCode || !mountedRef.current) return;

        refreshIntervalRef.current = setInterval(() => {
            if (mountedRef.current) {
                refreshRoom();
            }
        }, refreshInterval);

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
                refreshIntervalRef.current = null;
            }
        };
    }, [autoRefresh, roomCode, refreshInterval, refreshRoom]);

    // Nettoyage à la déconnexion du composant
    useEffect(() => {
        return () => {
            mountedRef.current = false;
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, []);

    return {
        // État de la room
        currentRoom,
        players,
        loading,
        error,

        // État du jeu
        isGameActive,
        isGameFinished,
        canStart,

        // Joueur actuel
        currentPlayer,
        isHost,

        // Actions
        refreshRoom,
        startGame,
        leaveRoom,
        makeAttempt,

        // Statistiques
        stats
    };
};

export default useMultiplayer;