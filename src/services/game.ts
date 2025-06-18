// src/services/game.ts - Version avec debug des appels API
import {
    Game,
    GameCreateRequest,
    GameCreateResponse,
    AttemptRequest,
    AttemptResult,
    LeaveGameResponse,
    ApiResponse
} from '@/types/game';
import { apiService } from './api';

export class GameService {
    async createGame(gameData: GameCreateRequest): Promise<GameCreateResponse> {
        const response = await apiService.post<GameCreateResponse>('/api/v1/games/create', gameData);
        return response.data;
    }

    // Nouvelle méthode pour créer une partie avec auto-leave
    async createGameWithAutoLeave(gameData: GameCreateRequest): Promise<GameCreateResponse> {
        const response = await apiService.post<GameCreateResponse>(
            `/api/v1/games/create?auto_leave=${gameData.auto_leave || false}`,
            gameData
        );
        return response.data;
    }

    async getGame(gameId: string): Promise<Game> {
        console.log('🌐 API Call: GET /api/v1/games/' + gameId);

        const response = await apiService.get<Game>(`/api/v1/games/${gameId}`);

        // 🔍 DEBUG: Examiner la réponse brute de l'API
        console.log('📡 Raw API response for getGame:', response);
        console.log('📦 Game data from API:', response.data);

        if (response.data.attempts) {
            console.log('📊 Attempts in API response:', response.data.attempts.length);
            response.data.attempts.forEach((attempt, index) => {
                console.log(`🎯 API Attempt ${index + 1}:`, {
                    attempt_number: attempt.attempt_number,
                    quantum_calculated: attempt.quantum_calculated,
                    has_quantum_probabilities: !!attempt.quantum_probabilities,
                    quantum_probabilities_structure: attempt.quantum_probabilities ? {
                        exact_matches: attempt.quantum_probabilities.exact_matches,
                        wrong_position: attempt.quantum_probabilities.wrong_position,
                        position_probabilities_count: attempt.quantum_probabilities.position_probabilities?.length || 0,
                        quantum_calculated: attempt.quantum_probabilities.quantum_calculated,
                        shots_used: attempt.quantum_probabilities.shots_used
                    } : null,
                    // Données classiques
                    exact_matches: attempt.exact_matches,
                    position_matches: attempt.position_matches,
                    // Legacy
                    correct_positions: (attempt as any).correct_positions,
                    correct_colors: (attempt as any).correct_colors
                });
            });
        }

        return response.data;
    }

    async joinGame(gameId: string, password?: string): Promise<Game> {
        const response = await apiService.post<Game>(`/api/v1/games/${gameId}/join`, {
            password
        });
        return response.data;
    }

    async makeAttempt(gameId: string, attempt: AttemptRequest): Promise<AttemptResult> {
        console.log('🌐 API Call: POST /api/v1/games/' + gameId + '/attempt');
        console.log('📤 Attempt request:', attempt);

        const response = await apiService.post<AttemptResult>(`/api/v1/games/${gameId}/attempt`, attempt);

        // 🔍 DEBUG: Examiner la réponse de makeAttempt
        console.log('📡 Raw API response for makeAttempt:', response);
        console.log('✅ AttemptResult from API:', response.data);
        console.log('🔮 Quantum data in AttemptResult:', {
            quantum_calculated: response.data.quantum_calculated,
            quantum_probabilities: response.data.quantum_probabilities,
            quantum_hint_used: response.data.quantum_hint_used
        });

        return response.data;
    }

    async getGameHistory(gameId: string): Promise<any[]> {
        const response = await apiService.get(`/api/v1/games/${gameId}/history`);
        return response.data;
    }

    // Nouvelle méthode pour quitter toutes les parties actives
    async leaveAllActiveGames(): Promise<LeaveGameResponse> {
        const response = await apiService.post<LeaveGameResponse>('/api/v1/games/leave-all-active');
        return response.data;
    }

    // Nouvelle méthode pour obtenir la partie active de l'utilisateur
    async getCurrentGame(): Promise<Game | null> {
        const response = await apiService.get<Game | null>('/api/v1/games/my-current-game');
        return response.data;
    }

    // Nouvelle méthode pour démarrer une partie
    async startGame(gameId: string): Promise<ApiResponse<any>> {
        const response = await apiService.post<ApiResponse<any>>(`/api/v1/games/${gameId}/start`);
        return response.data;
    }

