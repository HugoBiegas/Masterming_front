import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PlayersList } from '@/components/multiplayer/PlayersList';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { multiplayerService } from '@/services/multiplayer';
import { PlayerProgress } from '@/types/multiplayer';

interface GameResults {
    game_id: string;
    final_leaderboard: PlayerProgress[];
    game_stats: {
        total_duration: number;
        total_masterminds: number;
        total_attempts: number;
        items_used: number;
    };
    player_stats: {
        [userId: string]: {
            final_position: number;
            total_score: number;
            masterminds_completed: number;
            best_time: number;
            items_used: number;
            favorite_item?: string;
        };
    };
}

export const MultiplayerResults: React.FC = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showSuccess, showError } = useNotification();

    const [results, setResults] = useState<GameResults | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDetailedStats, setShowDetailedStats] = useState(false);

    // Charger les résultats
    useEffect(() => {
        const loadResults = async () => {
            if (!gameId) return;

            try {
                setLoading(true);
                const gameResults = await multiplayerService.getGameResults(gameId);
                setResults(gameResults);
            } catch (error: any) {
                console.error('Erreur chargement résultats:', error);
                setError('Impossible de charger les résultats de la partie');
            } finally {
                setLoading(false);
            }
        };

        loadResults();
    }, [gameId]);

    const myStats = user && results ? results.player_stats[user.id] : null;
    const myPosition = myStats?.final_position || 0;

    const getPositionEmoji = (position: number) => {
        switch (position) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return '🏅';
        }
    };

    const getPositionMessage = (position: number) => {
        switch (position) {
            case 1: return 'Félicitations ! Vous êtes le grand vainqueur !';
            case 2: return 'Excellent ! Vous finissez sur le podium !';
            case 3: return 'Bravo ! Une belle troisième place !';
            default: return `Vous finissez à la ${position}ème position.`;
        }
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Chargement des résultats...</p>
                </div>
            </div>
        );
    }

    if (error || !results) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur</h2>
                    <p className="text-gray-600 mb-4">{error || 'Résultats introuvables'}</p>
                    <button
                        onClick={() => navigate('/multiplayer/browse')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Retour aux parties
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container mx-auto py-6 px-4">

                {/* En-tête des résultats */}
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🏆</div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Partie Terminée !
                    </h1>

                    {/* Message personnalisé selon la position */}
                    {myStats && (
                        <div className="mb-4">
                            <div className="text-4xl mb-2">{getPositionEmoji(myPosition)}</div>
                            <p className="text-lg text-gray-700">
                                {getPositionMessage(myPosition)}
                            </p>
                            <p className="text-gray-600">
                                Score final: <strong>{myStats.total_score} points</strong>
                            </p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Classement final */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <span className="mr-2">🏆</span>
                                Classement Final
                            </h2>

                            <PlayersList
                                players={results.final_leaderboard}
                                currentUserId={user?.id}
                                creatorId={results.final_leaderboard[0]?.user_id} // Le gagnant comme "créateur" pour l'affichage
                                showProgress={true}
                                showItems={false}
                                compactMode={false}
                            />
                        </div>

                        {/* Podium des 3 premiers */}
                        {results.final_leaderboard.length >= 3 && (
                            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                                    🏅 Podium
                                </h2>

                                <div className="flex items-end justify-center space-x-4">
                                    {/* 2ème place */}
                                    <div className="text-center">
                                        <div className="bg-gray-300 rounded-lg p-4 h-24 flex items-end justify-center">
                                            <div className="text-center">
                                                <div className="text-2xl mb-1">🥈</div>
                                                <div className="font-semibold text-sm">
                                                    {results.final_leaderboard[1]?.username}
                                                </div>
                                                <div className="text-xs text-gray-600">
                                                    {results.final_leaderboard[1]?.score} pts
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-sm font-medium">2ème</div>
                                    </div>

                                    {/* 1ère place */}
                                    <div className="text-center">
                                        <div className="bg-yellow-400 rounded-lg p-4 h-32 flex items-end justify-center">
                                            <div className="text-center">
                                                <div className="text-3xl mb-1">🥇</div>
                                                <div className="font-bold">
                                                    {results.final_leaderboard[0]?.username}
                                                </div>
                                                <div className="text-sm text-yellow-800">
                                                    {results.final_leaderboard[0]?.score} pts
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-lg font-bold text-yellow-600">1er</div>
                                    </div>

                                    {/* 3ème place */}
                                    <div className="text-center">
                                        <div className="bg-orange-400 rounded-lg p-4 h-20 flex items-end justify-center">
                                            <div className="text-center">
                                                <div className="text-xl mb-1">🥉</div>
                                                <div className="font-semibold text-sm">
                                                    {results.final_leaderboard[2]?.username}
                                                </div>
                                                <div className="text-xs text-orange-800">
                                                    {results.final_leaderboard[2]?.score} pts
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-sm font-medium">3ème</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Statistiques */}
                    <div className="space-y-6">

                        {/* Mes statistiques */}
                        {myStats && (
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <span className="mr-2">📊</span>
                                    Mes Statistiques
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Position finale:</span>
                                        <span className="font-semibold flex items-center">
                                            {getPositionEmoji(myStats.final_position)}
                                            {myStats.final_position}ème
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Score total:</span>
                                        <span className="font-semibold">{myStats.total_score} pts</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Masterminds terminés:</span>
                                        <span className="font-semibold">{myStats.masterminds_completed}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Meilleur temps:</span>
                                        <span className="font-semibold">{formatDuration(myStats.best_time)}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Objets utilisés:</span>
                                        <span className="font-semibold">{myStats.items_used}</span>
                                    </div>

                                    {myStats.favorite_item && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Objet favori:</span>
                                            <span className="font-semibold">{myStats.favorite_item}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Statistiques de la partie */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <span className="mr-2">🎮</span>
                                Statistiques Globales
                            </h3>

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Durée totale:</span>
                                    <span className="font-semibold">
                                        {formatDuration(results.game_stats.total_duration)}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-600">Masterminds joués:</span>
                                    <span className="font-semibold">{results.game_stats.total_masterminds}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tentatives totales:</span>
                                    <span className="font-semibold">{results.game_stats.total_attempts}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-600">Objets utilisés:</span>
                                    <span className="font-semibold">{results.game_stats.items_used}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-600">Joueurs participants:</span>
                                    <span className="font-semibold">{results.final_leaderboard.length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Bouton statistiques détaillées */}
                        <button
                            onClick={() => setShowDetailedStats(!showDetailedStats)}
                            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            {showDetailedStats ? '📊 Masquer' : '📊 Statistiques détaillées'}
                        </button>
                    </div>
                </div>

                {/* Statistiques détaillées (si ouvertes) */}
                {showDetailedStats && (
                    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            📈 Statistiques Détaillées par Joueur
                        </h2>

                        <div className="overflow-x-auto">
                            <table className="w-full table-auto">
                                <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-2">Pos.</th>
                                    <th className="text-left py-2">Joueur</th>
                                    <th className="text-right py-2">Score</th>
                                    <th className="text-right py-2">Masterminds</th>
                                    <th className="text-right py-2">Meilleur temps</th>
                                    <th className="text-right py-2">Objets</th>
                                </tr>
                                </thead>
                                <tbody>
                                {results.final_leaderboard.map((player, index) => {
                                    const stats = results.player_stats[player.user_id];
                                    return (
                                        <tr
                                            key={player.user_id}
                                            className={`border-b border-gray-100 ${
                                                player.user_id === user?.id ? 'bg-blue-50' : ''
                                            }`}
                                        >
                                            <td className="py-2">
                                                    <span className="flex items-center">
                                                        {getPositionEmoji(index + 1)}
                                                        {index + 1}
                                                    </span>
                                            </td>
                                            <td className="py-2 font-medium">
                                                {player.username}
                                                {player.user_id === user?.id && ' (vous)'}
                                            </td>
                                            <td className="py-2 text-right font-semibold">
                                                {stats?.total_score || player.score || 0}
                                            </td>
                                            <td className="py-2 text-right">
                                                {stats?.masterminds_completed || 0}
                                            </td>
                                            <td className="py-2 text-right">
                                                {stats?.best_time ? formatDuration(stats.best_time) : '-'}
                                            </td>
                                            <td className="py-2 text-right">
                                                {stats?.items_used || 0}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                    <button
                        onClick={() => navigate('/multiplayer/create')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        🎯 Nouvelle Partie
                    </button>

                    <button
                        onClick={() => navigate('/multiplayer/browse')}
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        🌐 Parcourir les Parties
                    </button>

                    <button
                        onClick={() => navigate('/modes')}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        🏠 Menu Principal
                    </button>
                </div>

                {/* Messages de félicitations */}
                {myPosition === 1 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
                        <div className="text-center">
                            <div className="text-4xl mb-3">🎉</div>
                            <h3 className="text-xl font-bold text-yellow-800 mb-2">
                                Félicitations pour cette victoire !
                            </h3>
                            <p className="text-yellow-700">
                                Vous avez dominé cette partie multijoueur avec brio.
                                Continuez comme ça et devenez un maître du Mastermind !
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};