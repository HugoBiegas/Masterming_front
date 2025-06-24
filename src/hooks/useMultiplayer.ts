// src/hooks/useMultiplayer.ts - CORRECTION COMPLÈTE
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
    const isRefreshingRef = useRef(false);
    const hasInitialLoadRef = useRef(false); // NOUVEAU: Tracking du chargement initial

    // États calculés
    const isGameActive = currentRoom?.status === 'active';
    const isGameFinished = currentRoom?.status === 'finished';
    const currentPlayer = players.find(p => p.user_id === user?.id) || null;
    const isHost = currentRoom?.creator?.id === user?.id;
    const canStart = isHost &&
        currentRoom?.status === 'waiting' &&
        players.length >= 2 &&
        players.length <= (currentRoom?.max_players || 50); // CORRECTION: Limite augmentée

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

    // CORRECTION: Fonction de rafraîchissement simplifiée et robuste
    const refreshRoom = useCallback(async () => {
        if (!roomCode || !mountedRef.current) {
            console.log('❌ Cannot refresh: roomCode missing or component unmounted');
            return;
        }

        // CORRECTION: Éviter les appels concurrents avec un simple flag
        if (isRefreshingRef.current) {
            console.log('⚠️ Refresh already in progress, skipping');
            return;
        }

        try {
            isRefreshingRef.current = true;
            console.log('🔄 Refreshing room:', roomCode);

            // Paralléliser les requêtes pour plus de rapidité
            const [roomDataPromise, playersDataPromise] = [
                multiplayerService.getRoomDetails(roomCode).catch(err => {
                    console.error('❌ Error fetching room details:', err);
                    return null;
                }),
                multiplayerService.getPlayerProgress(roomCode).catch(err => {
                    console.error('❌ Error fetching players:', err);
                    return [];
                })
            ];

            const [roomData, playersData] = await Promise.all([roomDataPromise, playersDataPromise]);

            // Vérifier si le composant est toujours monté
            if (!mountedRef.current) {
                console.log('🚫 Component unmounted during refresh');
                return;
            }

            // CORRECTION: Toujours mettre à jour l'état, même en cas d'erreur partielle
            if (roomData) {
                setCurrentRoom(roomData);
                console.log('✅ Room data updated:', roomData.room_code, 'status:', roomData.status);
            }

            if (Array.isArray(playersData)) {
                setPlayers(playersData);
                console.log('✅ Players data updated:', playersData.length, 'players');
            }

            // CORRECTION: Nettoyer les erreurs si tout va bien
            if (roomData || (Array.isArray(playersData) && playersData.length >= 0)) {
                setError(null);
            }

        } catch (err: any) {
            console.error('❌ Erreur rafraîchissement room:', err);

            if (mountedRef.current) {
                const errorMessage = err.message || 'Erreur lors du rafraîchissement';
                setError(errorMessage);

                // Ne pas afficher d'erreur si l'utilisateur a quitté la room ou si la room n'existe plus
                if (!errorMessage.includes('quitté') &&
                    !errorMessage.includes('not found') &&
                    !errorMessage.includes('404')) {
                    showError(errorMessage);
                }
            }
        } finally {
            if (mountedRef.current) {
                // CORRECTION: Toujours arrêter le loading même en cas d'erreur
                setLoading(false);
                hasInitialLoadRef.current = true;
            }
            isRefreshingRef.current = false;
        }
    }, [roomCode, showError]);

    // CORRECTION: Chargement initial simplifié avec gestion d'erreur robuste
    useEffect(() => {
        if (!roomCode || hasInitialLoadRef.current) {
            return;
        }

        console.log('🔄 Starting initial room load for:', roomCode);

        // Reset l'état pour le chargement initial
        setLoading(true);
        setError(null);
        hasInitialLoadRef.current = false;

        // Démarrer le chargement initial
        refreshRoom();

        // Nettoyage si le composant se démonte pendant le chargement
        return () => {
            if (!hasInitialLoadRef.current) {
                console.log('🧹 Cleaning up initial load');
                mountedRef.current = false;
            }
        };
    }, [roomCode, refreshRoom]);

    // CORRECTION: Auto-refresh simplifié et plus stable
    useEffect(() => {
        if (!autoRefresh || !roomCode || loading || !hasInitialLoadRef.current) {
            return;
        }

        console.log('⏰ Setting up auto-refresh for room:', roomCode);

        const intervalId = setInterval(() => {
            if (mountedRef.current && !isRefreshingRef.current) {
                console.log('⏰ Auto-refresh triggered');
                refreshRoom();
            }
        }, refreshInterval);

        refreshIntervalRef.current = intervalId;

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
                refreshIntervalRef.current = null;
            }
        };
    }, [autoRefresh, roomCode, refreshInterval, loading, hasInitialLoadRef.current, refreshRoom]);

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
            console.log('🚀 Starting game for room:', currentRoom.room_code);
            await multiplayerService.startGame(currentRoom.room_code);
            showSuccess('🚀 Partie démarrée !');

            // Forcer un refresh immédiat pour obtenir le nouvel état
            setTimeout(() => {
                if (mountedRef.current) {
                    refreshRoom();
                }
            }, 1000);

            return true;

        } catch (error: any) {
            console.error('❌ Erreur démarrage partie:', error);
            showError(error.message || 'Impossible de démarrer la partie');
            return false;
        }
    }, [currentRoom, isHost, canStart, showError, showWarning, showSuccess, refreshRoom]);

    // Quitter la room
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

    // Faire une tentative
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
                // Conversion vers le format attendu
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

                // Rafraîchir l'état après la tentative
                setTimeout(() => {
                    if (mountedRef.current) {
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

    // Nettoyage au démontage
    useEffect(() => {
        return () => {
            console.log('🧹 Cleaning up useMultiplayer');
            mountedRef.current = false;
            isRefreshingRef.current = false;
            hasInitialLoadRef.current = false;

            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
                refreshIntervalRef.current = null;
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