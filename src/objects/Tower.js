import { TOWERS } from '../data/towers.js';
import { TILE_SIZE } from '../data/path.js';
import Projectile from './Projectile.js';
import { getTowerSellValue } from '../utils/towerCalculations.js';

class Tower extends Phaser.GameObjects.Container {
    constructor(scene, x, y, towerType) {
        console.log(`Creating Tower: type=${towerType}, position=(${x}, ${y})`);
        
        try {
            super(scene, x, y);

            console.log('Tower constructor: scene after super:', this.scene);

            this.towerType = towerType;
            this.level = 1;
            this.towerData = TOWERS[towerType];
            
            if (!this.towerData) {
                throw new Error(`Tower data not found for type: ${towerType}`);
            }
            
            this.currentStats = this.towerData.levels[this.level - 1];
            console.log(`Tower stats:`, this.currentStats);

            // Create tower sprite
            this.towerSprite = scene.add.image(0, 0, `tower_${towerType}`);
            this.add(this.towerSprite);
            console.log('Tower sprite created');

            // Set container size to match the sprite for proper interaction
            // Use default size if sprite dimensions aren't available yet
            const spriteWidth = this.towerSprite.width || 32;
            const spriteHeight = this.towerSprite.height || 32;
            this.setSize(spriteWidth, spriteHeight);
            console.log(`Tower container size set: ${spriteWidth}x${spriteHeight}`);

            // Make tower interactive for dragging (after sprite is added and size is set)
            this.setInteractive();
            console.log('Tower made interactive');

            // Tower properties
            this.lastFired = 0;
            this.currentTarget = null;
            this.targetingMode = this.towerData.targetingModes[0];

            // Set depth so towers appear above path tiles but below projectiles
            this.setDepth(35);

        // Add to scene
        scene.add.existing(this);

        // Create level indicator
        this.createLevelIndicator();

        // Fallback: try again after a short delay if creation failed
        scene.time.delayedCall(100, () => {
            if (!this.levelText || !this.levelText.active) {
                this.createLevelIndicator();
            }
        });

        // Set up update loop
        scene.events.on('update', this.update, this);

        // Physics body for range detection
        this.rangeCircle = scene.add.circle(x, y, this.currentStats.range * TILE_SIZE);
        this.rangeCircle.setStrokeStyle(2, 0x00ff00, 0.3);
        this.rangeCircle.setVisible(false); // Hide by default
        this.rangeCircle.setDepth(20); // Above path tiles but below projectiles
        console.log('Range circle created');

        // Set up update loop
        scene.events.on('update', this.update, this);
        console.log('Tower constructor completed successfully');
            
        } catch (error) {
            console.error('Error in Tower constructor:', error);
            console.error('Stack trace:', error.stack);
            throw error; // Re-throw to be caught by caller
        }
    }

