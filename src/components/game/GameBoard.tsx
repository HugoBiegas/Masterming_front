import React from 'react';
import { COLOR_PALETTE } from '@/utils/constants';

interface GameBoardProps {
    combination: number[];
    onPositionClick: (position: number) => void;
    selectedColor: number | null;
}

export const GameBoard: React.FC<GameBoardProps> = ({
                                                        combination,
                                                        onPositionClick,
                                                        selectedColor
                                                    }) => {
    return (
        <div className="flex justify-center space-x-2 p-4 bg-gray-100 rounded-lg">
            {combination.map((color, index) => (
                <button
                    key={index}
                    onClick={() => onPositionClick(index)}
                    className={`w-16 h-16 rounded-full border-4 transition-all ${
                        selectedColor ? 'hover:border-blue-500' : 'border-gray-300'
                    } ${color ? 'border-black' : 'border-gray-300'}`}
                    style={{
                        backgroundColor: color ? COLOR_PALETTE[color - 1] : '#FFFFFF'
                    }}
                    title={`Position ${index + 1}`}
                />
            ))}
        </div>
    );
};
