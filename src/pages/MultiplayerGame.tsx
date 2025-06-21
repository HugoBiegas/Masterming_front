import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import { PlayersList } from '@/components/multiplayer/PlayersList';
import { ChatBox } from '@/components/multiplayer/ChatBox';
import { GameBoard } from '@/components/game/GameBoard';
import { ColorSelectionModal } from '@/components/game/ColorSelectionModal';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { multiplayerService } from '@/services/multiplayer';
import { DIFFICULTY_CONFIGS, COLOR_PALETTE } from '@/utils/constants';
import { Difficulty } from '@/types/multiplayer';

// Composant pour le plateau de jeu (utilise le vrai GameBoard du projet)
import { GameBoard } from '@/components/game/GameBoard';

// Composant AttemptHistory simplifié
const SimpleAttemptHistory: React.FC<{
    attempts: any[];
    maxAttempts: number;
    combinationLength: number;
}> = ({ attempts, maxAttempts, combinationLength }) => {
    if (attempts.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎯</div>
                <p>Aucune tentative pour le moment</p>
                <p className="text-sm">Faites votre première proposition !</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="text-sm text-gray-600 mb-3">
                Tentatives: {attempts.length} / {maxAttempts}
            </div>

            {attempts.map((attempt, index) => (
                <div key={attempt.id || index} className="flex items-center space-x-4 p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium w-8">#{index + 1}</span>

                    <div className="flex space-x-1">
                        {attempt.combination?.map((color: number, pos: number) => (
                            <div
                                key={pos}
                                className="w-6 h-6 rounded-full border border-gray-300"
                                style={{ backgroundColor: COLOR_PALETTE[color - 1] }}
                            />
                        ))}
                    </div>

                    <div className="flex items-center space-x-2">
                        <span className="text-xs bg-black text-white px-2 py-1 rounded">
                            {attempt.black_pegs || 0} ⚫
                        </span>
                        <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded">
                            {attempt.white_pegs || 0} ⚪
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const MultiplayerGame: React.FC = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showSuccess, showError, showInfo, showWarning } = useNotification();

    const {
        currentRoom,
        players,
        loading,
        error,
        isHost,
        currentPlayer,
        isGameActive,
        isGameFinished,
        makeAttempt,
        leaveRoom
    } = useMultiplayer(gameId);

    // États du jeu local
    const [currentCombination, setCurrentCombination] = useState<number[]>([]);
    const [selectedColor, setSelectedColor] = useState<number | null>(null);
    const [attempts, setAttempts] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // NOUVEAU: États pour la modal de sélection des couleurs
    const [showColorModal, setShowColorModal] = useState(false);
    const [colorModalPosition, setColorModalPosition] = useState<number | undefined>(undefined);

    // États de l'interface
    const [showChat, setShowChat] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    // Chat
    const [chatMessages, setChatMessages] = useState<any[]>([]);

    // Configuration actuelle basée sur la difficulté
    const getDifficultyConfig = () => {
        if (!currentRoom?.difficulty) {
            return DIFFICULTY_CONFIGS.medium;
        }

        const difficultyKey = currentRoom.difficulty.toString().toLowerCase() as Difficulty;
        return DIFFICULTY_CONFIGS[difficultyKey] ?? DIFFICULTY_CONFIGS.medium;
    };

    const difficultyConfig = getDifficultyConfig();

    // Initialisation de la combinaison
    useEffect(() => {
        if (currentRoom && currentCombination.length === 0) {
            setCurrentCombination(new Array(difficultyConfig.length).fill(0));
        }
    }, [currentRoom, difficultyConfig.length, currentCombination.length]);

    // NOUVEAU: Gestion de la sélection de couleur via modal
    const handlePositionClick = useCallback((position: number) => {
        if (!multiplayerGame || multiplayerGame.base_game.status !== 'active') return;

        setColorModalPosition(position);
        setShowColorModal(true);
    }, [multiplayerGame]);

    // NOUVEAU: Gestion de la sélection depuis la modal
    const handleColorSelect = useCallback((color: number) => {
        if (colorModalPosition !== undefined) {
            setCurrentCombination(prev => {
                const newCombination = [...prev];
                newCombination[colorModalPosition] = color;
                return newCombination;
            });
        }
        setSelectedColor(color);
    }, [colorModalPosition]);

    // NOUVEAU: Gestion du clic sur le cercle "O" (ouverture de la modal)
    const handleColorCircleClick = useCallback(() => {
        if (!multiplayerGame || multiplayerGame.base_game.status !== 'active') return;
        setColorModalPosition(undefined); // Pas de position spécifique
        setShowColorModal(true);
    }, [multiplayerGame]);

    // Suppression d'une couleur d'une position
    const handleRemoveColor = useCallback((position: number) => {
        if (!multiplayerGame || multiplayerGame.base_game.status !== 'active') return;

        setCurrentCombination(prev => {
            const newCombination = [...prev];
            newCombination[position] = 0;
            return newCombination;
        });
    }, [multiplayerGame]);

    // Soumission de la tentative
    const handleSubmitAttempt = useCallback(async () => {
        if (!currentRoom || !user) return;

        const hasAllColors = currentCombination.every(color => color > 0);
        if (!hasAllColors) {
            showError('Veuillez sélectionner toutes les couleurs avant de soumettre');
            return;
        }

        setIsSubmitting(true);
        try {
            showWarning('🎯 Soumission de la tentative...');

            // Créer un AttemptRequest correct
            const attemptRequest = {
                combination: currentCombination,
                use_quantum_hint: currentRoom.game_type === 'quantum'
            };

            const result = await makeAttempt(attemptRequest);

            if (result) {
                if (result.is_winning) {
                    showSuccess(`🏆 Félicitations ! Vous avez trouvé la solution !`);
                } else if (result.game_finished) {
                    showSuccess(`🏁 Partie terminée !`);
                } else {
                    showSuccess('✅ Tentative enregistrée !');
                }

                // Réinitialiser la combinaison
                setCurrentCombination(new Array(difficultyConfig.length).fill(0));
                setSelectedColor(null);

                // Ajouter la tentative à l'historique local
                setAttempts(prev => [...prev, {
                    id: Date.now().toString(), // ID temporaire
                    combination: result.combination,
                    black_pegs: result.exact_matches,
                    white_pegs: result.position_matches,
                    attempt_number: prev.length + 1
                }]);
            }

        } catch (error: any) {
            console.error('Erreur soumission tentative:', error);
            showError(error.message || 'Erreur lors de la soumission');
        } finally {
            setIsSubmitting(false);
        }
    }, [currentRoom, user, currentCombination, makeAttempt, difficultyConfig.length, showError, showSuccess, showWarning]);

    // Quitter la partie
    const handleLeaveGame = useCallback(async () => {
        setIsLeaving(true);
        try {
            await leaveRoom();
            showSuccess('Vous avez quitté le salon');
            navigate('/multiplayer/browse');
        } catch (error: any) {
            console.error('Erreur en quittant:', error);
            showError('Erreur lors de la sortie du salon');
        } finally {
            setIsLeaving(false);
            setShowLeaveModal(false);
        }
    }, [leaveRoom, navigate, showSuccess, showError]);

    // Vérifier si le joueur peut jouer
    const canPlay = isGameActive && currentPlayer;

    // Vérifier si la soumission est possible
    const canSubmit = canPlay && currentCombination.every(color => color > 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Chargement du salon multijoueur...</p>
                </div>
            </div>
        );
    }

    if (error || !currentRoom) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur</h2>
                    <p className="text-gray-600 mb-4">{error || 'Salon introuvable'}</p>
                    <button
                        onClick={() => navigate('/multiplayer/browse')}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                    >
                        Retour aux salons
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <Header />

            <div className="container mx-auto py-6 px-4">
                {/* En-tête de la partie */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                🌐 Salon Multijoueur - {currentRoom.room_code}
                            </h1>
                            <p className="text-gray-600">
                                {currentRoom.name} •
                                Difficulté: {currentRoom.difficulty} •
                                {difficultyConfig.colors} couleurs •
                                {difficultyConfig.length} positions
                            </p>
                        </div>

                        <div className="flex items-center space-x-2">
                            {/* Statut du salon */}
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                currentRoom.status === 'active' ? 'bg-green-100 text-green-800' :
                                    currentRoom.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                            }`}>
                                {multiplayerService.getRoomStatusIcon(currentRoom)} {multiplayerService.getRoomStatusText(currentRoom)}
                            </span>

                            {/* Statut du joueur */}
                            {currentPlayer && (
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    isGameActive ? 'bg-blue-100 text-blue-800' :
                                        isGameFinished ? 'bg-purple-100 text-purple-800' :
                                            'bg-gray-100 text-gray-800'
                                }`}>
                                    {isGameActive ? '🎯 En jeu' :
                                        isGameFinished ? '🏁 Terminé' :
                                            '⏳ En attente'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            👥 {currentRoom.current_players}/{currentRoom.max_players} joueurs
                        </div>

                        <div className="flex space-x-2">
                            <button
                                onClick={() => setShowLeaderboard(true)}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center"
                            >
                                🏆 Classement
                            </button>

                            {/* Chat */}
                            <button
                                onClick={() => setShowChat(!showChat)}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                            >
                                💬 Chat
                            </button>

                            <button
                                onClick={() => setShowLeaveModal(true)}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                            >
                                🚪 Quitter
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-6">
                    {/* Zone de jeu principale */}
                    <div className="flex-1">
                        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                🎯 Plateau de Jeu
                            </h2>

                            <GameBoard
                                combination={currentCombination}
                                onPositionClick={handlePositionClick}
                                onRemoveColor={handleRemoveColor}
                                onSubmitAttempt={handleSubmitAttempt}
                                selectedColor={selectedColor}
                                isActive={canPlay}
                                canSubmit={canSubmit}
                            />
                        </div>

                        {/* Historique des tentatives - Simple pour multijoueur */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                📊 Vos tentatives
                            </h3>
                            {attempts.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <div className="text-4xl mb-2">🎯</div>
                                    <p>Aucune tentative pour le moment</p>
                                    <p className="text-sm">Faites votre première proposition !</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {attempts.map((attempt, index) => (
                                        <div key={attempt.id || index} className="flex items-center space-x-4 p-2 bg-gray-50 rounded">
                                            <span className="text-sm font-medium w-8">#{index + 1}</span>
                                            <div className="flex space-x-1">
                                                {attempt.combination?.map((color: number, pos: number) => (
                                                    <div
                                                        key={pos}
                                                        className="w-6 h-6 rounded-full border border-gray-300"
                                                        style={{ backgroundColor: '#ff0000' }} // Couleur placeholder
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs bg-black text-white px-2 py-1 rounded">
                                                    {attempt.black_pegs || 0} ⚫
                                                </span>
                                                <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded">
                                                    {attempt.white_pegs || 0} ⚪
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar avec joueurs et chat */}
                    <div className="w-80 space-y-6">
                        {/* Liste des joueurs */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                👥 Joueurs ({currentRoom.current_players}/{currentRoom.max_players})
                            </h3>
                            <PlayersList
                                players={players}
                                currentUserId={user?.id}
                                creatorId={currentRoom.creator.id}
                                showProgress={true}
                                showItems={false}
                            />
                        </div>

                        {/* Chat */}
                        {showChat && (
                            <div className="bg-white rounded-lg shadow-lg">
                                <ChatBox
                                    messages={chatMessages}
                                    onSendMessage={(message) => {
                                        // TODO: Implémenter l'envoi de message
                                        console.log('Envoi message:', message);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* NOUVEAU: Modal de sélection des couleurs */}
            <ColorSelectionModal
                isOpen={showColorModal}
                onClose={() => setShowColorModal(false)}
                onColorSelect={handleColorSelect}
                availableColors={difficultyConfig.colors}
                selectedColor={selectedColor}
                position={colorModalPosition}
            />

            {/* Modal du classement */}
            <Modal
                isOpen={showLeaderboard}
                onClose={() => setShowLeaderboard(false)}
                title="🏆 Classement"
            >
                <div className="p-6">
                    <PlayersList
                        players={[...players].sort((a, b) => (b.score || 0) - (a.score || 0))}
                        currentUserId={user?.id}
                        creatorId={currentRoom?.creator.id || ''}
                        showProgress={true}
                        showItems={false}
                    />
                </div>
            </Modal>

            {/* Modal de confirmation de sortie */}
            <Modal
                isOpen={showLeaveModal}
                onClose={() => setShowLeaveModal(false)}
                title="🚪 Quitter le salon"
            >
                <div className="p-6">
                    <p className="text-gray-600 mb-4">
                        Êtes-vous sûr de vouloir quitter ce salon multijoueur ?
                    </p>
                    <p className="text-sm text-red-600 mb-6">
                        ⚠️ Votre progression sera perdue et vous ne pourrez pas rejoindre ce salon.
                    </p>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setShowLeaveModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleLeaveGame}
                            disabled={isLeaving}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                        >
                            {isLeaving ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Sortie...
                                </>
                            ) : (
                                'Confirmer'
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};