import React from 'react';
import { Difficulty } from '@/types/multiplayer';

interface GameSettingsProps {
    gameInfo: {
        base_game: {
            difficulty: Difficulty;
            room_code: string;
            is_private: boolean;
            created_at: string;
        };
        max_players: number;
        total_masterminds: number;
        items_enabled: boolean;
        current_players: number;
        game_type: string;
    };
    isCreator: boolean;
    onUpdateSettings?: (settings: any) => void;
    readOnly?: boolean;
}

export const GameSettings: React.FC<GameSettingsProps> = ({
                                                              gameInfo,
                                                              isCreator,
                                                              onUpdateSettings,
                                                              readOnly = true
                                                          }) => {

    const getDifficultyInfo = (difficulty: Difficulty) => {
        switch (difficulty) {
            case Difficulty.EASY:
                return { label: 'Facile', desc: '4 couleurs, 6 trous', color: 'green' };
            case Difficulty.MEDIUM:
                return { label: 'Moyen', desc: '6 couleurs, 8 trous', color: 'yellow' };
            case Difficulty.HARD:
                return { label: 'Difficile', desc: '8 couleurs, 10 trous', color: 'orange' };
            case Difficulty.EXPERT:
                return { label: 'Expert', desc: '10 couleurs, 12 trous', color: 'red' };
            default:
                return { label: 'Inconnu', desc: '', color: 'gray' };
        }
    };

    const getDifficultyColorClasses = (color: string) => {
        switch (color) {
            case 'green':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'yellow':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'orange':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'red':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getGameTypeLabel = (gameType: string) => {
        switch (gameType) {
            case 'multi_mastermind':
                return 'Multi-Mastermind';
            case 'battle_royale':
                return 'Battle Royale';
            case 'tournament':
                return 'Tournoi';
            default:
                return 'Standard';
        }
    };

    const difficultyInfo = getDifficultyInfo(gameInfo.base_game.difficulty);

    return (
        <div className="space-y-6">

            {/* Informations principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Difficulté */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Difficulté</span>
                        <span className="text-xl">🎯</span>
                    </div>
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${
                        getDifficultyColorClasses(difficultyInfo.color)
                    }`}>
                        {difficultyInfo.label}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{difficultyInfo.desc}</p>
                </div>

                {/* Joueurs */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Joueurs</span>
                        <span className="text-xl">👥</span>
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                        {gameInfo.current_players} / {gameInfo.max_players}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                                width: `${(gameInfo.current_players / gameInfo.max_players) * 100}%`
                            }}
                        ></div>
                    </div>
                </div>

                {/* Masterminds */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Masterminds</span>
                        <span className="text-xl">🧩</span>
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                        {gameInfo.total_masterminds}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                        Durée estimée: {Math.round(gameInfo.total_masterminds * 3)} min
                    </p>
                </div>
            </div>

            {/* Configuration avancée */}
            <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Configuration avancée</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Type de partie */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                            <span className="text-lg">🎮</span>
                            <div>
                                <div className="font-medium text-gray-800">Type de partie</div>
                                <div className="text-sm text-gray-600">
                                    {getGameTypeLabel(gameInfo.game_type)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Système d'objets */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                            <span className="text-lg">🎁</span>
                            <div>
                                <div className="font-medium text-gray-800">Objets bonus/malus</div>
                                <div className="text-sm text-gray-600">
                                    {gameInfo.items_enabled ? 'Activés' : 'Désactivés'}
                                </div>
                            </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                            gameInfo.items_enabled ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                    </div>

                    {/* Visibilité */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                            <span className="text-lg">{gameInfo.base_game.is_private ? '🔒' : '🌐'}</span>
                            <div>
                                <div className="font-medium text-gray-800">Visibilité</div>
                                <div className="text-sm text-gray-600">
                                    {gameInfo.base_game.is_private ? 'Partie privée' : 'Partie publique'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Code de room */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                            <span className="text-lg">🔑</span>
                            <div>
                                <div className="font-medium text-gray-800">Code de room</div>
                                <div className="text-sm font-mono bg-white px-2 py-1 rounded border">
                                    {gameInfo.base_game.room_code}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Informations sur les objets (si activés) */}
            {gameInfo.items_enabled && (
                <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">📦 Système d'objets</h3>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">

                            <div>
                                <div className="font-medium text-blue-800 mb-2">🎁 Objets Bonus</div>
                                <ul className="space-y-1 text-blue-700">
                                    <li>• ⏰ Temps bonus</li>
                                    <li>• 💡 Indice supplémentaire</li>
                                    <li>• ⏭️ Passer un mastermind</li>
                                    <li>• ⭐ Score doublé</li>
                                </ul>
                            </div>

                            <div>
                                <div className="font-medium text-blue-800 mb-2">⚡ Objets Malus</div>
                                <ul className="space-y-1 text-blue-700">
                                    <li>• 🧊 Figer le temps</li>
                                    <li>• ➕ Ajouter un mastermind</li>
                                    <li>• ⚠️ Réduire les tentatives</li>
                                    <li>• 🌈 Mélanger les couleurs</li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-3 text-xs text-blue-600">
                            💡 Les objets sont obtenus aléatoirement en terminant des masterminds rapidement !
                        </div>
                    </div>
                </div>
            )}

            {/* Historique de création */}
            <div className="border-t pt-4">
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Partie créée le {new Date(gameInfo.base_game.created_at).toLocaleString()}</span>
                    {isCreator && (
                        <span className="flex items-center">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                            Vous êtes le créateur
                        </span>
                    )}
                </div>
            </div>

            {/* Conseils contextuels */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                    <span className="text-yellow-600 text-lg">💡</span>
                    <div className="text-sm">
                        <div className="font-medium text-yellow-800 mb-1">Conseils de jeu :</div>
                        <ul className="text-yellow-700 space-y-1">
                            <li>• Terminez vos masterminds rapidement pour obtenir plus d'objets</li>
                            <li>• Utilisez vos objets au bon moment pour maximiser leur impact</li>
                            <li>• Gardez un œil sur vos adversaires et anticipez leurs stratégies</li>
                            {gameInfo.total_masterminds > 6 && (
                                <li>• Cette partie sera longue, préparez-vous pour un marathon !</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};