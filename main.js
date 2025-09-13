// Tower Defense Game - Main Entry Point
import { getVersionedUrl } from './src/config/version.js';

import BootScene from './src/scenes/BootScene.js?v=20241213iii';
import PreloadScene from './src/scenes/PreloadScene.js?v=20241213iii';
import MenuScene from './src/scenes/MenuScene.js?v=20241213iii';
import GameScene from './src/scenes/GameScene.js?v=20241213iii';
import UIScene from './src/scenes/UIScene.js?v=20241213iii';
import GameOverScene from './src/scenes/GameOverScene.js?v=20241213iii';

// Game Configuration
const config = {
    type: Phaser.AUTO,
    width: 960,
    height: 540,
    parent: 'game-container',
    backgroundColor: '#2c3e50',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [BootScene, PreloadScene, MenuScene, GameScene, UIScene, GameOverScene]
};

// Initialize the game
const game = new Phaser.Game(config);
