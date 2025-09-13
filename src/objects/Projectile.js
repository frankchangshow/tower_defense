class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, towerType, target, damage, speed, towerLevel = 1) {
        const textureKey = `proj_${towerType}`;

        // Check if texture exists, if not use a fallback
        if (!scene.textures.exists(textureKey)) {
            console.warn(`⚠️ Texture ${textureKey} not found! Using fallback.`);
            // Create a simple colored rectangle as fallback
            const graphics = scene.add.graphics();
            graphics.fillStyle(towerType === 'arrow' ? 0xFF6B35 : towerType === 'cannon' ? 0xFFD700 : 0x00BFFF);
            graphics.fillRect(0, 0, 8, 16);
            graphics.generateTexture(textureKey, 8, 16);
            graphics.destroy();
        }

        super(scene, x, y, textureKey);

        // console.log(`🚀 Creating projectile: ${towerType} at (${x}, ${y})`);
        // console.log(`🚀 Texture key: ${textureKey}, exists: ${scene.textures.exists(textureKey)}`);

        this.towerType = towerType;
        this.target = target;
        this.damage = damage;
        this.speed = speed;
        this.towerLevel = towerLevel; // Store tower level for visual effects

        // Special effects
        this.slowEffect = null; // For frost towers
        this.splashRadius = 0; // For cannon towers

        // Apply level-based visual effects
        this.applyLevelEffects();

        // Initialize
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Set depth so projectiles appear well above path tiles
        this.setDepth(50);

        // Configure physics
        this.setCollideWorldBounds(false);
        this.setImmovable(false);

        // Force visibility and properties
        this.setVisible(true);
        this.setAlpha(1.0);
        this.setTint(0xFFFFFF); // Reset tint

        // console.log(`🚀 Projectile created: visible=${this.visible}, alpha=${this.alpha}, depth=${this.depth}`);

        // Calculate trajectory
        this.calculateTrajectory();

        // Set up update loop
        scene.events.on('update', this.update, this);
    }

    applyLevelEffects() {
        // Apply visual effects based on tower level
        const levelScale = 1 + (this.towerLevel - 1) * 0.2; // Larger for higher levels
        this.setScale(levelScale);

        // Add glow effect for higher levels
        if (this.towerLevel >= 2) {
            // Create a subtle glow effect
            this.glowEffect = this.scene.add.circle(this.x, this.y, 8 * levelScale, 0xFFFFFF, 0.3);
            this.glowEffect.setDepth(this.depth - 1);
            this.scene.tweens.add({
                targets: this.glowEffect,
                alpha: 0.1,
                duration: 300,
                yoyo: true,
                repeat: -1
            });
        }

        // Add trailing particles for level 3
        if (this.towerLevel >= 3) {
            this.createTrailEffect();
        }
    }

    createTrailEffect() {
        // Create trailing particle effect for level 3 towers
        this.trailTimer = 0;
        this.trailParticles = [];

        // Store original position for trail calculation
        this.lastTrailX = this.x;
        this.lastTrailY = this.y;
    }

    updateTrailEffect(delta) {
        if (this.towerLevel < 3 || !this.active) return;

        this.trailTimer += delta;

        // Create trail particle every 50ms
        if (this.trailTimer >= 50) {
            this.trailTimer = 0;

            // Create small trail particle
            const trailParticle = this.scene.add.circle(this.x, this.y, 2, 0xFFFFFF, 0.6);
            trailParticle.setDepth(this.depth - 2);

            // Animate trail particle
            this.scene.tweens.add({
                targets: trailParticle,
                alpha: 0,
                scale: 0.5,
                duration: 300,
                onComplete: () => trailParticle.destroy()
            });

            // Store trail particle for cleanup
            this.trailParticles.push(trailParticle);

            // Limit trail particles to prevent performance issues
            if (this.trailParticles.length > 10) {
                const oldParticle = this.trailParticles.shift();
                if (oldParticle && oldParticle.active) {
                    oldParticle.destroy();
                }
            }
        }
    }

    calculateTrajectory() {
        if (!this.target) {
            this.destroy();
            return;
        }

        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        const velocityX = Math.cos(angle) * this.speed;
        const velocityY = Math.sin(angle) * this.speed;

        this.setVelocity(velocityX, velocityY);
        this.rotation = angle;
    }

    update(time, delta) {
        if (!this.active || !this.target || !this.target.active) {
            // console.log(`💥 Projectile ${this.towerType} destroyed - inactive target`);
            this.destroy();
            return;
        }

        // Update trail effect for level 3 projectiles
        this.updateTrailEffect(delta);

        // Update glow effect position if it exists
        if (this.glowEffect && this.glowEffect.active) {
            this.glowEffect.setPosition(this.x, this.y);
        }

        // Check if projectile has reached the target
        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.target.x, this.target.y
        );

        // Reduced debug logging
        // console.log(`💨 Projectile ${this.towerType} at (${this.x.toFixed(1)}, ${this.y.toFixed(1)}), distance: ${distance.toFixed(1)}, visible: ${this.visible}`);

        if (distance < 20) { // Hit threshold
            this.hitTarget();
        }
    }

    hitTarget() {
        // console.log(`🎯 PROJECTILE HIT: ${this.towerType} at (${this.x}, ${this.y})`);
        // console.log(`🎯 Projectile visible: ${this.visible}, alpha: ${this.alpha}, depth: ${this.depth}`);

        // Apply damage
        this.target.takeDamage(this.damage, this.towerType, this.splashRadius > 0);

        // Apply special effects
        if (this.slowEffect && this.towerType === 'frost') {
            this.target.applySlow(this.slowEffect.percent, this.slowEffect.duration);
        }

        // Apply splash damage for cannon
        if (this.splashRadius > 0 && this.towerType === 'cannon') {
            this.applySplashDamage();
        }

        // Create hit effect
        this.createHitEffect();

        // Make projectile flash before destroying
        this.setTint(0xFFFFFF);
        this.scene.time.delayedCall(50, () => {
            // console.log(`💥 Destroying projectile: ${this.towerType}`);
            this.destroy();
        });
    }

    applySplashDamage() {
        // Get all enemies in splash radius
        const enemies = this.scene.spawner.getEnemies().getChildren();
        const splashEnemies = enemies.filter(enemy => {
            const distance = Phaser.Math.Distance.Between(
                this.x, this.y,
                enemy.x, enemy.y
            );
            return distance <= this.splashRadius;
        });

        // Apply splash damage to nearby enemies
        splashEnemies.forEach(enemy => {
            if (enemy !== this.target) {
                enemy.takeDamage(this.damage * 0.6, this.towerType, false); // 60% damage for splash
            }
        });
    }

    createHitEffect() {
        let effectColor = 0xffffff;
        let effectSize = 20;

        switch (this.towerType) {
            case 'arrow':
                effectColor = 0xFF4444; // Bright red for visibility
                effectSize = 15 + (this.towerLevel * 5); // Larger for higher levels
                break;
            case 'cannon':
                effectColor = 0xFFFF00; // Bright yellow explosion
                effectSize = 25 + (this.towerLevel * 10); // Much larger for higher levels
                break;
            case 'frost':
                effectColor = 0x00FFFF; // Cyan for ice effect
                effectSize = 20 + (this.towerLevel * 8); // Larger for higher levels
                break;
        }

        // Create multiple effects for higher level towers
        const effectCount = Math.min(this.towerLevel, 3);

        // Capture scene reference to avoid undefined errors in delayed callbacks
        const sceneRef = this.scene;
        const towerLevelRef = this.towerLevel;

        for (let i = 0; i < effectCount; i++) {
            const delay = i * 50; // Stagger the effects
            sceneRef.time.delayedCall(delay, () => {
                const effect = sceneRef.add.circle(this.x, this.y, effectSize, effectColor, 0.8);
                effect.setDepth(60);

                // Add outline for better visibility
                const outline = sceneRef.add.circle(this.x, this.y, effectSize + 2, 0x000000, 0.4);
                outline.setDepth(55);

                // Add particle burst for level 3
                if (towerLevelRef >= 3) {
                    this.createParticleBurst(sceneRef, effectColor, effectSize);
                }

                sceneRef.tweens.add({
                    targets: [effect, outline],
                    scale: 0,
                    alpha: 0,
                    duration: 400 + (towerLevelRef * 100),
                    onComplete: () => {
                        if (effect.active) effect.destroy();
                        if (outline.active) outline.destroy();
                    }
                });
            });
        }
    }

    createParticleBurst(sceneRef, color, size) {
        // Create particle burst for level 3 hits
        const particleCount = 6 + Math.floor(size / 5);

        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = size * 0.8;
            const targetX = this.x + Math.cos(angle) * distance;
            const targetY = this.y + Math.sin(angle) * distance;

            const particle = sceneRef.add.circle(this.x, this.y, 2, color, 0.7);
            particle.setDepth(58);

            sceneRef.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                alpha: 0,
                scale: 0.3,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    if (particle && particle.active) {
                        particle.destroy();
                    }
                }
            });
        }
    }

    destroy() {
        try {
            // Clean up visual effects
            if (this.glowEffect && this.glowEffect.active) {
                this.glowEffect.destroy();
                this.glowEffect = null;
            }

            if (this.trailParticles) {
                this.trailParticles.forEach(particle => {
                    if (particle && particle.active) {
                        try {
                            particle.destroy();
                        } catch (e) {
                            // Particle might already be destroyed
                        }
                    }
                });
                this.trailParticles = [];
            }

            // Safely remove event listener
            if (this.scene && this.scene.events) {
                this.scene.events.off('update', this.update, this);
            }
        } catch (error) {
            // Silently handle destruction errors during scene cleanup
            console.warn('Projectile destroy error (likely during scene cleanup):', error.message);
        }

        super.destroy();
    }
}

export default Projectile;
