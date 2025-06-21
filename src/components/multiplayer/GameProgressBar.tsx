import React from 'react';
import { PlayerProgress, PlayerStatus } from '@/types/multiplayer';

interface GameProgressBarProps {
    currentMastermind: number;
    totalMasterminds: number;
    playerProgresses: PlayerProgress[];
    currentUserId?: string;
    showPlayerDetails?: boolean;
}

export const GameProgressBar: React.FC<GameProgressBarProps> = ({
                                                                    currentMastermind,
                                                                    totalMasterminds,
                                                                    playerProgresses,
                                                                    currentUserId,
                                                                    showPlayerDetails = true
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

    const getStatusColor = (status: PlayerStatus) => {
        switch (status) {
            case PlayerStatus.WAITING:
                return 'text-yellow-600';
            case PlayerStatus.PLAYING:
                return 'text-blue-600';
            case PlayerStatus.MASTERMIND_COMPLETE:
                return 'text-green-600';
            case PlayerStatus.FINISHED:
                return 'text-purple-600';
            case PlayerStatus.ELIMINATED:
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    // Calculer les statistiques
    const activePlayers = playerProgresses.filter(p =>
        p.status !== PlayerStatus.ELIMINATED && p.status !== PlayerStatus.FINISHED
    );
    const finishedPlayers = playerProgresses.filter(p => p.status === PlayerStatus.FINISHED);
    const eliminatedPlayers = playerProgresses.filter(p => p.status === PlayerStatus.ELIMINATED);

    // Progression globale de la partie (basée sur le mastermind actuel)
    const globalProgress = ((currentMastermind - 1) / totalMasterminds) * 100;

    return (
        <div className="space-y-4">

            {/* Barre de progression principale */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">
                        Progression de la partie
                    </span>
                    <span className="text-gray-600">
                        Mastermind {currentMastermind} / {totalMasterminds}
                    </span>
                </div>

                <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                            className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out relative"
                            style={{ width: `${globalProgress}%` }}
                        >
                            {/* Indicateur de position actuelle */}
                            {globalProgress > 0 && (
                                <div className="absolute right-0 top-0 h-full w-1 bg-blue-800 rounded-r-full"></div>
                            )}
                        </div>
                    </div>

                    {/* Marqueurs des masterminds */}
                    <div className="absolute top-0 left-0 w-full h-3 flex justify-between items-center px-1">
                        {Array.from({ length: totalMasterminds - 1 }, (_, i) => (
                            <div
                                key={i}
                                className="w-px h-2 bg-white opacity-50"
                                style={{ marginLeft: i === 0 ? '0' : 'auto' }}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Statistiques des joueurs */}
            {showPlayerDetails && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Joueurs actifs */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-800">
                                Joueurs actifs
                            </span>
                            <span className="text-blue-600">🎮</span>
                        </div>
                        <div className="text-xl font-bold text-blue-800">
                            {activePlayers.length}
                        </div>
                        {activePlayers.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {activePlayers.slice(0, 3).map((player) => (
                                    <span
                                        key={player.user_id}
                                        className={`text-xs px-2 py-1 rounded-full border ${
                                            player.user_id === currentUserId
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-blue-700 border-blue-300'
                                        }`}
                                    >
                                        {player.username}
                                    </span>
                                ))}
                                {activePlayers.length > 3 && (
                                    <span className="text-xs text-blue-600">
                                        +{activePlayers.length - 3}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Joueurs terminés */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-purple-800">
                                Terminés
                            </span>
                            <span className="text-purple-600">🏆</span>
                        </div>
                        <div className="text-xl font-bold text-purple-800">
                            {finishedPlayers.length}
                        </div>
                        {finishedPlayers.length > 0 && (
                            <div className="mt-2">
                                <div className="text-xs text-purple-700">
                                    1er: {finishedPlayers[0]?.username}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Joueurs éliminés */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-red-800">
                                Éliminés
                            </span>
                            <span className="text-red-600">❌</span>
                        </div>
                        <div className="text-xl font-bold text-red-800">
                            {eliminatedPlayers.length}
                        </div>
                        {eliminatedPlayers.length > 0 && (
                            <div className="mt-2 text-xs text-red-700">
                                {eliminatedPlayers.length} joueur{eliminatedPlayers.length > 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Progression détaillée par joueur */}
            {showPlayerDetails && playerProgresses.length > 0 && (
                <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                        Progression individuelle
                    </div>

                    <div className="space-y-2">
                        {playerProgresses
                            .sort((a, b) => (b.score || 0) - (a.score || 0))
                            .map((player, index) => {
                                const playerProgress = ((player.current_mastermind || 1) - 1) / totalMasterminds * 100;
                                const isCurrentUser = player.user_id === currentUserId;

                                return (
                                    <div
                                        key={player.user_id}
                                        className={`flex items-center space-x-3 p-2 rounded-lg ${
                                            isCurrentUser ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                                        }`}
                                    >
                                        {/* Position et statut */}
                                        <div className="flex items-center space-x-2 w-16">
                                            <span className="text-sm font-medium text-gray-600">
                                                #{index + 1}
                                            </span>
                                            <span className={`text-lg ${getStatusColor(player.status)}`}>
                                                {getStatusIcon(player.status)}
                                            </span>
                                        </div>

                                        {/* Nom et informations */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <span className={`font-medium truncate ${
                                                    isCurrentUser ? 'text-blue-800' : 'text-gray-800'
                                                }`}>
                                                    {player.username}
                                                    {isCurrentUser && ' (vous)'}
                                                </span>
                                                <span className="text-sm text-gray-600">
                                                    M{player.current_mastermind || 1}
                                                </span>
                                            </div>

                                            {/* Barre de progression individuelle */}
                                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                                <div
                                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                                        isCurrentUser ? 'bg-blue-600' : 'bg-gray-400'
                                                    }`}
                                                    style={{ width: `${Math.max(5, playerProgress)}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Score */}
                                        <div className="text-right w-16">
                                            <div className={`font-bold ${
                                                isCurrentUser ? 'text-blue-800' : 'text-gray-800'
                                            }`}>
                                                {player.score || 0}
                                            </div>
                                            <div className="text-xs text-gray-500">pts</div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* Indicateurs de fin de partie */}
            {currentMastermind === totalMasterminds && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                        <span className="text-yellow-600 text-lg">⚡</span>
                        <span className="font-medium text-yellow-800">
                            Dernier mastermind ! La partie se termine bientôt.
                        </span>
                    </div>
                </div>
            )}

            {/* Temps estimé restant */}
            {activePlayers.length > 0 && currentMastermind < totalMasterminds && (
                <div className="text-center text-sm text-gray-500">
                    <span>⏱️ Temps estimé restant: </span>
                    <span className="font-medium">
                        {Math.round((totalMasterminds - currentMastermind + 1) * 3)} minutes
                    </span>
                </div>
            )}
        </div>
    );
};

// Composant simplifié pour les petits espaces
export const CompactProgressBar: React.FC<{
    currentMastermind: number;
    totalMasterminds: number;
    className?: string;
}> = ({ currentMastermind, totalMasterminds, className = '' }) => {
    const progress = ((currentMastermind - 1) / totalMasterminds) * 100;

    return (
        <div className={`space-y-1 ${className}`}>
            <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Progression</span>
                <span>{currentMastermind}/{totalMasterminds}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
};