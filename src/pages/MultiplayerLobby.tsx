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
import { MULTIPLAYER_DIFFICULTY_CONFIGS, ITEM_CONFIGS } from '@/utils/multiplayerConstants';

// Interface pour les messages de chat
interface ChatMessage {
    id: string;
    user_id: string;
    username: string;
    message: string;
    timestamp: string;
    type: 'user' | 'system' | 'game';
    is_creator?: boolean;
}

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
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

    // État pour la connexion WebSocket (simulation pour le tchat)
    const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
    const [wsConnectionAttempts, setWsConnectionAttempts] = useState(0);

    // Redirection si la partie a commencé
    useEffect(() => {
        if (isGameActive) {
            navigate(`/multiplayer/rooms/${roomCode}`);
        }
    }, [isGameActive, roomCode, navigate]);

    // Simulation de connexion WebSocket pour le tchat
    useEffect(() => {
        if (currentRoom && user && wsConnectionAttempts < 3) {
            const connectWebSocket = async () => {
                try {
                    // Simulation d'une connexion WebSocket
                    setWsConnectionAttempts(prev => prev + 1);

                    // Simuler un délai de connexion
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    setIsWebSocketConnected(true);

                    // Message système de connexion
                    const systemMessage: ChatMessage = {
                        id: `system_${Date.now()}`,
                        user_id: 'system',
                        username: 'Système',
                        message: `${user.username} a rejoint le salon`,
                        timestamp: new Date().toISOString(),
                        type: 'system'
                    };
                    setChatMessages(prev => [...prev, systemMessage]);

                    showSuccess('💬 Chat connecté !');
                } catch (error) {
                    console.error('Erreur connexion WebSocket:', error);
                    if (wsConnectionAttempts < 2) {
                        showWarning('Tentative de reconnexion au chat...');
                        setTimeout(() => connectWebSocket(), 2000);
                    } else {
                        showError('Impossible de connecter le chat');
                    }
                }
            };

            connectWebSocket();
        }
    }, [currentRoom, user, wsConnectionAttempts, showSuccess, showError, showWarning]);

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

    // Gestionnaire pour envoyer un message de chat
    const handleSendMessage = (message: string) => {
        if (!user || !isWebSocketConnected) {
            showError('Chat non connecté');
            return;
        }

        const newMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            user_id: user.id,
            username: user.username,
            message: message,
            timestamp: new Date().toISOString(),
            type: 'user',
            is_creator: currentRoom?.creator.id === user.id
        };

        setChatMessages(prev => [...prev, newMessage]);

        // TODO: Envoyer le message via WebSocket réel
        console.log('Message envoyé:', message);
    };

    // Rafraîchir les données
    const handleRefresh = async () => {
        try {
            await refreshRoom();
            showSuccess('Données actualisées');
        } catch (error) {
            showError('Erreur lors de l\'actualisation');
        }
    };

    // Obtenir les informations de configuration dynamiques
    const getGameConfigInfo = () => {
        if (!currentRoom) return null;

        const difficulty = currentRoom.difficulty;
        const difficultyConfig = MULTIPLAYER_DIFFICULTY_CONFIGS[difficulty as keyof typeof MULTIPLAYER_DIFFICULTY_CONFIGS];

        return {
            difficultyConfig,
            totalMasterminds: currentRoom.total_masterminds || 3,
            itemsEnabled: currentRoom.items_enabled || false,
            itemsPerMastermind: currentRoom.items_per_mastermind || 1,
            estimatedDuration: difficultyConfig ? (difficultyConfig.timeLimit * (currentRoom.total_masterminds || 3)) / 60 : 15
        };
    };

    // Obtenir la liste des objets disponibles
    const getAvailableItems = () => {
        if (!currentRoom?.items_enabled) return [];

        return Object.entries(ITEM_CONFIGS).map(([type, config]) => ({
            type,
            ...config
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <Header />
                <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
                    <div className="text-center">
                        <LoadingSpinner size="lg" />
                        <p className="mt-4 text-gray-600">Chargement du salon...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !currentRoom) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <Header />
                <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
                    <div className="text-center">
                        <div className="text-6xl mb-4">😕</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Salon introuvable</h2>
                        <p className="text-gray-600 mb-6">{error || 'Le salon demandé n\'existe pas ou n\'est plus accessible.'}</p>
                        <button
                            onClick={() => navigate('/multiplayer/browse')}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Retour aux salons
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const configInfo = getGameConfigInfo();
    const availableItems = getAvailableItems();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <Header />

            <div className="container mx-auto px-4 py-8">
                {/* En-tête du salon */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                🎮 {currentRoom.name}
                            </h1>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    📋 {currentRoom.room_code}
                                </span>
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                    👥 {players.length}/{currentRoom.max_players} joueurs
                                </span>
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                    🎯 {configInfo?.totalMasterminds || 3} masterminds
                                </span>
                                {configInfo?.estimatedDuration && (
                                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                        ⏱️ ~{Math.round(configInfo.estimatedDuration)} min
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleCopyRoomCode}
                                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
                            >
                                <span>📋</span>
                                <span>Copier code</span>
                            </button>

                            <button
                                onClick={handleRefresh}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                            >
                                <span>🔄</span>
                                <span>Actualiser</span>
                            </button>

                            <button
                                onClick={() => setShowLeaveModal(true)}
                                disabled={isLeaving}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center space-x-2"
                            >
                                <span>🚪</span>
                                <span>{isLeaving ? 'Sortie...' : 'Quitter'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Status de connexion WebSocket */}
                    <div className="flex items-center space-x-2 text-sm">
                        <div className={`w-3 h-3 rounded-full ${isWebSocketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className={isWebSocketConnected ? 'text-green-700' : 'text-red-700'}>
                            {isWebSocketConnected ? 'Chat connecté' : 'Chat déconnecté'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Configuration et informations */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Configuration de base */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">⚙️ Configuration de la partie</h2>
                                <button
                                    onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
                                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                    {showAdvancedConfig ? 'Masquer détails' : 'Voir détails'}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div className="text-center p-3 bg-blue-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">{configInfo?.difficultyConfig?.colors || 6}</div>
                                    <div className="text-sm text-gray-600">Couleurs</div>
                                </div>
                                <div className="text-center p-3 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">{configInfo?.difficultyConfig?.pegs || 8}</div>
                                    <div className="text-sm text-gray-600">Positions</div>
                                </div>
                                <div className="text-center p-3 bg-orange-50 rounded-lg">
                                    <div className="text-2xl font-bold text-orange-600">{configInfo?.difficultyConfig?.maxAttempts || 12}</div>
                                    <div className="text-sm text-gray-600">Tentatives max</div>
                                </div>
                                <div className="text-center p-3 bg-purple-50 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">{configInfo?.totalMasterminds || 3}</div>
                                    <div className="text-sm text-gray-600">Masterminds</div>
                                </div>
                            </div>

                            {/* Configuration avancée */}
                            {showAdvancedConfig && (
                                <div className="border-t pt-4 mt-4 space-y-4">
                                    <h3 className="font-medium text-gray-800 mb-3">📊 Configuration avancée</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Type de partie */}
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <span className="text-lg">🎮</span>
                                                <div>
                                                    <div className="font-medium text-gray-800">Type de partie</div>
                                                    <div className="text-sm text-gray-600">
                                                        {currentRoom.game_type_display || 'Multi Mastermind'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Système d'objets */}
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <span className="text-lg">🎁</span>
                                                <div>
                                                    <div className="font-medium text-gray-800">Objets bonus/malus</div>
                                                    <div className="text-sm text-gray-600">
                                                        {configInfo?.itemsEnabled
                                                            ? `Activés (${configInfo.itemsPerMastermind}/mastermind)`
                                                            : 'Désactivés'
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`w-3 h-3 rounded-full ${
                                                configInfo?.itemsEnabled ? 'bg-green-500' : 'bg-red-500'
                                            }`}></div>
                                        </div>

                                        {/* Mode quantique */}
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <span className="text-lg">⚛️</span>
                                                <div>
                                                    <div className="font-medium text-gray-800">Mode quantique</div>
                                                    <div className="text-sm text-gray-600">
                                                        {currentRoom.quantum_enabled ? 'Activé' : 'Désactivé'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`w-3 h-3 rounded-full ${
                                                currentRoom.quantum_enabled ? 'bg-green-500' : 'bg-red-500'
                                            }`}></div>
                                        </div>

                                        {/* Durée estimée */}
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <span className="text-lg">⏱️</span>
                                                <div>
                                                    <div className="font-medium text-gray-800">Durée estimée</div>
                                                    <div className="text-sm text-gray-600">
                                                        {configInfo?.estimatedDuration
                                                            ? `~${Math.round(configInfo.estimatedDuration)} minutes`
                                                            : 'Non calculée'
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Objets disponibles */}
                                    {configInfo?.itemsEnabled && availableItems.length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="font-medium text-gray-800 mb-2">🎁 Objets disponibles dans cette partie</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {availableItems.slice(0, 6).map((item) => (
                                                    <div key={item.type} className="flex items-center space-x-2 p-2 bg-purple-50 rounded">
                                                        <span className="text-sm">{item.icon}</span>
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium text-purple-800">{item.name}</div>
                                                            <div className="text-xs text-purple-600">{item.description}</div>
                                                        </div>
                                                        <span className={`text-xs px-1 py-0.5 rounded ${
                                                            item.rarity === 'common' ? 'bg-gray-200 text-gray-700' :
                                                                item.rarity === 'rare' ? 'bg-blue-200 text-blue-700' :
                                                                    item.rarity === 'epic' ? 'bg-purple-200 text-purple-700' :
                                                                        'bg-yellow-200 text-yellow-700'
                                                        }`}>
                                                            {item.rarity}
                                                        </span>
                                                    </div>
                                                ))}
                                                {availableItems.length > 6 && (
                                                    <div className="text-sm text-gray-500 text-center py-2">
                                                        +{availableItems.length - 6} autres objets...
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Liste des joueurs */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                👥 Joueurs ({players.length}/{currentRoom.max_players})
                            </h2>
                            <PlayersList
                                players={players}
                                showItems={configInfo?.itemsEnabled || false}
                                creatorId={''}
                            />
                        </div>

                        {/* Boutons d'action */}
                        {isHost && (
                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-1">🚀 Contrôles de la partie</h3>
                                        <p className="text-sm text-gray-600">
                                            {canStart
                                                ? 'Tous les joueurs sont prêts ! Vous pouvez démarrer la partie.'
                                                : `Attendez que tous les joueurs rejoignent (${players.length}/${currentRoom.max_players}).`
                                            }
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleStartGame}
                                        disabled={!canStart || isStarting}
                                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 min-w-[140px]"
                                    >
                                        {isStarting ? (
                                            <>
                                                <LoadingSpinner size="sm" />
                                                <span>Démarrage...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>🚀</span>
                                                <span>Démarrer</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chat en temps réel */}
                    <div className="bg-white rounded-lg shadow-lg p-6 h-fit">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">💬 Chat du salon</h2>
                            <div className="flex items-center space-x-2 text-sm">
                                <div className={`w-2 h-2 rounded-full ${isWebSocketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className={isWebSocketConnected ? 'text-green-700' : 'text-red-700'}>
                                    {isWebSocketConnected ? 'En ligne' : 'Hors ligne'}
                                </span>
                            </div>
                        </div>

                        <ChatBox
                            gameId={currentRoom.id}
                            messages={chatMessages}
                            onSendMessage={handleSendMessage}
                            disabled={!isWebSocketConnected}
                            maxHeight="400px"
                            showTimestamps={true}
                            placeholder={isWebSocketConnected ? "Tapez votre message..." : "Chat indisponible"}
                        />
                    </div>
                </div>
            </div>

            {/* Modal de confirmation de sortie */}
            {showLeaveModal && (
                <Modal
                    isOpen={showLeaveModal}
                    onClose={() => setShowLeaveModal(false)}
                    title="Quitter le salon"
                >
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            Êtes-vous sûr de vouloir quitter ce salon ? {isHost && 'En tant qu\'hôte, votre départ fermera le salon pour tous les joueurs.'}
                        </p>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowLeaveModal(false)}
                                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleLeaveRoom}
                                disabled={isLeaving}
                                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {isLeaving ? 'Sortie...' : 'Quitter'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};