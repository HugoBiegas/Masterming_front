import { Game, GameCreateRequest, AttemptRequest, AttemptResult } from '@/types/game';
import { apiService } from './api';

export class GameService {
    async createGame(gameData: GameCreateRequest): Promise<Game> {
        const response = await apiService.post<Game>('/api/v1/games/create', gameData);
        return response.data;
    }

    async getGame(gameId: string): Promise<Game> {
        const response = await apiService.get<Game>(`/api/v1/games/${gameId}`);
        return response.data;
    }

    async joinGame(gameId: string, password?: string): Promise<Game> {
        const response = await apiService.post<Game>(`/api/v1/games/${gameId}/join`, {
            password
        });
        return response.data;
    }

    async startGame(gameId: string): Promise<Game> {
        const response = await apiService.post<Game>(`/api/v1/games/${gameId}/start`);
        return response.data;
    }

    async makeAttempt(gameId: string, attempt: AttemptRequest): Promise<AttemptResult> {
        const response = await apiService.post<AttemptResult>(`/api/v1/games/${gameId}/attempt`, attempt);
        return response.data;
    }

    async getGameHistory(gameId: string): Promise<any[]> {
        const response = await apiService.get(`/api/v1/games/${gameId}/history`);
        return response.data;
    }
}

export const gameService = new GameService();