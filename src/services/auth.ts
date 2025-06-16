import { LoginRequest, RegisterRequest, AuthResponse, User } from '@/types/auth';
import { apiService } from './api';

export class AuthService {
    async login(credentials: LoginRequest): Promise<AuthResponse> {
        const response = await apiService.post<AuthResponse>('/api/v1/auth/login', credentials);
        return response.data;
    }

    async register(userData: RegisterRequest): Promise<AuthResponse> {
        const response = await apiService.post<AuthResponse>('/api/v1/auth/register', userData);
        return response.data;
    }

    async getCurrentUser(): Promise<User> {
        const response = await apiService.get<User>('/api/v1/users/me');
        return response.data;
    }

    async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
        const response = await apiService.post('/api/v1/auth/refresh', {
            refresh_token: refreshToken
        });
        return response.data;
    }

    logout(): void {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }
}

export const authService = new AuthService();
