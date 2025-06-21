// src/components/multiplayer/MultiplayerResults.tsx - Correction des types uniquement
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/common/Modal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { COLOR_PALETTE } from '@/utils/constants';
import { GameResults, PlayerProgress } from '@/types/multiplayer';
import { useNotification } from '@/contexts/NotificationContext';

interface MultiplayerResultsProps {
    isOpen: boolean;
    onClose: () => void;
    gameResults: GameResults | null;
    currentUserId: string;
    showDetailedStats?: boolean;
}

export const MultiplayerResults: React.FC<MultiplayerResultsProps> = ({
                                                                          isOpen,
                                                                          onClose,
                                                                          gameResults,
                                                                          currentUserId,
                                                                          showDetailedStats = true
                                                                      }) => {
    const navigate = useNavigate();
    const { showSuccess, showInfo } = useNotification();
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'stats' | 'achievements'>('leaderboard');
    const [isExporting, setIsExporting] = useState(false);

    // State pour animation des résultats
    const [animatedScores, setAnimatedScores] = useState<Record<string, number>>({});
    const [showConfetti, setShowConfetti] = useState(false);

    // Effet d'animation des scores au chargement
    useEffect(() => {
        if (isOpen && gameResults) {
            const timer = setTimeout(() => {
                const scores: Record<string, number> = {};
                gameResults.final_leaderboard.forEach(player => {
                    scores[player.user_id] = player.score;
                });
                setAnimatedScores(scores);

                // Confetti pour le gagnant
                const winner = gameResults.final_leaderboard.find(p => p.is_winner);
                if (winner?.user_id === currentUserId) {
                    setShowConfetti(true);
                    showSuccess('🏆 Félicitations ! Vous avez gagné !');
                }
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [isOpen, gameResults, currentUserId, showSuccess]);

    const getCurrentPlayerResult = (): PlayerProgress | null => {
        if (!gameResults) return null;
        return gameResults.final_leaderboard.find(p => p.user_id === currentUserId) || null;
    };

    const getPositionSuffix = (position: number): string => {
        const suffixes = ['er', 'ème', 'ème'];
        return position <= 3 ? suffixes[position - 1] : 'ème';
    };

    const getRankColor = (rank: number): string => {
        switch (rank) {
            case 1: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 2: return 'text-gray-600 bg-gray-50 border-gray-200';
            case 3: return 'text-orange-600 bg-orange-50 border-orange-200';
            default: return 'text-blue-600 bg-blue-50 border-blue-200';
        }
    };

    const getRankIcon = (rank: number): string => {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `#${rank}`;
        }
    };

    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleNewGame = () => {
        navigate('/modes');
        onClose();
    };

    const handleViewLobby = () => {
        navigate('/multiplayer/lobby');
        onClose();
    };

    const handleExportResults = async () => {
        if (!gameResults) return;

        try {
            setIsExporting(true);
            // Simuler export des résultats
            const exportData = {
                game_info: {
                    room_code: gameResults.room_code,
                    game_type: gameResults.game_type,
                    difficulty: gameResults.difficulty,
                    duration: formatDuration(gameResults.duration),
                    total_players: gameResults.total_players
                },
                leaderboard: gameResults.final_leaderboard.map(player => ({
                    rank: player.rank || 0,
                    username: player.username,
                    score: player.score,
                    attempts: player.attempts_count,
                    status: player.status
                })),
                solution: gameResults.solution,
                exported_at: new Date().toISOString()
            };

            // Créer et télécharger le fichier JSON
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mastermind_results_${gameResults.room_code}_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showInfo('📊 Résultats exportés avec succès !');
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
        } finally {
            setIsExporting(false);
        }
    };

    if (!gameResults) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Résultats" showCloseButton={false}>
                <div className="text-center py-8">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Chargement des résultats...</p>
                </div>
            </Modal>
        );
    }

    const currentPlayer = getCurrentPlayerResult();
    const playerRank = currentPlayer?.rank || gameResults.final_leaderboard.length;

    return (
        <Modal isOpen={isOpen} onClose={() => {}} title="" showCloseButton={false}>
            <div className="space-y-6 max-w-4xl mx-auto">
                {/* Confetti effect pour le gagnant */}
                {showConfetti && (
                    <div className="fixed inset-0 pointer-events-none z-50">
                        <div className="absolute inset-0 animate-bounce">
                            {Array.from({ length: 50 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                        animationDelay: `${Math.random() * 2}s`
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Header avec résultat personnel */}
                <div className="text-center space-y-4">
                    <div className="space-y-2">
                        <div className="text-6xl animate-bounce">
                            {playerRank === 1 ? '🏆' : playerRank <= 3 ? '🏅' : '🎯'}
                        </div>
                        <h2 className={`text-3xl font-bold ${
                            playerRank === 1 ? 'text-yellow-600' : 'text-blue-600'
                        }`}>
                            {playerRank === 1 ? 'VICTOIRE !' : `${playerRank}${getPositionSuffix(playerRank)} place`}
                        </h2>
                        <p className="text-gray-600">
                            Partie terminée • {gameResults.total_players} joueurs • {formatDuration(gameResults.duration)}
                        </p>
                    </div>

                    {/* Score personnel */}
                    {currentPlayer && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex justify-center items-center space-x-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {animatedScores[currentUserId] || 0}
                                    </div>
                                    <div className="text-sm text-gray-600">Points</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {currentPlayer.attempts_count}
                                    </div>
                                    <div className="text-sm text-gray-600">Tentatives</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Onglets de navigation */}
                <div className="flex justify-center space-x-1 bg-gray-100 rounded-lg p-1">
                    {[
                        { key: 'leaderboard', label: '🏆 Classement', icon: '🏆' },
                        { key: 'stats', label: '📊 Statistiques', icon: '📊' },
                        { key: 'achievements', label: '🏅 Succès', icon: '🏅' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                                activeTab === tab.key
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Contenu des onglets */}
                <div className="min-h-[400px]">
                    {activeTab === 'leaderboard' && (
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-center text-gray-800 mb-4">
                                🏆 Classement final
                            </h3>
                            {gameResults.final_leaderboard.map((player, index) => (
                                <div
                                    key={player.user_id}
                                    className={`p-4 rounded-lg border-2 transition-all ${
                                        player.user_id === currentUserId
                                            ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                    } ${getRankColor(player.rank || index + 1)}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="text-2xl font-bold">
                                                {getRankIcon(player.rank || index + 1)}
                                            </div>
                                            <div>
                                                <div className={`font-bold ${
                                                    player.user_id === currentUserId ? 'text-blue-700' : 'text-gray-800'
                                                }`}>
                                                    {player.username}
                                                    {player.user_id === currentUserId && ' (Vous)'}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {player.status === 'eliminated' ? '💀 Éliminé' :
                                                        player.status === 'finished' ? '✅ Terminé' :
                                                            player.status === 'disconnected' ? '📴 Déconnecté' : '⚡ Actif'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-xl font-bold text-gray-800">
                                                {animatedScores[player.user_id] || player.score}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {player.attempts_count} tentatives
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'stats' && showDetailedStats && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-center text-gray-800 mb-4">
                                📊 Statistiques de la partie
                            </h3>

                            {/* Stats générales */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {gameResults.stats.total_attempts}
                                    </div>
                                    <div className="text-sm text-gray-600">Tentatives totales</div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">
                                        {Math.round(gameResults.stats.completion_rate)}%
                                    </div>
                                    <div className="text-sm text-gray-600">Taux de réussite</div>
                                </div>
                                <div className="text-center p-4 bg-orange-50 rounded-lg">
                                    <div className="text-2xl font-bold text-orange-600">
                                        {Math.round(gameResults.stats.average_attempts_per_player)}
                                    </div>
                                    <div className="text-sm text-gray-600">Tentatives moyennes</div>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {formatDuration(gameResults.duration)}
                                    </div>
                                    <div className="text-sm text-gray-600">Durée totale</div>
                                </div>
                            </div>

                            {/* Solution révélée */}
                            {gameResults.solution && (
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-300 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-800 mb-3">🔍 Solution</h4>
                                    <div className="flex justify-center space-x-2">
                                        {gameResults.solution.map((color, index) => (
                                            <div
                                                key={index}
                                                className="w-8 h-8 rounded-full border-2 border-gray-600 shadow-sm relative"
                                                style={{
                                                    backgroundColor: COLOR_PALETTE[color - 1],
                                                    boxShadow: `0 2px 4px ${COLOR_PALETTE[color - 1]}40, inset 0 -1px 2px rgba(0,0,0,0.2)`
                                                }}
                                                title={`Position ${index + 1}: couleur ${color}`}
                                            >
                                                <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full opacity-50" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'achievements' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-center text-gray-800 mb-4">
                                🏅 Succès obtenus
                            </h3>

                            {gameResults.achievements.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-gray-400 text-4xl mb-2">🏅</div>
                                    <p className="text-gray-500">Aucun succès obtenu cette partie</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Continuez à jouer pour débloquer des succès !
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {gameResults.achievements.map((achievement, index) => (
                                        <div
                                            key={achievement.id}
                                            className={`p-4 rounded-lg border-2 transition-all ${
                                                achievement.user_id === currentUserId
                                                    ? 'border-yellow-400 bg-yellow-50 shadow-lg'
                                                    : 'border-gray-200 bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="text-3xl">
                                                    {achievement.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2">
                                                        <h4 className="font-bold text-gray-800">
                                                            {achievement.title}
                                                        </h4>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            achievement.rarity === 'legendary' ? 'bg-purple-100 text-purple-800' :
                                                                achievement.rarity === 'epic' ? 'bg-orange-100 text-orange-800' :
                                                                    achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {achievement.rarity}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {achievement.description}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-sm font-medium text-gray-700">
                                                            Par: {achievement.username}
                                                            {achievement.user_id === currentUserId && ' (Vous)'}
                                                        </span>
                                                        <span className="text-sm font-bold text-yellow-600">
                                                            +{achievement.points} pts
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions en bas */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
                    <button
                        onClick={handleExportResults}
                        disabled={isExporting}
                        className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 disabled:bg-gray-400 transition-all font-medium flex items-center justify-center"
                    >
                        {isExporting ? (
                            <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Export...
                            </>
                        ) : (
                            '📊 Exporter les résultats'
                        )}
                    </button>

                    <button
                        onClick={handleViewLobby}
                        className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-all font-medium transform hover:scale-105"
                    >
                        🎮 Retour au lobby
                    </button>

                    <button
                        onClick={handleNewGame}
                        className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all font-medium transform hover:scale-105"
                    >
                        🚀 Nouvelle partie
                    </button>
                </div>
            </div>
        </Modal>
    );
};