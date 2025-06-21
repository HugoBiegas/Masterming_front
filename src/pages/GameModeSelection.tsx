import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { GameModeCard } from '@/components/game/GameModeCard';
import { GameMode } from '@/types/game';

// Définition étendue des modes de jeu avec multijoueur
interface ExtendedGameMode {
    id: string;
    name: string;
    description: string;
    icon: string;
    route: string;
    available: boolean;
    isNew?: boolean;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    playerCount?: string;
}

const gameModes: ExtendedGameMode[] = [
    {
        id: 'solo',
        name: 'Solo Classique',
        description: 'Jouez seul contre l\'ordinateur avec hints quantiques',
        icon: '🎯',
        route: '/solo',
        available: true,
        difficulty: 'beginner',
        playerCount: '1 joueur'
    },
    {
        id: 'multiplayer_browse',
        name: 'Multijoueur',
        description: 'Rejoignez ou créez des parties multijoueur en ligne',
        icon: '🌐',
        route: '/multiplayer/browse',
        available: true,
        isNew: true,
        difficulty: 'intermediate',
        playerCount: '2-12 joueurs'
    },
    {
        id: 'multiplayer_quick',
        name: 'Partie Rapide',
        description: 'Créez rapidement une partie multijoueur standard',
        icon: '⚡',
        route: '/multiplayer/create?quick=true',
        available: true,
        difficulty: 'intermediate',
        playerCount: '2-6 joueurs'
    },
    {
        id: 'tournament',
        name: 'Tournoi',
        description: 'Participez à des tournois compétitifs',
        icon: '🏆',
        route: '/tournament',
        available: false, // À implémenter plus tard
        difficulty: 'advanced',
        playerCount: '8-32 joueurs'
    },
    {
        id: 'battle_royale',
        name: 'Battle Royale',
        description: 'Survie du dernier joueur, élimination progressive',
        icon: '⚔️',
        route: '/battle-royale',
        available: false, // À implémenter plus tard
        difficulty: 'advanced',
        playerCount: '6-20 joueurs'
    },
    {
        id: 'quantum',
        name: 'Mode Quantique',
        description: 'Exploitez la superposition et l\'intrication quantique',
        icon: '⚛️',
        route: '/quantum',
        available: false, // À implémenter plus tard
        difficulty: 'advanced',
        playerCount: '1 joueur'
    }
];

export const GameModeSelection: React.FC = () => {
    const navigate = useNavigate();

    const handleModeSelect = (mode: ExtendedGameMode) => {
        if (mode.available) {
            // Gestion spéciale pour la partie rapide
            if (mode.id === 'multiplayer_quick') {
                navigate('/multiplayer/create', {
                    state: { quickMode: true }
                });
            } else {
                navigate(mode.route);
            }
        }
    };

    const getDifficultyColor = (difficulty?: string) => {
        switch (difficulty) {
            case 'beginner':
                return 'bg-green-100 text-green-700';
            case 'intermediate':
                return 'bg-yellow-100 text-yellow-700';
            case 'advanced':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getDifficultyLabel = (difficulty?: string) => {
        switch (difficulty) {
            case 'beginner':
                return 'Débutant';
            case 'intermediate':
                return 'Intermédiaire';
            case 'advanced':
                return 'Avancé';
            default:
                return 'Variable';
        }
    };

    // Séparer les modes disponibles et indisponibles
    const availableModes = gameModes.filter(mode => mode.available);
    const upcomingModes = gameModes.filter(mode => !mode.available);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <Header />

            <div className="container mx-auto py-8 px-4">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">
                        🎯 Quantum Mastermind
                    </h1>
                    <p className="text-xl text-gray-600 mb-2">
                        Choisissez votre mode de jeu
                    </p>
                    <p className="text-gray-500">
                        Défiez votre logique dans l'univers quantique du Mastermind
                    </p>
                </div>

                {/* Modes disponibles */}
                <div className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                        <span className="mr-2">🎮</span>
                        Modes disponibles
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableModes.map((mode) => (
                            <div
                                key={mode.id}
                                onClick={() => handleModeSelect(mode)}
                                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-200 hover:border-blue-300"
                            >
                                <div className="p-6">
                                    {/* En-tête avec icône et badges */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="text-4xl">{mode.icon}</div>
                                        <div className="flex flex-col gap-1">
                                            {mode.isNew && (
                                                <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-medium">
                                                    NOUVEAU
                                                </span>
                                            )}
                                            {mode.difficulty && (
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${getDifficultyColor(mode.difficulty)}`}>
                                                    {getDifficultyLabel(mode.difficulty)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Titre et description */}
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                                        {mode.name}
                                    </h3>
                                    <p className="text-gray-600 mb-4 leading-relaxed">
                                        {mode.description}
                                    </p>

                                    {/* Informations supplémentaires */}
                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <span className="flex items-center">
                                            <span className="mr-1">👥</span>
                                            {mode.playerCount}
                                        </span>
                                        <span className="flex items-center text-blue-600 font-medium">
                                            Jouer
                                            <span className="ml-1">→</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Raccourcis rapides */}
                <div className="mb-12">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="mr-2">⚡</span>
                        Accès rapide
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => navigate('/multiplayer/create')}
                            className="flex items-center justify-center space-x-2 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <span>➕</span>
                            <span>Créer une partie</span>
                        </button>

                        <button
                            onClick={() => navigate('/multiplayer/browse')}
                            className="flex items-center justify-center space-x-2 p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <span>🔍</span>
                            <span>Rejoindre une partie</span>
                        </button>

                        <button
                            onClick={() => {
                                const roomCode = prompt('Entrez le code de la room:');
                                if (roomCode) {
                                    navigate(`/multiplayer/join/${roomCode.toUpperCase()}`);
                                }
                            }}
                            className="flex items-center justify-center space-x-2 p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <span>🔑</span>
                            <span>Rejoindre par code</span>
                        </button>
                    </div>
                </div>

                {/* Modes à venir */}
                {upcomingModes.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                            <span className="mr-2">🚧</span>
                            Bientôt disponible
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcomingModes.map((mode) => (
                                <div
                                    key={mode.id}
                                    className="bg-white rounded-xl shadow-md border border-gray-200 opacity-60"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="text-4xl filter grayscale">{mode.icon}</div>
                                            <div className="flex flex-col gap-1">
                                                <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full font-medium">
                                                    BIENTÔT
                                                </span>
                                                {mode.difficulty && (
                                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getDifficultyColor(mode.difficulty)}`}>
                                                        {getDifficultyLabel(mode.difficulty)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-600 mb-2">
                                            {mode.name}
                                        </h3>
                                        <p className="text-gray-500 mb-4 leading-relaxed">
                                            {mode.description}
                                        </p>

                                        <div className="flex items-center justify-between text-sm text-gray-400">
                                            <span className="flex items-center">
                                                <span className="mr-1">👥</span>
                                                {mode.playerCount}
                                            </span>
                                            <span className="italic">En développement...</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Informations et conseils */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="mr-2">💡</span>
                        Conseils pour bien commencer
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold text-gray-700 mb-2">🎯 Mode Solo</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Parfait pour apprendre les mécaniques</li>
                                <li>• Hints quantiques pour vous aider</li>
                                <li>• Progression à votre rythme</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-700 mb-2">🌐 Multijoueur</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Défiez d'autres joueurs en temps réel</li>
                                <li>• Système d'objets bonus/malus</li>
                                <li>• Parties de 2 à 12 joueurs</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};