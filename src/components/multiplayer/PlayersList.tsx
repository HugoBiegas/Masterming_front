import React from 'react';
import { PlayerProgress, PlayerStatus } from '@/types/multiplayer';

interface PlayersListProps {
    players: PlayerProgress[];
    currentUserId?: string;
    creatorId?: string;
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

    // Trier les joueurs par score décroissant
    const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

    if (players.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">👥</div>
                <p>Aucun joueur connecté</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {sortedPlayers.map((player, index) => (
                <div
                    key={player.user_id || player.id}
                    className={`rounded-lg border transition-all overflow-hidden ${
                        player.user_id === currentUserId
                            ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                            : 'border-gray-200 bg-white hover:shadow-sm hover:border-gray-300'
                    }`}
                >
                    {/* CORRECTION PRINCIPALE: Utilisation de flex avec overflow contrôlé */}
                    <div className="p-3">
                        <div className="flex items-start justify-between gap-3">
                            {/* Section principale gauche avec flex-1 et min-width */}
                            <div className="flex items-start space-x-3 min-w-0 flex-1">
                                {/* Position et statut (flex-shrink-0 pour éviter le rétrécissement) */}
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center font-bold text-xs">
                                        {index + 1}
                                    </div>
                                    <span className="text-lg">
                                        {getStatusIcon(player.status)}
                                    </span>
                                </div>

                                {/* Informations du joueur avec contrôle d'overflow */}
                                <div className="min-w-0 flex-1">
                                    {/* Nom et badges avec wrap contrôlé */}
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        {/* Nom avec truncate pour éviter le débordement */}
                                        <span className="font-semibold text-gray-800 truncate">
                                            {player.username}
                                        </span>

                                        {/* Badges avec flex-shrink-0 */}
                                        <div className="flex items-center gap-1 flex-wrap">
                                            {(player.is_creator || player.user_id === creatorId) && (
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium flex-shrink-0">
                                                    👑
                                                </span>
                                            )}
                                            {player.user_id === currentUserId && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium flex-shrink-0">
                                                    Vous
                                                </span>
                                            )}
                                            {player.is_winner && (
                                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium flex-shrink-0">
                                                    🏆
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Statut avec couleur et truncate */}
                                    <div className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(player.status)}`}>
                                        <span className="truncate">
                                            {getStatusLabel(player.status)}
                                        </span>
                                    </div>

                                    {/* Informations de progression si demandées */}
                                    {showProgress && (
                                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-600 flex-wrap">
                                            <span className="flex-shrink-0">
                                                M{(player as any).current_mastermind || 1}/{(player as any).completed_masterminds || 0}
                                            </span>
                                            <span className="flex-shrink-0">
                                                {player.attempts_count || 0} tent.
                                            </span>
                                            {(player as any).finish_time && (
                                                <span className="flex-shrink-0">
                                                    Fini à {new Date((player as any).finish_time).toLocaleTimeString()}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section droite - Statistiques (flex-shrink-0) */}
                            <div className="flex flex-col text-right text-sm flex-shrink-0 min-w-0">
                                <div className="font-bold text-purple-600 truncate">
                                    {player.score || 0} pts
                                </div>
                                {showProgress && (
                                    <div className="text-xs text-gray-500">
                                        Rang #{index + 1}
                                    </div>
                                )}

                                {/* Affichage des objets si demandé */}
                                {showItems && (player as any).items && (player as any).items.length > 0 && (
                                    <div className="flex items-center justify-end space-x-1 mt-1">
                                        <span className="text-xs text-gray-500">🎁</span>
                                        <span className="text-xs text-gray-500">
                                            {(player as any).items.length}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mode compact - moins d'informations affichées */}
                        {compactMode && (
                            <div className="flex justify-between items-center text-xs text-gray-500 mt-1 pt-1 border-t border-gray-100">
                                <span>Rejoint {new Date(player.joined_at).toLocaleTimeString()}</span>
                                {player.finished_at && (
                                    <span>Terminé {new Date(player.finished_at).toLocaleTimeString()}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* Statistiques en bas */}
            {players.length > 0 && !compactMode && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm text-gray-600 flex-wrap gap-2">
                        <span className="flex-shrink-0">
                            Total: {players.length} joueur{players.length > 1 ? 's' : ''}
                        </span>
                        {showProgress && (
                            <span className="flex-shrink-0">
                                Terminés: {players.filter(p =>
                                p.status === 'finished' || p.status === 'active' || p.status === PlayerStatus.FINISHED
                            ).length}
                            </span>
                        )}
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
        <div className={`p-3 rounded-lg border overflow-hidden ${
            isCurrentUser ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
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
                            M{(player as any).current_mastermind || 1}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayersList;