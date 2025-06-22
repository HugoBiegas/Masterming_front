// src/services/multiplayer.ts - Service multiplayer avec types corrects
import { apiService } from './api';
import {
    GameRoom,
    GameResults,
    PlayerProgress,
    CreateRoomRequest,
    JoinRoomRequest,
    LobbyFilters,
    LobbyListResponse,
    MultiplayerApiResponse
} from '@/types/multiplayer';
import {AttemptRequest, AttemptResult, GameType} from '@/types/game';

export class MultiplayerService {
    // ========== ROOM MANAGEMENT ==========

    async createRoom(request: {
        name: string;
        game_type: GameType;
        difficulty: Difficulty;
        max_players: number;
        is_private: boolean;
        password: string;
        allow_spectators: boolean;
        enable_chat: boolean;
        quantum_enabled: boolean;
        total_masterminds: number;
        items_enabled: boolean
    }): Promise<GameRoom> {
        console.log('🌐 Creating multiplayer room:', request);

        const response = await apiService.post<MultiplayerApiResponse<GameRoom>>(
            '/api/v1/multiplayer/rooms/create',
            request
        );
        return response.data.data;
    }

    async joinRoom(request: JoinRoomRequest): Promise<GameRoom> {
        console.log('🌐 Joining room:', request.room_code);

        const response = await apiService.post<MultiplayerApiResponse<GameRoom>>(
            `/api/v1/multiplayer/rooms/${request.room_code}/join`,
            {
                password: request.password,
                as_spectator: request.as_spectator || false
            }
        );
        return response.data.data;
    }

    async leaveRoom(roomCode: string): Promise<void> {
        console.log('🌐 Leaving room:', roomCode);
        await apiService.post(`/api/v1/multiplayer/rooms/${roomCode}/leave`);
    }

    async getRoomDetails(roomCode: string): Promise<GameRoom> {
        console.log('🌐 Getting room details:', roomCode);

        const response = await apiService.get<MultiplayerApiResponse<GameRoom>>(
            `/api/v1/multiplayer/rooms/${roomCode}`
        );
        return response.data.data;
    }

    // ========== LOBBY & MATCHMAKING ==========

