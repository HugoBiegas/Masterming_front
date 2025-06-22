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
import { GameResults } from '@/types/multiplayer';

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
    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showError } = useNotification();

    const [gameResults, setGameResults] = useState<GameResults | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadGameResults = async () => {
            if (!gameId || !user) {
                setError('ID de partie manquant ou utilisateur non connecté');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Récupérer les résultats de la partie
                const results = await multiplayerService.getGameResults(gameId);
                setGameResults(results);

            } catch (err: any) {
                console.error('Erreur lors du chargement des résultats:', err);
                const errorMessage = err.response?.data?.detail || 'Impossible de charger les résultats';
                setError(errorMessage);
                showError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        loadGameResults();
    }, [gameId, user, showError]);

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

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">❌</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/modes')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Retour au menu
                    </button>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return (
        <MultiplayerResults
            isOpen={true}
            onClose={handleClose}
            gameResults={gameResults}
            currentUserId={user.id}
            showDetailedStats={true}
        />
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
                path="/multiplayer/rooms/:roomCode"
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
                path="/multiplayer/rooms/:gameId/results"
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