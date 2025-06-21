import React from 'react';
import { PlayerProgress, PlayerStatus } from '@/types/multiplayer';

interface PlayersListProps {
    players: PlayerProgress[];
    currentUserId?: string;
    creatorId: string;
    showProgress?: boolean;
    showItems?: boolean;
    compactMode?: boolean;
}

export const PlayersList: React.FC<PlayersListProps> = ({
                                                            players,
                                                            currentUserId,
                                                            creatorId,
                                                            showProgress = false,
                                                            showItems = false,
                                                            compactMode = false
                                                        }) => {

    const getStatusIcon = (status: PlayerStatus) => {
        switch (status) {
            case PlayerStatus.WAITING:
                return '⏳';
            case PlayerStatus.PLAYING:
                return '🎮';
            case PlayerStatus.MASTERMIND_COMPLETE:
                return '✅';
            case PlayerStatus.FINISHED:
                return '🏆';
            case PlayerStatus.ELIMINATED:
                return '❌';
            default:
                return '👤';
        }
    };

    const getStatusLabel = (status: PlayerStatus) => {
        switch (status) {
            case PlayerStatus.WAITING:
                return 'En attente';
            case PlayerStatus.PLAYING:
                return 'En jeu';
            case PlayerStatus.MASTERMIND_COMPLETE:
                return 'Mastermind terminé';
            case PlayerStatus.FINISHED:
                return 'Terminé';
            case PlayerStatus.ELIMINATED:
                return 'Éliminé';
            default:
                return 'Inconnu';
        }
    };

    const getStatusColor = (status: PlayerStatus) => {
        switch (status) {
            case PlayerStatus.WAITING:
                return 'text-yellow-600 bg-yellow-50';
            case PlayerStatus.PLAYING:
                return 'text-blue-600 bg-blue-50';
            case PlayerStatus.MASTERMIND_COMPLETE:
                return 'text-green-600 bg-green-50';
            case PlayerStatus.FINISHED:
                return 'text-purple-600 bg-purple-50';
            case PlayerStatus.ELIMINATED:
                return 'text-red-600 bg-red-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    const sortedPlayers = [...players].sort((a, b) => {
        // Créateur en premier
        if (a.user_id === creatorId) return -1;
        if (b.user_id === creatorId) return 1;

        // Utilisateur actuel ensuite
        if (a.user_id === currentUserId) return -1;
        if (b.user_id === currentUserId) return 1;

        // Puis par score décroissant
        return (b.score || 0) - (a.score || 0);
    });

    if (compactMode) {
        return (
            <div className="flex flex-wrap gap-2">
                {sortedPlayers.map((player, index) => (
                    <div
                        key={player.user_id}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
                            player.user_id === currentUserId
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 bg-white'
                        }`}
                    >
                        <span className="text-lg">{getStatusIcon(player.status)}</span>
                        <span className="font-medium">
                            {player.username}
                            {player.user_id === creatorId && ' 👑'}
                            {player.user_id === currentUserId && ' (vous)'}
                        </span>
                        {showProgress && (
                            <span className="text-sm text-gray-500">
                                {player.score || 0}pts
                            </span>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {sortedPlayers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">👥</div>
                    <p>Aucun joueur connecté</p>
                </div>
            ) : (
                sortedPlayers.map((player, index) => (
                    <div
                        key={player.user_id}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                            player.user_id === currentUserId
                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                : 'border-gray-200 bg-white hover:shadow-sm'
                        }`}
                    >
                        <div className="flex items-center space-x-4">
                            {/* Position et statut */}
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-sm">
                                    {index + 1}
                                </div>
                                <span className="text-xl">{getStatusIcon(player.status)}</span>
                            </div>

                            {/* Informations du joueur */}
                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-gray-800">
                                        {player.username}
                                    </span>

                                    {/* Badges */}
                                    <div className="flex items-center space-x-1">
                                        {player.user_id === creatorId && (
                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                                                👑 Créateur
                                            </span>
                                        )}
                                        {player.user_id === currentUserId && (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                                Vous
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Statut et progression */}
                                <div className="flex items-center space-x-3 mt-1">
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(player.status)}`}>
                                        {getStatusLabel(player.status)}
                                    </span>

                                    {showProgress && (
                                        <>
                                            <span className="text-sm text-gray-600">
                                                Mastermind {player.current_mastermind || 1}
                                            </span>
                                            <span className="text-sm text-gray-600">
                                                {player.attempts_count || 0} tentatives
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Score et informations supplémentaires */}
                        <div className="text-right">
                            <div className="font-bold text-lg text-gray-800">
                                {player.score || 0}
                                <span className="text-sm text-gray-500 ml-1">pts</span>
                            </div>

                            {showItems && player.items && player.items.length > 0 && (
                                <div className="flex items-center space-x-1 mt-1">
                                    <span className="text-xs text-gray-500">Objets:</span>
                                    <div className="flex space-x-1">
                                        {player.items.slice(0, 3).map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="w-4 h-4 bg-purple-100 rounded-full flex items-center justify-center"
                                                title={item.item_type}
                                            >
                                                <span className="text-xs">🎁</span>
                                            </div>
                                        ))}
                                        {player.items.length > 3 && (
                                            <span className="text-xs text-gray-400">+{player.items.length - 3}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {showProgress && player.finish_time && (
                                <div className="text-xs text-gray-500 mt-1">
                                    Terminé à {new Date(player.finish_time).toLocaleTimeString()}
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}

            {/* Statistiques en bas */}
            {players.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Total: {players.length} joueur{players.length > 1 ? 's' : ''}</span>
                        {showProgress && (
                            <span>
                                Terminés: {players.filter(p => p.status === PlayerStatus.FINISHED).length}
                            </span>
                        )}
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
    return (
        <div className={`p-3 rounded-lg border ${
            isCurrentUser ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
        }`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <span className="font-medium">{player.username}</span>
                    {isCreator && <span>👑</span>}
                    {isCurrentUser && <span className="text-xs text-blue-600">(vous)</span>}
                </div>

                {showDetails && (
                    <div className="text-right text-sm">
                        <div className="font-medium">{player.score || 0} pts</div>
                        <div className="text-gray-500">M{player.current_mastermind || 1}</div>
                    </div>
                )}
            </div>
        </div>
    );
};