import React, {useCallback, useState} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useNotification } from '@/contexts/NotificationContext';
import { multiplayerService } from '@/services/multiplayer';
import {
    Difficulty,
    EnhancedCreateRoomRequest,
    convertToCreateRoomRequest
} from '@/types/multiplayer';
import { GameType } from '@/types/game';
import { DIFFICULTY_CONFIGS, GAME_TYPE_INFO } from '@/utils/constants';

export const MultiplayerGameCreation: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showSuccess, showError, showWarning } = useNotification();

    // Détection du mode rapide depuis la navigation
    const quickMode = location.state?.quickMode === true;

    // Utiliser EnhancedCreateRoomRequest existant du projet
    const [formData, setFormData] = useState<EnhancedCreateRoomRequest>({
        name: quickMode ? 'Partie Rapide' : 'Ma Partie',
        game_type: GameType.CLASSIC,
        base_game_type: GameType.CLASSIC,
        difficulty: Difficulty.MEDIUM,
        max_players: quickMode ? 4 : 2,

        // Propriétés existantes du projet
        combination_length: 4,
        available_colors: 6,
        max_attempts: 10,
        total_masterminds: 3,
        quantum_enabled: false,
        items_enabled: true,
        items_per_mastermind: 1,
        is_public: true,
        is_private: false,
        password: '',
        allow_spectators: true,
        enable_chat: true,
        solution: undefined
    });

    const [isCreating, setIsCreating] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(!quickMode);

    const handleInputChange = useCallback((field: keyof EnhancedCreateRoomRequest, value: any) => {
        setFormData(prev => {
            const newData = {
                ...prev,
                [field]: value,
                ...(field === 'is_private' && { is_public: !value }),
                ...(field === 'is_public' && { is_private: !value })
            };

            // Activation automatique mode quantique
            if (field === 'base_game_type' && value === GameType.QUANTUM) {
                newData.quantum_enabled = true;
                newData.game_type = GameType.QUANTUM;
            } else if (field === 'base_game_type' && value !== GameType.QUANTUM) {
                newData.quantum_enabled = false;
                newData.game_type = value;
            }

            return newData;
        });
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (isCreating) return;

        setIsCreating(true);
        try {
            console.log('🎯 Données de création:', formData);

            // Quitter toutes les parties actives avant de créer une nouvelle
            try {
                await multiplayerService.leaveAllActiveGames();
                showSuccess('✅ Parties précédentes quittées');
            } catch (leaveError) {
                console.warn('Aucune partie active à quitter:', leaveError);
                // Ce n'est pas bloquant, on continue
            }

            // Convertir avec la fonction existante du projet
            const createRequest = convertToCreateRoomRequest(formData);

            console.log('🔄 Requête convertie:', createRequest);

            const room = await multiplayerService.createRoom(createRequest);

            if (room?.room_code) {
                showSuccess('🎉 Partie créée avec succès !');

                // Navigation vers le lobby
                navigate(`/multiplayer/rooms/${room.room_code}/lobby`, {
                    state: { room, fromCreation: true }
                });
            }
        } catch (err: any) {
            console.error('❌ Erreur création partie:', err);

            let errorMessage = 'Erreur lors de la création de la partie';

            if (err.response) {
                const { status, data } = err.response;

                if (status === 422) {
                    // Erreur de validation Pydantic
                    if (data.detail && Array.isArray(data.detail)) {
                        const validationErrors = data.detail.map((error: any) => {
                            if (error.msg) {
                                return `${error.loc ? error.loc.join('.') + ': ' : ''}${error.msg}`;
                            }
                            return String(error);
                        }).join(', ');
                        errorMessage = `Erreur de validation: ${validationErrors}`;
                    } else if (typeof data.detail === 'string') {
                        errorMessage = data.detail;
                    } else {
                        errorMessage = 'Données invalides pour la création de partie';
                    }
                } else {
                    errorMessage = multiplayerService.handleMultiplayerError(err, 'createRoom');
                }
            } else if (err.message) {
                errorMessage = err.message;
            }

            showError(errorMessage);
        } finally {
            setIsCreating(false);
        }
    }, [formData, navigate, showError, showSuccess, showWarning]);

    // Configurations des difficultés utilisant les types existants
    const difficulties = [
        {
            value: Difficulty.EASY,
            label: 'Facile',
            desc: `${DIFFICULTY_CONFIGS.easy.colors} couleurs, ${DIFFICULTY_CONFIGS.easy.length} positions, ${DIFFICULTY_CONFIGS.easy.attempts} tentatives`,
            color: 'bg-green-100 text-green-800'
        },
        {
            value: Difficulty.MEDIUM,
            label: 'Moyen',
            desc: `${DIFFICULTY_CONFIGS.medium.colors} couleurs, ${DIFFICULTY_CONFIGS.medium.length} positions, ${DIFFICULTY_CONFIGS.medium.attempts} tentatives`,
            color: 'bg-yellow-100 text-yellow-800'
        },
        {
            value: Difficulty.HARD,
            label: 'Difficile',
            desc: `${DIFFICULTY_CONFIGS.hard.colors} couleurs, ${DIFFICULTY_CONFIGS.hard.length} positions, ${DIFFICULTY_CONFIGS.hard.attempts} tentatives`,
            color: 'bg-orange-100 text-orange-800'
        },
        {
            value: Difficulty.EXPERT,
            label: 'Expert',
            desc: `${DIFFICULTY_CONFIGS.expert.colors} couleurs, ${DIFFICULTY_CONFIGS.expert.length} positions, ${DIFFICULTY_CONFIGS.expert.attempts} tentatives`,
            color: 'bg-red-100 text-red-800'
        }
    ];

    // Types de partie utilisant GAME_TYPE_INFO existant
    const gameTypes = [
        {
            value: GameType.CLASSIC,
            icon: '🎯',
            name: 'Classique',
            desc: 'Mastermind traditionnel avec hints intelligents',
            available: true,
            special: false
        },
        {
            value: GameType.SPEED,
            icon: '⚡',
            name: 'Rapidité',
            desc: 'Contre la montre, classement par vitesse',
            available: true,
            special: false
        },
        {
            value: GameType.PRECISION,
            icon: '🎯',
            name: 'Précision',
            desc: 'Minimisez les tentatives, chaque coup compte',
            available: true,
            special: false
        },
        {
            value: GameType.QUANTUM,
            icon: '⚛️',
            name: 'Quantique',
            desc: 'Superposition et intrication quantique',
            available: true,
            special: true
        }
    ];

    // Gestion sécurisée de la configuration de difficulté
    const selectedDifficulty = formData.difficulty && DIFFICULTY_CONFIGS[formData.difficulty] ?
        DIFFICULTY_CONFIGS[formData.difficulty] :
        DIFFICULTY_CONFIGS[Difficulty.MEDIUM];

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />

            <div className="container mx-auto py-8">
                <div className="max-w-3xl mx-auto">
                    {/* En-tête */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-4">
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

                            {/* Type de partie */}
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
                                                        ? 'border-gray-200 hover:border-gray-300'
                                                        : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                                            } ${!type.available ? 'opacity-50' : ''}`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <span className="text-2xl">{type.icon}</span>
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-gray-800">{type.name}</h3>
                                                    <p className="text-sm text-gray-600">{type.desc}</p>
                                                    {!type.available && (
                                                        <span className="text-xs text-orange-600 font-medium">Bientôt disponible</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Affichage du statut mode quantique */}
                                {formData.base_game_type === GameType.QUANTUM && (
                                    <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-purple-600">⚛️</span>
                                            <span className="text-sm font-medium text-purple-800">
                                                Mode quantique activé automatiquement
                                            </span>
                                        </div>
                                        <p className="text-xs text-purple-600 mt-1">
                                            Superposition et intrication quantique sont maintenant disponibles
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Nom du salon */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom du salon
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="Ma partie de Mastermind"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    maxLength={50}
                                />
                            </div>

                            {/* Difficulté */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Difficulté
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {difficulties.map((difficulty) => (
                                        <div
                                            key={difficulty.value}
                                            onClick={() => handleInputChange('difficulty', difficulty.value)}
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                                formData.difficulty === difficulty.value
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-medium text-gray-800">{difficulty.label}</h3>
                                                    <p className="text-sm text-gray-600 mt-1">{difficulty.desc}</p>
                                                </div>
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${difficulty.color}`}>
                                                    {difficulty.label}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Configuration Multijoueur */}
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                                    Configuration Multijoueur
                                </h2>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre de masterminds à résoudre
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                        {[1, 2, 3, 4, 5].map((count) => (
                                            <button
                                                key={count}
                                                type="button"
                                                onClick={() => handleInputChange('total_masterminds', count)}
                                                className={`p-3 rounded-lg border-2 text-center transition-all ${
                                                    formData.total_masterminds === count
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className="font-bold text-lg">{count}</div>
                                                <div className="text-xs text-gray-600">
                                                    {count === 1 ? 'Rapide' : count <= 3 ? 'Équilibré' : 'Long'}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2">
                                        Chaque joueur doit résoudre {formData.total_masterminds} mastermind{formData.total_masterminds > 1 ? 's' : ''} pour gagner.
                                        À chaque mastermind complété, vous obtenez des objets bonus/malus !
                                    </p>
                                </div>
                            </div>

                            {/* Nombre de joueurs */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre maximum de joueurs
                                </label>
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                    {[2, 4, 6, 8, 10, 12].map((count) => (
                                        <button
                                            key={count}
                                            type="button"
                                            onClick={() => handleInputChange('max_players', count)}
                                            className={`p-3 rounded-lg border-2 text-center transition-all ${
                                                formData.max_players === count
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="font-bold">{count}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Résumé de la configuration */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-medium text-gray-800 mb-2">📋 Résumé du salon</h4>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div>📝 Nom : {formData.name}</div>
                                    <div>🎯 Type : {gameTypes.find(t => t.value === formData.base_game_type)?.name || 'Classique'}</div>
                                    <div>📊 Difficulté : {difficulties.find(d => d.value === formData.difficulty)?.label}</div>
                                    <div>🎨 Couleurs : {selectedDifficulty.colors} disponibles</div>
                                    <div>📍 Positions : {selectedDifficulty.length} à deviner</div>
                                    <div>🔢 Masterminds : {formData.total_masterminds} à résoudre</div>
                                    <div>👥 Joueurs max : {formData.max_players}</div>
                                    <div>👁️ Spectateurs {formData.allow_spectators ? 'autorisés' : 'interdits'}</div>
                                    <div>💬 Chat {formData.enable_chat ? 'activé' : 'désactivé'}</div>
                                    <div>🎁 Objets {formData.items_enabled ? 'activés' : 'désactivés'}</div>
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
                            <li>• <strong>Masterminds multiples</strong> : Chaque joueur résout ses propres masterminds. Le premier à tous les terminer gagne !</li>
                            <li>• <strong>Objets bonus/malus</strong> : Obtenez des objets à chaque mastermind complété pour aider ou gêner vos adversaires</li>
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