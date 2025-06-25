import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { gameService } from '@/services/game';
import { GameType, GameMode, Difficulty, GameCreateRequest } from '@/types/game';
import { DIFFICULTY_CONFIGS, GAME_TYPE_INFO } from '@/utils/constants';
import { useNotification } from '@/contexts/NotificationContext';

export const SoloGameCreation: React.FC = () => {
    const navigate = useNavigate();
    const { showError, showSuccess, showWarning } = useNotification();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<GameCreateRequest>>({
        game_type: GameType.QUANTUM,
        game_mode: GameMode.SINGLE,
        difficulty: Difficulty.MEDIUM,
        quantum_enabled: false,
        max_players: 1,
        is_private: false,
        allow_spectators: false,
        enable_chat: false
    });

    const handleCreateGame = useCallback(async () => {
        try {
            setLoading(true);
            showWarning('🎮 Création de la partie en cours...');

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

            // Tentative de création avec auto_leave=true pour éviter les conflits
            const gameDataWithAutoLeave: GameCreateRequest = {
                game_type: formData.game_type!,
                game_mode: GameMode.SINGLE,
                difficulty: formData.difficulty!,
                max_players: 1,
                is_private: false,
                allow_spectators: false,
                enable_chat: false,
                quantum_enabled: formData.quantum_enabled || false,
                auto_leave: true // Force auto-leave pour éviter les erreurs
            };

            const response = await gameService.createGameWithAutoLeave(gameDataWithAutoLeave);

            // Vérifier que la réponse contient bien un ID de partie
            const gameId = response.id;

            if (!gameId) {
                throw new Error('ID de partie manquant dans la réponse');
            }

            showSuccess('✅ Partie créée avec succès !');

            // CORRECTION: Navigation vers la bonne route solo
            try {
                navigate(`/solo/game/${gameId}`, {
                    replace: true, // Remplace l'entrée d'historique actuelle
                    state: { fromCreation: true } // État pour identifier la source
                });
            } catch (navigationError) {
                console.error('Erreur de navigation:', navigationError);
                // Fallback : utiliser window.location si navigate échoue
                window.location.href = `/solo/game/${gameId}`;
            }

        } catch (err: any) {
            console.error('Erreur lors de la création:', err);

            // Gestion des erreurs spécifiques
            let errorMessage = 'Erreur lors de la création de la partie';

            if (err.response?.status === 409) {
                // Conflit - utilisateur déjà dans une partie
                errorMessage = 'Vous êtes déjà dans une partie active. Tentative de résolution...';
                showWarning(errorMessage);

                // Tenter de quitter les parties actives et réessayer
                try {
                    await gameService.leaveAllActiveGames();
                    showSuccess('✅ Parties actives quittées, nouvelle tentative...');

                    // Réessayer la création
                    setTimeout(() => {
                        handleCreateGame();
                    }, 1000);
                    return;

                } catch (leaveError) {
                    console.error('Erreur lors du leave:', leaveError);
                    errorMessage = 'Impossible de quitter les parties actives. Rechargez la page.';
                }
            } else if (err.response?.status === 401) {
                errorMessage = 'Session expirée. Reconnectez-vous.';
                // Rediriger vers la page de connexion
                setTimeout(() => navigate('/'), 2000);
            } else if (err.response?.status === 400) {
                errorMessage = err.response.data?.detail || 'Données de création invalides';
            } else if (!err.response) {
                errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet.';
            }

            showError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [formData, navigate, showError, showSuccess, showWarning]);

    const handleBack = useCallback(() => {
        navigate('/modes');
    }, [navigate]);

    const selectedDifficulty = formData.difficulty ? DIFFICULTY_CONFIGS[formData.difficulty] : DIFFICULTY_CONFIGS[Difficulty.MEDIUM];

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />

            <div className="container mx-auto py-8">
                <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold mb-2">Créer une partie Solo</h1>
                        <p className="text-gray-600">Configurez votre partie de Mastermind</p>
                    </div>

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
                                        disabled={loading}
                                        className={`p-4 border-2 rounded-lg text-left transition-all disabled:opacity-50 ${
                                            formData.game_type === type
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">{GAME_TYPE_INFO[type].icon}</span>
                                            <div>
                                                <h3 className="font-medium text-gray-800">{GAME_TYPE_INFO[type].name}</h3>
                                                <p className="text-sm text-gray-600">{GAME_TYPE_INFO[type].description}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Difficulté */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Difficulté
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.values(Difficulty).map((difficulty) => (
                                    <button
                                        key={difficulty}
                                        onClick={() => setFormData(prev => ({ ...prev, difficulty }))}
                                        disabled={loading}
                                        className={`p-4 border-2 rounded-lg text-left transition-all disabled:opacity-50 ${
                                            formData.difficulty === difficulty
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <h3 className="font-medium text-gray-800 capitalize">{difficulty}</h3>
                                        <p className="text-sm text-gray-600">
                                            {DIFFICULTY_CONFIGS[difficulty].colors} couleurs, {DIFFICULTY_CONFIGS[difficulty].length} positions, {DIFFICULTY_CONFIGS[difficulty].attempts} tentatives
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>


                        {/* Résumé */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-800 mb-2">📋 Résumé de la partie</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Type : {formData.game_type ? GAME_TYPE_INFO[formData.game_type].name : ''}</li>
                                <li>• Difficulté : {formData.difficulty}</li>
                                <li>• Couleurs disponibles : {selectedDifficulty.colors}</li>
                                <li>• Positions à deviner : {selectedDifficulty.length}</li>
                                <li>• Tentatives maximum : {selectedDifficulty.attempts}</li>
                                {formData.quantum_enabled && <li>• Mode quantique activé</li>}
                            </ul>
                        </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex space-x-4 mt-8">
                        <button
                            onClick={handleBack}
                            disabled={loading}
                            className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 disabled:bg-gray-300 transition-colors font-medium"
                        >
                            Retour
                        </button>

                        <button
                            onClick={handleCreateGame}
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium flex items-center justify-center min-h-[48px]"
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

                    {/* Messages d'aide */}
                    {loading && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2">
                                <LoadingSpinner size="sm" />
                                <span className="text-sm text-blue-700">
                                    Création en cours... Veuillez patienter, vous allez être redirigé vers votre partie.
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};