class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
        console.log('🎮 GameOverScene: Constructor called - VERSION 20241206');
    }

    init(data) {
        console.log('🎮 GameOverScene: *** INIT METHOD CALLED ***');
        this.gameData = data || {};
        console.log('🎮 GameOverScene: init called with raw data:', data);
        console.log('🎮 GameOverScene: processed gameData:', this.gameData);
        console.log('🎮 GameOverScene: Won status:', this.gameData.won);
        console.log('🎮 GameOverScene: Other data - score:', this.gameData.score, 'wave:', this.gameData.wave);
        console.log('🎮 GameOverScene: Scene is now active and ready to display');
        console.log('🎮 GameOverScene: *** INIT COMPLETE ***');
    }

    create() {
        console.log('🎮 GameOverScene: *** CREATE METHOD CALLED ***');
        console.log('🎮 GameOverScene created - setting up menu');

        // Background overlay
        this.add.rectangle(480, 270, 960, 540, 0x000000, 0.8);

        console.log('🎮 GameOverScene: Background overlay created');
        console.log('🎮 GameOverScene: *** CREATE METHOD STARTING UI SETUP ***');

        // Game Over text
        const isWin = this.gameData.won;
        console.log('🎮 GameOverScene: Displaying screen - isWin:', isWin);
        console.log('🎮 GameOverScene: Title will be:', isWin ? 'VICTORY!' : 'GAME OVER');

        const titleText = this.add.text(480, 150, isWin ? 'VICTORY!' : 'GAME OVER', {
            font: '48px Arial',
            fill: isWin ? '#00ff00' : '#ff0000',
            stroke: '#000000',
            strokeThickness: 4
        });
        titleText.setOrigin(0.5);

        // Results
        let yPos = 220;
        const results = [
            `Score: ${this.gameData.score || 0}`,
            `Waves Completed: ${this.gameData.wave || 0}`,
            `Enemies Killed: ${this.gameData.kills || 0}`,
            `Gold Remaining: ${this.gameData.gold || 0}`,
            `Lives Remaining: ${this.gameData.lives || 0}`
        ];

        if (isWin) {
            results.unshift('All waves completed!');
        } else {
            results.unshift('Your base was overrun!');
        }

        results.forEach(line => {
            const text = this.add.text(480, yPos, line, {
                font: '20px Arial',
                fill: '#ffffff'
            });
            text.setOrigin(0.5);
            yPos += 30;
        });

        // Restart button
        this.restartButton = this.add.rectangle(480, yPos + 30, 150, 40, 0x4CAF50);
        const restartText = this.add.text(480, yPos + 30, 'PLAY AGAIN (R/SPACE)', {
            font: '16px Arial',
            fill: '#ffffff'
        });
        restartText.setOrigin(0.5);

        this.restartButton.setInteractive();
        this.restartButton.on('pointerover', () => {
            this.restartButton.setFillStyle(0x66BB6A);
        });
        this.restartButton.on('pointerout', () => {
            this.restartButton.setFillStyle(0x4CAF50);
        });
        this.restartButton.on('pointerdown', () => {
            console.log('🔄 Restart button clicked');
            this.restartGame();
        });

        // Keyboard controls
        console.log('🎮 Setting up keyboard controls...');
        this.input.keyboard.on('keydown-R', () => {
            console.log('🔄 R key pressed - restarting game');
            this.restartGame();
        });

        this.input.keyboard.on('keydown-M', () => {
            console.log('🔄 M key pressed - returning to menu');
            this.returnToMenu();
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            console.log('🔄 SPACE key pressed - restarting game');
            this.restartGame();
        });

        // Menu button
        this.menuButton = this.add.rectangle(480, yPos + 80, 150, 40, 0x2196F3);
        const menuText = this.add.text(480, yPos + 80, 'MAIN MENU (M)', {
            font: '16px Arial',
            fill: '#ffffff'
        });
        menuText.setOrigin(0.5);

        this.menuButton.setInteractive();
        this.menuButton.on('pointerover', () => {
            this.menuButton.setFillStyle(0x42A5F5);
        });
        this.menuButton.on('pointerout', () => {
            this.menuButton.setFillStyle(0x2196F3); // FIXED: was menuButton, now this.menuButton
        });
        this.menuButton.on('pointerdown', () => {
            console.log('🔄 Menu button clicked');
            this.returnToMenu();
        });

        console.log('🎮 GameOverScene: Setup complete - screen should be visible now!');
        console.log('🎮 GameOverScene: Final game data:', this.gameData);
    }

    restartGame() {
        console.log('🔄 [1/6] Restarting game...');

        // First stop the current game scenes to avoid conflicts
        console.log('🔄 [2/6] Stopping old scenes...');
        try {
            // Check what scenes are currently active
            const activeScenes = this.scene.manager.getScenes(true).map(s => s.scene.key);
            const allScenes = this.scene.manager.getScenes(false).map(s => s.scene.key);
            console.log('🔄 [2a/6] Active scenes:', activeScenes);
            console.log('🔄 [2b/6] All scenes:', allScenes);

            // Stop GameScene if it exists
            if (this.scene.get('GameScene')) {
                console.log('🔄 [2c/6] GameScene found, stopping...');
                this.scene.stop('GameScene');
                console.log('🔄 [2d/6] GameScene stopped successfully');
            } else {
                console.log('🔄 [2c/6] GameScene not found, skipping');
            }

            // Stop UIScene if it exists
            if (this.scene.get('UIScene')) {
                console.log('🔄 [2e/6] UIScene found, stopping...');
                this.scene.stop('UIScene');
                console.log('🔄 [2f/6] UIScene stopped successfully');
            } else {
                console.log('🔄 [2e/6] UIScene not found, skipping');
            }
        } catch (error) {
            console.error('❌ [2x/6] Error stopping scenes:', error);
            console.error('❌ [2x/6] Stack trace:', error.stack);
            return; // Don't continue if stopping scenes fails
        }

        console.log('🔄 [3/6] Old scenes stopped, waiting before starting new ones...');

        // Start fresh scenes after a brief delay
        this.time.delayedCall(100, () => {
            console.log('🔄 [4/6] Starting fresh GameScene...');
            try {
                this.scene.start('GameScene');
                console.log('🔄 [4a/6] GameScene started successfully');
            } catch (error) {
                console.error('❌ [4x/6] Error starting GameScene:', error);
                console.error('❌ [4x/6] Stack trace:', error.stack);
                return;
            }

            console.log('🔄 [5/6] Launching fresh UIScene...');
            try {
                this.scene.launch('UIScene');
                console.log('🔄 [5a/6] UIScene launched successfully');
            } catch (error) {
                console.error('❌ [5x/6] Error launching UIScene:', error);
                console.error('❌ [5x/6] Stack trace:', error.stack);
                return;
            }

            console.log('🔄 [6/6] New scenes running, stopping GameOverScene...');

            // Stop this scene after the new scenes are running
            this.time.delayedCall(200, () => {
                try {
                    this.scene.stop();
                    console.log('✅ Game restarted successfully');
                } catch (error) {
                    console.error('❌ [6x/6] Error stopping GameOverScene:', error);
                    console.error('❌ [6x/6] Stack trace:', error.stack);
                }
            });
        });
    }

    returnToMenu() {
        console.log('🔄 Returning to menu...');

        // First stop the current game scenes to avoid conflicts
        try {
            // Stop GameScene if it exists
            if (this.scene.get('GameScene')) {
                this.scene.stop('GameScene');
            }
            // Stop UIScene if it exists
            if (this.scene.get('UIScene')) {
                this.scene.stop('UIScene');
            }
        } catch (error) {
            console.warn('⚠️ Error stopping scenes:', error.message);
        }

        // Start menu scene after a brief delay
        this.time.delayedCall(100, () => {
            this.scene.start('MenuScene');

            // Stop this scene after the menu is running
            this.time.delayedCall(200, () => {
                this.scene.stop();
                console.log('✅ Returned to menu successfully');
            });
        });
    }

    shutdown() {
        try {
            console.log('🧹 GameOverScene shutdown - cleaning up event listeners');

            // Clean up keyboard event listeners
            if (this.input && this.input.keyboard) {
                this.input.keyboard.off('keydown-R');
                this.input.keyboard.off('keydown-M');
                this.input.keyboard.off('keydown-SPACE');
                console.log('✅ Keyboard listeners cleaned up');
            }

            // Clean up button event listeners
            if (this.restartButton) {
                this.restartButton.off('pointerdown');
                this.restartButton.off('pointerover');
                this.restartButton.off('pointerout');
            }
            if (this.menuButton) {
                this.menuButton.off('pointerdown');
                this.menuButton.off('pointerover');
                this.menuButton.off('pointerout');
            }

            console.log('✅ GameOverScene shutdown complete');

        } catch (error) {
            console.error('❌ Error during GameOverScene shutdown:', error);
            console.error('Stack trace:', error.stack);
        }
    }
}

export default GameOverScene;
