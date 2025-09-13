import { TOWERS } from '../data/towers.js';
import { getTotalWaves, ECON } from '../data/waves.js';
import { getTowerTotalCost, getTowerSellValue, getTowerUpgradeCost, canAffordTower, canAffordUpgrade } from '../utils/towerCalculations.js';

class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: false });
        console.log('🎮 UIScene: Constructor called');
    }

    create() {
        console.log('🎮 UIScene: Create method called - initializing UI');
        console.log('🎮 UIScene: ECON config loaded:', {
            startGold: ECON.startGold,
            lives: ECON.lives,
            waveBonus: ECON.waveBonus(1)
        });

        // Track selected tower type for highlighting
        this.selectedTowerType = null;

        // Create UI groups
        this.uiGroup = this.add.group();

        // Create HUD elements
        this.createHUD();

        // Create tower shop
        this.createTowerShop();

        // Create tower menu (initially hidden)
        this.createTowerMenu();

        // Set up event listeners
        this.setupEventListeners();

        // Initial UI state
        const initialState = {
            gold: ECON.startGold,
            lives: ECON.lives,
            wave: 1,
            score: 0
        };
        console.log('🎮 UIScene: Setting initial UI state:', initialState);
        this.updateHUD(initialState);
    }

    createHUD() {
        // Top HUD bar background
        this.hudBg = this.add.rectangle(480, 30, 960, 60, 0x000000, 0.8);
        this.uiGroup.add(this.hudBg);

        // Gold display
        this.goldIcon = this.add.text(50, 20, '$', { font: '24px Arial', fill: '#ffff00' });
        this.goldText = this.add.text(75, 25, ECON.startGold.toString(), { font: '18px Arial', fill: '#ffff00' });
        this.uiGroup.addMultiple([this.goldIcon, this.goldText]);

        // Lives display
        this.livesIcon = this.add.text(200, 20, '❤️', { font: '24px Arial' });
        this.livesText = this.add.text(230, 25, ECON.lives.toString(), { font: '18px Arial', fill: '#ff0000' });
        this.uiGroup.addMultiple([this.livesIcon, this.livesText]);

        // Wave display
        this.waveText = this.add.text(350, 25, 'Wave: 1/10', { font: '18px Arial', fill: '#ffffff' });
        this.uiGroup.add(this.waveText);

        // Score display
        this.scoreText = this.add.text(480, 25, 'Score: 0', { font: '18px Arial', fill: '#ffffff' });
        this.uiGroup.add(this.scoreText);

        // Control buttons
        this.createControlButtons();
    }

    createControlButtons() {
        const buttonY = 25;

        // Pause/Resume button
        this.pauseButton = this.add.rectangle(650, buttonY, 100, 30, 0xffa500);
        this.pauseText = this.add.text(650, buttonY, 'Pause (P)', { font: '11px Arial', fill: '#ffffff' });
        this.pauseText.setOrigin(0.5);
        this.pauseButton.setInteractive();

        this.pauseButton.on('pointerdown', () => {
            this.scene.get('GameScene').events.emit('togglePause');
        });

        // Speed buttons
        this.speed1xButton = this.add.rectangle(720, buttonY, 30, 30, 0x4CAF50);
        this.speed1xText = this.add.text(720, buttonY, '1x', { font: '14px Arial', fill: '#ffffff' });
        this.speed1xText.setOrigin(0.5);
        this.speed1xButton.setInteractive();

        this.speed2xButton = this.add.rectangle(760, buttonY, 30, 30, 0x757575);
        this.speed2xText = this.add.text(760, buttonY, '2x', { font: '14px Arial', fill: '#ffffff' });
        this.speed2xText.setOrigin(0.5);
        this.speed2xButton.setInteractive();

        this.speed1xButton.on('pointerdown', () => {
            this.setGameSpeed(1);
        });

        this.speed2xButton.on('pointerdown', () => {
            this.setGameSpeed(2);
        });

        // Skip Wave button (initially hidden) - moved right to avoid overlap with speed buttons
        this.skipButton = this.add.rectangle(830, buttonY, 80, 30, 0x9C27B0);
        this.skipText = this.add.text(830, buttonY, 'Skip Wave (S)', { font: '12px Arial', fill: '#ffffff' });
        this.skipText.setOrigin(0.5);
        this.skipButton.setInteractive();
        this.skipButton.setVisible(false);

        this.skipButton.on('pointerdown', () => {
            this.scene.get('GameScene').events.emit('skipWave');
        });

        // Keyboard controls for control buttons
        this.input.keyboard.on('keydown-P', () => {
            this.scene.get('GameScene').events.emit('togglePause');
        });

        this.input.keyboard.on('keydown-S', () => {
            if (this.skipButton.visible) {
                this.scene.get('GameScene').events.emit('skipWave');
            }
        });

        this.uiGroup.addMultiple([
            this.pauseButton, this.pauseText,
            this.speed1xButton, this.speed1xText,
            this.speed2xButton, this.speed2xText,
            this.skipButton, this.skipText
        ]);
    }

    createTowerShop() {
        // Tower shop panel
        this.shopBg = this.add.rectangle(80, 450, 140, 200, 0x333333, 0.9);
        this.uiGroup.add(this.shopBg);

        // Shop title
        this.shopTitle = this.add.text(80, 370, 'TOWERS', { font: '16px Arial', fill: '#ffffff' });
        this.shopTitle.setOrigin(0.5);
        this.uiGroup.add(this.shopTitle);

        // Tower buttons - moved down to avoid overlapping title
        const towerTypes = ['arrow', 'cannon', 'frost'];
        let yPos = 410;

        this.towerButtons = {};

        towerTypes.forEach((towerType, index) => {
            const towerData = TOWERS[towerType];
            const button = this.add.rectangle(80, yPos, 120, 35, 0x666666);
            const text = this.add.text(80, yPos, `${towerData.name} (${index + 1})\n$${towerData.cost}`, {
                font: '12px Arial',
                fill: '#ffffff',
                align: 'center'
            });
            text.setOrigin(0.5);

            button.setInteractive();
            button.on('pointerover', () => {
                if (this.canAffordTower(towerType)) {
                    button.setFillStyle(0x888888);
                }
            });
            button.on('pointerout', () => {
                button.setFillStyle(0x666666);
            });
            button.on('pointerdown', () => {
                if (this.canAffordTower(towerType)) {
                    this.scene.get('GameScene').events.emit('placeTower', towerType);
                }
            });

            this.towerButtons[towerType] = { button, text };
            this.uiGroup.addMultiple([button, text]);

            yPos += 45;
        });

        // Keyboard controls for tower selection
        this.input.keyboard.on('keydown-ONE', () => {
            if (this.canAffordTower('arrow')) {
                this.scene.get('GameScene').events.emit('placeTower', 'arrow');
            }
        });

        this.input.keyboard.on('keydown-TWO', () => {
            if (this.canAffordTower('cannon')) {
                this.scene.get('GameScene').events.emit('placeTower', 'cannon');
            }
        });

        this.input.keyboard.on('keydown-THREE', () => {
            if (this.canAffordTower('frost')) {
                this.scene.get('GameScene').events.emit('placeTower', 'frost');
            }
        });
    }

    createTowerMenu() {
        // Tower interaction menu (radial menu)
        this.towerMenuBg = this.add.circle(0, 0, 80, 0x444444, 0.9);
        this.towerMenuBg.setVisible(false);

        // Menu buttons
        this.upgradeButton = this.add.circle(0, 0, 25, 0x4CAF50);
        this.upgradeButton.setVisible(false);
        this.upgradeText = this.add.text(0, 0, 'Upgrade', { font: '12px Arial', fill: '#ffffff' });
        this.upgradeText.setOrigin(0.5);
        this.upgradeText.setVisible(false);

        this.sellButton = this.add.circle(0, 0, 25, 0xF44336);
        this.sellButton.setVisible(false);
        this.sellText = this.add.text(0, 0, 'Sell', { font: '12px Arial', fill: '#ffffff' });
        this.sellText.setOrigin(0.5);
        this.sellText.setVisible(false);


        // Make buttons interactive
        this.upgradeButton.setInteractive();
        this.sellButton.setInteractive();

        this.upgradeButton.on('pointerdown', () => {
            console.log(`🎯 UI.upgradeButton clicked for ${this.selectedTower?.towerType} L${this.selectedTower?.level}`);
            if (this.selectedTower) {
                // Check if player can afford the upgrade
                const currentGold = parseInt(this.goldText.text);
                const upgradeCost = getTowerUpgradeCost(this.selectedTower);

                if (currentGold >= upgradeCost) {
                    console.log(`🎯 UI: Emitting upgradeTower event`);
                    this.scene.get('GameScene').events.emit('upgradeTower', this.selectedTower);
                    this.hideTowerMenu();
                } else {
                    console.log(`❌ UI: Not enough money for upgrade`);
                    this.showKeyboardHelp(`Not enough money! Need $${upgradeCost - currentGold} more`);
                }
            } else {
                console.log(`❌ UI: No selected tower for upgrade`);
            }
        });

        this.sellButton.on('pointerdown', () => {
            if (this.selectedTower) {
                this.scene.get('GameScene').events.emit('sellTower', this.selectedTower);
                this.hideTowerMenu();
            }
        });

        this.uiGroup.addMultiple([
            this.towerMenuBg, this.upgradeButton, this.upgradeText,
            this.sellButton, this.sellText
        ]);
    }

    setupEventListeners() {
        // Listen for GameScene events
        const gameScene = this.scene.get('GameScene');

        gameScene.events.on('economyUpdate', (data) => {
            this.updateHUD(data);
        });

        gameScene.events.on('towerSelected', (tower) => {
            this.showTowerMenu(tower);
        });

        gameScene.events.on('towerDeselected', () => {
            this.hideTowerMenu();
        });

        gameScene.events.on('towerTypeSelected', (towerType) => {
            this.highlightSelectedTower(towerType);
        });

        gameScene.events.on('towerPlaced', (tower) => {
            this.onTowerPlaced(tower);
        });

        gameScene.events.on('pauseToggled', (isPaused) => {
            this.pauseText.setText(isPaused ? 'Resume' : 'Pause');
        });

        gameScene.events.on('gameSpeedChanged', (speed) => {
            this.updateSpeedButtons(speed);
        });

        gameScene.events.on('waveStarted', (waveNumber) => {
            this.onWaveStarted(waveNumber);
        });

        gameScene.events.on('waveCompleted', (waveNumber) => {
            this.onWaveCompleted(waveNumber);
        });
    }

    updateHUD(data) {
        this.goldText.setText(data.gold.toString());
        this.livesText.setText(data.lives.toString());
        this.waveText.setText(`Wave: ${data.wave}/${getTotalWaves()}`);
        this.scoreText.setText(`Score: ${data.score}`);

        // Update tower shop affordability but preserve selected tower highlight
        Object.keys(this.towerButtons).forEach(towerType => {
            const towerData = TOWERS[towerType];
            const canAfford = data.gold >= towerData.cost;
            const { button, text } = this.towerButtons[towerType];
            
            // Only update colors if this tower is not currently selected
            if (towerType !== this.selectedTowerType) {
                text.setColor(canAfford ? '#ffffff' : '#666666');
                button.setFillStyle(canAfford ? 0x666666 : 0x333333);
            } else {
                // Keep selected tower highlighted
                text.setColor('#ffffff');
                button.setFillStyle(canAfford ? 0x00AA00 : 0xAA0000);
            }
        });
    }

    canAffordTower(towerType) {
        const currentGold = parseInt(this.goldText.text);
        return currentGold >= TOWERS[towerType].cost;
    }

    highlightSelectedTower(selectedTowerType) {
        console.log(`🎨 Highlighting selected tower: ${selectedTowerType}`);

        // Store the selected tower type
        this.selectedTowerType = selectedTowerType;

        // Reset all tower buttons to default state
        Object.keys(this.towerButtons).forEach(towerType => {
            const { button, text } = this.towerButtons[towerType];

            if (this.canAffordTower(towerType)) {
                button.setFillStyle(0x666666); // Default gray
                text.setFill('#ffffff'); // Default white text
            } else {
                button.setFillStyle(0x333333); // Darker for unaffordable
                text.setFill('#666666'); // Gray text for unaffordable
            }
        });

        // Highlight the selected tower
        if (selectedTowerType && this.towerButtons[selectedTowerType]) {
            const { button, text } = this.towerButtons[selectedTowerType];

            if (this.canAffordTower(selectedTowerType)) {
                button.setFillStyle(0x00AA00); // Bright green for selected
                text.setFill('#ffffff'); // White text
            } else {
                button.setFillStyle(0xAA0000); // Red for selected but unaffordable
                text.setFill('#ffffff'); // White text
            }
        }
    }

    showTowerMenu(tower) {
        this.selectedTower = tower;

        // Position menu at tower location
        const menuX = tower.x;
        const menuY = tower.y - 80;

        this.towerMenuBg.setPosition(menuX, menuY);
        this.towerMenuBg.setVisible(true);

        // Calculate upgrade cost and sell value
        let upgradeText = 'Max Level';
        let canUpgrade = false;

        if (tower.level < 3) {
            const upgradeCost = getTowerUpgradeCost(tower);
            upgradeText = `Upgrade: ($${upgradeCost})`;
            canUpgrade = true;
        }

        // Calculate sell value using centralized utility
        const sellValue = getTowerSellValue(tower);

        // Update button texts
        this.upgradeText.setText(upgradeText);
        this.sellText.setText(`Sell: ($${sellValue})`);

        // Update button colors based on affordability/can upgrade
        if (canUpgrade) {
            const upgradeCost = getTowerUpgradeCost(tower);
            const currentGold = parseInt(this.goldText.text);
            const canAfford = currentGold >= upgradeCost;
            this.upgradeButton.setFillStyle(canAfford ? 0x4CAF50 : 0x666666);
            this.upgradeText.setColor(canAfford ? '#ffffff' : '#cccccc');
        } else {
            this.upgradeButton.setFillStyle(0x666666);
            this.upgradeText.setColor('#cccccc');
        }

        // Position buttons around the menu
        this.upgradeButton.setPosition(menuX, menuY - 30);
        this.upgradeButton.setVisible(true);
        this.upgradeText.setPosition(menuX, menuY - 30);
        this.upgradeText.setVisible(true);

        this.sellButton.setPosition(menuX, menuY + 30);
        this.sellButton.setVisible(true);
        this.sellText.setPosition(menuX, menuY + 30);
        this.sellText.setVisible(true);

        // Level is now shown directly on the tower, not in menu
    }

    // ✅ REMOVED: Duplicate calculateTowerTotalCost - now using centralized version from utils/towerCalculations.js


    hideTowerMenu() {
        this.selectedTower = null;
        this.towerMenuBg.setVisible(false);
        this.upgradeButton.setVisible(false);
        this.upgradeText.setVisible(false);
        this.sellButton.setVisible(false);
        this.sellText.setVisible(false);
    }

    setGameSpeed(speed) {
        this.scene.get('GameScene').events.emit('setGameSpeed', speed);
    }

    updateSpeedButtons(speed) {
        if (speed === 1) {
            this.speed1xButton.setFillStyle(0x4CAF50);
            this.speed2xButton.setFillStyle(0x757575);
        } else {
            this.speed1xButton.setFillStyle(0x757575);
            this.speed2xButton.setFillStyle(0x4CAF50);
        }
    }

    onTowerPlaced(tower) {
        // Update shop button colors after spending
        const currentGold = parseInt(this.goldText.text);
        Object.keys(this.towerButtons).forEach(towerType => {
            const towerData = TOWERS[towerType];
            const canAfford = currentGold >= towerData.cost;
            this.towerButtons[towerType].text.setColor(canAfford ? '#ffffff' : '#666666');
        });
    }

    onWaveStarted(waveNumber) {
        // Hide skip button when wave starts
        this.skipButton.setVisible(false);
    }

    onWaveCompleted(waveNumber) {
        // Show skip button during inter-wave time
        if (waveNumber < getTotalWaves()) {
            this.skipButton.setVisible(true);
        }
    }

    shutdown() {
        try {
            console.log('🧹 UIScene shutdown - cleaning up event listeners');

            // Clean up keyboard event listeners
            if (this.input && this.input.keyboard) {
                this.input.keyboard.off('keydown-P');
                this.input.keyboard.off('keydown-S');
                this.input.keyboard.off('keydown-ONE');
                this.input.keyboard.off('keydown-TWO');
                this.input.keyboard.off('keydown-THREE');
            }

            // Clean up button event listeners
            if (this.pauseButton) this.pauseButton.off('pointerdown');
            if (this.speed1xButton) this.speed1xButton.off('pointerdown');
            if (this.speed2xButton) this.speed2xButton.off('pointerdown');
            if (this.skipButton) this.skipButton.off('pointerdown');
            if (this.upgradeButton) this.upgradeButton.off('pointerdown');
            if (this.sellButton) this.sellButton.off('pointerdown');

            // Clean up tower shop button listeners
            if (this.towerButtons) {
                this.towerButtons.forEach(button => {
                    if (button) {
                        button.off('pointerover');
                        button.off('pointerout');
                        button.off('pointerdown');
                    }
                });
            }

            console.log('✅ UIScene shutdown complete');

        } catch (error) {
            console.error('❌ Error during UIScene shutdown:', error);
            console.error('Stack trace:', error.stack);
        }
    }
}

export default UIScene;
