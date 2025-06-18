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
        <div className="fixed bottom-0 left-0 z-40 bg-white border-t border-gray-300 shadow-lg page-with-history-colorpicker">
            {/* Barre de contrôle cliquable - COMPACTE */}
            <div
                onClick={selectedColor ? undefined : toggleExpanded}
                className={`bg-gradient-to-r from-slate-100 to-slate-200 px-4 py-2 flex items-center justify-center ${
                    selectedColor ? '' : 'cursor-pointer hover:from-slate-200 hover:to-slate-300 transition-all'
                }`}
            >
                {selectedColor ? (
                    // Affichage de la couleur sélectionnée (COMPACT)
                    <div className="flex items-center justify-center space-x-2">
                        <div
                            className="w-6 h-6 rounded-full border-2 border-gray-600 shadow-sm relative"
                            style={{
                                backgroundColor: COLOR_PALETTE[selectedColor - 1],
                                boxShadow: `0 1px 3px ${COLOR_PALETTE[selectedColor - 1]}40, inset 0 -1px 2px rgba(0,0,0,0.2)`
                            }}
                        >
                            <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-white rounded-full opacity-50"></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                            {colorNames[selectedColor - 1]}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onColorSelect(0);
                                toggleExpanded()
                            }}
                            className="text-gray-500 hover:text-red-500 text-sm hover:scale-110 transition-all p-1 rounded-full hover:bg-red-50"
                            title="Désélectionner"
                        >
                            ✕
                        </button>
                    </div>
                ) : (
                    // Texte par défaut avec flèche - COMPACT
                    <div className="flex items-center justify-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">
                            Sélectionner une couleur
                        </span>
                        <span className="text-lg text-gray-600 transition-transform duration-200">
                            {isExpanded ? '▲' : '▼'}
                        </span>
                    </div>
                )}
            </div>

            {/* Palette de couleurs expandable - OPTIMISÉE */}
            <div className={`overflow-hidden transition-all duration-300 ${
                isExpanded ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
            }`}>
                <div className="bg-white p-3 max-h-60 overflow-y-auto">
                    <h3 className="text-base font-bold text-center mb-3 text-gray-800">
                        Palette de couleurs
                    </h3>

                    {/* Conteneur centré et adaptatif pour les couleurs - COMPACT */}
                    <div className="flex justify-center">
                        <div
                            className="grid gap-2 justify-items-center"
                            style={{
                                gridTemplateColumns: availableColors <= 4
                                    ? `repeat(${availableColors}, 1fr)`
                                    : availableColors <= 6
                                        ? `repeat(${Math.min(availableColors, 3)}, 1fr)`
                                        : availableColors <= 8
                                            ? `repeat(4, 1fr)`
                                            : `repeat(${Math.min(6, Math.ceil(availableColors / 2))}, 1fr)`,
                                maxWidth: availableColors <= 4
                                    ? `${availableColors * 60}px`
                                    : availableColors <= 6
                                        ? '180px'
                                        : availableColors <= 8
                                            ? '240px'
                                            : '360px'
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
                                                w-12 h-12 rounded-full transition-all duration-200 
                                                relative overflow-hidden
                                                ${isSelected
                                                ? 'border-3 border-blue-600 scale-110 shadow-lg ring-2 ring-blue-300'
                                                : 'border-2 border-gray-400 hover:border-gray-600 hover:scale-105 hover:shadow-md'
                                            }
                                                active:scale-95
                                            `}
                                            style={{
                                                backgroundColor: color,
                                                boxShadow: isSelected
                                                    ? `0 4px 12px ${color}60, 0 0 0 2px white`
                                                    : `0 2px 6px ${color}40, inset 0 -1px 2px rgba(0,0,0,0.2)`
                                            }}
                                            title={colorName}
                                        >
                                            {/* Glossy effect */}
                                            <div className="absolute top-1.5 left-1.5 w-3 h-3 bg-white rounded-full opacity-40"></div>

                                            {/* Selection indicator */}
                                            {isSelected && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                                                        <span className="text-blue-600 text-sm font-bold">✓</span>
                                                    </div>
                                                </div>
                                            )}
                                        </button>

                                        {/* Color name - COMPACT */}
                                        <span className={`
                                            mt-1 text-xs font-medium text-center transition-colors max-w-[60px] leading-tight
                                            ${isSelected ? 'text-blue-600 font-semibold' : 'text-gray-600 group-hover:text-gray-800'}
                                        `}>
                                            {colorName}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Instructions - COMPACT */}
                    <div className="mt-3 text-center">
                        <p className="text-xs text-gray-600">
                            Cliquez sur une couleur pour la sélectionner
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};