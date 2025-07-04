// Types pour le système multijoueur de Quantum Mastermind
import { GameStatus, GameType, Attempt } from './game';

// Énumérations de base
export enum MultiplayerGameType {
    MULTI_MASTERMIND = 'multi_mastermind',
    BATTLE_ROYALE = 'battle_royale',
    TOURNAMENT = 'tournament'
}

export interface StandardApiResponse<T> {
    success: boolean;
    data: T;
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

// CORRECTION: Interface PlayerProgress avec toutes les propriétés nécessaires
export interface PlayerProgress {
    id: string;
    user_id: string;
    username: string;
    // CORRECTION: Union type avec tous les statuts possibles
    status: 'active' | 'eliminated' | 'finished' | 'disconnected' | 'spectating' | 'waiting' | 'playing' | 'mastermind_complete';
    score: number;
    attempts_count: number;
    current_mastermind?: number | number[];
    is_winner: boolean;
    joined_at: string;
    finished_at?: string;
    elimination_reason?: string;
    rank?: number;

    // AJOUTS: Propriétés manquantes pour compatibilité
    is_creator?: boolean;
    is_ready?: boolean;
    completed_masterminds?: number;
    items?: PlayerItem[];
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
    allow_spectators: boolean;
    enable_chat: boolean;
    quantum_enabled?: boolean;
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
    mastermind_number?: number;
    combination: number[];
    room_code?: string;
    game_id?: string;
}

// CORRECTION: Interface MultiplayerAttemptResponse avec toutes les propriétés nécessaires
export interface MultiplayerAttemptResponse {
    attempt: {
        id: string;
        combination: number[];
        black_pegs?: number;
        white_pegs?: number;
        exact_matches?: number;
        position_matches?: number;
        correct_positions?: number;
        correct_colors?: number;
        attempt_number: number;
        attempt_score?: number;
        is_correct?: boolean;
        created_at: string;
        time_taken?: number;
    };
    mastermind_completed: boolean;
    items_obtained?: PlayerItem[];
    score: number;
    next_mastermind?: GameMastermind;
    game_finished?: boolean;
    final_position?: number;

    // AJOUTS: Propriétés pour compatibilité avec le code existant
    is_correct?: boolean;
    correct_positions?: number;
    correct_colors?: number;
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
    // Toutes les propriétés de PlayerProgress
    id: string;
    user_id: string;
    username: string;
    status: 'active' | 'eliminated' | 'finished' | 'disconnected' | 'spectating';
    score: number;
    attempts_count: number;
    current_mastermind?: number | number[];
    is_winner: boolean;
    is_creator?: boolean;
    joined_at: string;
    finished_at?: string;
    elimination_reason?: string;
    rank?: number;

    // Propriétés additionnelles pour le leaderboard
    final_score: number;
    attempts_made: number;
    time_taken?: number;
    achievements?: string[];
    bonus_points?: number;
    penalty_points?: number;
}

export interface GameRoom {
    id: string;
    room_code: string;
    name: string;
    game_type: GameType;
    game_type_display?: string;
    game_type_raw?: string;
    difficulty: Difficulty;
    status: GameStatus;
    max_players: number;
    current_players: number;
    is_private: boolean;
    password_protected: boolean;
    allow_spectators: boolean;
    enable_chat: boolean;
    quantum_enabled: boolean;

    // Configuration de jeu complète
    combination_length: number;
    available_colors: number;
    max_attempts: number;

    // Paramètres multijoueur
    total_masterminds: number;
    items_enabled: boolean;
    items_per_mastermind: number;

    // Métadonnées
    created_at: string;
    started_at?: string;
    estimated_finish?: string;

    creator: {
        id: string;
        username: string;
    };

    // Participants et logique
    participants?: Array<{
        user_id: string;
        username: string;
        status: string;
        score: number;
        attempts_count: number;
        joined_at?: string;
        is_ready: boolean;
        is_creator: boolean;
        is_winner: boolean;
    }>;

    // Settings et infos supplémentaires
    settings?: {
        total_masterminds?: number;
        items_enabled?: boolean;
        items_per_mastermind?: number;
        game_type_display?: string;
        [key: string]: any;
    };

