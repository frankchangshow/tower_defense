import { getTowerTotalCost, getTowerSellValue } from '../utils/towerCalculations.js';

/**
 * TowerInteractionManager - Handles tower selection, menus, upgrades, and selling
 * Extracted from GameScene.js to improve maintainability
 */
class TowerInteractionManager {
    constructor(scene) {
        this.scene = scene;
        this.gameScene = scene; // Reference to the main game scene
        
        // Tower interaction state
        this.selectedTower = null;
        
        // Visual effects managers (set by GameScene)
        this.visualJuiceManager = null;
        this.particleManager = null;
        this.screenShakeManager = null;
        this.audioManager = null;
    }

    setVisualEffects(visualJuiceManager, particleManager, screenShakeManager, audioManager) {
        this.visualJuiceManager = visualJuiceManager;
        this.particleManager = particleManager;
        this.screenShakeManager = screenShakeManager;
        this.audioManager = audioManager;
    }

    selectTower(tower) {
        this.selectedTower = tower;
        this.scene.events.emit('towerSelected', tower);
    }

    deselectTower() {
        if (this.selectedTower) {
            this.selectedTower = null;
            this.scene.events.emit('towerDeselected');
        }
    }

    upgradeTower(tower) {
        console.log(`🎯 upgradeTower called with tower:`, tower);
        console.log(`🎯 Tower details: type=${tower?.towerType}, level=${tower?.level}, hasUpgrade=${!!tower?.upgrade}`);

        // Debug: Check tower level variable
        console.log(`🔍 TOWER LEVEL DEBUG:`);
        console.log(`🔍 tower.level = ${tower.level}`);
        console.log(`🔍 typeof tower.level = ${typeof tower.level}`);
        console.log(`🔍 tower object keys:`, Object.keys(tower));
        console.log(`🔍 tower has 'level' property: ${tower.hasOwnProperty('level')}`);

        // Check if tower can be upgraded (max level is 3)
        if (tower.level >= 3) {
            this.gameScene.showKeyboardHelp('Tower already at maximum level!');
            return;
        }

        // Get upgrade cost
        const upgradeCost = tower.towerData.levels[tower.level].upgradeCost;
        console.log(`💰 Upgrade cost: ${upgradeCost}, Current gold: ${this.gameScene.economy.getGold()}`);

        // Check if player has enough gold
        if (this.gameScene.economy.getGold() < upgradeCost) {
            this.gameScene.showKeyboardHelp(`Need $${upgradeCost} to upgrade!`);
            return;
        }

        // Spend gold
        this.gameScene.economy.addGold(-upgradeCost);

        // Debug: Before upgrade call
        console.log(`🔄 BEFORE upgrade() call:`);
        console.log(`🔄 tower.level = ${tower.level}`);
        console.log(`🔄 tower.upgrade function exists: ${typeof tower.upgrade === 'function'}`);

        // Upgrade tower
        console.log(`🎯 TowerInteractionManager.upgradeTower: Calling tower.upgrade() for ${tower.towerType} L${tower.level}`);
        console.log(`🎯 Tower.upgrade method exists: ${typeof tower.upgrade === 'function'}`);
        console.log(`🎯 Tower.upgrade method:`, tower.upgrade);
        try {
            console.log(`🎯 About to call tower.upgrade()...`);
            tower.upgrade();
            console.log(`🎯 tower.upgrade() returned, about to log completion...`);
            console.log(`🎯 TowerInteractionManager.upgradeTower: tower.upgrade() completed successfully`);

            // Debug: After upgrade call
            console.log(`🔄 AFTER upgrade() call:`);
            console.log(`🔄 tower.level = ${tower.level}`);
            console.log(`🔄 Expected level should be: ${parseInt(tower.level) + 1}`);

        } catch (error) {
            console.error(`❌ ERROR in tower.upgrade():`, error);
            console.error(`❌ Stack:`, error.stack);
        }

        // Add visual effects for tower upgrade
        if (this.visualJuiceManager) {
            this.visualJuiceManager.towerUpgradePowerUp(tower);
        }
        if (this.screenShakeManager) {
            this.screenShakeManager.mediumShake();
        }
        if (this.particleManager) {
            this.particleManager.createExplosion(tower.x, tower.y, 0xffff00, 6);
        }
        
        // Add audio effect for tower upgrade
        if (this.audioManager) {
            this.audioManager.playSound('towerUpgrade');
        }

        this.gameScene.showKeyboardHelp(`Tower upgraded to level ${tower.level}!`);
        this.scene.events.emit('economyUpdate', {
            gold: this.gameScene.economy.getGold(),
            lives: this.gameScene.economy.getLives(),
            wave: this.gameScene.economy.getCurrentWave(),
            score: this.gameScene.economy.getScore()
        });
    }

    sellTower(tower) {
        console.log('💰 Selling tower:', tower.towerType, 'level:', tower.level);

        // Calculate sell value using centralized utility
        const totalCost = getTowerTotalCost(tower);
        const sellValue = getTowerSellValue(tower);

        console.log('📊 Total invested:', totalCost, 'Sell value:', sellValue);

        // Add gold to player
        this.gameScene.economy.addGold(sellValue);

        // Add visual effects for tower selling
        if (this.visualJuiceManager) {
            this.visualJuiceManager.enemyDeathPop(tower);
        }
        if (this.particleManager) {
            this.particleManager.createGoldSparkles(tower.x, tower.y);
        }
        if (this.screenShakeManager) {
            this.screenShakeManager.lightShake();
        }
        
        // Add audio effect for tower selling
        if (this.audioManager) {
            this.audioManager.playSound('enemyDeath'); // Reuse enemy death sound for selling
        }

        // Remove tower from grid
        this.gameScene.grid[tower.gridY][tower.gridX].hasTower = false;
        this.gameScene.grid[tower.gridY][tower.gridX].tower = null;

        // Remove tower from physics group
        this.gameScene.towers.remove(tower);

        // Destroy tower
        tower.destroy();

        // Deselect tower
        this.deselectTower();

        console.log('✅ Tower sold for', sellValue, 'gold');
        this.gameScene.showKeyboardHelp(`Tower sold for $${sellValue}!`);

        // Update UI
        this.scene.events.emit('economyUpdate', {
            gold: this.gameScene.economy.getGold(),
            lives: this.gameScene.economy.getLives(),
            wave: this.gameScene.economy.getCurrentWave(),
            score: this.gameScene.economy.getScore()
        });
    }

    getSelectedTower() {
        return this.selectedTower;
    }
}

export default TowerInteractionManager;
