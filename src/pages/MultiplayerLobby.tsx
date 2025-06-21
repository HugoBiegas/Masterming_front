import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import { PlayersList } from '@/components/multiplayer/PlayersList';
import { GameSettings } from '@/components/multiplayer/GameSettings';
import { ChatBox } from '@/components/multiplayer/ChatBox';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { multiplayerService } from '@/services/multiplayer';
import { GameStatus } from '@/types/game';

export const MultiplayerLobby: React.FC = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showSuccess, showError, showWarning } = useNotification();

    const {
        multiplayerGame,
        loading,
        error,
        isConnected,
        connectWebSocket,
        disconnectWebSocket
    } = useMultiplayer(gameId);

    const [isStarting, setIsStarting] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [gameInfo, setGameInfo] = useState<any>(null);
    const [chatMessages, setChatMessages] = useState<any[]>([]);

    // État de connexion WebSocket
    useEffect(() => {
        if (gameId && user?.access_token) {
            connectWebSocket();
        }

        return () => {
            disconnectWebSocket();
        };
    }, [gameId, user?.access_token]);

    // Redirection si la partie a commencé
    useEffect(() => {
        if (multiplayerGame?.base_game?.status === GameStatus.ACTIVE) {
            navigate(`/multiplayer/game/${gameId}`);
        }
    }, [multiplayerGame?.base_game?.status, gameId, navigate]);

    // Charger les informations de la partie
    useEffect(() => {
        const loadGameInfo = async () => {
            if (!gameId) return;

            try {
                const game = await multiplayerService.getMultiplayerGame(gameId);
                setGameInfo(game);
            } catch (error) {
                console.error('Erreur chargement info partie:', error);
            }
        };

        loadGameInfo();
    }, [gameId]);

    const handleStartGame = async () => {
        if (!gameId || !gameInfo) return;

        // Vérifier si l'utilisateur est le créateur
        if (gameInfo.base_game.creator_id !== user?.id) {
            showError('Seul le créateur peut démarrer la partie');
            return;
        }

        // Vérifier le nombre minimum de joueurs
        if (gameInfo.current_players < 2) {
            showError('Il faut au moins 2 joueurs pour démarrer');
            return;
        }

        setIsStarting(true);

        try {
            const response = await multiplayerService.startMultiplayerGame(gameId);

            if (response.success) {
                showSuccess('Partie démarrée !');
                // La redirection se fera automatiquement via l'effect sur le statut
            } else {
                showError(response.message || 'Erreur lors du démarrage');
            }
        } catch (error: any) {
            console.error('Erreur démarrage:', error);
            showError(error.response?.data?.detail || 'Impossible de démarrer la partie');
        } finally {
            setIsStarting(false);
        }
    };

    const handleLeaveGame = async () => {
        if (!gameId) return;

        setIsLeaving(true);

        try {
            await multiplayerService.leaveMultiplayerGame(gameId);
            showSuccess('Vous avez quitté la partie');
            navigate('/multiplayer/browse');
        } catch (error: any) {
            console.error('Erreur quitter partie:', error);
            showError(error.response?.data?.detail || 'Erreur lors de la sortie');
        } finally {
            setIsLeaving(false);
            setShowLeaveModal(false);
        }
    };

    const handleCopyRoomCode = () => {
        if (gameInfo?.base_game?.room_code) {
            navigator.clipboard.writeText(gameInfo.base_game.room_code);
            showSuccess('Code de room copié !');
        }
    };

    const handleCopyInviteLink = () => {
        const inviteUrl = `${window.location.origin}/multiplayer/join/${gameInfo?.base_game?.room_code}`;
        navigator.clipboard.writeText(inviteUrl);
        showSuccess('Lien d\'invitation copié !');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Chargement du lobby...</p>
                </div>
            </div>
        );
    }

    if (error || !gameInfo) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Partie introuvable</h2>
                    <p className="text-gray-600 mb-4">
                        {error || 'Impossible de charger les informations de la partie'}
                    </p>
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

    const isCreator = gameInfo.base_game.creator_id === user?.id;
    const canStart = isCreator && gameInfo.current_players >= 2;

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container mx-auto py-6 px-4">
                {/* En-tête du lobby */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="mb-4 lg:mb-0">
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                🎯 Lobby Multijoueur
                            </h1>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>Room: <code className="bg-gray-100 px-2 py-1 rounded font-mono">
                                    {gameInfo.base_game.room_code}
                                </code></span>
                                <span>Joueurs: {gameInfo.current_players}/{gameInfo.max_players}</span>
                                <div className={`flex items-center ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                                    <div className={`w-2 h-2 rounded-full mr-1 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    {isConnected ? 'Connecté' : 'Déconnecté'}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={handleCopyRoomCode}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                📋 Copier le code
                            </button>
                            <button
                                onClick={handleCopyInviteLink}
                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                                🔗 Lien d'invitation
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Panneau principal - Joueurs et paramètres */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Liste des joueurs */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">
                                👥 Joueurs connectés ({gameInfo.current_players}/{gameInfo.max_players})
                            </h2>
                            <PlayersList
                                players={multiplayerGame?.player_progresses || []}
                                currentUserId={user?.id}
                                creatorId={gameInfo.base_game.creator_id}
                            />
                        </div>

                        {/* Paramètres de la partie */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">
                                ⚙️ Paramètres de la partie
                            </h2>
                            <GameSettings
                                gameInfo={gameInfo}
                                isCreator={isCreator}
                            />
                        </div>
                    </div>

                    {/* Panneau latéral - Chat */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">
                                💬 Chat du lobby
                            </h2>
                            <ChatBox
                                gameId={gameId}
                                messages={chatMessages}
                                onSendMessage={(message) => {
                                    // TODO: Implémenter l'envoi de messages
                                    console.log('Message envoyé:', message);
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Barre d'actions */}
                <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">

                        {/* Informations de statut */}
                        <div className="text-sm text-gray-600">
                            {isCreator ? (
                                <span>🚀 Vous êtes le créateur. Démarrez quand vous êtes prêt !</span>
                            ) : (
                                <span>⏳ En attente que le créateur démarre la partie...</span>
                            )}
                        </div>

                        {/* Boutons d'action */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLeaveModal(true)}
                                disabled={isLeaving}
                                className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                            >
                                {isLeaving ? 'Sortie...' : '🚪 Quitter'}
                            </button>

                            {isCreator && (
                                <button
                                    onClick={handleStartGame}
                                    disabled={!canStart || isStarting}
                                    className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                                >
                                    {isStarting ? (
                                        <>
                                            <LoadingSpinner size="sm" className="mr-2" />
                                            Démarrage...
                                        </>
                                    ) : (
                                        '🚀 Démarrer la partie'
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Aides contextuelles */}
                    {isCreator && gameInfo.current_players < 2 && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                ⚠️ Il faut au moins 2 joueurs pour démarrer la partie.
                                Partagez le code <strong>{gameInfo.base_game.room_code}</strong> ou le lien d'invitation !
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de confirmation de sortie */}
            <Modal
                isOpen={showLeaveModal}
                onClose={() => setShowLeaveModal(false)}
                title="Quitter la partie"
            >
                <div className="p-6">
                    <p className="text-gray-600 mb-6">
                        Êtes-vous sûr de vouloir quitter cette partie ?
                        {isCreator && ' En tant que créateur, cela supprimera la partie pour tous les joueurs.'}
                    </p>

                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => setShowLeaveModal(false)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleLeaveGame}
                            disabled={isLeaving}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                            {isLeaving ? 'Sortie...' : 'Quitter'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};