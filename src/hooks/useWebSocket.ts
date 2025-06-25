// ===============================================
// src/hooks/useWebSocket.ts - VERSION COMPLÈTE CORRIGÉE
// Protection anti-boucle infinie + Chat intégré
// ===============================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { MultiplayerWebSocketService } from "@/services/websocket";
import { ChatMessage } from "@/hooks/useWebSocketChat";

// ===============================================
// TYPES ET INTERFACES
// ===============================================

export interface WebSocketStats {
    messagesReceived: number;
    messagesSent: number;
    reconnectCount: number;
    uptime: number;
    lastHeartbeat: number | null;
    connectionAttempts: number;
}

export interface WebSocketHookReturn {
    // État de connexion
    isConnected: boolean;
    isConnecting: boolean;
    connectionState: string;

    // Chat
    chatMessages: ChatMessage[];
    sendChatMessage: (message: string) => boolean;
    clearChatMessages: () => void;

    // Actions de connexion
    connect: () => Promise<void>;
    disconnect: () => void;
    forceReconnect: () => Promise<void>;

    // Communication
    sendMessage: (message: any) => boolean;
    subscribe: (event: string, handler: (data: any) => void) => () => void;

    // Utilitaires
    wsService: MultiplayerWebSocketService | null;
    stats: WebSocketStats;

    // Debug
    getConnectionInfo: () => any;
}

// ===============================================
// CONFIGURATION
// ===============================================

const WEBSOCKET_CONFIG = {
    MAX_RECONNECT_ATTEMPTS: 3,
    RECONNECT_DELAY: 2000,
    HEARTBEAT_INTERVAL: 30000,
    STATUS_CHECK_INTERVAL: 5000,
    CONNECTION_TIMEOUT: 10000,
    CLEANUP_DELAY: 100
};

// ===============================================
// HOOK PRINCIPAL
// ===============================================

