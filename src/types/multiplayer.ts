// Types pour le système multijoueur de Quantum Mastermind

// Énumérations de base
export enum MultiplayerGameType {
    MULTI_MASTERMIND = 'multi_mastermind',
    BATTLE_ROYALE = 'battle_royale',
    TOURNAMENT = 'tournament'
}

export enum ItemType {
    // Objets bonus pour soi
    EXTRA_HINT = 'extra_hint',
    TIME_BONUS = 'time_bonus',
    SKIP_MASTERMIND = 'skip_mastermind',
    DOUBLE_SCORE = 'double_score',

    // Objets malus pour les adversaires
    FREEZE_TIME = 'freeze_time',
    ADD_MASTERMIND = 'add_mastermind',
    REDUCE_ATTEMPTS = 'reduce_attempts',
    SCRAMBLE_COLORS = 'scramble_colors'
}

export enum ItemRarity {
    COMMON = 'common',
    RARE = 'rare',
    EPIC = 'epic',
    LEGENDARY = 'legendary'
}

export enum PlayerStatus {
    WAITING = 'waiting',
    PLAYING = 'playing',
    MASTERMIND_COMPLETE = 'mastermind_complete',
    FINISHED = 'finished',
    ELIMINATED = 'eliminated'
}

export enum Difficulty {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard',
    EXPERT = 'expert'
}

// Interfaces principales
export interface MultiplayerGame {
    id: string;
    base_game: {
        id: string;
        creator_id: string;
        status: string;
        difficulty: Difficulty;
        room_code: string;
        is_private: boolean;
        created_at: string;
        available_colors: number;
    };
    max_players: number;
    current_players: number;
    total_masterminds: number;
    items_enabled: boolean;
    game_type: MultiplayerGameType;
    player_progresses: PlayerProgress[];
    masterminds: GameMastermind[];
}

export interface PlayerProgress {
    id: string;
    user_id: string;
    username: string;
    status: PlayerStatus;
    current_mastermind: number;
    score: number;
    attempts_count: number;
    is_finished: boolean;
    finish_time?: string;
    items: PlayerItem[];
}

export interface PlayerItem {
    id: string;
    item_type: ItemType;
    rarity: ItemRarity;
    obtained_at: string;
    used_at?: string;
}

export interface GameMastermind {
    id: string;
    mastermind_number: number;
    solution: number[];
    is_active: boolean;
    max_attempts: number;
}

export interface PublicGameListing {
    id: string;
    creator_username: string;
    difficulty: Difficulty;
    max_players: number;
    current_players: number;
    total_masterminds: number;
    items_enabled: boolean;
    is_private: boolean;
    created_at: string;
    room_code: string;
}

// Interfaces pour les requêtes API
export interface MultiplayerGameCreateRequest {
    game_type: MultiplayerGameType;
    difficulty: Difficulty;
    total_masterminds: number;
    max_players: number;
    is_private: boolean;
    password?: string;
    items_enabled: boolean;
}

export interface MultiplayerGameCreateResponse {
    success: boolean;
    message: string;
    game: MultiplayerGame;
}

export interface JoinGameRequest {
    game_id: string;
    password?: string;
}

export interface JoinGameResponse {
    success: boolean;
    message: string;
    game: MultiplayerGame;
}