    can_start?: boolean;
    creator_present?: boolean;
}

export interface GameParametersDisplay {
    type: string;
    difficulty: string;
    masterminds: number;
    items: string;
    itemsIcon: string;
    players: string;
    quantum: boolean;
    spectators: boolean;
    chat: boolean;
}

export interface CreateRoomRequest {
    name: string;
    game_type: GameType;
    difficulty: Difficulty;
    max_players: number;

    // Configuration du mastermind
    combination_length: number;
    available_colors: number;
    max_attempts: number;

    // Configuration multijoueur
    total_masterminds: number;

    // Options avancées
    quantum_enabled: boolean;
    items_enabled: boolean;
    items_per_mastermind: number;

    // Visibilité et accès
    is_public: boolean;
    password?: string;
    allow_spectators: boolean;
    enable_chat: boolean;

    // Solution personnalisée (optionnelle)
    solution?: number[];
}

export interface MultiplayerServiceResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
    timestamp?: string;
}

export interface MultiplayerResultsProps {
    isOpen: boolean;
    onClose: () => void;
    gameResults: GameResults | null;
    currentUserId: string;
    showDetailedStats?: boolean;
}

export interface MultiplayerResultsPageProps {
    gameResults: GameResults;
    currentUserId?: string;
    showDetailedStats?: boolean;
}

export interface EnhancedCreateRoomRequest extends CreateRoomRequest {
    base_game_type: GameType;
    is_private: boolean;
}

export interface LobbyFilters {
    game_type?: GameType;
    difficulty?: Difficulty;
    max_players?: number;
    has_password?: boolean;
    allow_spectators?: boolean;
    quantum_enabled?: boolean;
    status?: GameStatus;
    search_term?: string;
}

export interface LobbyListResponse {
    rooms: GameRoom[];
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
}

export interface MultiplayerApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
    timestamp: string;
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

export interface JoinRoomRequest {
    room_code: string;
    password?: string;
    as_spectator?: boolean;
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
    room_code: string;
    game_type: GameType;
    difficulty: Difficulty;
    status: GameStatus;
    started_at: string;
    finished_at: string;
    duration: number;
    total_players: number;

    // Utiliser PlayerProgress[] pour être compatible
    final_leaderboard: PlayerProgress[];

    // Stats et métadonnées
    stats: {
        total_attempts: number;
        average_attempts_per_player: number;
        winner_attempts: number;
        completion_rate: number;
        elimination_rate: number;
        average_time_per_attempt: number;
        fastest_player: {
            user_id: string;
            username: string;
            time: number;
        };
        most_efficient_player: {
            user_id: string;
            username: string;
            attempts: number;
        };
    };

    achievements: Array<{
        id: string;
        user_id: string;
        username: string;
        achievement_type: string;
        title: string;
        description: string;
        points: number;
        icon: string;
        rarity: 'common' | 'rare' | 'epic' | 'legendary';
    }>;

    solution?: number[];

    metadata: {
        total_attempts: number;
        average_score: number;
        fastest_completion?: number;
        most_attempts: number;
        elimination_count: number;
        spectator_count: number;
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

// AJOUT: Type guard pour les conversions
export type GameActionResult = {
    success: boolean;
    message: string;
    data?: any;
};

// Fonctions utilitaires
export const convertToCreateRoomRequest = (enhanced: EnhancedCreateRoomRequest): CreateRoomRequest => ({
    name: enhanced.name,
    game_type: enhanced.game_type,
    difficulty: enhanced.difficulty,
    max_players: enhanced.max_players,
    combination_length: enhanced.combination_length,
    available_colors: enhanced.available_colors,
    max_attempts: enhanced.max_attempts,
    total_masterminds: enhanced.total_masterminds,
    quantum_enabled: enhanced.quantum_enabled,
    items_enabled: enhanced.items_enabled,
    items_per_mastermind: enhanced.items_per_mastermind,
    is_public: !enhanced.is_private,
    password: enhanced.password?.trim() || undefined,
    allow_spectators: enhanced.allow_spectators,
    enable_chat: enhanced.enable_chat,
    solution: enhanced.solution?.length ? enhanced.solution : undefined
});

export default {
    MultiplayerGameType,
    ItemType,
    ItemRarity,
    PlayerStatus,
    Difficulty,
    convertToCreateRoomRequest
};