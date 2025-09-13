import { TILE_SIZE, GRID_WIDTH, GRID_HEIGHT, WAYPOINTS, gridToWorld, worldToGrid, isOnPath } from '../data/path.js';
import { TOWERS } from '../data/towers.js';
import Economy from '../systems/Economy.js';
import Spawner from '../systems/Spawner.js';
import Tower from '../objects/Tower.js';
import { getTowerTotalCost, getTowerSellValue, canAffordTower } from '../utils/towerCalculations.js';

// Import managers
import InputManager from '../managers/InputManager.js';
import TowerPlacementManager from '../managers/TowerPlacementManager.js';
import GameStateManager from '../managers/GameStateManager.js';
import TowerInteractionManager from '../managers/TowerInteractionManager.js';
import VisualEffectsManager from '../managers/VisualEffectsManager.js';

// Import visual effects
import ScreenShakeManager from '../effects/ScreenShakeManager.js';
import ParticleManager from '../effects/ParticleManager.js';
import VisualJuiceManager from '../effects/VisualJuiceManager.js';
import ProjectileTrailManager from '../effects/ProjectileTrailManager.js';

// Import audio
import AudioManager from '../audio/AudioManager.js';

// Import debug configuration
import { DEBUG } from '../data/waves.js';
import { getVersionText } from '../config/version.js';

class GameScene extends Phaser.Scene {
    constructor() {
        console.log('🎮 [GS-CONSTRUCT-1] GameScene: Constructor starting...');
        try {
            super({ key: 'GameScene' });
            console.log('🎮 [GS-CONSTRUCT-2] GameScene: Constructor called successfully');
        } catch (error) {
            console.error('❌ [GS-CONSTRUCT-X] GameScene: Constructor failed:', error);
            throw error; // Re-throw to prevent scene creation
        }
    }

