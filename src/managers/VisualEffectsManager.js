/**
 * VisualEffectsManager - Handles visual feedback, effects, and UI indicators
 * Extracted from GameScene.js to improve maintainability
 */
class VisualEffectsManager {
    constructor(scene) {
        this.scene = scene;
        this.gameScene = scene; // Reference to the main game scene
        
        // Visual indicators
        this.keyboardIndicator = null;
        this.debugInfo = null;
        this.towerIndicator = null;
        this.dragIndicator = null;
        this.gameStateIndicator = null;
        this.helpText = null;
    }

    createVisualIndicators() {
        // Add keyboard control indicator - moved further right and up
        this.keyboardIndicator = this.scene.add.text(720, 450, 'KEYBOARD: ACTIVE', {
            font: '10px Arial',
            fill: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 }
        });
        this.keyboardIndicator.setAlpha(0.8);

        // Add debug info panel - moved further right and up
        this.debugInfo = this.scene.add.text(720, 430, 'DEBUG: Press `', {
            font: '9px Arial',
            fill: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 3, y: 1 }
        });
        this.debugInfo.setAlpha(0.7);

        // Add tower selection indicator - moved further right and up
        this.towerIndicator = this.scene.add.text(720, 490, 'Tower: 1/2/3 keys', {
            font: '11px Arial',
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 4, y: 2 }
        });
        this.towerIndicator.setAlpha(0.8);

        // Add drag help indicator - moved further right and up
        this.dragIndicator = this.scene.add.text(720, 510, 'Drag: Click + ENTER', {
            font: '10px Arial',
            fill: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 3, y: 1 }
        });
        this.dragIndicator.setAlpha(0.7);

        // Add game state indicator - moved further right and up
        this.gameStateIndicator = this.scene.add.text(720, 470, 'Game: Ready', {
            font: '10px Arial',
            fill: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 }
        });
        this.gameStateIndicator.setAlpha(0.8);
    }

    updateTowerIndicator(message) {
        if (this.towerIndicator) {
            this.towerIndicator.setText(message);
        }
    }

    updateGameStateIndicator(message) {
        if (this.gameStateIndicator) {
            this.gameStateIndicator.setText(`Game Status: ${message}`);
        }
    }

    showKeyboardHelp(message) {
        // Remove existing help text
        if (this.helpText) {
            this.helpText.destroy();
        }

        // Create new help text at bottom center - moved up to stay on screen
        this.helpText = this.scene.add.text(400, 520, message, {
            font: '16px Arial',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });
        this.helpText.setOrigin(0.5, 0.5); // Center the text

        // Auto-hide after 2 seconds
        this.scene.time.delayedCall(2000, () => {
            if (this.helpText) {
                this.helpText.destroy();
                this.helpText = null;
            }
        });
    }

    cleanup() {
        // Clean up display objects
        const displayObjects = [
            'keyboardIndicator', 'towerIndicator', 'dragIndicator', 'gameStateIndicator',
            'debugInfo', 'helpText'
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
    }
}

export default VisualEffectsManager;
