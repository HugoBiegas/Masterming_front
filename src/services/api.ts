import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL } from '@/utils/constants';

class ApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 10000, // 10 secondes de timeout
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        // Request interceptor pour ajouter le token
        this.api.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('access_token');
                if (token && config.headers) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor pour gérer les erreurs
        this.api.interceptors.response.use(
            (response: AxiosResponse) => response,
            async (error) => {
                const originalRequest = error.config;

                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    // Token expiré, essayer de le rafraîchir
                    const refreshToken = localStorage.getItem('refresh_token');
                    if (refreshToken) {
                        try {
                            const response = await this.post('/api/v1/auth/refresh', {
                                refresh_token: refreshToken
                            });

                            const { access_token } = response.data;
                            localStorage.setItem('access_token', access_token);

                            // Retry la requête originale
                            originalRequest.headers.Authorization = `Bearer ${access_token}`;
                            return this.api.request(originalRequest);
                        } catch (refreshError) {
                            // Refresh failed, redirect to login
                            localStorage.removeItem('access_token');
                            localStorage.removeItem('refresh_token');

                            // Éviter la redirection si on est déjà sur la page de connexion
                            if (window.location.pathname !== '/') {
                                window.location.href = '/';
                            }
                            return Promise.reject(refreshError);
                        }
                    } else {
                        // No refresh token, redirect to login
                        localStorage.removeItem('access_token');
                        if (window.location.pathname !== '/') {
                            window.location.href = '/';
                        }
                    }
                }

                // Gestion spécifique des erreurs réseau
                if (!error.response) {
                    error.message = 'Erreur de connexion réseau. Vérifiez votre connexion internet.';
                }

                return Promise.reject(error);
            }
        );
    }

    async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        try {
            return await this.api.get(url, config);
        } catch (error) {
            this.handleApiError(error, 'GET', url);
            throw error;
        }
    }

    async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        try {
            return await this.api.post(url, data, config);
        } catch (error) {
            this.handleApiError(error, 'POST', url);
            throw error;
        }
    }

    async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        try {
            return await this.api.put(url, data, config);
        } catch (error) {
            this.handleApiError(error, 'PUT', url);
            throw error;
        }
    }

    async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        try {
            return await this.api.delete(url, config);
        } catch (error) {
            this.handleApiError(error, 'DELETE', url);
            throw error;
        }
    }

    // Méthode spécifique pour quitter les parties actives
    async leaveAllActiveGames(): Promise<AxiosResponse<any>> {
        try {
            return await this.post('/api/v1/games/leave');
        } catch (error) {
            console.error('Erreur lors de la sortie des parties actives:', error);
            throw error;
        }
    }

    // Méthode pour créer une partie avec auto-leave
    async createGameWithAutoLeave(gameData: any, autoLeave: boolean = false): Promise<AxiosResponse<any>> {
        try {
            return await this.post(`/api/v1/games/create?auto_leave=${autoLeave}`, gameData);
        } catch (error) {
            console.error('Erreur lors de la création de la partie:', error);
            throw error;
        }
    }

    // Méthode pour obtenir le statut de jeu de l'utilisateur
    async getCurrentGameStatus(): Promise<AxiosResponse<any>> {
        try {
            return await this.get('/api/v1/games/my-current-game');
        } catch (error) {
            console.error('Erreur lors de la récupération du statut de jeu:', error);
            throw error;
        }
    }

    private handleApiError(error: any, method: string, url: string) {
        const errorInfo = {
            method,
            url,
            status: error.response?.status,
            message: error.response?.data?.detail || error.message,
            timestamp: new Date().toISOString()
        };

        // Log pour debug (peut être envoyé à un service de logging)
        console.error('API Error:', errorInfo);

        // Ici on pourrait ajouter un service de logging externe
        // logger.error('API_ERROR', errorInfo);
    }

    // Méthode utilitaire pour vérifier si l'utilisateur est connecté
    isAuthenticated(): boolean {
        return !!localStorage.getItem('access_token');
    }

    // Méthode utilitaire pour obtenir le token actuel
    getAuthToken(): string | null {
        return localStorage.getItem('access_token');
    }

    // Méthode pour déconnecter l'utilisateur
    logout(): void {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }
}

export const apiService = new ApiService();