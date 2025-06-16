import React from 'react';
import { GameMode } from '@/types/game';
import { GAME_MODE_INFO } from '@/utils/constants';

interface GameModeCardProps {
    mode: GameMode;
    onClick: () => void;
}

export const GameModeCard: React.FC<GameModeCardProps> = ({ mode, onClick }) => {
    const info = GAME_MODE_INFO[mode];

    return (
        <div
            onClick={info.available ? onClick : undefined}
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                info.available
                    ? 'border-blue-300 hover:border-blue-500 hover:shadow-lg bg-white'
                    : 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
            }`}
        >
            <h3 className="text-xl font-bold mb-2">{info.name}</h3>
            <p className="text-gray-600 mb-4">{info.description}</p>
            {!info.available && (
                <span className="text-sm text-gray-500 italic">Bientôt disponible</span>
            )}
        </div>
    );
};
