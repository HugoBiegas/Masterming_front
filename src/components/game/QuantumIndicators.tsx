import React, { useState, useRef } from 'react';
import { QuantumPositionProbability } from '@/types/game';
import { COLOR_PALETTE } from '@/utils/constants';

interface QuantumIndicatorsProps {
    positionProbabilities: QuantumPositionProbability[];
    combinationLength: number;
    showDetailedTooltips?: boolean;
    compactMode?: boolean;
}

// Nouveau composant de tooltip séparé avec Portal
interface QuantumTooltipProps {
    children: React.ReactNode;
    targetRef: React.RefObject<HTMLElement>;
    isVisible: boolean;
}

const QuantumTooltip: React.FC<QuantumTooltipProps> = ({ children, targetRef, isVisible }) => {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const tooltipRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!isVisible || !targetRef.current) return;

        const updatePosition = () => {
            if (!targetRef.current || !tooltipRef.current) return;

            const targetRect = targetRef.current.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();

            // Position par défaut : à gauche de l'élément
            let left = targetRect.left - tooltipRect.width - 16;
            let top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);

            // Si le tooltip sort à gauche, le mettre à droite
            if (left < 10) {
                left = targetRect.right + 16;
            }

            // Si le tooltip sort à droite, le remettre à gauche mais plus près
            if (left + tooltipRect.width > window.innerWidth - 10) {
                left = targetRect.left - tooltipRect.width - 8;
            }

            // Ajustement vertical si nécessaire
            if (top < 10) {
                top = 10;
            } else if (top + tooltipRect.height > window.innerHeight - 10) {
                top = window.innerHeight - tooltipRect.height - 10;
            }

            setPosition({ top, left });
        };

        // Mise à jour initiale
        updatePosition();

        // Mise à jour sur scroll ou resize
        const handleUpdate = () => updatePosition();
        window.addEventListener('scroll', handleUpdate, true);
        window.addEventListener('resize', handleUpdate);

        return () => {
            window.removeEventListener('scroll', handleUpdate, true);
            window.removeEventListener('resize', handleUpdate);
        };
    }, [isVisible, targetRef]);

    if (!isVisible) return null;

    return ReactDOM.createPortal(
        <div
            ref={tooltipRef}
            className="quantum-tooltip-portal"
            style={{
                position: 'fixed',
                top: `${position.top}px`,
                left: `${position.left}px`,
                zIndex: 2147483647,
                pointerEvents: 'none',
            }}
        >
            <div className="bg-gray-900 text-white rounded-lg p-3 shadow-2xl max-w-xs animate-fade-in">
                {children}
            </div>
        </div>,
        document.body
    );
};

export const QuantumIndicators: React.FC<QuantumIndicatorsProps> = ({
                                                                        positionProbabilities,
                                                                        combinationLength,
                                                                        showDetailedTooltips = true,
                                                                        compactMode = false
                                                                    }) => {
    const [hoveredPosition, setHoveredPosition] = useState<number | null>(null);
    const indicatorRefs = useRef<(HTMLDivElement | null)[]>([]);

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

    const getGridColumns = () => {
        if (combinationLength <= 4) return combinationLength;
        if (combinationLength <= 6) return 3;
        return 4;
    };

    const circleSize = compactMode ? 'w-12 h-12' : 'w-16 h-16';
    const spacing = compactMode ? 'gap-2' : 'gap-3';

    return (
        <div className="space-y-4">
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
                            <div className={`font-medium text-gray-600 mb-1 ${compactMode ? 'text-xs' : 'text-sm'}`}>
                                Pos {position.position + 1}
                            </div>

                            <div
                                ref={el => indicatorRefs.current[index] = el}
                                className={`
                                    relative ${circleSize} rounded-full border-3 transition-all duration-300 cursor-help
                                    ${getMatchTypeColor(position.match_type)}
                                    ${isHovered ? 'scale-125 shadow-xl' : 'hover:scale-115'}
                                `}
                            >
                                <div
                                    className="absolute inset-0 rounded-full overflow-hidden"
                                    style={{
                                        background: getMatchTypeGradient(position.match_type, position.exact_match_probability)
                                    }}
                                >
                                    <div
                                        className="absolute inset-0 rounded-full animate-pulse-slow"
                                        style={{
                                            background: `radial-gradient(circle at 30% 30%, 
                                                rgba(255,255,255,0.4) 0%, 
                                                transparent 60%)`
                                        }}
                                    />
                                </div>

                                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-1">
                                    <div className={compactMode ? 'text-sm mb-0.5' : 'text-base mb-1'}>
                                        {getMatchTypeIcon(position.match_type)}
                                    </div>
                                    <div className={`font-bold text-gray-800 ${compactMode ? 'text-xs' : 'text-sm'}`}>
                                        {probabilityPercent}%
                                    </div>
                                </div>

                                <div
                                    className={`absolute -top-1 -right-1 rounded-full border-2 border-white shadow-sm ${
                                        compactMode ? 'w-3 h-3' : 'w-4 h-4'
                                    }`}
                                    style={{
                                        backgroundColor: COLOR_PALETTE[position.attempt_color - 1]
                                    }}
                                    title={`Couleur tentée: ${position.attempt_color}`}
                                />

                                <div className={`
                                    absolute -bottom-1 left-1/2 transform -translate-x-1/2 
                                    ${compactMode ? 'w-6 h-1' : 'w-8 h-1.5'} 
                                    rounded-full border ${getConfidenceColor(position.confidence)}
                                `} />
                            </div>

                            <div className={`
                                font-medium mt-1 px-2 py-0.5 rounded-full text-center
                                ${getConfidenceColor(position.confidence)}
                                bg-white border ${compactMode ? 'text-xs' : 'text-xs'}
                            `}>
                                {formatConfidence(position.confidence)}
                            </div>

                            {/* Tooltip avec Portal */}
                            {showDetailedTooltips && (
                                <QuantumTooltip
                                    targetRef={{ current: indicatorRefs.current[index] } as React.RefObject<HTMLElement>}
                                    isVisible={isHovered}
                                >
                                    <div className="space-y-2">
                                        <div className="font-bold text-center border-b border-gray-700 pb-2 text-sm">
                                            Position {position.position + 1}
                                        </div>
                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-300">Probabilité:</span>
                                                <span className="font-bold text-white">{probabilityPercent}%</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-300">Type:</span>
                                                <span className="font-bold text-white text-right">{formatMatchType(position.match_type)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-300">Confiance:</span>
                                                <span className="font-bold text-white">{formatConfidence(position.confidence)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-300">Mesures:</span>
                                                <span className="font-bold text-white">{position.quantum_measurements}/{position.total_shots}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-300">Couleur:</span>
                                                <div className="flex items-center">
                                                    <div
                                                        className="w-3 h-3 rounded-full border border-gray-400 mr-1"
                                                        style={{ backgroundColor: COLOR_PALETTE[position.attempt_color - 1] }}
                                                    />
                                                    <span className="font-bold text-white">#{position.attempt_color}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </QuantumTooltip>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Import ReactDOM pour le portal
import ReactDOM from 'react-dom';