    create() {
        console.log('🎮 [GS-CREATE-1] GameScene: Create method called - initializing game');

        // Reset flag for new game
        this.gameOverSceneLaunched = false;

        // Check if Phaser objects are available
        if (!this.scene || !this.physics || !this.add) {
            console.error('❌ GameScene: Phaser objects not available:', {
                scene: !!this.scene,
                physics: !!this.physics,
                add: !!this.add
            });
            return;
        }

        try {
            // Initialize systems
            this.economy = new Economy(this);
            this.spawner = new Spawner(this, this.economy);
            console.log('🎮 GameScene: Systems initialized successfully');

            // Initialize visual effects first
            this.screenShakeManager = new ScreenShakeManager(this);
            this.particleManager = new ParticleManager(this);
            this.visualJuiceManager = new VisualJuiceManager(this);
            this.projectileTrailManager = new ProjectileTrailManager(this);

            // Initialize audio
            this.audioManager = new AudioManager(this);

            // Initialize managers with visual effects access
            this.inputManager = new InputManager(this);
            this.towerPlacementManager = new TowerPlacementManager(this);
            this.gameStateManager = new GameStateManager(this);
            this.towerInteractionManager = new TowerInteractionManager(this);
            this.visualEffectsManager = new VisualEffectsManager(this);

            // Sync Spawner's game speed with GameStateManager
            this.spawner.setGameSpeed(this.gameStateManager.getGameSpeed());

            // Initialize audio system
            this.audioManager.initialize();
            
            // Pass audio manager to Spawner
            this.spawner.setAudioManager(this.audioManager);

            // Pass visual effects and audio to managers that need them
            console.log('🎨 GameScene: Passing visual effects and audio to managers...');
            console.log('🎨 VisualJuiceManager:', !!this.visualJuiceManager);
            console.log('🎨 ParticleManager:', !!this.particleManager);
            console.log('🎨 ScreenShakeManager:', !!this.screenShakeManager);
            console.log('🔊 AudioManager:', !!this.audioManager);

            // Test visual effects managers immediately
            console.log('🧪 Testing visual effects managers...');
            if (this.screenShakeManager) {
                console.log('🧪 Testing screen shake...');
                this.screenShakeManager.lightShake();
            }
            if (this.particleManager) {
                console.log('🧪 Testing particle creation...');
                this.particleManager.createExplosion(400, 300, 0xff0000, 3);
            }

            this.towerPlacementManager.setVisualEffects(this.visualJuiceManager, this.particleManager, this.screenShakeManager, this.audioManager);
            this.towerInteractionManager.setVisualEffects(this.visualJuiceManager, this.particleManager, this.screenShakeManager, this.audioManager);
            
            console.log('🎨 GameScene: Visual effects passed to managers successfully');

            // Create the game world
            this.createWorld();

            // Set up event listeners
            this.setupEventListeners();

            // Start the first wave after a brief delay
            this.time.delayedCall(1000, () => {
                console.log('GameScene: Starting first wave');

                // Check if scene is still active before starting wave
                if (!this.scene || this.scene.isActive('GameScene') === false) {
                    console.log('🎮 GameScene: Scene no longer active, skipping wave start');
                    return;
                }

                try {
                    this.spawner.startWave(1);
                    console.log('🎮 GameScene: First wave started successfully');
                } catch (error) {
                    console.error('❌ GameScene: Error starting first wave:', error);
                }
            });

            // Create tower group
            this.towers = this.physics.add.group();
            this.projectiles = this.physics.add.group();
            console.log('🎮 GameScene: Physics groups created successfully');

            // Create visual indicators
            this.visualEffectsManager.createVisualIndicators();

            // Add version display
            this.addVersionDisplay();

            // Add debug panel if enabled
            if (DEBUG.enabled && DEBUG.showDebugPanel) {
                this.createDebugPanel();
            }

            // Set up collisions
            this.physics.add.overlap(this.projectiles, this.spawner.getEnemies(), this.onProjectileHit, null, this);
            console.log('🎮 GameScene: Physics collisions set up successfully');

            console.log('🎮 [GS-CREATE-5] GameScene: Create method completed successfully!');
        } catch (error) {
            console.error('❌ [GS-CREATE-X] GameScene: Fatal error during create method:', error);
            console.error('❌ [GS-CREATE-X] Stack trace:', error.stack);
            // Don't return here - let Phaser handle the error
        }
    }

    createWorld() {
        // Create the grid-based world
        this.grid = [];
        let pathTileCount = 0;
        let grassTileCount = 0;

        for (let y = 0; y < GRID_HEIGHT; y++) {
            this.grid[y] = [];
            for (let x = 0; x < GRID_WIDTH; x++) {
                const worldPos = gridToWorld(x, y);
                let tileType = 'grass_tile';

                if (isOnPath(x, y)) {
                    tileType = 'path_tile';
                    pathTileCount++;
                } else {
                    grassTileCount++;
                }

                const tile = this.add.image(worldPos.x, worldPos.y, tileType);

                // Set proper depth for path tiles (well below projectiles and effects)
                if (tileType === 'path_tile') {
                    tile.setDepth(1); // Below projectiles (25+) but above grass (0)
                } else {
                    tile.setDepth(0); // Grass tiles at bottom
                }

                this.grid[y][x] = {
                    x: x,
                    y: y,
                    tile: tile,
                    hasTower: false,
                    tower: null
                };
            }
        }

        console.log(`🌍 World created: ${pathTileCount} path tiles, ${grassTileCount} grass tiles`);
        console.log(`📐 Grid size: ${GRID_WIDTH}x${GRID_HEIGHT} = ${GRID_WIDTH * GRID_HEIGHT} total tiles`);

        // Verify path tiles are working correctly
        console.log('✅ Path creation complete - enemies should now walk on white road!');
    }

