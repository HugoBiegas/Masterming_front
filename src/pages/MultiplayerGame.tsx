import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import { GameBoard } from '@/components/game/GameBoard';
import { AttemptHistory } from '@/components/game/AttemptHistory';
import { ColorSelectionModal } from '@/components/game/ColorSelectionModal';
import { ChatBox } from '@/components/multiplayer/ChatBox';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { DIFFICULTY_CONFIGS } from '@/utils/constants';
import { Difficulty } from '@/types/multiplayer';
import { AttemptRequest } from '@/types/game';

// Interface pour les tentatives compatibles avec votre système
interface MultiplayerAttempt {
    id: string;
    combination: number[];
    correct_positions: number; // Bonne couleur, bonne position
    correct_colors: number;    // Bonne couleur, mauvaise position
    is_correct: boolean;       // Solution trouvée
    attempt_number: number;
    attempt_score: number;
    time_taken?: number;
    quantum_data?: any;
    used_quantum_hint?: boolean;
    created_at: string;
}

// Interface pour les messages de chat
interface ChatMessage {
    id: string;
    user_id: string;
    username: string;
    message: string;
    timestamp: string;
    type: 'user' | 'system' | 'game';
}

export const MultiplayerGame: React.FC = () => {
    const { roomCode } = useParams<{ roomCode: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showError, showSuccess, showWarning } = useNotification();

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
    const [attempts, setAttempts] = useState<MultiplayerAttempt[]>([]);
    const [showColorModal, setShowColorModal] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    // Configuration basée sur la difficulté - MÊME LOGIQUE QUE LE SOLO
    const difficultyConfig = currentRoom ?
        DIFFICULTY_CONFIGS[currentRoom.difficulty as keyof typeof DIFFICULTY_CONFIGS] || DIFFICULTY_CONFIGS.medium :
        DIFFICULTY_CONFIGS.medium;

    // Timer - MÊME LOGIQUE QUE LE SOLO
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning && isGameActive && !isGameFinished) {
            interval = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, isGameActive, isGameFinished]);

    // Démarrer le timer quand la partie devient active
    useEffect(() => {
        if (isGameActive && !isTimerRunning) {
            setIsTimerRunning(true);
        }
    }, [isGameActive, isTimerRunning]);

    // Initialiser la combinaison - MÊME LOGIQUE QUE LE SOLO
    useEffect(() => {
        if (currentRoom && currentCombination.length === 0) {
            setCurrentCombination(new Array(difficultyConfig.length).fill(0));
        }
    }, [currentRoom, difficultyConfig.length, currentCombination.length]);

    // Formatage du temps - MÊME FONCTION QUE LE SOLO
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

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

    // Gestionnaire de clic sur une position - MÊME LOGIQUE QUE LE SOLO
    const handlePositionClick = useCallback((position: number) => {
        if (!canPlay || !selectedColor) return;

        setCurrentCombination(prev => {
            const newCombination = [...prev];
            newCombination[position] = selectedColor;
            return newCombination;
        });
    }, [canPlay, selectedColor]);

    // Gestionnaire pour supprimer une couleur - MÊME LOGIQUE QUE LE SOLO
    const handleRemoveColor = useCallback((position: number) => {
        if (!canPlay) return;

        setCurrentCombination(prev => {
            const newCombination = [...prev];
            newCombination[position] = 0;
            return newCombination;
        });
    }, [canPlay]);

    // Gestionnaire de soumission - LOGIQUE CORRIGÉE POUR UTILISER LES BONNES PROPRIÉTÉS
    const handleSubmitAttempt = useCallback(async () => {
        if (!canSubmit || !currentRoom || !user) return;

        setIsSubmitting(true);
        try {
            const attemptRequest: AttemptRequest = {
                combination: currentCombination
            };

            const result = await makeAttempt(attemptRequest);

            if (result) {
                // CORRECTION: Utiliser les bonnes propriétés selon votre schéma
                const newAttempt: MultiplayerAttempt = {
                    id: result.id || `attempt_${Date.now()}`,
                    combination: result.combination || currentCombination,
                    correct_positions: result.correct_positions || 0,  // Bonne couleur, bonne position
                    correct_colors: result.correct_colors || 0,        // Bonne couleur, mauvaise position
                    is_correct: result.is_correct || result.is_winning || false,
                    attempt_number: attempts.length + 1,
                    attempt_score: result.score || 0,
                    time_taken: timer * 1000, // en ms
                    quantum_data: result.quantum_probabilities,
                    used_quantum_hint: result.quantum_hint_used || false,
                    created_at: new Date().toISOString()
                };

                // Gestion des messages de feedback
                if (newAttempt.is_correct) {
                    showSuccess(`🎯 Félicitations ! Vous avez trouvé la solution !`);
                } else {
                    const message = `✅ Tentative ${newAttempt.attempt_number}: ${newAttempt.correct_positions} bien placées, ${newAttempt.correct_colors} mal placées`;
                    showSuccess(message);
                }

                // Ajouter à l'historique
                setAttempts(prev => [...prev, newAttempt]);

                // Réinitialiser la combinaison
                setCurrentCombination(new Array(difficultyConfig.length).fill(0));
                setSelectedColor(null);
            }

        } catch (error: any) {
            console.error('Erreur soumission tentative:', error);
            showError(error.message || 'Erreur lors de la soumission');
        } finally {
            setIsSubmitting(false);
        }
    }, [canSubmit, currentRoom, user, currentCombination, makeAttempt, attempts.length, timer, difficultyConfig.length, showSuccess, showError]);

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
            type: 'user'
        };

        setChatMessages(prev => [...prev, newMessage]);
        // TODO: Envoyer via WebSocket
    }, [user]);

    // États de chargement
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 loading-container">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <LoadingSpinner size="lg" />
                        <p className="mt-4 text-gray-600">Chargement de la partie...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !currentRoom) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 loading-container">
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

    if (!isGameActive && !isGameFinished) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 loading-container">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="text-6xl mb-4">⏳</div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">Partie en attente</h2>
                        <p className="text-gray-600 mb-4">La partie n'a pas encore commencé.</p>
                        <button
                            onClick={() => navigate(`/multiplayer/lobby/${roomCode}`)}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            🏠 Retour au salon
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex overflow-hidden">

            {/* MÊME LAYOUT QUE LE SOLO: Zone de jeu à gauche, historique à droite */}

            {/* Zone de jeu principale - PARTIE GAUCHE */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Header intégré - MÊME STYLE QUE LE SOLO */}
                <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        {/* Logo/Titre */}
                        <div className="flex items-center space-x-4">
                            <h1 className="text-xl font-bold text-blue-600">Quantum Mastermind</h1>
                            <div className="text-sm text-gray-600">
                                Multijoueur - {user?.username}
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
                                {isLeaving ? 'Sortie...' : '🚪 Quitter'}
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
                                        🎯 Partie Multijoueur - {currentRoom.room_code || roomCode}
                                    </h1>
                                    <p className="text-gray-600">
                                        Difficulté: {currentRoom.difficulty || 'medium'} • {difficultyConfig.colors} couleurs • {difficultyConfig.length} positions
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
                                            {currentPlayer?.score || 0}
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
                                </div>
                            </div>

                            {/* Status et actions */}
                            <div className="flex items-center justify-between">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                    isGameActive ? 'bg-green-100 text-green-800' :
                                        isGameFinished ? 'bg-blue-100 text-blue-800' :
                                            'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {isGameActive ? '🟢 En cours' :
                                        isGameFinished ? '🏁 Terminée' :
                                            '⏳ En attente'}
                                </span>

                                <div className="text-sm text-gray-600">
                                    Joueurs: {players.length}/{currentRoom.max_players} •
                                    Mastermind {currentPlayer?.current_mastermind || 1}/{currentRoom.total_masterminds || 3}
                                </div>
                            </div>
                        </div>

                        {/* Plateau de jeu - MÊME STYLE QUE LE SOLO */}
                        <div className="bg-white rounded-lg shadow-lg p-6 game-card">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    🎮 Plateau de Jeu
                                </h2>
                                <div className="flex items-center space-x-4">
                                    {selectedColor && (
                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                            <span>Couleur sélectionnée:</span>
                                            <div
                                                className="w-6 h-6 rounded-full border-2 border-gray-300"
                                                style={{ backgroundColor: `hsl(${(selectedColor - 1) * 45}, 70%, 60%)` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <GameBoard
                                combination={currentCombination}
                                onPositionClick={handlePositionClick}
                                onRemoveColor={handleRemoveColor}
                                onSubmitAttempt={handleSubmitAttempt}
                                selectedColor={selectedColor}
                                isActive={canPlay}
                                canSubmit={canSubmit}
                            />

                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={() => setShowColorModal(true)}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    🎨 Choisir une couleur
                                </button>
                            </div>
                        </div>

                        {/* Chat intégré si activé */}
                        {showChat && (
                            <div className="bg-white rounded-lg shadow-lg p-6 game-card">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">💬 Chat de la partie</h3>
                                <div className="h-48">
                                    <ChatBox
                                        messages={chatMessages}
                                        onSendMessage={handleSendMessage}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* HISTORIQUE FIXE À DROITE - MÊME STYLE QUE LE SOLO */}
            <div className="history-fixed-fullscreen">
                <div className="bg-white h-full border-l border-gray-200 flex flex-col">
                    {/* Header de l'historique */}
                    <div className="border-b border-gray-200 p-4 bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-800">
                            📊 Historique des tentatives
                        </h3>
                        <div className="text-sm text-gray-600 mt-1">
                            {attempts.length} / {difficultyConfig.attempts} tentatives
                        </div>
                    </div>

                    {/* Historique scrollable - UTILISE LE COMPOSANT EXISTANT */}
                    <div className="flex-1 overflow-hidden">
                        <AttemptHistory
                            attempts={attempts.map(a => ({
                                ...a,
                                user_id: a.id ?? '', // à adapter selon la source réelle
                                exact_matches: a.correct_positions,
                                position_matches: a.correct_colors
                            }))}
                            maxAttempts={difficultyConfig.attempts}
                            combinationLength={difficultyConfig.length}
                        />
                    </div>
                </div>
            </div>

            {/* Modal de sélection des couleurs */}
            <ColorSelectionModal
                isOpen={showColorModal}
                onClose={() => setShowColorModal(false)}
                selectedColor={selectedColor}
                availableColors={difficultyConfig.colors}
                onColorSelect={handleColorSelect}
            />

            {/* Modal de confirmation pour quitter */}
            <Modal
                isOpen={showLeaveModal}
                onClose={() => setShowLeaveModal(false)}
                title="Quitter la partie"
            >
                <div className="text-center">
                    <div className="text-6xl mb-4">🚪</div>
                    <p className="text-gray-600 mb-6">
                        Êtes-vous sûr de vouloir quitter cette partie multijoueur ?
                        <br />
                        <span className="text-sm text-red-600">Votre progression sera perdue.</span>
                    </p>
                    <div className="flex space-x-3 justify-center">
                        <button
                            onClick={() => setShowLeaveModal(false)}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleLeaveGame}
                            disabled={isLeaving}
                            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                        >
                            {isLeaving ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Sortie...
                                </>
                            ) : (
                                '🚪 Quitter définitivement'
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};