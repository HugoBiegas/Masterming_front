import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import { GameBoard } from '@/components/game/GameBoard';
import { ColorSelectionModal } from '@/components/game/ColorSelectionModal';
import { VictoryDefeatDisplay } from '@/components/game/VictoryDefeatDisplay';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { DIFFICULTY_CONFIGS } from '@/utils/constants';
import { PlayerProgress } from '@/types/multiplayer';

// ==================== COMPOSANTS MULTIJOUEUR SPÉCIALISÉS ====================

// Composant pour l'historique des tentatives multijoueur
interface MultiplayerAttemptHistoryProps {
    attempts: any[];
    currentPlayer: PlayerProgress | null;
    difficultyConfig: any;
}

const MultiplayerAttemptHistory: React.FC<MultiplayerAttemptHistoryProps> = ({
                                                                                 attempts,
                                                                                 currentPlayer,
                                                                                 difficultyConfig
                                                                             }) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                    🎯 Mes Tentatives
                </h3>
                <span className="text-sm text-gray-600">
                    {attempts.length} / {difficultyConfig.attempts}
                </span>
            </div>

            {attempts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🎲</div>
                    <p>Aucune tentative pour le moment</p>
                    <p className="text-sm">Faites votre première combinaison !</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {attempts.map((attempt, index) => (
                        <div
                            key={attempt.id || index}
                            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-gray-700">
                                    Tentative {attempt.attempt_number || index + 1}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {attempt.attempt_score || 0} pts
                                </span>
                            </div>

                            <div className="flex items-center space-x-2 mb-2">
                                {attempt.combination.map((colorIndex: number, pos: number) => (
                                    <div
                                        key={pos}
                                        className="w-6 h-6 rounded-full border-2 border-gray-300"
                                        style={{ backgroundColor: difficultyConfig.colorPalette[colorIndex] }}
                                    />
                                ))}
                            </div>

                            <div className="flex space-x-4 text-sm">
                                <span className="text-green-600">
                                    🟢 {attempt.correct_positions || attempt.exact_matches || 0}
                                </span>
                                <span className="text-orange-600">
                                    🟡 {attempt.correct_colors || attempt.position_matches || 0}
                                </span>
                                {attempt.time_taken && (
                                    <span className="text-gray-500">
                                        ⏱️ {Math.round(attempt.time_taken)}s
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Composant pour afficher les joueurs (CORRIGÉ - plus de débordement)
interface MultiplayerPlayersDisplayProps {
    players: PlayerProgress[];
    currentUserId: string | undefined;
    currentPlayer: PlayerProgress | null;
}

const MultiplayerPlayersDisplay: React.FC<MultiplayerPlayersDisplayProps> = ({
                                                                                 players,
                                                                                 currentUserId,
                                                                                 currentPlayer
                                                                             }) => {
    // Trier les joueurs par score décroissant
    const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return '🟢';
            case 'playing': return '🎮';
            case 'mastermind_complete': return '✅';
            case 'finished': return '🏁';
            case 'eliminated': return '❌';
            case 'disconnected': return '📶';
            case 'spectating': return '👁️';
            default: return '⏳';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Actif';
            case 'playing': return 'En jeu';
            case 'mastermind_complete': return 'Mastermind fini';
            case 'finished': return 'Terminé';
            case 'eliminated': return 'Éliminé';
            case 'disconnected': return 'Déconnecté';
            case 'spectating': return 'Spectateur';
            default: return 'En attente';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                    👥 Joueurs ({players.length})
                </h3>
                <span className="text-sm text-gray-600">
                    Classement en temps réel
                </span>
            </div>

            {players.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">👥</div>
                    <p>Aucun joueur connecté</p>
                </div>
            ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {sortedPlayers.map((player, index) => (
                        <div
                            key={player.user_id}
                            className={`p-3 rounded-lg border transition-all ${
                                player.user_id === currentUserId
                                    ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                                    : 'border-gray-200 bg-white hover:shadow-sm hover:border-gray-300'
                            }`}
                        >
                            {/* CORRECTION: Utilisation de flex-wrap et overflow-hidden pour éviter le débordement */}
                            <div className="flex items-center justify-between flex-wrap gap-2 overflow-hidden">
                                <div className="flex items-center space-x-3 min-w-0 flex-1">
                                    {/* Position et statut */}
                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center font-bold text-xs">
                                            {index + 1}
                                        </div>
                                        <span className="text-lg flex-shrink-0">
                                            {getStatusIcon(player.status)}
                                        </span>
                                    </div>

                                    {/* Informations du joueur avec overflow contrôlé */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center space-x-2 flex-wrap">
                                            {/* Nom avec truncate pour éviter le débordement */}
                                            <span className="font-semibold text-gray-800 truncate max-w-28">
                                                {player.username}
                                            </span>

                                            {/* Badges avec flex-wrap */}
                                            <div className="flex items-center space-x-1 flex-wrap">
                                                {player.is_creator && (
                                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium flex-shrink-0">
                                                        👑
                                                    </span>
                                                )}
                                                {player.user_id === currentUserId && (
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium flex-shrink-0">
                                                        Vous
                                                    </span>
                                                )}
                                                {player.is_winner && (
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium flex-shrink-0">
                                                        🏆 Gagnant
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Statut avec truncate */}
                                        <div className="text-xs text-gray-500 truncate">
                                            {getStatusLabel(player.status)}
                                        </div>
                                    </div>
                                </div>

                                {/* Statistiques */}
                                <div className="flex flex-col text-right text-sm flex-shrink-0">
                                    <div className="font-bold text-purple-600">
                                        {player.score || 0} pts
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        M{player.current_mastermind || 1}/{player.completed_masterminds || 0}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {player.attempts_count || 0} tent.
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Composant pour le chat multijoueur
interface MultiplayerChatProps {
    isVisible: boolean;
    onToggle: () => void;
    roomCode: string;
}

const MultiplayerChat: React.FC<MultiplayerChatProps> = ({
                                                             isVisible,
                                                             onToggle,
                                                             roomCode
                                                         }) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            // Ici vous intégreriez l'envoi via WebSocket
            console.log('Envoi message:', newMessage);
            setNewMessage('');
        }
    };

    if (!isVisible) {
        return (
            <button
                onClick={onToggle}
                className="fixed bottom-4 right-4 bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600 transition-colors z-50"
            >
                💬 Chat
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                <h3 className="font-semibold text-gray-800">💬 Chat - {roomCode}</h3>
                <button
                    onClick={onToggle}
                    className="text-gray-500 hover:text-gray-700 text-xl"
                >
                    ✕
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm">
                        Aucun message pour le moment...
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <div key={index} className="text-sm">
                            <span className="font-semibold">{message.username}:</span>
                            <span className="ml-2">{message.message}</span>
                        </div>
                    ))
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Tapez votre message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={500}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm"
                    >
                        📤
                    </button>
                </div>
            </form>
        </div>
    );
};

// ==================== COMPOSANT PRINCIPAL ====================

export const MultiplayerGame: React.FC = () => {
    const { roomCode } = useParams<{ roomCode: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showError, showSuccess, showWarning, showInfo } = useNotification();

    // Hook useMultiplayer
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

    // États locaux - MÊME LOGIQUE QUE LE SOLO
    const [currentCombination, setCurrentCombination] = useState<number[]>([]);
    const [selectedColor, setSelectedColor] = useState<number | null>(null);
    const [attempts, setAttempts] = useState<any[]>([]);
    const [showColorModal, setShowColorModal] = useState(false);
    const [colorModalPosition, setColorModalPosition] = useState<number | undefined>(undefined);
    const [showChat, setShowChat] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [currentScore, setCurrentScore] = useState(0);
    const [isWinner, setIsWinner] = useState(false);
    const [showVictoryDefeat, setShowVictoryDefeat] = useState(false);

    // Configuration basée sur la difficulté - MÊME LOGIQUE QUE LE SOLO
    const difficultyConfig = currentRoom ? {
        ...DIFFICULTY_CONFIGS[currentRoom.difficulty as keyof typeof DIFFICULTY_CONFIGS],
        colorPalette: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A', '#808080', '#000000']
    } : null;

    // Réfs pour les timers
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // ==================== EFFETS ====================

    // Timer de jeu
    useEffect(() => {
        if (isTimerRunning && isGameActive && !isGameFinished) {
            timerRef.current = setInterval(() => {
                setTimer(prev => prev + 1);
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
                timerRef.current = null;
            }
        };
    }, [isTimerRunning, isGameActive, isGameFinished]);

    // Démarrer le timer quand le jeu devient actif
    useEffect(() => {
        if (isGameActive && !isGameFinished) {
            setIsTimerRunning(true);
        } else {
            setIsTimerRunning(false);
        }
    }, [isGameActive, isGameFinished]);

    // Mise à jour du score et statut depuis currentPlayer
    useEffect(() => {
        if (currentPlayer) {
            setCurrentScore(currentPlayer.score || 0);
            setIsWinner(currentPlayer.is_winner || false);

            if (currentPlayer.status === 'finished' || currentPlayer.is_winner) {
                setShowVictoryDefeat(true);
                setIsTimerRunning(false);
            }
        }
    }, [currentPlayer]);

    // Initialiser la combinaison quand la config est prête
    useEffect(() => {
        if (difficultyConfig && currentCombination.length === 0) {
            setCurrentCombination(new Array(difficultyConfig.length).fill(-1));
        }
    }, [difficultyConfig, currentCombination.length]);

    // ==================== GESTIONNAIRES D'ÉVÉNEMENTS ====================

    const handlePositionClick = useCallback((position: number) => {
        setColorModalPosition(position);
        setShowColorModal(true);
    }, []);

    const handleColorSelect = useCallback((colorIndex: number) => {
        if (colorModalPosition !== undefined) {
            const newCombination = [...currentCombination];
            newCombination[colorModalPosition] = colorIndex;
            setCurrentCombination(newCombination);
            setSelectedColor(colorIndex);
        }
        setShowColorModal(false);
        setColorModalPosition(undefined);
    }, [currentCombination, colorModalPosition]);

    const handleSubmitAttempt = useCallback(async () => {
        if (!difficultyConfig || isSubmitting || !currentCombination.every(c => c !== -1)) {
            return;
        }

        try {
            setIsSubmitting(true);
            showInfo('⏳ Envoi de la tentative...');

            const result = await makeAttempt(currentCombination);

            if (result) {
                setAttempts(prev => [...prev, result]);
                showSuccess('✅ Tentative envoyée !');

                // Réinitialiser la combinaison pour la prochaine tentative
                setCurrentCombination(new Array(difficultyConfig.length).fill(-1));

                // Vérifier si c'est une victoire
                if (result.is_correct || result.mastermind_completed) {
                    setIsWinner(true);
                    setShowVictoryDefeat(true);
                    setIsTimerRunning(false);
                    showSuccess('🎉 Mastermind résolu ! Bravo !');
                }
            }
        } catch (error: any) {
            console.error('Erreur tentative:', error);
            showError('❌ ' + (error.message || 'Erreur lors de l\'envoi de la tentative'));
        } finally {
            setIsSubmitting(false);
        }
    }, [difficultyConfig, isSubmitting, currentCombination, makeAttempt, showInfo, showSuccess, showError]);

    const handleLeaveGame = useCallback(async () => {
        try {
            setIsLeaving(true);
            await leaveRoom();
            showSuccess('👋 Vous avez quitté la partie');
            navigate('/multiplayer/browse');
        } catch (error: any) {
            console.error('Erreur quitter:', error);
            showError('❌ ' + (error.message || 'Impossible de quitter la partie'));
        } finally {
            setIsLeaving(false);
            setShowLeaveModal(false);
        }
    }, [leaveRoom, navigate, showSuccess, showError]);

    // Gestionnaires pour VictoryDefeatDisplay
    const handleNewGame = useCallback(() => {
        navigate('/multiplayer/create');
    }, [navigate]);

    const handleBackToMenu = useCallback(() => {
        navigate('/modes');
    }, [navigate]);

    // Formatage du temps
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // ==================== RENDU CONDITIONNEL ====================

    // Loading
    if (loading || !currentRoom || !difficultyConfig) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 loading-container">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <LoadingSpinner size="lg" />
                        <p className="mt-4 text-gray-600">
                            Chargement de la partie multijoueur...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Erreur
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="text-red-500 text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur</h2>
                        <p className="text-gray-600 mb-4">{error || 'Impossible de charger la partie'}</p>
                        <button
                            onClick={() => navigate('/multiplayer/browse')}
                            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                        >
                            Retour aux parties
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Jeu non actif
    if (!isGameActive && !isGameFinished) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="text-6xl mb-4">⏳</div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">Partie en attente</h2>
                        <p className="text-gray-600 mb-4">La partie n'a pas encore commencé.</p>
                        <button
                            onClick={() => navigate(`/multiplayer/rooms/${roomCode}/lobby`)}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            🏠 Retour au salon
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ==================== RENDU PRINCIPAL - STYLE IDENTIQUE AU SOLO ====================

    return (
        <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex overflow-hidden">

            {/* Zone de jeu principale - PARTIE GAUCHE (identique au solo) */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Header intégré - MÊME STYLE QUE LE SOLO */}
                <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        {/* Logo/Titre */}
                        <div className="flex items-center space-x-4">
                            <h1 className="text-xl font-bold text-blue-600">Quantum Mastermind</h1>
                            <div className="text-sm text-gray-600">
                                Multijoueur - {user?.username} - Room {roomCode}
                            </div>
                        </div>

                        {/* Actions du header */}
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowChat(!showChat)}
                                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                                    showChat
                                        ? 'bg-green-600 text-white'
                                        : 'bg-green-500 text-white hover:bg-green-600'
                                }`}
                            >
                                💬 Chat {showChat ? '🔼' : '🔽'}
                            </button>

                            <button
                                onClick={() => setShowLeaveModal(true)}
                                disabled={isLeaving}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 text-sm"
                            >
                                {isLeaving ? '⏳ Sortie...' : '🚪 Quitter'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Contenu de jeu scrollable - MÊME STYLE QUE LE SOLO */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-3xl mx-auto space-y-6">

                        {/* En-tête de la partie - MÊME STYLE QUE LE SOLO */}
                        <div className="bg-white rounded-lg shadow-lg p-6 game-card">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800">
                                        🎯 Partie Multijoueur - {roomCode}
                                    </h1>
                                    <p className="text-gray-600">
                                        Difficulté: {currentRoom.difficulty} • {difficultyConfig.colors} couleurs • {difficultyConfig.length} positions
                                    </p>
                                </div>

                                <div className="flex items-center space-x-6">
                                    {/* Timer */}
                                    <div className="text-center">
                                        <div className="text-2xl font-mono font-bold text-blue-600">
                                            {formatTime(timer)}
                                        </div>
                                        <div className="text-xs text-gray-500">Temps</div>
                                    </div>

                                    {/* Score */}
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-purple-600">
                                            {currentScore}
                                        </div>
                                        <div className="text-xs text-gray-500">Score</div>
                                    </div>

                                    {/* Tentatives */}
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-600">
                                            {attempts.length} / {difficultyConfig.attempts}
                                        </div>
                                        <div className="text-xs text-gray-500">Tentatives</div>
                                    </div>

                                    {/* Position dans le jeu */}
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            #{players.findIndex(p => p.user_id === user?.id) + 1}
                                        </div>
                                        <div className="text-xs text-gray-500">Position</div>
                                    </div>
                                </div>
                            </div>

                            {/* Status et actions */}
                            <div className="flex items-center justify-between">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                    isGameActive
                                        ? 'bg-green-100 text-green-800'
                                        : isGameFinished
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {isGameActive ? '🟢 En cours' : isGameFinished ? '🏁 Terminé' : '⏳ En attente'}
                                </span>

                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600">
                                        {players.length} joueur{players.length > 1 ? 's' : ''} connecté{players.length > 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Plateau de jeu - IDENTIQUE AU SOLO */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    🎲 Votre combinaison
                                </h2>
                                <button
                                    onClick={handleSubmitAttempt}
                                    disabled={
                                        isSubmitting ||
                                        !currentCombination.every(c => c !== -1) ||
                                        !isGameActive ||
                                        isGameFinished
                                    }
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <LoadingSpinner size="sm" />
                                            <span>Envoi...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>🎯</span>
                                            <span>Valider</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <GameBoard
                                combination={currentCombination}
                                onPositionClick={handlePositionClick}
                                difficultyConfig={difficultyConfig}
                                isGameActive={isGameActive && !isGameFinished}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Panneau latéral droit - HISTORIQUE + JOUEURS */}
            <div className="w-96 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-800">
                        📊 Informations de partie
                    </h2>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-6">
                    {/* Affichage des joueurs multijoueur */}
                    <MultiplayerPlayersDisplay
                        players={players}
                        currentUserId={user?.id}
                        currentPlayer={currentPlayer}
                    />

                    {/* Historique des tentatives multijoueur */}
                    <MultiplayerAttemptHistory
                        attempts={attempts}
                        currentPlayer={currentPlayer}
                        difficultyConfig={difficultyConfig}
                    />
                </div>
            </div>

            {/* Chat multijoueur */}
            <MultiplayerChat
                isVisible={showChat}
                onToggle={() => setShowChat(!showChat)}
                roomCode={roomCode || ''}
            />

            {/* Modals */}
            {showColorModal && difficultyConfig && (
                <ColorSelectionModal
                    isOpen={showColorModal}
                    onClose={() => setShowColorModal(false)}
                    onColorSelect={handleColorSelect}
                    availableColors={difficultyConfig.colors}
                    colorPalette={difficultyConfig.colorPalette}
                />
            )}

            {showLeaveModal && (
                <Modal
                    isOpen={showLeaveModal}
                    onClose={() => setShowLeaveModal(false)}
                    title="Quitter la partie"
                >
                    <div className="text-center">
                        <div className="text-6xl mb-4">🚪</div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            Êtes-vous sûr de vouloir quitter ?
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Vous perdrez votre progression dans cette partie multijoueur.
                        </p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={() => setShowLeaveModal(false)}
                                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleLeaveGame}
                                disabled={isLeaving}
                                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
                            >
                                {isLeaving ? 'Sortie...' : 'Quitter'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {showVictoryDefeat && (
                <VictoryDefeatDisplay
                    isOpen={showVictoryDefeat}
                    onClose={() => setShowVictoryDefeat(false)}
                    isWinner={isWinner}
                    attempts={attempts.length}
                    timeElapsed={timer}
                    score={currentScore}
                    onNewGame={handleNewGame}
                    onBackToMenu={handleBackToMenu}
                />
            )}
        </div>
    );
};