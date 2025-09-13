import { WORLD_WIDTH, WORLD_HEIGHT } from '../data/path.js';

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // No assets to load in boot scene - just set up and transition
    }

    create() {
        // Set up global game settings
        this.game.registry.set('gameSpeed', 1);
        this.game.registry.set('audioEnabled', true);
        this.game.registry.set('musicVolume', 0.4);
        this.game.registry.set('sfxVolume', 0.7);

        // Transition to PreloadScene
        this.scene.start('PreloadScene');
    }
}

export default BootScene;
