import { WAYPOINTS, TILE_SIZE, gridToWorld } from '../data/path.js';

class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, type, enemyData, hp, waveNumber) {
        // console.log(`Creating Enemy: ${type}, scene:`, scene);

        // Get spawn position
        const spawnPos = gridToWorld(WAYPOINTS[0].x, WAYPOINTS[0].y);
        super(scene, spawnPos.x, spawnPos.y, `enemy_${type}`);

        this.type = type;
        this.enemyData = enemyData;
        this.maxHP = hp;
        this.hp = hp;
        this.waveNumber = waveNumber;
        this.gameSpeed = 1;

        // Store scene reference explicitly
        this.gameScene = scene;
        // console.log(`Enemy ${type}: scene stored:`, !!this.gameScene);
        // console.log(`Enemy ${type}: scene tweens:`, this.gameScene?.tweens);

        // Path following
        this.waypointIndex = 0;
        this.path = WAYPOINTS.map(point => gridToWorld(point.x, point.y));

        // Movement
        this.speed = enemyData.speed * TILE_SIZE; // pixels per second
        this.baseSpeed = this.speed;

        // Status effects
        this.slowEffects = [];
        this.slowImmuneTime = enemyData.slowImmuneFirst || 0;
        this.slowImmuneTimer = enemyData.slowImmuneFirst || 0;

        // Initialize
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Set depth so enemies appear above path tiles but below projectiles
        this.setDepth(40);

        // Configure physics
        this.setCollideWorldBounds(false);
        this.setImmovable(false);

        // Create HP bar
        this.createHPBar();

