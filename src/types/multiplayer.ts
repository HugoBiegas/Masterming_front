// src/types/multiplayer.ts
// Types étendus pour le mode multijoueur avec objets bonus/malus

import { GameType, GameMode, Difficulty, GameStatus } from './game';

// === ÉNUMÉRATIONS MULTIJOUEUR ===

export enum MultiplayerGameType {
    MULTI_MASTERMIND = "multi_mastermind",
    BATTLE_ROYALE = "battle_royale",
    TOURNAMENT = "tournament"
}

export enum ItemType {
    // Bonus pour soi
    EXTRA_HINT = "extra_hint",
    TIME_BONUS = "time_bonus",
    SKIP_MASTERMIND = "skip_mastermind",
    DOUBLE_SCORE = "double_score",

    // Malus pour les adversaires
    FREEZE_TIME = "freeze_time",
    ADD_MASTERMIND = "add_mastermind",
    REDUCE_ATTEMPTS = "reduce_attempts",
    SCRAMBLE_COLORS = "scramble_colors"
}

export enum ItemRarity {
    COMMON = "common",
    RARE = "rare",
    EPIC = "epic",
    LEGENDARY = "legendary"
}

export enum PlayerStatus {
    WAITING = "waiting",
    PLAYING = "playing",
    MASTERMIND_COMPLETE = "mastermind_complete",
    FINISHED = "finished",
    ELIMINATED = "eliminated"
}

// === INTERFACES PRINCIPALES ===

export interface GameItem {
    id: string;
    name: string;
    description: string;
    item_type: ItemType;
    rarity: ItemRarity;
    is_self_target: boolean;
    duration_seconds?: number;
    effect_value?: number;
    obtained_at?: string;
}

export interface PlayerItem {
    type: string;
    name: string;
    description: string;
    rarity: string;
    obtained_at: string;
}

export interface GameMastermind {
    id: string;
    mastermind_number: number;
    solution: number[];
    combination_length: number;
    available_colors: number;
    max_attempts: number;
    is_active: boolean;
    is_completed: boolean;
    completed_at?: string;
}

export interface PlayerProgress {
    id: string;
    user_id: string;
    username: string;
    current_mastermind: number;
    completed_masterminds: number;
    total_score: number;
    total_time: number;
    status: PlayerStatus;
    is_finished: boolean;
    finish_position?: number;
    finish_time?: string;
    collected_items: PlayerItem[];
    used_items: PlayerItem[];
}

export interface PlayerMastermindAttempt {
    id: string;
    attempt_number: number;
    combination: number[];
    exact_matches: number;
    position_matches: number;
    is_correct: boolean;
    attempt_score: number;
    time_taken: number;
    quantum_calculated?: boolean;
    quantum_probabilities?: any;
    created_at: string;
}

export interface PlayerLeaderboard {
    id: string;
    user_id: string;
    username: string;
    final_position: number;
    total_score: number;
    masterminds_completed: number;
    total_time: number;
    total_attempts: number;
    items_collected: number;
    items_used: number;
    best_mastermind_time?: number;
    worst_mastermind_time?: number;
}

export interface MultiplayerGame {
    id: string;
    base_game_id: string;
    game_type: MultiplayerGameType;
    total_masterminds: number;
    difficulty: Difficulty;
    current_mastermind: number;
    is_final_mastermind: boolean;
    items_enabled: boolean;
    items_per_mastermind: number;
    created_at: string;
    started_at?: string;
    finished_at?: string;
    player_progresses: PlayerProgress[];
    masterminds: GameMastermind[];
    leaderboard: PlayerLeaderboard[];
}

// === REQUÊTES ET RÉPONSES API ===

export interface MultiplayerGameCreateRequest {
    game_mode: GameMode.MULTIPLAYER;
    difficulty: Difficulty;
    total_masterminds: 3 | 6 | 9 | 12;
    max_players: number; // max 12
    is_private: boolean;
    password?: string;
    items_enabled?: boolean;
    allow_spectators?: boolean;
    enable_chat?: boolean;
}

export interface MultiplayerGameCreateResponse {
    id: string;
    room_code: string;
    multiplayer_game: MultiplayerGame;
    message: string;
}

export interface PublicGameListing {
    id: string;
    room_code: string;
    creator_username: string;
    difficulty: Difficulty;
    total_masterminds: number;
    current_players: number;
    max_players: number;
    status: GameStatus;
    created_at: string;
    avg_player_level?: number;
}