    // Méthode pour obtenir les parties publiques
    async getPublicGames(page: number = 1, limit: number = 10): Promise<any> {
        const response = await apiService.get(`/api/v1/games/public?page=${page}&limit=${limit}`);
        return response.data;
    }

    // Méthode pour rechercher des parties
    async searchGames(filters: any = {}, page: number = 1, limit: number = 10): Promise<any> {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...filters
        });
        const response = await apiService.get(`/api/v1/games/search?${queryParams}`);
        return response.data;
    }

    // Méthode pour obtenir les statistiques d'une partie
    async getGameStats(gameId: string): Promise<any> {
        const response = await apiService.get(`/api/v1/games/${gameId}/stats`);
        return response.data;
    }

    // Méthode pour obtenir un hint quantique
    async getQuantumHint(gameId: string, hintType: string = 'grover'): Promise<any> {
        const response = await apiService.post(`/api/v1/games/${gameId}/quantum-hint?hint_type=${hintType}`);
        return response.data;
    }

    // Méthode pour exporter une partie
    async exportGame(gameId: string, format: string = 'json'): Promise<any> {
        const response = await apiService.get(`/api/v1/games/${gameId}/export?format=${format}`);
        return response.data;
    }

    // Méthode pour obtenir le classement
    async getLeaderboard(gameType?: string, timePeriod: string = 'all', limit: number = 10): Promise<any> {
        const queryParams = new URLSearchParams({
            time_period: timePeriod,
            limit: limit.toString()
        });

        if (gameType) {
            queryParams.append('game_type', gameType);
        }

        const response = await apiService.get(`/api/v1/games/stats/leaderboard?${queryParams}`);
        return response.data;
    }

    // Méthode pour modérer une partie (admin)
    async moderateGame(gameId: string, action: string, reason: string): Promise<any> {
        const response = await apiService.post(
            `/api/v1/games/${gameId}/moderate?action=${action}&reason=${encodeURIComponent(reason)}`
        );
        return response.data;
    }

    // Méthode pour obtenir les parties de l'utilisateur
    async getUserGames(page: number = 1, limit: number = 10, status?: string): Promise<any> {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });

        if (status) {
            queryParams.append('status', status);
        }

        const response = await apiService.get(`/api/v1/games/my-games?${queryParams}`);
        return response.data;
    }

    // Méthode pour forcer la sortie d'un utilisateur (admin)
    async forceLeaveUser(userId: string): Promise<any> {
        const response = await apiService.post(`/api/v1/games/admin/force-leave/${userId}`);
        return response.data;
    }

    // Méthode pour obtenir le statut de jeu d'un utilisateur
    async getUserGameStatus(userId: string): Promise<any> {
        const response = await apiService.get(`/api/v1/games/user/${userId}/game-status`);
        return response.data;
    }

    // Méthode utilitaire pour vérifier si une partie est active
    isGameActive(game: Game): boolean {
        return game.status === 'active';
    }

    // Méthode utilitaire pour vérifier si une partie est terminée
    isGameFinished(game: Game): boolean {
        return game.status === 'finished';
    }

    // Méthode utilitaire pour vérifier si un utilisateur peut rejoindre une partie
    canJoinGame(game: Game): boolean {
        return game.status === 'waiting' && !this.isGameFull(game);
    }

    // Méthode utilitaire pour vérifier si une partie est pleine
    isGameFull(game: Game): boolean {
        return game.participants.length >= game.max_players;
    }

    // Méthode utilitaire pour calculer le temps de jeu
    getGameDuration(game: Game): number | null {
        if (!game.started_at) return null;

        const endTime = game.finished_at ? new Date(game.finished_at) : new Date();
        const startTime = new Date(game.started_at);

        return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    }

    // Méthode utilitaire pour formater le temps
    formatGameTime(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    // Méthode pour valider une combinaison
    validateCombination(combination: number[], maxColors: number, requiredLength: number): boolean {
        if (combination.length !== requiredLength) {
            return false;
        }

        return combination.every(color => color >= 1 && color <= maxColors);
    }

    // Méthode pour générer une combinaison aléatoire (pour tests)
    generateRandomCombination(length: number, maxColors: number): number[] {
        return Array.from({ length }, () => Math.floor(Math.random() * maxColors) + 1);
    }
}

export const gameService = new GameService();