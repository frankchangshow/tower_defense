import { TILE_SIZE, GRID_WIDTH, GRID_HEIGHT, gridToWorld, worldToGrid, isOnPath } from '../data/path.js';
import { TOWERS } from '../data/towers.js';
import Tower from '../objects/Tower.js';

/**
 * TowerPlacementManager - Handles tower placement, drag & drop, and validation
 * Extracted from GameScene.js to improve maintainability
 */
class TowerPlacementManager {
    constructor(scene) {
        this.scene = scene;
        this.gameScene = scene; // Reference to the main game scene
        
        // Tower placement state
        this.placingTower = null;
        this.selectedTowerType = null;
        this.draggedTower = null;
        this.isDragging = false;
        
        // Visual elements
        this.placementGhost = null;
        this.placementRange = null;
        this.dragGhost = null;
        
        // Drag state
        this.originalGridX = null;
        this.originalGridY = null;
        
        // Visual effects managers (set by GameScene)
        this.visualJuiceManager = null;
        this.particleManager = null;
        this.screenShakeManager = null;
    }

    setVisualEffects(visualJuiceManager, particleManager, screenShakeManager) {
        console.log('🎨 TowerPlacementManager: Setting visual effects managers...');
        console.log('🎨 VisualJuiceManager:', !!visualJuiceManager);
        console.log('🎨 ParticleManager:', !!particleManager);
        console.log('🎨 ScreenShakeManager:', !!screenShakeManager);
        
        this.visualJuiceManager = visualJuiceManager;
        this.particleManager = particleManager;
        this.screenShakeManager = screenShakeManager;
        
        console.log('🎨 TowerPlacementManager: Visual effects managers set successfully');
    }

    startTowerPlacement(towerType) {
        console.log(`=== STARTING TOWER PLACEMENT: ${towerType} ===`);
        console.log(`Mouse pointer position: (${this.scene.input.activePointer.x}, ${this.scene.input.activePointer.y})`);

        this.placingTower = towerType;
        this.gameScene.deselectTower();

        // Create placement ghost
        this.createPlacementGhost();

        console.log(`=== PLACEMENT MODE ACTIVE FOR: ${towerType} ===`);
    }

    createPlacementGhost() {
        // Always start at keyboard cursor position initially
        const cursorPos = this.gameScene.inputManager.getCursorPosition();
        const worldPos = gridToWorld(cursorPos.x, cursorPos.y);

        console.log(`Creating placement ghost for ${this.placingTower} at grid (${cursorPos.x}, ${cursorPos.y})`);

        this.placementGhost = this.scene.add.image(worldPos.x, worldPos.y, `tower_${this.placingTower}`);
        this.placementGhost.setAlpha(0.7);

        this.placementRange = this.scene.add.image(worldPos.x, worldPos.y, 'range_circle');
        this.placementRange.setAlpha(0.3);

        // Update validity color immediately
        const isValid = this.isValidTowerPlacement(cursorPos.x, cursorPos.y);
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
        const gridCell = this.gameScene.grid[gridY][gridX];
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
        console.log(`Tower cost: ${towerCost}, Current gold: ${this.gameScene.economy.getGold()}`);
        
        if (!this.gameScene.economy.spendGold(towerCost)) {
            console.log('Not enough gold to place tower');
            return; // Not enough gold
        }

        try {
            // Create the tower
            const worldPos = gridToWorld(gridX, gridY);
            console.log(`Creating tower at world position (${worldPos.x}, ${worldPos.y})`);
            
            const tower = new Tower(this.scene, worldPos.x, worldPos.y, this.placingTower);
            console.log('Tower created successfully');

            // Set tower properties
            tower.gridX = gridX;
            tower.gridY = gridY;

            // Add to grid
            this.gameScene.grid[gridY][gridX].hasTower = true;
            this.gameScene.grid[gridY][gridX].tower = tower;

            // Add to towers group
            this.gameScene.towers.add(tower);
            console.log('Tower added to game');

            // Add visual effects for tower placement
            console.log('🎨 Attempting to trigger visual effects for tower placement...');
            console.log('🎨 VisualJuiceManager available:', !!this.visualJuiceManager);
            console.log('🎨 ParticleManager available:', !!this.particleManager);
            console.log('🎨 ScreenShakeManager available:', !!this.screenShakeManager);
            
            if (this.visualJuiceManager) {
                console.log('🎨 Triggering tower placement pop animation...');
                this.visualJuiceManager.towerPlacementPop(tower);
            } else {
                console.log('❌ VisualJuiceManager not available for tower placement');
            }
            
            if (this.particleManager) {
                console.log('🎨 Triggering tower placement dust particles...');
                this.particleManager.createTowerPlacementDust(worldPos.x, worldPos.y);
            } else {
                console.log('❌ ParticleManager not available for tower placement');
            }
            
            if (this.screenShakeManager) {
                console.log('🎨 Triggering light screen shake...');
                this.screenShakeManager.lightShake();
            } else {
                console.log('❌ ScreenShakeManager not available for tower placement');
            }

            // Clean up placement
            this.cancelTowerPlacement();

            // Emit tower placed event for UI
            this.scene.events.emit('towerPlaced', tower);
            // Keep tower type selection - don't clear it so user can place more of the same type
            console.log('Tower placement completed successfully');
            if (this.selectedTowerType) {
                this.gameScene.updateGameStateIndicator(`Selected: ${this.selectedTowerType} - Click to place`);
            } else {
                this.gameScene.updateGameStateIndicator('Pick A Tower');
            }
            
        } catch (error) {
            console.error('Error placing tower:', error);
            console.error('Stack trace:', error.stack);
            
            // Refund the gold if tower creation failed
            this.gameScene.economy.addGold(towerCost);
        }
    }

