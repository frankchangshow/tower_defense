import { getVersionText } from '../config/version.js';

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Initialize audio registry if not set
        if (this.game.registry.get('audioEnabled') === undefined) {
            this.game.registry.set('audioEnabled', true);
        }

        // Background
        this.add.rectangle(480, 270, 960, 540, 0x2c3e50);

        // Title
        const titleText = this.add.text(480, 150, 'TOWER DEFENSE', {
            font: '48px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        titleText.setOrigin(0.5);

        // Subtitle
        const subtitleText = this.add.text(480, 200, 'Defend your base from enemy waves!', {
            font: '24px Arial',
            fill: '#cccccc'
        });
        subtitleText.setOrigin(0.5);

        // Start Game Button
        const startButton = this.add.rectangle(480, 300, 200, 50, 0x4CAF50);
        const startText = this.add.text(480, 300, 'START GAME', {
            font: '20px Arial',
            fill: '#ffffff'
        });
        startText.setOrigin(0.5);

        // Make button interactive
        startButton.setInteractive();
        startButton.on('pointerover', () => {
            startButton.setFillStyle(0x66BB6A);
        });
        startButton.on('pointerout', () => {
            startButton.setFillStyle(0x4CAF50);
        });
        startButton.on('pointerdown', () => {
            this.scene.start('GameScene');
            this.scene.launch('UIScene');
        });

        // Keyboard controls for menu
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('GameScene');
            this.scene.launch('UIScene');
        });

        // Instructions
        const instructions = [
            'MOUSE CONTROLS:',
            'Left Click: Place towers / Select existing',
            'Click & Hold: Drag towers to new positions',
            'Right Click: Cancel placement',
            '',
            'KEYBOARD CONTROLS:',
            'SPACE: Start game (menu) / Place tower (game)',
            '1/2/3: Select Arrow/Cannon/Frost towers',
            'Arrow Keys or WASD: Navigate grid',
            'TAB: Cycle through towers',
            'ENTER: Pick up selected tower',
            'ESC: Cancel placement/deselect',
            'P: Pause/Resume game',
            '4: 1x speed, 5: 2x speed',
            '',
            'DRAG & DROP (Mouse):',
            'Click & hold tower → drag to new position',
            '',
            'DEBUG (Mac-friendly):',
            '`: Show quick game status',
            '',
            'Survive all 10 waves!',
            'Build towers to defend your base.'
        ];

        let yPos = 380;
        instructions.forEach(line => {
            const text = this.add.text(480, yPos, line, {
                font: '16px Arial',
                fill: '#bbbbbb'
            });
            text.setOrigin(0.5);
            yPos += 25;
        });

        // Audio toggle button
        const audioButton = this.add.rectangle(850, 500, 100, 30, 0x2196F3);
        const audioText = this.add.text(850, 500, 'Audio: ON', {
            font: '14px Arial',
            fill: '#ffffff'
        });
        audioText.setOrigin(0.5);

        // Set initial state based on registry
        const initialAudioState = this.game.registry.get('audioEnabled');
        audioText.setText(initialAudioState ? 'Audio: ON' : 'Audio: OFF');
        audioButton.setFillStyle(initialAudioState ? 0x2196F3 : 0x757575);

        audioButton.setInteractive();
        audioButton.on('pointerdown', () => {
            const currentAudioState = this.game.registry.get('audioEnabled');
            this.game.registry.set('audioEnabled', !currentAudioState);
            audioText.setText(currentAudioState ? 'Audio: OFF' : 'Audio: ON');
            audioButton.setFillStyle(currentAudioState ? 0x757575 : 0x2196F3);
            console.log('🔊 Audio toggled to:', !currentAudioState);
        });

        // Version info
        this.add.text(10, 520, getVersionText(), {
            font: '12px Arial',
            fill: '#666666'
        });
    }
}

export default MenuScene;
