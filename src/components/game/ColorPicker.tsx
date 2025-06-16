import React from 'react';
import { COLOR_PALETTE } from '@/utils/constants';

interface ColorPickerProps {
    availableColors: number;
    selectedColor: number | null;
    onColorSelect: (color: number) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
                                                            availableColors,
                                                            selectedColor,
                                                            onColorSelect
                                                        }) => {
    const colorNames = [
        'Rouge', 'Vert', 'Bleu', 'Jaune', 'Magenta', 'Cyan',
        'Orange', 'Violet', 'Rose', 'Marron', 'Gris', 'Noir'
    ];

    return (
        <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-6 rounded-xl shadow-lg border-2 border-slate-300">
            <h3 className="text-lg font-bold text-center mb-4 text-gray-800">
                Palette de couleurs
            </h3>

            <div className="bg-white p-4 rounded-lg shadow-inner">
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 justify-center">
                    {Array.from({ length: availableColors }, (_, index) => {
                        const colorIndex = index + 1;
                        const color = COLOR_PALETTE[index] || '#CCCCCC';
                        const isSelected = selectedColor === colorIndex;
                        const colorName = colorNames[index] || `Couleur ${colorIndex}`;

                        return (
                            <div key={colorIndex} className="flex flex-col items-center group">
                                <button
                                    onClick={() => onColorSelect(colorIndex)}
                                    className={`
                                        w-12 h-12 md:w-14 md:h-14 rounded-full transition-all duration-200 
                                        relative overflow-hidden
                                        ${isSelected
                                        ? 'border-4 border-blue-600 scale-110 shadow-xl ring-2 ring-blue-300'
                                        : 'border-3 border-gray-400 hover:border-gray-600 hover:scale-105 hover:shadow-lg'
                                    }
                                        active:scale-95
                                    `}
                                    style={{
                                        backgroundColor: color,
                                        boxShadow: isSelected
                                            ? `0 8px 16px ${color}60, 0 0 0 2px white`
                                            : `0 4px 8px ${color}40, inset 0 -2px 4px rgba(0,0,0,0.2)`
                                    }}
                                    title={colorName}
                                >
                                    {/* Glossy effect */}
                                    <div className="absolute top-1 left-1 w-3 h-3 md:w-4 md:h-4 bg-white rounded-full opacity-40"></div>

                                    {/* Selection indicator */}
                                    {isSelected && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                                                <span className="text-blue-600 text-sm font-bold">✓</span>
                                            </div>
                                        </div>
                                    )}
                                </button>

                                {/* Color name */}
                                <span className={`
                                    mt-2 text-xs font-medium text-center transition-colors
                                    ${isSelected ? 'text-blue-600' : 'text-gray-600 group-hover:text-gray-800'}
                                `}>
                                    {colorName}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Selected color display */}
                {selectedColor && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-center space-x-3">
                            <span className="text-sm font-medium text-blue-800">Couleur sélectionnée :</span>
                            <div className="flex items-center space-x-2">
                                <div
                                    className="w-8 h-8 rounded-full border-2 border-blue-600 shadow-md"
                                    style={{ backgroundColor: COLOR_PALETTE[selectedColor - 1] }}
                                ></div>
                                <span className="text-sm font-bold text-blue-800">
                                    {colorNames[selectedColor - 1]}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Clear selection button */}
                {selectedColor && (
                    <div className="mt-3 text-center">
                        <button
                            onClick={() => onColorSelect(0)} // Use 0 to deselect
                            className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
                        >
                            Désélectionner
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};