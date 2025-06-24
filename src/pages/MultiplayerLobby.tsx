import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import { PlayersList } from '@/components/multiplayer/PlayersList';
import { RealTimeChat } from '@/components/multiplayer/RealTimeChat';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';

export const MultiplayerLobby: React.FC = () => {
    const { roomCode } = useParams<{ roomCode: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showSuccess, showError, showWarning } = useNotification();

    // Hook multiplayer pour les données
    const {
        currentRoom,
        players,
        loading,
        error,
        isGameActive,
        startGame,
        leaveRoom,
        refreshRoom
    } = useMultiplayer(roomCode);

    // Hook WebSocket pour la communication temps réel
    const { isConnected: wsConnected, wsService } = useWebSocket(roomCode);

    const isHost = currentRoom?.creator?.id === user?.id;

    // CORRECTION: Amélioration de la validation canStart pour supporter plus de 8 joueurs
    const canStart = useMemo(() => {
        if (!isHost || !currentRoom) return false;
        return players.length >= 2 && players.length <= currentRoom.max_players && currentRoom.status === 'waiting';
    }, [isHost, players.length, currentRoom?.max_players, currentRoom?.status]);

    const [isStarting, setIsStarting] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);

    // NOUVEAUX ÉTATS : Gestion d'affichage pour les grandes parties
    const [showAllPlayers, setShowAllPlayers] = useState(false);
    const [playersViewMode, setPlayersViewMode] = useState<'grid' | 'list'>('grid');

    // NOUVEAU : Configuration d'affichage intelligente selon le nombre de joueurs
    const playersDisplayConfig = useMemo(() => {
        const count = players.length;

        if (count <= 8) {
            return {
                mode: 'normal' as const,
                showToggle: false,
                maxVisible: count,
                columns: Math.min(count, 4)
            };
        } else if (count <= 20) {
            return {
                mode: 'compact' as const,
                showToggle: true,
                maxVisible: showAllPlayers ? count : 12,
                columns: 4
            };
        } else {
            return {
                mode: 'ultra-compact' as const,
                showToggle: true,
                maxVisible: showAllPlayers ? count : 16,
                columns: playersViewMode === 'list' ? 1 : 6
            };
        }
    }, [players.length, showAllPlayers, playersViewMode]);

    // CORRECTION : Démarrage de partie avec WebSocket
    const handleStartGame = useCallback(async () => {
        if (!canStart || isStarting) {
            showWarning('Conditions non remplies pour démarrer la partie');
            return;
        }

        try {
            setIsStarting(true);
            showSuccess('🚀 Démarrage de la partie...');

            console.log('🎮 Starting game for room:', roomCode);

            // NOUVELLE APPROCHE : Utiliser l'API REST + WebSocket
            const success = await startGame();

            if (success) {
                console.log('✅ Game started via API');

                // Le WebSocket devrait automatiquement notifier le changement d'état
                // Forcer un refresh après un délai pour s'assurer qu'on a l'état à jour
                setTimeout(async () => {
                    await refreshRoom();
                    console.log('🔄 Room state refreshed after game start');
                }, 2000);

                showSuccess('🎉 Partie démarrée avec succès !');
            } else {
                throw new Error('Échec du démarrage de la partie');
            }
        } catch (err: any) {
            console.error('❌ Erreur démarrage partie:', err);
            showError(err.message || 'Impossible de démarrer la partie');
        } finally {
            setIsStarting(false);
        }
    }, [canStart, isStarting, startGame, refreshRoom, showSuccess, showWarning, showError, roomCode]);

    // CORRECTION : Redirection automatique si la partie devient active
    useEffect(() => {
        if (isGameActive && roomCode) {
            console.log('🎮 Game became active, redirecting to game room');
            showSuccess('🎮 Redirection vers la partie...');

            // Redirection avec un délai pour laisser le temps aux notifications
            setTimeout(() => {
                navigate(`/multiplayer/game/${roomCode}`, { replace: true });
            }, 1500);
        }
    }, [isGameActive, roomCode, navigate, showSuccess]);

    // Écouter les événements WebSocket spécifiques au lobby
    useEffect(() => {
        if (!wsService) return;

        const handleGameStarted = (data: any) => {
            console.log('🎮 Game started via WebSocket:', data);
            showSuccess('🎮 La partie a commencé !');

            // Rafraîchir les données pour obtenir le nouvel état
            setTimeout(() => {
                refreshRoom();
            }, 1000);
        };

        const handlePlayerJoined = (data: any) => {
            console.log('👤 Player joined via WebSocket:', data);
            // Rafraîchir la liste des joueurs
            refreshRoom();
        };

        const handlePlayerLeft = (data: any) => {
            console.log('👤 Player left via WebSocket:', data);
            // Rafraîchir la liste des joueurs
            refreshRoom();
        };

        // Écouter les événements
        wsService.on('game_started', handleGameStarted);
        wsService.on('player_joined', handlePlayerJoined);
        wsService.on('player_left', handlePlayerLeft);

        return () => {
            // Nettoyer les listeners
            wsService.off('game_started', handleGameStarted);
            wsService.off('player_joined', handlePlayerJoined);
            wsService.off('player_left', handlePlayerLeft);
        };
    }, [wsService, refreshRoom, showSuccess]);

    // Quitter la room
    const handleLeaveRoom = useCallback(async () => {
        if (isLeaving) return;

        try {
            setIsLeaving(true);
            setShowLeaveModal(false);

            // Notifier via WebSocket d'abord
            if (wsService) {
                wsService.leaveGameRoom();
            }

            // Puis quitter via l'API
            await leaveRoom();
            showSuccess('Vous avez quitté le salon');
            navigate('/multiplayer');
        } catch (err: any) {
            console.error('Erreur sortie:', err);
            showError(err.message || 'Erreur lors de la sortie');
        } finally {
            setIsLeaving(false);
        }
    }, [isLeaving, leaveRoom, navigate, showSuccess, showError, wsService]);

    // Gestion des erreurs
    useEffect(() => {
        if (error) {
            console.error('MultiplayerLobby error:', error);
            showError(error);
        }
    }, [error, showError]);

    // NOUVEAU : Rendu de la section joueurs avec gestion intelligente
    const renderPlayersSection = () => {
        const { mode, showToggle, maxVisible } = playersDisplayConfig;
        const visiblePlayers = players.slice(0, maxVisible);
        const hiddenCount = players.length - maxVisible;

        return (
            <div className="space-y-4">
                {/* En-tête avec contrôles d'affichage */}
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">
                        👥 Joueurs ({players.length}/{currentRoom?.max_players || '?'})
                        {players.length > 20 && (
                            <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Grande partie
                            </span>
                        )}
                    </h3>

                    {/* Contrôles d'affichage pour les grandes parties */}
                    {mode === 'ultra-compact' && (
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setPlayersViewMode(playersViewMode === 'grid' ? 'list' : 'grid')}
                                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            >
                                {playersViewMode === 'grid' ? '📋 Liste' : '⚏ Grille'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Affichage adaptatif des joueurs */}
                {mode === 'normal' ? (
                    // Affichage normal pour <= 8 joueurs (votre composant existant)
                    <PlayersList
                        players={players}
                        currentUserId={user?.id}
                        creatorId={currentRoom?.creator?.id}
                        showProgress={false}
                        showItems={false}
                        compactMode={false}
                    />
                ) : (
                    // Affichage customisé pour les grandes parties
                    <div className={`
                        ${playersViewMode === 'list'
                        ? 'space-y-2'
                        : `grid gap-3 ${
                            mode === 'compact' ? 'grid-cols-3 lg:grid-cols-4' :
                                'grid-cols-4 lg:grid-cols-6'
                        }`
                    }
                    `}>
                        {visiblePlayers.map((player, index) => (
                            <PlayerCard
                                key={player.user_id}
                                player={player}
                                currentUserId={user?.id}
                                creatorId={currentRoom?.creator?.id}
                                mode={mode}
                                viewMode={playersViewMode}
                                position={index + 1}
                            />
                        ))}
                    </div>
                )}

                {/* Toggle pour afficher plus/moins de joueurs */}
                {showToggle && hiddenCount > 0 && (
                    <div className="text-center">
                        <button
                            onClick={() => setShowAllPlayers(!showAllPlayers)}
                            className="px-4 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors"
                        >
                            {showAllPlayers
                                ? `🔼 Masquer ${hiddenCount} joueur${hiddenCount > 1 ? 's' : ''}`
                                : `🔽 Afficher ${hiddenCount} joueur${hiddenCount > 1 ? 's' : ''} de plus`
                            }
                        </button>
                    </div>
                )}

                {/* Statistiques pour les grandes parties */}
                {players.length > 10 && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">👥 Total:</span>
                                <span className="font-medium ml-1">{players.length}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">✅ Prêts:</span>
                                <span className="font-medium ml-1 text-green-600">
                                    {players.filter(p => p.is_ready).length}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600">⏳ En attente:</span>
                                <span className="font-medium ml-1 text-orange-600">
                                    {players.filter(p => !p.is_ready).length}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600">🔒 Places restantes:</span>
                                <span className="font-medium ml-1">
                                    {(currentRoom?.max_players || 0) - players.length}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // États de chargement et d'erreur
    if (!roomCode) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-2xl font-bold text-red-800 mb-2">Code de salon manquant</h2>
                    <button
                        onClick={() => navigate('/multiplayer')}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Retour au multijoueur
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Chargement du salon...</p>
                    <p className="text-sm text-gray-500 mt-2">Code: {roomCode}</p>
                    <div className="mt-4 flex items-center justify-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm">
                            WebSocket: {wsConnected ? 'Connecté' : 'Déconnecté'}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentRoom) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">🚪</div>
                    <h2 className="text-2xl font-bold text-red-800 mb-2">Salon introuvable</h2>
                    <p className="text-red-600 mb-4">Le salon "{roomCode}" n'existe pas ou n'est plus disponible.</p>
                    <div className="space-x-4">
                        <button
                            onClick={() => navigate('/multiplayer/browse')}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Parcourir les salons
                        </button>
                        <button
                            onClick={() => navigate('/multiplayer')}
                            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Retour
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <Header />

            <div className="container mx-auto px-4 py-6">
                {/* Header du salon avec statut WebSocket */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                                🏠 Salon {currentRoom.name}
                                <span className="ml-2 text-lg text-blue-600">#{roomCode}</span>
                                <div className="ml-3 flex items-center space-x-1">
                                    <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <span className="text-sm text-gray-500">
                                        {wsConnected ? 'Temps réel' : 'Hors ligne'}
                                    </span>
                                </div>
                            </h1>
                            <p className="text-gray-600 mt-1">
                                {currentRoom.difficulty} • {currentRoom.max_players} joueurs max • {currentRoom.total_masterminds} masterminds
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            {isHost && (
                                <button
                                    onClick={handleStartGame}
                                    disabled={!canStart || isStarting}
                                    className={`px-6 py-2 rounded-lg font-medium transition-all ${
                                        canStart && !isStarting
                                            ? 'bg-green-600 text-white hover:bg-green-700 hover:scale-105'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    {isStarting ? '⏳ Démarrage...' : '🚀 Démarrer la partie'}
                                </button>
                            )}
                            <button
                                onClick={() => setShowLeaveModal(true)}
                                disabled={isLeaving}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {isLeaving ? '⏳ Sortie...' : '🚪 Quitter'}
                            </button>
                        </div>
                    </div>

                    {/* Informations contextuelles */}
                    {!canStart && isHost && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-yellow-800 text-sm">
                                ⚠️ Il faut au moins 2 joueurs pour démarrer la partie. Actuellement : {players.length}/{currentRoom.max_players}
                            </p>
                        </div>
                    )}

                    {!isHost && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-blue-800 text-sm">
                                ℹ️ En attente que {currentRoom.creator?.username || 'le créateur'} démarre la partie...
                            </p>
                        </div>
                    )}

                    {!wsConnected && (
                        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-orange-800 text-sm">
                                ⚡ Connexion temps réel en cours... Les messages et notifications peuvent être retardés.
                            </p>
                        </div>
                    )}

                    {/* NOUVEAU : Performance warning pour très grandes parties */}
                    {players.length > 30 && (
                        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-orange-800 text-sm">
                                🚀 <strong>Grande partie détectée!</strong>
                                Pour une meilleure expérience avec {players.length} joueurs,
                                assurez-vous d'avoir une connexion internet stable.
                            </p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Liste des joueurs avec affichage intelligent */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        {renderPlayersSection()}
                    </div>

                    {/* Chat temps réel avec WebSocket */}
                    <div>
                        <RealTimeChat roomCode={roomCode} />
                    </div>
                </div>

                {/* Informations de debug en développement */}
                {import.meta.env.DEV && (
                    <div className="mt-6 bg-gray-100 rounded-lg p-4">
                        <h3 className="font-bold text-gray-800 mb-2">🔧 Debug Info</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <strong>Room Status:</strong> {currentRoom.status}<br />
                                <strong>Game Active:</strong> {isGameActive ? 'Yes' : 'No'}<br />
                                <strong>Can Start:</strong> {canStart ? 'Yes' : 'No'}<br />
                                <strong>Is Host:</strong> {isHost ? 'Yes' : 'No'}
                            </div>
                            <div>
                                <strong>WebSocket:</strong> {wsConnected ? 'Connected' : 'Disconnected'}<br />
                                <strong>Players:</strong> {players.length}/{currentRoom.max_players}<br />
                                <strong>Room Code:</strong> {roomCode}<br />
                                <strong>User ID:</strong> {user?.id}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de confirmation de sortie */}
            <Modal
                isOpen={showLeaveModal}
                onClose={() => setShowLeaveModal(false)}
                title="Quitter le salon"
            >
                <div className="p-6">
                    <p className="text-gray-600 mb-6">
                        Êtes-vous sûr de vouloir quitter le salon ? Les autres joueurs seront notifiés en temps réel.
                    </p>
                    <div className="flex justify-end space-x-4">
                        <button
                            onClick={() => setShowLeaveModal(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleLeaveRoom}
                            disabled={isLeaving}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            {isLeaving ? 'Sortie...' : 'Quitter'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// NOUVEAU : Composant PlayerCard pour l'affichage compact des grandes parties
interface PlayerCardProps {
    player: any;
    currentUserId?: string;
    creatorId?: string;
    mode: 'compact' | 'ultra-compact';
    viewMode: 'grid' | 'list';
    position: number;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
                                                   player,
                                                   currentUserId,
                                                   creatorId,
                                                   mode,
                                                   viewMode,
                                                   position
                                               }) => {
    const isCurrentUser = player.user_id === currentUserId;
    const isCreator = player.user_id === creatorId;

    if (viewMode === 'list') {
        return (
            <div className={`
                flex items-center justify-between p-3 rounded-lg
                ${isCurrentUser ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50 hover:bg-gray-100'}
                transition-colors
            `}>
                <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500 w-6">#{position}</span>
                    <div className={`w-3 h-3 rounded-full ${player.is_ready ? 'bg-green-500' : 'bg-orange-400'}`} />
                    <span className="font-medium">{player.username}</span>
                    {isCreator && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">👑 Hôte</span>}
                    {isCurrentUser && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Vous</span>}
                </div>
                <span className={`text-sm ${player.is_ready ? 'text-green-600' : 'text-orange-600'}`}>
                    {player.is_ready ? '✅ Prêt' : '⏳ En attente'}
                </span>
            </div>
        );
    }

    return (
        <div className={`
            ${mode === 'ultra-compact' ? 'p-2' : 'p-3'} rounded-lg text-center
            ${isCurrentUser ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50 hover:bg-gray-100'}
            transition-colors
        `}>
            <div className={`w-${mode === 'ultra-compact' ? '2' : '3'} h-${mode === 'ultra-compact' ? '2' : '3'} rounded-full mx-auto mb-2 ${player.is_ready ? 'bg-green-500' : 'bg-orange-400'}`} />
            <p className={`font-medium ${mode === 'ultra-compact' ? 'text-xs' : 'text-sm'} truncate`}>
                {player.username}
            </p>
            {mode !== 'ultra-compact' && (
                <>
                    {isCreator && <span className="text-xs text-purple-600">👑</span>}
                    {isCurrentUser && <span className="text-xs text-blue-600">Vous</span>}
                </>
            )}
        </div>
    );
};

export default MultiplayerLobby;