    attemptKeyboardPlacement() {
        if (!this.placingTower) return;

        const cursorPos = this.gameScene.inputManager.getCursorPosition();
        this.attemptTowerPlacement(cursorPos.x, cursorPos.y);
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
            this.gameScene.updateTowerIndicator(`Selected: ${this.selectedTowerType} - Click to place`);
        } else {
            this.gameScene.updateTowerIndicator('Pick A Tower');
        }
        console.log('Tower placement cancelled');
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

        this.gameScene.showKeyboardHelp('Dragging tower - release to drop');
    }

    createDragGhost(tower) {
        const cursorPos = this.gameScene.inputManager.getCursorPosition();
        const worldPos = gridToWorld(cursorPos.x, cursorPos.y);
        this.dragGhost = this.scene.add.image(worldPos.x, worldPos.y, `tower_${tower.towerType}`);
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
            this.gameScene.showKeyboardHelp('Tower moved successfully!');
        } else {
            // Return to original position
            this.gameScene.showKeyboardHelp('Invalid position - tower returned');
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
        const targetCell = this.gameScene.grid[gridY][gridX];
        if (targetCell.hasTower && targetCell.tower !== this.draggedTower) {
            return false;
        }

        return true;
    }

    moveTowerToPosition(tower, newGridX, newGridY) {
        // Update grid references
        this.gameScene.grid[tower.gridY][tower.gridX].hasTower = false;
        this.gameScene.grid[tower.gridY][tower.gridX].tower = null;

        this.gameScene.grid[newGridY][newGridX].hasTower = true;
        this.gameScene.grid[newGridY][newGridX].tower = tower;

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
        // Update placement ghost position
        if (this.placingTower && this.placementGhost) {
            // Always update ghost position - prioritize mouse if active, otherwise keyboard
            let worldPos;
            let gridPos;

            if (this.scene.input.activePointer.x !== 0 || this.scene.input.activePointer.y !== 0) {
                // Mouse is active - use mouse position
                gridPos = worldToGrid(this.scene.input.activePointer.worldX, this.scene.input.activePointer.worldY);
                worldPos = gridToWorld(gridPos.x, gridPos.y);
            } else {
                // Keyboard mode - use cursor position
                const cursorPos = this.gameScene.inputManager.getCursorPosition();
                gridPos = { x: cursorPos.x, y: cursorPos.y };
                worldPos = gridToWorld(cursorPos.x, cursorPos.y);
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
            const pointer = this.scene.input.activePointer;
            const gridPos = worldToGrid(pointer.worldX, pointer.worldY);

            // Snap to grid
            const worldPos = gridToWorld(gridPos.x, gridPos.y);
            this.dragGhost.setPosition(worldPos.x, worldPos.y);

            // Update validity color
            const isValid = this.isValidDropPosition(gridPos.x, gridPos.y);
            this.dragGhost.setTint(isValid ? 0x00ff00 : 0xff0000);
        }
    }

    cycleTowerSelection() {
        if (this.placingTower) return;

        const towers = ['arrow', 'cannon', 'frost'];
        const currentIndex = towers.indexOf(this.gameScene.lastSelectedTower || 'arrow');
        const nextIndex = (currentIndex + 1) % towers.length;
        const nextTower = towers[nextIndex];

        this.scene.events.emit('placeTower', nextTower);
        this.gameScene.lastSelectedTower = nextTower;
        console.log(`Tower cycled to: ${nextTower}`);
    }

    cleanup() {
        // Clean up visual elements
        if (this.placementGhost) {
            this.placementGhost.destroy();
            this.placementGhost = null;
        }
        if (this.placementRange) {
            this.placementRange.destroy();
            this.placementRange = null;
        }
        if (this.dragGhost) {
            this.dragGhost.destroy();
            this.dragGhost = null;
        }
    }
}

export default TowerPlacementManager;
