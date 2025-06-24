import React, { useState, useEffect, useCallback } from 'react';
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
    const canStart = isHost && players.length >= 2 && players.length <= (currentRoom?.max_players || 8);

    const [isStarting, setIsStarting] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);

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
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Liste des joueurs */}
                    <div>
                        <PlayersList
                            players={players}
                            currentUserId={user?.id}
                            creatorId={currentRoom.creator?.id}
                            showProgress={false}
                            showItems={false}
                            compactMode={false}
                        />
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

export default MultiplayerLobby;
