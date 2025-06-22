import React, { useState, useEffect } from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate} from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

// Pages communes
import { AuthPage } from '@/pages/AuthPage';
import { GameModeSelection } from '@/pages/GameModeSelection';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Pages solo
import { SoloGameCreation } from '@/pages/SoloGameCreation';
import { GamePlay } from '@/pages/GamePlay';

// Pages multijoueur
import { MultiplayerGameCreation } from '@/pages/MultiplayerGameCreation';
import { MultiplayerBrowse } from '@/pages/MultiplayerBrowse';
import { MultiplayerLobby } from '@/pages/MultiplayerLobby';
import { MultiplayerGame } from '@/pages/MultiplayerGame';
import { MultiplayerResults } from '@/pages/MultiplayerResults';

// Services et hooks
import { multiplayerService } from '@/services/multiplayer';
import { useNotification } from '@/contexts/NotificationContext';
import {GameResults, PlayerProgress} from '@/types/multiplayer';
import {Header} from "@/components/common/Header";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Chargement...</p>
                </div>
            </div>
        );
    }

    return user ? <>{children}</> : <Navigate to="/" replace />;
};

// Composant wrapper pour MultiplayerResults avec chargement des données
const MultiplayerResultsPage: React.FC = () => {
    const { roomCode } = useParams<{ roomCode: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showError } = useNotification();

    const [gameResults, setGameResults] = useState<GameResults | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadGameResults = async () => {
            if (!roomCode || !user) {
                setError('Code de room manquant ou utilisateur non connecté');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const results = await multiplayerService.getGameResults(roomCode);
                setGameResults(results);

            } catch (err: any) {
                console.error('Erreur lors du chargement des résultats:', err);
                const errorMessage = err.response?.data?.detail ||
                    'Erreur lors du chargement des résultats';
                setError(errorMessage);
                showError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        loadGameResults();
    }, [roomCode, user, showError]);

    const handleClose = () => {
        navigate('/modes');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Chargement des résultats...</p>
                </div>
            </div>
        );
    }

    if (error || !gameResults) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'Résultats non trouvés'}</p>
                    <button
                        onClick={() => navigate('/multiplayer/browse')}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Retour aux parties
                    </button>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    // CORRECTION: Créer un composant wrapper qui passe les bonnes props
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <Header />
            <div className="container mx-auto px-4 py-8">
                {/* SOLUTION: Composant de résultats en mode page (pas modal) */}
                <MultiplayerResultsPageComponent
                    gameResults={gameResults}
                    currentUserId={user?.id || ''}
                />
            </div>
        </div>
    );
};

