import React from 'react';
import { PlayerProgress, PlayerStatus } from '@/types/multiplayer';

interface PlayersListProps {
    players: PlayerProgress[];
    currentUserId?: string;
    creatorId?: string;
    showProgress?: boolean;
    showItems?: boolean;
    compactMode?: boolean;
    className?: string;
}

export const PlayersList: React.FC<PlayersListProps> = ({
                                                            players,
                                                            currentUserId,
                                                            creatorId,
                                                            showProgress = false,
                                                            showItems = false,
                                                            compactMode = false,
                                                            className = ""
                                                        }) => {

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'waiting':
            case PlayerStatus.WAITING:
                return '⏳';
            case 'playing':
            case 'active':
            case PlayerStatus.PLAYING:
                return '🎮';
            case 'mastermind_complete':
            case PlayerStatus.MASTERMIND_COMPLETE:
                return '✅';
            case 'finished':
            case PlayerStatus.FINISHED:
                return '🏆';
            case 'eliminated':
            case PlayerStatus.ELIMINATED:
                return '❌';
            case 'disconnected':
                return '📶';
            case 'spectating':
                return '👁️';
            default:
                return '👤';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'waiting':
            case PlayerStatus.WAITING:
                return 'En attente';
            case 'playing':
            case 'active':
            case PlayerStatus.PLAYING:
                return 'En jeu';
            case 'mastermind_complete':
            case PlayerStatus.MASTERMIND_COMPLETE:
                return 'Mastermind terminé';
            case 'finished':
            case PlayerStatus.FINISHED:
                return 'Terminé';
            case 'eliminated':
            case PlayerStatus.ELIMINATED:
                return 'Éliminé';
            case 'disconnected':
                return 'Déconnecté';
            case 'spectating':
                return 'Spectateur';
            default:
                return 'Inconnu';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'waiting':
            case PlayerStatus.WAITING:
                return 'text-yellow-600 bg-yellow-50';
            case 'playing':
            case 'active':
            case PlayerStatus.PLAYING:
                return 'text-blue-600 bg-blue-50';
            case 'mastermind_complete':
            case PlayerStatus.MASTERMIND_COMPLETE:
                return 'text-green-600 bg-green-50';
            case 'finished':
            case PlayerStatus.FINISHED:
                return 'text-purple-600 bg-purple-50';
            case 'eliminated':
            case PlayerStatus.ELIMINATED:
                return 'text-red-600 bg-red-50';
            case 'disconnected':
                return 'text-gray-600 bg-gray-50';
            case 'spectating':
                return 'text-indigo-600 bg-indigo-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    const sortedPlayers = [...players].sort((a, b) => {
        // Créateur en premier
        if (a.is_creator && !b.is_creator) return -1;
        if (!a.is_creator && b.is_creator) return 1;

        // Puis par score décroissant
        return (b.score || 0) - (a.score || 0);
    });

    if (compactMode) {
        return (
            <div className={`space-y-2 ${className}`}>
                {sortedPlayers.map((player) => (
                    <PlayerCard
                        key={player.user_id}
                        player={player}
                        isCurrentUser={player.user_id === currentUserId}
                        isCreator={player.user_id === creatorId || player.is_creator}
                        showDetails={showProgress}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center">
                        👥 Joueurs ({players.length})
                    </h3>
                    {showProgress && (
                        <div className="text-sm bg-blue-400 bg-opacity-50 px-2 py-1 rounded">
                            Actifs: {players.filter(p => ['playing', 'active'].includes(p.status)).length}
                        </div>
                    )}
                </div>
            </div>

            {/* Liste des joueurs */}
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {sortedPlayers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">👥</div>
                        <p>Aucun joueur</p>
                    </div>
                ) : (
                    sortedPlayers.map((player) => (
                        <div
                            key={player.user_id}
                            className={`p-3 rounded-lg border transition-all ${
                                player.user_id === currentUserId
                                    ? 'border-blue-500 bg-blue-50 shadow-md'
                                    : 'border-gray-200 bg-white hover:shadow-sm'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                {/* Info joueur */}
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <span className="text-xl flex-shrink-0">
                                        {getStatusIcon(player.status)}
                                    </span>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-medium text-gray-900 truncate">
                                                {player.username}
                                            </span>

                                            {/* Badges */}
                                            <div className="flex items-center space-x-1">
                                                {(player.is_creator || player.user_id === creatorId) && (
                                                    <span className="text-yellow-500" title="Créateur">👑</span>
                                                )}
                                                {player.user_id === currentUserId && (
                                                    <span className="text-xs text-blue-600 bg-blue-100 px-1 rounded">
                                                        Vous
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Statut */}
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(player.status)}`}>
                                                {getStatusLabel(player.status)}
                                            </span>

                                            {showProgress && (
                                                <span className="text-xs text-gray-500">
                                                    Mastermind {(player.current_mastermind as number) || 1}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Statistiques */}
                                <div className="flex flex-col items-end text-sm text-gray-600 flex-shrink-0">
                                    <span className="font-semibold text-gray-900">
                                        {player.score || 0} pts
                                    </span>
                                    {showProgress && (
                                        <span className="text-xs">
                                            {player.attempts_count || 0} tentatives
                                        </span>
                                    )}
                                    {showItems && player.items && player.items.length > 0 && (
                                        <span className="text-xs text-purple-600">
                                            {player.items.length} objets
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer avec statistiques globales */}
            {showProgress && players.length > 0 && (
                <div className="border-t border-gray-200 p-3 bg-gray-50 rounded-b-lg">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                        <span className="flex-shrink-0">
                            Joueurs actifs: {players.filter(p => ['playing', 'active'].includes(p.status)).length}
                        </span>
                        <span className="flex-shrink-0">
                            Terminés: {players.filter(p =>
                            ['finished', 'mastermind_complete'].includes(p.status) ||
                            p.status === PlayerStatus.FINISHED
                        ).length}
                        </span>
                        <span className="flex-shrink-0">
                            Score moyen: {Math.round((players.reduce((sum, p) => sum + (p.score || 0), 0) / players.length) || 0)} pts
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

// Composant pour afficher un joueur individuel de manière compacte
export const PlayerCard: React.FC<{
    player: PlayerProgress;
    isCurrentUser?: boolean;
    isCreator?: boolean;
    showDetails?: boolean;
}> = ({
          player,
          isCurrentUser = false,
          isCreator = false,
          showDetails = false
      }) => {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'waiting': return '⏳';
            case 'playing':
            case 'active': return '🎮';
            case 'finished': return '🏆';
            case 'eliminated': return '❌';
            case 'disconnected': return '📶';
            default: return '👤';
        }
    };

    return (
        <div className={`p-3 rounded-lg border overflow-hidden transition-all ${
            isCurrentUser ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:shadow-sm'
        }`}>
            <div className="flex items-center justify-between min-w-0">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <span className="text-lg flex-shrink-0">
                        {getStatusIcon(player.status)}
                    </span>
                    <span className="font-medium truncate">
                        {player.username}
                    </span>
                    <div className="flex items-center space-x-1 flex-wrap">
                        {isCreator && <span className="flex-shrink-0">👑</span>}
                        {isCurrentUser && (
                            <span className="text-xs text-blue-600 flex-shrink-0">(vous)</span>
                        )}
                    </div>
                </div>

                {showDetails && (
                    <div className="text-right text-sm flex-shrink-0">
                        <div className="font-medium">{player.score || 0} pts</div>
                        <div className="text-gray-500 text-xs">
                            M{(player.current_mastermind as number) || 1}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayersList;
