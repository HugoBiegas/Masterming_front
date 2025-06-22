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
            await multiplayerService.leaveAllActiveGames();
        } catch (leaveError) {
            console.warn('Pas de parties actives à quitter:', leaveError);
        }

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

                // CORRECTION: Utiliser les VRAIS choix utilisateur
                is_public: request.is_public,
                password: request.password,
                allow_spectators: request.allow_spectators,
                enable_chat: request.enable_chat,

                // Solution personnalisée (optionnelle)
                solution: request.solution
            }
        );
        return response.data.data;
    }

    async joinRoom(request: JoinRoomRequest): Promise<GameRoom> {
        console.log('🌐 Joining room:', request);

        try {
            await multiplayerService.leaveAllActiveGames();
        } catch (leaveError) {
            console.warn('Pas de parties actives à quitter:', leaveError);
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

        try {
            await apiService.post(`/api/v1/multiplayer/rooms/${roomCode}/leave`);
        } catch (error: any) {
            // CORRECTION: Logger l'erreur mais ne pas la re-throw
            console.warn('Erreur lors de la sortie:', error);
            // L'utilisateur quitte quand même côté frontend
        }
    }

    async leaveAllActiveGames(): Promise<void> {
        console.log('🌐 Leaving all active games for multiplayer');
        const { gameService } = await import('./game');
        await gameService.leaveAllActiveGames();
    }

    async getRoomDetails(roomCode: string): Promise<GameRoom> {
        console.log('🌐 Getting room details:', roomCode);

        const response = await apiService.get<MultiplayerApiResponse<GameRoom>>(
            `/api/v1/multiplayer/rooms/${roomCode}`
        );

        const room = response.data.data;

        // Debug automatique
        this.debugRoomParameters(room);

        return room;
    }

    // ========== LOBBY & MATCHMAKING ==========

    async getLobbyRooms(filters?: LobbyFilters, page: number = 1, limit: number = 20): Promise<LobbyListResponse> {
        console.log('🌐 Getting lobby rooms with filters:', filters);

        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        // CORRECTION: Filtres simplifiés pour éviter les erreurs backend
        const simpleFilters: any = {};

        if (filters?.difficulty) {
            simpleFilters.difficulty = filters.difficulty;
        }
        if (filters?.quantum_enabled !== undefined) {
            simpleFilters.quantum_enabled = filters.quantum_enabled;
        }
        if (filters?.search_term) {
            simpleFilters.search_term = filters.search_term;
        }

        if (Object.keys(simpleFilters).length > 0) {
            params.append('filters', JSON.stringify(simpleFilters));
        }

        const response = await apiService.get<MultiplayerApiResponse<LobbyListResponse>>(
            `/api/v1/multiplayer/rooms/public?${params.toString()}`
        );

        // Le backend filtre déjà, donc on retourne directement
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
        console.log('🌐 Making attempt:', roomCode, attempt);

        const response = await apiService.post<AttemptResult>(
            `/api/v1/multiplayer/rooms/${roomCode}/attempt`,
            attempt
        );
        return response.data;
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

        try {
            const response = await apiService.get<any>(
                `/api/v1/multiplayer/rooms/${roomCode}/players`
            );

            console.log('Raw response from /players:', response.data);

            // CORRECTION: Gestion robuste de la structure de réponse
            let playersData: any[] = [];

            if (response.data) {
                if (Array.isArray(response.data)) {
                    // Cas 1: response.data est directement un tableau
                    playersData = response.data;
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    // Cas 2: response.data.data est un tableau (format API standard)
                    playersData = response.data.data;
                } else if (response.data.success && response.data.data && Array.isArray(response.data.data)) {
                    // Cas 3: structure complète {success: true, data: [...]}
                    playersData = response.data.data;
                } else {
                    console.warn('Format de réponse inattendu pour players:', response.data);
                    return [];
                }
            }

            // Transformer en PlayerProgress si nécessaire
            const playerProgress: PlayerProgress[] = playersData.map((player: any) => ({
                id: player.id ?? player.user_id, // Ajout du champ id requis
                user_id: player.user_id,
                username: player.username,
                status: player.status || 'waiting',
                score: player.score || 0,
                attempts_count: player.attempts_count || 0,
                is_ready: player.is_ready || false,
                is_creator: player.is_creator || false,
                is_winner: player.is_winner || false,
                joined_at: player.joined_at,

                // Champs PlayerProgress avec valeurs par défaut
                current_mastermind: player.current_mastermind || 1,
                completed_masterminds: player.completed_masterminds || 0,
                total_score: player.total_score || player.score || 0,
                total_time: player.total_time || 0.0,
                is_finished: player.is_finished || false,
                finish_position: player.finish_position || null,
                finish_time: player.finish_time || null
            }));

            console.log('Processed player progress:', playerProgress);
            return playerProgress;

        } catch (error: any) {
            console.error('Erreur récupération player progress:', error);

            // En cas d'erreur, retourner un tableau vide plutôt que de faire planter
            return [];
        }
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
        return ['finished', 'cancelled', 'aborted'].includes(room.status);
    }

    isRoomFull(room: GameRoom): boolean {
        return room.current_players >= room.max_players;
    }

    canJoinRoom(room: GameRoom): boolean {
        return room.status === 'waiting' && room.current_players < room.max_players;
    }

    isRoomJoinable(room: GameRoom): boolean {
        return (
            // Room en attente
            room.status === 'waiting' &&
            // Pas pleine
            room.current_players < room.max_players &&
            // Si privée, au moins affichable (on demandera le mot de passe après)
            (!room.is_private || true)
        );
    }

    canStartGame(room: GameRoom, currentUserId: string): boolean {
        // Doit être le créateur, partie en attente, et au moins 1 joueur
        return (
            room.creator.id === currentUserId &&
            room.status === 'waiting' &&
            room.current_players >= 1  // CORRECTION: Minimum 1 joueur (créateur)
        );
    }

    getRoomStatusText(room: GameRoom): string {
        switch (room.status) {
            case 'waiting':
                if (this.isRoomFull(room)) return 'Complète';
                return 'En attente';
            case 'starting': return 'Démarrage...';
            case 'active': return 'En cours';
            case 'paused': return 'En pause';
            case 'finished': return 'Terminée';
            case 'cancelled': return 'Annulée';
            case 'aborted': return 'Interrompue';
            default: return 'Inconnu';
        }
    }

    // CORRECTION: Icônes de status améliorées
    getRoomStatusIcon(room: GameRoom): string {
        switch (room.status) {
            case 'waiting':
                if (this.isRoomFull(room)) return '🔴';
                return '⏳';
            case 'starting': return '🟡';
            case 'active': return '🟢';
            case 'paused': return '⏸️';
            case 'finished': return '🏁';
            case 'cancelled': return '❌';
            case 'aborted': return '⚠️';
            default: return '❓';
        }
    }

    formatPlayerCount(room: GameRoom): string {
        const current = room.current_players;
        const max = room.max_players;

        if (current === max) {
            return `${current}/${max} (Complète)`;
        } else if (current === 0) {
            return `${current}/${max} (Vide)`;
        } else {
            return `${current}/${max}`;
        }
    }

    getGameTypeDisplay(room: GameRoom): string {
        console.log('🔍 Game type raw:', room.game_type, 'Display:', room.game_type_display);

        // Utiliser game_type_display si disponible
        if (room.game_type_display) {
            return room.game_type_display;
        }

        // Sinon mapper le game_type
        const typeMapping = {
            'classic': 'Standard',
            'quantum': 'Quantique',
            'speed': 'Vitesse',
            'precision': 'Précision'
        };

        const mapped = typeMapping[room.game_type] || room.game_type;
        console.log('🔄 Type mapped:', mapped);
        return mapped;
    }

    getItemsStatusDisplay(room: GameRoom): string {
        console.log('🎁 Items enabled:', room.items_enabled);

        // Vérifier items_enabled directement
        if (typeof room.items_enabled === 'boolean') {
            return room.items_enabled ? 'Activés' : 'Désactivés';
        }

        // Fallback: vérifier dans settings si disponible
        if (room.settings && typeof room.settings.items_enabled === 'boolean') {
            return room.settings.items_enabled ? 'Activés' : 'Désactivés';
        }

        // Par défaut: activés
        return 'Activés';
    }

    getItemsStatusIcon(room: GameRoom): string {
        const enabled = this.isItemsEnabled(room);
        return enabled ? '✅' : '❌';
    }

    isItemsEnabled(room: GameRoom): boolean {
        if (typeof room.items_enabled === 'boolean') {
            return room.items_enabled;
        }

        if (room.settings && typeof room.settings.items_enabled === 'boolean') {
            return room.settings.items_enabled;
        }

        return true; // Par défaut activés
    }

    getTotalMasterminds(room: GameRoom): number {
        console.log('🎯 Total masterminds:', room.total_masterminds);

        if (typeof room.total_masterminds === 'number') {
            return room.total_masterminds;
        }

        if (room.settings && typeof room.settings.total_masterminds === 'number') {
            return room.settings.total_masterminds;
        }

        return 3; // Par défaut
    }

    getGameParametersDisplay(room: GameRoom): {
        type: string;
        difficulty: string;
        masterminds: number;
        items: string;
        itemsIcon: string;
        players: string;
        quantum: boolean;
        spectators: boolean;
        chat: boolean;
    } {
        return {
            type: this.getGameTypeDisplay(room),
            difficulty: this.getDifficultyDisplay(room.difficulty),
            masterminds: this.getTotalMasterminds(room),
            items: this.getItemsStatusDisplay(room),
            itemsIcon: this.getItemsStatusIcon(room),
            players: this.formatPlayerCount(room),
            quantum: room.quantum_enabled || false,
            spectators: room.allow_spectators || false,
            chat: room.enable_chat || false
        };
    }

    debugRoomParameters(room: GameRoom): void {
        console.log('🔍 DEBUG Room Parameters:');
        console.log('- game_type:', room.game_type);
        console.log('- game_type_display:', room.game_type_display);
        console.log('- total_masterminds:', room.total_masterminds);
        console.log('- items_enabled:', room.items_enabled);
        console.log('- difficulty:', room.difficulty);
        console.log('- quantum_enabled:', room.quantum_enabled);
        console.log('- allow_spectators:', room.allow_spectators);
        console.log('- enable_chat:', room.enable_chat);
        console.log('- settings:', room.settings);

        const params = this.getGameParametersDisplay(room);
        console.log('📊 Computed Parameters:', params);
    }

    // CORRECTION: Affichage de la difficulté
    getDifficultyDisplay(difficulty: string): string {
        const difficultyMapping = {
            'easy': 'Facile',
            'medium': 'Moyen',
            'hard': 'Difficile',
            'expert': 'Expert',
            'quantum': 'Quantique'
        };

        return difficultyMapping[difficulty as keyof typeof difficultyMapping] || difficulty;
    }

    getRoomStatusColor(room: GameRoom): string {
        switch (room.status) {
            case 'waiting':
                if (this.isRoomFull(room)) return 'text-red-600';
                return 'text-yellow-600';
            case 'starting': return 'text-orange-600';
            case 'active': return 'text-green-600';
            case 'paused': return 'text-blue-600';
            case 'finished': return 'text-gray-600';
            case 'cancelled': return 'text-red-600';
            case 'aborted': return 'text-red-600';
            default: return 'text-gray-400';
        }
    }

    // ========== ERROR HANDLING ==========

    handleMultiplayerError(error: any, context: string): string {
        console.error(`❌ Erreur ${context}:`, error);

        // CORRECTION: Gestion plus robuste des erreurs
        if (!error) {
            return 'Erreur inconnue.';
        }

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
                return 'Accès refusé.';
            case 404:
                return 'Partie non trouvée ou supprimée.';
            case 409:
                return data?.detail || 'Partie complète ou conflit.';
            case 422:
                return 'Données de requête invalides.';
            case 500:
                return 'Erreur serveur. Réessayez dans quelques instants.';
            default:
                return data?.detail || `Erreur ${status}`;
        }
    }
}

export const multiplayerService = new MultiplayerService();