// Constantes pour le système multijoueur de Quantum Mastermind

import { ItemType, ItemRarity, Difficulty } from '@/types/multiplayer';

// Configuration des difficultés pour le multijoueur
export const MULTIPLAYER_DIFFICULTY_CONFIGS = {
    [Difficulty.EASY]: {
        colors: 4,
        pegs: 6,
        maxAttempts: 10,
        timeLimit: 300, // 5 minutes
        label: 'Facile',
        description: '4 couleurs, 6 trous, 10 tentatives'
    },
    [Difficulty.MEDIUM]: {
        colors: 6,
        pegs: 8,
        maxAttempts: 12,
        timeLimit: 420, // 7 minutes
        label: 'Moyen',
        description: '6 couleurs, 8 trous, 12 tentatives'
    },
    [Difficulty.HARD]: {
        colors: 8,
        pegs: 10,
        maxAttempts: 15,
        timeLimit: 600, // 10 minutes
        label: 'Difficile',
        description: '8 couleurs, 10 trous, 15 tentatives'
    },
    [Difficulty.EXPERT]: {
        colors: 10,
        pegs: 12,
        maxAttempts: 18,
        timeLimit: 900, // 15 minutes
        label: 'Expert',
        description: '10 couleurs, 12 trous, 18 tentatives'
    }
};

// Configuration des objets bonus/malus
export const ITEM_CONFIGS = {
    [ItemType.EXTRA_HINT]: {
        name: 'Indice Extra',
        description: 'Obtenez un indice supplémentaire pour le mastermind actuel',
        icon: '💡',
        category: 'bonus' as const,
        usageType: 'self' as const,
        rarity: ItemRarity.COMMON,
        duration: 0, // Instantané
        cooldown: 0
    },
    [ItemType.TIME_BONUS]: {
        name: 'Temps Bonus',
        description: 'Gagnez 60 secondes supplémentaires',
        icon: '⏰',
        category: 'bonus' as const,
        usageType: 'self' as const,
        rarity: ItemRarity.COMMON,
        duration: 60,
        cooldown: 0
    },
    [ItemType.SKIP_MASTERMIND]: {
        name: 'Passer Mastermind',
        description: 'Passez automatiquement au mastermind suivant',
        icon: '⏭️',
        category: 'bonus' as const,
        usageType: 'self' as const,
        rarity: ItemRarity.EPIC,
        duration: 0,
        cooldown: 0
    },
    [ItemType.DOUBLE_SCORE]: {
        name: 'Score x2',
        description: 'Doublez votre score pour le prochain mastermind',
        icon: '⭐',
        category: 'bonus' as const,
        usageType: 'self' as const,
        rarity: ItemRarity.RARE,
        duration: 300, // 5 minutes
        cooldown: 0
    },
    [ItemType.FREEZE_TIME]: {
        name: 'Figer le Temps',
        description: 'Figez le temps des adversaires pendant 15 secondes',
        icon: '🧊',
        category: 'malus' as const,
        usageType: 'others' as const,
        rarity: ItemRarity.RARE,
        duration: 15,
        cooldown: 60
    },
    [ItemType.ADD_MASTERMIND]: {
        name: 'Mastermind Bonus',
        description: 'Ajoutez un mastermind supplémentaire à tous les joueurs',
        icon: '➕',
        category: 'malus' as const,
        usageType: 'all' as const,
        rarity: ItemRarity.LEGENDARY,
        duration: 0,
        cooldown: 0
    },
    [ItemType.REDUCE_ATTEMPTS]: {
        name: 'Moins de Tentatives',
        description: 'Réduisez les tentatives des adversaires de 2',
        icon: '⚠️',
        category: 'malus' as const,
        usageType: 'others' as const,
        rarity: ItemRarity.RARE,
        duration: 120,
        cooldown: 90
    },
    [ItemType.SCRAMBLE_COLORS]: {
        name: 'Mélanger Couleurs',
        description: 'Mélangez l\'affichage des couleurs des adversaires',
        icon: '🌈',
        category: 'malus' as const,
        usageType: 'others' as const,
        rarity: ItemRarity.EPIC,
        duration: 45,
        cooldown: 120
    }
};

// Configuration des raretés
export const RARITY_CONFIGS = {
    [ItemRarity.COMMON]: {
        label: 'Commun',
        color: 'gray',
        dropRate: 0.6, // 60%
        glowColor: '#9CA3AF'
    },
    [ItemRarity.RARE]: {
        label: 'Rare',
        color: 'blue',
        dropRate: 0.25, // 25%
        glowColor: '#3B82F6'
    },
    [ItemRarity.EPIC]: {
        label: 'Épique',
        color: 'purple',
        dropRate: 0.12, // 12%
        glowColor: '#8B5CF6'
    },
    [ItemRarity.LEGENDARY]: {
        label: 'Légendaire',
        color: 'yellow',
        dropRate: 0.03, // 3%
        glowColor: '#F59E0B'
    }
};

// Limites et contraintes
export const MULTIPLAYER_LIMITS = {
    MIN_PLAYERS: 2,
    MAX_PLAYERS: 12,
    MIN_MASTERMINDS: 3,
    MAX_MASTERMINDS: 12,
    ROOM_CODE_LENGTH: 8,
    MAX_PASSWORD_LENGTH: 50,
    MAX_GAME_DURATION: 3600, // 1 heure en secondes
    WEBSOCKET_RECONNECT_ATTEMPTS: 5,
    WEBSOCKET_RECONNECT_DELAY: 1000, // 1 seconde
    MAX_CHAT_MESSAGE_LENGTH: 500,
    MAX_ITEMS_PER_PLAYER: 10
};

