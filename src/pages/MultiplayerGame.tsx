import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import { GameBoard } from '@/components/game/GameBoard';
import { ColorSelectionModal } from '@/components/game/ColorSelectionModal';
import { VictoryDefeatDisplay } from '@/components/game/VictoryDefeatDisplay';
import { PlayersList } from '@/components/multiplayer/PlayersList';
import { MultiplayerAttemptHistory } from '@/components/multiplayer/MultiplayerAttemptHistory';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { DIFFICULTY_CONFIGS, COLOR_PALETTE } from '@/utils/constants';
import { PlayerProgress, MultiplayerAttemptResponse, GameRoom } from '@/types/multiplayer';

// Extension locale de GameRoom pour les propriétés spécifiques au client
interface ExtendedGameRoom extends GameRoom {
    current_mastermind_solution?: number[];
    current_mastermind_number?: number;
    game_state?: {
        solution: number[];
        current_round: number;
        is_finished: boolean;
        time_remaining?: number;
        max_time?: number;
    };
}

// ==================== INTERFACES ====================

interface MultiplayerGameState {
    currentCombination: number[];
    attempts: MultiplayerAttemptResponse[];
    isSubmitting: boolean;
    showColorModal: boolean;
    colorModalPosition?: number;
    selectedColor: number;
    currentScore: number;
    isWinner: boolean;
    showVictoryDefeat: boolean;
    timer: number;
    isTimerRunning: boolean;
    showHistorySidebar: boolean;
}

// Messages de chat (simulation)
interface ChatMessage {
    id: string;
    user_id: string;
    username: string;
    message: string;
    timestamp: string;
    type: 'user' | 'system' | 'game';
}

// ==================== COMPOSANTS AUXILIAIRES ====================

// Composant Chat simple (placeholder)
const SimpleChat: React.FC<{
    messages: ChatMessage[];
    currentUser: any;
    onSendMessage: (message: string) => void;
    className?: string;
}> = ({ messages, currentUser, onSendMessage, className = "" }) => {
    const [newMessage, setNewMessage] = useState('');

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            onSendMessage(newMessage.trim());
            setNewMessage('');
        }
    };

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-3 rounded-t-lg">
                <h3 className="font-bold text-sm">💬 Chat</h3>
            </div>

            {/* Messages */}
            <div className="h-40 overflow-y-auto p-3 space-y-2 text-sm">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 text-xs">
                        Aucun message pour le moment...
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <div key={index} className="text-xs">
                            <span className="font-semibold">{message.username}:</span>
                            <span className="ml-2">{message.message}</span>
                        </div>
                    ))
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-2 border-t border-gray-200">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Tapez votre message..."
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        maxLength={200}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 disabled:opacity-50 text-xs"
                    >
                        📤
                    </button>
                </div>
            </form>
        </div>
    );
};