export interface MultiplayerGameFilters {
    difficulty?: Difficulty;
    max_players?: number;
    has_slots?: boolean;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export interface MultiplayerAttemptRequest {
    mastermind_number: number;
    combination: number[];
}

export interface MultiplayerAttemptResponse {
    attempt: {
        id: string;
        combination: number[];
        black_pegs: number;
        white_pegs: number;
        attempt_number: number;
        created_at: string;
    };
    mastermind_completed: boolean;
    items_obtained?: PlayerItem[];
    score: number;
    next_mastermind?: GameMastermind;
    game_finished?: boolean;
    final_position?: number;
}

export interface ItemUseRequest {
    item_type: ItemType;
    target_players?: string[];
}

export interface ItemUseResponse {
    success: boolean;
    message: string;
    effect_applied?: {
        effect_id: string;
        duration: number;
        targets: string[];
    };
}

// Interfaces pour les statistiques
export interface PlayerLeaderboard {
    user_id: string;
    username: string;
    final_position: number;
    total_score: number;
    masterminds_completed: number;
    total_time: number;
    items_used: number;
}

export interface GlobalStats {
    total_games_played: number;
    total_players: number;
    average_game_duration: number;
    most_popular_difficulty: Difficulty;
    top_players: PlayerLeaderboard[];
}

export interface PlayerStatsResponse {
    games_played: number;
    games_won: number;
    win_rate: number;
    average_score: number;
    total_masterminds_completed: number;
    favorite_difficulty: Difficulty;
    most_used_items: Array<{
        item_type: ItemType;
        count: number;
    }>;
    best_time: number;
    rank: number;
}

// Interfaces pour les WebSockets
export interface WebSocketMessage {
    type: string;
    data: any;
}

export interface MultiplayerWebSocketEvents {
    PLAYER_JOINED: {
        username: string;
        players_count: number;
    };

    PLAYER_LEFT: {
        username: string;
        players_count: number;
    };

    GAME_STARTED: {
        game_id: string;
        current_mastermind: number;
    };

    PLAYER_MASTERMIND_COMPLETE: {
        player_id: string;
        username: string;
        mastermind_number: number;
        score: number;
        items_obtained: PlayerItem[];
    };

    ITEM_USED: {
        player_id: string;
        username: string;
        item_type: ItemType;
        target_players?: string[];
        message: string;
    };

    EFFECT_APPLIED: {
        effect_id: string;
        effect_type: ItemType;
        duration: number;
        message: string;
    };

    PLAYER_STATUS_CHANGED: {
        player_id: string;
        username: string;
        old_status: PlayerStatus;
        new_status: PlayerStatus;
    };

    GAME_PROGRESS_UPDATE: {
        current_mastermind: number;
        is_final_mastermind: boolean;
        player_progresses: PlayerProgress[];
    };

    MULTIPLAYER_GAME_FINISHED: {
        final_leaderboard: PlayerLeaderboard[];
        game_id: string;
    };

    CHAT_MESSAGE: {
        user_id: string;
        username: string;
        message: string;
        timestamp: string;
    };
}

// Types d'effets actifs
export interface ActiveEffect {
    type: ItemType;
    endTime: number;
    message: string;
}

// Configuration des objets
export interface ItemConfig {
    name: string;
    description: string;
    icon: string;
    category: 'bonus' | 'malus';
    usageType: 'self' | 'others' | 'all';
    rarity: ItemRarity;
    duration?: number;
    cooldown?: number;
}

// Interface pour les résultats de partie
export interface GameResults {
    game_id: string;
    final_leaderboard: PlayerLeaderboard[];
    game_stats: {
        total_duration: number;
        total_masterminds: number;
        total_attempts: number;
        items_used: number;
    };
    player_stats: {
        [userId: string]: {
            final_position: number;
            total_score: number;
            masterminds_completed: number;
            best_time: number;
            items_used: number;
            favorite_item?: string;
        };
    };
}

// Interface pour la pagination
export interface PaginationResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    has_next: boolean;
    has_prev: boolean;
}

// Types utilitaires
export type MultiplayerGameResponse = {
    success: boolean;
    message?: string;
    game?: MultiplayerGame;
    error?: string;
};

export type GameActionResult = {
    success: boolean;
    message: string;
    data?: any;
};

// Interface pour les hooks personnalisés
export interface UseMultiplayerReturn {
    multiplayerGame: MultiplayerGame | null;
    loading: boolean;
    error: string | null;
    isConnected: boolean;
    activeEffects: { [key: string]: ActiveEffect };
    joinGame: (request: JoinGameRequest) => Promise<boolean>;
    leaveGame: () => Promise<void>;
    makeAttempt: (mastermindNumber: number, combination: number[]) => Promise<MultiplayerAttemptResponse | null>;
    useItem: (itemType: ItemType, targetPlayers?: string[]) => Promise<void>;
    connectWebSocket: () => void;
    disconnectWebSocket: () => void;
    refreshGame: () => Promise<void>;
}