export const useWebSocket = (roomCode?: string): WebSocketHookReturn => {
    const { user } = useAuth();
    const { showError, showSuccess, showInfo, showWarning } = useNotification();

    // ===============================================
    // ÉTATS
    // ===============================================

    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionState, setConnectionState] = useState<string>('disconnected');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

    // Stats de connexion
    const [stats, setStats] = useState<WebSocketStats>({
        messagesReceived: 0,
        messagesSent: 0,
        reconnectCount: 0,
        uptime: 0,
        lastHeartbeat: null,
        connectionAttempts: 0
    });

    // ===============================================
    // REFS POUR ÉVITER LES BOUCLES
    // ===============================================

    const wsServiceRef = useRef<MultiplayerWebSocketService | null>(null);
    const connectionAttemptRef = useRef(false);
    const unmountedRef = useRef(false);
    const lastRoomCodeRef = useRef<string | undefined>(undefined);
    const connectionStateRef = useRef<string>('disconnected');
    const reconnectCountRef = useRef(0);
    const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const uptimeStartRef = useRef<number | null>(null);

    // ===============================================
    // FONCTIONS DE NETTOYAGE
    // ===============================================

    const clearTimeouts = useCallback(() => {
        if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
        }

        if (statusCheckIntervalRef.current) {
            clearInterval(statusCheckIntervalRef.current);
            statusCheckIntervalRef.current = null;
        }
    }, []);

    const cleanupConnection = useCallback(() => {
        console.log('🧹 Nettoyage complet de la connexion WebSocket');

        clearTimeouts();

        if (wsServiceRef.current) {
            try {
                wsServiceRef.current.removeAllListeners(); // Éviter les événements fantômes
                wsServiceRef.current.disconnect();
            } catch (error) {
                console.warn('Erreur lors de la déconnexion:', error);
            }
            wsServiceRef.current = null;
        }

        connectionAttemptRef.current = false;
        setIsConnected(false);
        setIsConnecting(false);
        setConnectionState('disconnected');
        connectionStateRef.current = 'disconnected';

        // Mettre à jour l'uptime final
        if (uptimeStartRef.current) {
            setStats(prev => ({
                ...prev,
                uptime: prev.uptime + (Date.now() - uptimeStartRef.current!)
            }));
            uptimeStartRef.current = null;
        }
    }, [clearTimeouts]);

    // ===============================================
    // VÉRIFICATION DU STATUT
    // ===============================================

    const forceConnectionStatusUpdate = useCallback(() => {
        if (wsServiceRef.current?.isConnected && !isConnected) {
            console.log('🔄 Correction statut WebSocket');
            setIsConnected(true);
            setConnectionState('connected');
        }
    }, [isConnected]);

    const startStatusMonitoring = useCallback(() => {
        if (statusCheckIntervalRef.current) {
            clearInterval(statusCheckIntervalRef.current);
        }

        statusCheckIntervalRef.current = setInterval(() => {
            if (!unmountedRef.current) {
                forceConnectionStatusUpdate();

                // Vérifier la cohérence
                const wsConnected = wsServiceRef.current?.isConnected || false;
                const stateConnected = isConnected;

                if (wsConnected !== stateConnected) {
                    console.log(`⚠️ Incohérence détectée: WS=${wsConnected}, State=${stateConnected}`);
                    setIsConnected(wsConnected);
                    setConnectionState(wsConnected ? 'connected' : 'disconnected');
                    connectionStateRef.current = wsConnected ? 'connected' : 'disconnected';
                }
            }
        }, WEBSOCKET_CONFIG.STATUS_CHECK_INTERVAL);
    }, [forceConnectionStatusUpdate, isConnected]);

    // ===============================================
    // GESTION DES ÉVÉNEMENTS WEBSOCKET
    // ===============================================

    const setupEventListeners = useCallback((service: MultiplayerWebSocketService) => {
        // Connexion réussie
        service.on('connected', () => {
            if (!unmountedRef.current) {
                console.log('✅ WebSocket connecté avec succès');
                clearTimeouts();
                setIsConnected(true);
                setIsConnecting(false);
                connectionAttemptRef.current = false;
                setConnectionState('connected');
                connectionStateRef.current = 'connected';
                reconnectCountRef.current = 0;
                uptimeStartRef.current = Date.now();

                setStats(prev => ({
                    ...prev,
                    lastHeartbeat: Date.now(),
                    reconnectCount: prev.reconnectCount + (prev.reconnectCount > 0 ? 1 : 0)
                }));

                showSuccess('Connexion temps réel établie');
                startStatusMonitoring();
            }
        });

        // Déconnexion
        service.on('disconnected', ({ code, reason }: { code: number; reason: string }) => {
            if (!unmountedRef.current) {
                console.log(`🔌 WebSocket déconnecté: ${code} - ${reason}`);
                clearTimeouts();
                setIsConnected(false);
                setIsConnecting(false);
                connectionAttemptRef.current = false;
                setConnectionState('disconnected');
                connectionStateRef.current = 'disconnected';

                // Ne pas tenter de reconnecter si c'est volontaire
                if (code !== 1000 && code !== 1001) {
                    showWarning('Connexion temps réel perdue');

                    // Reconnexion automatique limitée
                    if (reconnectCountRef.current < WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS) {
                        reconnectCountRef.current++;
                        setTimeout(() => {
                            if (!unmountedRef.current && roomCode) {
                                console.log(`🔄 Tentative de reconnexion ${reconnectCountRef.current}/${WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS}`);
                                connect();
                            }
                        }, WEBSOCKET_CONFIG.RECONNECT_DELAY * reconnectCountRef.current);
                    } else {
                        showError('Impossible de se reconnecter automatiquement');
                    }
                }
            }
        });

        // Erreurs
        service.on('error', (error: unknown) => {
            if (!unmountedRef.current) {
                console.error('❌ Erreur WebSocket:', error);
                clearTimeouts();
                setIsConnecting(false);
                connectionAttemptRef.current = false;
                showError('Erreur de connexion temps réel');
            }
        });

        // Messages de chat
        service.on('chat_message', (message: ChatMessage) => {
            if (!unmountedRef.current) {
                console.log('💬 Message de chat reçu:', message);
                setChatMessages(prev => [...prev, message]);
                setStats(prev => ({ ...prev, messagesReceived: prev.messagesReceived + 1 }));
            }
        });

        // Événements de joueurs
        service.on('player_joined', (data: { username: string }) => {
            if (!unmountedRef.current) {
                showInfo(`👤 ${data.username} a rejoint le salon`);

                const systemMessage: ChatMessage = {
                    id: `system-joined-${Date.now()}`,
                    user_id: 'system',
                    username: 'Système',
                    message: `${data.username} a rejoint le salon`,
                    timestamp: new Date().toISOString(),
                    type: 'system'
                };
                setChatMessages(prev => [...prev, systemMessage]);
            }
        });

        service.on('player_left', (data: { username: string }) => {
            if (!unmountedRef.current) {
                showInfo(`👤 ${data.username} a quitté le salon`);

                const systemMessage: ChatMessage = {
                    id: `system-left-${Date.now()}`,
                    user_id: 'system',
                    username: 'Système',
                    message: `${data.username} a quitté le salon`,
                    timestamp: new Date().toISOString(),
                    type: 'system'
                };
                setChatMessages(prev => [...prev, systemMessage]);
            }
        });

        service.on('game_started', () => {
            if (!unmountedRef.current) {
                showSuccess('🎮 La partie a commencé !');

                const systemMessage: ChatMessage = {
                    id: `system-game-${Date.now()}`,
                    user_id: 'system',
                    username: 'Système',
                    message: '🎮 La partie a commencé !',
                    timestamp: new Date().toISOString(),
                    type: 'game'
                };
                setChatMessages(prev => [...prev, systemMessage]);
            }
        });

    }, [showError, showSuccess, showInfo, showWarning, clearTimeouts, startStatusMonitoring, roomCode]);

    // ===============================================
    // FONCTION DE CONNEXION PRINCIPALE
    // ===============================================

    const connect = useCallback(async () => {
        // Vérifications préalables
        if (!roomCode || !user || unmountedRef.current) {
            console.log('❌ Impossibilité de se connecter:', {
                roomCode: !!roomCode,
                user: !!user,
                unmounted: unmountedRef.current
            });
            return;
        }

        // Éviter les connexions multiples simultanées
        if (connectionAttemptRef.current || isConnecting) {
            console.log('⚠️ Connexion déjà en cours, ignorée');
            return;
        }

        // Si déjà connecté à la même room ET connexion stable, ne pas reconnecter
        if (wsServiceRef.current?.isConnected &&
            lastRoomCodeRef.current === roomCode &&
            connectionStateRef.current === 'connected') {
            console.log('✅ Déjà connecté à cette room et stable');
            return;
        }

        try {
            connectionAttemptRef.current = true;
            setIsConnecting(true);

            setStats(prev => ({ ...prev, connectionAttempts: prev.connectionAttempts + 1 }));

            console.log(`🔌 Connexion WebSocket vers room: ${roomCode}`);

            // Nettoyer proprement la connexion précédente
            if (wsServiceRef.current) {
                console.log('🧹 Nettoyage de la connexion précédente');
                wsServiceRef.current.removeAllListeners();
                wsServiceRef.current.disconnect();
                wsServiceRef.current = null;
            }

            // Pause pour éviter les races conditions
            await new Promise(resolve => setTimeout(resolve, WEBSOCKET_CONFIG.CLEANUP_DELAY));

            if (unmountedRef.current) {
                console.log('⚠️ Composant démonté pendant le nettoyage');
                return;
            }

            // Créer nouvelle instance
            wsServiceRef.current = new MultiplayerWebSocketService();
            lastRoomCodeRef.current = roomCode;

            // Configurer les event listeners
            setupEventListeners(wsServiceRef.current);

            // Timeout de connexion
            connectionTimeoutRef.current = setTimeout(() => {
                if (connectionAttemptRef.current && !unmountedRef.current) {
                    console.log('⏰ Timeout de connexion WebSocket');
                    connectionAttemptRef.current = false;
                    setIsConnecting(false);
                    showError('Timeout de connexion WebSocket');
                    cleanupConnection();
                }
            }, WEBSOCKET_CONFIG.CONNECTION_TIMEOUT);

            // Tenter la connexion avec retry limité
            let retryCount = 0;
            const maxRetries = 3;

            const tryConnect = async (): Promise<void> => {
                try {
                    if (wsServiceRef.current && !unmountedRef.current) {
                        await wsServiceRef.current.connect(roomCode, user.id);
                    }
                } catch (error) {
                    retryCount++;
                    if (retryCount < maxRetries && !unmountedRef.current) {
                        console.log(`🔄 Retry connexion ${retryCount}/${maxRetries}`);
                        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                        await tryConnect();
                    } else {
                        throw error;
                    }
                }
            };

            await tryConnect();

        } catch (error: any) {
            if (!unmountedRef.current) {
                console.error('❌ Erreur de connexion WebSocket:', error);
                connectionAttemptRef.current = false;
                setIsConnecting(false);
                showError(`Impossible de se connecter: ${error.message || 'Erreur inconnue'}`);
                cleanupConnection();
            }
        }
    }, [roomCode, user, isConnecting, setupEventListeners, showError, cleanupConnection]);

    // ===============================================
    // FONCTIONS DE COMMUNICATION
    // ===============================================

    const sendChatMessage = useCallback((message: string): boolean => {
        console.log('🗨️ Tentative envoi message:', {
            message: message.trim(),
            connected: wsServiceRef.current?.isConnected,
            roomCode,
            user: user?.username
        });

        if (!wsServiceRef.current?.isConnected) {
            console.warn('❌ WebSocket non connecté');
            showError?.('Chat non connecté');
            return false;
        }

        if (!user) {
            console.warn('❌ Utilisateur non authentifié');
            return false;
        }

        if (!message.trim()) {
            console.warn('❌ Message vide');
            return false;
        }

        try {
            // NOUVEAU FORMAT UNIFIÉ selon votre backend
            const chatEvent = {
                type: 'chat_message',  // Type simple et cohérent
                data: {
                    message: message.trim(),
                    user_id: user.id,
                    username: user.username,
                    room_code: roomCode,
                    timestamp: new Date().toISOString()
                }
            };

            console.log('📤 Envoi événement chat:', chatEvent);

            const success = wsServiceRef.current.send(chatEvent);

            if (success) {
                console.log('✅ Message envoyé avec succès');
                setStats(prev => ({ ...prev, messagesSent: prev.messagesSent + 1 }));

                // OPTIONNEL : Ajouter immédiatement le message localement pour une meilleure UX
                const localMessage: ChatMessage = {
                    id: `local_${Date.now()}`,
                    user_id: user.id,
                    username: user.username,
                    message: message.trim(),
                    timestamp: new Date().toISOString(),
                    type: 'user'
                };
                setChatMessages(prev => [...prev, localMessage]);
            } else {
                console.error('❌ Échec envoi message via WebSocket');
                showError?.('Impossible d\'envoyer le message');
            }

            return success;
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi du message:', error);
            showError?.('Erreur lors de l\'envoi du message');
            return false;
        }
    }, [user, roomCode, showError]);

    const sendMessage = useCallback((message: any): boolean => {
        if (wsServiceRef.current?.isConnected) {
            try {
                const success = wsServiceRef.current.send(message);
                if (success) {
                    setStats(prev => ({ ...prev, messagesSent: prev.messagesSent + 1 }));
                }
                return success;
            } catch (error) {
                console.error('❌ Erreur envoi message:', error);
                return false;
            }
        }
        return false;
    }, []);

    const subscribe = useCallback((event: string, handler: (data: any) => void) => {
        if (wsServiceRef.current) {
            wsServiceRef.current.on(event, handler);
            return () => wsServiceRef.current?.off(event, handler);
        }
        return () => {};
    }, []);

    // ===============================================
    // FONCTIONS UTILITAIRES
    // ===============================================

    const forceReconnect = useCallback(async () => {
        console.log('🔄 Reconnexion forcée demandée');
        reconnectCountRef.current = 0; // Reset du compteur
        cleanupConnection();
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!unmountedRef.current) {
            await connect();
        }
    }, [cleanupConnection, connect]);

    const clearChatMessages = useCallback(() => {
        setChatMessages([]);
    }, []);

    const getConnectionInfo = useCallback(() => {
        return {
            isConnected,
            isConnecting,
            connectionState,
            roomCode,
            userId: user?.id,
            wsServiceExists: !!wsServiceRef.current,
            wsServiceConnected: wsServiceRef.current?.isConnected,
            lastRoomCode: lastRoomCodeRef.current,
            connectionAttempt: connectionAttemptRef.current,
            unmounted: unmountedRef.current,
            stats
        };
    }, [isConnected, isConnecting, connectionState, roomCode, user?.id, stats]);

    // ===============================================
    // EFFETS
    // ===============================================

    // Effet de connexion automatique
    useEffect(() => {
        if (!wsServiceRef.current || !roomCode) return;

        // Log périodique de l'état de la connexion pour debug
        const healthCheck = setInterval(() => {
            const health = wsServiceRef.current?.getConnectionHealth?.();
            if (health) {
                console.log('🏥 WebSocket Health Check:', health);

                // Si la connexion semble morte mais l'état dit connecté, forcer la reconnexion
                if (health.isConnected && health.readyState === 'CLOSED') {
                    console.warn('⚠️ État incohérent détecté, reconnexion forcée');
                    forceReconnect();
                }
            }
        }, 30000); // Check toutes les 30 secondes

        return () => {
            clearInterval(healthCheck);
        };
    }, [roomCode, forceReconnect]);

    // Détection de visibilité de la page
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && wsServiceRef.current) {
                console.log('👁️ Page redevenue visible, vérification connexion');

                // Vérifier si la connexion est toujours active après un délai
                setTimeout(() => {
                    if (wsServiceRef.current && !isConnected) {
                        console.log('🔄 Reconnexion après retour de visibilité');
                        forceReconnect();
                    }
                }, 1000);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isConnected, forceReconnect]);
    // Effet de nettoyage final
    useEffect(() => {
        return () => {
            console.log('🔌 Démontage du hook useWebSocket');
            unmountedRef.current = true;

            // Nettoyage différé pour éviter les coupures intempestives
            setTimeout(() => {
                cleanupConnection();
            }, 1000);
        };
    }, []);

    // ===============================================
    // RETOUR DU HOOK
    // ===============================================

    return {
        // État de connexion
        isConnected,
        isConnecting,
        connectionState,

        // Chat
        chatMessages,
        sendChatMessage,
        clearChatMessages,

        // Actions de connexion
        connect,
        disconnect: cleanupConnection,
        forceReconnect,

        // Communication
        sendMessage,
        subscribe,

        // Utilitaires
        wsService: wsServiceRef.current,
        stats,

        // Debug
        getConnectionInfo
    };
};

// ===============================================
// EXPORT PAR DÉFAUT
// ===============================================

export default useWebSocket;