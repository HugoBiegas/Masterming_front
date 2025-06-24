import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { WEBSOCKET_CONFIG, WEBSOCKET_EVENTS, SYSTEM_MESSAGES } from '@/utils/multiplayerConstants';

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

// Interface pour les événements de jeu
interface GameEvent {
    type: string;
    player_id?: string;
    username?: string;
    data?: any;
}

interface UseWebSocketChatOptions {
    roomCode?: string;
    gameId?: string;
    autoConnect?: boolean;
    reconnectAttempts?: number;
    reconnectDelay?: number;
    enableGameEvents?: boolean;
    enableChat?: boolean;
}

interface UseWebSocketChatReturn {
    // État de connexion
    isConnected: boolean;
    isConnecting: boolean;
    connectionError: string | null;
    connectionQuality: 'excellent' | 'good' | 'poor' | 'unknown';

    // Messages et événements
    messages: ChatMessage[];
    unreadCount: number;
    gameEvents: GameEvent[];

    // Actions
    sendMessage: (message: string) => Promise<boolean>;
    connect: () => Promise<void>;
    disconnect: () => void;
    markAsRead: () => void;
    clearMessages: () => void;
    clearGameEvents: () => void;

    // Méthodes utilitaires
    addSystemMessage: (message: string) => void;
    addGameMessage: (message: string) => void;

    // Statistiques de connexion
    stats: {
        messagesReceived: number;
        messagesSent: number;
        reconnectCount: number;
        uptime: number;
        lastHeartbeat: number | null;
    };
}

