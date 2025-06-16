import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { GameModeCard } from '@/components/game/GameModeCard';
import { GameMode } from '@/types/game';

export const GameModeSelection: React.FC = () => {
    const navigate = useNavigate();

    const handleModeSelect = (mode: GameMode) => {
        if (mode === GameMode.SINGLE) {
            navigate('/solo');
        }
        // Les autres modes seront ajoutés plus tard
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />

            <div className="container mx-auto py-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-4">Choisissez votre mode de jeu</h1>
                    <p className="text-gray-600">Sélectionnez le mode de jeu qui vous convient</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                    {Object.values(GameMode).map((mode) => (
                        <GameModeCard
                            key={mode}
                            mode={mode}
                            onClick={() => handleModeSelect(mode)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
