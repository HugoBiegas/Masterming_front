// src/hooks/useMultiplayer.ts - Hook pour gérer l'état multiplayer
import { useState, useEffect, useCallback, useRef } from 'react';
import { GameRoom, GameResults, PlayerProgress, CreateRoomRequest, JoinRoomRequest } from '@/types/multiplayer';
import { AttemptRequest, AttemptResult } from '@/types/game';
import { multiplayerService } from '@/services/multiplayer';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';

interface UseMultiplayerReturn {
    // Room state
    currentRoom: GameRoom | null;
    players: PlayerProgress[];
    gameResults: GameResults | null;

    // Loading states
    loading: boolean;
    joining: boolean;
    starting: boolean;
    makingAttempt: boolean;

    // Error state
    error: string | null;

    // Actions
    createRoom: (request: CreateRoomRequest) => Promise<GameRoom | null>;
    joinRoom: (request: JoinRoomRequest) => Promise<GameRoom | null>;
    leaveRoom: () => Promise<void>;
    startGame: () => Promise<void>;
    makeAttempt: (attempt: AttemptRequest) => Promise<AttemptResult | null>;
    refreshRoom: () => Promise<void>;
    clearError: () => void;

    // Utilities
    isHost: boolean;
    currentPlayer: PlayerProgress | null;
    canStart: boolean;
    isGameActive: boolean;
    isGameFinished: boolean;
}

