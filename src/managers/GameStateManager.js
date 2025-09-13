/**
 * GameStateManager - Handles game state, pause/resume, and speed control
 * Extracted from GameScene.js to improve maintainability
 */
class GameStateManager {
    constructor(scene) {
        this.scene = scene;
        this.gameScene = scene; // Reference to the main game scene
        
        // Game state
        this.gameSpeed = 1;
        this.isPaused = false;
    }

    togglePause() {
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.gameScene.spawner.pause();
            this.scene.physics.pause();
            this.gameScene.updateGameStateIndicator('PAUSED - Press P to resume');
        } else {
            this.gameScene.spawner.resume();
            this.scene.physics.resume();
            this.gameScene.updateGameStateIndicator('Playing');
        }

        this.scene.events.emit('pauseToggled', this.isPaused);
    }

    setGameSpeed(speed) {
        this.gameSpeed = speed;
        this.gameScene.spawner.setGameSpeed(speed);

        // Update all tweens and timers
        this.scene.tweens.timeScale = speed;
        this.scene.time.timeScale = speed;

        this.scene.events.emit('gameSpeedChanged', speed);
    }

    getGameSpeed() {
        return this.gameSpeed;
    }

    isGamePaused() {
        return this.isPaused;
    }
}

export default GameStateManager;
