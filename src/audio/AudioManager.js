/**
 * AudioManager - Handles all game audio including music and sound effects
 * Designed to be kid-friendly with engaging sounds
 */
class AudioManager {
    constructor(scene) {
        this.scene = scene;
        // Check registry for audio state, default to true if not set
        this.isEnabled = this.scene.game.registry.get('audioEnabled', true);
        this.masterVolume = 0.7;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.8;
        
        // Audio objects
        this.audioContext = null;
        this.backgroundMusic = null;
        this.sounds = {};
        this.isInitialized = false;
        
        console.log('🔊 AudioManager initialized - Audio enabled:', this.isEnabled);
    }

    /**
     * Initialize audio system and create placeholder sounds
     */
    initialize() {
        console.log('🔊 Initializing audio system...');
        
        try {
            // Create single AudioContext
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Handle AudioContext state
            if (this.audioContext.state === 'suspended') {
                console.log('🔊 AudioContext suspended, will resume on user interaction');
            }
            
            // Create placeholder audio files
            this.createPlaceholderAudio();
            
            // Start background music
            this.playBackgroundMusic();
            
            this.isInitialized = true;
            console.log('🔊 Audio system ready');
        } catch (error) {
            console.warn('🔊 Audio initialization failed:', error);
            this.isEnabled = false;
        }
    }

    /**
     * Create placeholder audio using Web Audio API
     * This allows us to test audio integration without external files
     */
    createPlaceholderAudio() {
        console.log('🔊 Creating placeholder audio...');
        
        // Background music - simple looping melody
        this.createBackgroundMusic();
        
        // Sound effects
        this.createSoundEffect('towerPlace', this.createTowerPlaceSound());
        this.createSoundEffect('enemyDeath', this.createEnemyDeathSound());
        this.createSoundEffect('projectileFire', this.createProjectileFireSound());
        this.createSoundEffect('towerUpgrade', this.createTowerUpgradeSound());
        this.createSoundEffect('buttonClick', this.createButtonClickSound());
        this.createSoundEffect('waveStart', this.createWaveStartSound());
        this.createSoundEffect('gameOver', this.createGameOverSound());
        this.createSoundEffect('victory', this.createVictorySound());
        
        console.log('🔊 Placeholder audio created');
    }

    /**
     * Create background music using Web Audio API
     */
    createBackgroundMusic() {
        if (!this.audioContext) return;
        
        try {
            const bufferSize = this.audioContext.sampleRate * 4; // 4 seconds
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            // Create a simple, cheerful melody
            for (let i = 0; i < bufferSize; i++) {
                const t = i / this.audioContext.sampleRate;
                // Simple melody: C-E-G-C pattern
                const note1 = Math.sin(2 * Math.PI * 261.63 * t) * 0.1; // C4
                const note2 = Math.sin(2 * Math.PI * 329.63 * t) * 0.1; // E4
                const note3 = Math.sin(2 * Math.PI * 392.00 * t) * 0.1; // G4
                const note4 = Math.sin(2 * Math.PI * 523.25 * t) * 0.1; // C5
                
                // Mix notes with different timing
                data[i] = note1 * Math.sin(t * 0.5) + 
                         note2 * Math.sin(t * 0.7) + 
                         note3 * Math.sin(t * 0.9) + 
                         note4 * Math.sin(t * 1.1);
            }
            
            this.backgroundMusicBuffer = buffer;
            console.log('🎵 Background music created');
        } catch (error) {
            console.warn('🔊 Could not create background music:', error);
        }
    }

    /**
     * Create tower placement sound
     */
    createTowerPlaceSound() {
        if (!this.audioContext) return null;
        
        try {
            const bufferSize = this.audioContext.sampleRate * 0.3; // 0.3 seconds
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                const t = i / this.audioContext.sampleRate;
                // Rising tone with slight reverb
                const frequency = 400 + (t * 200); // Rising from 400Hz to 600Hz
                data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 3) * 0.3;
            }
            
