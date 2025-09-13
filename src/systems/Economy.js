import { ECON } from '../data/waves.js';

class Economy {
    constructor(scene) {
        this.scene = scene;
        this.reset();
    }

    reset() {
        this.gold = ECON.startGold;
        this.lives = ECON.lives;
        this.currentWave = 1;
        this.score = 0;
        this.totalKills = 0;
    }

    // Gold management
    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            this.updateUI();
            return true;
        }
        return false;
    }

    addGold(amount) {
        this.gold += amount;
        this.updateUI();
    }

    // Lives management
    loseLives(amount) {
        this.lives -= amount;
        this.updateUI();

        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    // Wave progression
    advanceWave() {
        const waveBonus = ECON.waveBonus(this.currentWave);
        this.addGold(waveBonus);
        this.score += waveBonus * 10; // Score bonus for completing waves
        this.currentWave++;
        this.updateUI();
    }

    // Enemy defeat rewards
    onEnemyDefeated(enemyType, enemyData) {
        this.addGold(enemyData.killGold);
        this.score += enemyData.killGold * 5;
        this.totalKills++;
        this.updateUI();
    }

    // Tower transactions
    getTowerCost(towerType) {
        // This will be implemented when we create towers
        return 0;
    }

    sellTower(towerType, level) {
        // This will be implemented when we create towers
        return 0;
    }

    // Final score calculation
    calculateFinalScore(remainingLives, unusedGold) {
        return this.score + (remainingLives * 5) + (unusedGold * 2);
    }

    // Game over
    gameOver() {
        const finalScore = this.calculateFinalScore(this.lives, this.gold);

        // Emit game over event to UI scene
        this.scene.events.emit('gameOver', {
            won: false, // This is a defeat
            score: finalScore,
            wave: this.currentWave - 1,
            kills: this.totalKills,
            gold: this.gold,
            lives: this.lives
        });
    }

    // UI updates
    updateUI() {
        // Emit economy update to UI scene
        this.scene.events.emit('economyUpdate', {
            gold: this.gold,
            lives: this.lives,
            wave: this.currentWave,
            score: this.score
        });
    }

    // Getters
    getGold() { return this.gold; }
    getLives() { return this.lives; }
    getCurrentWave() { return this.currentWave; }
    getScore() { return this.score; }
    getKills() { return this.totalKills; }
}

export default Economy;
