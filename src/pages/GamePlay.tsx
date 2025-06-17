import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import { GameBoard } from '@/components/game/GameBoard';
import { ColorPicker } from '@/components/game/ColorPicker';
import { AttemptHistory } from '@/components/game/AttemptHistory';
import { StartGameButton } from '@/components/game/StartGameButton';
import { useGame } from '@/hooks/useGame';
import { useNotification } from '@/contexts/NotificationContext';
import { GameStatus } from '@/types/game';
import { DIFFICULTY_CONFIGS } from '@/utils/constants';
import { gameService } from '@/services/game';

export const GamePlay: React.FC = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();
    const { game, loading, error, makeAttempt, isGameFinished, isGameActive, refreshGame } = useGame(gameId);
    const { showError, showSuccess, showWarning } = useNotification();

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
            const remainingAttempts = game.max_attempts - game.attempts.length;

            if (lastAlertAttempts.current !== remainingAttempts) {
                lastAlertAttempts.current = remainingAttempts;

                if (remainingAttempts === 1) {
                    showError('🚨 DERNIÈRE TENTATIVE !');
                } else if (remainingAttempts === 3) {
                    showWarning('⚠️ Plus que 3 tentatives !');
                }
            }
        }
    }, [game?.attempts?.length, game?.max_attempts, isGameActive]);

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
                setIsWinner(false);
                showError('💔 Défaite ! Tentez votre chance avec une nouvelle partie !');
            }

            // Afficher le modal après un court délai
            setTimeout(() => setShowResult(true), 1500);
        }
    }, [isGameFinished, game?.id]);

    // Fonction pour quitter la partie
    const handleLeaveGame = useCallback(async () => {
        if (isLeaving) return;

        try {
            setIsLeaving(true);
            showWarning('🚪 Vous quittez la partie...');

            await gameService.leaveAllActiveGames();
            navigate('/modes');
            showSuccess('✅ Vous avez quitté la partie');

        } catch (error) {
            console.error('Erreur lors de la sortie de la partie:', error);
            showError('❌ Erreur lors de la sortie de la partie');
        } finally {
            setIsLeaving(false);
        }
    }, [isLeaving, navigate, showWarning, showSuccess, showError]);

    // Fonction pour démarrer la partie
    const handleStartGame = useCallback(async () => {
        if (!game || isStarting) return;

        try {
            setIsStarting(true);
            showWarning('🚀 Démarrage de la partie...');

            await gameService.startGame(game.id);
            await refreshGame();

            showSuccess('✅ Partie démarrée !');
            setIsTimerRunning(true);

        } catch (error) {
            console.error('Erreur lors du démarrage:', error);
            showError('❌ Erreur lors du démarrage de la partie');
        } finally {
            setIsStarting(false);
        }
    }, [game, isStarting, showWarning, showSuccess, showError, refreshGame]);

    // Logique pour la sélection de position
    const handlePositionClick = useCallback((position: number) => {
        if (!isGameActive) {
            showError('⏸️ La partie n\'est plus active !');
            return;
        }

        const newCombination = [...currentCombination];

        if (selectedColor && selectedColor > 0) {
            // Placer la couleur à la position cliquée
            newCombination[position] = selectedColor;
            setCurrentCombination(newCombination);
        } else {
            // Si aucune couleur sélectionnée, suggérer de sélectionner une couleur
            showWarning('🎨 Sélectionnez d\'abord une couleur !');
        }
    }, [currentCombination, selectedColor, isGameActive, showError, showWarning]);

    // Fonction pour supprimer une couleur d'une position
    const handleRemoveColor = useCallback((position: number) => {
        if (!isGameActive) return;

        const newCombination = [...currentCombination];
        newCombination[position] = 0;
        setCurrentCombination(newCombination);
    }, [currentCombination, isGameActive]);

    // Logique pour la sélection de couleur
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

    // Vérifier que TOUTES les positions sont remplies
    const canSubmit = currentCombination.every(color => color > 0) && isGameActive;

    const handleSubmit = useCallback(async () => {
        if (!canSubmit || !game) {
            if (!isGameActive) {
                showError('⏸️ La partie n\'est plus active !');
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
                    // Le message de victoire sera géré par useEffect
                    setTimeout(() => setShowResult(true), 1500);
                } else if (result.game_status === GameStatus.FINISHED) {
                    setIsWinner(false);
                    setIsTimerRunning(false);
                    setTimeout(() => setShowResult(true), 1500);
                } else {
                    if (result.correct_positions === game.combination_length - 1) {
                        showWarning('🔥 Très proche ! Plus qu\'une position !');
                    }
                    resetCombination();
                }
            }
        } catch (err) {
            console.error('Erreur lors de la tentative:', err);
            showError('💥 Erreur lors de la validation');
        }
    }, [canSubmit, game, isGameActive, currentCombination, makeAttempt, resetCombination, showError, showWarning]);

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
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600 text-lg">Chargement de la partie...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <Header />
                <div className="container mx-auto py-8">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md mx-auto text-center">
                        <span className="text-2xl mb-2 block">❌</span>
                        <p className="font-medium">{error}</p>
                        <button
                            onClick={() => navigate('/modes')}
                            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                        >
                            Retour au menu
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!game) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <Header />
                <div className="container mx-auto py-8">
                    <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
                        <span className="text-6xl mb-4 block">🔍</span>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Partie non trouvée</h2>
                        <p className="text-gray-600 mb-6">Cette partie n'existe pas ou a été supprimée.</p>
                        <button
                            onClick={() => navigate('/modes')}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Retour au menu
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const difficultyConfig = game?.difficulty && DIFFICULTY_CONFIGS[game.difficulty]
        ? DIFFICULTY_CONFIGS[game.difficulty]
        : DIFFICULTY_CONFIGS['medium'];

    // CORRECTION : Utiliser la configuration de difficulté pour les tentatives
    const maxAttempts = difficultyConfig.attempts;
    const remainingAttempts = maxAttempts - game.attempts.length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <Header />

            {/* Bouton Start flottant en haut (visible uniquement si en attente) */}
            {game?.status === 'waiting' && (
                <StartGameButton
                    onStartGame={handleStartGame}
                    disabled={isStarting}
                />
            )}

            <div className="container mx-auto py-6 px-4">
                {/* Header de la partie */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200 relative">
                    {/* Bouton Quitter repositionné en haut à droite de la carte */}
                    <button
                        onClick={handleLeaveGame}
                        disabled={isLeaving}
                        className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white w-10 h-10 rounded-full transition-colors font-medium flex items-center justify-center"
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
                                        remainingAttempts <= 5 ? 'text-orange-600' : 'text-green-600'
                                }`}>
                                    {remainingAttempts} restantes
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Progression</span>
                            <span>{game.attempts.length} / {maxAttempts}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                    (game.attempts.length / maxAttempts) > 0.8 ? 'bg-red-500' :
                                        (game.attempts.length / maxAttempts) > 0.6 ? 'bg-orange-500' :
                                            'bg-blue-500'
                                }`}
                                style={{ width: `${(game.attempts.length / maxAttempts) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

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
                        />
                    </div>
                </div>
            </div>

            {/* Modal de résultat REMISE */}
            <Modal
                isOpen={showResult}
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

                        {isWinner && (
                            <p className="text-green-600 font-medium">
                                🌟 Excellent travail de déduction !
                            </p>
                        )}
                    </div>

                    {/* Statistiques de la partie */}
                    <div className="bg-gray-50 p-6 rounded-xl">
                        <h3 className="font-bold text-gray-800 mb-4">📊 Statistiques de la partie</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-white p-3 rounded-lg">
                                <span className="text-gray-600">Score final</span>
                                <div className="font-bold text-xl text-blue-600">{currentScore}</div>
                            </div>
                            <div className="bg-white p-3 rounded-lg">
                                <span className="text-gray-600">Temps total</span>
                                <div className="font-bold text-xl text-green-600">{formatTime(timer)}</div>
                            </div>
                            <div className="bg-white p-3 rounded-lg">
                                <span className="text-gray-600">Tentatives</span>
                                <div className="font-bold text-xl text-orange-600">
                                    {game.attempts.length} / {maxAttempts}
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-lg">
                                <span className="text-gray-600">Difficulté</span>
                                <div className="font-bold text-xl text-purple-600 capitalize">{game.difficulty}</div>
                            </div>
                        </div>

                        {/* Taux de réussite */}
                        <div className="mt-4 bg-white p-3 rounded-lg">
                            <span className="text-gray-600">Efficacité</span>
                            <div className="font-bold text-xl text-indigo-600">
                                {Math.round(((maxAttempts - game.attempts.length) / maxAttempts) * 100)}%
                            </div>
                        </div>
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
        </div>
    );
};