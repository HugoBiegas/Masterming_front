import React, { useState } from 'react';
import { QuantumPositionProbability } from '@/types/game';
import { COLOR_PALETTE } from '@/utils/constants';

interface QuantumIndicatorsProps {
    positionProbabilities: QuantumPositionProbability[];
    combinationLength: number;
    showDetailedTooltips?: boolean;
    compactMode?: boolean;
}

export const QuantumIndicators: React.FC<QuantumIndicatorsProps> = ({
                                                                        positionProbabilities,
                                                                        combinationLength,
                                                                        showDetailedTooltips = true,
                                                                        compactMode = false
                                                                    }) => {
    const [hoveredPosition, setHoveredPosition] = useState<number | null>(null);

    const getConfidenceColor = (confidence: string) => {
        switch (confidence) {
            case 'high': return 'text-green-600 border-green-500';
            case 'medium': return 'text-yellow-600 border-yellow-500';
            case 'low': return 'text-red-600 border-red-500';
            default: return 'text-gray-600 border-gray-500';
        }
    };

    const getMatchTypeIcon = (matchType: string) => {
        switch (matchType) {
            case 'exact_match': return '🎯';
            case 'color_present': return '🔶';
            case 'no_match': return '❌';
            default: return '❓';
        }
    };

    const getMatchTypeColor = (matchType: string) => {
        switch (matchType) {
            case 'exact_match': return 'border-green-500 bg-green-50';
            case 'color_present': return 'border-orange-500 bg-orange-50';
            case 'no_match': return 'border-red-500 bg-red-50';
            default: return 'border-gray-500 bg-gray-50';
        }
    };

    const getMatchTypeGradient = (matchType: string, probability: number) => {
        const intensity = Math.min(probability * 100, 100);
        switch (matchType) {
            case 'exact_match':
                return `conic-gradient(from 0deg, #10b981 0deg, #10b981 ${intensity * 3.6}deg, transparent ${intensity * 3.6}deg)`;
            case 'color_present':
                return `conic-gradient(from 0deg, #f59e0b 0deg, #f59e0b ${intensity * 3.6}deg, transparent ${intensity * 3.6}deg)`;
            case 'no_match':
                return `conic-gradient(from 0deg, #ef4444 0deg, #ef4444 ${intensity * 3.6}deg, transparent ${intensity * 3.6}deg)`;
            default:
                return `conic-gradient(from 0deg, #6b7280 0deg, #6b7280 ${intensity * 3.6}deg, transparent ${intensity * 3.6}deg)`;
        }
    };

    const formatProbability = (probability: number) => {
        return Math.round(probability * 100);
    };

    const formatConfidence = (confidence: string) => {
        const confidenceMap = {
            'high': 'Haute',
            'medium': 'Moyenne',
            'low': 'Faible'
        };
        return confidenceMap[confidence as keyof typeof confidenceMap] || confidence;
    };

    const formatMatchType = (matchType: string) => {
        const matchTypeMap = {
            'exact_match': 'Position exacte',
            'color_present': 'Couleur présente',
            'no_match': 'Aucune correspondance'
        };
        return matchTypeMap[matchType as keyof typeof matchTypeMap] || matchType;
    };

    // Calculer la disposition de la grille selon le nombre de positions
    const getGridColumns = () => {
        if (combinationLength <= 4) return combinationLength;
        if (combinationLength <= 6) return 3;
        return 4;
    };

    const circleSize = compactMode ? 'w-12 h-12' : 'w-16 h-16';
    const spacing = compactMode ? 'gap-2' : 'gap-3';

    return (
        <div className="space-y-4">
            <div className="text-center">
                <h4 className={`font-semibold text-purple-700 mb-2 ${compactMode ? 'text-sm' : 'text-base'}`}>
                    🔮 Analyse Quantique
                </h4>
                <div className={`text-purple-600 ${compactMode ? 'text-xs' : 'text-sm'}`}>
                    Probabilités quantiques pour chaque position
                </div>
            </div>

            {/* Grille des positions quantiques */}
            <div
                className={`grid ${spacing} justify-items-center`}
                style={{
                    gridTemplateColumns: `repeat(${getGridColumns()}, 1fr)`
                }}
            >
                {positionProbabilities.map((position, index) => {
                    const probabilityPercent = formatProbability(position.exact_match_probability);
                    const isHovered = hoveredPosition === index;

                    return (
                        <div
                            key={index}
                            className="flex flex-col items-center group relative"
                            onMouseEnter={() => showDetailedTooltips && setHoveredPosition(index)}
                            onMouseLeave={() => showDetailedTooltips && setHoveredPosition(null)}
                        >
                            {/* Position number */}
                            <div className={`font-medium text-gray-600 mb-1 ${compactMode ? 'text-xs' : 'text-sm'}`}>
                                Pos {position.position + 1}
                            </div>

                            {/* Main quantum indicator circle */}
                            <div className={`
                                relative ${circleSize} rounded-full border-3 transition-all duration-300 cursor-help
                                ${getMatchTypeColor(position.match_type)}
                                ${isHovered ? 'scale-110 shadow-lg' : 'hover:scale-105'}
                            `}>
                                {/* Background wave animation proportional to probability */}
                                <div
                                    className="absolute inset-0 rounded-full overflow-hidden"
                                    style={{
                                        background: getMatchTypeGradient(position.match_type, position.exact_match_probability)
                                    }}
                                >
                                    {/* Animated wave effect */}
                                    <div
                                        className="absolute inset-0 rounded-full animate-pulse-slow"
                                        style={{
                                            background: `radial-gradient(circle at 30% 30%, 
                                                rgba(255,255,255,0.4) 0%, 
                                                transparent 60%)`
                                        }}
                                    />
                                </div>

                                {/* Content */}
                                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-1">
                                    {/* Match type icon */}
                                    <div className={compactMode ? 'text-sm mb-0.5' : 'text-base mb-1'}>
                                        {getMatchTypeIcon(position.match_type)}
                                    </div>

                                    {/* Probability percentage */}
                                    <div className={`font-bold text-gray-800 ${compactMode ? 'text-xs' : 'text-sm'}`}>
                                        {probabilityPercent}%
                                    </div>
                                </div>

                                {/* Color indicator for attempted color */}
                                <div
                                    className={`absolute -top-1 -right-1 rounded-full border-2 border-white shadow-sm ${
                                        compactMode ? 'w-3 h-3' : 'w-4 h-4'
                                    }`}
                                    style={{
                                        backgroundColor: COLOR_PALETTE[position.attempt_color - 1]
                                    }}
                                    title={`Couleur tentée: ${position.attempt_color}`}
                                />

                                {/* Confidence ring indicator */}
                                <div className={`
                                    absolute -bottom-1 left-1/2 transform -translate-x-1/2 
                                    ${compactMode ? 'w-6 h-1' : 'w-8 h-1.5'} 
                                    rounded-full border ${getConfidenceColor(position.confidence)}
                                `} />
                            </div>

                            {/* Confidence text */}
                            <div className={`
                                font-medium mt-1 px-2 py-0.5 rounded-full text-center
                                ${getConfidenceColor(position.confidence)}
                                bg-white border ${compactMode ? 'text-xs' : 'text-xs'}
                            `}>
                                {formatConfidence(position.confidence)}
                            </div>

                            {/* Detailed tooltip on hover */}
                            {showDetailedTooltips && isHovered && (
                                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2
                                               bg-gray-900 text-white text-xs rounded-lg p-3 opacity-100
                                               transition-opacity duration-200 pointer-events-none z-30
                                               whitespace-nowrap shadow-xl">
                                    <div className="space-y-1">
                                        <div className="font-semibold text-center border-b border-gray-700 pb-1">
                                            Position {position.position + 1}
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                                            <span className="text-gray-300">Probabilité:</span>
                                            <span className="font-medium">{probabilityPercent}%</span>

                                            <span className="text-gray-300">Type:</span>
                                            <span className="font-medium">{formatMatchType(position.match_type)}</span>

                                            <span className="text-gray-300">Confiance:</span>
                                            <span className="font-medium">{formatConfidence(position.confidence)}</span>

                                            <span className="text-gray-300">Mesures:</span>
                                            <span className="font-medium">{position.quantum_measurements}/{position.total_shots}</span>

                                            <span className="text-gray-300">Couleur:</span>
                                            <div className="flex items-center">
                                                <div
                                                    className="w-3 h-3 rounded-full border border-gray-500 mr-1"
                                                    style={{ backgroundColor: COLOR_PALETTE[position.attempt_color - 1] }}
                                                />
                                                <span className="font-medium">#{position.attempt_color}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Arrow pointing down */}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2
                                                   border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Statistics summary */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className={`text-purple-700 font-medium mb-2 ${compactMode ? 'text-xs' : 'text-sm'}`}>
                    📊 Résumé de l'analyse
                </div>
                <div className={`grid grid-cols-2 gap-2 ${compactMode ? 'text-xs' : 'text-sm'}`}>
                    <div className="text-center">
                        <div className="text-green-700 font-semibold">
                            {positionProbabilities.filter(p => p.match_type === 'exact_match').length}
                        </div>
                        <div className="text-green-600">Positions exactes</div>
                    </div>
                    <div className="text-center">
                        <div className="text-orange-700 font-semibold">
                            {positionProbabilities.filter(p => p.match_type === 'color_present').length}
                        </div>
                        <div className="text-orange-600">Couleurs présentes</div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className={`text-purple-700 font-medium mb-2 ${compactMode ? 'text-xs' : 'text-sm'}`}>
                    Légende quantique :
                </div>
                <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2 ${compactMode ? 'text-xs' : 'text-sm'}`}>
                    <div className="flex items-center space-x-1">
                        <span>🎯</span>
                        <span className="text-green-700">Position exacte</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <span>🔶</span>
                        <span className="text-orange-700">Couleur présente</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <span>❌</span>
                        <span className="text-red-700">Aucune correspondance</span>
                    </div>
                </div>
                <div className={`text-purple-600 mt-2 italic ${compactMode ? 'text-xs' : 'text-sm'}`}>
                    La vague circulaire indique la probabilité quantique (0-100%)
                </div>
            </div>
        </div>
    );
};