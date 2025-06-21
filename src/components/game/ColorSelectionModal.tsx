import React, { useEffect, useCallback } from 'react';
import { Modal } from '@/components/common/Modal';
import { COLOR_PALETTE } from '@/utils/constants';

interface ColorSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onColorSelect: (color: number) => void;
    availableColors: number;
    selectedColor: number | null;
    position?: number;
}

export const ColorSelectionModal: React.FC<ColorSelectionModalProps> = ({
                                                                            isOpen,
                                                                            onClose,
                                                                            onColorSelect,
                                                                            availableColors,
                                                                            selectedColor,
                                                                            position
                                                                        }) => {
    // Gestion des raccourcis clavier
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyPress = (e: KeyboardEvent) => {
            // Échap pour fermer
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
            // Touches numériques 1-9 pour sélection rapide
            else if (e.key >= '1' && e.key <= '9') {
                const colorIndex = parseInt(e.key);
                if (colorIndex <= availableColors) {
                    e.preventDefault();
                    handleColorSelection(colorIndex);
                }
            }
            // Entrée pour confirmer la sélection
            else if (e.key === 'Enter' && selectedColor) {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isOpen, selectedColor, availableColors, onClose]);

    const handleColorSelection = useCallback((colorIndex: number) => {
        onColorSelect(colorIndex);
        // Fermer automatiquement après sélection
        setTimeout(() => {
            onClose();
        }, 150);
    }, [onColorSelect, onClose]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={position !== undefined ? `Couleur pour la position ${position + 1}` : '🎨 Choisir une couleur'}
        >
            <div className="p-6">
                {/* Grille des couleurs - VERSION SIMPLIFIÉE */}
                <div className="grid grid-cols-4 gap-4 justify-center">
                    {Array.from({ length: availableColors }, (_, index) => {
                        const colorIndex = index + 1;
                        const color = COLOR_PALETTE[index];
                        const isSelected = selectedColor === colorIndex;

                        return (
                            <button
                                key={colorIndex}
                                onClick={() => handleColorSelection(colorIndex)}
                                className={`
                                    relative w-16 h-16 rounded-full border-4 transition-all duration-200 
                                    transform hover:scale-110 active:scale-95 group
                                    ${isSelected
                                    ? 'border-blue-500 scale-110 ring-4 ring-blue-200'
                                    : 'border-gray-300 hover:border-gray-400'
                                }
                                `}
                                style={{
                                    backgroundColor: color,
                                    boxShadow: isSelected
                                        ? `0 8px 25px ${color}60, 0 0 0 4px rgba(59, 130, 246, 0.3)`
                                        : `0 4px 15px ${color}40`
                                }}
                                title={`Couleur ${colorIndex}`}
                            >
                                {/* Effet de brillance */}
                                <div className="absolute top-2 left-2 w-4 h-4 bg-white rounded-full opacity-30"></div>

                                {/* Numéro de la couleur */}
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 shadow-sm">
                                    {colorIndex}
                                </div>

                                {/* Indicateur de sélection */}
                                {isSelected && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                                            <span className="text-blue-600 text-lg font-bold">✓</span>
                                        </div>
                                    </div>
                                )}

                                {/* Animation de hover */}
                                <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                            </button>
                        );
                    })}
                </div>

                {/* Indication simple en bas */}
                <div className="mt-6 text-center text-sm text-gray-500">
                    Cliquez sur une couleur ou utilisez les touches 1-{availableColors}
                </div>
            </div>
        </Modal>
    );
};