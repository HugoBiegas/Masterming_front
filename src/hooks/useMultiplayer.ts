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

    // Refs pour éviter les appels multiples
    const isRefreshing = useRef(false);
    const refreshInterval = useRef<NodeJS.Timeout | null>(null);

    const clearError = useCallback(() => {
        setError(null);
    }, []);


    const stopAutoRefresh = useCallback(() => {
        if (autoRefreshIntervalRef.current) {
            clearInterval(autoRefreshIntervalRef.current);
            autoRefreshIntervalRef.current = null;
        }
    }, []);

    // Refresh du salon
    const refreshRoom = useCallback(async () => {
        if (!initialRoomCode || !user) return;

        try {
            setLoading(true);
            setError(null);

            // CORRECTION: Utiliser getRoomDetails avec roomCode
            const roomData = await multiplayerService.getRoomDetails(initialRoomCode);
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
            const errorMessage = multiplayerService.handleMultiplayerError(err, 'refreshRoom');
            setError(errorMessage);
            console.error('Erreur refresh room:', err);
        } finally {
            setLoading(false);
        }
    }, [initialRoomCode, user]);

    // Auto-refresh du salon quand il est actif
    const startAutoRefresh = useCallback(() => {
        // Refresh initial
        refreshRoom();

        // Refresh périodique toutes les 3 secondes
        autoRefreshIntervalRef.current = setInterval(refreshRoom, 3000);
    }, [refreshRoom]);

    const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

            await multiplayerService.leaveRoom(currentRoom.room_code);

            setCurrentRoom(null);
            setPlayers([]);
            setGameResults(null);
            stopAutoRefresh();

            showSuccess('👋 Vous avez quitté le salon');
        } catch (err: any) {
            const errorMessage = multiplayerService.handleMultiplayerError(err, 'leaveRoom');
            showError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [currentRoom, showError, showSuccess, stopAutoRefresh]);

    // Démarrer la partie
    const startGame = useCallback(async () => {
        if (!currentRoom) return;

        try {
            setStarting(true);
            setError(null);

            await multiplayerService.startGame(currentRoom.room_code);

            showSuccess('🚀 Partie démarrée !');

            // Refresh immédiat pour récupérer le nouvel état
            setTimeout(refreshRoom, 500);
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

            // Refresh immédiat pour récupérer le nouvel état
            setTimeout(refreshRoom, 500);

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
            // Si on a un roomCode, rejoindre automatiquement ou récupérer les détails
            refreshRoom();
            startAutoRefresh();
        }
    }, [initialRoomCode, currentRoom, user, refreshRoom, startAutoRefresh]);

    // Nettoyage à la déconnexion
    useEffect(() => {
        return () => {
            stopAutoRefresh();
        };
    }, [stopAutoRefresh]);

    // Computed values
    const isHost = currentRoom?.creator.id === user?.id;
    const currentPlayer = players.find(p => p.user_id === user?.id) || null;
    const canStart = isHost &&
        currentRoom?.status === 'waiting' &&
        currentRoom.current_players >= 2;
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