    createLevelIndicator() {
        // Ensure scene is available
        if (!this.scene) {
            console.error('❌ Tower.createLevelIndicator: scene not available!');
            return;
        }

        try {
            // Debug level value
            console.log(`🎯 createLevelIndicator() called for ${this.towerType}`);
            console.log(`🎯 Creating indicator for level: ${this.level}`);
            console.log(`🎯 Level type: ${typeof this.level}`);
            console.log(`🎯 Level value:`, this.level);

            // Create level text above the tower (local coordinates for container)
            const levelStr = this.level === 3 ? 'L3' : `L${this.level}`;
            console.log(`🎯 Level string to display: "${levelStr}"`);

            console.log(`🎨 Creating level indicator: "${levelStr}" at (${this.x}, ${this.y - 35})`);

            // Remove any existing level indicator first
            if (this.levelText) {
                console.log(`🎨 Destroying existing levelText: "${this.levelText.text}"`);
                this.levelText.destroy();
                this.levelText = null;
            }

            this.levelText = this.scene.add.text(0, -35, levelStr, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '16px',
                fontStyle: 'bold',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            });

            console.log(`🎯 Text object created:`, this.levelText);
            console.log(`🎯 Initial text content: "${this.levelText.text}"`);

            // Make sure it's properly configured
            this.levelText.setOrigin(0.5);
            this.levelText.setDepth(100); // Very high depth to ensure visibility
            this.levelText.setScrollFactor(1); // Ensure it follows camera
            this.levelText.setVisible(true);
            this.levelText.setAlpha(1.0);

            // Add to tower container (local positioning)
            console.log(`🔗 About to add levelText to tower container...`);
            console.log(`🔗 this (tower) type: ${this.type}`);
            console.log(`🔗 this.add exists: ${typeof this.add === 'function'}`);
            console.log(`🔗 levelText exists: ${!!this.levelText}`);

            this.add(this.levelText);

            console.log(`✅ Level indicator created successfully`);
            console.log(`✅ Final text content: "${this.levelText.text}"`);
            console.log(`✅ Text parent:`, this.levelText.parent);
            console.log(`✅ Tower container:`, this);
            console.log(`✅ Text is child of tower: ${this.levelText.parent === this}`);
            console.log(`✅ Tower children count: ${this.list ? this.list.length : 'no list'}`);

        } catch (error) {
            console.error('❌ Error creating level indicator:', error);
            console.error('❌ Stack:', error.stack);
        }
    }

    updateLevelIndicator() {
        try {
            console.log(`📊 updateLevelIndicator CALLED: ${this.towerType} level=${this.level}`);
            console.log(`📊 Scene available: ${!!this.scene}`);

            // Always destroy and recreate the level indicator to ensure it updates
            if (this.levelText) {
                console.log(`📊 Destroying existing levelText: "${this.levelText.text}"`);
                this.levelText.destroy();
                this.levelText = null;
            } else {
                console.log(`📊 No existing levelText to destroy`);
            }

            // Create new level indicator
            console.log(`📊 Creating new level indicator for level ${this.level}`);
            this.createLevelIndicator();

            console.log(`📊 updateLevelIndicator complete`);
        } catch (error) {
            console.error(`❌ ERROR in updateLevelIndicator:`, error);
            console.error(`❌ Stack:`, error.stack);
        }
    }

    debugLevelIndicator() {
        console.log(`🔍 ${this.towerType}: L${this.level} - ${this.levelText ? `"${this.levelText.text}"` : 'MISSING'}`);
    }

    forceRecreateLevelIndicator() {
        console.log(`🔧 Force recreating level indicator for ${this.towerType}`);
        this.levelText = null; // Force destruction of any existing one
        this.createLevelIndicator();
    }


    createUpgradeEffect() {
        if (!this.scene) return;
        const particleCount = 8 + (this.level * 4); // More particles for higher levels

        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = 20 + (this.level * 10); // Larger radius for higher levels
            const targetX = this.x + Math.cos(angle) * distance;
            const targetY = this.y + Math.sin(angle) * distance;

            // Create particle
            const particle = this.scene.add.circle(this.x, this.y, 3 + this.level, 0xFFFF00, 0.8);
            particle.setDepth(45);

            // Animate particle outward
            this.scene.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                alpha: 0,
                scale: 0.5,
                duration: 600 + (this.level * 100),
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }

        // Add a central flash effect
        const flash = this.scene.add.circle(this.x, this.y, 30 + (this.level * 10), 0xFFFFFF, 0.6);
        flash.setDepth(45);
        this.scene.tweens.add({
            targets: flash,
            scale: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => flash.destroy()
        });
    }

    update(time, delta) {
        try {
            if (!this.active) return;

            // Ensure level indicator is positioned correctly and visible
            if (this.levelText && this.levelText.active) {
                // Ensure it's still visible
                if (!this.levelText.visible) {
                    this.levelText.setVisible(true);
                }
            } else if (!this.levelText) {
                // Fallback: create level indicator if it's missing
                this.createLevelIndicator();
            }

            // Find target if needed
            if (!this.currentTarget || !this.currentTarget.active) {
                this.findTarget();
            }

            // Fire at target if possible
            if (this.currentTarget && this.currentTarget.active) {
                this.tryFire(time);
            }
        } catch (error) {
            console.error(`Error in Tower update for ${this.towerType}:`, error);
            console.error('Stack trace:', error.stack);
            // Disable this tower to prevent repeated errors
            this.active = false;
        }
    }

    findTarget() {
        try {
            // Get all enemies in range
            const enemies = this.scene.spawner.getEnemies().getChildren();
            const inRangeEnemies = enemies.filter(enemy => {
                const distance = Phaser.Math.Distance.Between(
                    this.x, this.y,
                    enemy.x, enemy.y
                );
                return distance <= this.currentStats.range * TILE_SIZE;
            });

            if (inRangeEnemies.length === 0) {
                this.currentTarget = null;
                return;
            }

            // Select target based on targeting mode
            switch (this.targetingMode) {
                case 'first':
                    this.currentTarget = this.getFirstEnemy(inRangeEnemies);
                    break;
                case 'last':
                    this.currentTarget = this.getLastEnemy(inRangeEnemies);
                    break;
                case 'close':
                    this.currentTarget = this.getClosestEnemy(inRangeEnemies);
                    break;
                case 'strong':
                    this.currentTarget = this.getStrongestEnemy(inRangeEnemies);
                    break;
                default:
                    this.currentTarget = inRangeEnemies[0];
            }

            if (this.currentTarget) {
                // console.log(`${this.towerType} tower targeting enemy at (${this.currentTarget.x.toFixed(0)}, ${this.currentTarget.y.toFixed(0)})`);
            }
        } catch (error) {
            console.error(`Error in Tower findTarget for ${this.towerType}:`, error);
            console.error('Stack trace:', error.stack);
            this.currentTarget = null;
        }
    }

    getFirstEnemy(enemies) {
        // Enemy closest to goal (highest waypoint index)
        return enemies.reduce((first, enemy) => {
            return enemy.waypointIndex > first.waypointIndex ? enemy : first;
        });
    }

    getLastEnemy(enemies) {
        // Enemy furthest from goal (lowest waypoint index)
        return enemies.reduce((last, enemy) => {
            return enemy.waypointIndex < last.waypointIndex ? enemy : last;
        });
    }

    getClosestEnemy(enemies) {
        return enemies.reduce((closest, enemy) => {
            const closestDist = Phaser.Math.Distance.Between(this.x, this.y, closest.x, closest.y);
            const enemyDist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            return enemyDist < closestDist ? enemy : closest;
        });
    }

    getStrongestEnemy(enemies) {
        return enemies.reduce((strongest, enemy) => {
            return enemy.hp > strongest.hp ? enemy : strongest;
        });
    }

    tryFire(time) {
        try {
            const timeSinceLastFire = time - this.lastFired;
            const fireRateMs = this.currentStats.fireRate * 1000;

            if (timeSinceLastFire >= fireRateMs) {
                // console.log(`${this.towerType} tower firing at ${this.currentTarget.enemyData.name}`);
                this.fire();
                this.lastFired = time;
            }
        } catch (error) {
            console.error(`Error in Tower tryFire for ${this.towerType}:`, error);
            console.error('Stack trace:', error.stack);
        }
    }

    fire() {
        // console.log(`🏹 Tower ${this.towerType} firing at (${this.currentTarget.x}, ${this.currentTarget.y})`);

        // Create projectile with tower level for visual effects
        const projectile = new Projectile(
            this.scene,
            this.x, this.y,
            this.towerType,
            this.currentTarget,
            this.currentStats.dmg,
            this.towerData.projectileSpeed * TILE_SIZE,
            this.level // Pass tower level for visual effects
        );

        // console.log(`🏹 Projectile created for ${this.towerType}`);

        // Add special effects based on tower type
        if (this.towerType === 'frost') {
            projectile.slowEffect = {
                percent: this.towerData.slowPct[this.level - 1],
                duration: this.towerData.slowDur[this.level - 1]
            };
        } else if (this.towerType === 'cannon') {
            projectile.splashRadius = this.towerData.splashRadius[this.level - 1] * TILE_SIZE;
        }

        // Add muzzle flash effect
        this.createMuzzleFlash();
    }

    createMuzzleFlash() {
        const flash = this.scene.add.circle(this.x, this.y, 10, 0xffffff, 0.8);
        this.scene.tweens.add({
            targets: flash,
            scale: 0,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy()
        });
    }

    upgrade() {
        console.log(`🚀 EXISTING UPGRADE METHOD CALLED: ${this.towerType} L${this.level} → L${this.level + 1}`);

        if (this.level >= 3) return false;

        const oldLevel = this.level;
        this.level++;
        this.currentStats = this.towerData.levels[this.level - 1];

        console.log(`✅ Level incremented: L${oldLevel} → L${this.level}`);
        console.log(`✅ Stats updated for level ${this.level}`);

        // Update range circle
        this.rangeCircle.setRadius(this.currentStats.range * TILE_SIZE);

        // CRITICAL: Update level indicator text
        console.log(`🔄 Calling updateLevelIndicator() for level ${this.level}...`);
        this.updateLevelIndicator();

        // Visual upgrade effect
        this.scene.tweens.add({
            targets: this.towerSprite,
            scale: 1.2,
            duration: 200,
            yoyo: true
        });

        console.log(`✅ Upgrade completed successfully!`);
        return true;
    }

    setTargetingMode(mode) {
        if (this.towerData.targetingModes.includes(mode)) {
            this.targetingMode = mode;
        }
    }

    // ✅ REMOVED: Duplicate getSellValue - now using centralized version from utils/towerCalculations.js
    getSellValue() {
        return getTowerSellValue(this);
    }

    destroy() {
        try {
            // Clean up range circle
            if (this.rangeCircle && this.rangeCircle.active) {
                this.rangeCircle.destroy();
                this.rangeCircle = null;
            }

            // Clean up level text
            if (this.levelText && this.levelText.active) {
                this.levelText.destroy();
                this.levelText = null;
            }

            // Safely remove event listener
            if (this.scene && this.scene.events) {
                this.scene.events.off('update', this.update, this);
            }
        } catch (error) {
            // Silently handle destruction errors during scene cleanup
            console.warn('Tower destroy error (likely during scene cleanup):', error.message);
        }

        super.destroy();
    }
}

export default Tower;
