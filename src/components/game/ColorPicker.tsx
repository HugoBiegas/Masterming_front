import React, { useState } from 'react';
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
    const [isExpanded, setIsExpanded] = useState(false);

    const colorNames = [
        'Rouge', 'Vert', 'Bleu', 'Jaune', 'Magenta', 'Cyan',
        'Orange', 'Violet', 'Rose', 'Marron', 'Gris', 'Noir'
    ];

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-gray-300 shadow-lg">
            {/* Barre de contrôle cliquable */}
            <div
                onClick={selectedColor ? undefined : toggleExpanded}
                className={`bg-gradient-to-r from-slate-100 to-slate-200 px-4 py-4 flex items-center justify-center ${
                    selectedColor ? '' : 'cursor-pointer hover:from-slate-200 hover:to-slate-300 transition-all'
                }`}
            >
                {selectedColor ? (
                    // Affichage de la couleur sélectionnée (centrée)
                    <div className="flex items-center justify-center space-x-3">
                        <div
                            className="w-10 h-10 rounded-full border-2 border-gray-600 shadow-md relative"
                            style={{
                                backgroundColor: COLOR_PALETTE[selectedColor - 1],
                                boxShadow: `0 2px 4px ${COLOR_PALETTE[selectedColor - 1]}40, inset 0 -1px 2px rgba(0,0,0,0.2)`
                            }}
                        >
                            <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 bg-white rounded-full opacity-50"></div>
                        </div>
                        <span className="text-base font-medium text-gray-700">
                            {colorNames[selectedColor - 1]}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onColorSelect(0);
                                toggleExpanded()
                            }}
                            className="text-gray-500 hover:text-red-500 ml-2 text-lg hover:scale-110 transition-all p-1 rounded-full hover:bg-red-50"
                            title="Désélectionner"
                        >
                            ✕
                        </button>
                    </div>
                ) : (
                    // Texte par défaut avec flèche
                    <div className="flex flex-col items-center justify-center py-2">
                        <span className="text-base font-medium text-gray-700 mb-1">
                            Sélectionner une couleur
                        </span>
                        <span className="text-xl text-gray-600 transition-transform duration-200">
                            {isExpanded ? '▲' : '▼'}
                        </span>
                    </div>
                )}
            </div>

            {/* Palette de couleurs expandable */}
            <div className={`overflow-hidden transition-all duration-300 ${
                isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
                <div className="bg-white p-6 max-h-80 overflow-y-auto">
                    <h3 className="text-lg font-bold text-center mb-6 text-gray-800">
                        Palette de couleurs
                    </h3>

                    {/* Conteneur centré et adaptatif pour les couleurs */}
                    <div className="flex justify-center">
                        <div
                            className="grid gap-4 justify-items-center"
                            style={{
                                gridTemplateColumns: availableColors <= 4
                                    ? `repeat(${availableColors}, 1fr)`
                                    : availableColors <= 6
                                        ? `repeat(${Math.min(availableColors, 3)}, 1fr)`
                                        : availableColors <= 8
                                            ? `repeat(4, 1fr)`
                                            : `repeat(${Math.min(6, Math.ceil(availableColors / 2))}, 1fr)`,
                                maxWidth: availableColors <= 4
                                    ? `${availableColors * 80}px`
                                    : availableColors <= 6
                                        ? '240px'
                                        : availableColors <= 8
                                            ? '320px'
                                            : '480px'
                            }}
                        >
                            {Array.from({ length: availableColors }, (_, index) => {
                                const colorIndex = index + 1;
                                const color = COLOR_PALETTE[index] || '#CCCCCC';
                                const isSelected = selectedColor === colorIndex;
                                const colorName = colorNames[index] || `Couleur ${colorIndex}`;

                                return (
                                    <div key={colorIndex} className="flex flex-col items-center group">
                                        <button
                                            onClick={() => {
                                                onColorSelect(colorIndex);
                                                setIsExpanded(false); // Fermer après sélection
                                            }}
                                            className={`
                                                w-16 h-16 rounded-full transition-all duration-200 
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
                                            <div className="absolute top-2 left-2 w-4 h-4 bg-white rounded-full opacity-40"></div>

                                            {/* Selection indicator */}
                                            {isSelected && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md">
                                                        <span className="text-blue-600 text-base font-bold">✓</span>
                                                    </div>
                                                </div>
                                            )}
                                        </button>

                                        {/* Color name */}
                                        <span className={`
                                            mt-2 text-xs font-medium text-center transition-colors max-w-[70px] leading-tight
                                            ${isSelected ? 'text-blue-600 font-semibold' : 'text-gray-600 group-hover:text-gray-800'}
                                        `}>
                                            {colorName}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Cliquez sur une couleur pour la sélectionner
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};