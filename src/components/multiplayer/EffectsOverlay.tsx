import React, { useState, useEffect } from 'react';
import { ItemType } from '@/types/multiplayer';

interface Effect {
    type: ItemType;
    endTime: number;
    message: string;
}

interface EffectsOverlayProps {
    effects: Effect[];
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
}

// Fonction utilitaire pour les informations d'effets
const getEffectInfo = (type: ItemType) => {
    const effectsInfo = {
        [ItemType.EXTRA_HINT]: {
            icon: '💡',
            name: 'Indice Extra',
            color: 'bg-blue-500',
            textColor: 'text-blue-800',
            bgColor: 'bg-blue-100',
            borderColor: 'border-blue-300'
        },
        [ItemType.TIME_BONUS]: {
            icon: '⏰',
            name: 'Temps Bonus',
            color: 'bg-green-500',
            textColor: 'text-green-800',
            bgColor: 'bg-green-100',
            borderColor: 'border-green-300'
        },
        [ItemType.SKIP_MASTERMIND]: {
            icon: '⏭️',
            name: 'Mastermind Passé',
            color: 'bg-purple-500',
            textColor: 'text-purple-800',
            bgColor: 'bg-purple-100',
            borderColor: 'border-purple-300'
        },
        [ItemType.DOUBLE_SCORE]: {
            icon: '⭐',
            name: 'Score x2',
            color: 'bg-yellow-500',
            textColor: 'text-yellow-800',
            bgColor: 'bg-yellow-100',
            borderColor: 'border-yellow-300'
        },
        [ItemType.FREEZE_TIME]: {
            icon: '🧊',
            name: 'Temps Figé',
            color: 'bg-cyan-500',
            textColor: 'text-cyan-800',
            bgColor: 'bg-cyan-100',
            borderColor: 'border-cyan-300'
        },
        [ItemType.ADD_MASTERMIND]: {
            icon: '➕',
            name: 'Mastermind Ajouté',
            color: 'bg-red-500',
            textColor: 'text-red-800',
            bgColor: 'bg-red-100',
            borderColor: 'border-red-300'
        },
        [ItemType.REDUCE_ATTEMPTS]: {
            icon: '⚠️',
            name: 'Tentatives Réduites',
            color: 'bg-orange-500',
            textColor: 'text-orange-800',
            bgColor: 'bg-orange-100',
            borderColor: 'border-orange-300'
        },
        [ItemType.SCRAMBLE_COLORS]: {
            icon: '🌈',
            name: 'Couleurs Mélangées',
            color: 'bg-pink-500',
            textColor: 'text-pink-800',
            bgColor: 'bg-pink-100',
            borderColor: 'border-pink-300'
        }
    };

    return effectsInfo[type] || {
        icon: '❓',
        name: 'Effet Inconnu',
        color: 'bg-gray-500',
        textColor: 'text-gray-800',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-300'
    };
};

