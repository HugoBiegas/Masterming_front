import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import { useNotification } from '@/contexts/NotificationContext';
import { multiplayerService } from '@/services/multiplayer';
import {
    GameRoom,
    LobbyFilters,
    Difficulty,
    JoinRoomRequest
} from '@/types/multiplayer';
import {GameStatus, GameType} from '@/types/game';

export const MultiplayerBrowse: React.FC = () => {
    const navigate = useNavigate();
    const { showSuccess, showError, showInfo } = useNotification();

    const [rooms, setRooms] = useState<GameRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [hasNext, setHasNext] = useState(false);

    // Filtres
    const [filters, setFilters] = useState<LobbyFilters>({
        status: 'waiting' as GameStatus,
    });

    // États pour rejoindre une partie
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<GameRoom | null>(null);
    const [password, setPassword] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    // État pour rejoindre par code
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [roomCode, setRoomCode] = useState('');
    const [isSearchingByCode, setIsSearchingByCode] = useState(false);

    // Recherche
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Charger les salons publics
    const loadRooms = async (resetPage = false) => {
        try {
            const currentPage = resetPage ? 1 : page;
            setLoading(true);

            const response = await multiplayerService.getLobbyRooms(
                filters, currentPage, 10
            );

            if (resetPage) {
                setRooms(response.rooms);
                setPage(1);
            } else {
                setRooms(prev => {
                    const currentRooms = Array.isArray(prev) ? prev : [];
                    const newRooms = Array.isArray(response?.rooms) ? response.rooms : [];
                    return currentPage === 1 ? newRooms : [...currentRooms, ...newRooms];
                });
            }

            setTotalPages(Math.ceil(response.total / 10));
            setHasNext(response.has_more);

        } catch (error: any) {
            console.error('Erreur chargement salons:', error);
            showError('Erreur lors du chargement des salons');
        } finally {
            setLoading(false);
        }
    };

    // Rechercher des salons
    const searchRooms = async () => {
        if (!searchQuery.trim()) {
            await loadRooms(true);
            return;
        }

        try {
            setIsSearching(true);
            const results = await multiplayerService.searchRooms(searchQuery, filters);
            setRooms(Array.isArray(results) ? results : []);
            setPage(1);
            setHasNext(false);
        } catch (error: any) {
            console.error('Erreur recherche:', error);
            showError('Erreur lors de la recherche');
        } finally {
            setIsSearching(false);
        }
    };

    // Charger au montage
    useEffect(() => {
        loadRooms(true);
    }, [filters]);

    // Recherche en temps réel avec debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery !== '') {
                searchRooms();
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Rejoindre un salon
    const handleJoinRoom = async () => {
        if (!selectedRoom) return;

        if (selectedRoom.is_private && !password.trim()) {
            showError('Mot de passe requis pour ce salon privé');
            return;
        }

        setIsJoining(true);
        try {
            const request: JoinRoomRequest = {
                room_code: selectedRoom.room_code,
                password: selectedRoom.is_private ? password : undefined
            };

            const room = await multiplayerService.joinRoom(request);
            if (room) {
                showSuccess('Salon rejoint avec succès !');
                navigate(`/multiplayer/lobby/${room.id}`);
            }
        } catch (error: any) {
            console.error('Erreur rejoindre salon:', error);
            showError(error.message || 'Impossible de rejoindre le salon');
        } finally {
            setIsJoining(false);
            setShowJoinModal(false);
            setPassword('');
        }
    };

    // Rejoindre par code de salon
    const handleJoinByCode = async () => {
        if (!roomCode.trim()) {
            showError('Veuillez entrer un code de salon');
            return;
        }

        setIsSearchingByCode(true);
        try {
            const request: JoinRoomRequest = {
                room_code: roomCode.trim(),
                password: password || undefined
            };

            const room = await multiplayerService.joinRoom(request);
            if (room) {
                showSuccess('Salon rejoint avec succès !');
                navigate(`/multiplayer/lobby/${room.id}`);
            }
        } catch (error: any) {
            console.error('Erreur recherche par code:', error);
            showError('Code de salon invalide ou salon introuvable');
        } finally {
            setIsSearchingByCode(false);
            setShowCodeModal(false);
            setRoomCode('');
            setPassword('');
        }
    };

    const handleRoomSelect = (room: GameRoom) => {
        setSelectedRoom(room);
        setShowJoinModal(true);
    };

    const getDifficultyColor = (difficulty: Difficulty) => {
        switch (difficulty) {
            case Difficulty.EASY: return 'bg-green-100 text-green-800';
            case Difficulty.MEDIUM: return 'bg-yellow-100 text-yellow-800';
            case Difficulty.HARD: return 'bg-orange-100 text-orange-800';
            case Difficulty.EXPERT: return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getDifficultyLabel = (difficulty: Difficulty) => {
        switch (difficulty) {
            case Difficulty.EASY: return 'Facile';
            case Difficulty.MEDIUM: return 'Moyen';
            case Difficulty.HARD: return 'Difficile';
            case Difficulty.EXPERT: return 'Expert';
            default: return 'Inconnu';
        }
    };

    const getGameTypeIcon = (gameType: GameType) => {
        switch (gameType) {
            case GameType.CLASSIC: return '🎯';
            case GameType.QUANTUM: return '⚛️';
            case GameType.SPEED: return '⚡';
            case GameType.PRECISION: return '🎪';
            default: return '🎮';
        }
    };

    const getGameTypeLabel = (gameType: GameType) => {
        switch (gameType) {
            case GameType.CLASSIC: return 'Classique';
            case GameType.QUANTUM: return 'Quantique';
            case GameType.SPEED: return 'Rapidité';
            case GameType.PRECISION: return 'Précision';
            default: return 'Standard';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container mx-auto py-6 px-4">

                {/* En-tête avec actions */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                    <div className="mb-4 lg:mb-0">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            🌐 Salons Multijoueur
                        </h1>
                        <p className="text-gray-600">
                            Rejoignez un salon en cours ou créez le vôtre !
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => setShowCodeModal(true)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center"
                        >
                            🔗 Rejoindre par code
                        </button>

                        <button
                            onClick={() => navigate('/multiplayer/create')}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                        >
                            ➕ Créer un salon
                        </button>
                    </div>
                </div>

                {/* Barre de recherche et filtres */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Recherche */}
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Rechercher des salons..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Filtres */}
                        <div className="flex gap-3">
                            <select
                                value={filters.difficulty || ''}
                                onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value as Difficulty || undefined }))}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Toutes difficultés</option>
                                <option value={Difficulty.EASY}>Facile</option>
                                <option value={Difficulty.MEDIUM}>Moyen</option>
                                <option value={Difficulty.HARD}>Difficile</option>
                                <option value={Difficulty.EXPERT}>Expert</option>
                            </select>

                            <select
                                value={filters.game_type || ''}
                                onChange={(e) => setFilters(prev => ({ ...prev, game_type: e.target.value as GameType || undefined }))}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Tous types</option>
                                <option value={GameType.CLASSIC}>Classique</option>
                                <option value={GameType.QUANTUM}>Quantique</option>
                                <option value={GameType.SPEED}>Rapidité</option>
                                <option value={GameType.PRECISION}>Précision</option>
                            </select>

                            <button
                                onClick={() => loadRooms(true)}
                                disabled={loading || isSearching}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                            >
                                🔄 Actualiser
                            </button>
                        </div>
                    </div>
                </div>

                {/* Liste des salons */}
                <div className="space-y-4">
                    {loading && (!rooms || rooms.length === 0) ? (
                        <div className="text-center py-12">
                            <LoadingSpinner size="lg" />
                            <p className="mt-4 text-gray-600">Chargement des salons...</p>
                        </div>
                    ) : (!rooms || rooms.length === 0) ? (
                        <div className="text-center py-12 bg-white rounded-lg shadow-md">
                            <div className="text-6xl mb-4">🎯</div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                Aucun salon trouvé
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Soyez le premier à créer un salon multijoueur !
                            </p>
                            <button
                                onClick={() => navigate('/multiplayer/create')}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                ➕ Créer un salon
                            </button>
                        </div>
                    ) : (
                        (rooms || []).map((room) => (
                            <div
                                key={room.id}
                                onClick={() => handleRoomSelect(room)}
                                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                            >
                                <div className="flex items-center justify-between">

                                    {/* Informations principales */}
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-800">
                                                {room.name}
                                            </h3>
                                            {room.is_private && <span className="text-lg">🔒</span>}
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${getDifficultyColor(room.difficulty)}`}>
                                                {getDifficultyLabel(room.difficulty)}
                                            </span>
                                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full font-medium">
                                                {getGameTypeIcon(room.game_type)} {getGameTypeLabel(room.game_type)}
                                            </span>
                                        </div>

                                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                                            <span>👥 {room.current_players}/{room.max_players} joueurs</span>
                                            <span>👤 Créé par {room.creator.username}</span>
                                            <span>💬 Chat {room.enable_chat ? 'activé' : 'désactivé'}</span>
                                            <span>👁️ Spectateurs {room.allow_spectators ? 'autorisés' : 'interdits'}</span>
                                        </div>
                                    </div>

                                    {/* Statut et actions */}
                                    <div className="flex items-center space-x-4">
                                        <div className="text-center">
                                            <div className="text-2xl">{multiplayerService.getRoomStatusIcon(room)}</div>
                                            <div className="text-xs text-gray-500">{multiplayerService.getRoomStatusText(room)}</div>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRoomSelect(room);
                                            }}
                                            disabled={!multiplayerService.canJoinRoom(room)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {room.is_private ? '🔑 Rejoindre' : '🚀 Rejoindre'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Bouton charger plus */}
                    {hasNext && !loading && (
                        <div className="text-center pt-6">
                            <button
                                onClick={() => {
                                    setPage(prev => prev + 1);
                                    loadRooms();
                                }}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Charger plus de salons
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal pour rejoindre un salon */}
            <Modal
                isOpen={showJoinModal}
                onClose={() => setShowJoinModal(false)}
                title={`Rejoindre "${selectedRoom?.name}"`}
            >
                <div className="p-6">
                    {selectedRoom && (
                        <>
                            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>Difficulté: <strong>{getDifficultyLabel(selectedRoom.difficulty)}</strong></div>
                                    <div>Joueurs: <strong>{selectedRoom.current_players}/{selectedRoom.max_players}</strong></div>
                                    <div>Type: <strong>{getGameTypeLabel(selectedRoom.game_type)}</strong></div>
                                    <div>Chat: <strong>{selectedRoom.enable_chat ? 'Activé' : 'Désactivé'}</strong></div>
                                    <div>Spectateurs: <strong>{selectedRoom.allow_spectators ? 'Autorisés' : 'Interdits'}</strong></div>
                                    <div>Statut: <strong>{multiplayerService.getRoomStatusText(selectedRoom)}</strong></div>
                                </div>
                            </div>

                            {selectedRoom.is_private && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mot de passe du salon
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="Entrez le mot de passe"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                                    />
                                </div>
                            )}

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowJoinModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleJoinRoom}
                                    disabled={isJoining || !multiplayerService.canJoinRoom(selectedRoom)}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                                >
                                    {isJoining ? (
                                        <>
                                            <LoadingSpinner size="sm" className="mr-2" />
                                            Connexion...
                                        </>
                                    ) : (
                                        'Rejoindre'
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            {/* Modal pour rejoindre par code */}
            <Modal
                isOpen={showCodeModal}
                onClose={() => setShowCodeModal(false)}
                title="🔗 Rejoindre par code de salon"
            >
                <div className="p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Code du salon
                        </label>
                        <input
                            type="text"
                            placeholder="Entrez le code du salon"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                            maxLength={8}
                        />
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={() => setShowCodeModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleJoinByCode}
                            disabled={isSearchingByCode || !roomCode.trim()}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                        >
                            {isSearchingByCode ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Recherche...
                                </>
                            ) : (
                                'Rejoindre'
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};