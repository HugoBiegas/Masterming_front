import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const Header: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <header className="bg-blue-600 text-white p-4">
            <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-2xl font-bold">Quantum Mastermind</h1>
                <button
                    onClick={() => window.location.href = '/'}
                    className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded center"
                >
                    Acceuil
                </button>
                {user && (
                    <div className="flex items-center space-x-4">
                        <span>Bienvenue, {user.username}</span>
                        <button
                            onClick={logout}
                            className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded"
                        >
                            Déconnexion
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};
