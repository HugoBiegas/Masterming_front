import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import { PlayersList } from '@/components/multiplayer/PlayersList';
import { ItemsInventory } from '@/components/multiplayer/ItemsInventory';
import { GameProgressBar } from '@/components/multiplayer/GameProgressBar';
import { EffectsOverlay } from '@/components/multiplayer/EffectsOverlay';
import { ChatBox } from '@/components/multiplayer/ChatBox';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { multiplayerService } from '@/services/multiplayer';
import { DIFFICULTY_CONFIGS, COLOR_PALETTE, GameStatus } from '@/utils/constants';
import { Difficulty, ItemType, PlayerProgress, PlayerStatus } from '@/types/multiplayer';

// Composant GameBoard simplifié pour le multijoueur
const SimpleGameBoard: React.FC<{
    combination: number[];
    onPositionClick: (position: number) => void;
    onRemoveColor: (position: number) => void;
    onSubmitAttempt: () => void;
    selectedColor: number | null;
    isActive: boolean;
    canSubmit: boolean;
    isSubmitting?: boolean;
    combinationLength: number;
}> = ({
          combination,
          onPositionClick,
          onRemoveColor,
          onSubmitAttempt,
          selectedColor,
          isActive,
          canSubmit,
          isSubmitting = false,
          combinationLength
      }) => {
    return (
        <div className="space-y-4">
            {/* Plateau de jeu */}
            <div className="flex justify-center">
                <div className="flex space-x-2 p-4 bg-gray-100 rounded-lg">
                    {Array.from({ length: combinationLength }, (_, index) => (
                        <div
                            key={index}
                            onClick={() => isActive && onPositionClick(index)}
                            className={`w-12 h-12 rounded-full border-2 cursor-pointer transition-all ${
                                combination[index] > 0
                                    ? 'bg-blue-500 border-blue-600'
                                    : 'bg-white border-gray-300 hover:border-gray-400'
                            } ${isActive ? 'hover:scale-105' : 'cursor-not-allowed opacity-50'}`}
                            style={{
                                backgroundColor: combination[index] > 0 ? COLOR_PALETTE[combination[index] - 1] : undefined
                            }}
                        >
                            {combination[index] > 0 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveColor(index);
                                    }}
                                    className="w-full h-full rounded-full bg-black bg-opacity-20 hover:bg-opacity-40 text-white text-xs opacity-0 hover:opacity-100 transition-opacity"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bouton de soumission */}
            <div className="flex justify-center">
                <button
                    onClick={onSubmitAttempt}
                    disabled={!canSubmit || isSubmitting}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                    {isSubmitting ? (
                        <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Soumission...
                        </>
                    ) : (
                        '🎯 Soumettre'
                    )}
                </button>
            </div>
        </div>
    );
};

// Composant ColorPicker simplifié
const SimpleColorPicker: React.FC<{
    availableColors: number;
    selectedColor: number | null;
    onColorSelect: (color: number) => void;
}> = ({ availableColors, selectedColor, onColorSelect }) => {
    return (
        <div className="space-y-3">
            <h4 className="font-medium text-gray-700">Sélectionnez une couleur :</h4>
            <div className="flex flex-wrap gap-2 justify-center">
                {Array.from({ length: availableColors }, (_, index) => (
                    <button
                        key={index + 1}
                        onClick={() => onColorSelect(index + 1)}
                        className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                            selectedColor === index + 1
                                ? 'border-gray-800 ring-2 ring-blue-500'
                                : 'border-gray-400 hover:border-gray-600'
                        }`}
                        style={{ backgroundColor: COLOR_PALETTE[index] }}
                        title={`Couleur ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

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
        multiplayerGame,
        loading,
        error,
        isConnected,
        activeEffects,
        makeAttempt,
        useItem,
        leaveGame
    } = useMultiplayer(gameId);

    // États du jeu local
    const [currentCombination, setCurrentCombination] = useState<number[]>([]);
    const [selectedColor, setSelectedColor] = useState<number | null>(null);
    const [attempts, setAttempts] = useState<any[]>([]);
    const [currentMastermind, setCurrentMastermind] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // États de l'interface
    const [showChat, setShowChat] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showItemsModal, setShowItemsModal] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    // Chat
    const [chatMessages, setChatMessages] = useState<any[]>([]);

    // Configuration actuelle basée sur la difficulté
    const getDifficultyConfig = () => {
        if (!multiplayerGame?.base_game?.difficulty) {
            return DIFFICULTY_CONFIGS.medium;
        }

        const difficultyKey = multiplayerGame.base_game.difficulty.toString().toLowerCase() as Difficulty;
        return DIFFICULTY_CONFIGS[difficultyKey] ?? DIFFICULTY_CONFIGS.medium;
    };

    const config = getDifficultyConfig();

    // Initialiser la combinaison vide
    useEffect(() => {
        if (config && currentCombination.length === 0) {
            setCurrentCombination(new Array(config.length).fill(0));
        }
    }, [config, currentCombination.length]);

    // Redirection si la partie n'est pas active
    useEffect(() => {
        if (multiplayerGame && multiplayerGame.base_game.status === GameStatus.FINISHED) {
            navigate(`/multiplayer/results/${gameId}`);
        }
    }, [multiplayerGame?.base_game?.status, gameId, navigate]);

    // Gestionnaires du plateau de jeu
    const handlePositionClick = (position: number) => {
        if (!selectedColor || currentCombination[position] === selectedColor) return;

        const newCombination = [...currentCombination];
        newCombination[position] = selectedColor;
        setCurrentCombination(newCombination);
    };

    const handleRemoveColor = (position: number) => {
        const newCombination = [...currentCombination];
        newCombination[position] = 0;
        setCurrentCombination(newCombination);
    };

    const handleColorSelect = (color: number) => {
        setSelectedColor(color);
    };

    // Soumettre une tentative
    const handleSubmitAttempt = async () => {
        if (!gameId || !multiplayerGame || isSubmitting) return;

        // Vérifier que la combinaison est complète
        if (currentCombination.some(c => c === 0)) {
            showWarning('Veuillez compléter la combinaison');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await makeAttempt(currentMastermind, currentCombination);

            if (result) {
                // Ajouter la tentative à l'historique
                setAttempts(prev => [...prev, result.attempt]);

                // Réinitialiser la combinaison
                setCurrentCombination(new Array(config.length).fill(0));

                // Vérifier si le mastermind est terminé
                if (result.mastermind_completed) {
                    showSuccess(`Mastermind ${currentMastermind} terminé ! +${result.score} points`);

                    if (result.items_obtained && result.items_obtained.length > 0) {
                        showInfo(`🎁 Vous avez obtenu ${result.items_obtained.length} objet(s) !`);
                    }

                    // Passer au mastermind suivant ou terminer
                    if (result.next_mastermind) {
                        setCurrentMastermind(prev => prev + 1);
                        setAttempts([]); // Réinitialiser l'historique pour le nouveau mastermind
                    }
                }
            }
        } catch (error: any) {
            console.error('Erreur tentative:', error);
            showError('Erreur lors de la soumission de la tentative');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Utiliser un objet
    const handleUseItem = async (itemType: ItemType, targetPlayers?: string[]) => {
        if (!gameId || !multiplayerGame) return;

        try {
            await useItem(itemType, targetPlayers);
            setShowItemsModal(false);
        } catch (error: any) {
            console.error('Erreur utilisation objet:', error);
            showError('Impossible d\'utiliser cet objet');
        }
    };

    // Quitter la partie
    const handleLeaveGame = async () => {
        setIsLeaving(true);

        try {
            await leaveGame();
            showInfo('Vous avez quitté la partie');
            navigate('/multiplayer/browse');
        } catch (error: any) {
            console.error('Erreur quitter partie:', error);
            showError('Erreur lors de la sortie');
        } finally {
            setIsLeaving(false);
            setShowLeaveModal(false);
        }
    };

    // Vérifications
    const canSubmit = currentCombination.every(c => c > 0) && !isSubmitting;
    const myProgress = multiplayerGame?.player_progresses?.find((p: PlayerProgress) => p.user_id === user?.id);
    const isMyTurn = myProgress?.status === PlayerStatus.PLAYING;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Chargement de la partie...</p>
                </div>
            </div>
        );
    }

    if (error || !multiplayerGame) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur de connexion</h2>
                    <p className="text-gray-600 mb-4">{error || 'Impossible de charger la partie'}</p>
                    <button
                        onClick={() => navigate('/multiplayer/browse')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Retour aux parties
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            {/* Superposition des effets actifs */}
            <EffectsOverlay effects={Object.values(activeEffects)} />

            <div className="container mx-auto py-4 px-4">

                {/* Barre de progression et informations de partie */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-xl font-bold text-gray-800">
                                Mastermind {currentMastermind} / {multiplayerGame.total_masterminds}
                            </h1>
                            <div className={`flex items-center space-x-2 ${
                                isConnected ? 'text-green-600' : 'text-red-600'
                            }`}>
                                <div className={`w-2 h-2 rounded-full ${
                                    isConnected ? 'bg-green-500' : 'bg-red-500'
                                }`}></div>
                                <span className="text-sm">{isConnected ? 'Connecté' : 'Déconnecté'}</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setShowChat(!showChat)}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Chat"
                            >
                                💬
                            </button>
                            <button
                                onClick={() => setShowLeaderboard(!showLeaderboard)}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Classement"
                            >
                                🏆
                            </button>
                            <button
                                onClick={() => setShowLeaveModal(true)}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Quitter"
                            >
                                🚪
                            </button>
                        </div>
                    </div>

                    <GameProgressBar
                        currentMastermind={currentMastermind}
                        totalMasterminds={multiplayerGame.total_masterminds}
                        playerProgresses={multiplayerGame.player_progresses || []}
                        currentUserId={user?.id}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

                    {/* Zone de jeu principale */}
                    <div className="lg:col-span-3 space-y-4">

                        {/* Statut du joueur */}
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full ${
                                        isMyTurn ? 'bg-green-500' : 'bg-gray-400'
                                    }`}></div>
                                    <span className="font-medium">
                                        {isMyTurn ? '🎮 À votre tour !' : '⏳ En attente...'}
                                    </span>
                                    {myProgress && (
                                        <span className="text-sm text-gray-600">
                                            Score: {myProgress.score || 0} pts
                                        </span>
                                    )}
                                </div>

                                {/* Inventaire d'objets */}
                                {multiplayerGame.items_enabled && myProgress?.items && (
                                    <button
                                        onClick={() => setShowItemsModal(true)}
                                        className="flex items-center space-x-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                                    >
                                        <span>🎁</span>
                                        <span className="font-medium">{myProgress.items.length}</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Plateau de jeu */}
                        {isMyTurn && (
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <SimpleGameBoard
                                    combination={currentCombination}
                                    onPositionClick={handlePositionClick}
                                    onRemoveColor={handleRemoveColor}
                                    onSubmitAttempt={handleSubmitAttempt}
                                    selectedColor={selectedColor}
                                    isActive={true}
                                    canSubmit={canSubmit}
                                    isSubmitting={isSubmitting}
                                    combinationLength={config.length}
                                />

                                <div className="mt-6">
                                    <SimpleColorPicker
                                        availableColors={multiplayerGame.base_game.available_colors || config.colors}
                                        selectedColor={selectedColor}
                                        onColorSelect={handleColorSelect}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Historique des tentatives */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-lg font-semibold mb-4">
                                Historique - Mastermind {currentMastermind}
                            </h3>
                            <SimpleAttemptHistory
                                attempts={attempts}
                                maxAttempts={config.attempts}
                                combinationLength={config.length}
                            />
                        </div>
                    </div>

                    {/* Panneau latéral */}
                    <div className="space-y-4">

                        {/* Liste des joueurs */}
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <h3 className="font-semibold mb-3 flex items-center">
                                <span className="mr-2">👥</span>
                                Joueurs ({multiplayerGame.player_progresses?.length || 0})
                            </h3>
                            <PlayersList
                                players={multiplayerGame.player_progresses || []}
                                currentUserId={user?.id}
                                creatorId={multiplayerGame.base_game.creator_id}
                                showProgress={true}
                                showItems={multiplayerGame.items_enabled}
                                compactMode={true}
                            />
                        </div>

                        {/* Chat (si ouvert) */}
                        {showChat && (
                            <div className="bg-white rounded-lg shadow-md p-4">
                                <h3 className="font-semibold mb-3 flex items-center">
                                    <span className="mr-2">💬</span>
                                    Chat
                                </h3>
                                <ChatBox
                                    gameId={gameId}
                                    messages={chatMessages}
                                    onSendMessage={(message) => {
                                        // TODO: Envoyer via WebSocket
                                        console.log('Message:', message);
                                    }}
                                    maxHeight="300px"
                                />
                            </div>
                        )}

                        {/* Classement (si ouvert) */}
                        {showLeaderboard && (
                            <div className="bg-white rounded-lg shadow-md p-4">
                                <h3 className="font-semibold mb-3 flex items-center">
                                    <span className="mr-2">🏆</span>
                                    Classement actuel
                                </h3>
                                <PlayersList
                                    players={[...(multiplayerGame.player_progresses || [])]
                                        .sort((a, b) => (b.score || 0) - (a.score || 0))}
                                    currentUserId={user?.id}
                                    creatorId={multiplayerGame.base_game.creator_id}
                                    showProgress={true}
                                    compactMode={false}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal d'inventaire d'objets */}
            {multiplayerGame.items_enabled && (
                <Modal
                    isOpen={showItemsModal}
                    onClose={() => setShowItemsModal(false)}
                    title="🎁 Vos Objets"
                >
                    <div className="p-6">
                        <ItemsInventory
                            items={myProgress?.items || []}
                            onUseItem={handleUseItem}
                            otherPlayers={multiplayerGame.player_progresses?.filter((p: PlayerProgress) => p.user_id !== user?.id) || []}
                        />
                    </div>
                </Modal>
            )}

            {/* Modal de confirmation de sortie */}
            <Modal
                isOpen={showLeaveModal}
                onClose={() => setShowLeaveModal(false)}
                title="Quitter la partie"
            >
                <div className="p-6">
                    <p className="text-gray-600 mb-6">
                        Êtes-vous sûr de vouloir quitter cette partie ?
                        Votre progression sera perdue et vous serez éliminé.
                    </p>

                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => setShowLeaveModal(false)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Rester
                        </button>
                        <button
                            onClick={handleLeaveGame}
                            disabled={isLeaving}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                            {isLeaving ? <LoadingSpinner size="sm" /> : 'Quitter'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};