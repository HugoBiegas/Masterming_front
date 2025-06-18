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

// NOUVELLES INTERFACES QUANTIQUES
export interface QuantumPositionProbability {
    position: number;
    exact_match_probability: number;
    match_type: 'exact_match' | 'color_present' | 'no_match';
    confidence: 'high' | 'medium' | 'low';
    attempt_color: number;
    quantum_measurements: number;
    total_shots: number;
}

export interface QuantumProbabilities {
    exact_matches: number;
    wrong_position: number;
    position_probabilities: QuantumPositionProbability[];
    quantum_calculated: boolean;
    shots_used: number;
}

export interface GameCreateRequest {
    game_type: GameType;
    game_mode: GameMode;
    difficulty: Difficulty;
    max_attempts?: number;
    time_limit?: number;
    max_players: number;
    is_private: boolean;
    password?: string;
    room_code?: string;
    allow_spectators: boolean;
    enable_chat: boolean;
    quantum_enabled: boolean;
    settings?: Record<string, any>;
    auto_leave?: boolean;
}

// Interface pour la réponse de création de partie
export interface GameCreateResponse {
    id: string;
    room_code: string;
    game_type: GameType;
    game_mode: GameMode;
    difficulty: Difficulty;
    status: GameStatus;
    max_players: number;
    combination_length: number;
    available_colors: number;
    created_at: string;
    message: string;
    auto_leave_performed?: boolean;
    leave_summary?: {
        total_left: number;
        games_cancelled: number;
        games_maintained: number;
    };
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

// INTERFACE ATTEMPT ÉTENDUE avec support quantique
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

    // PROPRIÉTÉS QUANTIQUES ÉTENDUES
    exact_matches?: number;
    position_matches?: number;
    quantum_calculated?: boolean;
    quantum_probabilities?: QuantumProbabilities;
    quantum_hint_used?: boolean;
    remaining_attempts?: number;
    game_finished?: boolean;
}

export interface AttemptRequest {
    combination: number[];
    use_quantum_hint?: boolean;
    hint_type?: string;
}

// INTERFACE ATTEMPTRESULT ÉTENDUE avec support quantique
export interface AttemptResult {
    id: string;
    attempt_number: number;
    combination: number[];
    correct_positions: number;
    correct_colors: number;
    is_winning: boolean;
    score: number;
    time_taken?: number;
    game_finished?: boolean;
    game_status?: GameStatus;
    solution?: number[];
    remaining_attempts?: number;

    // PROPRIÉTÉS QUANTIQUES ÉTENDUES
    exact_matches?: number;
    position_matches?: number;
    quantum_calculated?: boolean;
    quantum_probabilities?: QuantumProbabilities;
    quantum_hint_used?: boolean;
}

// Interface pour les réponses API génériques
export interface ApiResponse<T> {
    data: T;
    message?: string;
    status?: number;
}

// Interface pour quitter les parties
export interface LeaveGameResponse {
    message: string;
    summary: {
        total_left: number;
        games_cancelled: number;
        games_maintained: number;
    };
    details: {
        left_games: any[];
        cancelled_games: any[];
        maintained_games: any[];
    };
}