const MultiplayerResultsPageComponent: React.FC<{
    gameResults: GameResults;
    currentUserId: string;
}> = ({ gameResults, currentUserId }) => {
    const navigate = useNavigate();
    const { showSuccess } = useNotification();

    const getCurrentPlayerResult = (): PlayerProgress | null => {
        return gameResults.final_leaderboard.find(p => p.user_id === currentUserId) || null;
    };

    const currentPlayerResult = getCurrentPlayerResult();
    const isWinner = currentPlayerResult?.is_winner || false;

    return (
        <div className="max-w-4xl mx-auto">
            {/* En-tête des résultats */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        🏆 Résultats de la Partie
                    </h1>
                    {isWinner && (
                        <div className="text-2xl text-yellow-600 font-bold mb-4">
                            🎉 Félicitations ! Vous avez gagné ! 🎉
                        </div>
                    )}
                    <div className="text-gray-600">
                        <p>Partie terminée • {gameResults.total_players} joueurs</p>
                        <p>Durée: {Math.floor(gameResults.duration / 60)}min {gameResults.duration % 60}s</p>
                    </div>
                </div>
            </div>

            {/* Classement final */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Classement Final</h2>
                <div className="space-y-3">
                    {gameResults.final_leaderboard.map((player, index) => (
                        <div
                            key={player.user_id}
                            className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                                player.user_id === currentUserId
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 bg-gray-50'
                            }`}
                        >
                            <div className="flex items-center space-x-4">
                                <div className={`text-2xl font-bold ${
                                    index === 0 ? 'text-yellow-500' :
                                        index === 1 ? 'text-gray-400' :
                                            index === 2 ? 'text-orange-600' :
                                                'text-gray-600'
                                }`}>
                                    #{index + 1}
                                </div>
                                <div>
                                    <div className="font-medium text-gray-800">
                                        {player.username}
                                        {player.user_id === currentUserId && ' (Vous)'}
                                        {player.is_winner && ' 👑'}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {player.attempts_count} tentatives
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-bold text-blue-600">
                                    {player.score} pts
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center space-x-4">
                <button
                    onClick={() => navigate('/multiplayer/browse')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Nouvelle Partie
                </button>
                <button
                    onClick={() => navigate('/modes')}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                    Menu Principal
                </button>
            </div>
        </div>
    );
};
const AppRoutes: React.FC = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Initialisation...</p>
                </div>
            </div>
        );
    }

    return (
        <Routes>
            {/* Route d'accueil */}
            <Route
                path="/"
                element={user ? <Navigate to="/modes" replace /> : <AuthPage />}
            />

            {/* Routes protégées */}
            <Route
                path="/modes"
                element={
                    <ProtectedRoute>
                        <GameModeSelection />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/solo"
                element={
                    <ProtectedRoute>
                        <Navigate to="/solo/create" replace />
                    </ProtectedRoute>
                }
            />

            {/* Routes solo */}
            <Route
                path="/solo/create"
                element={
                    <ProtectedRoute>
                        <SoloGameCreation />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/solo/game/:gameId"
                element={
                    <ProtectedRoute>
                        <GamePlay />
                    </ProtectedRoute>
                }
            />

            {/* Routes multijoueur */}
            <Route
                path="/multiplayer/create"
                element={
                    <ProtectedRoute>
                        <MultiplayerGameCreation />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/multiplayer/browse"
                element={
                    <ProtectedRoute>
                        <MultiplayerBrowse />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/multiplayer/rooms/:roomCode/lobby"
                element={
                    <ProtectedRoute>
                        <MultiplayerLobby />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/multiplayer/rooms/:roomCode"
                element={
                    <ProtectedRoute>
                        <MultiplayerGame />
                    </ProtectedRoute>
                }
            />

            {/* Route pour les résultats multijoueur - CORRIGÉE */}
            <Route
                path="/multiplayer/rooms/:roomCode/results"
                element={
                    <ProtectedRoute>
                        <MultiplayerResultsPage />
                    </ProtectedRoute>
                }
            />

            {/* Route pour rejoindre par code de room - CORRIGÉE */}
            <Route
                path="/multiplayer/rooms/:roomCode/join"
                element={
                    <ProtectedRoute>
                        <JoinByRoomCode />
                    </ProtectedRoute>
                }
            />

            {/* Route 404 et redirections */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

// Composant pour rejoindre une partie par code de room - CORRIGÉ
const JoinByRoomCode: React.FC = () => {
    const { roomCode } = useParams<{ roomCode: string }>();
    const navigate = useNavigate();
    const { showError, showSuccess } = useNotification();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const joinGame = async () => {
            if (!roomCode) {
                setError('Code de room manquant');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Utiliser getRoomDetails au lieu de getGameByRoomCode
                const room = await multiplayerService.getRoomDetails(roomCode);

                // Vérifier si la room peut être rejointe
                if (!multiplayerService.canJoinRoom(room)) {
                    if (multiplayerService.isRoomFull(room)) {
                        setError('Cette partie est complète');
                        return;
                    }
                    if (multiplayerService.isGameActive(room) || multiplayerService.isGameFinished(room)) {
                        setError('Cette partie est déjà en cours ou terminée');
                        return;
                    }
                }

                // Rediriger vers la page de navigation avec cette partie pré-sélectionnée
                navigate('/multiplayer/browse', {
                    state: { preselectedRoom: room }
                });

                showSuccess(`Partie "${room.name}" trouvée !`);

            } catch (error: any) {
                console.error('Erreur lors de la recherche de la partie:', error);
                const errorMessage = error.response?.data?.detail || 'Impossible de trouver cette partie';
                setError(errorMessage);
                showError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        joinGame();
    }, [roomCode, navigate, showError, showSuccess]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Recherche de la partie...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">❌</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Partie non trouvée</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <div className="space-y-2">
                        <button
                            onClick={() => navigate('/multiplayer/browse')}
                            className="block w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Parcourir les parties
                        </button>
                        <button
                            onClick={() => navigate('/modes')}
                            className="block w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            Retour au menu
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

const App: React.FC = () => {
    return (
        <Router>
            <AuthProvider>
                <NotificationProvider>
                    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                        <AppRoutes />
                    </div>
                </NotificationProvider>
            </AuthProvider>
        </Router>
    );
};

export default App;