// Messages système
export const SYSTEM_MESSAGES = {
    GAME_STARTED: '🚀 La partie a commencé !',
    GAME_FINISHED: '🏁 Partie terminée !',
    PLAYER_JOINED: (username: string) => `👋 ${username} a rejoint la partie`,
    PLAYER_LEFT: (username: string) => `👋 ${username} a quitté la partie`,
    MASTERMIND_COMPLETED: (username: string, number: number) =>
        `🎯 ${username} a terminé le mastermind ${number} !`,
    ITEM_USED: (username: string, itemName: string) =>
        `🎁 ${username} a utilisé ${itemName}`,
    PLAYER_ELIMINATED: (username: string) =>
        `❌ ${username} a été éliminé`,
    LAST_MASTERMIND: '⚡ Dernier mastermind ! La partie se termine bientôt.',
    TIME_WARNING: '⏰ Plus que 2 minutes !',
    CONNECTION_LOST: '📡 Connexion perdue, tentative de reconnexion...',
    CONNECTION_RESTORED: '✅ Connexion rétablie !'
};

// Configuration du scoring
export const SCORING_CONFIG = {
    BASE_SCORE: 100,
    SPEED_BONUS_MULTIPLIER: 1.5,
    ACCURACY_BONUS_MULTIPLIER: 1.2,
    ITEM_USAGE_PENALTY: 0.9,
    POSITION_MULTIPLIERS: {
        1: 2.0,  // 1er place
        2: 1.5,  // 2ème place
        3: 1.2,  // 3ème place
        // autres positions: 1.0
    },
    MAX_SCORE_PER_MASTERMIND: 1000,
    MIN_SCORE_PER_MASTERMIND: 10
};

// Configuration des WebSockets
export const WEBSOCKET_CONFIG = {
    HEARTBEAT_INTERVAL: 30000, // 30 secondes
    MAX_RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 1000,
    MESSAGE_TIMEOUT: 10000, // 10 secondes
    PING_INTERVAL: 25000 // 25 secondes
};

// Types d'événements WebSocket
export const WEBSOCKET_EVENTS = {
    // Événements de connexion
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    AUTHENTICATE: 'authenticate',
    HEARTBEAT: 'heartbeat',

    // Événements de partie
    PLAYER_JOINED: 'PLAYER_JOINED',
    PLAYER_LEFT: 'PLAYER_LEFT',
    GAME_STARTED: 'GAME_STARTED',
    GAME_FINISHED: 'MULTIPLAYER_GAME_FINISHED',

    // Événements de gameplay
    PLAYER_MASTERMIND_COMPLETE: 'PLAYER_MASTERMIND_COMPLETE',
    PLAYER_STATUS_CHANGED: 'PLAYER_STATUS_CHANGED',
    GAME_PROGRESS_UPDATE: 'GAME_PROGRESS_UPDATE',

    // Événements d'objets
    ITEM_USED: 'ITEM_USED',
    EFFECT_APPLIED: 'EFFECT_APPLIED',

    // Événements de chat
    CHAT_MESSAGE: 'CHAT_MESSAGE',

    // Événements d'erreur
    ERROR: 'error'
} as const;

// Configuration des animations
export const ANIMATION_CONFIG = {
    EFFECT_DURATION: 300,
    NOTIFICATION_DURATION: 3000,
    TOAST_DURATION: 5000,
    FADE_DURATION: 200,
    SLIDE_DURATION: 250,
    BOUNCE_DURATION: 600
};

// Couleurs pour l'interface
export const UI_COLORS = {
    SUCCESS: '#10B981',
    ERROR: '#EF4444',
    WARNING: '#F59E0B',
    INFO: '#3B82F6',
    PRIMARY: '#6366F1',
    SECONDARY: '#6B7280'
};

// Configuration des sons (pour une future implémentation)
export const SOUND_CONFIG = {
    ENABLED: false, // Désactivé par défaut
    VOLUME: 0.5,
    SOUNDS: {
        NOTIFICATION: '/sounds/notification.mp3',
        SUCCESS: '/sounds/success.mp3',
        ERROR: '/sounds/error.mp3',
        ITEM_USE: '/sounds/item-use.mp3',
        GAME_START: '/sounds/game-start.mp3',
        GAME_END: '/sounds/game-end.mp3'
    }
};

// Textes d'aide et tutoriel
export const HELP_TEXTS = {
    MULTIPLAYER_INTRO: 'Dans le mode multijoueur, vous affrontez d\'autres joueurs en temps réel. Chacun résout ses propres masterminds, et le premier à tous les terminer gagne !',
    ITEMS_SYSTEM: 'Terminez vos masterminds rapidement pour obtenir des objets. Les objets bonus vous aident, les malus gênent vos adversaires.',
    SCORING_SYSTEM: 'Votre score dépend de votre vitesse, précision et position finale. Utilisez les objets stratégiquement !',
    ROOM_CODES: 'Partagez le code de votre room pour inviter vos amis directement dans votre partie.',
    DIFFICULTY_TIPS: {
        [Difficulty.EASY]: 'Parfait pour débuter dans le multijoueur',
        [Difficulty.MEDIUM]: 'Équilibre entre accessibilité et défi',
        [Difficulty.HARD]: 'Pour les joueurs expérimentés',
        [Difficulty.EXPERT]: 'Le défi ultime du Mastermind !'
    }
};