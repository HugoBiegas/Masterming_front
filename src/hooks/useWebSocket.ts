// src/hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { MultiplayerWebSocketService } from "@/services/websocket";
import { ChatMessage } from "@/hooks/useWebSocketChat";

export const useWebSocket = (roomCode: string | undefined) => {
    const { user } = useAuth();
    const { showError, showSuccess } = useNotification();
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    // Refs pour éviter les reconnexions multiples
    const wsServiceRef = useRef<MultiplayerWebSocketService | null>(null);
    const connectionAttemptRef = useRef(false);
    const unmountedRef = useRef(false);
    const roomCodeRef = useRef<string | undefined>(undefined);

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
        if (wsServiceRef.current?.isConnected && roomCodeRef.current === roomCode) {
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
            roomCodeRef.current = roomCode;

            // Configurer les event listeners
            wsServiceRef.current.on('connected', () => {
                if (!unmountedRef.current) {
                    console.log('✅ WebSocket connected successfully');
                    setIsConnected(true);
                    setIsConnecting(false);
                    connectionAttemptRef.current = false;
                    showSuccess('Connexion temps réel établie');
                }
            });

            wsServiceRef.current.on('disconnected', ({ code, reason }: { code: number; reason: string }) => {
                if (!unmountedRef.current) {
                    console.log(`🔌 WebSocket disconnected: ${code} - ${reason}`);
                    setIsConnected(false);
                    setIsConnecting(false);
                    connectionAttemptRef.current = false;

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
    }, [roomCode, user, isConnecting, showError, showSuccess]);

    // CORRECTION: Effet avec nettoyage approprié
    useEffect(() => {
        unmountedRef.current = false;

        if (roomCode && user) {
            connect();
        }

        return () => {
            unmountedRef.current = true;
            cleanupConnection();
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
        connect,
        disconnect: cleanupConnection,
        sendMessage,
        subscribe,
        wsService: wsServiceRef.current
    };
};