            return buffer;
        } catch (error) {
            console.warn('🔊 Could not create tower place sound:', error);
            return null;
        }
    }

    /**
     * Create enemy death sound
     */
    createEnemyDeathSound() {
        if (!this.audioContext) return null;
        
        try {
            const bufferSize = this.audioContext.sampleRate * 0.4; // 0.4 seconds
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                const t = i / this.audioContext.sampleRate;
                // Falling tone with noise
                const frequency = 300 - (t * 200); // Falling from 300Hz to 100Hz
                const noise = (Math.random() - 0.5) * 0.1;
                data[i] = (Math.sin(2 * Math.PI * frequency * t) + noise) * Math.exp(-t * 4) * 0.4;
            }
            
            return buffer;
        } catch (error) {
            console.warn('🔊 Could not create enemy death sound:', error);
            return null;
        }
    }

    /**
     * Create projectile fire sound
     */
    createProjectileFireSound() {
        if (!this.audioContext) return null;
        
        try {
            const bufferSize = this.audioContext.sampleRate * 0.2; // 0.2 seconds
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                const t = i / this.audioContext.sampleRate;
                // Quick "whoosh" sound
                const frequency = 800 - (t * 400); // Quick frequency sweep
                data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 8) * 0.2;
            }
            
            return buffer;
        } catch (error) {
            console.warn('🔊 Could not create projectile fire sound:', error);
            return null;
        }
    }

    /**
     * Create tower upgrade sound
     */
    createTowerUpgradeSound() {
        if (!this.audioContext) return null;
        
        try {
            const bufferSize = this.audioContext.sampleRate * 0.5; // 0.5 seconds
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                const t = i / this.audioContext.sampleRate;
                // Rising chord progression
                const note1 = Math.sin(2 * Math.PI * 440 * t) * 0.1; // A4
                const note2 = Math.sin(2 * Math.PI * 554.37 * t) * 0.1; // C#5
                const note3 = Math.sin(2 * Math.PI * 659.25 * t) * 0.1; // E5
                data[i] = (note1 + note2 + note3) * Math.exp(-t * 2) * 0.3;
            }
            
            return buffer;
        } catch (error) {
            console.warn('🔊 Could not create tower upgrade sound:', error);
            return null;
        }
    }

    /**
     * Create button click sound
     */
    createButtonClickSound() {
        if (!this.audioContext) return null;
        
        try {
            const bufferSize = this.audioContext.sampleRate * 0.1; // 0.1 seconds
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                const t = i / this.audioContext.sampleRate;
                // Quick click sound
                const frequency = 1000;
                data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 20) * 0.2;
            }
            
            return buffer;
        } catch (error) {
            console.warn('🔊 Could not create button click sound:', error);
            return null;
        }
    }

    /**
     * Create wave start sound
     */
    createWaveStartSound() {
        if (!this.audioContext) return null;
        
        try {
            const bufferSize = this.audioContext.sampleRate * 0.8; // 0.8 seconds
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                const t = i / this.audioContext.sampleRate;
                // Fanfare-like sound
                const frequency = 200 + Math.sin(t * 10) * 50;
                data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 1.5) * 0.4;
            }
            
            return buffer;
        } catch (error) {
            console.warn('🔊 Could not create wave start sound:', error);
            return null;
        }
    }

    /**
     * Create game over sound
     */
    createGameOverSound() {
        if (!this.audioContext) return null;
        
        try {
            const bufferSize = this.audioContext.sampleRate * 1.0; // 1.0 seconds
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                const t = i / this.audioContext.sampleRate;
                // Sad descending tone
                const frequency = 300 - (t * 200); // Falling from 300Hz to 100Hz
                data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 1) * 0.5;
            }
            
            return buffer;
        } catch (error) {
            console.warn('🔊 Could not create game over sound:', error);
            return null;
        }
    }

    /**
     * Create victory sound
     */
    createVictorySound() {
        if (!this.audioContext) return null;
        
        try {
            const bufferSize = this.audioContext.sampleRate * 1.5; // 1.5 seconds
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                const t = i / this.audioContext.sampleRate;
                // Triumphant ascending melody
                const frequency = 200 + (t * 300); // Rising from 200Hz to 500Hz
                data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 0.8) * 0.4;
            }
            
            return buffer;
        } catch (error) {
            console.warn('🔊 Could not create victory sound:', error);
            return null;
        }
    }

    /**
     * Create a sound effect from buffer
     */
    createSoundEffect(name, buffer) {
        if (buffer) {
            this.sounds[name] = buffer;
            console.log(`🔊 Created sound effect: ${name}`);
        }
    }

    /**
     * Play background music
     */
    playBackgroundMusic() {
        if (!this.isEnabled || !this.backgroundMusicBuffer || !this.audioContext) return;
        
        try {
            // Resume AudioContext if suspended
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().catch(error => {
                    console.warn('🔊 Could not resume AudioContext:', error);
                    return;
                });
            }
            
            const source = this.audioContext.createBufferSource();
            source.buffer = this.backgroundMusicBuffer;
            source.loop = true;
            
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = this.masterVolume * this.musicVolume;
            
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            source.start();
            this.backgroundMusic = source;
            
            console.log('🎵 Background music started');
        } catch (error) {
            console.warn('🔊 Could not play background music:', error);
        }
    }

    /**
     * Play a sound effect
     */
    playSound(soundName, volume = 1.0) {
        if (!this.isEnabled || !this.sounds[soundName] || !this.audioContext) return;
        
        try {
            // Resume AudioContext if suspended
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().catch(error => {
                    console.warn('🔊 Could not resume AudioContext:', error);
                    return;
                });
            }
            
            const source = this.audioContext.createBufferSource();
            source.buffer = this.sounds[soundName];
            
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = this.masterVolume * this.sfxVolume * volume;
            
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            source.start();
            
            console.log(`🔊 Playing sound: ${soundName}`);
        } catch (error) {
            console.warn(`🔊 Could not play sound ${soundName}:`, error);
        }
    }

    /**
     * Stop background music
     */
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            try {
                this.backgroundMusic.stop();
                this.backgroundMusic = null;
                console.log('🎵 Background music stopped');
            } catch (error) {
                console.warn('🔊 Could not stop background music:', error);
            }
        }
    }

    /**
     * Toggle audio on/off
     */
    toggleAudio() {
        this.isEnabled = !this.isEnabled;
        
        // Update registry so other scenes can access the state
        this.scene.game.registry.set('audioEnabled', this.isEnabled);
        
        if (this.isEnabled) {
            this.playBackgroundMusic();
            console.log('🔊 Audio enabled');
        } else {
            this.stopBackgroundMusic();
            console.log('🔊 Audio disabled');
        }
        
        return this.isEnabled;
    }

    /**
     * Get current audio enabled state
     */
    isAudioEnabled() {
        return this.isEnabled;
    }

    /**
     * Set master volume
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        console.log(`🔊 Master volume set to: ${this.masterVolume}`);
    }

    /**
     * Set music volume
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        console.log(`🔊 Music volume set to: ${this.musicVolume}`);
    }

    /**
     * Set SFX volume
     */
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        console.log(`🔊 SFX volume set to: ${this.sfxVolume}`);
    }

    /**
     * Resume AudioContext if suspended (needed for user interaction)
     */
    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            return this.audioContext.resume().then(() => {
                console.log('🔊 AudioContext resumed');
            }).catch(error => {
                console.warn('🔊 Could not resume AudioContext:', error);
            });
        }
        return Promise.resolve();
    }

    /**
     * Get current audio state
     */
    getAudioState() {
        return {
            enabled: this.isEnabled,
            masterVolume: this.masterVolume,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            contextState: this.audioContext ? this.audioContext.state : 'not-initialized'
        };
    }
}

export default AudioManager;
