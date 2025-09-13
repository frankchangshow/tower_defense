// Tower configurations - data-driven for easy balancing
import { getTowerTotalCost as centralizedGetTowerTotalCost, getTowerSellValue as centralizedGetTowerSellValue } from '../utils/towerCalculations.js';

export const TOWERS = {
  arrow: {
    name: "Arrow Tower",
    cost: 80,
    projectileKey: "proj_arrow",
    projectileSpeed: 12, // tiles per second
    color: 0x8B4513, // Brown
    levels: [
      { dmg: 10, fireRate: 0.80, range: 3.5 },
      { dmg: 13, fireRate: 0.70, range: 4.0, upgradeCost: 60 },
      { dmg: 16, fireRate: 0.60, range: 4.5, upgradeCost: 90 }
    ],
    targetingModes: ["first", "last", "close"],
    sellRefundRatio: 0.7
  },
  cannon: {
    name: "Cannon",
    cost: 120,
    projectileKey: "proj_cannon",
    projectileSpeed: 8, // tiles per second
    color: 0x696969, // Gray
    splashRadius: [1.2, 1.5, 1.8],
    levels: [
      { dmg: 18, fireRate: 1.30, range: 3.0 },
      { dmg: 24, fireRate: 1.15, range: 3.5, upgradeCost: 80 },
      { dmg: 30, fireRate: 1.00, range: 4.0, upgradeCost: 120 }
    ],
    targetingModes: ["first", "last", "close"],
    sellRefundRatio: 0.7
  },
  frost: {
    name: "Frost Tower",
    cost: 100,
    projectileKey: "proj_frost",
    projectileSpeed: 10, // tiles per second
    color: 0x4682B4, // Steel Blue
    slowPct: [0.30, 0.40, 0.50],
    slowDur: [2.0, 2.5, 3.0],
    levels: [
      { dmg: 4, fireRate: 1.20, range: 3.0 },
      { dmg: 6, fireRate: 1.05, range: 3.5, upgradeCost: 70 },
      { dmg: 8, fireRate: 0.90, range: 4.0, upgradeCost: 110 }
    ],
    targetingModes: ["first", "strong"],
    sellRefundRatio: 0.7
  }
};

// Helper functions for tower calculations
// ✅ REMOVED: Duplicate functions - now using centralized versions from utils/towerCalculations.js
// Keeping exports for backward compatibility, but delegating to centralized functions
export const getTowerTotalCost = (towerType, level) => {
  return centralizedGetTowerTotalCost(towerType, level);
};

export const getTowerSellValue = (towerType, level) => {
  return centralizedGetTowerSellValue(towerType, level);
};
