import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import { GameBoard } from '@/components/game/GameBoard';
import { ColorPicker } from '@/components/game/ColorPicker';
import { GameControls } from '@/components/game/GameControls';
import { AttemptHistory } from '@/components/game/AttemptHistory';
import { StartGameButton } from '@/components/game/StartGameButton'; // ✅ Nouveau import
import { useGame } from '@/hooks/useGame';
import { useNotification } from '@/contexts/NotificationContext';
import { GameStatus } from '@/types/game';
import { DIFFICULTY_CONFIGS } from '@/utils/constants';

export const GamePlay: React.FC = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();
    const { game, loading, error, makeAttempt, startGame, isGameFinished, isGameActive, isGameWaiting } = useGame(gameId); // ✅ Ajout startGame et isGameWaiting
    const { showError, showSuccess, showInfo, showWarning } = useNotification();

    const [currentCombination, setCurrentCombination] = useState<number[]>([]);
    const [selectedColor, setSelectedColor] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isWinner, setIsWinner] = useState(false);
    const [currentScore, setCurrentScore] = useState(0);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    // ✅ Nouvelle fonction pour démarrer la partie
    const handleStartGame = async () => {
        try {
            showInfo('🚀 Démarrage de la partie...');

            const updatedGame = await startGame();

            if (updatedGame) {
                showSuccess('🎯 Partie démarrée ! Bonne chance !');
                showInfo(`💪 Vous avez ${updatedGame.max_attempts || 'un nombre illimité'} de tentatives pour réussir !`);
                setIsTimerRunning(true);
            }
        } catch (err) {
            console.error('Erreur lors du démarrage:', err);
            showError('❌ Impossible de démarrer la partie. Veuillez réessayer.');
        }
    };

    // Initialiser la combinaison actuelle
    useEffect(() => {
        if (game && currentCombination.length === 0) {
            const initialCombination = new Array(game.combination_length).fill(0);
            setCurrentCombination(initialCombination);

            // ✅ Ne plus démarrer automatiquement le timer ici
            if (game.status === GameStatus.ACTIVE) {
                setIsTimerRunning(true);
                showSuccess('🎯 Partie en cours ! Trouvez la combinaison secrète !');
            } else if (game.status === GameStatus.WAITING) {
                showInfo('⏳ Partie créée ! Cliquez sur "DÉMARRER" pour commencer votre défi.');
            }
        }
    }, [game, currentCombination.length, showSuccess, showInfo]);

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

    // Alertes pour tentatives restantes
    useEffect(() => {
        if (game && game.max_attempts && isGameActive) {
            const remainingAttempts = game.max_attempts - game.attempts.length;
            if (remainingAttempts === 3) {
                showWarning('⚠️ Plus que 3 tentatives restantes !');
            } else if (remainingAttempts === 1) {
                showError('🚨 DERNIÈRE TENTATIVE ! Soyez prudent !');
            }
        }
    }, [game?.attempts.length, game?.max_attempts, isGameActive, showWarning, showError]);

    // Vérifier si le jeu est terminé
    useEffect(() => {
        if (isGameFinished && game) {
            setIsTimerRunning(false);

            const lastAttempt = game.attempts[game.attempts.length - 1];
            if (lastAttempt && lastAttempt.is_correct) {
                setIsWinner(true);
                setCurrentScore(lastAttempt.attempt_score);
                showSuccess(`🏆 VICTOIRE ! Combinaison trouvée en ${game.attempts.length} tentatives !`);
                showInfo(`💎 Score final : ${lastAttempt.attempt_score} points`);
            } else {
                setIsWinner(false);
                showError('💔 Défaite ! La combinaison reste secrète...');
                showInfo('🎯 Ne vous découragez pas, réessayez avec une nouvelle partie !');
            }

            setTimeout(() => setShowResult(true), 2000);
        }
    }, [isGameFinished, game, showSuccess, showError, showInfo]);

    // Logique pour la sélection de couleur
    const handlePositionClick = (position: number) => {
        if (!isGameActive) {
            if (isGameWaiting) {
                showWarning('⏳ Veuillez d\'abord démarrer la partie !');
            } else {
                showError('⏸️ La partie n\'est plus active !');
            }
            return;
        }

        const newCombination = [...currentCombination];

        if (selectedColor && selectedColor > 0) {
            newCombination[position] = selectedColor;
            setCurrentCombination(newCombination);
            showInfo(`🎨 Couleur placée en position ${position + 1}`);
        } else {
            if (newCombination[position] > 0) {
                newCombination[position] = 0;
                setCurrentCombination(newCombination);
                showInfo(`🗑️ Couleur supprimée de la position ${position + 1}`);
            } else {
                showWarning('🎨 Veuillez d\'abord sélectionner une couleur !');
            }
        }
    };

    // Logique pour la sélection de couleur
    const handleColorSelect = (color: number) => {
        if (!isGameActive) {
            if (isGameWaiting) {
                showWarning('⏳ Veuillez d\'abord démarrer la partie !');
            } else {
                showError('⏸️ La partie n\'est plus active !');
            }
            return;
        }

        if (color === 0) {
            setSelectedColor(null);
            showInfo('🔄 Aucune couleur sélectionnée');
        } else if (color === selectedColor) {
            setSelectedColor(null);
            showInfo('🔄 Couleur désélectionnée');
        } else {
            setSelectedColor(color);
            showSuccess('✅ Couleur sélectionnée ! Cliquez sur une position pour la placer.');
        }
    };

    const resetCombination = () => {
        if (game) {
            setCurrentCombination(new Array(game.combination_length).fill(0));
            setSelectedColor(null);
            showInfo('🔄 Combinaison réinitialisée');
        }
    };

    const canSubmit = currentCombination.every(color => color > 0) && isGameActive;

    const handleSubmit = async () => {
        if (!canSubmit || !game) {
            if (isGameWaiting) {
                showWarning('⏳ Veuillez d\'abord démarrer la partie !');
            } else if (!isGameActive) {
                showError('⏸️ La partie n\'est plus active !');
            } else {
                showWarning('⚠️ Veuillez compléter votre combinaison avant de valider !');
            }
            return;
        }

        try {
            showInfo('⏳ Validation de votre tentative en cours...');
            const result = await makeAttempt({ combination: currentCombination });

            if (result) {
                if (result.is_winning) {
                    setIsWinner(true);
                    setCurrentScore(result.score);
                    setIsTimerRunning(false);
                    showSuccess(`🎉 BRAVO ! Vous avez cassé le code ! Score: ${result.score} points`);
                    setTimeout(() => setShowResult(true), 2500);
                } else if (result.game_status === GameStatus.FINISHED) {
                    setIsWinner(false);
                    setIsTimerRunning(false);
                    showError('💔 Plus de tentatives ! Partie terminée...');
                    setTimeout(() => setShowResult(true), 2500);
                } else {
                    const feedbackMessage = result.correct_positions > 0 || result.correct_colors > 0
                        ? `🎯 Tentative ${result.attempt_number} : ${result.correct_positions} bien placées, ${result.correct_colors} mal placées`
                        : `❌ Tentative ${result.attempt_number} : Aucune couleur correcte trouvée`;

                    showInfo(feedbackMessage);

                    if (result.correct_positions === game.combination_length - 1) {
                        showWarning('🔥 Très proche ! Plus qu\'une position à corriger !');
                    } else if (result.correct_positions >= game.combination_length / 2) {
                        showSuccess('👍 Bon travail ! Vous êtes sur la bonne voie !');
                    } else if (result.correct_colors > 0) {
                        showInfo('💡 Bonnes couleurs trouvées, travaillez les positions !');
                    }

                    resetCombination();
                }
            }
        } catch (err) {
            console.error('Erreur lors de la tentative:', err);
            showError('💥 Erreur lors de la validation de votre tentative');
        }
    };

    const handleNewGame = () => {
        showInfo('🎮 Création d\'une nouvelle partie...');
        navigate('/solo');
    };

    const handleBackToMenu = () => {
        showInfo('🏠 Retour au menu principal');
        navigate('/modes');
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600 text-lg">Chargement de la partie...</p>
                    <p className="text-gray-500 text-sm mt-2">Préparation du plateau de jeu</p>
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
                            onClick={() => {
                                showInfo('Retour au menu principal');
                                navigate('/modes');
                            }}
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
                            onClick={() => {
                                navigate('/modes');
                                showInfo('Retour au menu principal');
                            }}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Retour au menu
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const difficultyConfig = DIFFICULTY_CONFIGS[game.difficulty];
    const remainingAttempts = game.max_attempts ? game.max_attempts - game.attempts.length : undefined;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <Header />

            {/* ✅ Bouton de démarrage - s'affiche seulement si la partie est en attente */}
            {isGameWaiting && (
                <StartGameButton onStartGame={handleStartGame} />
            )}

            <div className="container mx-auto py-6 px-4">
                {/* Header de la partie */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="text-center md:text-left mb-4 md:mb-0">
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                🧩 Quantum Mastermind
                            </h1>
                            <p className="text-gray-600 mt-1">
                                {difficultyConfig.description}
                            </p>
                            <div className="flex items-center justify-center md:justify-start space-x-4 mt-2">
                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    🎨 {difficultyConfig.colors} couleurs
                                </span>
                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    🎯 {difficultyConfig.length} positions
                                </span>
                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    🔥 Max {difficultyConfig.attempts} tentatives
                                </span>
                            </div>

                            {/* ✅ Indicateur de statut */}
                            <div className="mt-3">
                                {isGameWaiting && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                        ⏳ En attente de démarrage
                                    </span>
                                )}
                                {isGameActive && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                        🎮 Partie en cours
                                    </span>
                                )}
                                {isGameFinished && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                        🏁 Partie terminée
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="text-3xl font-mono text-gray-800 bg-gray-100 px-4 py-2 rounded-lg border border-gray-300">
                                ⏱️ {formatTime(timer)}
                            </div>
                            <div className="text-sm text-gray-600 mt-2">
                                <div className="font-medium">Tentative {game.attempts.length + 1} / {game.max_attempts || '∞'}</div>
                                {remainingAttempts !== undefined && (
                                    <div className={`text-xs font-medium mt-1 ${
                                        remainingAttempts <= 3 ? 'text-red-600' :
                                            remainingAttempts <= 5 ? 'text-orange-600' : 'text-green-600'
                                    }`}>
                                        {remainingAttempts} restantes
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Barre de progression */}
                    {game.max_attempts && (
                        <div className="mt-4">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Progression</span>
                                <span>{game.attempts.length} / {game.max_attempts}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-500 ${
                                        (game.attempts.length / game.max_attempts) > 0.8 ? 'bg-red-500' :
                                            (game.attempts.length / game.max_attempts) > 0.6 ? 'bg-orange-500' :
                                                'bg-blue-500'
                                    }`}
                                    style={{ width: `${(game.attempts.length / game.max_attempts) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Zone de jeu principale */}
                    <div className="xl:col-span-2 space-y-6">
                        <GameBoard
                            combination={currentCombination}
                            onPositionClick={handlePositionClick}
                            selectedColor={selectedColor}
                            isActive={isGameActive} // ✅ Désactivé si partie en attente
                        />

                        <ColorPicker
                            availableColors={game.available_colors}
                            selectedColor={selectedColor}
                            onColorSelect={handleColorSelect}
                        />

                        <GameControls
                            onSubmit={handleSubmit}
                            onReset={resetCombination}
                            canSubmit={canSubmit}
                            remainingAttempts={remainingAttempts}
                            currentScore={currentScore}
                        />
                    </div>

                    {/* Historique */}
                    <div className="xl:col-span-1">
                        <AttemptHistory
                            attempts={game.attempts}
                            maxAttempts={game.max_attempts}
                        />
                    </div>
                </div>
            </div>

            {/* Modal de résultat */}
            <Modal
                isOpen={showResult}
                onClose={() => {}}
                title=""
                showCloseButton={false}
            >
                <div className="text-center space-y-6">
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
                                    {game.attempts.length} / {game.max_attempts || '∞'}
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-lg">
                                <span className="text-gray-600">Difficulté</span>
                                <div className="font-bold text-xl text-purple-600 capitalize">{game.difficulty}</div>
                            </div>
                        </div>

                        {game.max_attempts && (
                            <div className="mt-4 bg-white p-3 rounded-lg">
                                <span className="text-gray-600">Efficacité</span>
                                <div className="font-bold text-xl text-indigo-600">
                                    {Math.round(((game.max_attempts - game.attempts.length) / game.max_attempts) * 100)}%
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
        </div>
    );
};