    addVersionDisplay() {
        console.log('📱 Starting to add version display...');
        
        // Add version display in bottom-right corner (away from all UI elements)
        const versionText = this.add.text(950, 520, getVersionText(), {
            font: '12px Arial',
            fill: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 },
            stroke: '#ffffff',
            strokeThickness: 1
        });
        versionText.setOrigin(1, 0); // Right-aligned
        versionText.setDepth(1000); // Above everything
        
        console.log('📱 Version display added:', versionText);
        console.log('📱 Version display added:', getVersionText());
    }

    createDebugPanel() {
        console.log('🐛 Creating debug panel...');
        
        // Debug panel background
        const debugBg = this.add.rectangle(10, 10, 200, 120, 0x000000, 0.7);
        debugBg.setOrigin(0, 0);
        debugBg.setDepth(1000);
        
        // Debug title
        const debugTitle = this.add.text(15, 15, 'DEBUG PANEL', {
            font: '12px Arial',
            fill: '#00ff00'
        });
        debugTitle.setDepth(1001);
        
        // Wave count control
        const waveLabel = this.add.text(15, 35, 'Max Waves:', {
            font: '10px Arial',
            fill: '#ffffff'
        });
        waveLabel.setDepth(1001);
        
        const waveText = this.add.text(15, 50, `Waves: ${DEBUG.maxWaves}`, {
            font: '10px Arial',
            fill: '#ffff00'
        });
        waveText.setDepth(1001);
        
        // Wave count buttons
        const waveMinus = this.add.text(15, 65, '[ - ]', {
            font: '10px Arial',
            fill: '#ff0000'
        });
        waveMinus.setDepth(1001);
        waveMinus.setInteractive();
        waveMinus.on('pointerdown', () => {
            DEBUG.maxWaves = Math.max(1, DEBUG.maxWaves - 1);
            waveText.setText(`Waves: ${DEBUG.maxWaves}`);
        });
        
        const wavePlus = this.add.text(60, 65, '[ + ]', {
            font: '10px Arial',
            fill: '#00ff00'
        });
        wavePlus.setDepth(1001);
        wavePlus.setInteractive();
        wavePlus.on('pointerdown', () => {
            DEBUG.maxWaves = Math.min(10, DEBUG.maxWaves + 1);
            waveText.setText(`Waves: ${DEBUG.maxWaves}`);
        });
        
        // Instant waves toggle
        const instantLabel = this.add.text(15, 85, 'Instant Waves:', {
            font: '10px Arial',
            fill: '#ffffff'
        });
        instantLabel.setDepth(1001);
        
        const instantToggle = this.add.text(15, 100, DEBUG.instantWaves ? '[ON]' : '[OFF]', {
            font: '10px Arial',
            fill: DEBUG.instantWaves ? '#00ff00' : '#ff0000'
        });
        instantToggle.setDepth(1001);
        instantToggle.setInteractive();
        instantToggle.on('pointerdown', () => {
            DEBUG.instantWaves = !DEBUG.instantWaves;
            instantToggle.setText(DEBUG.instantWaves ? '[ON]' : '[OFF]');
            instantToggle.setFillStyle(DEBUG.instantWaves ? '#00ff00' : '#ff0000');
        });
        
        console.log('🐛 Debug panel created');
    }

    setupEventListeners() {
        // Resume audio context on first user interaction
        this.input.on('pointerdown', () => {
            if (this.audioManager) {
                this.audioManager.resumeAudioContext();
            }
        });

        // Listen for UI events
        this.events.on('placeTower', (towerType) => {
            console.log(`🎯 Tower type selected: ${towerType}`);
            this.towerPlacementManager.selectedTowerType = towerType;
            this.events.emit('towerTypeSelected', towerType);

            // Check if player can afford the tower
            if (!this.canAffordTower(towerType)) {
                this.visualEffectsManager.showKeyboardHelp('Need More Gold');
                return;
            }

            if (!this.towerPlacementManager.placingTower) {
                this.towerPlacementManager.startTowerPlacement(towerType);
            } else {
                this.visualEffectsManager.showKeyboardHelp('Already placing a tower! Press SPACE to place or ESC to cancel');
            }
        });

        this.events.on('upgradeTower', (tower) => {
            console.log(`🎯 GameScene: Received upgradeTower event for ${tower?.towerType} L${tower?.level}`);
            this.towerInteractionManager.upgradeTower(tower);
        });

        this.events.on('sellTower', (tower) => {
            this.towerInteractionManager.sellTower(tower);
        });

        this.events.on('skipWave', () => {
            this.spawner.skipInterWaveTime();
        });

        this.events.on('togglePause', () => {
            this.gameStateManager.togglePause();
        });

        this.events.on('setGameSpeed', (speed) => {
            this.gameStateManager.setGameSpeed(speed);
        });

        // Listen for game events
        this.events.on('gameOver', (data) => {
            console.log('💀 GameScene: gameOver event received!');
            console.log('💀 GameScene: Using overlay approach to avoid destroy errors');

            // Simple approach: pause current scenes and launch GameOverScene as overlay
            this.scene.pause();
            this.scene.pause('UIScene');

            // Launch GameOverScene as overlay - no stopping to avoid destroy errors
            this.scene.launch('GameOverScene', data);

            console.log('💀 GameScene: GameOverScene launched as overlay for defeat');
        });

        this.events.on('gameWon', () => {
            console.log('🎉 GameScene: gameWon event received!');
            console.log('🎉 GameScene: Using overlay approach to avoid destroy errors');

            // Check if we already launched GameOverScene to prevent duplicates
            if (this.gameOverSceneLaunched) {
                console.log('🎉 GameScene: GameOverScene already launched - ignoring duplicate gameWon event');
                return;
            }

            // Set flag to prevent duplicates
            this.gameOverSceneLaunched = true;

            // Simple approach: pause current scenes and launch GameOverScene as overlay
            this.scene.pause();
            this.scene.pause('UIScene');

            // Launch GameOverScene as overlay - no stopping to avoid destroy errors
            this.scene.launch('GameOverScene', {
                won: true,
                score: this.economy ? this.economy.getScore() : 0,
                wave: this.spawner ? this.spawner.currentWave : 0,
                kills: this.economy ? this.economy.getKills() : 0,
                gold: this.economy ? this.economy.getGold() : 0,
                lives: this.economy ? this.economy.getLives() : 0
            });

            console.log('🎉 GameScene: GameOverScene launched as overlay for victory');
        });
    }

    canAffordTower(towerType) {
        return canAffordTower(this.economy, towerType);
    }

    onProjectileHit(projectile, enemy) {
        // Handle projectile hitting enemy
        // TODO: Implement damage application
        projectile.destroy();
    }

    // Delegate methods to managers
    cancelTowerPlacement() {
        this.towerPlacementManager.cancelTowerPlacement();
    }

    selectTower(tower) {
        this.towerInteractionManager.selectTower(tower);
    }

    deselectTower() {
        this.towerInteractionManager.deselectTower();
    }

    upgradeTower(tower) {
        this.towerInteractionManager.upgradeTower(tower);
    }

    sellTower(tower) {
        this.towerInteractionManager.sellTower(tower);
    }

    togglePause() {
        this.gameStateManager.togglePause();
    }

    setGameSpeed(speed) {
        this.gameStateManager.setGameSpeed(speed);
    }

    startTowerPlacement(towerType) {
        this.towerPlacementManager.startTowerPlacement(towerType);
    }

    attemptTowerPlacement(gridX, gridY) {
        this.towerPlacementManager.attemptTowerPlacement(gridX, gridY);
    }

    attemptKeyboardPlacement() {
        this.towerPlacementManager.attemptKeyboardPlacement();
    }

    cycleTowerSelection() {
        this.towerPlacementManager.cycleTowerSelection();
    }

    startTowerDrag(tower) {
        this.towerPlacementManager.startTowerDrag(tower);
    }

    endTowerDrag(pointer) {
        this.towerPlacementManager.endTowerDrag(pointer);
    }

    isValidTowerPlacement(gridX, gridY) {
        return this.towerPlacementManager.isValidTowerPlacement(gridX, gridY);
    }

    showKeyboardHelp(message) {
        this.visualEffectsManager.showKeyboardHelp(message);
    }

    updateTowerIndicator(message) {
        this.visualEffectsManager.updateTowerIndicator(message);
    }

    updateGameStateIndicator(message) {
        this.visualEffectsManager.updateGameStateIndicator(message);
    }

    // Getters for manager properties
    get placingTower() {
        return this.towerPlacementManager.placingTower;
    }

    get selectedTower() {
        return this.towerInteractionManager.getSelectedTower();
    }

    get selectedTowerType() {
        return this.towerPlacementManager.selectedTowerType;
    }

    get draggedTower() {
        return this.towerPlacementManager.draggedTower;
    }

    get isDragging() {
        return this.towerPlacementManager.isDragging;
    }

    get isPaused() {
        return this.gameStateManager.isGamePaused();
    }

    get gameSpeed() {
        return this.gameStateManager.getGameSpeed();
    }

    update(time, delta) {
        try {
            // Update managers
            this.towerPlacementManager.update(time, delta);

            // Update visual effects
            this.screenShakeManager.update(time, delta);
            this.particleManager.update(time, delta);
            this.projectileTrailManager.update(time, delta);

            // Update systems
            if (!this.isPaused) {
                // Update spawner
                // Update towers (targeting, firing)
            }
        } catch (error) {
            console.error('Error in GameScene update:', error);
            console.error('Stack trace:', error.stack);
        }
    }

    prepareForShutdown() {
        console.log('🧹 GameScene: Preparing for shutdown - cleaning up objects...');
        console.log('🧹 GameScene: Current scene state - towers:', this.towers ? this.towers.getLength() : 'null');
        console.log('🧹 GameScene: Current scene state - enemies:', this.enemies ? this.enemies.getLength() : 'null');
        console.log('🧹 GameScene: Current scene state - projectiles:', this.projectiles ? this.projectiles.getLength() : 'null');

        try {
            // Clean up managers
            if (this.inputManager) {
                this.inputManager.cleanup();
            }
            if (this.towerPlacementManager) {
                this.towerPlacementManager.cleanup();
            }
            if (this.visualEffectsManager) {
                this.visualEffectsManager.cleanup();
            }

            // Clean up groups
            if (this.towers) {
                this.towers.clear(true, true);
            }
            if (this.enemies) {
                this.enemies.clear(true, true);
            }
            if (this.projectiles) {
                this.projectiles.clear(true, true);
            }

            // Clean up timers
            if (this.time) {
                this.time.removeAllEvents();
            }

            // Clean up tweens
            if (this.tweens) {
                this.tweens.killAll();
            }

            console.log('✅ GameScene prepared for shutdown - all objects cleaned up');

        } catch (error) {
            console.error('❌ Error during prepareForShutdown:', error.message);
        }
    }

    shutdown() {
        console.log('🧹 [GS1/3] GameScene shutdown starting...');

        // Log scene state before shutdown
        try {
            const activeScenes = this.scene.manager.getScenes(true).map(s => s.scene.key);
            const allScenes = this.scene.manager.getScenes(false).map(s => s.scene.key);
            console.log('🧹 [GS2/3] Active scenes during shutdown:', activeScenes);
            console.log('🧹 [GS2/3] All scenes during shutdown:', allScenes);
        } catch (error) {
            console.warn('🧹 [GS2x/3] Error checking scene state:', error.message);
        }

        // Skip all cleanup to prevent destroy errors during scene transitions
        console.log('🧹 [GS3/3] GameScene shutdown complete (no cleanup)');
    }
}

export default GameScene;