export const useMultiplayer = (initialRoomCode?: string): UseMultiplayerReturn => {
    const { user } = useAuth();
    const { showError, showSuccess } = useNotification();

    // États du hook
    const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
    const [players, setPlayers] = useState<PlayerProgress[]>([]);
    const [gameResults, setGameResults] = useState<GameResults | null>(null);

    // États de chargement
    const [loading, setLoading] = useState(false);
    const [joining, setJoining] = useState(false);
    const [starting, setStarting] = useState(false);
    const [makingAttempt, setMakingAttempt] = useState(false);

    // État d'erreur
    const [error, setError] = useState<string | null>(null);

    // Refs pour éviter les appels multiples et gérer les intervalles
    const isRefreshing = useRef(false);
    const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const stopAutoRefresh = useCallback(() => {
        if (autoRefreshIntervalRef.current) {
            clearInterval(autoRefreshIntervalRef.current);
            autoRefreshIntervalRef.current = null;
        }
    }, []);

    // CORRECTION: Refresh du salon avec protection contre les appels multiples
    const refreshRoom = useCallback(async () => {
        if (!initialRoomCode || !user || isRefreshing.current) return;

        isRefreshing.current = true;

        try {
            setError(null);

            // Récupérer les détails de la room
            const roomData = await multiplayerService.getRoomDetails(initialRoomCode);

            // CORRECTION: Ne pas arrêter le refresh si la partie est cancelled temporairement
            if (roomData.status === 'cancelled' && roomData.current_players > 0) {
                console.log('Partie cancelled mais avec joueurs, continue le refresh...');
            }

            setCurrentRoom(roomData);

            // Récupérer les joueurs
            try {
                const playersData = await multiplayerService.getPlayerProgress(initialRoomCode);
                setPlayers(playersData);
            } catch (playersError) {
                console.warn('Impossible de récupérer les joueurs:', playersError);
                setPlayers([]);
            }

        } catch (err: any) {
            console.error('Erreur refresh room:', err);

            // CORRECTION: Ne arrêter le refresh que si 404 confirmé
            if (err.response?.status === 404) {
                stopAutoRefresh();
                setError('Cette partie n\'existe plus.');
            } else {
                // Pour les autres erreurs, continuer le refresh
                console.warn('Erreur temporaire, continue le refresh...');
            }
        } finally {
            isRefreshing.current = false;
        }
    }, [initialRoomCode, user, stopAutoRefresh]);

    const startAutoRefresh = useCallback(() => {
        refreshRoom();

        // CORRECTION: Intervalle basé sur le statut de la room
        const getRefreshInterval = () => {
            if (!currentRoom) return 8000;

            switch (currentRoom.status) {
                case 'waiting': return 5000;    // 5s en attente
                case 'starting': return 2000;   // 2s au démarrage
                case 'active': return 3000;     // 3s pendant la partie
                case 'finished':
                case 'cancelled': return 15000; // 15s pour les parties terminées
                default: return 8000;
            }
        };

        autoRefreshIntervalRef.current = setInterval(refreshRoom, getRefreshInterval());
    }, [refreshRoom, currentRoom]);


    // Créer un salon
    const createRoom = useCallback(async (request: CreateRoomRequest): Promise<GameRoom | null> => {
        try {
            setLoading(true);
            setError(null);

            const room = await multiplayerService.createRoom(request);
            setCurrentRoom(room);

            showSuccess(`✅ Salon "${room.name}" créé avec succès !`);
            startAutoRefresh();

            return room;
        } catch (err: any) {
            const errorMessage = multiplayerService.handleMultiplayerError(err, 'createRoom');
            setError(errorMessage);
            showError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, [showError, showSuccess, startAutoRefresh]);

    // Rejoindre un salon
    const joinRoom = useCallback(async (request: JoinRoomRequest): Promise<GameRoom | null> => {
        try {
            setJoining(true);
            setError(null);

            const room = await multiplayerService.joinRoom(request);
            setCurrentRoom(room);

            showSuccess(`✅ Vous avez rejoint le salon "${room.name}" !`);
            startAutoRefresh();

            return room;
        } catch (err: any) {
            const errorMessage = multiplayerService.handleMultiplayerError(err, 'joinRoom');
            setError(errorMessage);
            showError(errorMessage);
            return null;
        } finally {
            setJoining(false);
        }
    }, [showError, showSuccess, startAutoRefresh]);

    // Quitter un salon
    const leaveRoom = useCallback(async () => {
        if (!currentRoom) return;

        try {
            setLoading(true);

            // CORRECTION: Utiliser la méthode corrigée
            await multiplayerService.leaveRoom(currentRoom.room_code);

            setCurrentRoom(null);
            setPlayers([]);
            setGameResults(null);
            stopAutoRefresh();

            showSuccess('👋 Vous avez quitté le salon');
        } catch (err: any) {
            // CORRECTION: Ne pas montrer l'erreur à l'utilisateur, il a quitté quand même
            console.warn('Erreur lors de la sortie (ignorée):', err);

            // Quitter quand même côté frontend
            setCurrentRoom(null);
            setPlayers([]);
            setGameResults(null);
            stopAutoRefresh();

            showSuccess('👋 Vous avez quitté le salon');
        } finally {
            setLoading(false);
        }
    }, [currentRoom, showSuccess, stopAutoRefresh]);

    // Démarrer la partie
    const startGame = useCallback(async () => {
        if (!currentRoom) return;

        try {
            setStarting(true);
            setError(null);

            await multiplayerService.startGame(currentRoom.room_code);

            showSuccess('🚀 Partie démarrée !');
            setTimeout(refreshRoom, 1000); // Refresh après 1 seconde
        } catch (err: any) {
            const errorMessage = multiplayerService.handleMultiplayerError(err, 'startGame');
            setError(errorMessage);
            showError(errorMessage);
        } finally {
            setStarting(false);
        }
    }, [currentRoom, showError, showSuccess, refreshRoom]);

    // Faire une tentative
    const makeAttempt = useCallback(async (attempt: AttemptRequest): Promise<AttemptResult | null> => {
        if (!currentRoom) return null;

        try {
            setMakingAttempt(true);
            setError(null);

            const result = await multiplayerService.makeAttempt(currentRoom.room_code, attempt);
            setTimeout(refreshRoom, 1000); // Refresh après 1 seconde

            return result;
        } catch (err: any) {
            const errorMessage = multiplayerService.handleMultiplayerError(err, 'makeAttempt');
            setError(errorMessage);
            showError(errorMessage);
            return null;
        } finally {
            setMakingAttempt(false);
        }
    }, [currentRoom, showError, refreshRoom]);

    // Auto-join si room code fourni
    useEffect(() => {
        if (initialRoomCode && !currentRoom && user) {
            startAutoRefresh();
        }
    }, [initialRoomCode, currentRoom, user, startAutoRefresh]);

    // Nettoyage à la déconnexion
    useEffect(() => {
        return () => {
            stopAutoRefresh();
        };
    }, [stopAutoRefresh]);

    // CORRECTION: Computed values avec vérifications robustes
    const isHost = currentRoom?.creator.id === user?.id;
    const currentPlayer = players.find(p => p.user_id === user?.id) || null;
    const canStart = currentRoom && user
        ? multiplayerService.canStartGame(currentRoom, user.id)
        : false;
    const isGameActive = currentRoom ? multiplayerService.isGameActive(currentRoom) : false;
    const isGameFinished = currentRoom ? multiplayerService.isGameFinished(currentRoom) : false;

    return {
        // Room state
        currentRoom,
        players,
        gameResults,

        // Loading states
        loading,
        joining,
        starting,
        makingAttempt,

        // Error state
        error,

        // Actions
        createRoom,
        joinRoom,
        leaveRoom,
        startGame,
        makeAttempt,
        refreshRoom,
        clearError,

        // Utilities
        isHost,
        currentPlayer,
        canStart,
        isGameActive,
        isGameFinished
    };
};