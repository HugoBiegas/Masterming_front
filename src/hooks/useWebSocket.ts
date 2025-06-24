// src/hooks/useWebSocket.ts - CORRECTION pour retourner chatMessages
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { MultiplayerWebSocketService } from "@/services/websocket";
import { ChatMessage } from "@/hooks/useWebSocketChat";

export const useWebSocket = (roomCode?: string) => {
    const { user } = useAuth();
    const { showError, showSuccess, showInfo } = useNotification();

    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionState, setConnectionState] = useState<string>('disconnected');

    // CORRECTION: Toujours initialiser chatMessages comme un array
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

    // Refs pour éviter les reconnexions multiples
    const wsServiceRef = useRef<MultiplayerWebSocketService | null>(null);
    const connectionAttemptRef = useRef(false);
    const unmountedRef = useRef(false);
    const lastRoomCodeRef = useRef<string | undefined>(undefined);

    // CORRECTION: Fonction de nettoyage complète
    const cleanupConnection = useCallback(() => {
        if (wsServiceRef.current) {
            console.log('🧹 Cleaning up WebSocket connection');
            wsServiceRef.current.disconnect();
            wsServiceRef.current = null;
        }
        connectionAttemptRef.current = false;
        setIsConnected(false);
        setIsConnecting(false);
    }, []);

    // CORRECTION: Connexion avec protection contre les doublons
    const connect = useCallback(async () => {
        // Vérifications préalables
        if (!roomCode || !user || unmountedRef.current) {
            console.log('❌ Cannot connect: missing requirements', { roomCode, user: !!user, unmounted: unmountedRef.current });
            return;
        }

        // Éviter les connexions multiples
        if (connectionAttemptRef.current || isConnecting) {
            console.log('⚠️ Connection already in progress, skipping');
            return;
        }

        // Si déjà connecté à la même room, ne pas reconnecter
        if (wsServiceRef.current?.isConnected && lastRoomCodeRef.current === roomCode) {
            console.log('✅ Already connected to this room');
            return;
        }

        try {
            connectionAttemptRef.current = true;
            setIsConnecting(true);

            console.log(`🔌 Connecting to WebSocket for room: ${roomCode}`);

            // Nettoyer la connexion précédente si elle existe
            if (wsServiceRef.current) {
                wsServiceRef.current.disconnect();
            }

            // Créer nouvelle instance
            wsServiceRef.current = new MultiplayerWebSocketService();
            lastRoomCodeRef.current = roomCode;

            // Configurer les event listeners
            wsServiceRef.current.on('connected', () => {
                if (!unmountedRef.current) {
                    console.log('✅ WebSocket connected successfully');
                    setIsConnected(true);
                    setIsConnecting(false);
                    connectionAttemptRef.current = false;
                    setConnectionState('connected');
                    showSuccess('Connexion temps réel établie');
                }
            });

            wsServiceRef.current.on('disconnected', ({ code, reason }: { code: number; reason: string }) => {
                if (!unmountedRef.current) {
                    console.log(`🔌 WebSocket disconnected: ${code} - ${reason}`);
                    setIsConnected(false);
                    setIsConnecting(false);
                    connectionAttemptRef.current = false;
                    setConnectionState('disconnected');

                    // Ne pas tenter de reconnecter si c'est une déconnexion volontaire
                    if (code !== 1000) {
                        showError('Connexion temps réel perdue');
                    }
                }
            });

            wsServiceRef.current.on('error', (error: unknown) => {
                if (!unmountedRef.current) {
                    console.error('❌ WebSocket error:', error);
                    setIsConnecting(false);
                    connectionAttemptRef.current = false;
                    showError('Erreur de connexion temps réel');
                }
            });

            // CORRECTION: Gérer les messages de chat
            wsServiceRef.current.on('chat_message', (message: ChatMessage) => {
                if (!unmountedRef.current) {
                    setChatMessages(prev => [...prev, message]);
                }
            });

            // Gérer les événements de joueurs
            wsServiceRef.current.on('player_joined', (data: { username: string }) => {
                if (!unmountedRef.current) {
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
                }
            });

            wsServiceRef.current.on('player_left', (data: { username: string }) => {
                if (!unmountedRef.current) {
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
                }
            });

            wsServiceRef.current.on('game_started', (_data: unknown) => {
                if (!unmountedRef.current) {
                    showSuccess('🎮 La partie a commencé !');
                }
            });

            // Tenter la connexion
            await wsServiceRef.current.connect(roomCode, user.id);

        } catch (error) {
            if (!unmountedRef.current) {
                console.error('❌ Failed to connect WebSocket:', error);
                setIsConnecting(false);
                connectionAttemptRef.current = false;
                showError('Impossible de se connecter au serveur');
            }
        }
    }, [roomCode, user, isConnecting, showError, showSuccess, showInfo]);

    // CORRECTION: Fonction pour envoyer des messages de chat
    const sendChatMessage = useCallback((message: string): boolean => {
        if (!wsServiceRef.current?.isConnected || !user) {
            console.warn('Cannot send chat message: not connected or no user');
            return false;
        }

        try {
            const chatEvent = {
                type: 'chat_message',
                data: {
                    message: message.trim(),
                    user_id: user.id,
                    username: user.username,
                    room_code: roomCode,
                    timestamp: new Date().toISOString()
                }
            };

            return wsServiceRef.current.send(chatEvent);
        } catch (error) {
            console.error('❌ Failed to send chat message:', error);
            return false;
        }
    }, [user, roomCode]);

    // CORRECTION: Effet avec protection contre les multiples connexions
    useEffect(() => {
        unmountedRef.current = false;

        // NOUVEAU: Éviter les reconnexions si déjà connecté à la même room
        if (roomCode && user && roomCode !== lastRoomCodeRef.current) {
            lastRoomCodeRef.current = roomCode;
            connect();
        }

        return () => {
            unmountedRef.current = true;
            // CORRECTION: Ne nettoyer que si on change de room, pas au démontage
            if (lastRoomCodeRef.current !== roomCode) {
                cleanupConnection();
            }
        };
    }, [roomCode, user?.id]); // Dépendances minimales pour éviter les reconnexions

    // CORRECTION: Nettoyage au démontage
    useEffect(() => {
        return () => {
            unmountedRef.current = true;
            cleanupConnection();
        };
    }, [cleanupConnection]);

    // Fonction pour envoyer des messages
    const sendMessage = useCallback((message: any) => {
        if (wsServiceRef.current?.isConnected) {
            wsServiceRef.current.send(message);
            return true;
        }
        return false;
    }, []);

    // Fonction pour s'abonner aux événements
    const subscribe = useCallback((event: string, handler: (data: any) => void) => {
        if (wsServiceRef.current) {
            wsServiceRef.current.on(event, handler);
            return () => wsServiceRef.current?.off(event, handler);
        }
        return () => {};
    }, []);

    return {
        isConnected,
        isConnecting,
        connectionState,
        // CORRECTION: Retourner chatMessages et sendChatMessage
        chatMessages,
        sendChatMessage,
        connect,
        disconnect: cleanupConnection,
        sendMessage,
        subscribe,
        wsService: wsServiceRef.current
    };
};