        // Start moving
        this.moveToNextWaypoint();
    }

    createHPBar() {
        // HP bar background
        this.hpBarBg = this.gameScene.add.graphics();
        this.hpBarBg.fillStyle(0x000000);
        this.hpBarBg.fillRect(-15, -25, 30, 4);

        // HP bar foreground
        this.hpBar = this.gameScene.add.graphics();
        this.updateHPBar();
    }

    updateHPBar() {
        this.hpBar.clear();

        if (this.hp <= 0) return;

        const hpPercent = this.hp / this.maxHP;
        const color = hpPercent > 0.5 ? 0x00ff00 : hpPercent > 0.25 ? 0xffff00 : 0xff0000;

        this.hpBar.fillStyle(color);
        this.hpBar.fillRect(-15, -25, 30 * hpPercent, 4);
    }

    moveToNextWaypoint() {
        // console.log(`Enemy ${this.type}: moveToNextWaypoint called, waypoint: ${this.waypointIndex}/${this.path.length}`);
        // console.log(`Enemy ${this.type}: gameScene exists: ${!!this.gameScene}`);
        // console.log(`Enemy ${this.type}: tweens exists: ${!!this.gameScene?.tweens}`);

        if (this.waypointIndex >= this.path.length) {
            // Reached the end - leak!
            // console.log(`Enemy ${this.type}: reached end of path, leaking`);
            this.emit('leaked');
            this.destroy();
            return;
        }

        const target = this.path[this.waypointIndex];
        const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
        const duration = (distance / this.speed) * 1000; // milliseconds

        // console.log(`Enemy ${this.type}: moving to waypoint ${this.waypointIndex}, distance: ${distance.toFixed(2)}, duration: ${duration.toFixed(2)}ms`);

        // Move to waypoint
        if (!this.gameScene || !this.gameScene.tweens) {
            console.error(`Enemy ${this.type}: Scene or tweens not available for enemy movement!`);
            console.error(`gameScene: ${this.gameScene}, tweens: ${this.gameScene?.tweens}`);
            return;
        }

        this.gameScene.tweens.add({
            targets: this,
            x: target.x,
            y: target.y,
            duration: duration / this.gameSpeed,
            ease: 'Linear',
            onComplete: () => {
                this.waypointIndex++;
                this.moveToNextWaypoint();
            }
        });
    }

    takeDamage(damage, damageType = 'normal', isSplash = false) {
        // Apply damage modifiers
        let actualDamage = damage;

        // Arrow damage modifier
        if (damageType === 'arrow' && this.enemyData.dmgTakenMods?.arrow) {
            actualDamage *= (1 + this.enemyData.dmgTakenMods.arrow);
        }

        // Splash resistance
        if (isSplash && this.enemyData.splashRes) {
            actualDamage *= (1 + this.enemyData.splashRes);
        }

        this.hp -= actualDamage;
        this.updateHPBar();

        // Create damage number popup
        this.showDamageNumber(actualDamage);

        if (this.hp <= 0) {
            this.die();
        }
    }

    applySlow(percent, duration) {
        // Check slow immunity
        if (this.slowImmuneTimer > 0) {
            return;
        }

        // Create slow effect
        const slowEffect = {
            percent: percent,
            duration: duration,
            timer: duration
        };

        this.slowEffects.push(slowEffect);
        this.updateSpeed();
    }

    updateSlowEffects(delta) {
        // Update slow immunity
        if (this.slowImmuneTimer > 0) {
            this.slowImmuneTimer -= delta / 1000;
        }

        // Update active slow effects
        this.slowEffects = this.slowEffects.filter(effect => {
            effect.timer -= delta / 1000;
            return effect.timer > 0;
        });

        // Update speed if slow effects changed
        const oldSpeed = this.speed;
        this.updateSpeed();

        if (this.speed !== oldSpeed) {
            // Recalculate movement if speed changed
            this.recalculateMovement();
        }
    }

    updateSpeed() {
        if (this.slowEffects.length === 0) {
            this.speed = this.baseSpeed;
            return;
        }

        // Use the strongest slow effect
        const maxSlow = Math.max(...this.slowEffects.map(effect => effect.percent));
        this.speed = this.baseSpeed * (1 - maxSlow);
    }

    recalculateMovement() {
        // Stop current tween
        if (this.gameScene && this.gameScene.tweens) {
            this.gameScene.tweens.killTweensOf(this);
        }

        // Restart movement to current waypoint
        if (this.waypointIndex < this.path.length) {
            this.moveToNextWaypoint();
        }
    }

    showDamageNumber(damage) {
        if (!this.gameScene) return;

        const damageText = this.gameScene.add.text(this.x, this.y - 20, damage.toString(), {
            font: '16px Arial',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 2
        });
        damageText.setOrigin(0.5);

        // Animate damage number
        this.gameScene.tweens.add({
            targets: damageText,
            y: damageText.y - 30,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                damageText.destroy();
            }
        });
    }

    die() {
        // Create better particle death effect - enemy breaks into pieces
        if (this.gameScene) {
            const enemyColor = this.enemyType === 'boss' ? 0x8B4513 : 0xFF0000; // Brown for boss, red for others

            // Create 8-12 smaller fragments that break apart
            const fragmentCount = this.enemyType === 'boss' ? 12 : 8;

            for (let i = 0; i < fragmentCount; i++) {
                const angle = (i / fragmentCount) * Math.PI * 2;
                const speed = 50 + Math.random() * 100; // Random speed
                const size = 1 + Math.random() * 3; // Random size 1-4

                // Create fragment
                const fragment = this.gameScene.add.circle(this.x, this.y, size, enemyColor, 0.9);
                fragment.setDepth(45);

                // Calculate trajectory
                const targetX = this.x + Math.cos(angle) * speed * 2;
                const targetY = this.y + Math.sin(angle) * speed * 2;

                // Animate fragment
                this.gameScene.tweens.add({
                    targets: fragment,
                    x: targetX,
                    y: targetY,
                    alpha: 0,
                    scale: size * 0.3,
                    duration: 600 + Math.random() * 400,
                    ease: 'Power2',
                    onComplete: () => fragment.destroy()
                });
            }

            // Add a small explosion flash
            const flash = this.gameScene.add.circle(this.x, this.y, 8, 0xFFFFFF, 0.7);
            flash.setDepth(46);
            this.gameScene.tweens.add({
                targets: flash,
                scale: 3,
                alpha: 0,
                duration: 200,
                onComplete: () => flash.destroy()
            });

            // Add a subtle smoke puff
            for (let i = 0; i < 3; i++) {
                this.gameScene.time.delayedCall(i * 100, () => {
                    const smoke = this.gameScene.add.circle(
                        this.x + (Math.random() - 0.5) * 20,
                        this.y + (Math.random() - 0.5) * 20,
                        4 + Math.random() * 4,
                        0x666666,
                        0.4
                    );
                    smoke.setDepth(44);
                    this.gameScene.tweens.add({
                        targets: smoke,
                        y: smoke.y - 20 - Math.random() * 10,
                        alpha: 0,
                        scale: 0.5,
                        duration: 800,
                        onComplete: () => smoke.destroy()
                    });
                });
            }
        }

        this.emit('died');
        this.destroy();
    }


    setGameSpeed(speed) {
        this.gameSpeed = speed;
        this.recalculateMovement();
    }

    pause() {
        if (this.gameScene && this.gameScene.tweens) {
            this.gameScene.tweens.pauseAll();
        }
    }

    resume() {
        if (this.gameScene && this.gameScene.tweens) {
            this.gameScene.tweens.resumeAll();
        }
    }

    update(time, delta) {
        // Update HP bar position
        if (this.hpBarBg && this.hpBar) {
            this.hpBarBg.setPosition(this.x, this.y);
            this.hpBar.setPosition(this.x, this.y);
        }

        // Update slow effects
        this.updateSlowEffects(delta);
    }

    destroy() {
        try {
            // Clean up HP bars
            if (this.hpBarBg && this.hpBarBg.active) {
                this.hpBarBg.destroy();
                this.hpBarBg = null;
            }
            if (this.hpBar && this.hpBar.active) {
                this.hpBar.destroy();
                this.hpBar = null;
            }
        } catch (error) {
            // Silently handle destruction errors during scene cleanup
            console.warn('Enemy destroy error (likely during scene cleanup):', error.message);
        }

        super.destroy();
    }
}

export default Enemy;
