import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useNotification } from '@/contexts/NotificationContext';
import { multiplayerService } from '@/services/multiplayer';
import {
    CreateRoomRequest,
    Difficulty
} from '@/types/multiplayer';
import { GameType } from '@/types/game';
import { DIFFICULTY_CONFIGS, GAME_TYPE_INFO } from '@/utils/constants';

// Interface étendue pour inclure les types de partie du solo
interface EnhancedCreateRoomRequest extends CreateRoomRequest {
    base_game_type: GameType; // Type de partie comme dans le solo
    quantum_enabled: boolean; // Support quantique
}

export const MultiplayerGameCreation: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showSuccess, showError } = useNotification();

    // Détection du mode rapide depuis la navigation
    const quickMode = location.state?.quickMode === true;

    const [formData, setFormData] = useState<EnhancedCreateRoomRequest>({
        name: quickMode ? 'Partie Rapide' : 'Ma Partie',
        game_type: GameType.CLASSIC, // NOUVEAU: Type de partie comme dans le solo
        base_game_type: GameType.CLASSIC, // NOUVEAU: Type de partie comme dans le solo
        difficulty: Difficulty.MEDIUM,
        max_players: quickMode ? 4 : 6,
        is_private: false,
        password: '',
        allow_spectators: false,
        enable_chat: true,
        quantum_enabled: false // NOUVEAU: Support quantique
    });

    const [isCreating, setIsCreating] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(!quickMode);

    const handleInputChange = (field: keyof EnhancedCreateRoomRequest, value: any) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            // Logique automatique pour le mode quantique
            if (field === 'base_game_type' && value === GameType.QUANTUM) {
                newData.quantum_enabled = true;
                newData.difficulty = Difficulty.EXPERT; // Quantique suggère expert
            } else if (field === 'base_game_type' && value !== GameType.QUANTUM) {
                newData.quantum_enabled = false;
            }

            return newData;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.is_private && !formData.password?.trim()) {
            showError('Un mot de passe est requis pour les parties privées');
            return;
        }

        // Mode rapidité : validation du temps limite
        if (formData.base_game_type === GameType.SPEED && !formData.max_players) {
            showError('Le nombre de joueurs est requis pour le mode rapidité');
            return;
        }

        setIsCreating(true);

        try {
            // Préparation des données pour l'API (format backend)
            const requestData: CreateRoomRequest = {
                name: formData.name,
                game_type: formData.base_game_type, // Utiliser le type de base
                difficulty: formData.difficulty,
                max_players: formData.max_players,
                is_private: formData.is_private,
                password: formData.password,
                allow_spectators: formData.allow_spectators,
                enable_chat: formData.enable_chat,
                quantum_enabled: formData.quantum_enabled
            };

            const room = await multiplayerService.createRoom(requestData);

            if (room) {
                showSuccess('Salon créé avec succès !');
                navigate(`/multiplayer/lobby/${room.id}`);
            } else {
                showError('Erreur lors de la création du salon');
            }
        } catch (error: any) {
            console.error('Erreur création partie:', error);
            showError(error.response?.data?.detail || 'Erreur lors de la création de la partie');
        } finally {
            setIsCreating(false);
        }
    };

    // Configurations des difficultés (même que le solo)
    const difficulties = [
        {
            value: Difficulty.EASY,
            label: 'Facile',
            desc: `${DIFFICULTY_CONFIGS.easy.colors} couleurs, ${DIFFICULTY_CONFIGS.easy.length} positions`,
            icon: '🟢'
        },
        {
            value: Difficulty.MEDIUM,
            label: 'Moyen',
            desc: `${DIFFICULTY_CONFIGS.medium.colors} couleurs, ${DIFFICULTY_CONFIGS.medium.length} positions`,
            icon: '🟡'
        },
        {
            value: Difficulty.HARD,
            label: 'Difficile',
            desc: `${DIFFICULTY_CONFIGS.hard.colors} couleurs, ${DIFFICULTY_CONFIGS.hard.length} positions`,
            icon: '🟠'
        },
        {
            value: Difficulty.EXPERT,
            label: 'Expert',
            desc: `${DIFFICULTY_CONFIGS.expert.colors} couleurs, ${DIFFICULTY_CONFIGS.expert.length} positions`,
            icon: '🔴'
        }
    ];

    // Types de partie (harmonisés avec le solo)
    const gameTypes = [
        {
            value: GameType.CLASSIC,
            label: GAME_TYPE_INFO[GameType.CLASSIC].name,
            desc: GAME_TYPE_INFO[GameType.CLASSIC].description,
            icon: '🎯',
            available: true
        },
        {
            value: GameType.QUANTUM,
            label: GAME_TYPE_INFO[GameType.QUANTUM].name,
            desc: GAME_TYPE_INFO[GameType.QUANTUM].description,
            icon: '⚛️',
            available: true,
            special: true
        },
        {
            value: GameType.SPEED,
            label: GAME_TYPE_INFO[GameType.SPEED].name,
            desc: GAME_TYPE_INFO[GameType.SPEED].description,
            icon: '⚡',
            available: true
        },
        {
            value: GameType.PRECISION,
            label: GAME_TYPE_INFO[GameType.PRECISION].name,
            desc: GAME_TYPE_INFO[GameType.PRECISION].description,
            icon: '🎪',
            available: true
        }
    ];

    const playerOptions = [2, 4, 6, 8, 10, 12];

    const selectedDifficulty = DIFFICULTY_CONFIGS[formData.difficulty];

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container mx-auto py-8 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            {quickMode ? '⚡ Partie Rapide Multijoueur' : '🎯 Créer une Partie Multijoueur'}
                        </h1>
                        <p className="text-gray-600">
                            {quickMode
                                ? 'Configuration simplifiée pour une partie immédiate'
                                : 'Configurez votre partie et invitez vos amis à jouer !'
                            }
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* NOUVEAU: Type de partie (harmonisé avec le solo) */}
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                                    Type de Partie
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {gameTypes.map((type) => (
                                        <div
                                            key={type.value}
                                            onClick={() => type.available && handleInputChange('base_game_type', type.value)}
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                                formData.base_game_type === type.value
                                                    ? type.special
                                                        ? 'border-purple-500 bg-purple-50'
                                                        : 'border-blue-500 bg-blue-50'
                                                    : type.available
                                                        ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                        : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <span className="text-2xl">{type.icon}</span>
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-gray-800">{type.label}</h3>
                                                    <p className="text-sm text-gray-600">{type.desc}</p>
                                                    {type.value === GameType.QUANTUM && (
                                                        <p className="text-xs text-purple-600 mt-1">
                                                            🔬 Inclut les fonctionnalités quantiques
                                                        </p>
                                                    )}
                                                    {!type.available && (
                                                        <p className="text-xs text-gray-500 mt-1">Bientôt disponible</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Configuration de base */}
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                                    Configuration de Base
                                </h2>

                                {/* Difficulté (harmonisée avec le solo) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Difficulté
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {difficulties.map((diff) => (
                                            <div
                                                key={diff.value}
                                                onClick={() => handleInputChange('difficulty', diff.value)}
                                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                    formData.difficulty === diff.value
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-xl">{diff.icon}</span>
                                                    <div>
                                                        <h3 className="font-medium text-gray-800">{diff.label}</h3>
                                                        <p className="text-sm text-gray-600">{diff.desc}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Nombre maximum de joueurs */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre maximum de joueurs
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {playerOptions.map((count) => (
                                            <button
                                                key={count}
                                                type="button"
                                                onClick={() => handleInputChange('max_players', count)}
                                                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                                                    formData.max_players === count
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                                }`}
                                            >
                                                {count} 👥
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Minimum 2 joueurs requis pour démarrer
                                    </p>
                                </div>
                            </div>

                            {/* Configuration avancée */}
                            {showAdvanced && !quickMode && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                                        Options Avancées
                                    </h2>

                                    {/* Options de jeu */}
                                    <div className="space-y-3">
                                        <label className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={formData.allow_spectators}
                                                onChange={(e) => handleInputChange('allow_spectators', e.target.checked)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-gray-700">
                                                    👁️ Autoriser les spectateurs
                                                </span>
                                                <p className="text-xs text-gray-500">
                                                    Permettre aux joueurs de regarder la partie
                                                </p>
                                            </div>
                                        </label>

                                        <label className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={formData.enable_chat}
                                                onChange={(e) => handleInputChange('enable_chat', e.target.checked)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-gray-700">
                                                    💬 Activer le chat
                                                </span>
                                                <p className="text-xs text-gray-500">
                                                    Permettre aux joueurs de communiquer
                                                </p>
                                            </div>
                                        </label>

                                        {formData.base_game_type === GameType.QUANTUM && (
                                            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                                <label className="flex items-center space-x-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.quantum_enabled}
                                                        onChange={(e) => handleInputChange('quantum_enabled', e.target.checked)}
                                                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                                    />
                                                    <div>
                                                        <span className="text-sm font-medium text-purple-700">
                                                            ⚛️ Mode quantique avancé
                                                        </span>
                                                        <p className="text-xs text-purple-600">
                                                            Superposition et intrication quantique
                                                        </p>
                                                    </div>
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    {/* Partie privée */}
                                    <div className="space-y-3">
                                        <label className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_private}
                                                onChange={(e) => handleInputChange('is_private', e.target.checked)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-medium text-gray-700">
                                                🔒 Partie privée (avec mot de passe)
                                            </span>
                                        </label>

                                        {formData.is_private && (
                                            <div className="ml-7">
                                                <input
                                                    type="password"
                                                    placeholder="Mot de passe de la partie"
                                                    value={formData.password}
                                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    required={formData.is_private}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Toggle pour les options avancées */}
                            {!quickMode && (
                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center mx-auto space-x-2"
                                    >
                                        <span>{showAdvanced ? 'Masquer' : 'Afficher'} les options avancées</span>
                                        <span className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
                                            ▼
                                        </span>
                                    </button>
                                </div>
                            )}

                            {/* Résumé de la configuration */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-medium text-gray-800 mb-2">📋 Résumé du salon</h4>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div>📝 Nom : {formData.name}</div>
                                    <div>🎯 Type : {GAME_TYPE_INFO[formData.base_game_type].name}</div>
                                    <div>📊 Difficulté : {difficulties.find(d => d.value === formData.difficulty)?.label}</div>
                                    <div>🎨 Couleurs : {selectedDifficulty.colors} disponibles</div>
                                    <div>📍 Positions : {selectedDifficulty.length} à deviner</div>
                                    <div>👥 Joueurs max : {formData.max_players}</div>
                                    <div>👁️ Spectateurs {formData.allow_spectators ? 'autorisés' : 'interdits'}</div>
                                    <div>💬 Chat {formData.enable_chat ? 'activé' : 'désactivé'}</div>
                                    <div>🔒 Salon {formData.is_private ? 'privé' : 'public'}</div>
                                    {formData.quantum_enabled && <div>⚛️ Mode quantique activé</div>}
                                </div>
                            </div>

                            {/* Boutons d'action */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => navigate('/modes')}
                                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Annuler
                                </button>

                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                >
                                    {isCreating ? (
                                        <>
                                            <LoadingSpinner size="sm" className="mr-2" />
                                            Création...
                                        </>
                                    ) : (
                                        quickMode ? '⚡ Créer Rapidement' : '🎯 Créer la Partie'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Conseils */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 mb-2">💡 Conseils :</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• <strong>Mode Classique</strong> : Mastermind traditionnel, idéal pour débuter</li>
                            <li>• <strong>Mode Quantique</strong> : Avec superposition et intrication quantique</li>
                            <li>• <strong>Mode Rapidité</strong> : Parties chronométrées pour plus d'intensité</li>
                            <li>• <strong>Mode Précision</strong> : Minimisez les tentatives pour maximiser le score</li>
                            <li>• Les spectateurs peuvent regarder sans participer</li>
                            <li>• Le chat permet aux joueurs de communiquer pendant la partie</li>
                            <li>• Les salons privés ne sont visibles que par ceux qui ont le mot de passe</li>
                            <li>• Vous pouvez démarrer la partie dès que 2 joueurs minimum sont présents</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};