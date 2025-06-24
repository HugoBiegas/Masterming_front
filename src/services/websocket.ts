import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';

export interface WebSocketMessage {
    type: string;
    data: any;
    timestamp?: number;
    message_id?: string;
    room_code?: string;
    user_id?: string;
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

    authenticate(userId: string, token?: string): boolean {
        if (!this.isConnected) {
            console.warn('⚠️ Cannot authenticate: not connected');
            return false;
        }

        const authMessage = {
            type: 'authenticate',
            data: {
                user_id: userId,
                room_code: this.roomCode,
                token: token || '',
                timestamp: new Date().toISOString()
            }
        };

        return this.send(authMessage);
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

    send(message: any): boolean {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('⚠️ Cannot send message: WebSocket not connected');
            return false;
        }

        try {
            // NOUVEAU: Validation et normalisation du message sortant
            const normalizedMessage = {
                type: message.type || 'unknown',
                data: message.data || message,
                timestamp: new Date().toISOString(),
                user_id: this.userId,
                room_code: this.roomCode
            };

            const messageString = JSON.stringify(normalizedMessage);
            this.ws.send(messageString);

            console.log('📤 Sent WebSocket message:', normalizedMessage.type, normalizedMessage.data);
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
            // NOUVEAU: Parser avec validation robuste
            let parsedMessage: any;

            try {
                parsedMessage = JSON.parse(rawData);
            } catch (parseError) {
                console.error('❌ Failed to parse WebSocket message:', parseError);
                console.error('Raw data:', rawData);
                return;
            }

            // CORRECTION: Normaliser le format du message
            const message: WebSocketMessage = {
                type: parsedMessage.type || 'unknown',
                data: parsedMessage.data || parsedMessage, // Fallback si data est directement dans le message
                timestamp: parsedMessage.timestamp || new Date().toISOString(),
                message_id: parsedMessage.message_id || `msg_${Date.now()}`,
                room_code: parsedMessage.room_code,
                user_id: parsedMessage.user_id
            };

            console.log('📥 Received WebSocket message:', message.type, message.data);

            // CORRECTION: Validation des données avant traitement
            if (!message.type) {
                console.warn('⚠️ WebSocket message missing type:', parsedMessage);
                return;
            }

            // Router les messages selon leur type avec gestion des données manquantes
            switch (message.type) {
                case 'connection_established':
                    this.handleConnectionEstablished(message.data || {});
                    break;
                case 'authentication_success':
                    this.handleAuthenticationSuccess(message.data || {});
                    break;
                case 'authentication_failed':
                    this.handleAuthenticationFailed(message.data || {});
                    break;
                case 'chat_broadcast':
                case 'chat_message':
                    this.handleChatMessage(message.data || {});
                    break;
                case 'player_connected':
                case 'player_joined':
                    this.handlePlayerJoined(message.data || {});
                    break;
                case 'player_disconnected':
                case 'player_left':
                    this.handlePlayerLeft(message.data || {});
                    break;
                case 'game_started':
                    this.handleGameStarted(message.data || {});
                    break;
                case 'attempt_made':
                    this.handleAttemptMade(message.data || {});
                    break;
                case 'room_state':
                    this.handleRoomState(message.data || {});
                    break;
                case 'heartbeat':
                    // Heartbeat reçu, connection OK
                    this.handleHeartbeat(message.data || {});
                    break;
                case 'error':
                    this.handleError(message.data || {});
                    break;
                default:
                    console.log('📥 Unhandled message type:', message.type);
                    break;
            }

            // Émettre l'événement générique
            this.emit('message', message);
            this.emit(message.type, message.data || {});

        } catch (error) {
            console.error('❌ Failed to handle WebSocket message:', error);
            console.error('Raw data:', rawData);
        }
    }
    private handleConnectionEstablished(data: any): void {
        console.log('✅ Connection established:', data);
        this.emit('connection_established', data);
    }

