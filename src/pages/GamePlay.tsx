import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import { GameBoard } from '@/components/game/GameBoard';
import { ColorPicker } from '@/components/game/ColorPicker';
import { GameControls } from '@/components/game/GameControls';
import { AttemptHistory } from '@/components/game/AttemptHistory';
import { useGame } from '@/hooks/useGame';
import { GameStatus } from '@/types/game';
import { DIFFICULTY_CONFIGS } from '@/utils/constants';

export const GamePlay: React.FC = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();
    const { game, loading, error, makeAttempt, isGameFinished, isGameActive } = useGame(gameId);

    const [currentCombination, setCurrentCombination] = useState<number[]>([]);
    const [selectedColor, setSelectedColor] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isWinner, setIsWinner] = useState(false);
    const [currentScore, setCurrentScore] = useState(0);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    // Initialiser la combinaison actuelle
    useEffect(() => {
        if (game && currentCombination.length === 0) {
            setCurrentCombination(new Array(game.combination_length).fill(0));
            if (game.status === GameStatus.ACTIVE) {
                setIsTimerRunning(true);
            }
        }
    }, [game, currentCombination.length]);

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

    // Vérifier si le jeu est terminé
    useEffect(() => {
        if (isGameFinished && game) {
            setIsTimerRunning(false);

            // Vérifier si le joueur a gagné
            const lastAttempt = game.attempts[game.attempts.length - 1];
            if (lastAttempt && lastAttempt.is_correct) {
                setIsWinner(true);
                setCurrentScore(lastAttempt.attempt_score);
            }

            setShowResult(true);
        }
    }, [isGameFinished, game]);

    const handlePositionClick = (position: number) => {
        if (selectedColor && isGameActive) {
            const newCombination = [...currentCombination];
            newCombination[position] = selectedColor;
            setCurrentCombination(newCombination);
        }
    };

    const handleColorSelect = (color: number) => {
        setSelectedColor(color);
    };

    const resetCombination = () => {
        if (game) {
            setCurrentCombination(new Array(game.combination_length).fill(0));
            setSelectedColor(null);
        }
    };

    const canSubmit = currentCombination.every(color => color > 0) && isGameActive;

    const handleSubmit = async () => {
        if (!canSubmit || !game) return;

        try {
            const result = await makeAttempt({ combination: currentCombination });

            if (result) {
                if (result.is_winning) {
                    setIsWinner(true);
                    setCurrentScore(result.score);
                    setIsTimerRunning(false);
                    setShowResult(true);
                } else if (result.game_status === GameStatus.FINISHED) {
                    setIsWinner(false);
                    setIsTimerRunning(false);
                    setShowResult(true);
                } else {
                    // Reset pour la prochaine tentative
                    resetCombination();
                }
            }
        } catch (err) {
            console.error('Erreur lors de la tentative:', err);
        }
    };

    const handleNewGame = () => {
        navigate('/solo');
    };

    const handleBackToMenu = () => {
        navigate('/modes');
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Header />
                <div className="container mx-auto py-8">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md mx-auto">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    if (!game) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Header />
                <div className="container mx-auto py-8">
                    <div className="text-center">
                        <p>Partie non trouvée</p>
                        <button
                            onClick={() => navigate('/modes')}
                            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
        <div className="min-h-screen bg-gray-100">
            <Header />

            <div className="container mx-auto py-4">
                {/* Informations de la partie */}
                <div className="bg-white rounded-lg shadow p-4 mb-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold">Quantum Mastermind - {game.difficulty}</h1>
                            <p className="text-gray-600">
                                {difficultyConfig.colors} couleurs • {difficultyConfig.length} positions
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-mono">{formatTime(timer)}</div>
                            <div className="text-sm text-gray-600">Tentative {game.attempts.length + 1}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Zone de jeu principale */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Plateau de jeu */}
                        <div className="bg-white rounded-lg shadow p-4">
                            <h2 className="text-lg font-bold mb-4">Votre combinaison</h2>
                            <GameBoard
                                combination={currentCombination}
                                onPositionClick={handlePositionClick}
                                selectedColor={selectedColor}
                            />
                        </div>

                        {/* Sélecteur de couleurs */}
                        <div className="bg-white rounded-lg shadow p-4">
                            <h2 className="text-lg font-bold mb-4">Choisissez une couleur</h2>
                            <ColorPicker
                                availableColors={game.available_colors}
                                selectedColor={selectedColor}
                                onColorSelect={handleColorSelect}
                            />
                        </div>

                        {/* Contrôles */}
                        <GameControls
                            onSubmit={handleSubmit}
                            onReset={resetCombination}
                            canSubmit={canSubmit}
                            remainingAttempts={remainingAttempts}
                            currentScore={currentScore}
                        />
                    </div>

                    {/* Historique */}
                    <div className="lg:col-span-1">
                        <AttemptHistory attempts={game.attempts} />
                    </div>
                </div>
            </div>

            {/* Modal de résultat */}
            <Modal
                isOpen={showResult}
                onClose={() => {}}
                title={isWinner ? "🎉 Félicitations !" : "😔 Partie terminée"}
                showCloseButton={false}
            >
                <div className="text-center space-y-4">
                    <p className="text-lg">
                        {isWinner
                            ? `Vous avez trouvé la combinaison en ${game.attempts.length} tentatives !`
                            : "Vous n'avez pas trouvé la combinaison à temps."
                        }
                    </p>

                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 space-y-1">
                            <div>Score final: {currentScore}</div>
                            <div>Temps: {formatTime(timer)}</div>
                            <div>Tentatives: {game.attempts.length} / {game.max_attempts || 'illimité'}</div>
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        <button
                            onClick={handleNewGame}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                        >
                            Nouvelle partie
                        </button>
                        <button
                            onClick={handleBackToMenu}
                            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
                        >
                            Menu principal
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
