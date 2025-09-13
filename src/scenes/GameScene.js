import { TILE_SIZE, GRID_WIDTH, GRID_HEIGHT, WAYPOINTS, gridToWorld, worldToGrid, isOnPath } from '../data/path.js';
import { TOWERS } from '../data/towers.js';
import Economy from '../systems/Economy.js';
import Spawner from '../systems/Spawner.js';
import Tower from '../objects/Tower.js';
import { getTowerTotalCost, getTowerSellValue, canAffordTower } from '../utils/towerCalculations.js';

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

            // Game state
            this.gameSpeed = 1;
            this.isPaused = false;
            this.placingTower = null;
            this.selectedTower = null;
            this.selectedTowerType = null;
            this.draggedTower = null;
            this.isDragging = false;

            // Tower interaction state
            this.pendingTowerMenu = null;
            this.towerClickTime = 0;
            this.dragStartPos = { x: 0, y: 0 };

            // Create the game world
            this.createWorld();

            // Set up input
            this.setupInput();

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

            // Add keyboard control indicator - moved further right and up
            this.keyboardIndicator = this.add.text(720, 450, 'KEYBOARD: ACTIVE', {
                font: '10px Arial',
                fill: '#00ff00',
                backgroundColor: '#000000',
                padding: { x: 4, y: 2 }
            });
            this.keyboardIndicator.setAlpha(0.8);

            // Add debug info panel - moved further right and up
            this.debugInfo = this.add.text(720, 430, 'DEBUG: Press `', {
                font: '9px Arial',
                fill: '#ffff00',
                backgroundColor: '#000000',
                padding: { x: 3, y: 1 }
            });
            this.debugInfo.setAlpha(0.7);

            // Add tower selection indicator - moved further right and up
            this.towerIndicator = this.add.text(720, 490, 'Tower: 1/2/3 keys', {
                font: '11px Arial',
                fill: '#ffffff',
                backgroundColor: '#333333',
                padding: { x: 4, y: 2 }
            });
            this.towerIndicator.setAlpha(0.8);

            // Add drag help indicator - moved further right and up
            this.dragIndicator = this.add.text(720, 510, 'Drag: Click + ENTER', {
                font: '10px Arial',
                fill: '#ffff00',
                backgroundColor: '#000000',
                padding: { x: 3, y: 1 }
            });
            this.dragIndicator.setAlpha(0.7);

            // Add game state indicator - moved further right and up
            this.gameStateIndicator = this.add.text(720, 470, 'Game: Ready', {
                font: '10px Arial',
                fill: '#00ff00',
                backgroundColor: '#000000',
                padding: { x: 4, y: 2 }
            });
            this.gameStateIndicator.setAlpha(0.8);

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
                    // console.log(`🐛 Path tile at (${x}, ${y}) -> world (${worldPos.x}, ${worldPos.y})`);
                } else {
                    grassTileCount++;
                }

                const tile = this.add.image(worldPos.x, worldPos.y, tileType);

                // Set proper depth for path tiles (well below projectiles and effects)
                if (tileType === 'path_tile') {
                    tile.setDepth(1); // Below projectiles (25+) but above grass (0)
                    // console.log(`🚨 PATH TILE CREATED at (${x}, ${y}) - world: (${worldPos.x}, ${worldPos.y})`);
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

    setupInput() {
        // Mouse input for tower placement and dragging
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.handleLeftClick(pointer);
            } else if (pointer.rightButtonDown()) {
                this.handleRightClick(pointer);
            }
        });

        // Handle drag start on mouse down - only for towers
        this.input.on('gameobjectdown', (pointer, gameObject) => {
            if (gameObject instanceof Tower && !this.isDragging) {
                // Store tower and click time for potential menu or drag
                this.pendingTowerMenu = gameObject;
                this.towerClickTime = this.time.now;
                this.dragStartPos = { x: pointer.x, y: pointer.y };
            }
        });

        // Check for drag movement
        this.input.on('pointermove', (pointer) => {
            if (this.pendingTowerMenu && !this.isDragging) {
                const distance = Phaser.Math.Distance.Between(
                    this.dragStartPos.x, this.dragStartPos.y,
                    pointer.x, pointer.y
                );

                if (distance > 10) { // Moved more than 10 pixels = start dragging
                    this.startTowerDrag(this.pendingTowerMenu);
                    this.pendingTowerMenu = null;
                }
            }
        });

        // Handle mouse up to determine if it was a drag or click
        this.input.on('pointerup', (pointer) => {
            // Handle drag end
            if (this.isDragging && this.draggedTower) {
                this.endTowerDrag(pointer);
            }
            // Handle click (show menu)
            else if (this.pendingTowerMenu && !this.isDragging) {
                const clickDuration = this.time.now - this.towerClickTime;
                if (clickDuration < 300) { // Less than 300ms = quick click, show menu
                    this.selectTower(this.pendingTowerMenu);
                }
                this.pendingTowerMenu = null;
            }
        });


        // Grid navigation for keyboard placement
        this.cursorGridX = Math.floor(GRID_WIDTH / 2);
        this.cursorGridY = Math.floor(GRID_HEIGHT / 2);

        // Create individual key objects to avoid conflicts
        const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        const pKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

        const upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        const downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
        const leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        const rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);

        const wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        const aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        const sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        const dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

        const tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);

        // Number keys for tower selection (avoiding conflicts with speed controls)
        const oneKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE);
        const twoKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_TWO);
        const threeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_THREE);

        // Alternative number keys
        const digit1Key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        const digit2Key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        const digit3Key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);

        console.log('🎯 Key objects created:');
        console.log('🎯 twoKey:', twoKey);
        console.log('🎯 digit2Key:', digit2Key);
        console.log('🎯 threeKey:', threeKey);
        console.log('🎯 digit3Key:', digit3Key);

        // Speed control keys (different from tower selection)
        const digit4Key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);
        const digit5Key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE);

        // Debug key (Mac-friendly)
        const backtickKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKTICK);

        // Game control keys
        escKey.on('down', () => {
            // console.log('ESC pressed - canceling placement');
            this.cancelTowerPlacement();
        });

        pKey.on('down', () => {
            // console.log('P pressed - toggling pause');
            this.togglePause();
        });

        digit4Key.on('down', () => {
            // console.log('4 pressed - setting speed to 1x');
            this.setGameSpeed(1);
        });

        digit5Key.on('down', () => {
            // console.log('5 pressed - setting speed to 2x');
            this.setGameSpeed(2);
        });

        // Tower selection keys (both numpad and digit keys)
        const selectTower1 = () => {
            // console.log(`KEYBOARD: Tower 1 pressed - placingTower: ${this.placingTower}`);
            if (!this.placingTower) {
                // console.log('KEYBOARD: Emitting placeTower event for arrow');
                this.events.emit('placeTower', 'arrow');
            } else {
                // console.log('KEYBOARD: Cannot select tower - already placing one');
                this.showKeyboardHelp('Already placing a tower! Press SPACE to place or ESC to cancel');
            }
        };

        const selectTower2 = () => {
            // console.log(`🎯 KEYBOARD: Tower 2 pressed - placingTower: ${this.placingTower}`);
            if (!this.placingTower) {
                // console.log('🎯 KEYBOARD: Emitting placeTower event for cannon');
                this.events.emit('placeTower', 'cannon');
            } else {
                // console.log('🎯 KEYBOARD: Cannot select tower - already placing one');
                this.showKeyboardHelp('Already placing a tower! Press SPACE to place or ESC to cancel');
            }
        };

        const selectTower3 = () => {
            // console.log(`🎯 KEYBOARD: Tower 3 pressed - placingTower: ${this.placingTower}`);
            if (!this.placingTower) {
                // console.log('🎯 KEYBOARD: Emitting placeTower event for frost');
                this.events.emit('placeTower', 'frost');
            } else {
                // console.log('🎯 KEYBOARD: Cannot select tower - already placing one');
                this.showKeyboardHelp('Already placing a tower! Press SPACE to place or ESC to cancel');
            }
        };

        // Connect keyboard handlers to keys
        console.log('🎯 Setting up keyboard handlers...');

        // Test handlers for debugging
        const testKey2 = () => console.log('🎯 TEST: Key 2 handler called!');
        const testKey3 = () => console.log('🎯 TEST: Key 3 handler called!');

        twoKey.on('down', () => { console.log('🎯 Raw TWO key pressed'); testKey2(); selectTower2(); });
        digit2Key.on('down', () => { console.log('🎯 Raw DIGIT_2 key pressed'); testKey2(); selectTower2(); });
        threeKey.on('down', () => { console.log('🎯 Raw THREE key pressed'); testKey3(); selectTower3(); });
        digit3Key.on('down', () => { console.log('🎯 Raw DIGIT_3 key pressed'); testKey3(); selectTower3(); });

        oneKey.on('down', selectTower1);
        digit1Key.on('down', selectTower1);

        console.log('🎯 Keyboard handlers connected!');

        // Grid navigation keys
        upKey.on('down', () => {
            // console.log('UP pressed - moving cursor up');
            this.moveCursor(0, -1);
        });

        downKey.on('down', () => {
            // console.log('DOWN pressed - moving cursor down');
            this.moveCursor(0, 1);
        });

        leftKey.on('down', () => {
            // console.log('LEFT pressed - moving cursor left');
            this.moveCursor(-1, 0);
        });

        rightKey.on('down', () => {
            // console.log('RIGHT pressed - moving cursor right');
            this.moveCursor(1, 0);
        });

        wKey.on('down', () => {
            // console.log('W pressed - moving cursor up');
            this.moveCursor(0, -1);
        });

        sKey.on('down', () => {
            // console.log('S pressed - moving cursor down');
            this.moveCursor(0, 1);
        });

        aKey.on('down', () => {
            // console.log('A pressed - moving cursor left');
            this.moveCursor(-1, 0);
        });

        dKey.on('down', () => {
            // console.log('D pressed - moving cursor right');
            this.moveCursor(1, 0);
        });

        // Placement key
        spaceKey.on('down', () => {
            if (this.isDragging && this.draggedTower) {
                // Drop dragged tower at current cursor position
                // console.log('SPACE pressed - dropping dragged tower');
                const worldPos = gridToWorld(this.cursorGridX, this.cursorGridY);
                const mockPointer = { worldX: worldPos.x, worldY: worldPos.y };
                this.endTowerDrag(mockPointer);
            } else if (this.placingTower) {
                // console.log('SPACE pressed - placing tower');
                this.attemptKeyboardPlacement();
            } else {
                // console.log('SPACE pressed but no tower selected');
            }
        });

        // Also handle ENTER key for compatibility
        const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        enterKey.on('down', () => {
            if (this.placingTower) {
                console.log('ENTER pressed - placing tower');
                this.attemptKeyboardPlacement();
            } else if (this.selectedTower && !this.isDragging) {
                // Pick up selected tower for dragging
                this.startTowerDrag(this.selectedTower);
            }
        });

        // Cycle towers
        tabKey.on('down', () => {
            console.log('TAB pressed - cycling towers');
            this.cycleTowerSelection();
        });

        // Debug key - comprehensive game state
        backtickKey.on('down', () => {
            console.log('=== COMPREHENSIVE DEBUG ===');
            console.log(`Can place tower: ${!this.placingTower}`);
            console.log(`Current towers: ${this.towers.getLength()}`);
            console.log(`Cursor Position: (${this.cursorGridX}, ${this.cursorGridY})`);
            console.log(`Gold: ${this.economy.getGold()}`);
            console.log(`Current Wave: ${this.economy.getCurrentWave()}`);
            console.log(`Is Paused: ${this.isPaused}`);
            console.log(`Scene exists: ${!!this}`);
            console.log(`Tweens available: ${!!this.tweens}`);
            // console.log(`Spawner exists: ${!!this.spawner}`);
            // console.log(`Spawner scene: ${this.spawner?.scene ? 'valid' : 'invalid'}`);

            // Test tween creation
            try {
                if (this.tweens) {
                    const testObj = { x: 0 };
                    const testTween = this.tweens.add({
                        targets: testObj,
                        x: 100,
                        duration: 100,
                        onComplete: () => console.log('✅ Test tween completed successfully')
                    });
                    console.log('✅ Test tween created successfully');
                } else {
                    console.log('❌ Tweens not available');
                }
            } catch (error) {
                console.error('❌ Test tween creation failed:', error);
            }

            // Debug all tower level indicators
            console.log('=== TOWER LEVEL STATUS ===');
            this.towers.getChildren().forEach((tower, index) => {
                tower.debugLevelIndicator();
            });
            console.log('=== END DEBUG ===');

            // Force recreate all level indicators
            this.towers.getChildren().forEach((tower, index) => {
                tower.forceRecreateLevelIndicator();
            });

            console.log('=============================');
            this.showKeyboardHelp(`Debug info logged to console (\`)`);
        });
    }

    setupEventListeners() {
        // Listen for UI events
        this.events.on('placeTower', (towerType) => {
            console.log(`🎯 Tower type selected: ${towerType}`);
            this.selectedTowerType = towerType;
            this.events.emit('towerTypeSelected', towerType);

            // Check if player can afford the tower
            if (!this.canAffordTower(towerType)) {
                this.showKeyboardHelp('Need More Gold');
                return;
            }

            if (!this.placingTower) {
                this.startTowerPlacement(towerType);
            } else {
                this.showKeyboardHelp('Already placing a tower! Press SPACE to place or ESC to cancel');
            }
        });

        this.events.on('upgradeTower', (tower) => {
            console.log(`🎯 GameScene: Received upgradeTower event for ${tower?.towerType} L${tower?.level}`);
            this.upgradeTower(tower);
        });

        this.events.on('sellTower', (tower) => {
            this.sellTower(tower);
        });

        this.events.on('skipWave', () => {
            this.spawner.skipInterWaveTime();
        });

        this.events.on('togglePause', () => {
            this.togglePause();
        });

        this.events.on('setGameSpeed', (speed) => {
            this.setGameSpeed(speed);
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

    handleLeftClick(pointer) {
        const gridPos = worldToGrid(pointer.worldX, pointer.worldY);

        if (this.placingTower) {
            // Try to place tower
            this.attemptTowerPlacement(gridPos.x, gridPos.y);
        } else {
            // Check if clicking on existing tower
            const gridCell = this.grid[gridPos.y]?.[gridPos.x];
            if (gridCell && gridCell.hasTower) {
                this.selectTower(gridCell.tower);
                this.showKeyboardHelp('Tower selected - ENTER to drag, ESC to deselect');
            } else {
                // No tower clicked - check if we have a selected tower type
                this.deselectTower();
                if (this.selectedTowerType) {
                    // We have a selected tower type, check if we can afford it
                    if (this.canAffordTower(this.selectedTowerType)) {
                        this.startTowerPlacement(this.selectedTowerType);
                    } else {
                        this.showKeyboardHelp('Need More Gold');
                    }
                } else {
                    // No tower type selected
                    this.showKeyboardHelp('Pick A Tower');
                }
            }
        }
    }

    handleRightClick(pointer) {
        this.cancelTowerPlacement();
    }

    startTowerPlacement(towerType) {
        console.log(`=== STARTING TOWER PLACEMENT: ${towerType} ===`);
        console.log(`Mouse pointer position: (${this.input.activePointer.x}, ${this.input.activePointer.y})`);
        console.log(`Keyboard cursor position: (${this.cursorGridX}, ${this.cursorGridY})`);

        this.placingTower = towerType;
        this.deselectTower();

        // Create placement ghost
        this.createPlacementGhost();

        console.log(`=== PLACEMENT MODE ACTIVE FOR: ${towerType} ===`);
    }

    createPlacementGhost() {
        // Always start at keyboard cursor position initially
        // The update loop will handle mouse vs keyboard positioning
        const worldPos = gridToWorld(this.cursorGridX, this.cursorGridY);

        console.log(`Creating placement ghost for ${this.placingTower} at grid (${this.cursorGridX}, ${this.cursorGridY})`);

        this.placementGhost = this.add.image(worldPos.x, worldPos.y, `tower_${this.placingTower}`);
        this.placementGhost.setAlpha(0.7);

        this.placementRange = this.add.image(worldPos.x, worldPos.y, 'range_circle');
        this.placementRange.setAlpha(0.3);

        // Update validity color immediately
        const isValid = this.isValidTowerPlacement(this.cursorGridX, this.cursorGridY);
        this.placementGhost.setTint(isValid ? 0x00ff00 : 0xff0000);

        console.log(`Placement ghost created at world pos (${worldPos.x}, ${worldPos.y})`);
    }


    isValidTowerPlacement(gridX, gridY) {
        // Check bounds
        if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) {
            return false;
        }

        // Check if on path
        if (isOnPath(gridX, gridY)) {
            return false;
        }

        // Check if already has tower
        const gridCell = this.grid[gridY][gridX];
        return !gridCell.hasTower;
    }

    attemptTowerPlacement(gridX, gridY) {
        console.log(`Attempting to place ${this.placingTower} at grid position (${gridX}, ${gridY})`);
        
        if (!this.isValidTowerPlacement(gridX, gridY)) {
            console.log('Placement invalid - position not available');
            return;
        }

        // Check if we can afford the tower
        const towerCost = TOWERS[this.placingTower].cost;
        console.log(`Tower cost: ${towerCost}, Current gold: ${this.economy.getGold()}`);
        
        if (!this.economy.spendGold(towerCost)) {
            console.log('Not enough gold to place tower');
            return; // Not enough gold
        }

        try {
            // Create the tower
            const worldPos = gridToWorld(gridX, gridY);
            console.log(`Creating tower at world position (${worldPos.x}, ${worldPos.y})`);
            
            const tower = new Tower(this, worldPos.x, worldPos.y, this.placingTower);
            console.log('Tower created successfully');

            // Set tower properties
            tower.gridX = gridX;
            tower.gridY = gridY;

            // Add to grid
            this.grid[gridY][gridX].hasTower = true;
            this.grid[gridY][gridX].tower = tower;

            // Add to towers group
            this.towers.add(tower);
            console.log('Tower added to game');

            // Clean up placement
            this.cancelTowerPlacement();

            // Emit tower placed event for UI
        this.events.emit('towerPlaced', tower);
        // Keep tower type selection - don't clear it so user can place more of the same type
        console.log('Tower placement completed successfully');
            if (this.selectedTowerType) {
                this.updateGameStateIndicator(`Selected: ${this.selectedTowerType} - Click to place`);
            } else {
                this.updateGameStateIndicator('Pick A Tower');
            }
            
        } catch (error) {
            console.error('Error placing tower:', error);
            console.error('Stack trace:', error.stack);
            
            // Refund the gold if tower creation failed
            this.economy.addGold(towerCost);
        }
    }

    cancelTowerPlacement() {
        if (this.placementGhost) {
            this.placementGhost.destroy();
            this.placementGhost = null;
        }
        if (this.placementRange) {
            this.placementRange.destroy();
            this.placementRange = null;
        }
        this.placingTower = null;
        // Keep tower type selection on cancel so user can try again
        if (this.selectedTowerType) {
            this.updateTowerIndicator(`Selected: ${this.selectedTowerType} - Click to place`);
        } else {
            this.updateTowerIndicator('Pick A Tower');
        }
        console.log('Tower placement cancelled');
    }

    selectTower(tower) {
        this.selectedTower = tower;
        this.events.emit('towerSelected', tower);
    }

    deselectTower() {
        if (this.selectedTower) {
            this.selectedTower = null;
            this.events.emit('towerDeselected');
        }
    }

    canAffordTower(towerType) {
        return canAffordTower(this.economy, towerType);
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
            this.showKeyboardHelp('Tower already at maximum level!');
            return;
        }

        // Get upgrade cost
        const upgradeCost = tower.towerData.levels[tower.level].upgradeCost;
        console.log(`💰 Upgrade cost: ${upgradeCost}, Current gold: ${this.economy.getGold()}`);

        // Check if player has enough gold
        if (this.economy.getGold() < upgradeCost) {
            this.showKeyboardHelp(`Need $${upgradeCost} to upgrade!`);
            return;
        }

        // Spend gold
        this.economy.addGold(-upgradeCost);

        // Debug: Before upgrade call
        console.log(`🔄 BEFORE upgrade() call:`);
        console.log(`🔄 tower.level = ${tower.level}`);
        console.log(`🔄 tower.upgrade function exists: ${typeof tower.upgrade === 'function'}`);

        // Upgrade tower
        console.log(`🎯 GameScene.upgradeTower: Calling tower.upgrade() for ${tower.towerType} L${tower.level}`);
        console.log(`🎯 Tower.upgrade method exists: ${typeof tower.upgrade === 'function'}`);
        console.log(`🎯 Tower.upgrade method:`, tower.upgrade);
        try {
            console.log(`🎯 About to call tower.upgrade()...`);
            tower.upgrade();
            console.log(`🎯 tower.upgrade() returned, about to log completion...`);
            console.log(`🎯 GameScene.upgradeTower: tower.upgrade() completed successfully`);

            // Debug: After upgrade call
            console.log(`🔄 AFTER upgrade() call:`);
            console.log(`🔄 tower.level = ${tower.level}`);
            console.log(`🔄 Expected level should be: ${parseInt(tower.level) + 1}`);

        } catch (error) {
            console.error(`❌ ERROR in tower.upgrade():`, error);
            console.error(`❌ Stack:`, error.stack);
        }

        this.showKeyboardHelp(`Tower upgraded to level ${tower.level}!`);
        this.events.emit('economyUpdate', {
            gold: this.economy.getGold(),
            lives: this.economy.getLives(),
            wave: this.economy.getCurrentWave(),
            score: this.economy.getScore()
        });
    }

    sellTower(tower) {
        console.log('💰 Selling tower:', tower.towerType, 'level:', tower.level);

        // Calculate sell value using centralized utility
        const totalCost = getTowerTotalCost(tower);
        const sellValue = getTowerSellValue(tower);

        console.log('📊 Total invested:', totalCost, 'Sell value:', sellValue);

        // Add gold to player
        this.economy.addGold(sellValue);

        // Remove tower from grid
        this.grid[tower.gridY][tower.gridX].hasTower = false;
        this.grid[tower.gridY][tower.gridX].tower = null;

        // Remove tower from physics group
        this.towers.remove(tower);

        // Destroy tower
        tower.destroy();

        // Deselect tower
        this.deselectTower();

        console.log('✅ Tower sold for', sellValue, 'gold');
        this.showKeyboardHelp(`Tower sold for $${sellValue}!`);

        // Update UI
        this.events.emit('economyUpdate', {
            gold: this.economy.getGold(),
            lives: this.economy.getLives(),
            wave: this.economy.getCurrentWave(),
            score: this.economy.getScore()
        });
    }

    // ✅ REMOVED: Duplicate getTowerTotalCost - now using centralized version from utils/towerCalculations.js

    togglePause() {
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.spawner.pause();
            this.physics.pause();
            this.updateGameStateIndicator('PAUSED - Press P to resume');
        } else {
            this.spawner.resume();
            this.physics.resume();
            this.updateGameStateIndicator('Playing');
        }

        this.events.emit('pauseToggled', this.isPaused);
    }

    setGameSpeed(speed) {
        this.gameSpeed = speed;
        this.spawner.setGameSpeed(speed);

        // Update all tweens and timers
        this.tweens.timeScale = speed;
        this.time.timeScale = speed;

        this.events.emit('gameSpeedChanged', speed);
    }

    onProjectileHit(projectile, enemy) {
        // Handle projectile hitting enemy
        // TODO: Implement damage application
        projectile.destroy();
    }

    moveCursor(deltaX, deltaY) {
        if (!this.placingTower) return;

        this.cursorGridX = Math.max(0, Math.min(GRID_WIDTH - 1, this.cursorGridX + deltaX));
        this.cursorGridY = Math.max(0, Math.min(GRID_HEIGHT - 1, this.cursorGridY + deltaY));

        // Update placement ghost position
        const worldPos = gridToWorld(this.cursorGridX, this.cursorGridY);
        if (this.placementGhost) {
            this.placementGhost.setPosition(worldPos.x, worldPos.y);
            this.placementRange.setPosition(worldPos.x, worldPos.y);

            // Update validity color
            const isValid = this.isValidTowerPlacement(this.cursorGridX, this.cursorGridY);
            this.placementGhost.setTint(isValid ? 0x00ff00 : 0xff0000);
        }

        // Show cursor position
        this.showKeyboardHelp(`Position: ${this.cursorGridX}, ${this.cursorGridY}`);
    }

    attemptKeyboardPlacement() {
        if (!this.placingTower) return;

        this.attemptTowerPlacement(this.cursorGridX, this.cursorGridY);
    }

    cycleTowerSelection() {
        if (this.placingTower) return;

        const towers = ['arrow', 'cannon', 'frost'];
        const currentIndex = towers.indexOf(this.lastSelectedTower || 'arrow');
        const nextIndex = (currentIndex + 1) % towers.length;
        const nextTower = towers[nextIndex];

        this.events.emit('placeTower', nextTower);
        this.lastSelectedTower = nextTower;
        console.log(`Tower cycled to: ${nextTower}`);
    }

    updateTowerIndicator(message) {
        this.towerIndicator.setText(message);
    }

    updateGameStateIndicator(message) {
        this.gameStateIndicator.setText(`Game Status: ${message}`);
    }

    showKeyboardHelp(message) {
        // Remove existing help text
        if (this.helpText) {
            this.helpText.destroy();
        }

        // Create new help text at bottom center - moved up to stay on screen
        this.helpText = this.add.text(400, 520, message, {
            font: '16px Arial',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });
        this.helpText.setOrigin(0.5, 0.5); // Center the text

        // Auto-hide after 2 seconds
        this.time.delayedCall(2000, () => {
            if (this.helpText) {
                this.helpText.destroy();
                this.helpText = null;
            }
        });
    }

    startTowerDrag(tower) {
        if (this.isDragging) return;

        console.log('Starting tower drag:', tower.towerType);
        this.draggedTower = tower;
        this.isDragging = true;

        // Store original position
        this.originalGridX = tower.gridX;
        this.originalGridY = tower.gridY;

        // Create drag ghost
        this.createDragGhost(tower);

        // Make tower semi-transparent
        tower.setAlpha(0.5);

        this.showKeyboardHelp('Dragging tower - release to drop');
    }

    createDragGhost(tower) {
        const worldPos = gridToWorld(this.cursorGridX, this.cursorGridY);
        this.dragGhost = this.add.image(worldPos.x, worldPos.y, `tower_${tower.towerType}`);
        this.dragGhost.setAlpha(0.8);
        this.dragGhost.setTint(0x00ff00); // Start as valid (green)
    }

    endTowerDrag(pointer) {
        if (!this.draggedTower) return;

        console.log('Ending tower drag');

        // Calculate drop position
        const gridPos = worldToGrid(pointer.worldX, pointer.worldY);
        const dropValid = this.isValidDropPosition(gridPos.x, gridPos.y);

        if (dropValid) {
            // Move tower to new position
            this.moveTowerToPosition(this.draggedTower, gridPos.x, gridPos.y);
            this.showKeyboardHelp('Tower moved successfully!');
        } else {
            // Return to original position
            this.showKeyboardHelp('Invalid position - tower returned');
        }

        // Clean up drag state
        this.cleanupDrag();
    }

    isValidDropPosition(gridX, gridY) {
        // Check bounds
        if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) {
            return false;
        }

        // Check if on path
        if (isOnPath(gridX, gridY)) {
            return false;
        }

        // Check if position is occupied by another tower
        const targetCell = this.grid[gridY][gridX];
        if (targetCell.hasTower && targetCell.tower !== this.draggedTower) {
            return false;
        }

        return true;
    }

    moveTowerToPosition(tower, newGridX, newGridY) {
        // Update grid references
        this.grid[tower.gridY][tower.gridX].hasTower = false;
        this.grid[tower.gridY][tower.gridX].tower = null;

        this.grid[newGridY][newGridX].hasTower = true;
        this.grid[newGridY][newGridX].tower = tower;

        // Update tower position
        const worldPos = gridToWorld(newGridX, newGridY);
        tower.setPosition(worldPos.x, worldPos.y);
        tower.gridX = newGridX;
        tower.gridY = newGridY;
    }

    cleanupDrag() {
        if (this.draggedTower) {
            this.draggedTower.setAlpha(1.0);
        }

        if (this.dragGhost) {
            this.dragGhost.destroy();
            this.dragGhost = null;
        }

        this.draggedTower = null;
        this.isDragging = false;
    }

    update(time, delta) {
        try {
            // Update placement ghost position
            if (this.placingTower && this.placementGhost) {
                // Always update ghost position - prioritize mouse if active, otherwise keyboard
                let worldPos;
                let gridPos;

                if (this.input.activePointer.x !== 0 || this.input.activePointer.y !== 0) {
                    // Mouse is active - use mouse position
                    gridPos = worldToGrid(this.input.activePointer.worldX, this.input.activePointer.worldY);
                    worldPos = gridToWorld(gridPos.x, gridPos.y);
                } else {
                    // Keyboard mode - use cursor position
                    gridPos = { x: this.cursorGridX, y: this.cursorGridY };
                    worldPos = gridToWorld(this.cursorGridX, this.cursorGridY);
                }

                // Update ghost position
                this.placementGhost.setPosition(worldPos.x, worldPos.y);

                // Update range circle with actual tower range
                if (this.placementRange) {
                    this.placementRange.setPosition(worldPos.x, worldPos.y);
                    // Get the actual range from the selected tower
                    const towerData = TOWERS[this.placingTower];
                    if (towerData && towerData.levels && towerData.levels[0]) {
                        const range = towerData.levels[0].range * TILE_SIZE;
                        this.placementRange.setScale(range / 100);
                    }
                }

                // Update color based on validity
                const isValid = this.isValidTowerPlacement(gridPos.x, gridPos.y);
                this.placementGhost.setTint(isValid ? 0x00ff00 : 0xff0000);
            }

            // Update drag ghost position
            if (this.isDragging && this.dragGhost) {
                const pointer = this.input.activePointer;
                const gridPos = worldToGrid(pointer.worldX, pointer.worldY);

                // Snap to grid
                const worldPos = gridToWorld(gridPos.x, gridPos.y);
                this.dragGhost.setPosition(worldPos.x, worldPos.y);

                // Update validity color
                const isValid = this.isValidDropPosition(gridPos.x, gridPos.y);
                this.dragGhost.setTint(isValid ? 0x00ff00 : 0xff0000);
            }

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
            // Clean up keyboard keys first
            if (this.input && this.input.keyboard) {
                const keys = [
                    'escKey', 'pKey', 'digit4Key', 'digit5Key', 'oneKey', 'digit1Key',
                    'twoKey', 'digit2Key', 'threeKey', 'digit3Key', 'upKey', 'downKey',
                    'leftKey', 'rightKey', 'wKey', 'sKey', 'aKey', 'dKey', 'spaceKey',
                    'enterKey', 'tabKey', 'backtickKey'
                ];

                keys.forEach(keyName => {
                    if (this[keyName]) {
                        try {
                            this[keyName].destroy();
                            this[keyName] = null;
                        } catch (e) {
                            console.log(`⚠️ Could not destroy ${keyName}`);
                        }
                    }
                });
            }

            // Clean up display objects
            const displayObjects = [
                'keyboardIndicator', 'towerIndicator', 'dragIndicator', 'gameStateIndicator',
                'debugInfo', 'placementGhost', 'placementRange', 'dragGhost', 'helpText'
            ];

            displayObjects.forEach(objName => {
                if (this[objName]) {
                    try {
                        this[objName].destroy();
                        this[objName] = null;
                    } catch (e) {
                        console.log(`⚠️ Could not destroy ${objName}`);
                    }
                }
            });

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

            // Clean up input events
            if (this.input) {
                this.input.off('pointerdown');
                this.input.off('pointermove');
                this.input.off('pointerup');
                this.input.off('gameobjectdown');
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
