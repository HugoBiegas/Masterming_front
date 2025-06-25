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
    private shouldReconnect = true; // NOUVEAU flag

    private readonly HEARTBEAT_INTERVAL = 15000; // 15s au lieu de 30s
    private readonly CONNECTION_TIMEOUT = 15000; // 15s timeout
    private readonly RECONNECT_DELAY_BASE = 1000; // Délai de base 1s
    private readonly MAX_RECONNECT_DELAY = 30000; // Max 30s


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
            console.log('🔌 Déjà en cours de connexion ou connecté');
            return true;
        }

        try {
            this.isConnecting = true;
            this.shouldReconnect = true; // NOUVEAU
            this.roomCode = roomCode;

            // URL WebSocket - CORRECTION pour votre backend
            const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://54.36.101.158:9000'}/ws/multiplayer/${roomCode}?token=${encodeURIComponent(token)}`;

            console.log('🔌 Connexion WebSocket à:', wsUrl);

            this.ws = new WebSocket(wsUrl);

            return new Promise((resolve, reject) => {
                if (!this.ws) {
                    reject(new Error('Impossible de créer WebSocket'));
                    return;
                }

                // NOUVEAU : Timeout plus court et plus strict
                const timeout = setTimeout(() => {
                    console.error('⏰ Timeout de connexion WebSocket');
                    if (this.ws) {
                        this.ws.close();
                    }
                    reject(new Error('Timeout de connexion'));
                }, this.CONNECTION_TIMEOUT);

                this.ws.onopen = () => {
                    clearTimeout(timeout);
                    console.log('✅ WebSocket connecté');
                    this.isConnected = true;
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;
                    this.emit('connected', {});
                    this.startHeartbeat();

                    // NOUVEAU : Authentification immédiate
                    this.sendAuthentication();

                    resolve(true);
                };

                this.ws.onmessage = (event) => {
                    this.handleMessage(event);
                };

                this.ws.onclose = (event) => {
                    clearTimeout(timeout);
                    console.log(`🔌 WebSocket fermé: ${event.code} - ${event.reason}`);
                    this.handleDisconnection(event);
                    resolve(false);
                };

                this.ws.onerror = (error) => {
                    clearTimeout(timeout);
                    console.error('❌ Erreur WebSocket:', error);
                    this.emit('error', { error });
                    reject(error);
                };
            });
        } catch (error) {
            this.isConnecting = false;
            throw error;
        }
    }

    private handleDisconnection(event: CloseEvent): void {
        this.isConnected = false;
        this.isConnecting = false;
        this.isAuthenticated = false;
        this.stopHeartbeat();

        console.log(`🔌 Déconnexion WebSocket: Code=${event.code}, Reason="${event.reason}", Clean=${event.wasClean}`);

        // Émettre l'événement de déconnexion
        this.emit('disconnected', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
        });

        // NOUVEAU : Analyse des raisons de déconnexion
        const shouldAttemptReconnect = this.shouldReconnect &&
            this.reconnectAttempts < this.maxReconnectAttempts &&
            !this.isManualDisconnect(event.code);

        if (shouldAttemptReconnect) {
            this.scheduleReconnect();
        } else {
            console.log('🚫 Pas de tentative de reconnexion:', {
                shouldReconnect: this.shouldReconnect,
                attempts: this.reconnectAttempts,
                maxAttempts: this.maxReconnectAttempts,
                code: event.code
            });
        }
    }

    private isManualDisconnect(code: number): boolean {
        // Codes de déconnexion normale/manuelle
        return [1000, 1001].includes(code);
    }


    disconnect(): void {
        console.log('🚪 Déconnexion manuelle WebSocket');

        this.shouldReconnect = false; // Empêcher la reconnexion automatique

        if (this.reconnectInterval) {
            clearTimeout(this.reconnectInterval);
            this.reconnectInterval = null;
        }

        this.stopHeartbeat();

        if (this.ws) {
            this.ws.close(1000, 'Manual disconnect');
            this.ws = null;
        }

        this.isConnected = false;
        this.isConnecting = false;
        this.isAuthenticated = false;
        this.reconnectAttempts = 0;
    }
    getConnectionHealth(): {
        isConnected: boolean;
        readyState: string;
        reconnectAttempts: number;
        lastHeartbeat: number;
    } {
        return {
            isConnected: this.isConnected,
            readyState: this.ws ? ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][this.ws.readyState] : 'NULL',
            reconnectAttempts: this.reconnectAttempts,
            lastHeartbeat: Date.now()
        };
    }

    private scheduleReconnect(): void {
        if (this.reconnectInterval) {
            clearTimeout(this.reconnectInterval);
        }

        this.reconnectAttempts++;

        // Calcul du délai avec backoff exponentiel + jitter
        const baseDelay = this.RECONNECT_DELAY_BASE * Math.pow(2, this.reconnectAttempts - 1);
        const jitter = Math.random() * 1000; // Ajouter du jitter pour éviter la tempête de reconnexions
        const delay = Math.min(baseDelay + jitter, this.MAX_RECONNECT_DELAY);

        console.log(`🔄 Reconnexion programmée dans ${Math.round(delay)}ms (tentative ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        this.reconnectInterval = setTimeout(async () => {
            if (this.shouldReconnect && this.roomCode) {
                console.log(`🔄 Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                try {
                    // Récupérer le token depuis localStorage/sessionStorage ou contexte
                    const token = this.getStoredToken();
                    if (token) {
                        await this.connect(this.roomCode, token);
                    } else {
                        console.error('❌ Token non disponible pour la reconnexion');
                    }
                } catch (error) {
                    console.error('❌ Échec de reconnexion:', error);
                }
            }
        }, delay);
    }

    private getStoredToken(): string | null {
        // Adapter selon votre système d'auth
        try {
            return localStorage.getItem('auth_token') ||
                sessionStorage.getItem('auth_token') ||
                null;
        } catch {
            return null;
        }
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
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                const heartbeat = {
                    type: 'heartbeat',
                    data: { timestamp: Date.now() }
                };

                try {
                    this.ws.send(JSON.stringify(heartbeat));
                    console.log('💓 Heartbeat envoyé');
                } catch (error) {
                    console.error('❌ Erreur envoi heartbeat:', error);
                    // Si on ne peut pas envoyer de heartbeat, considérer comme déconnecté
                    this.handleConnectionLoss();
                }
            } else {
                console.warn('⚠️ Heartbeat impossible: WebSocket non connecté');
                this.handleConnectionLoss();
            }
        }, this.HEARTBEAT_INTERVAL);
    }

    private handleConnectionLoss(): void {
        if (this.ws) {
            console.log('🔌 Perte de connexion détectée, fermeture propre');
            this.ws.close(1006, 'Connection lost');
        }
    }

    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    subscribeToEvent(eventType: string, handler: (data: any) => void): () => void {
        this.on(eventType, handler);

        // Retourner une fonction de nettoyage
        return () => {
            this.off(eventType, handler);
        };
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
        return this.sendMessage({
            type: 'chat_message',
            data: {
                message,
                timestamp: Date.now()
            }
        });
    }
    requestGameState(): boolean {
        return this.sendMessage({
            type: 'game_state_request',
            data: {}
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

    private handleMessage(event: MessageEvent): void {
        try {
            const message = JSON.parse(event.data);
            console.log('📨 Message WebSocket reçu:', message);

            // Normaliser le format
            const normalizedMessage = {
                type: message.type || 'unknown',
                data: message.data || message,
                timestamp: message.timestamp || Date.now()
            };

            // Gestion spécifique des messages de chat
            if (normalizedMessage.type === 'chat_message' || normalizedMessage.type === 'chat_broadcast') {
                console.log('💬 Message de chat détecté:', normalizedMessage.data);
                this.emit('chat_message', {
                    id: normalizedMessage.data.message_id || `msg_${Date.now()}`,
                    user_id: normalizedMessage.data.user_id,
                    username: normalizedMessage.data.username,
                    message: normalizedMessage.data.message,
                    timestamp: normalizedMessage.data.timestamp || new Date().toISOString(),
                    type: 'user'
                });
            }

            // Gestion des autres événements
            switch (normalizedMessage.type) {
                case 'connection_established':
                    console.log('🔗 Connexion établie');
                    this.emit('connected', {});
                    break;

                case 'player_joined':
                    console.log('👤 Joueur rejoint:', normalizedMessage.data.username);
                    this.emit('player_joined', normalizedMessage.data);
                    break;

                case 'player_left':
                    console.log('👤 Joueur parti:', normalizedMessage.data.username);
                    this.emit('player_left', normalizedMessage.data);
                    break;

                case 'game_started':
                    console.log('🎮 Partie démarrée');
                    this.emit('game_started', normalizedMessage.data);
                    break;

                case 'error':
                    console.error('❌ Erreur WebSocket:', normalizedMessage.data);
                    this.emit('error', normalizedMessage.data);
                    break;

                default:
                    console.log('📄 Événement générique:', normalizedMessage.type);
                    this.emit(normalizedMessage.type, normalizedMessage.data);
                    break;
            }

            // Émettre l'événement générique
            this.emit('message', normalizedMessage);

        } catch (error) {
            console.error('❌ Erreur parsing message WebSocket:', error, event.data);
        }
    }

    private handleSystemMessage(data: any): void {
        console.log('📢 System message:', data.message);
        this.emit('system_message', data);
    }


    private handleGameFinished(data: any): void {
        console.log('🏆 Game finished. Winner:', data.winner_username);
        this.emit('game_finished', data);
        this.emit('game_state_changed', { status: 'finished', ...data });
    }

    private handleConnectionEstablished(data: any): void {
        console.log('🔗 Connection established:', data);
        this.emit('connection_established', data);
    }

    private handleGameStateUpdate(data: any): void {
        console.log('🔄 Game state update');
        this.emit('game_state_update', data);
        this.emit('game_state_changed', data);
    }


    private handleAttemptSubmitted(data: any): void {
        console.log('🎯 Attempt submitted by:', data.username);
        this.emit('attempt_submitted', data);
        this.emit('game_progress', data);

        if (data.is_solution) {
            this.emit('solution_found', data);
        }

        if (data.game_finished) {
            this.emit('game_finished', data);
        }
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

    private handleQuantumHintUsed(data: any): void {
        console.log('⚛️ Quantum hint used by:', data.username);
        this.emit('quantum_hint_used', data);
        this.emit('quantum_event', data);
    }

    private handleChatMessage(data: any): void {
        console.log('💬 Chat message from:', data.username);
        this.emit('chat_message', data);
        this.emit('chat_broadcast', data);
    }


    private handlePlayerJoined(data: any): void {
        console.log('👤 Player joined:', data.username);
        this.emit('player_joined', data);
        this.emit('players_updated', data);
    }

    private handlePlayerLeft(data: any): void {
        console.log('👤 Player left:', data.username, 'Reason:', data.reason);
        this.emit('player_left', data);
        this.emit('players_updated', data);
    }

    private handleGameStarted(data: any): void {
        console.log('🎮 Game started:', data.game_id);
        this.emit('game_started', data);
        this.emit('game_state_changed', { status: 'playing', ...data });
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
        this.emit('websocket_error', data);
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

    private sendAuthentication(): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const authMessage = {
                type: 'authenticate',
                data: {
                    room_code: this.roomCode,
                    timestamp: Date.now()
                }
            };

            console.log('🔐 Envoi authentification:', authMessage);
            this.ws.send(JSON.stringify(authMessage));
        }
    }

    sendHeartbeat(): boolean {
        return this.sendMessage({
            type: 'heartbeat',
            data: { timestamp: Date.now() }
        });
    }

    sendMessage(message: WebSocketMessage): boolean {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('⚠️ Cannot send message: WebSocket not connected');
            return false;
        }

        try {
            const messageString = JSON.stringify(message);
            this.ws.send(messageString);
            console.log('📤 Sent message:', message);
            return true;
        } catch (error) {
            console.error('❌ Failed to send message:', error);
            return false;
        }
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

    removeAllListeners() {
        this.eventListeners.clear();
        console.log('🔌 All event listeners removed');
    }
}
