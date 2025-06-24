// =============================================================================
// CORRECTION DU HOOK USEMULTIPLAYER
// =============================================================================

// src/hooks/useMultiplayer.ts
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

    // Refs pour éviter les fuites mémoire et les dépendances circulaires
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const mountedRef = useRef(true);
    const isRefreshingRef = useRef(false); // NOUVEAU: Éviter les appels multiples

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
        finishedPlayers: players.filter(p =>
            p.status === 'finished'
        ).length
    };

    // CORRECTION: Rafraîchir les données de la room sans dépendances circulaires
    const refreshRoom = useCallback(async () => {
        if (!roomCode || !mountedRef.current || isRefreshingRef.current) {
            return;
        }

        try {
            isRefreshingRef.current = true; // NOUVEAU: Bloquer les appels concurrents
            setError(null);

            console.log('🔄 Refreshing room:', roomCode);

            // Récupérer les détails de la room
            const roomData = await multiplayerService.getRoomDetails(roomCode);
            if (!mountedRef.current) return;

            if (roomData) {
                setCurrentRoom(roomData);
                console.log('✅ Room data updated:', roomData);
            }

            // Récupérer la liste des joueurs
            const playersData = await multiplayerService.getPlayerProgress(roomCode);
            if (!mountedRef.current) return;

            if (Array.isArray(playersData)) {
                setPlayers(playersData);
                console.log('✅ Players data updated:', playersData.length, 'players');
            }

        } catch (err: any) {
            if (!mountedRef.current) return;

            console.error('❌ Erreur rafraîchissement room:', err);
            const errorMessage = err.message || 'Erreur lors du rafraîchissement';
            setError(errorMessage);

            // Ne pas afficher d'erreur si l'utilisateur a quitté la room
            if (!err.message?.includes('quitté') && !err.message?.includes('not found')) {
                showError(errorMessage);
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
                isRefreshingRef.current = false; // NOUVEAU: Débloquer les appels
            }
        }
    }, [roomCode, showError]); // CORRECTION: Dépendances minimales

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

    // Faire une tentative avec conversion de type
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

    // CORRECTION: Effet pour le chargement initial - compatible StrictMode
    useEffect(() => {
        if (!roomCode) return;

        let cancelled = false;

        const loadInitialData = async () => {
            if (isRefreshingRef.current || cancelled) return;

            console.log('🔄 Initial room load for:', roomCode);
            setLoading(true);
            setError(null);

            try {
                isRefreshingRef.current = true;

                // Récupérer les détails de la room
                const roomData = await multiplayerService.getRoomDetails(roomCode);
                if (cancelled || !mountedRef.current) return;

                if (roomData) {
                    setCurrentRoom(roomData);
                    console.log('✅ Initial room data loaded:', roomData);
                }

                // Récupérer la liste des joueurs
                const playersData = await multiplayerService.getPlayerProgress(roomCode);
                if (cancelled || !mountedRef.current) return;

                if (Array.isArray(playersData)) {
                    setPlayers(playersData);
                    console.log('✅ Initial players data loaded:', playersData.length, 'players');
                }

            } catch (err: any) {
                if (cancelled || !mountedRef.current) return;

                console.error('❌ Erreur chargement initial:', err);
                const errorMessage = err.message || 'Erreur lors du chargement';
                setError(errorMessage);

                if (!err.message?.includes('quitté') && !err.message?.includes('not found')) {
                    showError(errorMessage);
                }
            } finally {
                if (!cancelled && mountedRef.current) {
                    setLoading(false);
                    isRefreshingRef.current = false;
                }
            }
        };

        loadInitialData();

        // Cleanup pour StrictMode
        return () => {
            cancelled = true;
        };
    }, [roomCode, showError]);

    // CORRECTION: Effet pour le rafraîchissement automatique - compatible StrictMode
    useEffect(() => {
        if (!autoRefresh || !roomCode) return;

        let timeoutId: NodeJS.Timeout;
        let intervalId: NodeJS.Timeout;

        console.log('⏰ Setting up auto-refresh for room:', roomCode);

        // Fonction pour démarrer le rafraîchissement automatique
        const startAutoRefresh = () => {
            intervalId = setInterval(() => {
                if (mountedRef.current && !isRefreshingRef.current && currentRoom) {
                    console.log('⏰ Auto-refresh triggered');
                    refreshRoom();
                }
            }, refreshInterval);

            // Stocker la référence pour le cleanup
            refreshIntervalRef.current = intervalId;
        };

        // Attendre que le chargement initial soit terminé avant de démarrer l'auto-refresh
        const checkAndStartAutoRefresh = () => {
            if (currentRoom && !loading) {
                startAutoRefresh();
            } else {
                // Réessayer dans 1 seconde si pas encore prêt
                timeoutId = setTimeout(checkAndStartAutoRefresh, 1000);
            }
        };

        // Démarrer après un petit délai pour éviter les conflits
        timeoutId = setTimeout(checkAndStartAutoRefresh, 2000);

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            if (intervalId) {
                clearInterval(intervalId);
            }
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
                refreshIntervalRef.current = null;
            }
        };
    }, [autoRefresh, roomCode, refreshInterval, currentRoom, loading]);

    // Nettoyage à la déconnexion du composant
    useEffect(() => {
        return () => {
            console.log('🧹 Cleaning up useMultiplayer');
            mountedRef.current = false;
            isRefreshingRef.current = false;
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