export interface JoinGameRequest {
    game_id: string;
    password?: string;
}

export interface JoinGameResponse {
    success: boolean;
    game: MultiplayerGame;
    message: string;
}

// === WEBSOCKET EVENTS ===

export interface MultiplayerWebSocketEvents {
    // Progression des joueurs
    PLAYER_MASTERMIND_COMPLETE: {
        player_id: string;
        username: string;
        mastermind_number: number;
        score: number;
        time_taken: number;
        items_obtained: PlayerItem[];
    };

    // Utilisation d'objets
    ITEM_USED: {
        player_id: string;
        username: string;
        item: PlayerItem;
        target_players?: string[]; // Pour les malus
        effect_duration?: number;
    };

    // Effets appliqués
    EFFECT_APPLIED: {
        effect_type: ItemType;
        affected_players: string[];
        duration?: number;
        message: string;
    };

    // Changements de statut
    PLAYER_STATUS_CHANGED: {
        player_id: string;
        username: string;
        old_status: PlayerStatus;
        new_status: PlayerStatus;
        current_mastermind?: number;
    };

    // Progression générale
    GAME_PROGRESS_UPDATE: {
        current_mastermind: number;
        is_final_mastermind: boolean;
        player_progresses: PlayerProgress[];
        leaderboard_preview: PlayerLeaderboard[];
    };

    // Fin de partie
    MULTIPLAYER_GAME_FINISHED: {
        final_leaderboard: PlayerLeaderboard[];
        winner: PlayerLeaderboard;
        total_duration: number;
        stats: {
            total_attempts: number;
            total_items_used: number;
            average_completion_time: number;
        };
    };
}

// === HOOKS ET UTILITAIRES ===

export interface UseMultiplayerGameReturn {
    multiplayerGame: MultiplayerGame | null;
    loading: boolean;
    error: string | null;
    joinGame: (request: JoinGameRequest) => Promise<boolean>;
    leaveGame: () => Promise<void>;
    useItem: (itemType: ItemType, targetPlayers?: string[]) => Promise<boolean>;
    getCurrentMastermind: () => GameMastermind | null;
    getPlayerProgress: (userId: string) => PlayerProgress | null;
    getMyProgress: () => PlayerProgress | null;
    refreshGame: () => Promise<void>;
}

export interface MultiplayerGameFilters {
    difficulty?: Difficulty;
    max_players?: number;
    has_slots?: boolean;
    sort_by?: 'created_at' | 'players_count' | 'difficulty';
    sort_order?: 'asc' | 'desc';
}

// === CONSTANTES ET CONFIGURATIONS ===

export const MASTERMIND_OPTIONS = [3, 6, 9, 12] as const;
export const MAX_MULTIPLAYER_PLAYERS = 12;

export const ITEM_RARITY_COLORS = {
    [ItemRarity.COMMON]: 'text-gray-600',
    [ItemRarity.RARE]: 'text-blue-600',
    [ItemRarity.EPIC]: 'text-purple-600',
    [ItemRarity.LEGENDARY]: 'text-yellow-600'
} as const;

export const ITEM_DESCRIPTIONS = {
    [ItemType.EXTRA_HINT]: "Révèle une couleur correcte",
    [ItemType.TIME_BONUS]: "+30 secondes de temps",
    [ItemType.DOUBLE_SCORE]: "Score x2 pour le prochain mastermind",
    [ItemType.SKIP_MASTERMIND]: "Complète automatiquement un mastermind",
    [ItemType.FREEZE_TIME]: "Gèle le temps des adversaires pendant 30s",
    [ItemType.ADD_MASTERMIND]: "Ajoute un mastermind à tous les adversaires",
    [ItemType.REDUCE_ATTEMPTS]: "Réduit les tentatives des adversaires de 2",
    [ItemType.SCRAMBLE_COLORS]: "Mélange l'affichage des couleurs des adversaires pendant 60s"
} as const;

export const STATUS_COLORS = {
    [PlayerStatus.WAITING]: 'text-gray-500',
    [PlayerStatus.PLAYING]: 'text-blue-600',
    [PlayerStatus.MASTERMIND_COMPLETE]: 'text-green-600',
    [PlayerStatus.FINISHED]: 'text-purple-600',
    [PlayerStatus.ELIMINATED]: 'text-red-600'
} as const;