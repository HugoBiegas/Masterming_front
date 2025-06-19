import React, { useEffect, useCallback } from 'react';
import { COLOR_PALETTE } from '@/utils/constants';

interface ColorPickerProps {
    availableColors: number;
    selectedColor: number | null;
    onColorSelect: (color: number) => void;
    // 🔒 NOUVEAU: Props pour gérer l'état depuis le parent
    isExpanded: boolean;
    onToggleExpanded: () => void;
    isLocked: boolean;
    onToggleLocked: () => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
                                                            availableColors,
                                                            selectedColor,
                                                            onColorSelect,
                                                            isExpanded,
                                                            onToggleExpanded,
                                                            isLocked,
                                                            onToggleLocked
                                                        }) => {
    const colorNames = [
        'Rouge', 'Vert', 'Bleu', 'Jaune', 'Magenta', 'Cyan',
        'Orange', 'Violet', 'Rose', 'Marron', 'Gris', 'Noir'
    ];

    // 🔒 NOUVEAU: Gestion des raccourcis clavier
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Ctrl/Cmd + L pour verrouiller/déverrouiller
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
                e.preventDefault();
                onToggleLocked();
            }
            // Echap pour fermer et déverrouiller
            else if (e.key === 'Escape' && (isExpanded || isLocked)) {
                e.preventDefault();
                if (isExpanded) onToggleExpanded();
                if (isLocked) onToggleLocked();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isExpanded, isLocked, onToggleExpanded, onToggleLocked]);

    // 🔒 NOUVEAU: Sélection de couleur avec gestion du verrouillage
    const handleColorSelect = useCallback((colorIndex: number) => {
        onColorSelect(colorIndex);

        // Ne fermer que si pas verrouillé
        if (!isLocked && isExpanded) {
            onToggleExpanded();
        }
    }, [onColorSelect, isLocked, isExpanded, onToggleExpanded]);

    return (
        <div className="fixed bottom-0 left-0 z-40 bg-white border-t border-gray-300 shadow-lg page-with-history-colorpicker">
            {/* Barre de contrôle cliquable - AMÉLIORÉE */}
            <div
                onClick={selectedColor ? undefined : onToggleExpanded}
                className={`
                    px-4 py-2 flex items-center justify-between
                    ${isLocked
                    ? 'bg-gradient-to-r from-blue-100 to-blue-200 border-b-2 border-blue-300'
                    : 'bg-gradient-to-r from-slate-100 to-slate-200'
                }
                    ${selectedColor ? '' : 'cursor-pointer hover:from-slate-200 hover:to-slate-300 transition-all'}
                `}
            >
                <div className="flex items-center justify-center flex-1">
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
                                    if (!isLocked && isExpanded) {
                                        onToggleExpanded();
                                    }
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

                {/* 🔒 NOUVEAU: Bouton de verrouillage */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleLocked();
                    }}
                    className={`
                        ml-3 p-2 rounded-lg transition-all duration-200 
                        ${isLocked
                        ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }
                        hover:scale-105 active:scale-95
                    `}
                    title={isLocked ? 'Déverrouiller (Ctrl+L)' : 'Verrouiller ouvert (Ctrl+L)'}
                >
                    {isLocked ? '🔒' : '🔓'}
                </button>
            </div>

            {/* 🔒 NOUVEAU: Indicateur de statut verrouillé */}
            {isLocked && (
                <div className="bg-blue-50 border-b border-blue-200 px-4 py-1">
                    <div className="flex items-center justify-center space-x-2 text-xs text-blue-700">
                        <span>🔒</span>
                        <span className="font-medium">Mode de sélection rapide activé</span>
                        <span className="text-blue-500">• Echap pour quitter</span>
                    </div>
                </div>
            )}

            {/* Palette de couleurs expandable - OPTIMISÉE */}
            <div className={`overflow-hidden transition-all duration-300 ${
                isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
                <div className="p-4">
                    {/* Grille de couleurs adaptive */}
                    <div
                        className="grid gap-3 mx-auto"
                        style={{
                            gridTemplateColumns: availableColors <= 4
                                ? `repeat(${availableColors}, 1fr)`
                                : availableColors <= 6
                                    ? `repeat(3, 1fr)`
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
                                        onClick={() => handleColorSelect(colorIndex)}
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
                                        title={`${colorName}${isLocked ? ' (Mode rapide)' : ''}`}
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

                    {/* Instructions - AMÉLIORÉES */}
                    <div className="mt-3 text-center space-y-1">
                        <p className="text-xs text-gray-600">
                            Cliquez sur une couleur pour la sélectionner
                        </p>
                        {!isLocked && (
                            <p className="text-xs text-blue-600">
                                💡 Astuce : Verrouillez 🔒 pour une sélection rapide
                            </p>
                        )}
                        <div className="flex justify-center space-x-4 text-xs text-gray-500 mt-2">
                            <span>🔒 <kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+L</kbd> Verrouiller</span>
                            <span>🚪 <kbd className="px-1 py-0.5 bg-gray-100 rounded">Echap</kbd> Fermer</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};