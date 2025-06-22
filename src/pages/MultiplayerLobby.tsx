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

export const MultiplayerLobby: React.FC = () => {
    const { roomCode } = useParams<{ roomCode: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showSuccess, showError, showWarning } = useNotification();

    const {
        currentRoom,
        players,
        loading,
        error,
        isHost,
        canStart,
        isGameActive,
        startGame,
        leaveRoom,
        refreshRoom
    } = useMultiplayer(roomCode);


    const [isStarting, setIsStarting] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [chatMessages, setChatMessages] = useState<any[]>([]);

    // Redirection si la partie a commencé
    useEffect(() => {
        if (isGameActive) {
            navigate(`/multiplayer/rooms/${roomCode}`);
        }
    }, [isGameActive, roomCode, navigate]);

    // Démarrer la partie
    const handleStartGame = async () => {
        if (!currentRoom || !canStart) return;

        setIsStarting(true);
        try {
            await startGame();
            showSuccess('🚀 Partie démarrée !');
        } catch (error: any) {
            console.error('Erreur démarrage:', error);
            showError('Erreur lors du démarrage de la partie');
        } finally {
            setIsStarting(false);
        }
    };

    // Quitter le salon
    const handleLeaveRoom = async () => {
        setIsLeaving(true);
        try {
            await leaveRoom();
            showSuccess('Vous avez quitté le salon');
            navigate('/multiplayer/browse');
        } catch (error: any) {
            console.error('Erreur en quittant:', error);
            showError('Erreur lors de la sortie du salon');
        } finally {
            setIsLeaving(false);
            setShowLeaveModal(false);
        }
    };

    // Copier le code du salon
    const handleCopyRoomCode = () => {
        if (currentRoom?.room_code) {
            navigator.clipboard.writeText(currentRoom.room_code);
            showSuccess('Code du salon copié !');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Chargement du salon...</p>
                </div>
            </div>
        );
    }

    if (error || !currentRoom) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur</h2>
                    <p className="text-gray-600 mb-4">{error || 'Salon introuvable'}</p>
                    <button
                        onClick={() => navigate('/multiplayer/browse')}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                    >
                        Retour aux salons
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <Header />

            <div className="container mx-auto py-6 px-4">

                {/* En-tête du salon */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                🏠 Salon : {currentRoom.name}
                            </h1>
                            <p className="text-gray-600">
                                Code du salon : <span className="font-mono font-bold">{currentRoom.room_code}</span>
                            </p>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={handleCopyRoomCode}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center"
                                title="Copier le code du salon"
                            >
                                📋 Copier le code
                            </button>

                            <button
                                onClick={() => setShowLeaveModal(true)}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                                🚪 Quitter
                            </button>
                        </div>
                    </div>

                    {/* Statut et informations */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                currentRoom.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                                    currentRoom.status === 'active' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800'
                            }`}>
                                {multiplayerService.getRoomStatusIcon(currentRoom)} {multiplayerService.getRoomStatusText(currentRoom)}
                            </span>

                            <span className="text-sm text-gray-600">
                                👥 {currentRoom.current_players}/{currentRoom.max_players} joueurs
                            </span>

                            {isHost && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                    👑 Hôte
                                </span>
                            )}
                        </div>

                        {/* Actions de l'hôte */}
                        {isHost && currentRoom.status === 'waiting' && (
                            <button
                                onClick={handleStartGame}
                                disabled={!canStart || isStarting}
                                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                title={canStart ? 'Démarrer la partie' : 'Minimum 2 joueurs requis'}
                            >
                                {isStarting ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        Démarrage...
                                    </>
                                ) : (
                                    <>
                                        ▶️ Démarrer la partie
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Paramètres du salon */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                ⚙️ Paramètres
                            </h2>
                            <GameSettings
                                gameInfo={{
                                    base_game: {
                                        difficulty: currentRoom.difficulty,
                                        room_code: currentRoom.room_code,
                                        is_private: currentRoom.is_private,
                                        created_at: currentRoom.created_at
                                    },
                                    max_players: currentRoom.max_players,
                                    total_masterminds: 1, // Valeur par défaut
                                    items_enabled: false, // Valeur par défaut
                                    current_players: currentRoom.current_players,
                                    game_type: currentRoom.game_type
                                }}
                                isCreator={isHost}
                                readOnly={true}
                            />
                        </div>

                        {/* Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-800 mb-2">ℹ️ Instructions :</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• Attendez que l'hôte démarre la partie</li>
                                <li>• Minimum 2 joueurs requis</li>
                                <li>• Partagez le code du salon avec vos amis</li>
                                {isHost && <li>• En tant qu'hôte, vous pouvez démarrer quand vous êtes prêt</li>}
                            </ul>
                        </div>
                    </div>

                    {/* Liste des joueurs */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    👥 Joueurs ({currentRoom.current_players}/{currentRoom.max_players})
                                </h2>

                                <button
                                    onClick={refreshRoom}
                                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                                    title="Actualiser la liste"
                                >
                                    🔄 Actualiser
                                </button>
                            </div>

                            <PlayersList
                                players={players}
                                currentUserId={user?.id}
                                showProgress={false}
                                creatorId={''}
                            />

                            {/* Slots vides */}
                            {currentRoom.current_players < currentRoom.max_players && (
                                <div className="mt-4 space-y-2">
                                    {Array.from({
                                        length: currentRoom.max_players - currentRoom.current_players
                                    }, (_, index) => (
                                        <div
                                            key={index}
                                            className="p-3 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500"
                                        >
                                            <span className="text-lg">👤</span>
                                            <span className="ml-2 text-sm">En attente d'un joueur...</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Chat (si activé) */}
                        {currentRoom.enable_chat && (
                            <div className="bg-white rounded-lg shadow-lg mt-6">
                                <ChatBox
                                    messages={chatMessages}
                                    onSendMessage={(message) => {
                                        // TODO: Implémenter l'envoi de message
                                        console.log('Envoi message:', message);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de confirmation de sortie */}
            <Modal
                isOpen={showLeaveModal}
                onClose={() => setShowLeaveModal(false)}
                title="🚪 Quitter le salon"
            >
                <div className="p-6">
                    <p className="text-gray-600 mb-4">
                        Êtes-vous sûr de vouloir quitter ce salon ?
                    </p>
                    {isHost && (
                        <p className="text-sm text-orange-600 mb-6">
                            ⚠️ En tant qu'hôte, quitter le salon peut affecter les autres joueurs.
                        </p>
                    )}
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setShowLeaveModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleLeaveRoom}
                            disabled={isLeaving}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                        >
                            {isLeaving ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Sortie...
                                </>
                            ) : (
                                'Confirmer'
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};