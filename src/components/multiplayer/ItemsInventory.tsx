import React, { useState } from 'react';
import { PlayerItem, ItemType, ItemRarity, PlayerProgress } from '@/types/multiplayer';

interface ItemsInventoryProps {
    items: PlayerItem[];
    onUseItem: (itemType: ItemType, targetPlayers?: string[]) => void;
    otherPlayers: PlayerProgress[];
    disabled?: boolean;
}

export const ItemsInventory: React.FC<ItemsInventoryProps> = ({
                                                                  items,
                                                                  onUseItem,
                                                                  otherPlayers,
                                                                  disabled = false
                                                              }) => {
    const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
    const [showTargetSelector, setShowTargetSelector] = useState(false);
    const [pendingItem, setPendingItem] = useState<ItemType | null>(null);



    const getCategoryColor = (category: string) => {
        return category === 'bonus'
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200';
    };

    const handleUseItem = (item: PlayerItem) => {
        if (disabled) return;

        const itemInfo = getItemInfo(item.item_type);

        if (itemInfo.usageType === 'others' && otherPlayers.length > 0) {
            // Besoin de sélectionner des cibles
            setPendingItem(item.item_type);
            setShowTargetSelector(true);
        } else {
            // Utilisation directe
            onUseItem(item.item_type);
        }
    };

    const confirmUseItem = () => {
        if (pendingItem) {
            const itemInfo = getItemInfo(pendingItem);

            if (itemInfo.usageType === 'others' && selectedTargets.length === 0) {
                return; // Pas de cibles sélectionnées
            }

            onUseItem(pendingItem, selectedTargets.length > 0 ? selectedTargets : undefined);

            // Reset
            setPendingItem(null);
            setSelectedTargets([]);
            setShowTargetSelector(false);
        }
    };

    const cancelUseItem = () => {
        setPendingItem(null);
        setSelectedTargets([]);
        setShowTargetSelector(false);
    };

    const toggleTarget = (playerId: string) => {
        setSelectedTargets(prev =>
            prev.includes(playerId)
                ? prev.filter(id => id !== playerId)
                : [...prev, playerId]
        );
    };

    // Grouper les objets par type
    const itemCounts = items.reduce((acc, item) => {
        acc[item.item_type] = (acc[item.item_type] || 0) + 1;
        return acc;
    }, {} as Record<ItemType, number>);

    const uniqueItems = Object.keys(itemCounts).map(itemType => {
        const item = items.find(i => i.item_type === itemType as ItemType);
        return item ? { ...item, count: itemCounts[itemType as ItemType] } : null;
    }).filter(Boolean) as (PlayerItem & { count: number })[];

    if (items.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="text-4xl mb-3">🎁</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Aucun objet
                </h3>
                <p className="text-gray-600">
                    Terminez des masterminds rapidement pour obtenir des objets !
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">

            {/* En-tête */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                    Inventaire ({items.length} objets)
                </h3>
                <div className="text-sm text-gray-500">
                    Cliquez pour utiliser
                </div>
            </div>

            {/* Liste des objets */}
            <div className="grid grid-cols-1 gap-3">
                {uniqueItems.map((item) => {
                    const itemInfo = getItemInfo(item.item_type);
                    const rarityInfo = getRarityInfo(item.rarity);

                    return (
                        <div
                            key={item.item_type}
                            className={`border-2 rounded-lg p-4 transition-all ${
                                disabled
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'cursor-pointer hover:shadow-md'
                            } ${getCategoryColor(itemInfo.category)}`}
                            onClick={() => !disabled && handleUseItem(item)}
                        >
                            <div className="flex items-start justify-between">

                                {/* Icône et informations */}
                                <div className="flex items-start space-x-3 flex-1">
                                    <div className="text-2xl">{itemInfo.icon}</div>

                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <h4 className="font-semibold text-gray-800">
                                                {itemInfo.name}
                                            </h4>
                                            {item.count > 1 && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                                    x{item.count}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm text-gray-600 mb-2">
                                            {itemInfo.description}
                                        </p>

                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 text-xs rounded-full border font-medium ${rarityInfo.color}`}>
                                                {rarityInfo.label}
                                            </span>

                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                                itemInfo.category === 'bonus'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {itemInfo.category === 'bonus' ? '🎁 Bonus' : '⚡ Malus'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bouton d'action */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleUseItem(item);
                                    }}
                                    disabled={disabled}
                                    className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                                        itemInfo.category === 'bonus'
                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                            : 'bg-red-600 text-white hover:bg-red-700'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    Utiliser
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Sélecteur de cibles */}
            {showTargetSelector && pendingItem && (
                <div className="mt-6 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                    <h4 className="font-semibold text-blue-800 mb-3">
                        Sélectionnez les cibles pour {getItemInfo(pendingItem).name}
                    </h4>

                    <div className="space-y-2 mb-4">
                        {otherPlayers.map((player) => (
                            <label
                                key={player.user_id}
                                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-100 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedTargets.includes(player.user_id)}
                                    onChange={() => toggleTarget(player.user_id)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="font-medium">{player.username}</span>
                                <span className="text-sm text-gray-600">
                                    ({player.score || 0} pts)
                                </span>
                            </label>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={cancelUseItem}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={confirmUseItem}
                            disabled={selectedTargets.length === 0}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                            Confirmer ({selectedTargets.length} cible{selectedTargets.length > 1 ? 's' : ''})
                        </button>
                    </div>
                </div>
            )}

            {/* Conseils */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                    <span className="text-yellow-600 text-lg">💡</span>
                    <div className="text-sm">
                        <div className="font-medium text-yellow-800 mb-1">Conseils :</div>
                        <ul className="text-yellow-700 space-y-1">
                            <li>• Les objets bonus vous aident, les malus gênent vos adversaires</li>
                            <li>• Utilisez vos objets au bon moment pour maximiser leur impact</li>
                            <li>• Les objets rares ont des effets plus puissants</li>
                            <li>• Terminez vos masterminds rapidement pour obtenir plus d'objets</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Fonction utilitaire exportée
export const getItemInfo = (itemType: ItemType) => {
    const itemsData = {
        [ItemType.EXTRA_HINT]: {
            name: 'Indice Extra',
            description: 'Obtenez un indice supplémentaire pour le mastermind actuel',
            icon: '💡',
            category: 'bonus',
            usageType: 'self'
        },
        [ItemType.TIME_BONUS]: {
            name: 'Temps Bonus',
            description: 'Gagnez 60 secondes supplémentaires',
            icon: '⏰',
            category: 'bonus',
            usageType: 'self'
        },
        [ItemType.SKIP_MASTERMIND]: {
            name: 'Passer Mastermind',
            description: 'Passez automatiquement au mastermind suivant',
            icon: '⏭️',
            category: 'bonus',
            usageType: 'self'
        },
        [ItemType.DOUBLE_SCORE]: {
            name: 'Score x2',
            description: 'Doublez votre score pour le prochain mastermind',
            icon: '⭐',
            category: 'bonus',
            usageType: 'self'
        },
        [ItemType.FREEZE_TIME]: {
            name: 'Figer le Temps',
            description: 'Figez le temps des adversaires pendant 15 secondes',
            icon: '🧊',
            category: 'malus',
            usageType: 'others'
        },
        [ItemType.ADD_MASTERMIND]: {
            name: 'Mastermind Bonus',
            description: 'Ajoutez un mastermind supplémentaire à tous les joueurs',
            icon: '➕',
            category: 'malus',
            usageType: 'all'
        },
        [ItemType.REDUCE_ATTEMPTS]: {
            name: 'Moins de Tentatives',
            description: 'Réduisez les tentatives des adversaires de 2',
            icon: '⚠️',
            category: 'malus',
            usageType: 'others'
        },
        [ItemType.SCRAMBLE_COLORS]: {
            name: 'Mélanger Couleurs',
            description: 'Mélangez l\'affichage des couleurs des adversaires',
            icon: '🌈',
            category: 'malus',
            usageType: 'others'
        }
    };

    return itemsData[itemType] || {
        name: 'Objet Inconnu',
        description: 'Description non disponible',
        icon: '❓',
        category: 'bonus',
        usageType: 'self'
    };
};

export const getRarityInfo = (rarity: ItemRarity) => {
    switch (rarity) {
        case ItemRarity.COMMON:
            return { label: 'Commun', color: 'bg-gray-100 text-gray-700 border-gray-300' };
        case ItemRarity.RARE:
            return { label: 'Rare', color: 'bg-blue-100 text-blue-700 border-blue-300' };
        case ItemRarity.EPIC:
            return { label: 'Épique', color: 'bg-purple-100 text-purple-700 border-purple-300' };
        case ItemRarity.LEGENDARY:
            return { label: 'Légendaire', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' };
        default:
            return { label: 'Inconnu', color: 'bg-gray-100 text-gray-700 border-gray-300' };
    }
};

// Composant pour afficher un objet de manière compacte
export const ItemIcon: React.FC<{
    item: PlayerItem;
    size?: 'sm' | 'md' | 'lg';
    showTooltip?: boolean;
}> = ({ item, size = 'md', showTooltip = true }) => {
    const itemInfo = getItemInfo(item.item_type);
    const rarityInfo = getRarityInfo(item.rarity);

    const sizeClasses = {
        sm: 'w-6 h-6 text-sm',
        md: 'w-8 h-8 text-base',
        lg: 'w-10 h-10 text-lg'
    };

    return (
        <div
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center border-2 ${rarityInfo.color}`}
            title={showTooltip ? `${itemInfo.name} (${rarityInfo.label})` : undefined}
        >
            {itemInfo.icon}
        </div>
    );
};

// Hook utilitaire pour les objets
export const useItems = () => {
    const getItemsByCategory = (items: PlayerItem[]) => {
        return items.reduce((acc, item) => {
            const info = getItemInfo(item.item_type);
            if (!acc[info.category]) acc[info.category] = [];
            acc[info.category].push(item);
            return acc;
        }, {} as Record<string, PlayerItem[]>);
    };

    const getItemsByRarity = (items: PlayerItem[]) => {
        return items.reduce((acc, item) => {
            if (!acc[item.rarity]) acc[item.rarity] = [];
            acc[item.rarity].push(item);
            return acc;
        }, {} as Record<ItemRarity, PlayerItem[]>);
    };

    const canUseItem = (item: PlayerItem, gameState: any) => {
        // Logique pour déterminer si un objet peut être utilisé
        // selon l'état actuel du jeu
        return true; // Simplifié pour l'exemple
    };

    return {
        getItemsByCategory,
        getItemsByRarity,
        canUseItem,
        getItemInfo
    };
};