import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useNotification } from '@/contexts/NotificationContext';
import { multiplayerService } from '@/services/multiplayer';
import {
    MultiplayerGameCreateRequest,
    MultiplayerGameType,
    Difficulty
} from '@/types/multiplayer';

export const MultiplayerGameCreation: React.FC = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useNotification();

    const [formData, setFormData] = useState<MultiplayerGameCreateRequest>({
        game_type: MultiplayerGameType.MULTI_MASTERMIND,
        difficulty: Difficulty.MEDIUM,
        total_masterminds: 3,
        max_players: 6,
        is_private: false,
        password: '',
        items_enabled: true
    });

    const [isCreating, setIsCreating] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleInputChange = (field: keyof MultiplayerGameCreateRequest, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.is_private && !formData.password?.trim()) {
            showError('Un mot de passe est requis pour les parties privées');
            return;
        }

        setIsCreating(true);

        try {
            const response = await multiplayerService.createMultiplayerGame(formData);

            if (response.success) {
                showSuccess('Partie créée avec succès !');
                navigate(`/multiplayer/lobby/${response.game.id}`);
            } else {
                showError(response.message || 'Erreur lors de la création');
            }
        } catch (error: any) {
            console.error('Erreur création partie:', error);
            showError(error.response?.data?.detail || 'Erreur lors de la création de la partie');
        } finally {
            setIsCreating(false);
        }
    };

    const difficulties = [
        { value: Difficulty.EASY, label: 'Facile', desc: '4 couleurs, 6 trous' },
        { value: Difficulty.MEDIUM, label: 'Moyen', desc: '6 couleurs, 8 trous' },
        { value: Difficulty.HARD, label: 'Difficile', desc: '8 couleurs, 10 trous' },
        { value: Difficulty.EXPERT, label: 'Expert', desc: '10 couleurs, 12 trous' }
    ];

    const mastermindOptions = [3, 6, 9, 12];
    const playerOptions = [2, 4, 6, 8, 10, 12];

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container mx-auto py-8 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            🎯 Créer une Partie Multijoueur
                        </h1>
                        <p className="text-gray-600">
                            Configurez votre partie et invitez vos amis à jouer !
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Configuration de base */}
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                                    Configuration de Base
                                </h2>

                                {/* Difficulté */}
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
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className="font-medium">{diff.label}</div>
                                                <div className="text-sm text-gray-600">{diff.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Nombre de joueurs */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre maximum de joueurs
                                    </label>
                                    <select
                                        value={formData.max_players}
                                        onChange={(e) => handleInputChange('max_players', parseInt(e.target.value))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {playerOptions.map(num => (
                                            <option key={num} value={num}>
                                                {num} joueurs
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Nombre de masterminds */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre de Masterminds par partie
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {mastermindOptions.map(num => (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => handleInputChange('total_masterminds', num)}
                                                className={`p-2 rounded-lg border font-medium transition-all ${
                                                    formData.total_masterminds === num
                                                        ? 'border-blue-500 bg-blue-500 text-white'
                                                        : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Plus il y a de masterminds, plus la partie sera longue
                                    </p>
                                </div>
                            </div>

                            {/* Configuration avancée */}
                            <div className="space-y-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    <span className={`mr-2 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>
                                        ▶
                                    </span>
                                    Configuration Avancée
                                </button>

                                {showAdvanced && (
                                    <div className="space-y-4 pl-6 border-l-2 border-blue-200">

                                        {/* Système d'objets */}
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                id="items_enabled"
                                                checked={formData.items_enabled}
                                                onChange={(e) => handleInputChange('items_enabled', e.target.checked)}
                                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="items_enabled" className="font-medium text-gray-700">
                                                Activer le système d'objets bonus/malus
                                            </label>
                                        </div>
                                        <p className="text-sm text-gray-500 ml-8">
                                            Les joueurs pourront obtenir et utiliser des objets spéciaux
                                        </p>

                                        {/* Partie privée */}
                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-3">
                                                <input
                                                    type="checkbox"
                                                    id="is_private"
                                                    checked={formData.is_private}
                                                    onChange={(e) => handleInputChange('is_private', e.target.checked)}
                                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <label htmlFor="is_private" className="font-medium text-gray-700">
                                                    Partie privée avec mot de passe
                                                </label>
                                            </div>

                                            {formData.is_private && (
                                                <input
                                                    type="password"
                                                    placeholder="Mot de passe de la partie"
                                                    value={formData.password || ''}
                                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    required={formData.is_private}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Aperçu de la configuration */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-medium text-gray-800 mb-2">Aperçu de votre partie :</h3>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div>🎯 {formData.total_masterminds} Masterminds • Difficulté {
                                        difficulties.find(d => d.value === formData.difficulty)?.label
                                    }</div>
                                    <div>👥 Maximum {formData.max_players} joueurs</div>
                                    <div>🎮 Objets {formData.items_enabled ? 'activés' : 'désactivés'}</div>
                                    <div>🔒 Partie {formData.is_private ? 'privée' : 'publique'}</div>
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
                                        '🎯 Créer la Partie'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Conseils */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 mb-2">💡 Conseils :</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Plus de masterminds = parties plus longues mais plus de chances d'obtenir des objets</li>
                            <li>• Les objets ajoutent une dimension stratégique au jeu multijoueur</li>
                            <li>• Les parties privées ne sont visibles que par ceux qui ont le mot de passe</li>
                            <li>• Vous pouvez démarrer la partie même si tous les slots ne sont pas remplis</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};