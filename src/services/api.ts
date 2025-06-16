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
                if (error.response?.status === 401) {
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
                            error.config.headers.Authorization = `Bearer ${access_token}`;
                            return this.api.request(error.config);
                        } catch (refreshError) {
                            // Refresh failed, redirect to login
                            localStorage.removeItem('access_token');
                            localStorage.removeItem('refresh_token');
                            window.location.href = '/';
                        }
                    } else {
                        // No refresh token, redirect to login
                        localStorage.removeItem('access_token');
                        window.location.href = '/';
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.api.get(url, config);
    }

    async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.api.post(url, data, config);
    }

    async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.api.put(url, data, config);
    }

    async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.api.delete(url, config);
    }
}

export const apiService = new ApiService();
