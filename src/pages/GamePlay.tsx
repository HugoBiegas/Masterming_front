import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { GameBoard } from '@/components/game/GameBoard';
import { ColorSelectionModal } from '@/components/game/ColorSelectionModal';
import { AttemptHistory } from '@/components/game/AttemptHistory';
import { VictoryDefeatDisplay } from '@/components/game/VictoryDefeatDisplay';
import { useGame } from '@/hooks/useGame';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { GameStatus, GameType, GameMode, Difficulty, GameCreateRequest } from '@/types/game';
import {COLOR_PALETTE, DIFFICULTY_CONFIGS} from '@/utils/constants';
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

    // États pour la modal de sélection des couleurs avec position
    const [showColorModal, setShowColorModal] = useState(false);
    const [colorModalPosition, setColorModalPosition] = useState<number | undefined>(undefined);

    // État pour la solution révélée
    const [revealedSolution, setRevealedSolution] = useState<number[] | null>(null);

    // NOUVEAU: État pour forcer l'affichage de victoire/défaite
    const [showVictoryDefeat, setShowVictoryDefeat] = useState(false);

    // Réfs pour les effets
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const gameCheckRef = useRef<NodeJS.Timeout | null>(null);

    // Configuration du jeu basée sur la difficulté
    const difficultyConfig = game ? DIFFICULTY_CONFIGS[game.difficulty] : DIFFICULTY_CONFIGS.medium;

    // Vérifier si la soumission est possible
    const canSubmit = currentCombination.every(color => color > 0);

    // Initialiser la combinaison au bon moment
    useEffect(() => {
        if (game && currentCombination.length === 0) {
            setCurrentCombination(new Array(difficultyConfig.length).fill(0));
        }
    }, [game, currentCombination.length, difficultyConfig.length]);

    // Gestion du timer
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

    // Vérification périodique de l'état du jeu
    useEffect(() => {
        if (game && isGameActive) {
            gameCheckRef.current = setInterval(() => {
                refreshGame();
            }, 30000); // Rafraîchir toutes les 30 secondes
        }

        return () => {
            if (gameCheckRef.current) {
                clearInterval(gameCheckRef.current);
            }
        };
    }, [game, isGameActive, refreshGame]);

    // Gestion de la fin de partie
    useEffect(() => {
        if (isGameFinished) {
            setIsTimerRunning(false);

            if (game?.status === 'finished' && game.solution) {
                setRevealedSolution(game.solution);
                setShowVictoryDefeat(true); // NOUVEAU: Forcer l'affichage
                if (isWinner) {
                    showSuccess('🎉 Félicitations ! Vous avez gagné !');
                } else {
                    showWarning('😅 Partie terminée. Meilleure chance la prochaine fois !');
                }
            }
        }
    }, [isGameFinished, game, isWinner, showSuccess, showWarning]);

    // NOUVEAU: Gestionnaire de clic sur une position - Ouvre la modal pour choisir la couleur
    const handlePositionClick = useCallback((position: number) => {
        if (!isGameActive) return;

        // Ouvrir la modal de sélection avec la position spécifiée
        setColorModalPosition(position);
        setShowColorModal(true);
    }, [isGameActive]);

    // Gestionnaire pour supprimer une couleur
    const handleRemoveColor = useCallback((position: number) => {
        if (!isGameActive) return;

        setCurrentCombination(prev => {
            const newCombination = [...prev];
            newCombination[position] = 0;
            return newCombination;
        });
    }, [isGameActive]);

    // NOUVEAU: Gestionnaire de sélection de couleur avec position
    const handleColorSelect = useCallback((color: number) => {
        setSelectedColor(color);

        // Si on a une position spécifiée, placer la couleur directement
        if (colorModalPosition !== undefined) {
            setCurrentCombination(prev => {
                const newCombination = [...prev];
                newCombination[colorModalPosition] = color;
                return newCombination;
            });
        }

        // Fermer la modal et réinitialiser la position
        setShowColorModal(false);
        setColorModalPosition(undefined);
    }, [colorModalPosition]);

    // Gestionnaire de soumission
    const handleSubmitAttempt = useCallback(async () => {
        if (!game || !canSubmit) return;

        try {
            const result = await makeAttempt({
                combination: currentCombination,
                use_quantum_hint: false
            });

            if (result) {
                if (result.is_winning) {
                    setIsWinner(true);
                    setRevealedSolution(game.solution || result.solution || null);
                    setShowVictoryDefeat(true); // NOUVEAU: Forcer l'affichage immédiatement
                    showSuccess('🎯 Bravo ! Vous avez trouvé la solution !');
                    setIsTimerRunning(false);
                } else {
                    setCurrentScore(result.score || 0);
                    showSuccess(`✅ Tentative validée ! Score: ${result.score || 0}`);

                    // NOUVEAU: Vérifier si on a épuisé les tentatives
                    if (result.remaining_attempts === 0 || (game.attempts.length + 1) >= difficultyConfig.attempts) {
                        setIsWinner(false);
                        setRevealedSolution(game.solution || result.solution || null);
                        setShowVictoryDefeat(true);
                    }
                }

                // Réinitialiser la combinaison
                setCurrentCombination(new Array(difficultyConfig.length).fill(0));
                setSelectedColor(null);
            }
        } catch (error: any) {
            console.error('Erreur tentative:', error);
            showError(error.message || 'Erreur lors de la soumission');
        }
    }, [game, currentCombination, makeAttempt, difficultyConfig.length, difficultyConfig.attempts, showError, showSuccess, canSubmit]);

    // Gestionnaire pour quitter la partie
    const handleLeaveGame = useCallback(async () => {
        setIsLeaving(true);
        try {
            await gameService.leaveAllActiveGames();
            showSuccess('Partie quittée');
            navigate('/modes');
        } catch (error: any) {
            console.error('Erreur en quittant:', error);
            showError('Erreur lors de la sortie');
        } finally {
            setIsLeaving(false);
        }
    }, [showSuccess, showError, navigate]);

    // Gestionnaire pour démarrer la partie
    const handleStartGame = useCallback(async () => {
        if (!game || isStarting) return;

        setIsStarting(true);
        try {
            await gameService.startGame(game.id);
            showSuccess('🚀 Partie démarrée !');
            setIsTimerRunning(true);
            await refreshGame();
        } catch (error: any) {
            console.error('Erreur démarrage:', error);
            showError('Erreur lors du démarrage de la partie');
        } finally {
            setIsStarting(false);
        }
    }, [game, isStarting, refreshGame, showSuccess, showError]);

    // NOUVEAUX GESTIONNAIRES POUR VictoryDefeatDisplay
    const handleNewGame = useCallback(async () => {
        try {
            // Créer une nouvelle partie avec les mêmes paramètres
            const newGameData: GameCreateRequest = {
                game_type: game?.game_type || GameType.CLASSIC,
                game_mode: GameMode.SINGLE,
                difficulty: game?.difficulty || Difficulty.MEDIUM,
                max_attempts: game?.max_attempts || difficultyConfig.attempts,
                max_players: 1,
                is_private: false,
                allow_spectators: false,
                enable_chat: false,
                quantum_enabled: game?.game_type === GameType.QUANTUM || false,
                auto_leave: true
            };

            const response = await gameService.createGameWithAutoLeave(newGameData);
            showSuccess('🎮 Nouvelle partie créée !');
            navigate(`/game/${response.id}`);
        } catch (error: any) {
            console.error('Erreur création nouvelle partie:', error);
            showError('Erreur lors de la création d\'une nouvelle partie');
        }
    }, [game, difficultyConfig, showSuccess, showError, navigate]);

    const handleBackToMenu = useCallback(() => {
        navigate('/modes');
    }, [navigate]);

    // Formatage du temps
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Gestion des états de loading optimisée
    if (loading || !game) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 loading-container">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <LoadingSpinner size="lg" />
                        <p className="mt-4 text-gray-600">
                            {loading ? 'Chargement de la partie...' : 'Initialisation...'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 loading-container">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="text-red-500 text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={() => navigate('/modes')}
                            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                        >
                            Retour aux modes de jeu
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex overflow-hidden">

            {/* NOUVEAU LAYOUT: Zone de jeu à gauche, historique à droite sur TOUTE la hauteur */}

            {/* Zone de jeu principale - PARTIE GAUCHE */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Header intégré dans la zone de jeu */}
                <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        {/* Logo/Titre */}
                        <div className="flex items-center space-x-4">
                            <h1 className="text-xl font-bold text-blue-600">Quantum Mastermind</h1>
                            <div className="text-sm text-gray-600">
                                Bienvenue, {user?.username}
                            </div>
                        </div>

                        {/* Actions du header */}
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleLeaveGame}
                                disabled={isLeaving}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 text-sm"
                            >
                                {isLeaving ? 'Sortie...' : '🚪 Quitter'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Contenu de jeu scrollable */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-3xl mx-auto space-y-6">

                        {/* En-tête de la partie */}
                        <div className="bg-white rounded-lg shadow-lg p-6 game-card">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800">
                                        🎯 Partie Solo - {game.room_code}
                                    </h1>
                                    <p className="text-gray-600">
                                        Difficulté: {game.difficulty} • {difficultyConfig.colors} couleurs • {difficultyConfig.length} positions
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
                                            {game.attempts.length} / {difficultyConfig.attempts}
                                        </div>
                                        <div className="text-xs text-gray-500">Tentatives</div>
                                    </div>
                                </div>
                            </div>

                            {/* Status et actions */}
                            <div className="flex items-center justify-between">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                    game.status === 'active' ? 'bg-green-100 text-green-800' :
                                        game.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                }`}>
                                    {game.status === 'active' ? '🟢 En cours' :
                                        game.status === 'waiting' ? '⏳ En attente' :
                                            '🏁 Terminée'}
                                </span>

                                {game.status === 'waiting' && (
                                    <button
                                        onClick={handleStartGame}
                                        disabled={isStarting}
                                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
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
                            </div>
                        </div>

                        {/* NOUVEAU: Affichage de victoire/défaite */}
                        {showVictoryDefeat && revealedSolution && (
                            <VictoryDefeatDisplay
                                isWinner={isWinner}
                                playerScore={currentScore}
                                playerAttempts={game.attempts.length}
                                maxAttempts={difficultyConfig.attempts}
                                solution={revealedSolution}
                                onNewGame={handleNewGame}
                                onBackToMenu={handleBackToMenu}
                            />
                        )}

                        {/* Plateau de jeu - masqué si victoire/défaite affichée */}
                        {!showVictoryDefeat && (
                            <div className="bg-white rounded-lg shadow-lg p-6 game-card">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                    🎯 Plateau de Jeu
                                </h2>

                                <p className="text-sm text-gray-600 mb-4 text-center">
                                    💡 Cliquez sur les cercles vides pour choisir une couleur
                                </p>

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
                        )}

                        {/* Solution révélée - seulement si pas de VictoryDefeatDisplay */}
                        {revealedSolution && !showVictoryDefeat && (
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-6 game-card">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <span className="text-2xl mr-2">🎯</span>
                                    Solution révélée
                                </h3>
                                <div className="flex items-center justify-center space-x-2">
                                    {revealedSolution.map((color, index) => (
                                        <div
                                            key={index}
                                            className="w-12 h-12 rounded-full border-4 border-white shadow-lg"
                                            style={{
                                                backgroundColor: COLOR_PALETTE[color - 1] || '#gray'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Historique des tentatives - TOUTE LA PARTIE DROITE sur TOUTE la hauteur */}
            <div className="w-96 flex-shrink-0 border-l border-gray-200 bg-white/95 backdrop-blur-sm h-screen overflow-hidden">
                <AttemptHistory
                    attempts={game.attempts}
                    maxAttempts={difficultyConfig.attempts}
                    combinationLength={difficultyConfig.length}
                    isQuantumMode={game.game_type === 'quantum'}
                />
            </div>

            {/* Modal de sélection des couleurs avec position */}
            <ColorSelectionModal
                isOpen={showColorModal}
                onClose={() => {
                    setShowColorModal(false);
                    setColorModalPosition(undefined);
                }}
                onColorSelect={handleColorSelect}
                availableColors={difficultyConfig.colors}
                selectedColor={selectedColor}
                position={colorModalPosition}
            />
        </div>
    );
};