import { WAVES, ECON, DEBUG, getTotalWaves, getWaveInfo } from '../data/waves.js';
import { ENEMIES, getScaledHP } from '../data/enemies.js';
import Enemy from '../objects/Enemy.js';

class Spawner {
    constructor(scene, economy) {
        this.scene = scene;
        this.economy = economy;
        this.enemies = scene.physics.add.group();
        this.activeSpawns = [];
        this.isSpawning = false;
        this.gameSpeed = 1;
        this.audioManager = null;
    }

    setAudioManager(audioManager) {
        this.audioManager = audioManager;
    }

    startWave(waveNumber) {
        console.log(`🎲 Spawner: startWave(${waveNumber}) called. Total waves: ${getTotalWaves()}, DEBUG.maxWaves: ${DEBUG.maxWaves}`);

        if (waveNumber > getTotalWaves()) {
            // Game won!
            console.log('🎉 Spawner: VICTORY! All waves completed!');
            console.log(`🎉 Wave ${waveNumber} > ${getTotalWaves()} - triggering win condition`);
            this.scene.events.emit('gameWon');
            return;
        }

        const waveData = getWaveInfo(waveNumber);
        if (!waveData) {
            // console.log('Spawner: No wave data found');
            return;
        }

        this.isSpawning = true;
        this.currentWave = waveNumber;
        this.spawnIndex = 0;

        // Play wave start sound
        if (this.audioManager) {
            this.audioManager.playSound('waveStart');
        }

        // console.log(`Spawner: Starting wave ${waveNumber} with ${waveData.entries.length} entries`);

        // Start spawning entries
        this.spawnNextEntry(waveData);

        // Emit wave start event
        this.scene.events.emit('waveStarted', waveNumber);
    }

    spawnNextEntry(waveData) {
        if (this.spawnIndex >= waveData.entries.length) {
            // All entries spawned for this wave
            this.checkWaveComplete();
            return;
        }

        const entry = waveData.entries[this.spawnIndex];
        const enemyData = ENEMIES[entry.type];

        if (!enemyData) {
            console.error(`Unknown enemy type: ${entry.type}`);
            this.spawnIndex++;
            this.spawnNextEntry(waveData);
            return;
        }

        // Spawn enemies for this entry
        this.spawnEnemyGroup(entry, () => {
            this.spawnIndex++;
            this.spawnNextEntry(waveData);
        });
    }

    spawnEnemyGroup(entry, onComplete) {
        let spawnedCount = 0;
        const enemyData = ENEMIES[entry.type];
        const scaledHP = getScaledHP(entry.type, this.currentWave);

        const spawnEnemy = () => {
            if (spawnedCount >= entry.count) {
                onComplete();
                return;
            }

            // Create enemy
            // console.log(`Spawner: Creating enemy ${entry.type}, scene:`, this.scene);
            const enemy = new Enemy(
                this.scene,
                entry.type,
                enemyData,
                scaledHP,
                this.currentWave
            );

            this.enemies.add(enemy);

            // Track this enemy for wave completion
            this.activeSpawns.push(enemy);

            // Listen for enemy death or leak
            enemy.on('died', () => {
                this.onEnemyDied(enemy);
            });

            enemy.on('leaked', () => {
                this.onEnemyLeaked(enemy);
            });

            spawnedCount++;

            // Schedule next spawn in this group
            const gap = entry.gap || 0.7; // default spawn gap
            this.scene.time.delayedCall(gap * 1000 / this.gameSpeed, spawnEnemy);
        };

        // Start spawning the first enemy
        spawnEnemy();
    }

    onEnemyDied(enemy) {
        // Remove from active spawns
        const index = this.activeSpawns.indexOf(enemy);
        if (index > -1) {
            this.activeSpawns.splice(index, 1);
        }

        // Play enemy death sound
        if (this.audioManager) {
            this.audioManager.playSound('enemyDeath');
        }

        // Reward gold
        this.economy.onEnemyDefeated(enemy.type, enemy.enemyData);

        // Check if wave is complete
        this.checkWaveComplete();
    }

    onEnemyLeaked(enemy) {
        // Remove from active spawns
        const index = this.activeSpawns.indexOf(enemy);
        if (index > -1) {
            this.activeSpawns.splice(index, 1);
        }

        // Damage player
        this.economy.loseLives(enemy.enemyData.leakDamage);

        // Check if wave is complete
        this.checkWaveComplete();
    }

    checkWaveComplete() {
        // Wave is complete when all enemies are spawned AND all active enemies are dead/leaked
        if (this.isSpawning && this.activeSpawns.length === 0) {
            this.isSpawning = false;

            // Start next wave after inter-wave delay (or instantly in debug mode)
            const delay = DEBUG.enabled && DEBUG.instantWaves ? 0 : ECON.interWaveTime / this.gameSpeed;
            this.scene.time.delayedCall(delay, () => {
                this.economy.advanceWave();
                this.startWave(this.currentWave + 1);
            });

            // Emit wave complete event
            this.scene.events.emit('waveCompleted', this.currentWave);
        }
    }

    skipInterWaveTime() {
        // Cancel the inter-wave timer and give bonus gold
        this.economy.addGold(ECON.skipWaveBonus);

        // Advance immediately
        this.economy.advanceWave();
        this.startWave(this.currentWave + 1);
    }

    setGameSpeed(speed) {
        this.gameSpeed = speed;

        // Update all active enemies
        this.enemies.getChildren().forEach(enemy => {
            enemy.setGameSpeed(speed);
        });
    }

    pause() {
        this.enemies.getChildren().forEach(enemy => {
            enemy.pause();
        });
    }

    resume() {
        this.enemies.getChildren().forEach(enemy => {
            enemy.resume();
        });
    }

    getEnemies() {
        return this.enemies;
    }

    getActiveEnemyCount() {
        return this.activeSpawns.length;
    }

    isWaveActive() {
        return this.isSpawning || this.activeSpawns.length > 0;
    }
}

export default Spawner;