export const useWebSocketChat = (options: UseWebSocketChatOptions = {}): UseWebSocketChatReturn => {
    const { user } = useAuth();
    const { showSuccess, showError, showWarning, showInfo } = useNotification();

    const {
        roomCode,
        gameId,
        autoConnect = true,
        reconnectAttempts = WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS,
        reconnectDelay = WEBSOCKET_CONFIG.RECONNECT_DELAY,
        enableGameEvents = true,
        enableChat = true
    } = options;

    // États
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'unknown'>('unknown');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);

    // Statistiques
    const [stats, setStats] = useState({
        messagesReceived: 0,
        messagesSent: 0,
        reconnectCount: 0,
        uptime: 0,
        lastHeartbeat: null as number | null
    });

    // Refs
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const uptimeStartRef = useRef<number | null>(null);
    const lastPongRef = useRef<number>(0);

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

    // Envoyer un ping pour mesurer la latence
    const sendPing = useCallback(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const pingEvent: WebSocketEvent = {
                type: 'ping',
                data: { timestamp: Date.now() },
                timestamp: Date.now()
            };

            try {
                wsRef.current.send(JSON.stringify(pingEvent));
            } catch (error) {
                console.error('Erreur envoi ping:', error);
            }
        }
    }, []);

    // Envoyer un heartbeat
    const sendHeartbeat = useCallback(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const heartbeat: WebSocketEvent = {
                type: WEBSOCKET_EVENTS.HEARTBEAT,
                data: {
                    timestamp: Date.now(),
                    user_id: user?.id,
                    room_code: roomCode,
                    game_id: gameId
                }
            };

            try {
                wsRef.current.send(JSON.stringify(heartbeat));
                setStats(prev => ({
                    ...prev,
                    lastHeartbeat: Date.now(),
                    messagesSent: prev.messagesSent + 1
                }));
            } catch (error) {
                console.error('Erreur envoi heartbeat:', error);
            }
        }
    }, [user?.id, roomCode, gameId]);

    // Calculer la qualité de connexion basée sur la latence
    const updateConnectionQuality = useCallback((latency: number) => {
        if (latency < 100) {
            setConnectionQuality('excellent');
        } else if (latency < 300) {
            setConnectionQuality('good');
        } else {
            setConnectionQuality('poor');
        }
    }, []);

    // Gérer les événements de jeu
    const handleGameEvent = useCallback((event: WebSocketEvent) => {
        if (!enableGameEvents) return;

        const gameEvent: GameEvent = {
            type: event.type,
            player_id: event.data.player_id || event.data.user_id,
            username: event.data.username,
            data: event.data
        };

        setGameEvents(prev => [...prev.slice(-49), gameEvent]); // Garder les 50 derniers événements

        // Générer des messages système pour certains événements
        switch (event.type) {
            case WEBSOCKET_EVENTS.PLAYER_JOINED:
                addSystemMessage(SYSTEM_MESSAGES.PLAYER_JOINED(event.data.username));
                break;

            case WEBSOCKET_EVENTS.PLAYER_LEFT:
                addSystemMessage(SYSTEM_MESSAGES.PLAYER_LEFT(event.data.username));
                break;

            case WEBSOCKET_EVENTS.GAME_STARTED:
                addGameMessage(SYSTEM_MESSAGES.GAME_STARTED);
                break;

            case WEBSOCKET_EVENTS.GAME_FINISHED:
                addGameMessage(SYSTEM_MESSAGES.GAME_FINISHED);
                break;

            case WEBSOCKET_EVENTS.PLAYER_MASTERMIND_COMPLETE:
                addGameMessage(SYSTEM_MESSAGES.MASTERMIND_COMPLETED(
                    event.data.username,
                    event.data.mastermind_number
                ));
                break;

            case WEBSOCKET_EVENTS.ITEM_USED:
                if (event.data.item_name) {
                    addGameMessage(SYSTEM_MESSAGES.ITEM_USED(
                        event.data.username,
                        event.data.item_name
                    ));
                }
                break;

            default:
                console.log('Événement de jeu non géré:', event);
        }
    }, [enableGameEvents, addSystemMessage, addGameMessage]);

    // Gérer les messages WebSocket entrants
    const handleWebSocketMessage = useCallback((event: MessageEvent) => {
        try {
            const wsEvent: WebSocketEvent = JSON.parse(event.data);

            setStats(prev => ({
                ...prev,
                messagesReceived: prev.messagesReceived + 1
            }));

            switch (wsEvent.type) {
                case 'chat_message':
                case 'chat_broadcast':
                case WEBSOCKET_EVENTS.CHAT_MESSAGE:
                    if (!enableChat) break;

                    const chatData = wsEvent.data;
                    const newMessage: ChatMessage = {
                        id: chatData.message_id || `msg_${Date.now()}_${Math.random()}`,
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

                case 'pong':
                    const latency = Date.now() - (wsEvent.data.timestamp || 0);
                    lastPongRef.current = Date.now();
                    updateConnectionQuality(latency);
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
                    uptimeStartRef.current = Date.now();

                    // Démarrer les intervalles
                    if (heartbeatIntervalRef.current) {
                        clearInterval(heartbeatIntervalRef.current);
                    }
                    heartbeatIntervalRef.current = setInterval(sendHeartbeat, WEBSOCKET_CONFIG.HEARTBEAT_INTERVAL);

                    if (pingIntervalRef.current) {
                        clearInterval(pingIntervalRef.current);
                    }
                    pingIntervalRef.current = setInterval(sendPing, WEBSOCKET_CONFIG.PING_INTERVAL);

                    showSuccess('💬 Chat connecté !');
                    addSystemMessage(`${user?.username || 'Vous'} a rejoint le chat`);
                    break;

                case 'authentication_success':
                    console.log('✅ WebSocket authentifié avec succès');
                    break;

                case 'authentication_failed':
                    console.error('❌ Échec d\'authentification WebSocket');
                    setConnectionError('Échec d\'authentification');
                    showError('Authentification chat échouée');
                    break;

                case WEBSOCKET_EVENTS.ERROR:
                case 'error':
                    const errorMessage = wsEvent.data.message || 'Erreur WebSocket inconnue';
                    setConnectionError(errorMessage);
                    showError(`Erreur chat: ${errorMessage}`);
                    break;

                // Événements de jeu
                case WEBSOCKET_EVENTS.PLAYER_JOINED:
                case WEBSOCKET_EVENTS.PLAYER_LEFT:
                case WEBSOCKET_EVENTS.GAME_STARTED:
                case WEBSOCKET_EVENTS.GAME_FINISHED:
                case WEBSOCKET_EVENTS.PLAYER_MASTERMIND_COMPLETE:
                case WEBSOCKET_EVENTS.PLAYER_STATUS_CHANGED:
                case WEBSOCKET_EVENTS.GAME_PROGRESS_UPDATE:
                case WEBSOCKET_EVENTS.ITEM_USED:
                case WEBSOCKET_EVENTS.EFFECT_APPLIED:
                    handleGameEvent(wsEvent);
                    break;

                default:
                    console.log('Message WebSocket non géré:', wsEvent);
            }
        } catch (error) {
            console.error('Erreur traitement message WebSocket:', error);
        }
    }, [user?.id, user?.username, enableChat, enableGameEvents, addSystemMessage, addGameMessage, sendHeartbeat, sendPing, updateConnectionQuality, handleGameEvent, showSuccess, showError]);

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
            console.log('🔌 Connexion WebSocket à:', wsUrl);

            // Créer la connexion WebSocket réelle
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            // Timeout de connexion
            const connectionTimeout = setTimeout(() => {
                if (ws.readyState === WebSocket.CONNECTING) {
                    ws.close();
                    setConnectionError('Timeout de connexion');
                    setIsConnecting(false);
                    showError('Timeout de connexion au chat');
                }
            }, 10000);

            ws.onopen = () => {
                clearTimeout(connectionTimeout);
                console.log('✅ WebSocket connecté');

                // Authentification
                const authMessage: WebSocketEvent = {
                    type: WEBSOCKET_EVENTS.AUTHENTICATE,
                    data: {
                        user_id: user.id,
                        username: user.username,
                        room_code: roomCode,
                        game_id: gameId,
                        timestamp: Date.now(),
                        enable_chat: enableChat,
                        enable_game_events: enableGameEvents
                    }
                };

                ws.send(JSON.stringify(authMessage));
                setStats(prev => ({ ...prev, messagesSent: prev.messagesSent + 1 }));
            };

            ws.onmessage = handleWebSocketMessage;

            ws.onclose = (event) => {
                clearTimeout(connectionTimeout);
                console.log('🔌 WebSocket fermé:', event.code, event.reason);
                setIsConnected(false);
                setIsConnecting(false);

                // Nettoyer les intervalles
                if (heartbeatIntervalRef.current) {
                    clearInterval(heartbeatIntervalRef.current);
                    heartbeatIntervalRef.current = null;
                }

                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current);
                    pingIntervalRef.current = null;
                }

                // Mettre à jour l'uptime
                if (uptimeStartRef.current) {
                    setStats(prev => ({
                        ...prev,
                        uptime: prev.uptime + (Date.now() - uptimeStartRef.current!)
                    }));
                    uptimeStartRef.current = null;
                }

                // Tentative de reconnexion automatique
                if (reconnectAttemptsRef.current < reconnectAttempts && !event.wasClean) {
                    reconnectAttemptsRef.current++;
                    setStats(prev => ({ ...prev, reconnectCount: prev.reconnectCount + 1 }));

                    showWarning(`🔄 Reconnexion... (${reconnectAttemptsRef.current}/${reconnectAttempts})`);
                    addSystemMessage(SYSTEM_MESSAGES.CONNECTION_LOST);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, reconnectDelay);
                } else if (reconnectAttemptsRef.current >= reconnectAttempts) {
                    setConnectionError('Impossible de se reconnecter au chat');
                    showError('❌ Chat définitivement déconnecté');
                    addSystemMessage('Connexion au chat perdue définitivement');
                }
            };

            ws.onerror = (error) => {
                clearTimeout(connectionTimeout);
                console.error('❌ Erreur WebSocket:', error);
                setConnectionError('Erreur de connexion WebSocket');
                setIsConnecting(false);
                showError('Impossible de se connecter au chat');
            };

        } catch (error: any) {
            console.error('❌ Erreur connexion WebSocket:', error);
            setConnectionError(error.message || 'Erreur de connexion');
            setIsConnecting(false);
            showError('Impossible de se connecter au chat');
        }
    }, [user, isConnecting, isConnected, getWebSocketUrl, roomCode, gameId, enableChat, enableGameEvents, reconnectAttempts, reconnectDelay, handleWebSocketMessage, addSystemMessage, showSuccess, showWarning, showError]);

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

        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close(1000, 'Déconnexion volontaire');
            wsRef.current = null;
        }

        setIsConnected(false);
        setIsConnecting(false);
        setConnectionError(null);
        setConnectionQuality('unknown');
        reconnectAttemptsRef.current = 0;

        // Mettre à jour l'uptime final
        if (uptimeStartRef.current) {
            setStats(prev => ({
                ...prev,
                uptime: prev.uptime + (Date.now() - uptimeStartRef.current!)
            }));
            uptimeStartRef.current = null;
        }

        addSystemMessage('Chat déconnecté');
    }, [addSystemMessage]);

    // Envoyer un message
    const sendMessage = useCallback(async (message: string): Promise<boolean> => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            showError('Chat non connecté');
            return false;
        }

        if (!message.trim()) {
            return false;
        }

        try {
            const chatEvent: WebSocketEvent = {
                type: WEBSOCKET_EVENTS.CHAT_MESSAGE,
                data: {
                    message: message.trim(),
                    user_id: user?.id,
                    username: user?.username,
                    room_code: roomCode,
                    game_id: gameId,
                    timestamp: new Date().toISOString()
                },
                timestamp: Date.now(),
                message_id: `msg_${Date.now()}_${Math.random()}`
            };

            wsRef.current.send(JSON.stringify(chatEvent));
            setStats(prev => ({ ...prev, messagesSent: prev.messagesSent + 1 }));

            return true;
        } catch (error) {
            console.error('Erreur envoi message:', error);
            showError('Impossible d\'envoyer le message');
            return false;
        }
    }, [user?.id, user?.username, roomCode, gameId, showError]);

    // Marquer les messages comme lus
    const markAsRead = useCallback(() => {
        setUnreadCount(0);
    }, []);

    // Vider les messages
    const clearMessages = useCallback(() => {
        setMessages([]);
        setUnreadCount(0);
    }, []);

    // Vider les événements de jeu
    const clearGameEvents = useCallback(() => {
        setGameEvents([]);
    }, []);

    // Connexion automatique
    useEffect(() => {
        if (autoConnect && user && !isConnected && !isConnecting) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [autoConnect, user, roomCode, gameId]); // Intentionnellement ne pas inclure connect/disconnect

    // Nettoyage à la déconnexion du composant
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, []);

    // Mise à jour de l'uptime
    useEffect(() => {
        if (!isConnected || !uptimeStartRef.current) return;

        const interval = setInterval(() => {
            setStats(prev => ({
                ...prev,
                uptime: prev.uptime + (Date.now() - uptimeStartRef.current!)
            }));
            uptimeStartRef.current = Date.now();
        }, 1000);

        return () => clearInterval(interval);
    }, [isConnected]);

    return {
        // État de connexion
        isConnected,
        isConnecting,
        connectionError,
        connectionQuality,

        // Messages et événements
        messages,
        unreadCount,
        gameEvents,

        // Actions
        sendMessage,
        connect,
        disconnect,
        markAsRead,
        clearMessages,
        clearGameEvents,

        // Méthodes utilitaires
        addSystemMessage,
        addGameMessage,

        // Statistiques
        stats
    };
};

export default useWebSocketChat;