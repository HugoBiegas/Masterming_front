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
import {AttemptRequest, AttemptResult, Difficulty, GameType} from '@/types/game';

export class MultiplayerService {
    // ========== ROOM MANAGEMENT ==========

    async createRoom(request: CreateRoomRequest): Promise<GameRoom> {
        console.log('🌐 Creating multiplayer room:', request);

        try {
            // Quitter toutes les parties actives avant de créer
            await multiplayerService.leaveAllActiveGames();
        } catch (leaveError) {
            console.warn('Pas de parties actives à quitter:', leaveError);
            // Ne pas bloquer la création pour cette erreur
        }

        // CORRECTION: Utiliser directement CreateRoomRequest qui contient maintenant tous les champs
        const response = await apiService.post<MultiplayerApiResponse<GameRoom>>(
            '/api/v1/multiplayer/rooms/create',
            {
                // Configuration de base
                game_type: request.game_type,
                difficulty: request.difficulty,
                max_players: request.max_players,

                // Configuration du mastermind
                combination_length: request.combination_length,
                available_colors: request.available_colors,
                max_attempts: request.max_attempts,

                // Configuration multijoueur
                total_masterminds: request.total_masterminds,

                // Options avancées
                quantum_enabled: request.quantum_enabled,
                items_enabled: request.items_enabled,
                items_per_mastermind: request.items_per_mastermind,

                // Visibilité
                is_public: request.is_public,
                password: request.password,

                // Solution personnalisée (optionnelle)
                solution: request.solution
            }
        );
        return response.data.data;
    }

    async joinRoom(request: JoinRoomRequest): Promise<GameRoom> {
        console.log('🌐 Joining room:', request);

        try {
            // Quitter toutes les parties actives avant de rejoindre
            await multiplayerService.leaveAllActiveGames();
        } catch (leaveError) {
            console.warn('Pas de parties actives à quitter:', leaveError);
            // Ne pas bloquer le join pour cette erreur
        }

        const response = await apiService.post<MultiplayerApiResponse<GameRoom>>(
            `/api/v1/multiplayer/rooms/${request.room_code}/join`,
            {
                password: request.password,
                as_spectator: request.as_spectator || false
            }
        );
        return response.data.data;
    }

    async joinByCode(roomCode: string, password?: string): Promise<GameRoom> {
        console.log('🌐 Joining by room code:', roomCode);

        try {
            // Quitter toutes les parties actives avant de rejoindre
            await multiplayerService.leaveAllActiveGames();
        } catch (leaveError) {
            console.warn('Pas de parties actives à quitter:', leaveError);
            // Ne pas bloquer le join pour cette erreur
        }

        const response = await apiService.post<MultiplayerApiResponse<GameRoom>>(
            `/api/v1/multiplayer/rooms/${roomCode}/join`,
            {
                password: password || null,
                as_spectator: false
            }
        );
        return response.data.data;
    }

    async leaveRoom(roomCode: string): Promise<void> {
        console.log('🌐 Leaving room:', roomCode);
        await apiService.post(`/api/v1/multiplayer/rooms/${roomCode}/leave`);
    }

    async leaveAllActiveGames(): Promise<void> {
        console.log('🌐 Leaving all active games for multiplayer');
        // Déléguer au gameService qui a déjà cette fonctionnalité
        const { gameService } = await import('./game');
        await gameService.leaveAllActiveGames();
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
        return room.status === 'finished';
    }

    canJoinRoom(room: GameRoom): boolean {
        return room.status === 'waiting' && room.current_players < room.max_players;
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
        console.error(`❌ Erreur ${context}:`, error);

        // Erreur de réseau
        if (!error.response) {
            return 'Erreur de connexion. Vérifiez votre connexion internet.';
        }

        const { status, data } = error.response;

        switch (status) {
            case 400:
                return data?.detail || 'Données invalides';
            case 401:
                return 'Session expirée. Reconnectez-vous.';
            case 403:
                return 'Accès refusé. Vérifiez vos permissions.';
            case 404:
                return 'Partie non trouvée ou inexistante';
            case 409:
                if (context === 'joinRoom') {
                    return 'Partie déjà pleine ou vous êtes déjà dans une autre partie';
                }
                return 'Conflit - operation impossible';
            case 422:
                if (data?.detail && Array.isArray(data.detail)) {
                    const validationErrors = data.detail.map((error: any) => {
                        return error.msg || String(error);
                    }).join(', ');
                    return `Erreur de validation: ${validationErrors}`;
                }
                return data?.detail || 'Données de requête invalides';
            case 500:
                return 'Erreur serveur. Réessayez dans quelques instants.';
            default:
                return data?.detail || `Erreur ${status}`;
        }
    }

}

export const multiplayerService = new MultiplayerService();