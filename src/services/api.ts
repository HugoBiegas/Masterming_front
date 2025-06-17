// src/services/api.ts - Correction complète

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL } from '@/utils/constants';

class ApiService {
    private api: AxiosInstance;
    private isRefreshing = false; // 🔥 Ajouter pour éviter multiples refresh simultanés
    private failedQueue: any[] = []; // 🔥 Queue pour les requêtes en attente

    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 10000,
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

        // Response interceptor CORRIGÉ pour gérer les erreurs
        this.api.interceptors.response.use(
            (response: AxiosResponse) => response,
            async (error) => {
                const originalRequest = error.config;

                // 🔥 CORRECTION 1: Exclure la route refresh de la logique de retry
                if (originalRequest.url?.includes('/auth/refresh')) {
                    // Si c'est la route refresh qui échoue, déconnecter immédiatement
                    if (error.response?.status === 401) {
                        this.forceLogout();
                    }
                    return Promise.reject(error);
                }

                // 🔥 CORRECTION 2: Gérer les 401 avec une seule tentative de refresh
                if (error.response?.status === 401 && !originalRequest._retry) {

                    // Si un refresh est déjà en cours, mettre en queue
                    if (this.isRefreshing) {
                        return new Promise((resolve, reject) => {
                            this.failedQueue.push({ resolve, reject, config: originalRequest });
                        });
                    }

                    originalRequest._retry = true;
                    this.isRefreshing = true;

                    const refreshToken = localStorage.getItem('refresh_token');

                    if (!refreshToken) {
                        this.forceLogout();
                        return Promise.reject(error);
                    }

                    try {
                        // 🔥 CORRECTION 3: Utiliser axios directement sans interceptor
                        const response = await axios.post(
                            `${API_BASE_URL}/api/v1/auth/refresh`,
                            { refresh_token: refreshToken },
                            {
                                headers: { 'Content-Type': 'application/json' },
                                timeout: 10000
                            }
                        );

                        const { access_token } = response.data;
                        localStorage.setItem('access_token', access_token);

                        // Traiter les requêtes en queue
                        this.processFailedQueue(null, access_token);

                        // Retry la requête originale
                        originalRequest.headers.Authorization = `Bearer ${access_token}`;
                        return this.api.request(originalRequest);

                    } catch (refreshError: any) {
                        // 🔥 CORRECTION 4: Gérer l'échec du refresh proprement
                        this.processFailedQueue(refreshError, null);
                        this.forceLogout();
                        return Promise.reject(refreshError);
                    } finally {
                        this.isRefreshing = false;
                    }
                }

                // 🔥 CORRECTION 5: Pour les autres 401, déconnecter immédiatement
                if (error.response?.status === 401) {
                    this.forceLogout();
                }

                // Gestion spécifique des erreurs réseau
                if (!error.response) {
                    error.message = 'Erreur de connexion réseau. Vérifiez votre connexion internet.';
                }

                return Promise.reject(error);
            }
        );
    }

    // 🔥 NOUVELLE MÉTHODE: Gestion de la queue des requêtes échouées
    private processFailedQueue(error: any, token: string | null) {
        this.failedQueue.forEach(({ resolve, reject, config }) => {
            if (error) {
                reject(error);
            } else {
                config.headers.Authorization = `Bearer ${token}`;
                resolve(this.api.request(config));
            }
        });

        this.failedQueue = [];
    }

    // 🔥 NOUVELLE MÉTHODE: Déconnexion forcée et propre
    private forceLogout() {
        console.warn('🔐 Session expirée - Déconnexion automatique');

        // Nettoyer le stockage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

        // Éviter la redirection si on est déjà sur la page de connexion
        if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
            // 🔥 IMPORTANT: Utiliser replace pour éviter l'historique
            window.location.replace('/');
        }
    }

    // 🔥 NOUVELLE MÉTHODE: Vérifier si l'utilisateur est connecté
    isAuthenticated(): boolean {
        return !!(localStorage.getItem('access_token') && localStorage.getItem('refresh_token'));
    }

    // Méthodes HTTP inchangées mais avec meilleure gestion d'erreur
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

    // 🔥 MÉTHODE AMÉLIORÉE: Gestion d'erreurs plus robuste
    private handleApiError(error: any, method: string, url: string) {
        // Log pour debugging (à retirer en production)
        if (process.env.NODE_ENV === 'development') {
            console.error(`API Error [${method} ${url}]:`, {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
        }

        // Gestion spécifique pour certaines erreurs
        if (error.response?.status === 403) {
            console.warn('Accès refusé - Permissions insuffisantes');
        } else if (error.response?.status >= 500) {
            console.error('Erreur serveur - Service temporairement indisponible');
        }
    }

    // Méthode utilitaire pour obtenir le token actuel
    getAuthToken(): string | null {
        return localStorage.getItem('access_token');
    }

    logout(): void {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

        // Optionnel: Notifier le serveur de la déconnexion
        if (this.isAuthenticated()) {
            this.post('/api/v1/auth/logout', {}).catch(() => {
                // Ignorer les erreurs de déconnexion côté serveur
            });
        }
    }
}

export const apiService = new ApiService();