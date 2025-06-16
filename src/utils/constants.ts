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