export const EffectsOverlay: React.FC<EffectsOverlayProps> = ({
                                                                  effects,
                                                                  position = 'top-right'
                                                              }) => {
    const [activeEffects, setActiveEffects] = useState<Effect[]>([]);
    const [notifications, setNotifications] = useState<Array<Effect & { id: string }>>([]);

    // Mettre à jour les effets actifs
    useEffect(() => {
        const now = Date.now();
        const current = effects.filter(effect => effect.endTime > now);
        setActiveEffects(current);
    }, [effects]);

    // Ajouter des notifications pour les nouveaux effets
    useEffect(() => {
        effects.forEach(effect => {
            const notificationId = `${effect.type}_${effect.endTime}`;
            const exists = notifications.some(n => n.id === notificationId);

            if (!exists) {
                setNotifications(prev => [
                    ...prev,
                    { ...effect, id: notificationId }
                ]);

                // Supprimer la notification après 3 secondes
                setTimeout(() => {
                    setNotifications(prev => prev.filter(n => n.id !== notificationId));
                }, 3000);
            }
        });
    }, [effects, notifications]);

    const getPositionClasses = () => {
        switch (position) {
            case 'top-left':
                return 'top-4 left-4';
            case 'top-right':
                return 'top-4 right-4';
            case 'bottom-left':
                return 'bottom-4 left-4';
            case 'bottom-right':
                return 'bottom-4 right-4';
            case 'center':
                return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
            default:
                return 'top-4 right-4';
        }
    };

    const getRemainingTime = (effect: Effect) => {
        const remaining = Math.max(0, effect.endTime - Date.now());
        return Math.ceil(remaining / 1000);
    };

    // Effets de fond d'écran pour certains effets
    const getScreenEffect = () => {
        const scrambleEffect = activeEffects.find(e => e.type === ItemType.SCRAMBLE_COLORS);
        const freezeEffect = activeEffects.find(e => e.type === ItemType.FREEZE_TIME);

        if (scrambleEffect) {
            return (
                <div className="fixed inset-0 pointer-events-none z-30">
                    <div
                        className="w-full h-full bg-gradient-to-br from-red-500/10 via-blue-500/10 to-green-500/10 animate-pulse rainbow-effect"
                    />
                </div>
            );
        }

        if (freezeEffect) {
            return (
                <div className="fixed inset-0 pointer-events-none z-30">
                    <div className="w-full h-full bg-cyan-500/5">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-cyan-200/20 animate-pulse" />
                        {/* Flocons de neige */}
                        {Array.from({ length: 15 }, (_, i) => (
                            <div
                                key={i}
                                className="absolute text-cyan-300 text-lg animate-bounce"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 2}s`,
                                    animationDuration: `${2 + Math.random() * 2}s`
                                }}
                            >
                                ❄️
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <>
            {/* Styles CSS globaux */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes rainbow {
                        0% { filter: hue-rotate(0deg); }
                        100% { filter: hue-rotate(360deg); }
                    }
                    
                    .rainbow-effect {
                        animation: rainbow 2s linear infinite;
                    }
                    
                    @keyframes slideIn {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                    
                    @keyframes notificationSlide {
                        0% {
                            transform: translateY(-100px) translateX(-50%);
                            opacity: 0;
                        }
                        10% {
                            transform: translateY(0) translateX(-50%);
                            opacity: 1;
                        }
                        90% {
                            transform: translateY(0) translateX(-50%);
                            opacity: 1;
                        }
                        100% {
                            transform: translateY(-100px) translateX(-50%);
                            opacity: 0;
                        }
                    }
                `
            }} />

            {/* Effets de fond d'écran */}
            {getScreenEffect()}

            {/* Indicateurs d'effets actifs */}
            {activeEffects.length > 0 && (
                <div className={`fixed ${getPositionClasses()} z-40 space-y-2`}>
                    {activeEffects.map((effect, index) => {
                        const effectInfo = getEffectInfo(effect.type);
                        const remainingTime = getRemainingTime(effect);

                        return (
                            <div
                                key={`${effect.type}_${effect.endTime}`}
                                className={`flex items-center space-x-3 p-3 rounded-lg border-2 shadow-lg backdrop-blur-sm ${
                                    effectInfo.bgColor
                                } ${effectInfo.borderColor} ${effectInfo.textColor}`}
                                style={{
                                    animation: `slideIn 0.3s ease-out ${index * 0.1}s both`
                                }}
                            >
                                {/* Icône de l'effet */}
                                <div className="text-xl">{effectInfo.icon}</div>

                                {/* Informations de l'effet */}
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm">
                                        {effectInfo.name}
                                    </div>
                                    <div className="text-xs opacity-75">
                                        {effect.message}
                                    </div>
                                </div>

                                {/* Compte à rebours */}
                                <div className={`w-8 h-8 rounded-full ${effectInfo.color} flex items-center justify-center text-white text-xs font-bold`}>
                                    {remainingTime}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Notifications d'effets */}
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2">
                {notifications.map((notification) => {
                    const effectInfo = getEffectInfo(notification.type);

                    return (
                        <div
                            key={notification.id}
                            className={`flex items-center space-x-3 p-4 rounded-lg shadow-lg ${
                                effectInfo.bgColor
                            } ${effectInfo.borderColor} ${effectInfo.textColor} border-2`}
                            style={{
                                animation: 'notificationSlide 3s ease-out forwards'
                            }}
                        >
                            <div className="text-2xl">{effectInfo.icon}</div>
                            <div>
                                <div className="font-bold">{effectInfo.name}</div>
                                <div className="text-sm">{notification.message}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

// Composant d'effet individuel réutilisable
export const EffectIndicator: React.FC<{
    effect: Effect;
    onDismiss?: () => void;
    compact?: boolean;
}> = ({ effect, onDismiss, compact = false }) => {
    const effectInfo = getEffectInfo(effect.type);
    const remainingTime = Math.max(0, Math.ceil((effect.endTime - Date.now()) / 1000));

    if (compact) {
        return (
            <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs ${
                effectInfo.bgColor
            } ${effectInfo.textColor}`}>
                <span>{effectInfo.icon}</span>
                <span className="font-medium">{remainingTime}s</span>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="text-xs opacity-75 hover:opacity-100"
                    >
                        ✕
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border ${
            effectInfo.bgColor
        } ${effectInfo.borderColor} ${effectInfo.textColor}`}>
            <div className="flex items-center space-x-3">
                <span className="text-lg">{effectInfo.icon}</span>
                <div>
                    <div className="font-semibold">{effectInfo.name}</div>
                    <div className="text-sm opacity-75">{effect.message}</div>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <span className="text-sm font-bold">{remainingTime}s</span>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="text-sm opacity-75 hover:opacity-100"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
};

// Hook pour gérer les effets
export const useEffects = () => {
    const [effects, setEffects] = useState<Effect[]>([]);

    const addEffect = (type: ItemType, duration: number, message: string) => {
        const newEffect: Effect = {
            type,
            endTime: Date.now() + duration * 1000,
            message
        };

        setEffects(prev => [...prev.filter(e => e.type !== type), newEffect]);
    };

    const removeEffect = (type: ItemType) => {
        setEffects(prev => prev.filter(e => e.type !== type));
    };

    const clearAllEffects = () => {
        setEffects([]);
    };

    const getActiveEffects = () => {
        const now = Date.now();
        return effects.filter(e => e.endTime > now);
    };

    return {
        effects: getActiveEffects(),
        addEffect,
        removeEffect,
        clearAllEffects
    };
};