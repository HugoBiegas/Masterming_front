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
    return (
        <div className="grid grid-cols-4 gap-2 p-4 bg-gray-50 rounded-lg">
            {Array.from({ length: availableColors }, (_, index) => {
                const colorIndex = index + 1;
                const color = COLOR_PALETTE[index] || '#CCCCCC';

                return (
                    <button
                        key={colorIndex}
                        onClick={() => onColorSelect(colorIndex)}
                        className={`w-12 h-12 rounded-full border-4 transition-all ${
                            selectedColor === colorIndex
                                ? 'border-black scale-110'
                                : 'border-gray-300 hover:border-gray-500'
                        }`}
                        style={{ backgroundColor: color }}
                        title={`Couleur ${colorIndex}`}
                    />
                );
            })}
        </div>
    );
};
