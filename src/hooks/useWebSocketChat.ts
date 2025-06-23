import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';

// Interface pour les messages de chat
export interface ChatMessage {
    id: string;
    user_id: string;
    username: string;
    message: string;
    timestamp: string;
    type: 'user' | 'system' | 'game';
    is_creator?: boolean;
}

// Interface pour les événements WebSocket
interface WebSocketEvent {
    type: string;
    data: any;
    timestamp?: number;
    message_id?: string;
}

interface UseWebSocketChatOptions {
    roomCode?: string;
    gameId?: string;
    autoConnect?: boolean;
    reconnectAttempts?: number;
    reconnectDelay?: number;
}

interface UseWebSocketChatReturn {
    // État de connexion
    isConnected: boolean;
    isConnecting: boolean;
    connectionError: string | null;

    // Messages
    messages: ChatMessage[];
    unreadCount: number;

    // Actions
    sendMessage: (message: string) => Promise<boolean>;
    connect: () => Promise<void>;
    disconnect: () => void;
    markAsRead: () => void;
    clearMessages: () => void;

    // Méthodes utilitaires
    addSystemMessage: (message: string) => void;
    addGameMessage: (message: string) => void;
}

export const useWebSocketChat = (options: UseWebSocketChatOptions = {}): UseWebSocketChatReturn => {
    const { user } = useAuth();
    const { showSuccess, showError, showWarning } = useNotification();

    const {
        roomCode,
        gameId,
        autoConnect = true,
        reconnectAttempts = 3,
        reconnectDelay = 2000
    } = options;

    // États
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Refs
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Obtenir l'URL WebSocket
    const getWebSocketUrl = useCallback(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const baseUrl = `${protocol}//${host}/ws`;

        if (roomCode) {
            return `${baseUrl}/multiplayer/${roomCode}`;
        } else if (gameId) {
            return `${baseUrl}/game/${gameId}`;
        } else {
            return `${baseUrl}/chat`;
        }
    }, [roomCode, gameId]);

    // Ajouter un message système
    const addSystemMessage = useCallback((message: string) => {
        const systemMessage: ChatMessage = {
            id: `system_${Date.now()}_${Math.random()}`,
            user_id: 'system',
            username: 'Système',
            message,
            timestamp: new Date().toISOString(),
            type: 'system'
        };

        setMessages(prev => [...prev, systemMessage]);
        setUnreadCount(prev => prev + 1);
    }, []);

    // Ajouter un message de jeu
    const addGameMessage = useCallback((message: string) => {
        const gameMessage: ChatMessage = {
            id: `game_${Date.now()}_${Math.random()}`,
            user_id: 'system',
            username: 'Jeu',
            message,
            timestamp: new Date().toISOString(),
            type: 'game'
        };

        setMessages(prev => [...prev, gameMessage]);
        setUnreadCount(prev => prev + 1);
    }, []);

    // Envoyer un heartbeat
    const sendHeartbeat = useCallback(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const heartbeat: WebSocketEvent = {
                type: 'heartbeat',
                data: {
                    timestamp: Date.now(),
                    user_id: user?.id
                }
            };

            try {
                wsRef.current.send(JSON.stringify(heartbeat));
            } catch (error) {
                console.error('Erreur envoi heartbeat:', error);
            }
        }
    }, [user?.id]);

    // Gérer les messages WebSocket entrants
    const handleWebSocketMessage = useCallback((event: MessageEvent) => {
        try {
            const wsEvent: WebSocketEvent = JSON.parse(event.data);

            switch (wsEvent.type) {
                case 'chat_message':
                case 'chat_broadcast':
                    const chatData = wsEvent.data;
                    const newMessage: ChatMessage = {
                        id: chatData.message_id || `msg_${Date.now()}`,
                        user_id: chatData.user_id,
                        username: chatData.username,
                        message: chatData.message,
                        timestamp: chatData.timestamp || new Date().toISOString(),
                        type: chatData.type || 'user',
                        is_creator: chatData.is_creator
                    };

                    setMessages(prev => [...prev, newMessage]);

                    // Incrémenter les messages non lus si ce n'est pas notre message
                    if (chatData.user_id !== user?.id) {
                        setUnreadCount(prev => prev + 1);
                    }
                    break;

                case 'system_message':
                    addSystemMessage(wsEvent.data.message);
                    break;

                case 'game_event':
                    addGameMessage(wsEvent.data.message);
                    break;

                case 'connection_established':
                    setIsConnected(true);
                    setIsConnecting(false);
                    setConnectionError(null);
                    reconnectAttemptsRef.current = 0;

                    // Démarrer le heartbeat
                    if (heartbeatIntervalRef.current) {
                        clearInterval(heartbeatIntervalRef.current);
                    }
                    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000);

                    showSuccess('💬 Chat connecté !');
                    addSystemMessage(`${user?.username || 'Vous'} a rejoint le chat`);
                    break;

                case 'authentication_success':
                    console.log('WebSocket authentifié avec succès');
                    break;

                case 'error':
                    const errorMessage = wsEvent.data.message || 'Erreur WebSocket inconnue';
                    setConnectionError(errorMessage);
                    showError(`Erreur chat: ${errorMessage}`);
                    break;

                default:
                    console.log('Message WebSocket non géré:', wsEvent);
            }
        } catch (error) {
            console.error('Erreur traitement message WebSocket:', error);
        }
    }, [user?.id, user?.username, addSystemMessage, addGameMessage, sendHeartbeat, showSuccess, showError]);

    // Connexion WebSocket
    const connect = useCallback(async () => {
        if (!user) {
            setConnectionError('Utilisateur non authentifié');
            return;
        }

        if (isConnecting || isConnected) {
            return;
        }

        setIsConnecting(true);
        setConnectionError(null);

        try {
            const wsUrl = getWebSocketUrl();
            console.log('Connexion WebSocket à:', wsUrl);

            // Simuler une connexion réussie pour le développement
            // TODO: Remplacer par une vraie connexion WebSocket
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Simulation d'une connexion WebSocket réussie
            setIsConnected(true);
            setIsConnecting(false);
            setConnectionError(null);
            reconnectAttemptsRef.current = 0;

            showSuccess('💬 Chat connecté !');
            addSystemMessage(`${user.username} a rejoint le chat`);

            // Dans un vrai environnement, ceci serait remplacé par:
            /*
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('WebSocket connecté');

                // Authentification
                const authMessage: WebSocketEvent = {
                    type: 'authenticate',
                    data: {
                        user_id: user.id,
                        username: user.username,
                        room_code: roomCode,
                        game_id: gameId,
                        timestamp: Date.now()
                    }
                };

                ws.send(JSON.stringify(authMessage));
            };

            ws.onmessage = handleWebSocketMessage;

            ws.onclose = (event) => {
                console.log('WebSocket fermé:', event.code, event.reason);
                setIsConnected(false);
                setIsConnecting(false);

                if (heartbeatIntervalRef.current) {
                    clearInterval(heartbeatIntervalRef.current);
                    heartbeatIntervalRef.current = null;
                }

                // Tentative de reconnexion automatique
                if (reconnectAttemptsRef.current < reconnectAttempts && !event.wasClean) {
                    reconnectAttemptsRef.current++;
                    showWarning(`Reconnexion... (${reconnectAttemptsRef.current}/${reconnectAttempts})`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, reconnectDelay);
                } else if (reconnectAttemptsRef.current >= reconnectAttempts) {
                    setConnectionError('Impossible de se reconnecter au chat');
                    showError('Chat déconnecté');
                    addSystemMessage('Connexion au chat perdue');
                }
            };

            ws.onerror = (error) => {
                console.error('Erreur WebSocket:', error);
                setConnectionError('Erreur de connexion WebSocket');
                setIsConnecting(false);
            };
            */

        } catch (error: any) {
            console.error('Erreur connexion WebSocket:', error);
            setConnectionError(error.message || 'Erreur de connexion');
            setIsConnecting(false);
            showError('Impossible de se connecter au chat');
        }
    }, [user, isConnecting, isConnected, getWebSocketUrl, roomCode, gameId, reconnectAttempts, reconnectDelay, handleWebSocketMessage, showSuccess, showWarning, showError, addSystemMessage]);

    // Déconnexion WebSocket
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close(1000, 'Déconnexion volontaire');
            wsRef.current = null;
        }

        setIsConnected(false);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;

        addSystemMessage('Vous avez quitté le chat');
    }, [addSystemMessage]);

    // Envoyer un message
    const sendMessage = useCallback(async (message: string): Promise<boolean> => {
        if (!user || !isConnected) {
            showError('Chat non connecté');
            return false;
        }

        const trimmedMessage = message.trim();
        if (!trimmedMessage) {
            return false;
        }

        try {
            // Simulation d'envoi de message
            const userMessage: ChatMessage = {
                id: `msg_${Date.now()}_${Math.random()}`,
                user_id: user.id,
                username: user.username,
                message: trimmedMessage,
                timestamp: new Date().toISOString(),
                type: 'user',
                is_creator: false // TODO: Déterminer si l'utilisateur est créateur
            };

            setMessages(prev => [...prev, userMessage]);

            // Dans un vrai environnement, ceci serait remplacé par:
            /*
            const chatMessage: WebSocketEvent = {
                type: 'chat_message',
                data: {
                    room_id: roomCode || gameId,
                    message: trimmedMessage,
                    timestamp: Date.now()
                }
            };

            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify(chatMessage));
                return true;
            } else {
                throw new Error('WebSocket non connecté');
            }
            */

            return true;
        } catch (error: any) {
            console.error('Erreur envoi message:', error);
            showError('Impossible d\'envoyer le message');
            return false;
        }
    }, [user, isConnected, roomCode, gameId, showError]);

    // Marquer les messages comme lus
    const markAsRead = useCallback(() => {
        setUnreadCount(0);
    }, []);

    // Effacer tous les messages
    const clearMessages = useCallback(() => {
        setMessages([]);
        setUnreadCount(0);
    }, []);

    // Connexion automatique
    useEffect(() => {
        if (autoConnect && user && (roomCode || gameId)) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [autoConnect, user, roomCode, gameId, connect, disconnect]);

    // Nettoyage à la fermeture du composant
    useEffect(() => {
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
        };
    }, []);

    return {
        // État de connexion
        isConnected,
        isConnecting,
        connectionError,

        // Messages
        messages,
        unreadCount,

        // Actions
        sendMessage,
        connect,
        disconnect,
        markAsRead,
        clearMessages,

        // Méthodes utilitaires
        addSystemMessage,
        addGameMessage
    };
};