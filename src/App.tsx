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

            {/* Sélection du mode de jeu */}
            <Route
                path="/modes"
                element={
                    <ProtectedRoute>
                        <GameModeSelection />
                    </ProtectedRoute>
                }
            />

            {/* Routes Solo */}
            <Route
                path="/solo"
                element={
                    <ProtectedRoute>
                        <SoloGameCreation />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/game/:gameId"
                element={
                    <ProtectedRoute>
                        <GamePlay />
                    </ProtectedRoute>
                }
            />

            {/* Routes Multijoueur */}
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
                path="/multiplayer/lobby/:gameId"
                element={
                    <ProtectedRoute>
                        <MultiplayerLobby />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/multiplayer/game/:gameId"
                element={
                    <ProtectedRoute>
                        <MultiplayerGame />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/multiplayer/results/:gameId"
                element={
                    <ProtectedRoute>
                        <MultiplayerResults />
                    </ProtectedRoute>
                }
            />

            {/* Route pour rejoindre par code de room */}
            <Route
                path="/multiplayer/join/:roomCode"
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

// Composant pour rejoindre une partie par code de room
const JoinByRoomCode: React.FC = () => {
    const { roomCode } = useParams<{ roomCode: string }>();
    const navigate = useNavigate();
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
                // Importer le service multijoueur
                const { multiplayerService } = await import('@/services/multiplayer');

                // Rechercher la partie par code
                const game = await multiplayerService.getGameByRoomCode(roomCode);

                // Rediriger vers la page de navigation avec cette partie pré-sélectionnée
                navigate('/multiplayer/browse', {
                    state: { preselectedGame: game }
                });

            } catch (error: any) {
                console.error('Erreur recherche par code:', error);
                setError('Code de room invalide ou partie introuvable');
                setLoading(false);
            }
        };

        joinGame();
    }, [roomCode, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Recherche de la partie...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">🔍</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Partie introuvable</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/multiplayer/browse')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Parcourir les parties
                    </button>
                </div>
            </div>
        );
    }

    return null; // Ne devrait jamais être affiché
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <NotificationProvider>
                <Router>
                    <div className="App">
                        <AppRoutes />
                    </div>
                </Router>
            </NotificationProvider>
        </AuthProvider>
    );
};

export default App;