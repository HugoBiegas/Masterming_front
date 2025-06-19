export interface User {
    id: string;
    username: string;
    email: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    access_token: string;
}

export interface LoginRequest {
    username_or_email: string;
    password: string;
    remember_me?: boolean;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    accept_terms: boolean;
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    user: User;
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (credentials: LoginRequest) => Promise<void>;
    register: (userData: RegisterRequest) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}
