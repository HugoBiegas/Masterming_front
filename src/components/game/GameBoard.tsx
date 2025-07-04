import React from 'react';
import { COLOR_PALETTE } from '@/utils/constants';

interface GameBoardProps {
    combination: number[];
    onPositionClick: (position: number) => void;
    onRemoveColor: (position: number) => void;
    onSubmitAttempt: () => void; // NOUVELLE PROP pour valider
    selectedColor: number | null;
    isActive?: boolean;
    canSubmit?: boolean; // NOUVELLE PROP pour activer le bouton
}

export const GameBoard: React.FC<GameBoardProps> = ({
                                                        combination,
                                                        onPositionClick,
                                                        onRemoveColor,
                                                        onSubmitAttempt,
                                                        selectedColor,
                                                        isActive = true,
                                                        canSubmit = false
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

                            {/* Clear button for placed pegs - CORRIGÉ */}
                            {color && isActive && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveColor(index); // UTILISE LA NOUVELLE FONCTION
                                    }}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors shadow-lg flex items-center justify-center"
                                    title="Supprimer cette couleur"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Instructions OU Bouton Valider */}
                <div className="mt-4 text-center">
                    {combination.every(c => c > 0) && canSubmit ? (
                        // Bouton Valider quand toutes les positions sont remplies
                        <button
                            onClick={onSubmitAttempt}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg validate-button-appear"
                        >
                            ✓ Valider la tentative
                        </button>
                    ) : (
                        <>
                            {/* Indicateur de progression */}
                            <div className="mt-3">
                                <div className="text-xs text-gray-500">
                                    Positions remplies : {combination.filter(c => c > 0).length} / {combination.length}
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                    <div
                                        className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                                        style={{ width: `${(combination.filter(c => c > 0).length / combination.length) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </>
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