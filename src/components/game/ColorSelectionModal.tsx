import React, { useEffect, useCallback } from 'react';
import { Modal } from '@/components/common/Modal';
import { COLOR_PALETTE } from '@/utils/constants';

interface ColorSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onColorSelect: (color: number) => void;
    availableColors: number;
    selectedColor: number | null;
    position?: number; // Pour afficher la position si spécifiée
}

export const ColorSelectionModal: React.FC<ColorSelectionModalProps> = ({
                                                                            isOpen,
                                                                            onClose,
                                                                            onColorSelect,
                                                                            availableColors,
                                                                            selectedColor,
                                                                            position
                                                                        }) => {
    const colorNames = [
        'Rouge', 'Vert', 'Bleu', 'Jaune', 'Magenta', 'Cyan',
        'Orange', 'Violet', 'Rose', 'Marron', 'Gris', 'Noir'
    ];

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
        }, 150); // Petit délai pour voir l'animation de sélection
    }, [onColorSelect, onClose]);

    const getColorDescription = (index: number) => {
        const descriptions = [
            'Couleur principale classique',
            'Couleur naturelle apaisante',
            'Couleur froide et calme',
            'Couleur chaude et énergique',
            'Couleur vive et moderne',
            'Couleur fraîche et claire',
            'Couleur chaude et dynamique',
            'Couleur royale et mystérieuse',
            'Couleur douce et délicate',
            'Couleur terreuse et stable',
            'Couleur neutre et sobre',
            'Couleur profonde et élégante'
        ];
        return descriptions[index] || 'Couleur unique';
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={position !== undefined ? `Sélectionner une couleur - Position ${position + 1}` : "Sélectionner une couleur"}
        >
            <div className="p-6">

                {/* En-tête informatif */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-2 rounded-full">
                        <span className="text-2xl">🎨</span>
                        <span className="text-sm font-medium text-gray-700">
                            {availableColors} couleurs disponibles
                        </span>
                    </div>
                    {position !== undefined && (
                        <p className="text-sm text-gray-600 mt-2">
                            Choisissez la couleur pour la position {position + 1}
                        </p>
                    )}
                </div>

                {/* Grille de couleurs */}
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                    {Array.from({ length: availableColors }, (_, index) => {
                        const colorIndex = index + 1;
                        const isSelected = selectedColor === colorIndex;
                        const color = COLOR_PALETTE[index];
                        const colorName = colorNames[index];

                        return (
                            <div
                                key={colorIndex}
                                className="group cursor-pointer"
                                onClick={() => handleColorSelection(colorIndex)}
                            >
                                {/* Bouton couleur principal */}
                                <div
                                    className={`
                                        relative w-16 h-16 rounded-xl transition-all duration-200 transform
                                        border-3 shadow-lg hover:scale-110 hover:shadow-xl
                                        ${isSelected
                                        ? 'border-blue-500 scale-105 ring-4 ring-blue-200'
                                        : 'border-gray-300 hover:border-gray-400'
                                    }
                                        group-active:scale-95
                                    `}
                                    style={{
                                        backgroundColor: color,
                                        boxShadow: isSelected
                                            ? `0 8px 25px ${color}60, 0 0 0 4px rgba(59, 130, 246, 0.3)`
                                            : `0 4px 15px ${color}40`
                                    }}
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
                                    <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                </div>

                                {/* Nom de la couleur */}
                                <div className="text-center mt-2">
                                    <p className={`text-sm font-medium transition-colors ${
                                        isSelected ? 'text-blue-600' : 'text-gray-700 group-hover:text-gray-900'
                                    }`}>
                                        {colorName}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {getColorDescription(index)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Section d'aide */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                        <span className="text-lg mr-2">💡</span>
                        Raccourcis clavier
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                            <kbd className="px-2 py-1 bg-white rounded border border-gray-300 text-xs font-mono">1-{availableColors}</kbd>
                            <span>Sélection rapide</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <kbd className="px-2 py-1 bg-white rounded border border-gray-300 text-xs font-mono">Entrée</kbd>
                            <span>Confirmer</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <kbd className="px-2 py-1 bg-white rounded border border-gray-300 text-xs font-mono">Échap</kbd>
                            <span>Fermer</span>
                        </div>
                    </div>
                </div>

                {/* Couleur actuellement sélectionnée */}
                {selectedColor && (
                    <div className="mt-4 text-center">
                        <div className="inline-flex items-center space-x-3 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
                            <span className="text-sm text-gray-600">Sélection actuelle :</span>
                            <div
                                className="w-6 h-6 rounded-full border-2 border-gray-300"
                                style={{ backgroundColor: COLOR_PALETTE[selectedColor - 1] }}
                            ></div>
                            <span className="font-medium text-gray-800">
                                {colorNames[selectedColor - 1]}
                            </span>
                        </div>
                    </div>
                )}

                {/* Boutons d'action */}
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Annuler
                    </button>
                    {selectedColor && (
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                        >
                            <span className="mr-2">✓</span>
                            Confirmer la sélection
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
};