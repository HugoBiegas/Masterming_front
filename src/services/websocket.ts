import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';

export interface WebSocketMessage {
    type: string;
    data: any;
    timestamp?: number;
    message_id?: string;
}

export interface ChatMessage {
    id: string;
    user_id: string;
    username: string;
    message: string;
    timestamp: string;
    type: 'user' | 'system' | 'game';
}

export class MultiplayerWebSocketService {
    private ws: WebSocket | null = null;
    private reconnectInterval: NodeJS.Timeout | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private isConnecting = false;
    private isAuthenticated = false;

    // Event listeners
    private eventListeners: Map<string, Set<Function>> = new Map();

    // Connection state
    public isConnected = false;
    public roomCode: string | null = null;
    public userId: string | null = null;

    constructor() {
        console.log('🔌 MultiplayerWebSocketService initialized');
    }

    // =====================================================
    // CONNEXION ET AUTHENTIFICATION
    // =====================================================

    async connect(roomCode: string, token: string): Promise<boolean> {
        if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
            console.log('🔌 Already connecting or connected');
            return true;
        }

        try {
            this.isConnecting = true;
            this.roomCode = roomCode;

            // URL WebSocket backend
            const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/api/v1/multiplayer/rooms/${roomCode}/ws?token=${encodeURIComponent(token)}`;

            console.log('🔌 Connecting to WebSocket:', wsUrl);

            this.ws = new WebSocket(wsUrl);

            return new Promise((resolve, reject) => {
                if (!this.ws) {
                    reject(new Error('WebSocket not initialized'));
                    return;
                }

                this.ws.onopen = () => {
                    console.log('✅ WebSocket connected');
                    this.isConnected = true;
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;

                    // Démarrer le heartbeat
                    this.startHeartbeat();

                    // Émettre l'événement de connexion
                    this.emit('connected', { roomCode });

                    resolve(true);
                };

                this.ws.onmessage = (event) => {
                    this.handleMessage(event.data);
                };

                this.ws.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    this.emit('error', { error: 'Connection error' });
                    reject(error);
                };

                this.ws.onclose = (event) => {
                    console.log('🔌 WebSocket closed:', event.code, event.reason);
                    this.isConnected = false;
                    this.isConnecting = false;
                    this.isAuthenticated = false;

                    this.stopHeartbeat();
                    this.emit('disconnected', { code: event.code, reason: event.reason });

                    // Tentative de reconnexion si ce n'était pas volontaire
                    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.scheduleReconnect();
                    }
                };

                // Timeout de connexion
                setTimeout(() => {
                    if (this.isConnecting) {
                        reject(new Error('Connection timeout'));
                    }
                }, 10000);
            });

        } catch (error) {
            console.error('❌ WebSocket connection failed:', error);
            this.isConnecting = false;
            throw error;
        }
    }

    disconnect(): void {
        console.log('🔌 Disconnecting WebSocket');

        this.stopHeartbeat();

        if (this.reconnectInterval) {
            clearTimeout(this.reconnectInterval);
            this.reconnectInterval = null;
        }

        if (this.ws) {
            this.ws.close(1000, 'Disconnect requested');
            this.ws = null;
        }

        this.isConnected = false;
        this.isAuthenticated = false;
        this.roomCode = null;
        this.userId = null;
    }

    private scheduleReconnect(): void {
        if (this.reconnectInterval) return;

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

        console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

        this.reconnectInterval = setTimeout(async () => {
            this.reconnectInterval = null;

            if (this.roomCode) {
                try {
                    // Récupérer le token (à adapter selon votre système d'auth)
                    const token = localStorage.getItem('auth_token') || '';
                    await this.connect(this.roomCode, token);
                } catch (error) {
                    console.error('❌ Reconnect failed:', error);
                }
            }
        }, delay);
    }

    // =====================================================
    // HEARTBEAT
    // =====================================================

    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                this.send({
                    type: 'heartbeat',
                    data: {
                        timestamp: Date.now()
                    }
                });
            }
        }, 30000); // Heartbeat toutes les 30 secondes
    }

    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    // =====================================================
    // ENVOI DE MESSAGES
    // =====================================================

    send(message: WebSocketMessage): boolean {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('⚠️ WebSocket not connected, cannot send message:', message);
            return false;
        }

        try {
            const messageWithId = {
                ...message,
                timestamp: Date.now(),
                message_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            };

            this.ws.send(JSON.stringify(messageWithId));
            console.log('📤 Sent WebSocket message:', messageWithId.type);
            return true;
        } catch (error) {
            console.error('❌ Failed to send WebSocket message:', error);
            return false;
        }
    }

    // =====================================================
    // MÉTHODES SPÉCIFIQUES AU CHAT
    // =====================================================

    sendChatMessage(message: string): boolean {
        return this.send({
            type: 'chat_message',
            data: {
                room_id: this.roomCode,
                message: message.trim(),
                timestamp: new Date().toISOString()
            }
        });
    }

    // =====================================================
    // MÉTHODES SPÉCIFIQUES AU JEU
    // =====================================================

    joinGameRoom(): boolean {
        return this.send({
            type: 'join_game_room',
            data: {
                room_id: this.roomCode
            }
        });
    }

    leaveGameRoom(): boolean {
        return this.send({
            type: 'leave_game_room',
            data: {
                room_id: this.roomCode
            }
        });
    }

    makeAttempt(gameId: string, combination: number[]): boolean {
        return this.send({
            type: 'make_attempt',
            data: {
                game_id: gameId,
                combination: combination
            }
        });
    }

    startGame(gameId: string): boolean {
        return this.send({
            type: 'start_game',
            data: {
                game_id: gameId
            }
        });
    }

    // =====================================================
    // GESTION DES MESSAGES ENTRANTS
    // =====================================================

    private handleMessage(rawData: string): void {
        try {
            const message: WebSocketMessage = JSON.parse(rawData);
            console.log('📥 Received WebSocket message:', message.type, message.data);

            // Router les messages selon leur type
            switch (message.type) {
                case 'connection_established':
                    this.handleConnectionEstablished(message.data);
                    break;
                case 'authentication_success':
                    this.handleAuthenticationSuccess(message.data);
                    break;
                case 'authentication_failed':
                    this.handleAuthenticationFailed(message.data);
                    break;
                case 'chat_broadcast':
                case 'chat_message':
                    this.handleChatMessage(message.data);
                    break;
                case 'player_connected':
                case 'player_joined':
                    this.handlePlayerJoined(message.data);
                    break;
                case 'player_disconnected':
                case 'player_left':
                    this.handlePlayerLeft(message.data);
                    break;
                case 'game_started':
                    this.handleGameStarted(message.data);
                    break;
                case 'attempt_made':
                    this.handleAttemptMade(message.data);
                    break;
                case 'room_state':
                    this.handleRoomState(message.data);
                    break;
                case 'heartbeat':
                    // Heartbeat reçu, connection OK
                    break;
                case 'error':
                    this.handleError(message.data);
                    break;
                default:
                    console.log('📥 Unhandled message type:', message.type);
                    break;
            }

            // Émettre l'événement générique
            this.emit('message', message);
            this.emit(message.type, message.data);

        } catch (error) {
            console.error('❌ Failed to parse WebSocket message:', error);
        }
    }

    private handleConnectionEstablished(data: any): void {
        console.log('✅ Connection established:', data);
        this.emit('connection_established', data);
    }

    private handleAuthenticationSuccess(data: any): void {
        console.log('✅ Authentication successful:', data);
        this.isAuthenticated = true;
        this.userId = data.user_id;
        this.emit('authentication_success', data);
    }

    private handleAuthenticationFailed(data: any): void {
        console.error('❌ Authentication failed:', data);
        this.emit('authentication_failed', data);
    }

    private handleChatMessage(data: any): void {
        const chatMessage: ChatMessage = {
            id: `${data.user_id}-${Date.now()}`,
            user_id: data.user_id,
            username: data.username,
            message: data.message,
            timestamp: data.timestamp || new Date().toISOString(),
            type: 'user'
        };

        this.emit('chat_message', chatMessage);
    }

    private handlePlayerJoined(data: any): void {
        console.log('👤 Player joined:', data);
        this.emit('player_joined', data);
    }

    private handlePlayerLeft(data: any): void {
        console.log('👤 Player left:', data);
        this.emit('player_left', data);
    }

    private handleGameStarted(data: any): void {
        console.log('🎮 Game started:', data);
        this.emit('game_started', data);
    }

    private handleAttemptMade(data: any): void {
        console.log('🎯 Attempt made:', data);
        this.emit('attempt_made', data);
    }

    private handleRoomState(data: any): void {
        console.log('🏠 Room state:', data);
        this.emit('room_state', data);
    }

    private handleError(data: any): void {
        console.error('❌ WebSocket error:', data);
        this.emit('error', data);
    }

    // =====================================================
    // SYSTÈME D'ÉVÉNEMENTS
    // =====================================================

    on(event: string, callback: Function): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event)!.add(callback);
    }

    off(event: string, callback: Function): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.delete(callback);
        }
    }

    private emit(event: string, data: any): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    // =====================================================
    // MÉTHODES D'INFO
    // =====================================================

    getConnectionState(): string {
        if (!this.ws) return 'disconnected';

        switch (this.ws.readyState) {
            case WebSocket.CONNECTING: return 'connecting';
            case WebSocket.OPEN: return 'connected';
            case WebSocket.CLOSING: return 'closing';
            case WebSocket.CLOSED: return 'disconnected';
            default: return 'unknown';
        }
    }

    getStats(): any {
        return {
            isConnected: this.isConnected,
            isAuthenticated: this.isAuthenticated,
            roomCode: this.roomCode,
            userId: this.userId,
            reconnectAttempts: this.reconnectAttempts,
            connectionState: this.getConnectionState()
        };
    }
}