    async getLobbyRooms(filters: LobbyFilters = {}, page: number = 1, limit: number = 20): Promise<LobbyListResponse> {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });

        // Ajouter les filtres
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value.toString());
            }
        });

        const response = await apiService.get<MultiplayerApiResponse<LobbyListResponse>>(
            `/api/v1/multiplayer/lobby?${queryParams}`
        );
        return response.data.data;
    }

    async searchRooms(searchTerm: string, filters: LobbyFilters = {}): Promise<GameRoom[]> {
        const allFilters = { ...filters, search_term: searchTerm };
        const result = await this.getLobbyRooms(allFilters);
        return result.rooms;
    }

    // ========== GAME FLOW ==========

    async startGame(roomCode: string): Promise<void> {
        console.log('🌐 Starting game:', roomCode);
        await apiService.post(`/api/v1/multiplayer/rooms/${roomCode}/start`);
    }

    async makeAttempt(roomCode: string, attempt: AttemptRequest): Promise<AttemptResult> {
        console.log('🎯 Multiplayer attempt:', roomCode, attempt);

        const response = await apiService.post<MultiplayerApiResponse<AttemptResult>>(
            `/api/v1/multiplayer/rooms/${roomCode}/attempt`,
            attempt
        );

        console.log('✅ Multiplayer attempt result:', response.data.data);
        return response.data.data;
    }

    async getGameResults(roomCode: string): Promise<GameResults> {
        console.log('🌐 Getting game results:', roomCode);

        const response = await apiService.get<MultiplayerApiResponse<GameResults>>(
            `/api/v1/multiplayer/rooms/${roomCode}/results`
        );

        // Les résultats utilisent déjà PlayerProgress[] comme défini dans les types
        return response.data.data;
    }

    async getPlayerProgress(roomCode: string): Promise<PlayerProgress[]> {
        console.log('🌐 Getting player progress:', roomCode);

        const response = await apiService.get<MultiplayerApiResponse<PlayerProgress[]>>(
            `/api/v1/multiplayer/rooms/${roomCode}/players`
        );
        return response.data.data;
    }

    // ========== GAME STATE ==========

    async getCurrentGameState(roomCode: string): Promise<{
        status: string;
        players: PlayerProgress[];
        current_round?: number;
        timer?: {
            current_time: number;
            time_limit?: number;
            is_running: boolean;
        };
    }> {
        const response = await apiService.get(`/api/v1/multiplayer/rooms/${roomCode}/state`);
        return response.data;
    }

    // ========== ADMIN FUNCTIONS ==========

    async kickPlayer(roomCode: string, userId: string, reason?: string): Promise<void> {
        await apiService.post(`/api/v1/multiplayer/rooms/${roomCode}/kick/${userId}`, {
            reason: reason || 'Kicked by host'
        });
    }

    async promoteToHost(roomCode: string, userId: string): Promise<void> {
        await apiService.post(`/api/v1/multiplayer/rooms/${roomCode}/promote/${userId}`);
    }

    // ========== UTILITIES ==========

    isGameActive(room: GameRoom): boolean {
        return room.status === 'active';
    }

    isGameWaiting(room: GameRoom): boolean {
        return room.status === 'waiting';
    }

    isGameFinished(room: GameRoom): boolean {
        return room.status === 'finished' || room.status === 'cancelled';
    }

    canJoinRoom(room: GameRoom): boolean {
        return room.status === 'waiting' &&
            room.current_players < room.max_players;
    }

    isRoomFull(room: GameRoom): boolean {
        return room.current_players >= room.max_players;
    }

    getRoomStatusText(room: GameRoom): string {
        switch (room.status) {
            case 'waiting': return 'En attente';
            case 'active': return 'En cours';
            case 'finished': return 'Terminée';
            case 'cancelled': return 'Annulée';
            default: return 'Inconnu';
        }
    }

    getRoomStatusIcon(room: GameRoom): string {
        switch (room.status) {
            case 'waiting': return '⏳';
            case 'active': return '🟢';
            case 'finished': return '🏁';
            case 'cancelled': return '❌';
            default: return '❓';
        }
    }

    formatPlayerCount(room: GameRoom): string {
        return `${room.current_players}/${room.max_players}`;
    }

    // ========== ERROR HANDLING ==========

    handleMultiplayerError(error: any, context: string): string {
        console.error(`Multiplayer error in ${context}:`, error);

        if (!error.response) {
            return 'Erreur de connexion réseau';
        }

        const status = error.response.status;
        const data = error.response.data;

        // ✅ CORRECTION: Gestion spécifique des erreurs de validation (422)
        if (status === 422) {
            if (data.detail && Array.isArray(data.detail)) {
                // Erreurs de validation Pydantic - extraire les messages
                const validationErrors = data.detail.map((error: any) => {
                    if (typeof error === 'string') {
                        return error;
                    }
                    if (error.msg) {
                        const location = error.loc ? error.loc.join('.') : 'champ';
                        return `${location}: ${error.msg}`;
                    }
                    return 'Erreur de validation';
                }).join(', ');

                return `Erreur de validation: ${validationErrors}`;
            } else if (typeof data.detail === 'string') {
                return data.detail;
            } else {
                return 'Données invalides';
            }
        }

        // ✅ CORRECTION: Extraction sécurisée du message d'erreur
        let detail = '';
        if (typeof data.detail === 'string') {
            detail = data.detail;
        } else if (typeof data.message === 'string') {
            detail = data.message;
        } else if (data.detail && typeof data.detail === 'object') {
            // Si detail est un objet, essayer d'extraire un message
            detail = data.detail.message || data.detail.msg || JSON.stringify(data.detail);
        }

        switch (status) {
            case 400:
                if (detail?.includes('room')) {
                    return 'Données de salon invalides';
                }
                return detail || 'Requête invalide';

            case 401:
                return 'Session expirée. Reconnectez-vous';

            case 403:
                return 'Accès refusé à ce salon';

            case 404:
                return 'Salon non trouvé';

            case 409:
                if (detail?.includes('full')) {
                    return 'Le salon est complet';
                }
                if (detail?.includes('started')) {
                    return 'La partie a déjà commencé';
                }
                if (detail?.includes('password')) {
                    return 'Mot de passe incorrect';
                }
                return detail || 'Conflit';

            case 429:
                return 'Trop de requêtes. Patientez un moment';

            case 500:
                return 'Erreur serveur. Réessayez plus tard';

            default:
                return detail || 'Erreur inattendue';
        }
    }

}

export const multiplayerService = new MultiplayerService();