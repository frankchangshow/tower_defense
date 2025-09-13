import { TOWERS } from '../data/towers.js';

/**
 * Centralized tower calculation utilities
 * Eliminates duplicate code and ensures consistent calculations across the game
 */

/**
 * Calculate total cost of a tower (base cost + all upgrade costs up to given level)
 * @param {object|string} towerOrType - Tower object or tower type string
 * @param {number} level - Tower level (only needed if towerOrType is string)
 * @returns {number} Total cost
 */
export const getTowerTotalCost = (towerOrType, level = null) => {
    let towerData;
    let targetLevel;

    // Handle different input types
    if (typeof towerOrType === 'string') {
        // Input: towerType string + level number
        towerData = TOWERS[towerOrType];
        targetLevel = level;
    } else {
        // Input: tower object
        towerData = towerOrType.towerData;
        targetLevel = towerOrType.level;
    }

    if (!towerData) {
        console.error('❌ getTowerTotalCost: Invalid tower data');
        return 0;
    }

    let totalCost = towerData.cost;
    for (let i = 1; i < targetLevel; i++) {
        if (towerData.levels[i] && towerData.levels[i].upgradeCost) {
            totalCost += towerData.levels[i].upgradeCost;
        }
    }
    return totalCost;
};

/**
 * Calculate sell value of a tower (total cost * sell refund ratio)
 * @param {object|string} towerOrType - Tower object or tower type string
 * @param {number} level - Tower level (only needed if towerOrType is string)
 * @returns {number} Sell value (floored)
 */
export const getTowerSellValue = (towerOrType, level = null) => {
    const totalCost = getTowerTotalCost(towerOrType, level);

    let sellRefundRatio;
    if (typeof towerOrType === 'string') {
        sellRefundRatio = TOWERS[towerOrType].sellRefundRatio;
    } else {
        sellRefundRatio = towerOrType.towerData.sellRefundRatio;
    }

    return Math.floor(totalCost * sellRefundRatio);
};

/**
 * Calculate upgrade cost for a specific level
 * @param {object|string} towerOrType - Tower object or tower type string
 * @param {number} level - Level to upgrade TO (only needed if towerOrType is string)
 * @returns {number} Upgrade cost
 */
export const getTowerUpgradeCost = (towerOrType, level = null) => {
    let towerData;
    let currentLevel;

    if (typeof towerOrType === 'string') {
        towerData = TOWERS[towerOrType];
        currentLevel = level;
    } else {
        towerData = towerOrType.towerData;
        currentLevel = towerOrType.level;
    }

    // For upgrading, we need the cost to upgrade TO the next level
    const nextLevel = currentLevel;
    const nextLevelData = towerData.levels[nextLevel];

    if (!towerData || !nextLevelData || !nextLevelData.upgradeCost) {
        console.error('❌ getTowerUpgradeCost: Invalid tower data or no upgrade cost for level', nextLevel);
        console.error('Tower data:', towerData);
        console.error('Next level data:', nextLevelData);
        return 0;
    }

    return nextLevelData.upgradeCost;
};

/**
 * Check if player can afford a tower or upgrade
 * @param {object} economy - Economy system
 * @param {object|string} towerOrType - Tower object or tower type string
 * @param {number} level - Level to check (only needed if towerOrType is string)
 * @returns {boolean} Can afford
 */
export const canAffordTower = (economy, towerOrType, level = null) => {
    const cost = getTowerTotalCost(towerOrType, level);
    return economy.getGold() >= cost;
};

/**
 * Check if player can afford tower upgrade
 * @param {object} economy - Economy system
 * @param {object} tower - Tower object
 * @returns {boolean} Can afford upgrade
 */
export const canAffordUpgrade = (economy, tower) => {
    if (tower.level >= 3) return false;
    const upgradeCost = getTowerUpgradeCost(tower, tower.level);
    return economy.getGold() >= upgradeCost;
};
