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
import { DIFFICULTY_CONFIGS, COLOR_PALETTE } from '@/utils/constants';
import { Difficulty } from '@/types/multiplayer';
import { AttemptRequest } from '@/types/game';

// Interface pour les messages de chat
interface ChatMessage {
    id: string;
    user_id: string;
    username: string;
    message: string;
    timestamp: string;
    type: 'user' | 'system' | 'game';
    is_creator?: boolean;
}

// Composant AttemptHistory simplifié pour le mode multijoueur
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
                            {attempt.exact_matches || 0} ⚫
                        </span>
                        <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded">
                            {attempt.position_matches || 0} ⚪
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const MultiplayerGame: React.FC = () => {
    const { roomCode } = useParams<{ roomCode: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showError, showSuccess, showWarning } = useNotification();

    // Hook useMultiplayer avec les bonnes propriétés
    const {
        currentRoom,
        players,
        loading,
        error,
        isGameActive,
        isGameFinished,
        currentPlayer,
        makeAttempt,
        leaveRoom,
        refreshRoom
    } = useMultiplayer(roomCode);

    // États locaux du composant
    const [currentCombination, setCurrentCombination] = useState<number[]>([]);
    const [selectedColor, setSelectedColor] = useState<number | null>(null);
    const [attempts, setAttempts] = useState<any[]>([]);
    const [showColorModal, setShowColorModal] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

    // Configuration basée sur la difficulté de la room (fix: utiliser 'medium' pas 'MEDIUM')
    const difficultyConfig = currentRoom ? DIFFICULTY_CONFIGS[currentRoom.difficulty as Difficulty] : DIFFICULTY_CONFIGS.medium;

    // Initialiser la combinaison
    useEffect(() => {
        if (currentRoom && currentCombination.length === 0) {
            setCurrentCombination(new Array(difficultyConfig.length).fill(0));
        }
    }, [currentRoom, currentCombination.length, difficultyConfig.length]);

    // Redirection si la partie est terminée
    useEffect(() => {
        if (isGameFinished) {
            navigate(`/multiplayer/rooms/${roomCode}/results`);
        }
    }, [isGameFinished, roomCode, navigate]);

    // Vérifications d'état du jeu
    const canPlay = Boolean(
        currentRoom &&
        isGameActive &&
        currentPlayer &&
        currentPlayer.status === 'active'
    );

    const canSubmit = Boolean(
        canPlay &&
        currentCombination.length > 0 &&
        currentCombination.every(color => color > 0) &&
        !isSubmitting
    );

    // Gestionnaire de clic sur une position du plateau
    const handlePositionClick = useCallback((position: number) => {
        if (!canPlay || !selectedColor) return;

        setCurrentCombination(prev => {
            const newCombination = [...prev];
            newCombination[position] = selectedColor;
            return newCombination;
        });
    }, [canPlay, selectedColor]);

    // Gestionnaire pour supprimer une couleur
    const handleRemoveColor = useCallback((position: number) => {
        if (!canPlay) return;

        setCurrentCombination(prev => {
            const newCombination = [...prev];
            newCombination[position] = 0;
            return newCombination;
        });
    }, [canPlay]);

    // Gestionnaire de soumission d'une tentative
    const handleSubmitAttempt = useCallback(async () => {
        if (!canSubmit || !currentRoom || !user) return;

        setIsSubmitting(true);
        try {
            // Fix: AttemptRequest n'a pas de mastermind_number, juste combination
            const attemptRequest: AttemptRequest = {
                combination: currentCombination
            };

            const result = await makeAttempt(attemptRequest);

            if (result) {
                // Fix: utiliser is_winning au lieu de mastermind_completed
                if (result.is_winning) {
                    showSuccess(`🎯 Félicitations ! Vous avez trouvé la solution !`);
                } else if (result.game_finished) {
                    showSuccess(`🏁 Partie terminée !`);
                } else {
                    showSuccess('✅ Tentative enregistrée !');
                }

                // Réinitialiser la combinaison
                setCurrentCombination(new Array(difficultyConfig.length).fill(0));
                setSelectedColor(null);

                // Fix: utiliser les bonnes propriétés d'AttemptResult
                setAttempts(prev => [...prev, {
                    id: result.id,
                    combination: result.combination,
                    exact_matches: result.exact_matches,
                    position_matches: result.position_matches,
                    attempt_number: prev.length + 1
                }]);
            }

        } catch (error: any) {
            console.error('Erreur soumission tentative:', error);
            showError(error.message || 'Erreur lors de la soumission');
        } finally {
            setIsSubmitting(false);
        }
    }, [currentRoom, user, currentCombination, makeAttempt, difficultyConfig.length, showError, showSuccess, canSubmit]);

    // Gestionnaire pour quitter la partie
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
    }, [leaveRoom, showSuccess, showError, navigate]);

    // Gestionnaire pour ouvrir la modal de sélection de couleur
    const handleOpenColorModal = useCallback(() => {
        setShowColorModal(true);
    }, []);

    // Gestionnaire pour sélectionner une couleur
    const handleColorSelect = useCallback((color: number) => {
        setSelectedColor(color);
        setShowColorModal(false);
    }, []);

    // Gestionnaire pour envoyer un message de chat
    const handleSendMessage = useCallback((message: string) => {
        if (!user) return;

        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            user_id: user.id,
            username: user.username,
            message: message,
            timestamp: new Date().toISOString(),
            type: 'user',
            is_creator: currentRoom?.creator.id === user.id
        };

        setChatMessages(prev => [...prev, newMessage]);
        // TODO: Envoyer le message via WebSocket
    }, [user, currentRoom]);

    // États de chargement
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <Header />
                <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
                    <LoadingSpinner size="lg" />
                </div>
            </div>
        );
    }

    // Gestion des erreurs
    if (error || !currentRoom) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <Header />
                <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
                    <div className="text-center">
                        <div className="text-6xl mb-4">😵</div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            Erreur de chargement
                        </h1>
                        <p className="text-gray-600 mb-4">
                            {error || 'Impossible de charger la partie'}
                        </p>
                        <button
                            onClick={() => navigate('/multiplayer/browse')}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Retour au lobby
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <Header />

            <div className="container mx-auto px-4 py-6">
                {/* Header de la partie */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                🎮 {currentRoom.name}
                            </h1>
                            <p className="text-gray-600">
                                Code: <span className="font-mono font-medium">{currentRoom.room_code}</span> •
                                Difficulté: {currentRoom.difficulty} •
                                {currentPlayer ? (
                                    <>Score: {currentPlayer.score} points</>
                                ) : (
                                    'Spectateur'
                                )}
                            </p>
                        </div>

                        <div className="flex space-x-3">
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

                            {/* Bouton de sélection des couleurs */}
                            {canPlay && (
                                <div className="mt-4 text-center">
                                    <button
                                        onClick={handleOpenColorModal}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                                    >
                                        🎨 Choisir une couleur
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Historique des tentatives */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                📊 Vos tentatives
                            </h3>
                            <SimpleAttemptHistory
                                attempts={attempts}
                                maxAttempts={difficultyConfig.attempts}
                                combinationLength={difficultyConfig.length}
                            />
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
                                    onSendMessage={handleSendMessage}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal de sélection des couleurs */}
                {showColorModal && (
                    <ColorSelectionModal
                        isOpen={showColorModal}
                        onClose={() => setShowColorModal(false)}
                        selectedColor={selectedColor}
                        availableColors={difficultyConfig.colors}
                        onColorSelect={handleColorSelect}
                    />
                )}

                {/* Modal de confirmation pour quitter */}
                {showLeaveModal && (
                    <Modal
                        isOpen={showLeaveModal}
                        onClose={() => setShowLeaveModal(false)}
                        title="Quitter la partie"
                    >
                        <div className="text-center">
                            <div className="text-6xl mb-4">🚪</div>
                            <p className="text-gray-600 mb-6">
                                Êtes-vous sûr de vouloir quitter cette partie multijoueur ?
                            </p>
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={() => setShowLeaveModal(false)}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleLeaveGame}
                                    disabled={isLeaving}
                                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                                >
                                    {isLeaving ? 'Sortie...' : 'Quitter'}
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}
            </div>
        </div>
    );
};