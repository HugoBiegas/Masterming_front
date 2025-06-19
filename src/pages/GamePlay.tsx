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
import { VictoryDefeatDisplay } from '@/components/game/VictoryDefeatDisplay';
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

    // NOUVEAU: État pour la solution révélée
    const [revealedSolution, setRevealedSolution] = useState<number[] | null>(null);

    // 🔒 NOUVEAU: États persistants pour le ColorPicker
    const [isColorPickerExpanded, setIsColorPickerExpanded] = useState(false);
    const [isColorPickerLocked, setIsColorPickerLocked] = useState(false);

    // Refs pour éviter les boucles infinies
    const hasShownWelcomeMessage = useRef(false);
    const hasShownGameFinishedMessage = useRef(false);
    const hasShownVictoryMessage = useRef(false);

    // 🔧 CORRIGÉ: Map pour tracker les éliminations affichées avec plus de sécurité
    const shownEliminations = useRef(new Set<string>());
    const eliminationProcessed = useRef(false);

    // Fonction pour obtenir le joueur actuel
    const getCurrentPlayer = useCallback(() => {
        if (!game?.participants || !user?.id) return null;
        return game.participants.find(p => p.user_id === user.id);
    }, [game?.participants, user?.id]);

    // 🔒 NOUVEAU: Fonctions pour gérer l'état du ColorPicker
    const handleToggleColorPickerExpanded = useCallback(() => {
        setIsColorPickerExpanded(prev => {
            // Si on ferme manuellement, déverrouiller aussi
            if (prev && isColorPickerLocked) {
                setIsColorPickerLocked(false);
            }
            return !prev;
        });
    }, [isColorPickerLocked]);

    const handleToggleColorPickerLocked = useCallback(() => {
        setIsColorPickerLocked(prev => {
            const newLocked = !prev;
            // Si on verrouille, ouvrir automatiquement
            if (newLocked && !isColorPickerExpanded) {
                setIsColorPickerExpanded(true);
            }
            console.log('🔒 ColorPicker lock toggled:', newLocked);
            return newLocked;
        });
    }, [isColorPickerExpanded]);

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
    }, [game?.id, game?.combination_length, game?.status, game?.available_colors, showSuccess]);

    // 🔧 CORRIGÉ: Reset du hook d'élimination lors du changement de partie
    useEffect(() => {
        elimination.reset();
        shownEliminations.current.clear();
        eliminationProcessed.current = false;
        console.log('🔄 Reset éliminations pour nouvelle partie:', game?.id);
    }, [game?.id, elimination]);

    // 🔧 CORRIGÉ: Surveiller les éliminations d'autres joueurs SANS boucle infinie
    useEffect(() => {
        // Éviter les appels multiples
        if (!game?.participants || !user?.id || !game.max_attempts || eliminationProcessed.current) {
            return;
        }

        let hasNewElimination = false;

        game.participants.forEach(participant => {
            // 🔧 CORRIGÉ: Vérifications de sécurité strictes
            if (!participant ||
                !participant.user_id ||
                !participant.username ||
                participant.user_id === user.id ||
                participant.status !== 'eliminated' ||
                shownEliminations.current.has(participant.user_id)) {
                return;
            }

            console.log('🔍 Nouvel joueur éliminé détecté:', {
                username: participant.username,
                user_id: participant.user_id,
                status: participant.status,
                attempts: participant.attempts_count
            });

            shownEliminations.current.add(participant.user_id);
            hasNewElimination = true;

            // 🔧 CORRIGÉ: Validation des données avant affichage + types corrects
            const playerName = participant.username || 'Joueur inconnu';
            const attempts = participant.attempts_count ?? 0;  // Utiliser ?? pour gérer undefined
            const maxAttempts = game.max_attempts ?? 10;       // Valeur par défaut si undefined

            elimination.handleOtherPlayerEliminated(
                playerName,
                attempts,
                maxAttempts
            );
        });

        // Marquer comme traité pour éviter les répétitions
        if (hasNewElimination) {
            eliminationProcessed.current = true;
        }

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

            // 🔧 CORRIGÉ: Gestion des valeurs undefined avec valeurs par défaut
            const playerAttempts = currentPlayer.attempts_count ?? 0;
            const gameAttempts = game.attempts?.length ?? 0;
            const maxAttempts = game.max_attempts ?? 10;

            const remainingAttempts = maxAttempts - Math.max(playerAttempts, gameAttempts);

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

    // 🔒 MODIFIÉ: handleColorSelect pour conserver la couleur entre les actualisations
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

        // 🔒 NOUVEAU: Log pour tracer la persistance
        console.log('🎨 Couleur sélectionnée:', color, 'Verrouillé:', isColorPickerLocked);
    }, [selectedColor, isGameActive, isColorPickerLocked, showError]);

    // 🔒 MODIFIÉ: resetCombination pour préserver la couleur sélectionnée si verrouillée
    const resetCombination = useCallback(() => {
        if (game) {
            setCurrentCombination(new Array(game.combination_length).fill(0));
            // 🔒 NOUVEAU: Ne réinitialiser selectedColor que si pas verrouillé
            if (!isColorPickerLocked) {
                setSelectedColor(null);
            }
            console.log('🔄 Combinaison réinitialisée, couleur préservée:', isColorPickerLocked);
        }
    }, [game?.combination_length, isColorPickerLocked]);

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
                // NOUVEAU: Vérifier si la solution est révélée
                if (result.solution && result.solution.length > 0) {
                    setRevealedSolution(result.solution);
                }

                if (result.is_winning) {
                    setIsWinner(true);
                    setCurrentScore(result.score ?? 0);  // 🔧 CORRIGÉ: Valeur par défaut
                    setIsTimerRunning(false);
                    setTimeout(() => setShowResult(true), 1500);

                } else if (result.game_status === GameStatus.FINISHED) {
                    const currentPlayer = getCurrentPlayer();
                    if (currentPlayer && currentPlayer.status === 'eliminated') {
                        // Joueur éliminé lors de la fin de partie
                        elimination.handlePlayerEliminated(
                            result.attempt_number ?? 1,  // 🔧 CORRIGÉ: Valeur par défaut
                            game.max_attempts ?? 10,     // 🔧 CORRIGÉ: Valeur par défaut
                            result.score ?? 0            // 🔧 CORRIGÉ: Valeur par défaut
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
                        // 🔧 CORRIGÉ: Gestion des valeurs undefined
                        const attemptNumber = result.attempt_number ?? 1;
                        const maxAttempts = game.max_attempts ?? 10;
                        const remainingAttempts = maxAttempts - attemptNumber;

                        if (remainingAttempts === 0 && !result.is_winning) {
                            // Plus de tentatives = élimination
                            elimination.handlePlayerEliminated(
                                attemptNumber,
                                maxAttempts,
                                result.score ?? 0
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
    // 🔧 CORRIGÉ: Utiliser attempts au lieu de maxAttempts
    const maxAttempts = game.max_attempts || difficultyConfig.attempts;
    const remainingAttempts = maxAttempts - game.attempts.length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 page-with-history">
            <Header />

            {/* Historique fixe sur toute la hauteur à droite */}
            <div className="history-fixed-fullscreen">
                <AttemptHistory
                    attempts={game.attempts}
                    maxAttempts={maxAttempts}
                    combinationLength={game.combination_length}
                    isQuantumMode={game.game_type === 'quantum'}
                    gameType={game.game_type}
                />
            </div>

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

                {/* Zone de jeu principale - masquée si solution révélée */}
                {game.status === GameStatus.ACTIVE && !revealedSolution && (
                    <div className="space-y-6">
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

                        {/* 🔒 MODIFIÉ: Sélecteur de couleurs avec état persistant */}
                        <ColorPicker
                            availableColors={game.available_colors}
                            selectedColor={selectedColor}
                            onColorSelect={handleColorSelect}
                            isExpanded={isColorPickerExpanded}
                            onToggleExpanded={handleToggleColorPickerExpanded}
                            isLocked={isColorPickerLocked}
                            onToggleLocked={handleToggleColorPickerLocked}
                        />
                    </div>
                )}

                {/* Zone pour les parties terminées */}
                {(game.status === GameStatus.FINISHED || showResult) && revealedSolution && (
                    <VictoryDefeatDisplay
                        isWinner={isWinner}
                        playerScore={currentScore}
                        playerAttempts={game.attempts.length}
                        maxAttempts={maxAttempts}
                        solution={revealedSolution}
                        onNewGame={handleNewGame}
                        onBackToMenu={handleBackToMenu}
                    />
                )}
            </div>

            {/* Modal d'élimination */}
            <EliminationModal
                isOpen={elimination.showEliminationModal}
                onClose={elimination.closeEliminationModal}
                attemptsMade={elimination.eliminationData.attemptsMade}
                maxAttempts={elimination.eliminationData.maxAttempts}
                score={elimination.eliminationData.score}
                difficulty={game?.difficulty?.charAt(0).toUpperCase() + game?.difficulty?.slice(1) || 'Medium'}
                // 🔧 CORRIGÉ: Utiliser les bonnes valeurs en minuscules
                gameMode={game?.game_mode === 'single' ? 'solo' : 'multiplayer'}
                gameFinished={isGameFinished}
                otherPlayersRemaining={game?.participants?.filter(p => p.status === 'active').length || 0}
                solution={revealedSolution || game?.solution}
            />

            {/* 🔧 CORRIGÉ: Notification d'élimination avec les bonnes props - SEULEMENT si pas de toast infini */}
            {elimination.showEliminationNotification && elimination.eliminatedPlayerName && (
                <EliminationNotification
                    playerName={elimination.eliminatedPlayerName}
                    attempts={elimination.eliminationData.attemptsMade}
                    maxAttempts={elimination.eliminationData.maxAttempts}
                    show={elimination.showEliminationNotification}
                    onClose={elimination.closeEliminationNotification}
                />
            )}
        </div>
    );
};