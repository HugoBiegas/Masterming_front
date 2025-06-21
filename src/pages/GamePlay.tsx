import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { GameBoard } from '@/components/game/GameBoard';
import { ColorSelectionModal } from '@/components/game/ColorSelectionModal'; // NOUVEAU
import { AttemptHistory } from '@/components/game/AttemptHistory';
import { useGame } from '@/hooks/useGame';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { GameStatus } from '@/types/game';
import { DIFFICULTY_CONFIGS } from '@/utils/constants';
import { gameService } from '@/services/game';

export const GamePlay: React.FC = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { game, loading, error, makeAttempt, isGameFinished, isGameActive, refreshGame } = useGame(gameId);
    const { showError, showSuccess, showWarning } = useNotification();

    const [currentCombination, setCurrentCombination] = useState<number[]>([]);
    const [selectedColor, setSelectedColor] = useState<number | null>(null);
    const [isWinner, setIsWinner] = useState(false);
    const [currentScore, setCurrentScore] = useState(0);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [isStarting, setIsStarting] = useState(false);

    // NOUVEAU: États pour la modal de sélection des couleurs
    const [showColorModal, setShowColorModal] = useState(false);
    const [colorModalPosition, setColorModalPosition] = useState<number | undefined>(undefined);

    // NOUVEAU: État pour la solution révélée
    const [revealedSolution, setRevealedSolution] = useState<number[] | null>(null);

    // Réfs pour les effets
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const gameCheckRef = useRef<NodeJS.Timeout | null>(null);

    // Configuration du jeu basée sur la difficulté
    const difficultyConfig = game ? DIFFICULTY_CONFIGS[game.difficulty] : DIFFICULTY_CONFIGS.medium;

    // Initialisation de la combinaison
    useEffect(() => {
        if (game && currentCombination.length === 0) {
            setCurrentCombination(new Array(difficultyConfig.length).fill(0));
        }
    }, [game, difficultyConfig.length, currentCombination.length]);

    // Timer de jeu
    useEffect(() => {
        if (isTimerRunning) {
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
            }
        };
    }, [isTimerRunning]);

    // Démarrage automatique du timer
    useEffect(() => {
        if (game && isGameActive && !isTimerRunning && !isGameFinished) {
            setIsTimerRunning(true);
        } else if (isGameFinished) {
            setIsTimerRunning(false);
        }
    }, [game, isGameActive, isTimerRunning, isGameFinished]);

    // Vérification périodique du statut de la partie
    useEffect(() => {
        if (game && isGameActive) {
            gameCheckRef.current = setInterval(async () => {
                try {
                    await refreshGame();
                } catch (error) {
                    console.error('Erreur lors de la vérification de la partie:', error);
                }
            }, 5000);
        }

        return () => {
            if (gameCheckRef.current) {
                clearInterval(gameCheckRef.current);
            }
        };
    }, [game, isGameActive, refreshGame]);

    // Nettoyage des timers
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (gameCheckRef.current) clearInterval(gameCheckRef.current);
        };
    }, []);

    // NOUVEAU: Gestion de la sélection de couleur via modal
    const handlePositionClick = useCallback((position: number) => {
        if (!isGameActive) return;

        setColorModalPosition(position);
        setShowColorModal(true);
    }, [isGameActive]);

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

    // Suppression d'une couleur d'une position
    const handleRemoveColor = useCallback((position: number) => {
        if (!isGameActive) return;

        setCurrentCombination(prev => {
            const newCombination = [...prev];
            newCombination[position] = 0;
            return newCombination;
        });
    }, [isGameActive]);

    // Soumission de la tentative
    const handleSubmitAttempt = useCallback(async () => {
        if (!game || !user || !isGameActive) return;

        const hasAllColors = currentCombination.every(color => color > 0);
        if (!hasAllColors) {
            showError('Veuillez sélectionner toutes les couleurs avant de soumettre');
            return;
        }

        try {
            showWarning('🎯 Soumission de la tentative...');

            // Créer un AttemptRequest correct
            const attemptRequest = {
                combination: currentCombination,
                use_quantum_hint: game.game_type === 'quantum'
            };

            const result = await makeAttempt(attemptRequest);

            if (result) {
                if (result.is_winning) {
                    setIsWinner(true);
                    setRevealedSolution(currentCombination);
                    setIsTimerRunning(false);
                    showSuccess('🏆 Félicitations ! Vous avez trouvé la solution !');
                } else if (result.game_finished) {
                    setIsWinner(false);
                    setRevealedSolution(result.solution || null);
                    setIsTimerRunning(false);
                    showError('😢 Plus de tentatives disponibles...');
                } else {
                    showSuccess(`✅ Tentative ${result.attempt_number} enregistrée !`);
                }

                // Réinitialiser la combinaison pour la prochaine tentative
                setCurrentCombination(new Array(difficultyConfig.length).fill(0));
                setSelectedColor(null);
                setCurrentScore(result.score || 0);
            }

        } catch (error: any) {
            console.error('Erreur soumission tentative:', error);
            showError(error.message || 'Erreur lors de la soumission');
        }
    }, [game, user, isGameActive, currentCombination, makeAttempt, difficultyConfig.length, showError, showSuccess, showWarning]);

    // Quitter la partie
    const handleLeaveGame = useCallback(async () => {
        if (!game || isLeaving) return;

        setIsLeaving(true);
        try {
            await gameService.leaveAllActiveGames();
            showSuccess('Vous avez quitté la partie');
            navigate('/modes');
        } catch (error: any) {
            console.error('Erreur en quittant:', error);
            showError('Erreur lors de la sortie de la partie');
        } finally {
            setIsLeaving(false);
        }
    }, [game, isLeaving, navigate, showSuccess, showError]);

    // Démarrer la partie
    const handleStartGame = useCallback(async () => {
        if (!game || isStarting) return;

        setIsStarting(true);
        try {
            await gameService.startGame(game.id);
            showSuccess('Partie démarrée !');
            setIsTimerRunning(true);
            await refreshGame();
        } catch (error: any) {
            console.error('Erreur démarrage:', error);
            showError('Erreur lors du démarrage de la partie');
        } finally {
            setIsStarting(false);
        }
    }, [game, isStarting, refreshGame, showSuccess, showError]);

    // Formatage du temps
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Vérifier si la soumission est possible
    const canSubmit = currentCombination.every(color => color > 0);

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

    if (error || !game) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur</h2>
                    <p className="text-gray-600 mb-4">{error || 'Partie introuvable'}</p>
                    <button
                        onClick={() => navigate('/modes')}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                    >
                        Retour aux modes de jeu
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 page-with-history">
            <Header />

            <div className="container mx-auto py-6 px-4">
                {/* En-tête de la partie */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                🎯 Partie Solo - {game.room_code}
                            </h1>
                            <p className="text-gray-600">
                                Difficulté: {game.difficulty} • {difficultyConfig.colors} couleurs • {difficultyConfig.length} positions
                            </p>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Timer */}
                            <div className="text-center">
                                <div className="text-2xl font-mono text-blue-600">{formatTime(timer)}</div>
                                <div className="text-xs text-gray-500">Temps écoulé</div>
                            </div>

                            {/* Score */}
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{currentScore}</div>
                                <div className="text-xs text-gray-500">Score</div>
                            </div>

                            {/* Tentatives */}
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">
                                    {game.attempts.length} / {difficultyConfig.attempts}
                                </div>
                                <div className="text-xs text-gray-500">Tentatives</div>
                            </div>
                        </div>
                    </div>

                    {/* Statut de la partie */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                game.status === GameStatus.ACTIVE ? 'bg-green-100 text-green-800' :
                                    game.status === GameStatus.FINISHED ? 'bg-gray-100 text-gray-800' :
                                        'bg-yellow-100 text-yellow-800'
                            }`}>
                                {game.status === GameStatus.ACTIVE ? '🟢 En cours' :
                                    game.status === GameStatus.FINISHED ? '🏁 Terminée' :
                                        '⏳ En attente'}
                            </span>

                            {isGameFinished && (
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    isWinner ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {isWinner ? '🏆 Victoire' : '💀 Défaite'}
                                </span>
                            )}
                        </div>

                        <div className="flex space-x-2">
                            {game.status === GameStatus.WAITING && (
                                <button
                                    onClick={handleStartGame}
                                    disabled={isStarting}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                                >
                                    {isStarting ? (
                                        <>
                                            <LoadingSpinner size="sm" className="mr-2" />
                                            Démarrage...
                                        </>
                                    ) : (
                                        '▶️ Démarrer'
                                    )}
                                </button>
                            )}

                            <button
                                onClick={handleLeaveGame}
                                disabled={isLeaving}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center"
                            >
                                {isLeaving ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        Sortie...
                                    </>
                                ) : (
                                    '🚪 Quitter'
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Zone de jeu principale */}
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* Plateau de jeu */}
                    <div className="flex-1">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                🎯 Plateau de Jeu
                            </h2>

                            <GameBoard
                                combination={currentCombination}
                                onPositionClick={handlePositionClick}
                                onRemoveColor={handleRemoveColor}
                                onSubmitAttempt={handleSubmitAttempt}
                                selectedColor={selectedColor}
                                isActive={isGameActive}
                                canSubmit={canSubmit}
                            />
                        </div>
                    </div>

                    {/* Historique des tentatives */}
                    <div className="lg:w-80">
                        <AttemptHistory
                            attempts={game.attempts}
                            maxAttempts={difficultyConfig.attempts}
                            combinationLength={difficultyConfig.length}
                            isQuantumMode={game.game_type === 'quantum'}
                        />
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
        </div>
    );
};