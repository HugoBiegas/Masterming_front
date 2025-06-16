export enum GameType {
    CLASSIC = "classic",
    QUANTUM = "quantum",
    SPEED = "speed",
    PRECISION = "precision"
}

export enum GameMode {
    SINGLE = "single",
    MULTIPLAYER = "multiplayer",
    BATTLE_ROYALE = "battle_royale",
    TOURNAMENT = "tournament"
}

export enum Difficulty {
    EASY = "easy",
    MEDIUM = "medium",
    HARD = "hard",
    EXPERT = "expert",
    QUANTUM = "quantum"
}

export enum GameStatus {
    WAITING = "waiting",
    STARTING = "starting",
    ACTIVE = "active",
    PAUSED = "paused",
    FINISHED = "finished",
    CANCELLED = "cancelled",
    ABORTED = "aborted"
}

export interface DifficultyConfig {
    colors: number;
    length: number;
    attempts: number;
    description: string;
}

// ✅ Interface corrigée selon l'API Postman
export interface GameCreateRequest {
    game_type: GameType;
    game_mode: GameMode;
    difficulty: Difficulty;
    max_attempts?: number;
    time_limit?: number;
    max_players: number;
    is_public: boolean;  // ✅ Corrigé de "is_private" à "is_public"
    password?: string;
    room_code?: string;
    allow_spectators: boolean;
    enable_chat: boolean;
    quantum_enabled: boolean;
    settings?: Record<string, any>;
}

export interface Game {
    id: string;
    room_code: string;
    game_type: GameType;
    game_mode: GameMode;
    status: GameStatus;
    difficulty: Difficulty;
    combination_length: number;
    available_colors: number;
    max_attempts?: number;
    time_limit?: number;
    max_players: number;
    is_private: boolean;
    created_at: string;
    started_at?: string;
    finished_at?: string;
    creator_id: string;
    participants: Participant[];
    attempts: Attempt[];
    solution?: number[];
    settings?: Record<string, any>;
}

export interface Participant {
    id: string;
    user_id: string;
    username: string;
    status: string;
    joined_at: string;
    score: number;
    attempts_count: number;
}

export interface Attempt {
    id: string;
    attempt_number: number;
    user_id: string;
    combination: number[];
    correct_positions: number;
    correct_colors: number;
    is_correct: boolean;
    attempt_score: number;
    time_taken?: number;
    created_at: string;
}

export interface AttemptRequest {
    combination: number[];
}

export interface AttemptResult {
    id: string;
    attempt_number: number;
    combination: number[];
    correct_positions: number;
    correct_colors: number;
    is_winning: boolean;
    score: number;
    time_taken?: number;
    game_status: GameStatus;
    remaining_attempts?: number;
}