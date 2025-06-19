// src/hooks/useMultiplayer.ts
// Hook pour gérer l'état multijoueur avec WebSockets temps réel

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    MultiplayerGame,
    PlayerProgress,
    GameMastermind,
    PlayerItem,
    ItemType,
    PlayerStatus,
    MultiplayerWebSocketEvents,
    UseMultiplayerGameReturn,
    JoinGameRequest
} from '@/types/multiplayer';
import { multiplayerService } from '@/services/multiplayer';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';

interface WebSocketMessage {
    type: string;
    data: any;
    timestamp?: number;
}

export const useMultiplayer = (gameId?: string): UseMultiplayerGameReturn => {
    const { user } = useAuth();
    const { showSuccess, showError, showWarning, showInfo } = useNotification();

    // États principaux
    const [multiplayerGame, setMultiplayerGame] = useState<MultiplayerGame | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // WebSocket
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    // Effets actifs (freeze time, etc.)
    const [activeEffects, setActiveEffects] = useState<{
        [key: string]: {
            type: ItemType;
            endTime: number;
            message: string;
        }
    }>({});

    // === WEBSOCKET MANAGEMENT ===

    const connectWebSocket = useCallback(() => {
        if (!gameId || !user?.access_token) return;

        try {
            const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/multiplayer/${gameId}`;
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log('🔗 WebSocket connecté pour le multijoueur');
                setIsConnected(true);
                reconnectAttempts.current = 0;

                // Authentification
                wsRef.current?.send(JSON.stringify({
                    type: 'authenticate',
                    data: { token: user.access_token }
                }));
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    handleWebSocketMessage(message);
                } catch (err) {
                    console.error('❌ Erreur parsing WebSocket message:', err);
                }
            };

            wsRef.current.onclose = () => {
                console.log('🔌 WebSocket déconnecté');
                setIsConnected(false);

                // Tentative de reconnexion automatique
                if (reconnectAttempts.current < maxReconnectAttempts) {
                    reconnectAttempts.current++;
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log(`🔄 Tentative de reconnexion ${reconnectAttempts.current}/${maxReconnectAttempts}`);
                        connectWebSocket();
                    }, delay);
                }
            };

            wsRef.current.onerror = (error) => {
                console.error('❌ Erreur WebSocket:', error);
                setError('Connexion WebSocket interrompue');
            };

        } catch (err) {
            console.error('❌ Erreur connexion WebSocket:', err);
            setError('Impossible de se connecter au serveur');
        }
    }, [gameId, user?.access_token]);

    const disconnectWebSocket = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
    }, []);

    // === GESTION DES MESSAGES WEBSOCKET ===

    const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
        console.log('📨 Message WebSocket reçu:', message.type, message.data);

        switch (message.type) {
            case 'authentication_success':
                showSuccess('Connecté au multijoueur');
                break;

            case 'authentication_failed':
                showError('Échec de l\'authentification multijoueur');
                break;

            case 'PLAYER_JOINED':
                handlePlayerJoined(message.data);
                break;

            case 'PLAYER_LEFT':
                handlePlayerLeft(message.data);
                break;

            case 'GAME_STARTED':
                handleGameStarted(message.data);
                break;

            case 'PLAYER_MASTERMIND_COMPLETE':
                handlePlayerMastermindComplete(message.data);
                break;

            case 'ITEM_USED':
                handleItemUsed(message.data);
                break;

            case 'EFFECT_APPLIED':
                handleEffectApplied(message.data);
                break;

            case 'PLAYER_STATUS_CHANGED':
                handlePlayerStatusChanged(message.data);
                break;

            case 'GAME_PROGRESS_UPDATE':
                handleGameProgressUpdate(message.data);
                break;

            case 'MULTIPLAYER_GAME_FINISHED':
                handleGameFinished(message.data);
                break;

            case 'error':
                showError(message.data.message || 'Erreur multijoueur');
                break;

            default:
                console.log('🔍 Message WebSocket non géré:', message.type);
        }
    }, [showSuccess, showError, showWarning, showInfo]);

    // === HANDLERS D'ÉVÉNEMENTS ===

    const handlePlayerJoined = useCallback((data: { username: string; players_count: number }) => {
        showInfo(`${data.username} a rejoint la partie (${data.players_count} joueurs)`);
        refreshGame();
    }, []);

    const handlePlayerLeft = useCallback((data: { username: string; players_count: number }) => {
        showWarning(`${data.username} a quitté la partie (${data.players_count} joueurs)`);
        refreshGame();
    }, []);

    const handleGameStarted = useCallback((data: any) => {
        showSuccess('La partie multijoueur a commencé !');
        refreshGame();
    }, []);

    const handlePlayerMastermindComplete = useCallback((data: MultiplayerWebSocketEvents['PLAYER_MASTERMIND_COMPLETE']) => {
        const isMe = data.player_id === user?.id;

        if (isMe) {
            showSuccess(`Mastermind ${data.mastermind_number} terminé ! Score: ${data.score}`);
            if (data.items_obtained?.length > 0) {
                showInfo(`Objets obtenus: ${data.items_obtained.map(item => item.name).join(', ')}`);
            }
        } else {
            showInfo(`${data.username} a terminé le mastermind ${data.mastermind_number}`);
        }

        refreshGame();
    }, [user?.id]);

    const handleItemUsed = useCallback((data: MultiplayerWebSocketEvents['ITEM_USED']) => {
        const isMe = data.player_id === user?.id;
        const isTargetedAtMe = data.target_players?.includes(user?.id || '');

        if (isMe) {
            showSuccess(`Objet utilisé: ${data.item.name}`);
        } else if (isTargetedAtMe) {
            showWarning(`${data.username} a utilisé ${data.item.name} contre vous !`);
        } else {
            showInfo(`${data.username} a utilisé ${data.item.name}`);
        }
    }, [user?.id]);

    const handleEffectApplied = useCallback((data: MultiplayerWebSocketEvents['EFFECT_APPLIED']) => {
        const isAffected = data.affected_players.includes(user?.id || '');

        if (isAffected && data.duration) {
            // Ajouter l'effet actif
            const effectId = `${data.effect_type}_${Date.now()}`;
            setActiveEffects(prev => ({
                ...prev,
                [effectId]: {
                    type: data.effect_type,
                    endTime: Date.now() + ((data.duration ?? 0) * 1000),
                    message: data.message
                }
            }));

            // Programmer la suppression de l'effet
            setTimeout(() => {
                setActiveEffects(prev => {
                    const { [effectId]: removed, ...rest } = prev;
                    return rest;
                });
            }, data.duration * 1000);
        }

        showWarning(data.message);
    }, [user?.id]);

    const handlePlayerStatusChanged = useCallback((data: MultiplayerWebSocketEvents['PLAYER_STATUS_CHANGED']) => {
        refreshGame();
    }, []);

    const handleGameProgressUpdate = useCallback((data: MultiplayerWebSocketEvents['GAME_PROGRESS_UPDATE']) => {
        setMultiplayerGame(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                current_mastermind: data.current_mastermind,
                is_final_mastermind: data.is_final_mastermind,
                player_progresses: data.player_progresses
            };
        });
    }, []);

    const handleGameFinished = useCallback((data: MultiplayerWebSocketEvents['MULTIPLAYER_GAME_FINISHED']) => {
        const myPosition = data.final_leaderboard.find(p => p.user_id === user?.id)?.final_position;

        if (myPosition === 1) {
            showSuccess('🏆 Félicitations ! Vous avez gagné la partie !');
        } else if (myPosition && myPosition <= 3) {
            showSuccess(`🥉 Excellent ! Vous finissez ${myPosition}e !`);
        } else {
            showInfo(`Partie terminée ! Vous finissez ${myPosition}e`);
        }

        refreshGame();
    }, [user?.id]);

    // === ACTIONS PRINCIPALES ===

    const joinGame = useCallback(async (request: JoinGameRequest): Promise<boolean> => {
        try {
            setLoading(true);
            setError(null);

            const response = await multiplayerService.joinMultiplayerGame(request);

            if (response.success) {
                setMultiplayerGame(response.game);
                showSuccess('Partie rejointe avec succès !');
                return true;
            } else {
                setError(response.message);
                showError(response.message);
                return false;
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || 'Erreur lors de la connexion';
            setError(errorMessage);
            showError(errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    }, [showSuccess, showError]);

    const leaveGame = useCallback(async (): Promise<void> => {
        if (!gameId) return;

        try {
            await multiplayerService.leaveMultiplayerGame(gameId);
            disconnectWebSocket();
            setMultiplayerGame(null);
            showInfo('Partie quittée');
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || 'Erreur lors de la sortie';
            showError(errorMessage);
        }
    }, [gameId, disconnectWebSocket, showInfo, showError]);

    const useItem = useCallback(async (itemType: ItemType, targetPlayers?: string[]): Promise<boolean> => {
        if (!gameId) return false;

        try {
            const response = await multiplayerService.useItem(gameId, itemType, targetPlayers);

            if (response.success) {
                showSuccess(response.message);
                // La mise à jour se fera via WebSocket
                return true;
            } else {
                showError(response.message);
                return false;
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || 'Erreur lors de l\'utilisation de l\'objet';
            showError(errorMessage);
            return false;
        }
    }, [gameId, showSuccess, showError]);

    const getCurrentMastermind = useCallback((): GameMastermind | null => {
        if (!multiplayerGame) return null;
        return multiplayerGame.masterminds.find(m => m.is_active) || null;
    }, [multiplayerGame]);

    const getPlayerProgress = useCallback((userId: string): PlayerProgress | null => {
        if (!multiplayerGame) return null;
        return multiplayerGame.player_progresses.find(p => p.user_id === userId) || null;
    }, [multiplayerGame]);

    const getMyProgress = useCallback((): PlayerProgress | null => {
        if (!user?.id) return null;
        return getPlayerProgress(user.id);
    }, [user?.id, getPlayerProgress]);

    const refreshGame = useCallback(async (): Promise<void> => {
        if (!gameId) return;

        try {
            const updatedGame = await multiplayerService.getMultiplayerGame(gameId);
            setMultiplayerGame(updatedGame);
        } catch (err: any) {
            console.error('❌ Erreur refresh game:', err);
            // Ne pas afficher d'erreur pour les refresh automatiques
        }
    }, [gameId]);

    // === EFFETS ===

    // Charger la partie initiale
    useEffect(() => {
        if (gameId) {
            refreshGame();
        }
    }, [gameId, refreshGame]);

    // Gérer la connexion WebSocket
    useEffect(() => {
        if (gameId && user?.access_token) {
            connectWebSocket();
        }

        return () => {
            disconnectWebSocket();
        };
    }, [gameId, user?.access_token, connectWebSocket, disconnectWebSocket]);

    // Nettoyer les effets expirés
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setActiveEffects(prev => {
                const filtered = Object.fromEntries(
                    Object.entries(prev).filter(([_, effect]) => effect.endTime > now)
                );
                return filtered;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return {
        multiplayerGame,
        loading,
        error,
        joinGame,
        leaveGame,
        useItem,
        getCurrentMastermind,
        getPlayerProgress,
        getMyProgress,
        refreshGame
    };
};