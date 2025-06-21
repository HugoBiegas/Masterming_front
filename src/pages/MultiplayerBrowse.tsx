import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import { useNotification } from '@/contexts/NotificationContext';
import { multiplayerService } from '@/services/multiplayer';
import {
    PublicGameListing,
    MultiplayerGameFilters,
    Difficulty,
    JoinGameRequest
} from '@/types/multiplayer';

export const MultiplayerBrowse: React.FC = () => {
    const navigate = useNavigate();
    const { showSuccess, showError, showInfo } = useNotification();

    const [games, setGames] = useState<PublicGameListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [hasNext, setHasNext] = useState(false);

    // Filtres
    const [filters, setFilters] = useState<MultiplayerGameFilters>({
        has_slots: true,
        sort_by: 'created_at',
        sort_order: 'desc'
    });

    // États pour rejoindre une partie
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [selectedGame, setSelectedGame] = useState<PublicGameListing | null>(null);
    const [password, setPassword] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    // État pour rejoindre par code
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [roomCode, setRoomCode] = useState('');
    const [isSearchingByCode, setIsSearchingByCode] = useState(false);

    // Recherche
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Charger les parties publiques
    const loadGames = async (resetPage = false) => {
        try {
            const currentPage = resetPage ? 1 : page;
            setLoading(true);

            const response = await multiplayerService.getPublicGames(
                currentPage, 10, filters
            );

            if (resetPage) {
                setGames(response.games);
                setPage(1);
            } else {
                setGames(prev => currentPage === 1 ? response.games : [...prev, ...response.games]);
            }

            setTotalPages(Math.ceil(response.total / 10));
            setHasNext(response.has_next);

        } catch (error: any) {
            console.error('Erreur chargement parties:', error);
            showError('Impossible de charger les parties');
        } finally {
            setLoading(false);
        }
    };

    // Charger les parties au montage et quand les filtres changent
    useEffect(() => {
        loadGames(true);
    }, [filters]);

    // Recherche de parties
    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            loadGames(true);
            return;
        }

        setIsSearching(true);
        try {
            const results = await multiplayerService.searchGames(searchQuery);
            setGames(results);
        } catch (error) {
            console.error('Erreur recherche:', error);
            showError('Erreur lors de la recherche');
        } finally {
            setIsSearching(false);
        }
    };

    // Rejoindre une partie
    const handleJoinGame = async () => {
        if (!selectedGame) return;

        setIsJoining(true);
        try {
            const request: JoinGameRequest = {
                game_id: selectedGame.id,
                password: selectedGame.is_private ? password : undefined
            };

            const response = await multiplayerService.joinMultiplayerGame(request);

            if (response.success) {
                showSuccess('Partie rejointe avec succès !');
                navigate(`/multiplayer/lobby/${selectedGame.id}`);
            } else {
                showError(response.message || 'Impossible de rejoindre la partie');
            }
        } catch (error: any) {
            console.error('Erreur rejoindre partie:', error);
            showError(error.response?.data?.detail || 'Erreur lors de la connexion');
        } finally {
            setIsJoining(false);
            setShowJoinModal(false);
            setPassword('');
        }
    };

    // Rejoindre par code de room
    const handleJoinByCode = async () => {
        if (!roomCode.trim()) return;

        setIsSearchingByCode(true);
        try {
            const game = await multiplayerService.getGameByRoomCode(roomCode.toUpperCase());

            // Si trouvée, essayer de rejoindre
            const request: JoinGameRequest = {
                game_id: game.id,
                password: game.is_private ? password : undefined
            };

            const response = await multiplayerService.joinMultiplayerGame(request);

            if (response.success) {
                showSuccess('Partie rejointe avec succès !');
                navigate(`/multiplayer/lobby/${game.id}`);
            } else {
                showError(response.message || 'Impossible de rejoindre la partie');
            }
        } catch (error: any) {
            console.error('Erreur recherche par code:', error);
            showError('Code de room invalide ou partie introuvable');
        } finally {
            setIsSearchingByCode(false);
            setShowCodeModal(false);
            setRoomCode('');
            setPassword('');
        }
    };

    const handleGameSelect = (game: PublicGameListing) => {
        setSelectedGame(game);
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

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container mx-auto py-6 px-4">

                {/* En-tête avec actions */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                    <div className="mb-4 lg:mb-0">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            🌐 Parties Multijoueur
                        </h1>
                        <p className="text-gray-600">
                            Rejoignez une partie en cours ou créez la vôtre !
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setShowCodeModal(true)}
                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                            🔑 Rejoindre par code
                        </button>
                        <button
                            onClick={() => navigate('/multiplayer/create')}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            ➕ Créer une partie
                        </button>
                    </div>
                </div>

                {/* Barre de recherche et filtres */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">

                    {/* Recherche */}
                    <div className="flex gap-3 mb-4">
                        <input
                            type="text"
                            placeholder="Rechercher par nom d'utilisateur..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {isSearching ? <LoadingSpinner size="sm" /> : '🔍'}
                        </button>
                    </div>

                    {/* Filtres */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                        {/* Difficulté */}
                        <select
                            value={filters.difficulty || ''}
                            onChange={(e) => setFilters(prev => ({
                                ...prev,
                                difficulty: e.target.value as Difficulty || undefined
                            }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Toutes difficultés</option>
                            <option value={Difficulty.EASY}>Facile</option>
                            <option value={Difficulty.MEDIUM}>Moyen</option>
                            <option value={Difficulty.HARD}>Difficile</option>
                            <option value={Difficulty.EXPERT}>Expert</option>
                        </select>

                        {/* Nombre de joueurs max */}
                        <select
                            value={filters.max_players || ''}
                            onChange={(e) => setFilters(prev => ({
                                ...prev,
                                max_players: e.target.value ? parseInt(e.target.value) : undefined
                            }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tous tailles</option>
                            <option value="2">2 joueurs</option>
                            <option value="4">4 joueurs</option>
                            <option value="6">6 joueurs</option>
                            <option value="8">8 joueurs</option>
                            <option value="12">12 joueurs</option>
                        </select>

                        {/* Disponibilité */}
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={filters.has_slots || false}
                                onChange={(e) => setFilters(prev => ({
                                    ...prev,
                                    has_slots: e.target.checked
                                }))}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Places libres seulement</span>
                        </label>

                        {/* Tri */}
                        <select
                            value={`${filters.sort_by}_${filters.sort_order}`}
                            onChange={(e) => {
                                const [sort_by, sort_order] = e.target.value.split('_');
                                setFilters(prev => ({ ...prev, sort_by, sort_order: sort_order as "asc" | "desc" }));
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="created_at_desc">Plus récentes</option>
                            <option value="created_at_asc">Plus anciennes</option>
                            <option value="current_players_desc">Plus de joueurs</option>
                            <option value="current_players_asc">Moins de joueurs</option>
                        </select>
                    </div>
                </div>

                {/* Liste des parties */}
                <div className="space-y-4">
                    {loading && games.length === 0 ? (
                        <div className="flex justify-center py-12">
                            <div className="text-center">
                                <LoadingSpinner size="lg" />
                                <p className="mt-4 text-gray-600">Chargement des parties...</p>
                            </div>
                        </div>
                    ) : games.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg shadow-md">
                            <div className="text-6xl mb-4">🎯</div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                Aucune partie trouvée
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Soyez le premier à créer une partie multijoueur !
                            </p>
                            <button
                                onClick={() => navigate('/multiplayer/create')}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                ➕ Créer une partie
                            </button>
                        </div>
                    ) : (
                        games.map((game) => (
                            <div
                                key={game.id}
                                onClick={() => handleGameSelect(game)}
                                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                            >
                                <div className="flex items-center justify-between">

                                    {/* Informations principales */}
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-800">
                                                {game.creator_username}'s Game
                                            </h3>
                                            {game.is_private && <span className="text-lg">🔒</span>}
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${getDifficultyColor(game.difficulty)}`}>
                                                {getDifficultyLabel(game.difficulty)}
                                            </span>
                                        </div>

                                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                                            <span>👥 {game.current_players}/{game.max_players} joueurs</span>
                                            <span>🧩 {game.total_masterminds} masterminds</span>
                                            <span>🎁 Objets {game.items_enabled ? 'activés' : 'désactivés'}</span>
                                            <span>📅 {new Date(game.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Statut et action */}
                                    <div className="text-right">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <div className={`w-3 h-3 rounded-full ${
                                                game.current_players < game.max_players ? 'bg-green-500' : 'bg-red-500'
                                            }`}></div>
                                            <span className={`text-sm font-medium ${
                                                game.current_players < game.max_players ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {game.current_players < game.max_players ? 'Places libres' : 'Complet'}
                                            </span>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleGameSelect(game);
                                            }}
                                            disabled={game.current_players >= game.max_players}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {game.is_private ? '🔑 Rejoindre' : '🚀 Rejoindre'}
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
                                    loadGames();
                                }}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Charger plus de parties
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal pour rejoindre une partie */}
            <Modal
                isOpen={showJoinModal}
                onClose={() => setShowJoinModal(false)}
                title={`Rejoindre la partie de ${selectedGame?.creator_username}`}
            >
                <div className="p-6">
                    {selectedGame && (
                        <>
                            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>Difficulté: <strong>{getDifficultyLabel(selectedGame.difficulty)}</strong></div>
                                    <div>Joueurs: <strong>{selectedGame.current_players}/{selectedGame.max_players}</strong></div>
                                    <div>Masterminds: <strong>{selectedGame.total_masterminds}</strong></div>
                                    <div>Objets: <strong>{selectedGame.items_enabled ? 'Activés' : 'Désactivés'}</strong></div>
                                </div>
                            </div>

                            {selectedGame.is_private && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mot de passe de la partie
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Entrez le mot de passe"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowJoinModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleJoinGame}
                                    disabled={isJoining || (selectedGame.is_private && !password.trim())}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isJoining ? <LoadingSpinner size="sm" /> : '🚀 Rejoindre'}
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
                title="Rejoindre par code de room"
            >
                <div className="p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Code de la room
                        </label>
                        <input
                            type="text"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            placeholder="Ex: ABC12345"
                            maxLength={8}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mot de passe (si nécessaire)
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Laisser vide si partie publique"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowCodeModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleJoinByCode}
                            disabled={isSearchingByCode || !roomCode.trim()}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSearchingByCode ? <LoadingSpinner size="sm" /> : '🔍 Rechercher'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};