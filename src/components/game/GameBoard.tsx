import React from 'react';
import { COLOR_PALETTE } from '@/utils/constants';

interface GameBoardProps {
    combination: number[];
    onPositionClick: (position: number) => void;
    selectedColor: number | null;
    isActive?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
                                                        combination,
                                                        onPositionClick,
                                                        selectedColor,
                                                        isActive = true
                                                    }) => {
    return (
        <div className="bg-gradient-to-br from-amber-100 to-amber-200 p-6 rounded-xl shadow-lg border-2 border-amber-300">
            <div className="bg-white p-4 rounded-lg shadow-inner">
                <h3 className="text-lg font-bold text-center mb-4 text-gray-800">
                    Votre combinaison
                </h3>

                <div className="flex justify-center items-center space-x-3">
                    {combination.map((color, index) => (
                        <div key={index} className="relative group">
                            {/* Position number */}
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600">
                                {index + 1}
                            </div>

                            {/* Color peg slot */}
                            <button
                                onClick={() => isActive && onPositionClick(index)}
                                disabled={!isActive}
                                className={`
                                    w-14 h-14 md:w-16 md:h-16 rounded-full border-4 transition-all duration-200 
                                    ${isActive ? 'cursor-pointer' : 'cursor-not-allowed'}
                                    ${selectedColor && isActive ? 'hover:scale-110 hover:shadow-lg' : ''}
                                    ${color ? 'border-gray-700 shadow-md' : 'border-gray-400 border-dashed'}
                                    ${!color && selectedColor && isActive ? 'border-blue-500 bg-blue-50' : ''}
                                    group-hover:${isActive ? 'ring-2 ring-blue-300' : ''}
                                `}
                                style={{
                                    backgroundColor: color ? COLOR_PALETTE[color - 1] : '#F9FAFB',
                                    boxShadow: color
                                        ? `0 4px 8px ${COLOR_PALETTE[color - 1]}40, inset 0 -2px 4px rgba(0,0,0,0.2)`
                                        : 'inset 0 2px 4px rgba(0,0,0,0.1)'
                                }}
                                title={`Position ${index + 1}${color ? ` - ${getColorName(color)}` : ' - Vide'}`}
                            >
                                {/* Empty slot indicator */}
                                {!color && (
                                    <div className="w-full h-full rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                                        <div className="w-4 h-4 rounded-full bg-gray-200"></div>
                                    </div>
                                )}

                                {/* Glossy effect for placed pegs */}
                                {color && (
                                    <div className="absolute top-2 left-2 w-4 h-4 bg-white rounded-full opacity-30"></div>
                                )}
                            </button>

                            {/* Clear button for placed pegs */}
                            {color && isActive && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onPositionClick(index); // This should clear the position
                                    }}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors shadow-lg"
                                    title="Supprimer"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Instructions */}
                <div className="mt-4 text-center">
                    {selectedColor ? (
                        <p className="text-sm text-gray-600">
                            <span className="inline-block w-4 h-4 rounded-full mr-2 border border-gray-400"
                                  style={{ backgroundColor: COLOR_PALETTE[selectedColor - 1] }}></span>
                            Cliquez sur une position pour placer cette couleur
                        </p>
                    ) : (
                        <p className="text-sm text-gray-500">
                            Sélectionnez une couleur puis cliquez sur une position
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper function to get color names
const getColorName = (colorIndex: number): string => {
    const colorNames = [
        'Rouge', 'Vert', 'Bleu', 'Jaune', 'Magenta', 'Cyan',
        'Orange', 'Violet', 'Rose', 'Marron', 'Gris', 'Noir'
    ];
    return colorNames[colorIndex - 1] || `Couleur ${colorIndex}`;
};