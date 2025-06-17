import { Difficulty, DifficultyConfig, GameType, GameMode } from '@/types/game';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
    [Difficulty.EASY]: {
        colors: 4,
        length: 3,
        attempts: 15,
        description: "Parfait pour débuter - 4 couleurs, 3 positions"
    },
    [Difficulty.MEDIUM]: {
        colors: 6,
        length: 4,
        attempts: 12,
        description: "Difficulté standard - 6 couleurs, 4 positions"
    },
    [Difficulty.HARD]: {
        colors: 8,
        length: 5,
        attempts: 10,
        description: "Pour les experts - 8 couleurs, 5 positions"
    },
    [Difficulty.EXPERT]: {
        colors: 10,
        length: 6,
        attempts: 8,
        description: "Défi ultime - 10 couleurs, 6 positions"
    },
    [Difficulty.QUANTUM]: {
        colors: 12,
        length: 7,
        attempts: 6,
        description: "Mode quantique - 12 couleurs, 7 positions"
    }
};

export const GAME_MODE_INFO = {
    [GameMode.SINGLE]: {
        name: "Solo",
        description: "Jouez seul contre l'ordinateur",
        available: true
    },
    [GameMode.MULTIPLAYER]: {
        name: "Multijoueur",
        description: "Jouez avec vos amis",
        available: false
    },
    [GameMode.BATTLE_ROYALE]: {
        name: "Battle Royale",
        description: "Élimination progressive",
        available: false
    },
    [GameMode.TOURNAMENT]: {
        name: "Tournoi",
        description: "Compétition organisée",
        available: false
    }
};

export const GAME_TYPE_INFO = {
    [GameType.CLASSIC]: {
        name: "Classique",
        description: "Mastermind traditionnel"
    },
    [GameType.QUANTUM]: {
        name: "Quantique",
        description: "Avec fonctionnalités quantiques"
    },
    [GameType.SPEED]: {
        name: "Rapidité",
        description: "Mode chronométré"
    },
    [GameType.PRECISION]: {
        name: "Précision",
        description: "Minimisez les tentatives"
    }
};

export const COLOR_PALETTE = [
    '#FF0000', // Rouge
    '#00FF00', // Vert
    '#0000FF', // Bleu
    '#FFFF00', // Jaune
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
    '#800080', // Violet
    '#FFC0CB', // Rose
    '#A52A2A', // Marron
    '#808080', // Gris
    '#000000'  // Noir
];

// Constantes pour les notifications - OPTIMISÉES
export const NOTIFICATION_DURATION = 1500; // RÉDUIT à 1.5 secondes
export const MAX_NOTIFICATIONS = 3; // RÉDUIT à 3 max

// Constantes pour les timeouts
export const API_TIMEOUT = 10000; // 10 secondes
export const GAME_UPDATE_INTERVAL = 1000; // 1 seconde

// Constantes pour les scores
export const SCORE_BASE = 100;
export const SCORE_BONUS_VICTORY = 500;
export const SCORE_PENALTY_PER_ATTEMPT = 10;

// Constantes pour les limites
export const MAX_GAME_DURATION = 3600; // 1 heure
export const MIN_PLAYERS = 1;
export const MAX_PLAYERS = 8;
export const MAX_ATTEMPTS_LIMIT = 50;
export const MIN_COMBINATION_LENGTH = 3;
export const MAX_COMBINATION_LENGTH = 8;
export const MIN_COLORS = 4;
export const MAX_COLORS = 12;

// Messages d'erreur constants
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Erreur de connexion réseau. Vérifiez votre connexion internet.',
    SESSION_EXPIRED: 'Session expirée. Veuillez vous reconnecter.',
    GAME_NOT_FOUND: 'Partie non trouvée ou supprimée.',
    GAME_FULL: 'Cette partie est complète.',
    GAME_NOT_ACTIVE: 'La partie n\'est plus active.',
    INVALID_COMBINATION: 'Combinaison invalide.',
    MAX_ATTEMPTS_REACHED: 'Nombre maximum de tentatives atteint.',
    UNAUTHORIZED: 'Vous n\'êtes pas autorisé à effectuer cette action.',
    ALREADY_IN_GAME: 'Vous participez déjà à une partie active.',
    CREATION_FAILED: 'Échec de la création de la partie.',
    LEAVE_FAILED: 'Impossible de quitter la partie.'
};

// Messages de succès constants
export const SUCCESS_MESSAGES = {
    GAME_CREATED: 'Partie créée avec succès !',
    GAME_JOINED: 'Vous avez rejoint la partie !',
    GAME_LEFT: 'Vous avez quitté la partie.',
    GAME_WON: 'Félicitations ! Vous avez gagné !',
    ATTEMPT_SUBMITTED: 'Tentative soumise avec succès.',
    SETTINGS_SAVED: 'Paramètres sauvegardés.',
    LOGIN_SUCCESS: 'Connexion réussie !',
    LOGOUT_SUCCESS: 'Déconnexion réussie.'
};

// Configuration des animations - OPTIMISÉES
export const ANIMATION_DURATION = {
    FAST: 150, // RÉDUIT
    MEDIUM: 200, // RÉDUIT
    SLOW: 300, // RÉDUIT
    TOAST: 1500 // RÉDUIT
};

// Configuration responsive
export const BREAKPOINTS = {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    XXL: 1536
};

// Configuration des couleurs de thème
export const THEME_COLORS = {
    PRIMARY: {
        50: '#eff6ff',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8'
    },
    QUANTUM: {
        50: '#f0f9ff',
        500: '#06b6d4',
        600: '#0891b2',
        700: '#0e7490'
    },
    SUCCESS: '#10b981',
    ERROR: '#ef4444',
    WARNING: '#f59e0b',
    INFO: '#3b82f6'
};