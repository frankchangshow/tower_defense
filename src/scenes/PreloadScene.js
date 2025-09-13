import { TILE_SIZE, WAYPOINTS, gridToWorld } from '../data/path.js';
import { TOWERS } from '../data/towers.js';
import { ENEMIES } from '../data/enemies.js';

class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // Create loading UI
        this.createLoadingUI();

        // Since we're creating placeholder assets programmatically,
        // we'll simulate a brief loading delay for visual feedback
        this.time.delayedCall(500, () => {
            this.progressBar.fillStyle(0xffffff, 1);
            this.progressBar.fillRect(250, 280, 300, 30);
            this.percentText.setText('100%');

            this.time.delayedCall(200, () => {
                // Clean up loading UI
                this.progressBar.destroy();
                this.progressBox.destroy();
                this.loadingText.destroy();
                this.percentText.destroy();

                // Create assets and transition
                this.createAllAssets();
                this.scene.start('MenuScene');
            });
        });
    }

    createLoadingUI() {
        this.progressBar = this.add.graphics();
        this.progressBox = this.add.graphics();
        this.progressBox.fillStyle(0x222222, 0.8);
        this.progressBox.fillRect(240, 270, 320, 50);

        this.loadingText = this.make.text({
            x: 480,
            y: 250,
            text: 'Initializing...',
            style: {
                font: '20px monospace',
                fill: '#ffffff'
            }
        });
        this.loadingText.setOrigin(0.5, 0.5);

        this.percentText = this.make.text({
            x: 480,
            y: 295,
            text: '0%',
            style: {
                font: '18px monospace',
                fill: '#ffffff'
            }
        });
        this.percentText.setOrigin(0.5, 0.5);
    }

    createAllAssets() {
        console.log('=== STARTING ASSET CREATION ===');

        // Create placeholder sprites (we'll replace these with real assets later)
        this.createPlaceholderSprites();

        // Load audio placeholders (hooks for future audio)
        this.createAudioPlaceholders();

        // Create path visualization texture
        this.createPathTexture();

        console.log('=== ASSET CREATION COMPLETE ===');
    }

    createPlaceholderSprites() {
        // Create placeholder textures programmatically
        this.createTowerPlaceholders();
        this.createEnemyPlaceholders();
        this.createProjectilePlaceholders();
        this.createUITPlaceholders();
    }

    createTowerPlaceholders() {
        console.log('Creating tower placeholders...');

        // Arrow Tower placeholder
        const arrowGraphics = this.add.graphics();
        arrowGraphics.fillStyle(TOWERS.arrow.color || 0x8B4513);
        arrowGraphics.fillRect(0, 0, 40, 40);
        arrowGraphics.lineStyle(2, 0x654321);
        arrowGraphics.strokeRect(0, 0, 40, 40);
        arrowGraphics.generateTexture('tower_arrow', 40, 40);
        arrowGraphics.destroy();
        console.log('Arrow tower texture created');

        // Cannon Tower placeholder
        const cannonGraphics = this.add.graphics();
        cannonGraphics.fillStyle(TOWERS.cannon.color || 0x696969);
        cannonGraphics.fillRect(0, 0, 40, 40);
        cannonGraphics.lineStyle(2, 0x444444);
        cannonGraphics.strokeRect(0, 0, 40, 40);
        cannonGraphics.generateTexture('tower_cannon', 40, 40);
        cannonGraphics.destroy();
        console.log('Cannon tower texture created');

        // Frost Tower placeholder
        const frostGraphics = this.add.graphics();
        frostGraphics.fillStyle(TOWERS.frost.color || 0x4682B4);
        frostGraphics.fillRect(0, 0, 40, 40);
        frostGraphics.lineStyle(2, 0x2E5984);
        frostGraphics.strokeRect(0, 0, 40, 40);
        frostGraphics.generateTexture('tower_frost', 40, 40);
        frostGraphics.destroy();
        console.log('Frost tower texture created');
    }

    createEnemyPlaceholders() {
        Object.keys(ENEMIES).forEach(enemyType => {
            const enemy = ENEMIES[enemyType];
            const enemyGraphics = this.add.graphics();
            enemyGraphics.fillStyle(enemy.color);
            enemyGraphics.fillRect(0, 0, 30, 30);
            enemyGraphics.lineStyle(2, 0x000000);
            enemyGraphics.strokeRect(0, 0, 30, 30);
            enemyGraphics.generateTexture(`enemy_${enemyType}`, 30, 30);
            enemyGraphics.destroy();
        });
    }

    createProjectilePlaceholders() {
        // Arrow projectile - bright color for visibility on white road
        const arrowProjGraphics = this.add.graphics();
        arrowProjGraphics.fillStyle(0xFF6B35); // Bright orange-red
        arrowProjGraphics.fillRect(0, 0, 8, 16);
        // Add a dark outline for better visibility
        arrowProjGraphics.lineStyle(1, 0x000000);
        arrowProjGraphics.strokeRect(0, 0, 8, 16);
        arrowProjGraphics.generateTexture('proj_arrow', 8, 16);
        arrowProjGraphics.destroy();

        // Cannon shell - keep dark but add bright highlight
        const shellGraphics = this.add.graphics();
        shellGraphics.fillStyle(0x333333);
        shellGraphics.fillCircle(8, 8, 8);
        shellGraphics.lineStyle(3, 0xFFD700); // Gold outline for visibility
        shellGraphics.strokeCircle(8, 8, 8);
        shellGraphics.generateTexture('proj_cannon', 16, 16);
        shellGraphics.destroy();

        // Frost shard - bright blue for good contrast
        const frostGraphics = this.add.graphics();
        frostGraphics.fillStyle(0x00BFFF); // Deep sky blue - brighter than before
        const points = [
            {x: 8, y: 0},
            {x: 16, y: 8},
            {x: 8, y: 16},
            {x: 0, y: 8}
        ];
        frostGraphics.fillPoints(points);
        frostGraphics.lineStyle(2, 0xFFFFFF); // White outline
        frostGraphics.strokePoints(points);
        frostGraphics.generateTexture('proj_frost', 16, 16);
        frostGraphics.destroy();

        console.log('🎯 Projectile textures updated for white road visibility!');
    }

    createUITPlaceholders() {
        // Range circle texture
        const rangeGraphics = this.add.graphics();
        rangeGraphics.lineStyle(2, 0x00ff00, 0.5);
        rangeGraphics.strokeCircle(0, 0, 100);
        rangeGraphics.generateTexture('range_circle', 200, 200);
        rangeGraphics.destroy();

        // Invalid placement overlay
        const invalidGraphics = this.add.graphics();
        invalidGraphics.fillStyle(0xff0000, 0.3);
        invalidGraphics.fillRect(0, 0, 60, 60);
        invalidGraphics.lineStyle(2, 0xff0000);
        invalidGraphics.strokeRect(0, 0, 60, 60);
        invalidGraphics.generateTexture('invalid_placement', 60, 60);
        invalidGraphics.destroy();

        // Valid placement overlay
        const validGraphics = this.add.graphics();
        validGraphics.fillStyle(0x00ff00, 0.3);
        validGraphics.fillRect(0, 0, 60, 60);
        validGraphics.lineStyle(2, 0x00ff00);
        validGraphics.strokeRect(0, 0, 60, 60);
        validGraphics.generateTexture('valid_placement', 60, 60);
        validGraphics.destroy();

    }

    createAudioPlaceholders() {
        // Audio hooks - these will be replaced with actual audio files
        // For now, we just register the keys so the game doesn't crash
        this.game.registry.set('audioHooks', {
            music: ['level1'],
            sfx: ['place', 'upgrade', 'sell', 'shot_arrow', 'shot_cannon', 'shot_frost', 'enemy_die', 'leak', 'wave_start', 'wave_clear', 'boss_intro']
        });
    }

    createPathTexture() {
        // Create a texture for the path tiles - clean white road
        const pathGraphics = this.add.graphics();

        // Clean white background
        pathGraphics.fillStyle(0xFFFFFF);
        pathGraphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

        // Light gray border for definition
        pathGraphics.lineStyle(2, 0xCCCCCC);
        pathGraphics.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);

        // Subtle center lines
        pathGraphics.lineStyle(1, 0xEEEEEE);
        pathGraphics.moveTo(TILE_SIZE/2, 0);
        pathGraphics.lineTo(TILE_SIZE/2, TILE_SIZE);
        pathGraphics.moveTo(0, TILE_SIZE/2);
        pathGraphics.lineTo(TILE_SIZE, TILE_SIZE/2);
        pathGraphics.stroke();

        pathGraphics.generateTexture('path_tile', TILE_SIZE, TILE_SIZE);
        pathGraphics.destroy();

        // Create grass texture for non-path tiles
        const grassGraphics = this.add.graphics();
        grassGraphics.fillStyle(0x228B22);
        grassGraphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        grassGraphics.lineStyle(1, 0x006400);
        grassGraphics.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
        grassGraphics.generateTexture('grass_tile', TILE_SIZE, TILE_SIZE);
        grassGraphics.destroy();

        console.log('🎨 Path texture created - CLEAN WHITE road!');
        console.log('⚪ Path tiles are now white for better visibility!');
    }

}

export default PreloadScene;
