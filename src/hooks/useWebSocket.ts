// src/hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import {MultiplayerWebSocketService} from "@/services/websocket";
import {ChatMessage} from "@/hooks/useWebSocketChat";

export const useWebSocket = (roomCode?: string) => {
    const { user } = useAuth();
    const { showError, showSuccess, showInfo } = useNotification();

    const [isConnected, setIsConnected] = useState(false);
    const [connectionState, setConnectionState] = useState<string>('disconnected');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

    const wsService = useRef<MultiplayerWebSocketService | null>(null);

    // Initialiser le service WebSocket
    useEffect(() => {
        if (!wsService.current) {
            wsService.current = new MultiplayerWebSocketService();

            // Écouter les événements de connexion
            wsService.current.on('connected', () => {
                setIsConnected(true);
                setConnectionState('connected');
                showSuccess('🔌 Connecté au salon');
            });

            wsService.current.on('disconnected', () => {
                setIsConnected(false);
                setConnectionState('disconnected');
                showError('🔌 Déconnecté du salon');
            });

            wsService.current.on('authentication_success', (data: { username: string }) => {
                showSuccess(`👤 Authentifié: ${data.username}`);
            });

            wsService.current.on('chat_message', (message: ChatMessage) => {
                setChatMessages(prev => [...prev, message]);
            });

            wsService.current.on('player_joined', (data: { username: string }) => {
                showInfo(`👤 ${data.username} a rejoint le salon`);

                // Ajouter un message système
                const systemMessage: ChatMessage = {
                    id: `system-${Date.now()}`,
                    user_id: 'system',
                    username: 'Système',
                    message: `${data.username} a rejoint le salon`,
                    timestamp: new Date().toISOString(),
                    type: 'system'
                };
                setChatMessages(prev => [...prev, systemMessage]);
            });

            wsService.current.on('player_left', (data: { username: string }) => {
                showInfo(`👤 ${data.username} a quitté le salon`);

                // Ajouter un message système
                const systemMessage: ChatMessage = {
                    id: `system-${Date.now()}`,
                    user_id: 'system',
                    username: 'Système',
                    message: `${data.username} a quitté le salon`,
                    timestamp: new Date().toISOString(),
                    type: 'system'
                };
                setChatMessages(prev => [...prev, systemMessage]);
            });

            wsService.current.on('game_started', (_data: unknown) => {
                showSuccess('🎮 La partie a commencé !');
            });

            wsService.current.on('error', (data: { error: string }) => {
                showError(`❌ Erreur: ${data.error}`);
            });
        }

        return () => {
            if (wsService.current) {
                wsService.current.disconnect();
            }
        };
    }, [showError, showSuccess, showInfo]);

    // Se connecter au WebSocket quand roomCode et user sont disponibles
    useEffect(() => {
        if (roomCode && user && wsService.current && !isConnected) {
            const token = localStorage.getItem('auth_token') || '';

            wsService.current.connect(roomCode, token)
                .then(() => {
                    console.log('✅ WebSocket connected successfully');

                    // Rejoindre automatiquement la room
                    setTimeout(() => {
                        wsService.current?.joinGameRoom();
                    }, 1000);
                })
                .catch((error) => {
                    console.error('❌ WebSocket connection failed:', error);
                    showError('Impossible de se connecter au salon');
                });
        }
    }, [roomCode, user, isConnected, showError]);

    // Méthodes pour interagir avec le WebSocket
    const sendChatMessage = useCallback((message: string) => {
        if (wsService.current && isConnected) {
            return wsService.current.sendChatMessage(message);
        }
        return false;
    }, [isConnected]);

    const startGame = useCallback((gameId: string) => {
        if (wsService.current && isConnected) {
            return wsService.current.startGame(gameId);
        }
        return false;
    }, [isConnected]);

    const makeAttempt = useCallback((gameId: string, combination: number[]) => {
        if (wsService.current && isConnected) {
            return wsService.current.makeAttempt(gameId, combination);
        }
        return false;
    }, [isConnected]);

    return {
        isConnected,
        connectionState,
        chatMessages,
        sendChatMessage,
        startGame,
        makeAttempt,
        wsService: wsService.current
    };
};

