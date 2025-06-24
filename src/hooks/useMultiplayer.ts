// src/hooks/useMultiplayer.ts - CORRECTION FINALE des boucles infinies
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

    // États principaux
    const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
    const [players, setPlayers] = useState<PlayerProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Refs pour la gestion lifecycle - CORRECTION: Plus simples et robustes
    const isMountedRef = useRef(true);
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isLoadingRef = useRef(false);
    const roomCodeRef = useRef<string | undefined>(undefined);

    // CORRECTION: Synchronisation du roomCode avec la ref
    useEffect(() => {
        roomCodeRef.current = roomCode;
    }, [roomCode]);

    // États calculés
    const isGameActive = currentRoom?.status === 'active';
    const isGameFinished = currentRoom?.status === 'finished';
    const currentPlayer = players.find(p => p.user_id === user?.id) || null;
    const isHost = currentRoom?.creator?.id === user?.id;
    const canStart = isHost &&
        currentRoom?.status === 'waiting' &&
        players.length >= 2 &&
        players.length <= (currentRoom?.max_players || 50);

    // Statistiques
    const stats = {
        connectedPlayers: players.filter(p =>
            p.status !== 'disconnected' && p.status !== 'eliminated'
        ).length,
        readyPlayers: players.filter(p => p.is_ready).length,
        finishedPlayers: players.filter(p => p.status === 'finished').length
    };

    // CORRECTION: Fonction de refresh simplifiée et bullet-proof
    const refreshRoom = useCallback(async () => {
        // CORRECTION: Utiliser la ref pour éviter les stale closures
        const currentRoomCode = roomCodeRef.current;

        if (!currentRoomCode || !isMountedRef.current || isLoadingRef.current) {
            console.log('❌ Cannot refresh: roomCode missing or component unmounted or already loading');
            return;
        }

        try {
            isLoadingRef.current = true;
            console.log('🔄 Refreshing room:', currentRoomCode);

            // Paralléliser les requêtes avec timeout
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 10000)
            );

            const roomPromise = multiplayerService.getRoomDetails(currentRoomCode);
            const playersPromise = multiplayerService.getPlayerProgress(currentRoomCode);

            const [roomData, playersData] = await Promise.race([
                Promise.all([roomPromise, playersPromise]),
                timeoutPromise
            ]) as [any, any];

            // Vérifier si le composant est toujours monté et sur la même room
            if (!isMountedRef.current || roomCodeRef.current !== currentRoomCode) {
                console.log('🚫 Component unmounted or room changed during refresh');
                return;
            }

            // Mise à jour de l'état seulement si on a des données valides
            if (roomData) {
                setCurrentRoom(roomData);
                console.log('✅ Room data updated:', roomData.room_code, 'status:', roomData.status);
            }

            if (Array.isArray(playersData)) {
                setPlayers(playersData);
                console.log('✅ Players data updated:', playersData.length, 'players');
            }

            // Nettoyer les erreurs si succès
            setError(null);

        } catch (err: any) {
            console.error('❌ Erreur rafraîchissement room:', err);

            if (isMountedRef.current && roomCodeRef.current === currentRoomCode) {
                const errorMessage = err.message || 'Erreur lors du rafraîchissement';

                // Ne pas afficher d'erreur pour les timeouts ou les rooms qui n'existent plus
                if (!errorMessage.includes('Timeout') &&
                    !errorMessage.includes('not found') &&
                    !errorMessage.includes('404')) {
                    setError(errorMessage);
                    showError(errorMessage);
                }
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
                isLoadingRef.current = false;
            }
        }
    }, []); // CORRECTION: Pas de dépendances pour éviter les re-créations

    // CORRECTION: Chargement initial SANS dépendances circulaires
    useEffect(() => {
        if (!roomCode) {
            setLoading(false);
            return;
        }

        console.log('🔄 Starting initial room load for:', roomCode);
        setLoading(true);
        setError(null);

        // Appel initial
        refreshRoom();

    }, [roomCode]); // UNIQUEMENT roomCode comme dépendance

    // CORRECTION: Auto-refresh séparé et plus simple
    useEffect(() => {
        if (!autoRefresh || !roomCode || loading) {
            return;
        }

        console.log('⏰ Setting up auto-refresh for room:', roomCode);

        const interval = setInterval(() => {
            if (isMountedRef.current && roomCodeRef.current && !isLoadingRef.current) {
                refreshRoom();
            }
        }, refreshInterval);

        refreshIntervalRef.current = interval;

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [roomCode, autoRefresh, refreshInterval, loading]); // Dépendances stables

    // Actions du jeu
    const startGame = useCallback(async (): Promise<boolean> => {
        if (!currentRoom || !isHost || !canStart) {
            showError('Vous n\'êtes pas autorisé à démarrer cette partie');
            return false;
        }

        try {
            console.log('🚀 Starting game for room:', currentRoom.room_code);
            await multiplayerService.startGame(currentRoom.room_code);
            showSuccess('🚀 Partie démarrée !');

            // Refresh immédiat
            setTimeout(() => {
                if (isMountedRef.current) {
                    refreshRoom();
                }
            }, 1000);

            return true;
        } catch (error: any) {
            console.error('❌ Erreur démarrage partie:', error);
            showError(error.message || 'Impossible de démarrer la partie');
            return false;
        }
    }, [currentRoom, isHost, canStart, showError, showSuccess, refreshRoom]);

    const leaveRoom = useCallback(async () => {
        if (!roomCode) return;

        try {
            console.log('🚪 Leaving room:', roomCode);
            await multiplayerService.leaveRoom(roomCode);

            // Nettoyer l'état local
            setCurrentRoom(null);
            setPlayers([]);
            setError(null);
            setLoading(false);

            showSuccess('Vous avez quitté la partie');
        } catch (error: any) {
            console.error('❌ Erreur quitter room:', error);
            showError(error.message || 'Erreur lors de la sortie de la partie');
        }
    }, [roomCode, showSuccess, showError]);

    const makeAttempt = useCallback(async (
        combination: number[]
    ): Promise<MultiplayerAttemptResponse | null> => {
        if (!currentRoom || !currentPlayer) {
            showError('Partie non active');
            return null;
        }

        try {
            const attemptRequest: any = {
                combination,
                room_code: currentRoom.room_code,
                mastermind_number: (currentPlayer.current_mastermind as number) || 1
            };

            const result = await multiplayerService.makeAttempt(
                currentRoom.room_code,
                attemptRequest
            );

            if (result) {
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
                    is_correct: (result as any).is_correct || false,
                    correct_positions: (result as any).correct_positions || 0,
                    correct_colors: (result as any).correct_colors || 0
                };

                // Refresh après tentative
                setTimeout(() => {
                    if (isMountedRef.current) {
                        refreshRoom();
                    }
                }, 500);

                return convertedResult;
            }
            return null;
        } catch (error: any) {
            console.error('❌ Erreur tentative:', error);
            showError(error.message || 'Erreur lors de la tentative');
            return null;
        }
    }, [currentRoom, currentPlayer, showError, refreshRoom]);

    // CORRECTION: Cleanup au démontage - Plus simple et efficace
    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            console.log('🧹 Cleaning up useMultiplayer hook');
            isMountedRef.current = false;
            isLoadingRef.current = false;

            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
                refreshIntervalRef.current = null;
            }
        };
    }, []);

    return {
        currentRoom,
        players,
        loading,
        error,
        isGameActive,
        isGameFinished,
        canStart,
        currentPlayer,
        isHost,
        refreshRoom,
        startGame,
        leaveRoom,
        makeAttempt,
        stats
    };
};

export default useMultiplayer;