// src/services/multiplayer.ts
// Service API pour les fonctionnalités multijoueur

import { apiService } from './api';
import {
    MultiplayerGame,
    MultiplayerGameCreateRequest,
    MultiplayerGameCreateResponse,
    PublicGameListing,
    JoinGameRequest,
    JoinGameResponse,
    MultiplayerGameFilters,
    ItemType,
    PlayerItem,
    PlayerProgress,
    GameMastermind,
    PlayerLeaderboard, GameResults
} from '@/types/multiplayer';

export class MultiplayerService {
    // === GESTION DES PARTIES ===

    async createMultiplayerGame(gameData: MultiplayerGameCreateRequest): Promise<MultiplayerGameCreateResponse> {
        const response = await apiService.post<MultiplayerGameCreateResponse>(
            '/api/v1/multiplayer/create',
            gameData
        );
        return response.data;
    }

    async getPublicGames(
        page: number = 1,
        limit: number = 10,
        filters?: MultiplayerGameFilters
    ): Promise<{
        games: PublicGameListing[];
        total: number;
        page: number;
        limit: number;
        has_next: boolean;
    }> {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });

        if (filters) {
            if (filters.difficulty) params.append('difficulty', filters.difficulty);
            if (filters.max_players) params.append('max_players', filters.max_players.toString());
            if (filters.has_slots !== undefined) params.append('has_slots', filters.has_slots.toString());
            if (filters.sort_by) params.append('sort_by', filters.sort_by);
            if (filters.sort_order) params.append('sort_order', filters.sort_order);
        }

        const response = await apiService.get(`/api/v1/multiplayer/public-games?${params}`);
        return response.data;
    }

    async joinMultiplayerGame(request: JoinGameRequest): Promise<JoinGameResponse> {
        const response = await apiService.post<JoinGameResponse>(
            `/api/v1/multiplayer/join/${request.game_id}`,
            { password: request.password }
        );
        return response.data;
    }
    async getGameResults(gameId: string): Promise<GameResults> {
        // TODO: Cette route n'existe pas encore dans le backend
        // Pour l'instant, on simule avec les données de la partie
        try {
            const game = await this.getMultiplayerGame(gameId);

            // Simulation temporaire des résultats
            const mockResults: GameResults = {
                game_id: gameId,
                final_leaderboard: game.player_progresses?.map((player, index) => ({
                    user_id: player.user_id,
                    username: player.username,
                    final_position: index + 1,
                    total_score: player.score || 0,
                    masterminds_completed: player.current_mastermind || 1,
                    total_time: 300, // Mock
                    items_used: player.items?.length || 0
                })) || [],
                game_stats: {
                    total_duration: 1800, // Mock 30 minutes
                    total_masterminds: game.total_masterminds,
                    total_attempts: 50, // Mock
                    items_used: 15 // Mock
                },
                player_stats: {}
            };

            // Ajouter les stats individuelles
            game.player_progresses?.forEach((player, index) => {
                mockResults.player_stats[player.user_id] = {
                    final_position: index + 1,
                    total_score: player.score || 0,
                    masterminds_completed: player.current_mastermind || 1,
                    best_time: 180, // Mock
                    items_used: player.items?.length || 0,
                    favorite_item: player.items?.[0]?.item_type
                };
            });

            return mockResults;
        } catch (error) {
            // Si la partie n'existe plus, on essaie la vraie route
            const response = await apiService.get<GameResults>(`/api/v1/multiplayer/results/${gameId}`);
            return response.data;
        }
    }

    async leaveMultiplayerGame(gameId: string): Promise<{ message: string }> {
        const response = await apiService.post(`/api/v1/multiplayer/leave/${gameId}`);
        return response.data;
    }

    async getMultiplayerGame(gameId: string): Promise<MultiplayerGame> {
        const response = await apiService.get<MultiplayerGame>(`/api/v1/multiplayer/game/${gameId}`);
        return response.data;
    }

    // === GAMEPLAY MULTIJOUEUR ===

    async makeMultiplayerAttempt(
        gameId: string,
        mastermindNumber: number,
        combination: number[]
    ): Promise<{
        attempt: any;
        mastermind_completed: boolean;
        items_obtained?: PlayerItem[];
        score: number;
        next_mastermind?: GameMastermind;
        game_finished?: boolean;
        final_position?: number;
    }> {
        const response = await apiService.post(
            `/api/v1/multiplayer/attempt/${gameId}`,
            {
                mastermind_number: mastermindNumber,
                combination: combination
            }
        );
        return response.data;
    }

    async getCurrentMastermind(gameId: string): Promise<GameMastermind> {
        const response = await apiService.get<GameMastermind>(
            `/api/v1/multiplayer/current-mastermind/${gameId}`
        );
        return response.data;
    }

    async getPlayerProgress(gameId: string, userId?: string): Promise<PlayerProgress> {
        const endpoint = userId
            ? `/api/v1/multiplayer/progress/${gameId}/${userId}`
            : `/api/v1/multiplayer/my-progress/${gameId}`;

        const response = await apiService.get<PlayerProgress>(endpoint);
        return response.data;
    }

    async getAllPlayersProgress(gameId: string): Promise<PlayerProgress[]> {
        const response = await apiService.get<PlayerProgress[]>(
            `/api/v1/multiplayer/all-progress/${gameId}`
        );
        return response.data;
    }

    // === SYSTÈME D'OBJETS ===

    async useItem(
        gameId: string,
        itemType: ItemType,
        targetPlayers?: string[]
    ): Promise<{
        success: boolean;
        message: string;
        effect_applied: boolean;
        remaining_items: PlayerItem[];
    }> {
        const response = await apiService.post(
            `/api/v1/multiplayer/use-item/${gameId}`,
            {
                item_type: itemType,
                target_players: targetPlayers || []
            }
        );
        return response.data;
    }

    async getPlayerItems(gameId: string): Promise<{
        collected_items: PlayerItem[];
        used_items: PlayerItem[];
    }> {
        const response = await apiService.get(
            `/api/v1/multiplayer/my-items/${gameId}`
        );
        return response.data;
    }

    async getAvailableItems(): Promise<{
        [key in ItemType]: {
            name: string;
            description: string;
            rarity: string;
            is_self_target: boolean;
        }
    }> {
        const response = await apiService.get('/api/v1/multiplayer/available-items');
        return response.data;
    }

    // === CLASSEMENTS ET STATISTIQUES ===

    async getGameLeaderboard(gameId: string): Promise<PlayerLeaderboard[]> {
        const response = await apiService.get<PlayerLeaderboard[]>(
            `/api/v1/multiplayer/leaderboard/${gameId}`
        );
        return response.data;
    }

    async getGlobalStats(): Promise<{
        total_multiplayer_games: number;
        total_players: number;
        average_game_duration: number;
        most_popular_difficulty: string;
        most_used_items: { item_type: ItemType; count: number }[];
        top_players: {
            user_id: string;
            username: string;
            games_won: number;
            average_score: number;
        }[];
    }> {
        const response = await apiService.get('/api/v1/multiplayer/stats/global');
        return response.data;
    }

    async getPlayerStats(userId?: string): Promise<{
        games_played: number;
        games_won: number;
        win_rate: number;
        average_score: number;
        total_masterminds_completed: number;
        favorite_difficulty: string;
        most_used_items: { item_type: ItemType; count: number }[];
        best_time: number;
        rank: number;
    }> {
        const endpoint = userId
            ? `/api/v1/multiplayer/stats/player/${userId}`
            : '/api/v1/multiplayer/stats/my-stats';

        const response = await apiService.get(endpoint);
        return response.data;
    }

    // === UTILITAIRES ===

    async searchGames(query: string): Promise<PublicGameListing[]> {
        const response = await apiService.get(
            `/api/v1/multiplayer/search?q=${encodeURIComponent(query)}`
        );
        return response.data;
    }

    async getGameByRoomCode(roomCode: string): Promise<PublicGameListing> {
        const response = await apiService.get(
            `/api/v1/multiplayer/by-room-code/${roomCode}`
        );
        return response.data;
    }

    async startMultiplayerGame(gameId: string): Promise<{
        success: boolean;
        message: string;
        game_started: boolean;
    }> {
        const response = await apiService.post(
            `/api/v1/multiplayer/start/${gameId}`
        );
        return response.data;
    }

    async pauseMultiplayerGame(gameId: string): Promise<{
        success: boolean;
        message: string;
    }> {
        const response = await apiService.post(
            `/api/v1/multiplayer/pause/${gameId}`
        );
        return response.data;
    }

    async resumeMultiplayerGame(gameId: string): Promise<{
        success: boolean;
        message: string;
    }> {
        const response = await apiService.post(
            `/api/v1/multiplayer/resume/${gameId}`
        );
        return response.data;
    }

    // === MÉTHODES UTILITAIRES FRONTEND ===

    canUseItem(item: PlayerItem, currentStatus: string): boolean {
        // Vérifie si un objet peut être utilisé selon le statut actuel
        const allowedStatuses = ['playing', 'mastermind_complete'];
        return allowedStatuses.includes(currentStatus);
    }

    getItemsByRarity(items: PlayerItem[]): Record<string, PlayerItem[]> {
        return items.reduce((acc, item) => {
            const rarity = item.rarity;
            if (!acc[rarity]) acc[rarity] = [];
            acc[rarity].push(item);
            return acc;
        }, {} as Record<string, PlayerItem[]>);
    }

    calculateEstimatedFinishTime(
        currentMastermind: number,
        totalMasterminds: number,
        averageTimePerMastermind: number
    ): number {
        const remainingMasterminds = totalMasterminds - currentMastermind + 1;
        return remainingMasterminds * averageTimePerMastermind;
    }

    formatLeaderboardPosition(position: number): string {
        const suffixes = ['er', 'ème', 'ème'];
        const suffix = position <= 3 ? suffixes[position - 1] : 'ème';
        return `${position}${suffix}`;
    }

    getItemRarityColor(rarity: string): string {
        const colors = {
            'common': 'text-gray-600',
            'rare': 'text-blue-600',
            'epic': 'text-purple-600',
            'legendary': 'text-yellow-600'
        };
        return colors[rarity as keyof typeof colors] || 'text-gray-600';
    }

    getStatusDisplayName(status: string): string {
        const statusNames = {
            'waiting': 'En attente',
            'playing': 'En cours',
            'mastermind_complete': 'Mastermind terminé',
            'finished': 'Terminé',
            'eliminated': 'Éliminé'
        };
        return statusNames[status as keyof typeof statusNames] || status;
    }

    validateMastermindOptions(total: number): boolean {
        return [3, 6, 9, 12].includes(total);
    }
}

export const multiplayerService = new MultiplayerService();