    private handleAuthenticationSuccess(data: any): void {
        console.log('✅ Authentication successful:', data);
        this.isAuthenticated = true;
        this.userId = data.user_id || this.userId;
        this.emit('authentication_success', data);
    }

    private handleAuthenticationFailed(data: any): void {
        console.error('❌ Authentication failed:', data);
        this.emit('authentication_failed', data);
    }

    private handleHeartbeat(data: any): void {
        // Répondre au heartbeat pour maintenir la connexion
        if (this.isConnected) {
            this.send({
                type: 'heartbeat_response',
                data: {
                    timestamp: new Date().toISOString()
                }
            });
        }
    }

    private handleChatMessage(data: any): void {
        // CORRECTION: Validation et normalisation des données de chat
        const chatMessage: ChatMessage = {
            id: data.message_id || `${data.user_id || 'unknown'}-${Date.now()}`,
            user_id: data.user_id || 'system',
            username: data.username || 'Utilisateur',
            message: data.message || '',
            timestamp: data.timestamp || new Date().toISOString(),
            type: data.type || 'user'
        };

        if (chatMessage.message.trim()) {
            this.emit('chat_message', chatMessage);
        }
    }

    private handlePlayerJoined(data: any): void {
        console.log('👤 Player joined:', data);

        // CORRECTION: Normaliser les données du joueur
        const playerData = {
            user_id: data.user_id || data.userId,
            username: data.username || data.user_name || 'Joueur',
            timestamp: data.timestamp || new Date().toISOString(),
            connections_count: data.connections_count || 0,
            ...data
        };

        this.emit('player_joined', playerData);
    }

    private handlePlayerLeft(data: any): void {
        console.log('👤 Player left:', data);

        // CORRECTION: Normaliser les données du joueur qui part
        const playerData = {
            user_id: data.user_id || data.userId,
            username: data.username || data.user_name || 'Joueur',
            timestamp: data.timestamp || new Date().toISOString(),
            connections_count: data.connections_count || 0,
            ...data
        };

        this.emit('player_left', playerData);
    }

    private handleGameStarted(data: any): void {
        console.log('🎮 Game started:', data);

        // CORRECTION: Normaliser les données de démarrage de jeu
        const gameData = {
            room_code: data.room_code || data.roomCode || this.roomCode,
            started_at: data.started_at || data.startedAt || new Date().toISOString(),
            current_mastermind: data.current_mastermind || data.currentMastermind || 1,
            timestamp: data.timestamp || new Date().toISOString(),
            ...data
        };

        this.emit('game_started', gameData);
    }

    private handleAttemptMade(data: any): void {
        console.log('🎯 Attempt made:', data);
        this.emit('attempt_made', data);
    }

    private handleRoomState(data: any): void {
        console.log('🏠 Room state:', data);

        // CORRECTION: Validation de l'état de la room
        if (!data || typeof data !== 'object') {
            console.warn('⚠️ Invalid room state data:', data);
            return;
        }

        // NOUVEAU: Normaliser l'état de la room
        const roomState = {
            room_code: data.room_code || data.roomCode || this.roomCode,
            status: data.status || 'unknown',
            current_mastermind: data.current_mastermind || data.currentMastermind || 1,
            players: Array.isArray(data.players) ? data.players : [],
            connections_count: data.connections_count || data.connectionsCount || 0,
            active_effects: Array.isArray(data.active_effects) ? data.active_effects : [],
            timestamp: data.timestamp || new Date().toISOString(),
            ...data
        };

        this.emit('room_state', roomState);
    }

    private handleError(data: any): void {
        console.error('❌ WebSocket error received:', data);

        // CORRECTION: Normaliser les données d'erreur
        const errorData = {
            message: data.message || data.error || 'Erreur WebSocket inconnue',
            code: data.code || data.error_code || 'UNKNOWN_ERROR',
            timestamp: data.timestamp || new Date().toISOString(),
            ...data
        };

        this.emit('error', errorData);
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