// Composant Timer
const GameTimer: React.FC<{
    time: number;
    isRunning: boolean;
    className?: string;
}> = ({ time, isRunning, className = "" }) => {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 ${className}`}>
            <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                    {formatTime(time)}
                </div>
                <div className={`text-sm ${isRunning ? 'text-green-600' : 'text-red-600'}`}>
                    {isRunning ? '⏱️ En cours' : '⏸️ Arrêté'}
                </div>
            </div>
        </div>
    );
};

// ==================== COMPOSANT PRINCIPAL ====================

export const MultiplayerGame: React.FC = () => {
    const { roomCode } = useParams<{ roomCode: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showError, showSuccess, showWarning, showInfo } = useNotification();

    // Hook useMultiplayer avec toutes les fonctionnalités
    const {
        currentRoom: baseCurrentRoom,
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

    // Étendre currentRoom avec les propriétés manquantes
    const currentRoom = baseCurrentRoom as ExtendedGameRoom | null;

    // État du jeu
    const [state, setState] = useState<MultiplayerGameState>({
        currentCombination: [],
        attempts: [],
        isSubmitting: false,
        showColorModal: false,
        colorModalPosition: undefined,
        selectedColor: -1,
        currentScore: 0,
        isWinner: false,
        showVictoryDefeat: false,
        timer: 0,
        isTimerRunning: false,
        showHistorySidebar: true
    });

    // Messages de chat (simulation)
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

    // Ref pour le timer
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Configuration de difficulté
    const difficultyConfig = currentRoom?.difficulty ? DIFFICULTY_CONFIGS[currentRoom.difficulty] : null;

    // ==================== FONCTIONS UTILITAIRES ====================

    // Fonction pour récupérer la solution (uniquement disponible en fin de partie)
    const getSolution = useCallback((): number[] => {
        // La solution n'est révélée qu'en fin de partie pour des raisons de sécurité
        if (!currentRoom || !isGameFinished) {
            return [];
        }

        // Essayer différentes sources pour la solution
        return currentRoom.current_mastermind_solution ||
            currentRoom.game_state?.solution ||
            // Solution par défaut si pas disponible
            [];
    }, [currentRoom, isGameFinished]);

    // ==================== EFFETS ====================

    // Effet pour rediriger si pas de room
    useEffect(() => {
        if (!roomCode) {
            navigate('/multiplayer');
            return;
        }
    }, [roomCode, navigate]);

    // Effet pour gérer les erreurs
    useEffect(() => {
        if (error) {
            showError(error);
        }
    }, [error, showError]);

    // Effet pour initialiser la combinaison
    useEffect(() => {
        if (difficultyConfig && state.currentCombination.length === 0) {
            setState(prev => ({
                ...prev,
                currentCombination: new Array(difficultyConfig.length).fill(-1)
            }));
        }
    }, [difficultyConfig, state.currentCombination.length]);

    // Effet pour le timer
    useEffect(() => {
        if (state.isTimerRunning && isGameActive && !isGameFinished) {
            timerRef.current = setInterval(() => {
                setState(prev => ({ ...prev, timer: prev.timer + 1 }));
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [state.isTimerRunning, isGameActive, isGameFinished]);

    // Effet pour démarrer le timer quand le jeu est actif
    useEffect(() => {
        if (isGameActive && !isGameFinished) {
            setState(prev => ({ ...prev, isTimerRunning: true }));
        } else {
            setState(prev => ({ ...prev, isTimerRunning: false }));
        }
    }, [isGameActive, isGameFinished]);

    // Effet pour mettre à jour le score et statut depuis currentPlayer
    useEffect(() => {
        if (currentPlayer) {
            setState(prev => ({
                ...prev,
                currentScore: currentPlayer.score || 0,
                isWinner: currentPlayer.is_winner || false
            }));

            if (currentPlayer.status === 'finished' || currentPlayer.is_winner) {
                setState(prev => ({
                    ...prev,
                    showVictoryDefeat: true,
                    isTimerRunning: false
                }));
            }
        }
    }, [currentPlayer]);

    // ==================== GESTIONNAIRES D'ÉVÉNEMENTS ====================

    const handlePositionClick = useCallback((position: number) => {
        setState(prev => ({
            ...prev,
            colorModalPosition: position,
            showColorModal: true
        }));
    }, []);

    const handleColorSelect = useCallback((colorIndex: number) => {
        if (state.colorModalPosition !== undefined) {
            const newCombination = [...state.currentCombination];
            newCombination[state.colorModalPosition] = colorIndex;
            setState(prev => ({
                ...prev,
                currentCombination: newCombination,
                selectedColor: colorIndex,
                showColorModal: false,
                colorModalPosition: undefined
            }));
        }
    }, [state.currentCombination, state.colorModalPosition]);

    const handleSubmitAttempt = useCallback(async () => {
        if (!difficultyConfig || state.isSubmitting || !state.currentCombination.every(c => c !== -1)) {
            return;
        }

        try {
            setState(prev => ({ ...prev, isSubmitting: true }));
            showInfo('⏳ Envoi de la tentative...');

            const result = await makeAttempt(state.currentCombination);

            if (result) {
                setState(prev => ({
                    ...prev,
                    attempts: [...prev.attempts, result],
                    currentCombination: new Array(difficultyConfig.length).fill(-1)
                }));

                showSuccess('✅ Tentative envoyée !');

                // Vérifier si c'est une victoire
                if (result.is_correct || result.mastermind_completed) {
                    setState(prev => ({
                        ...prev,
                        isWinner: true,
                        showVictoryDefeat: true,
                        isTimerRunning: false
                    }));
                    showSuccess('🎉 Mastermind résolu ! Bravo !');
                }
            } else {
                showError('Échec de l\'envoi de la tentative');
            }
        } catch (err: any) {
            console.error('Erreur tentative:', err);
            showError(err.message || 'Erreur lors de la tentative');
        } finally {
            setState(prev => ({ ...prev, isSubmitting: false }));
        }
    }, [difficultyConfig, state.isSubmitting, state.currentCombination, makeAttempt, showInfo, showSuccess, showError]);

    const handleSendChatMessage = useCallback((message: string) => {
        if (!user) return;

        const newMessage: ChatMessage = {
            id: `${Date.now()}-${Math.random()}`,
            user_id: user.id,
            username: user.username,
            message,
            timestamp: new Date().toISOString(),
            type: 'user'
        };

        setChatMessages(prev => [...prev, newMessage]);
        showInfo(`💬 Message envoyé: ${message}`);
    }, [user, showInfo]);

    const handleLeaveGame = useCallback(async () => {
        try {
            await leaveRoom();
            navigate('/multiplayer');
        } catch (err: any) {
            console.error('Erreur sortie:', err);
            showError(err.message || 'Erreur lors de la sortie');
        }
    }, [leaveRoom, navigate, showError]);

    const toggleHistorySidebar = useCallback(() => {
        setState(prev => ({ ...prev, showHistorySidebar: !prev.showHistorySidebar }));
    }, []);

    // ==================== RENDU CONDITIONNEL ====================

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Chargement de la partie...</p>
                </div>
            </div>
        );
    }

    if (!currentRoom || !difficultyConfig) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-2xl font-bold text-red-800 mb-2">Partie non trouvée</h2>
                    <p className="text-red-600 mb-4">La partie que vous cherchez n'existe pas ou n'est plus disponible.</p>
                    <button
                        onClick={() => navigate('/multiplayer')}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Retour au multijoueur
                    </button>
                </div>
            </div>
        );
    }

    if (!isGameActive) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">⏳</div>
                    <h2 className="text-2xl font-bold text-orange-800 mb-2">Partie en attente</h2>
                    <p className="text-orange-600 mb-4">La partie n'a pas encore commencé.</p>
                    <button
                        onClick={() => navigate(`/multiplayer/lobby/${roomCode}`)}
                        className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                        Retour au lobby
                    </button>
                </div>
            </div>
        );
    }

    // ==================== RENDU PRINCIPAL ====================

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <Header />

            <div className={`container mx-auto px-4 py-6 transition-all duration-300 ${
                state.showHistorySidebar ? 'pr-96' : ''
            }`}>
                {/* Header de la partie */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                                🎮 Partie Multijoueur
                                <span className="ml-2 text-lg text-blue-600">#{roomCode}</span>
                            </h1>
                            <p className="text-gray-600 mt-1">
                                {difficultyConfig.description} • Mastermind {(currentPlayer?.current_mastermind as number) || 1}
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={toggleHistorySidebar}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                            >
                                {state.showHistorySidebar ? '👁️‍🗨️ Masquer' : '📊 Historique'}
                            </button>
                            <button
                                onClick={handleLeaveGame}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                            >
                                🚪 Quitter
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Score et timer */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <h3 className="font-bold text-gray-800 mb-2">📊 Mon Score</h3>
                            <div className="text-3xl font-bold text-blue-600">
                                {state.currentScore} pts
                            </div>
                        </div>
                        <GameTimer
                            time={state.timer}
                            isRunning={state.isTimerRunning}
                        />
                    </div>

                    {/* Liste des joueurs */}
                    <div>
                        <PlayersList
                            players={players}
                            currentUserId={user?.id}
                            creatorId={currentRoom?.creator?.id}
                            showProgress={true}
                            compactMode={true}
                        />
                    </div>

                    {/* Chat */}
                    <div>
                        <SimpleChat
                            messages={chatMessages}
                            currentUser={user}
                            onSendMessage={handleSendChatMessage}
                        />
                    </div>
                </div>

                {/* Plateau de jeu */}
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                    <GameBoard
                        combination={state.currentCombination}
                        onPositionClick={handlePositionClick}
                        canSubmit={state.currentCombination.every(c => c !== -1) && !state.isSubmitting}
                        onRemoveColor={(position: number) => {
                            const newCombination = [...state.currentCombination];
                            newCombination[position] = -1;
                            setState(prev => ({
                                ...prev,
                                currentCombination: newCombination
                            }));
                        }}
                        onSubmitAttempt={handleSubmitAttempt}
                        selectedColor={state.selectedColor}
                    />
                </div>
            </div>

            {/* Sidebar d'historique fixe */}
            {state.showHistorySidebar && (
                <div className="fixed top-0 right-0 w-96 h-full z-40 history-fixed-fullscreen">
                    <MultiplayerAttemptHistory
                        attempts={state.attempts.map(a => ({
                            id: a.attempt.id,
                            combination: a.attempt.combination,
                            correct_positions: a.attempt.correct_positions || a.correct_positions,
                            correct_colors: a.attempt.correct_colors || a.correct_colors,
                            attempt_number: a.attempt.attempt_number,
                            attempt_score: a.attempt.attempt_score,
                            is_correct: a.attempt.is_correct || a.is_correct,
                            created_at: a.attempt.created_at,
                            time_taken: a.attempt.time_taken
                        }))}
                        maxAttempts={difficultyConfig.attempts}
                        combinationLength={difficultyConfig.length}
                        difficultyConfig={difficultyConfig}
                        className="h-full"
                    />
                </div>
            )}

            {/* Modals */}
            <ColorSelectionModal
                isOpen={state.showColorModal}
                onClose={() => setState(prev => ({ ...prev, showColorModal: false, colorModalPosition: undefined }))}
                onColorSelect={handleColorSelect}
                availableColors={difficultyConfig.colors}
                selectedColor={state.selectedColor}
                position={state.colorModalPosition}
            />

            {/* Modal de Victoire/Défaite */}
            {state.showVictoryDefeat && (
                <VictoryDefeatDisplay
                    isWinner={state.isWinner}
                    playerScore={state.currentScore}
                    playerAttempts={state.attempts.length}
                    maxAttempts={difficultyConfig.attempts}
                    solution={getSolution()} // Solution récupérée seulement en fin de partie
                    onNewGame={() => {
                        // Logique pour démarrer une nouvelle partie
                        setState(prev => ({
                            ...prev,
                            showVictoryDefeat: false,
                            currentCombination: new Array(difficultyConfig.length).fill(-1),
                            attempts: [],
                            currentScore: 0,
                            isWinner: false,
                            timer: 0
                        }));
                        navigate('/multiplayer');
                    }}
                    onBackToMenu={handleLeaveGame}
                />
            )}
        </div>
    );
};

export default MultiplayerGame;
