// Import scene classes for restart
import GameScene from './GameScene.js';
import UIScene from './UIScene.js';

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

        // Play appropriate sound based on win/lose
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (isWin) {
                // Play victory sound
                this.playVictorySound(audioContext);
            } else {
                // Play game over sound
                this.playGameOverSound(audioContext);
            }
        } catch (error) {
            console.warn('🔊 Could not play game over/victory sound:', error);
        }

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
        this.restartButton = this.add.rectangle(480, yPos + 30, 250, 40, 0x4CAF50);
        const restartText = this.add.text(480, yPos + 30, 'PLAY AGAIN (R/SPACE)', {
            font: '12px Arial',
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

        this.input.keyboard.on('keydown-SPACE', () => {
            console.log('🔄 SPACE key pressed - restarting game');
            this.restartGame();
        });

        console.log('🎮 GameOverScene: Setup complete - screen should be visible now!');
        console.log('🎮 GameOverScene: Final game data:', this.gameData);
    }

    restartGame() {
        console.log('🔄 [FUNCTION: restartGame] Restarting game...');
        console.log('🔄 [FUNCTION: restartGame] Current scene key:', this.scene.key);
        console.log('🔄 [FUNCTION: restartGame] Scene manager exists:', !!this.scene.manager);

        try {
            // Nuclear option: reload the entire page to avoid all destroy errors
            console.log('🔄 [FUNCTION: restartGame] Using page reload approach...');
            
            // Reload the page to get a completely fresh start
            window.location.reload();
            
            console.log('✅ [FUNCTION: restartGame] Page reload initiated');
            
        } catch (error) {
            console.error('❌ [FUNCTION: restartGame] Error during restart:', error);
        }
    }

    cleanupSceneObjects() {
        try {
            console.log('🧹 Cleaning up GameOverScene objects...');
            
            // Remove all children from the scene
            if (this.children) {
                this.children.list.forEach(child => {
                    try {
                        if (child && typeof child.destroy === 'function') {
                            child.destroy();
                        }
                    } catch (error) {
                        console.warn('🧹 Error destroying child:', error.message);
                    }
                });
                this.children.removeAll();
            }
            
            // Clean up specific objects
            if (this.restartButton) {
                this.restartButton.destroy();
                this.restartButton = null;
            }
            if (this.menuButton) {
                this.menuButton.destroy();
                this.menuButton = null;
            }
            if (this.restartText) {
                this.restartText.destroy();
                this.restartText = null;
            }
            if (this.menuText) {
                this.menuText.destroy();
                this.menuText = null;
            }
            
            console.log('🧹 GameOverScene objects cleaned up');
        } catch (error) {
            console.warn('🧹 Error during cleanup:', error.message);
        }
    }

    playVictorySound(audioContext) {
        try {
            const bufferSize = audioContext.sampleRate * 1.5; // 1.5 seconds
            const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                const t = i / audioContext.sampleRate;
                // Triumphant ascending melody
                const frequency = 200 + (t * 300); // Rising from 200Hz to 500Hz
                data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 0.8) * 0.4;
            }
            
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);
            source.start();
            
            console.log('🔊 Victory sound played');
        } catch (error) {
            console.warn('🔊 Could not play victory sound:', error);
        }
    }

    playGameOverSound(audioContext) {
        try {
            const bufferSize = audioContext.sampleRate * 1.0; // 1.0 seconds
            const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                const t = i / audioContext.sampleRate;
                // Sad descending tone
                const frequency = 300 - (t * 200); // Falling from 300Hz to 100Hz
                data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 1) * 0.5;
            }
            
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);
            source.start();
            
            console.log('🔊 Game over sound played');
        } catch (error) {
            console.warn('🔊 Could not play game over sound:', error);
        }
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
