import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AuthPage } from '@/pages/AuthPage';
import { GameModeSelection } from '@/pages/GameModeSelection';
import { SoloGameCreation } from '@/pages/SoloGameCreation';
import { GamePlay } from '@/pages/GamePlay';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

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
            <Route
                path="/"
                element={user ? <Navigate to="/modes" replace /> : <AuthPage />}
            />
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
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
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