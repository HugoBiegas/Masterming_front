import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import { EliminationModal } from '@/components/game/EliminationModal';
import { EliminationNotification } from '@/components/game/EliminationNotification';
import { GameBoard } from '@/components/game/GameBoard';
import { ColorPicker } from '@/components/game/ColorPicker';
import { AttemptHistory } from '@/components/game/AttemptHistory';
import { useGame } from '@/hooks/useGame';
import { useElimination } from '@/hooks/useElimination';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { GameStatus } from '@/types/game';
import { DIFFICULTY_CONFIGS, COLOR_PALETTE } from '@/utils/constants';
import { gameService } from '@/services/game';

// Interface étendue pour Participant avec élimination
interface ExtendedParticipant {
    id: string;
    user_id: string;
    username: string;
    status: string;
    joined_at: string;
    score: number;
    attempts_count: number;
    is_eliminated?: boolean;
    hasShownElimination?: boolean;
}

export const GamePlay: React.FC = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { game, loading, error, makeAttempt, isGameFinished, isGameActive, refreshGame } = useGame(gameId);
    const { showError, showSuccess, showWarning } = useNotification();
    const elimination = useElimination();

    const [currentCombination, setCurrentCombination] = useState<number[]>([]);
    const [selectedColor, setSelectedColor] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isWinner, setIsWinner] = useState(false);
    const [currentScore, setCurrentScore] = useState(0);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [isStarting, setIsStarting] = useState(false);

    // Refs pour éviter les boucles infinies
    const hasShownWelcomeMessage = useRef(false);
    const hasShownGameFinishedMessage = useRef(false);
    const hasShownVictoryMessage = useRef(false);

    // Map pour tracker les éliminations affichées
    const shownEliminations = useRef(new Set<string>());

    // Fonction pour obtenir le joueur actuel
    const getCurrentPlayer = useCallback(() => {
        if (!game?.participants || !user?.id) return null;
        return game.participants.find(p => p.user_id === user.id);
    }, [game?.participants, user?.id]);

    // Initialiser la combinaison actuelle
    useEffect(() => {
        if (game && game.combination_length && currentCombination.length === 0) {
            const initialCombination = new Array(game.combination_length).fill(0);
            setCurrentCombination(initialCombination);

            // Message de bienvenue une seule fois
            if (game.status === GameStatus.ACTIVE && !hasShownWelcomeMessage.current) {
                hasShownWelcomeMessage.current = true;
                showSuccess(`🎯 Partie démarrée ! ${game.combination_length} positions, ${game.available_colors} couleurs`);
            }
        }
    }, [game?.id, game?.combination_length, game?.status, game?.available_colors]);

    // Reset du hook d'élimination lors du changement de partie
    useEffect(() => {
        elimination.reset();
        shownEliminations.current.clear();
    }, [game?.id]);

    // Surveiller les éliminations d'autres joueurs
    useEffect(() => {
        if (!game?.participants || !user?.id || !game.max_attempts) return;

        game.participants.forEach(participant => {
            if (participant.user_id !== user.id &&
                participant.status === 'eliminated' &&
                !shownEliminations.current.has(participant.user_id)) {

                shownEliminations.current.add(participant.user_id);

                elimination.handleOtherPlayerEliminated(
                    participant.username,
                    participant.attempts_count || 0,
                    game.max_attempts || 0
                );
            }
        });
    }, [game?.participants, user?.id, game?.max_attempts, elimination]);

    // Timer
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isTimerRunning && isGameActive) {
            interval = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTimerRunning, isGameActive]);

    // Alerte tentatives restantes
    const lastAlertAttempts = useRef<number | null>(null);
    useEffect(() => {
        if (game && game.max_attempts && isGameActive) {
            const currentPlayer = getCurrentPlayer();
            if (!currentPlayer || currentPlayer.status === 'eliminated') return;

            const remainingAttempts = game.max_attempts - (currentPlayer.attempts_count || game.attempts.length);

            if (lastAlertAttempts.current !== remainingAttempts) {
                lastAlertAttempts.current = remainingAttempts;

                if (remainingAttempts === 1) {
                    showError('🚨 DERNIÈRE TENTATIVE !');
                } else if (remainingAttempts === 2) {
                    showWarning('⚠️ Plus que 2 tentatives !');
                } else if (remainingAttempts === 3) {
                    showWarning('⚠️ Plus que 3 tentatives !');
                }
            }
        }
    }, [game?.attempts?.length, game?.max_attempts, isGameActive, getCurrentPlayer, showError, showWarning]);

    // Vérifier si le jeu est terminé
    useEffect(() => {
        if (isGameFinished && game && !hasShownGameFinishedMessage.current) {
            hasShownGameFinishedMessage.current = true;
            setIsTimerRunning(false);

            // Vérifier si le joueur a gagné
            const lastAttempt = game.attempts[game.attempts.length - 1];
            if (lastAttempt && lastAttempt.is_correct) {
                setIsWinner(true);
                setCurrentScore(lastAttempt.attempt_score);

                // Message de victoire une seule fois
                if (!hasShownVictoryMessage.current) {
                    hasShownVictoryMessage.current = true;
                    showSuccess(`🏆 VICTOIRE en ${game.attempts.length} tentatives !`);
                }
            } else {
                const currentPlayer = getCurrentPlayer();
                if (currentPlayer && currentPlayer.status === 'eliminated') {
                    // Joueur éliminé - ne pas afficher le modal de défaite classique
                    return;
                } else {
                    setIsWinner(false);
                    showError('💔 Défaite ! Tentez votre chance avec une nouvelle partie !');
                }
            }

            setTimeout(() => setShowResult(true), 1500);
        }
    }, [isGameFinished, game, getCurrentPlayer, showError, showSuccess]);

    // Démarrer automatiquement le timer si actif
    useEffect(() => {
        if (isGameActive && !isTimerRunning) {
            setIsTimerRunning(true);
        }
    }, [isGameActive, isTimerRunning]);

    const handleStartGame = useCallback(async () => {
        if (!game) return;

        try {
            setIsStarting(true);
            showSuccess('🚀 Démarrage de la partie...');

            await gameService.startGame(game.id);
            await refreshGame();

            showSuccess('🎯 Partie démarrée !');
            setIsTimerRunning(true);
        } catch (err) {
            console.error('Erreur lors du démarrage:', err);
            showError('Erreur lors du démarrage de la partie');
        } finally {
            setIsStarting(false);
        }
    }, [game, refreshGame, showError, showSuccess]);

    const handleLeaveGame = useCallback(async () => {
        if (!game) return;

        try {
            setIsLeaving(true);
            await gameService.leaveAllActiveGames();
            showSuccess('👋 Vous avez quitté la partie');
            navigate('/modes');
        } catch (err) {
            console.error('Erreur lors de la sortie:', err);
            showError('Erreur lors de la sortie de la partie');
        } finally {
            setIsLeaving(false);
        }
    }, [game, navigate, showError, showSuccess]);

    const handlePositionClick = useCallback((index: number) => {
        if (!isGameActive) {
            showError('⏸️ La partie n\'est plus active !');
            return;
        }

        if (selectedColor === null) {
            showWarning('🎨 Sélectionnez d\'abord une couleur !');
            return;
        }

        setCurrentCombination(prev => {
            const newCombination = [...prev];
            newCombination[index] = selectedColor;
            return newCombination;
        });
    }, [selectedColor, isGameActive, showError, showWarning]);

    const handleRemoveColor = useCallback((index: number) => {
        if (!isGameActive) {
            showError('⏸️ La partie n\'est plus active !');
            return;
        }

        setCurrentCombination(prev => {
            const newCombination = [...prev];
            newCombination[index] = 0;
            return newCombination;
        });
    }, [isGameActive, showError]);

    const handleColorSelect = useCallback((color: number) => {
        if (!isGameActive) {
            showError('⏸️ La partie n\'est plus active !');
            return;
        }

        if (color === 0 || color === selectedColor) {
            setSelectedColor(null);
        } else {
            setSelectedColor(color);
        }
    }, [selectedColor, isGameActive, showError]);

    const resetCombination = useCallback(() => {
        if (game) {
            setCurrentCombination(new Array(game.combination_length).fill(0));
            setSelectedColor(null);
        }
    }, [game?.combination_length]);

    // Vérifier si on peut faire une tentative
    const currentPlayer = getCurrentPlayer();
    const isPlayerEliminated = currentPlayer && currentPlayer.status === 'eliminated';
    const canSubmit = currentCombination.every(color => color > 0) &&
        isGameActive &&
        !isPlayerEliminated &&
        !elimination.showEliminationModal;

    const handleSubmit = useCallback(async () => {
        if (!canSubmit || !game) {
            if (!isGameActive) {
                showError('⏸️ La partie n\'est plus active !');
            } else if (isPlayerEliminated) {
                showError('💀 Vous avez été éliminé !');
            } else {
                showWarning('⚠️ Complétez toutes les positions !');
            }
            return;
        }

        try {
            const result = await makeAttempt({ combination: currentCombination });

            if (result) {
                if (result.is_winning) {
                    setIsWinner(true);
                    setCurrentScore(result.score);
                    setIsTimerRunning(false);
                    setTimeout(() => setShowResult(true), 1500);

                } else if (result.game_status === GameStatus.FINISHED) {
                    const currentPlayer = getCurrentPlayer();
                    if (currentPlayer && currentPlayer.status === 'eliminated') {
                        // Joueur éliminé lors de la fin de partie
                        elimination.handlePlayerEliminated(
                            result.attempt_number,
                            game.max_attempts || 0,
                            result.score
                        );
                    } else {
                        // Fin de partie normale (défaite sans élimination)
                        setIsWinner(false);
                        setIsTimerRunning(false);
                        setTimeout(() => setShowResult(true), 1500);
                    }
                } else {
                    // Vérifier l'élimination sur tentative normale
                    const currentPlayer = getCurrentPlayer();
                    if (currentPlayer && game.max_attempts) {
                        const remainingAttempts = game.max_attempts - result.attempt_number;

                        if (remainingAttempts === 0 && !result.is_winning) {
                            // Plus de tentatives = élimination
                            elimination.handlePlayerEliminated(
                                result.attempt_number,
                                game.max_attempts,
                                result.score
                            );
                        } else {
                            // Continuer le jeu
                            if (result.correct_positions === game.combination_length - 1) {
                                showWarning('🔥 Très proche ! Plus qu\'une position !');
                            }
                            resetCombination();
                        }
                    } else {
                        resetCombination();
                    }
                }
            }
        } catch (err) {
            console.error('Erreur lors de la tentative:', err);
            showError('💥 Erreur lors de la validation');
        }
    }, [canSubmit, game, isGameActive, isPlayerEliminated, currentCombination, makeAttempt, resetCombination, showError, showWarning, getCurrentPlayer, elimination]);

    const handleNewGame = useCallback(() => {
        navigate('/solo');
    }, [navigate]);

    const handleBackToMenu = useCallback(() => {
        navigate('/modes');
    }, [navigate]);

    const formatTime = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    // Gestion des états de chargement et d'erreur
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner />
                    <p className="mt-4 text-gray-600">Chargement de la partie...</p>
                </div>
            </div>
        );
    }

    if (error || !game) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center bg-white rounded-lg p-8 shadow-lg max-w-md mx-4">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-xl font-bold text-red-600 mb-2">Erreur</h2>
                    <p className="text-gray-600 mb-4">
                        {error || 'Partie non trouvée ou inaccessible'}
                    </p>
                    <button
                        onClick={() => navigate('/modes')}
                        className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Retour aux modes
                    </button>
                </div>
            </div>
        );
    }

    const difficultyConfig = DIFFICULTY_CONFIGS[game.difficulty] || DIFFICULTY_CONFIGS.medium;
    const maxAttempts = game.max_attempts || difficultyConfig.attempts;
    const remainingAttempts = maxAttempts - game.attempts.length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <Header />

            <div className="container mx-auto py-6 px-4">
                {/* En-tête avec bouton quitter */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6 relative">
                    <button
                        onClick={handleLeaveGame}
                        disabled={isLeaving}
                        className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50"
                        title="Quitter la partie"
                    >
                        {isLeaving ? (
                            <LoadingSpinner size="sm" />
                        ) : (
                            <span className="text-lg">✕</span>
                        )}
                    </button>

                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center pr-16">
                        <div className="text-center lg:text-left mb-4 lg:mb-0 flex-1">
                            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                🧩 Quantum Mastermind
                                {game?.status === 'waiting' && <span className="text-yellow-500 ml-2">⏳ En attente</span>}
                                {game?.status === 'active' && <span className="text-green-500 ml-2">🟢 Active</span>}
                                {game?.status === 'finished' && <span className="text-gray-500 ml-2">🏁 Terminée</span>}
                            </h1>
                            <p className="text-gray-600 mt-1">
                                {difficultyConfig.description}
                            </p>
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mt-2">
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    🎨 {difficultyConfig.colors} couleurs
                                </span>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    🎯 {difficultyConfig.length} positions
                                </span>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    🔥 Max {difficultyConfig.attempts} tentatives
                                </span>
                            </div>
                        </div>

                        {/* Timer repositionné */}
                        <div className="text-center">
                            <div className="text-2xl font-mono text-gray-800 bg-gray-100 px-3 py-2 rounded-lg border border-gray-300">
                                ⏱️ {formatTime(timer)}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                                <div className="font-medium">Tentative {game.attempts.length + 1} / {maxAttempts}</div>
                                <div className={`text-xs font-medium mt-1 ${
                                    remainingAttempts <= 3 ? 'text-red-600' :
                                        remainingAttempts <= 5 ? 'text-orange-600' : 'text-blue-600'
                                }`}>
                                    {remainingAttempts} tentative{remainingAttempts > 1 ? 's' : ''} restante{remainingAttempts > 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Barre de progression des tentatives */}
                    <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                    (game.attempts.length / maxAttempts) > 0.8 ? 'bg-red-500' :
                                        (game.attempts.length / maxAttempts) > 0.6 ? 'bg-orange-500' :
                                            'bg-blue-500'
                                }`}
                                style={{ width: `${(game.attempts.length / maxAttempts) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Bouton de démarrage si en attente */}
                {game.status === GameStatus.WAITING && (
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 text-center">
                        <h2 className="text-xl font-bold mb-4">🚀 Prêt à commencer ?</h2>
                        <p className="text-gray-600 mb-4">Cliquez sur le bouton ci-dessous pour démarrer la partie</p>
                        <button
                            onClick={handleStartGame}
                            disabled={isStarting}
                            className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-all font-medium flex items-center justify-center mx-auto"
                        >
                            {isStarting ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Démarrage...
                                </>
                            ) : (
                                '🚀 Démarrer la partie'
                            )}
                        </button>
                    </div>
                )}

                {/* Zone de jeu principale */}
                {game.status === GameStatus.ACTIVE && (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Zone de jeu principale */}
                        <div className="xl:col-span-2 space-y-6">
                            {/* Plateau de jeu */}
                            <GameBoard
                                combination={currentCombination}
                                onPositionClick={handlePositionClick}
                                onRemoveColor={handleRemoveColor}
                                onSubmitAttempt={handleSubmit}
                                selectedColor={selectedColor}
                                isActive={isGameActive}
                                canSubmit={canSubmit}
                            />

                            {/* Sélecteur de couleurs */}
                            <ColorPicker
                                availableColors={game.available_colors}
                                selectedColor={selectedColor}
                                onColorSelect={handleColorSelect}
                            />
                        </div>

                        {/* Historique */}
                        <div className="xl:col-span-1">
                            <AttemptHistory
                                attempts={game.attempts}
                                maxAttempts={maxAttempts}
                                combinationLength={game.combination_length}
                            />
                        </div>
                    </div>
                )}

                {/* Historique seul pour les parties terminées */}
                {game.status === GameStatus.FINISHED && (
                    <div className="max-w-lg mx-auto">
                        <AttemptHistory
                            attempts={game.attempts}
                            maxAttempts={maxAttempts}
                            combinationLength={game.combination_length}
                        />
                    </div>
                )}
            </div>

            {/* Modal de résultat classique */}
            <Modal
                isOpen={showResult && !elimination.showEliminationModal}
                onClose={() => {}}
                title=""
                showCloseButton={false}
            >
                <div className="text-center space-y-6">
                    {/* Emoji et titre animés */}
                    <div className="space-y-4">
                        <div className={`text-8xl ${isWinner ? 'animate-bounce' : ''}`}>
                            {isWinner ? '🏆' : '💭'}
                        </div>
                        <h2 className={`text-3xl font-bold ${isWinner ? 'text-green-600' : 'text-red-600'}`}>
                            {isWinner ? "🎉 VICTOIRE !" : "😔 Défaite"}
                        </h2>
                    </div>

                    <div className="space-y-2">
                        <p className="text-lg text-gray-800">
                            {isWinner
                                ? `Félicitations ! Vous avez cassé le code secret en ${game.attempts.length} tentatives !`
                                : "Le code reste un mystère... Mais chaque tentative vous rapproche de la solution !"
                            }
                        </p>

                        {/* Affichage de la solution en cas de défaite */}
                        {!isWinner && game.solution && (
                            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4 mt-4">
                                <div className="text-sm font-semibold text-red-700 mb-2">🔍 La solution était :</div>
                                <div className="flex justify-center space-x-2">
                                    {game.solution.map((color, index) => (
                                        <div
                                            key={index}
                                            className="w-8 h-8 rounded-full border-2 border-gray-600 shadow-sm relative"
                                            style={{
                                                backgroundColor: COLOR_PALETTE[color - 1] || '#gray',
                                                boxShadow: `0 2px 4px ${COLOR_PALETTE[color - 1] || '#gray'}40, inset 0 -1px 2px rgba(0,0,0,0.2)`
                                            }}
                                            title={`Position ${index + 1}: couleur ${color}`}
                                        >
                                            <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full opacity-50" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isWinner && (
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                                <div className="text-2xl font-bold text-green-600 mb-2">
                                    {currentScore} points
                                </div>
                                <div className="text-sm text-green-700">
                                    🎯 {game.attempts.length} tentatives • ⏱️ {formatTime(timer)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                        <button
                            onClick={handleNewGame}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium transform hover:scale-105"
                        >
                            🎮 Nouvelle partie
                        </button>
                        <button
                            onClick={handleBackToMenu}
                            className="flex-1 bg-gray-500 text-white py-4 px-6 rounded-lg hover:bg-gray-600 transition-all font-medium transform hover:scale-105"
                        >
                            🏠 Menu principal
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal d'élimination */}
            <EliminationModal
                isOpen={elimination.showEliminationModal}
                onClose={elimination.closeEliminationModal}
                attemptsMade={elimination.eliminationData.attemptsMade}
                maxAttempts={elimination.eliminationData.maxAttempts}
                score={elimination.eliminationData.score}
                difficulty={game?.difficulty?.charAt(0).toUpperCase() + game?.difficulty?.slice(1) || 'Medium'}
                gameMode={game?.game_mode === 'single' ? 'solo' : 'multiplayer'}
                gameFinished={isGameFinished}
                otherPlayersRemaining={game?.participants?.filter(p => p.status === 'active').length || 0}
                solution={game?.solution}
            />

            {/* Notification d'élimination pour autres joueurs */}
            <EliminationNotification
                playerName={elimination.eliminatedPlayerName}
                attempts={elimination.eliminationData.attemptsMade}
                maxAttempts={elimination.eliminationData.maxAttempts}
                show={elimination.showEliminationNotification}
                onClose={elimination.closeEliminationNotification}
            />
        </div>
    );
};