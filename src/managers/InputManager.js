import { GRID_WIDTH, GRID_HEIGHT, gridToWorld, worldToGrid } from '../data/path.js';
import Tower from '../objects/Tower.js';

/**
 * InputManager - Handles all keyboard and mouse input for the game
 * Extracted from GameScene.js to improve maintainability
 */
class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.gameScene = scene; // Reference to the main game scene
        
        // Grid navigation state
        this.cursorGridX = Math.floor(GRID_WIDTH / 2);
        this.cursorGridY = Math.floor(GRID_HEIGHT / 2);
        
        // Input state
        this.pendingTowerMenu = null;
        this.towerClickTime = 0;
        this.dragStartPos = { x: 0, y: 0 };
        
        this.setupInput();
    }

    setupInput() {
        // Mouse input for tower placement and dragging
        this.scene.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.handleLeftClick(pointer);
            } else if (pointer.rightButtonDown()) {
                this.handleRightClick(pointer);
            }
        });

        // Handle drag start on mouse down - only for towers
        this.scene.input.on('gameobjectdown', (pointer, gameObject) => {
            if (gameObject instanceof Tower && !this.gameScene.isDragging) {
                // Store tower and click time for potential menu or drag
                this.pendingTowerMenu = gameObject;
                this.towerClickTime = this.scene.time.now;
                this.dragStartPos = { x: pointer.x, y: pointer.y };
            }
        });

        // Check for drag movement
        this.scene.input.on('pointermove', (pointer) => {
            if (this.pendingTowerMenu && !this.gameScene.isDragging) {
                const distance = Phaser.Math.Distance.Between(
                    this.dragStartPos.x, this.dragStartPos.y,
                    pointer.x, pointer.y
                );

                if (distance > 10) { // Moved more than 10 pixels = start dragging
                    this.gameScene.startTowerDrag(this.pendingTowerMenu);
                    this.pendingTowerMenu = null;
                }
            }
        });

        // Handle mouse up to determine if it was a drag or click
        this.scene.input.on('pointerup', (pointer) => {
            // Handle drag end
            if (this.gameScene.isDragging && this.gameScene.draggedTower) {
                this.gameScene.endTowerDrag(pointer);
            }
            // Handle click (show menu)
            else if (this.pendingTowerMenu && !this.gameScene.isDragging) {
                const clickDuration = this.scene.time.now - this.towerClickTime;
                if (clickDuration < 300) { // Less than 300ms = quick click, show menu
                    this.gameScene.selectTower(this.pendingTowerMenu);
                }
                this.pendingTowerMenu = null;
            }
        });

        this.setupKeyboardInput();
    }

    setupKeyboardInput() {
        // Create individual key objects to avoid conflicts
        const escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        const spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        const pKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

        const upKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        const downKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
        const leftKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        const rightKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);

        const wKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        const aKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        const sKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        const dKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

        const tabKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);

        // Number keys for tower selection (avoiding conflicts with speed controls)
        const oneKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE);
        const twoKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_TWO);
        const threeKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_THREE);

        // Alternative number keys
        const digit1Key = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        const digit2Key = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        const digit3Key = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);

        // Speed control keys (different from tower selection)
        const digit4Key = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);
        const digit5Key = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE);

        // Debug key (Mac-friendly)
        const backtickKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKTICK);

        // Game control keys
        escKey.on('down', () => {
            this.gameScene.cancelTowerPlacement();
        });

        pKey.on('down', () => {
            this.gameScene.togglePause();
        });

        digit4Key.on('down', () => {
            this.gameScene.setGameSpeed(1);
        });

        digit5Key.on('down', () => {
            this.gameScene.setGameSpeed(2);
        });

        // Tower selection keys (both numpad and digit keys)
        const selectTower1 = () => {
            if (!this.gameScene.placingTower) {
                this.scene.events.emit('placeTower', 'arrow');
            } else {
                this.gameScene.showKeyboardHelp('Already placing a tower! Press SPACE to place or ESC to cancel');
            }
        };

        const selectTower2 = () => {
            if (!this.gameScene.placingTower) {
                this.scene.events.emit('placeTower', 'cannon');
            } else {
                this.gameScene.showKeyboardHelp('Already placing a tower! Press SPACE to place or ESC to cancel');
            }
        };

        const selectTower3 = () => {
            if (!this.gameScene.placingTower) {
                this.scene.events.emit('placeTower', 'frost');
            } else {
                this.gameScene.showKeyboardHelp('Already placing a tower! Press SPACE to place or ESC to cancel');
            }
        };

        // Connect keyboard handlers to keys
        twoKey.on('down', () => { selectTower2(); });
        digit2Key.on('down', () => { selectTower2(); });
        threeKey.on('down', () => { selectTower3(); });
        digit3Key.on('down', () => { selectTower3(); });

        oneKey.on('down', selectTower1);
        digit1Key.on('down', selectTower1);

        // Grid navigation keys
        upKey.on('down', () => {
            this.moveCursor(0, -1);
        });

        downKey.on('down', () => {
            this.moveCursor(0, 1);
        });

        leftKey.on('down', () => {
            this.moveCursor(-1, 0);
        });

        rightKey.on('down', () => {
            this.moveCursor(1, 0);
        });

        wKey.on('down', () => {
            this.moveCursor(0, -1);
        });

        sKey.on('down', () => {
            this.moveCursor(0, 1);
        });

        aKey.on('down', () => {
            this.moveCursor(-1, 0);
        });

        dKey.on('down', () => {
            this.moveCursor(1, 0);
        });

        // Placement key
        spaceKey.on('down', () => {
            if (this.gameScene.isDragging && this.gameScene.draggedTower) {
                // Drop dragged tower at current cursor position
                const worldPos = gridToWorld(this.cursorGridX, this.cursorGridY);
                const mockPointer = { worldX: worldPos.x, worldY: worldPos.y };
                this.gameScene.endTowerDrag(mockPointer);
            } else if (this.gameScene.placingTower) {
                this.gameScene.attemptKeyboardPlacement();
            }
        });

        // Also handle ENTER key for compatibility
        const enterKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        enterKey.on('down', () => {
            if (this.gameScene.placingTower) {
                this.gameScene.attemptKeyboardPlacement();
            } else if (this.gameScene.selectedTower && !this.gameScene.isDragging) {
                // Pick up selected tower for dragging
                this.gameScene.startTowerDrag(this.gameScene.selectedTower);
            }
        });

        // Cycle towers
        tabKey.on('down', () => {
            this.gameScene.cycleTowerSelection();
        });

        // Debug key - comprehensive game state
        backtickKey.on('down', () => {
            console.log('=== COMPREHENSIVE DEBUG ===');
            console.log(`Can place tower: ${!this.gameScene.placingTower}`);
            console.log(`Current towers: ${this.gameScene.towers.getLength()}`);
            console.log(`Cursor Position: (${this.cursorGridX}, ${this.cursorGridY})`);
            console.log(`Gold: ${this.gameScene.economy.getGold()}`);
            console.log(`Current Wave: ${this.gameScene.economy.getCurrentWave()}`);
            console.log(`Is Paused: ${this.gameScene.isPaused}`);
            console.log(`Scene exists: ${!!this.scene}`);
            console.log(`Tweens available: ${!!this.scene.tweens}`);

            // Test visual effects
            console.log('=== TESTING VISUAL EFFECTS ===');
            if (this.gameScene.screenShakeManager) {
                console.log('✅ ScreenShakeManager available');
                this.gameScene.screenShakeManager.heavyShake();
                console.log('📳 Triggered heavy screen shake');
            } else {
                console.log('❌ ScreenShakeManager not available');
            }

            if (this.gameScene.particleManager) {
                console.log('✅ ParticleManager available');
                this.gameScene.particleManager.createExplosion(400, 300, 0xff0000, 10);
                console.log('💥 Created test explosion particles');
            } else {
                console.log('❌ ParticleManager not available');
            }

            if (this.gameScene.visualJuiceManager) {
                console.log('✅ VisualJuiceManager available');
                this.gameScene.visualJuiceManager.screenFlash(0x00ff00, 300);
                console.log('⚡ Triggered screen flash');
            } else {
                console.log('❌ VisualJuiceManager not available');
            }

            // Test tween creation
            try {
                if (this.scene.tweens) {
                    const testObj = { x: 0 };
                    const testTween = this.scene.tweens.add({
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
            this.gameScene.towers.getChildren().forEach((tower, index) => {
                tower.debugLevelIndicator();
            });
            console.log('=== END DEBUG ===');

            // Force recreate all level indicators
            this.gameScene.towers.getChildren().forEach((tower, index) => {
                tower.forceRecreateLevelIndicator();
            });

            console.log('=============================');
            this.gameScene.showKeyboardHelp(`Debug + Visual Effects Test (\`)`);
        });

        // Store key references for cleanup
        this.keyReferences = {
            escKey, spaceKey, pKey, digit4Key, digit5Key, oneKey, digit1Key,
            twoKey, digit2Key, threeKey, digit3Key, upKey, downKey, leftKey, rightKey,
            wKey, sKey, aKey, dKey, enterKey, tabKey, backtickKey
        };
    }

    handleLeftClick(pointer) {
        const gridPos = worldToGrid(pointer.worldX, pointer.worldY);

        if (this.gameScene.placingTower) {
            // Try to place tower
            this.gameScene.attemptTowerPlacement(gridPos.x, gridPos.y);
        } else {
            // Check if clicking on existing tower
            const gridCell = this.gameScene.grid[gridPos.y]?.[gridPos.x];
            if (gridCell && gridCell.hasTower) {
                this.gameScene.selectTower(gridCell.tower);
                this.gameScene.showKeyboardHelp('Tower selected - ENTER to drag, ESC to deselect');
            } else {
                // No tower clicked - check if we have a selected tower type
                this.gameScene.deselectTower();
                if (this.gameScene.selectedTowerType) {
                    // We have a selected tower type, check if we can afford it
                    if (this.gameScene.canAffordTower(this.gameScene.selectedTowerType)) {
                        this.gameScene.startTowerPlacement(this.gameScene.selectedTowerType);
                    } else {
                        this.gameScene.showKeyboardHelp('Need More Gold');
                    }
                } else {
                    // No tower type selected
                    this.gameScene.showKeyboardHelp('Pick A Tower');
                }
            }
        }
    }

    handleRightClick(pointer) {
        this.gameScene.cancelTowerPlacement();
    }

    moveCursor(deltaX, deltaY) {
        if (!this.gameScene.placingTower) return;

        this.cursorGridX = Math.max(0, Math.min(GRID_WIDTH - 1, this.cursorGridX + deltaX));
        this.cursorGridY = Math.max(0, Math.min(GRID_HEIGHT - 1, this.cursorGridY + deltaY));

        // Update placement ghost position
        const worldPos = gridToWorld(this.cursorGridX, this.cursorGridY);
        if (this.gameScene.placementGhost) {
            this.gameScene.placementGhost.setPosition(worldPos.x, worldPos.y);
            this.gameScene.placementRange.setPosition(worldPos.x, worldPos.y);

            // Update validity color
            const isValid = this.gameScene.isValidTowerPlacement(this.cursorGridX, this.cursorGridY);
            this.gameScene.placementGhost.setTint(isValid ? 0x00ff00 : 0xff0000);
        }

        // Show cursor position
        this.gameScene.showKeyboardHelp(`Position: ${this.cursorGridX}, ${this.cursorGridY}`);
    }

    getCursorPosition() {
        return { x: this.cursorGridX, y: this.cursorGridY };
    }

    cleanup() {
        // Clean up keyboard keys
        if (this.keyReferences) {
            Object.values(this.keyReferences).forEach(key => {
                if (key && key.destroy) {
                    try {
                        key.destroy();
                    } catch (e) {
                        console.log(`⚠️ Could not destroy key`);
                    }
                }
            });
        }

        // Clean up input events
        if (this.scene.input) {
            this.scene.input.off('pointerdown');
            this.scene.input.off('pointermove');
            this.scene.input.off('pointerup');
            this.scene.input.off('gameobjectdown');
        }
    }
}

export default InputManager;
