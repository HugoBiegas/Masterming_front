import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { gameService } from '@/services/game';
import { GameType, GameMode, Difficulty } from '@/types/game';
import { DIFFICULTY_CONFIGS, GAME_TYPE_INFO } from '@/utils/constants';

export const SoloGameCreation: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        game_type: GameType.CLASSIC,
        difficulty: Difficulty.MEDIUM,
        quantum_enabled: false
    });

    const handleCreateGame = async () => {
        try {
            setLoading(true);
            setError('');

            const gameData = {
                game_type: formData.game_type,
                game_mode: GameMode.SINGLE,
                difficulty: formData.difficulty,
                max_players: 1,
                is_private: false,
                allow_spectators: false,
                enable_chat: false,
                quantum_enabled: formData.quantum_enabled
            };

            const game = await gameService.createGame(gameData);
            navigate(`/game/${game.id}`);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Erreur lors de la création de la partie');
        } finally {
            setLoading(false);
        }
    };

    const selectedDifficulty = DIFFICULTY_CONFIGS[formData.difficulty];

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />

            <div className="container mx-auto py-8">
                <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold mb-2">Créer une partie Solo</h1>
                        <p className="text-gray-600">Configurez votre partie de Mastermind</p>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Type de jeu */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Type de jeu
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.values(GameType).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFormData(prev => ({ ...prev, game_type: type }))}
                                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                                            formData.game_type === type
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                    >
                                        <h3 className="font-medium">{GAME_TYPE_INFO[type].name}</h3>
                                        <p className="text-sm text-gray-600">{GAME_TYPE_INFO[type].description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Difficulté */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Niveau de difficulté
                            </label>
                            <div className="space-y-2">
                                {Object.entries(DIFFICULTY_CONFIGS).map(([difficulty, config]) => (
                                    <button
                                        key={difficulty}
                                        onClick={() => setFormData(prev => ({ ...prev, difficulty: difficulty as Difficulty }))}
                                        className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                                            formData.difficulty === difficulty
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-medium capitalize">{difficulty}</h3>
                                                <p className="text-sm text-gray-600">{config.description}</p>
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {config.colors} couleurs • {config.length} positions • {config.attempts} tentatives
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Options quantiques */}
                        {formData.game_type === GameType.QUANTUM && (
                            <div>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.quantum_enabled}
                                        onChange={(e) => setFormData(prev => ({ ...prev, quantum_enabled: e.target.checked }))}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                    Activer les fonctionnalités quantiques avancées
                  </span>
                                </label>
                            </div>
                        )}

                        {/* Résumé de la configuration */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium mb-2">Configuration de la partie :</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Type : {GAME_TYPE_INFO[formData.game_type].name}</li>
                                <li>• Difficulté : {formData.difficulty}</li>
                                <li>• Couleurs disponibles : {selectedDifficulty.colors}</li>
                                <li>• Positions à deviner : {selectedDifficulty.length}</li>
                                <li>• Tentatives maximum : {selectedDifficulty.attempts}</li>
                                {formData.quantum_enabled && <li>• Mode quantique activé</li>}
                            </ul>
                        </div>
                    </div>

                    <div className="flex space-x-4 mt-8">
                        <button
                            onClick={() => navigate('/modes')}
                            className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            Retour
                        </button>

                        <button
                            onClick={handleCreateGame}
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Création...
                                </>
                            ) : (
                                'Créer la partie'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
