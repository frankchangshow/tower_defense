/**
 * VisualJuiceManager - Adds satisfying visual feedback to game actions
 * Makes everything feel "alive" with bounce, scale, flash, and smooth animations
 */
class VisualJuiceManager {
    constructor(scene) {
        this.scene = scene;
        this.activeAnimations = [];
    }

    /**
     * Make a tower "pop" when placed
     * @param {Phaser.GameObject} tower - Tower object to animate
     */
    towerPlacementPop(tower) {
        console.log('🏗️ Tower placement pop animation');
        
        // Scale up from 0 to 1 with bounce - Made more dramatic
        this.scene.tweens.add({
            targets: tower,
            scaleX: { from: 0, to: 1.5 }, // Increased from 1.2 to 1.5
            scaleY: { from: 0, to: 1.5 }, // Increased from 1.2 to 1.5
            duration: 300, // Increased from 200 to 300ms
            ease: 'Back.easeOut',
            onComplete: () => {
                // Scale back to normal with more bounce
                this.scene.tweens.add({
                    targets: tower,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 200, // Increased from 100 to 200ms
                    ease: 'Elastic.easeOut' // Changed to Elastic for more bounce
                });
            }
        });

        // Add a subtle glow effect
        this.addGlowEffect(tower, 0x00ff00, 300);
    }

    /**
     * Make an enemy flash when hit
     * @param {Phaser.GameObject} enemy - Enemy object to flash
     * @param {number} color - Flash color (default red)
     */
    enemyHitFlash(enemy, color = 0xff0000) {
        console.log('💥 Enemy hit flash');
        
        // Store original tint
        const originalTint = enemy.tint;
        
        // Flash red
        enemy.setTint(color);
        
        // Flash back to original
        this.scene.tweens.add({
            targets: enemy,
            alpha: 0.5,
            duration: 50,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                enemy.setTint(originalTint);
                enemy.setAlpha(1);
            }
        });
    }

    /**
     * Make an enemy "pop" when destroyed
     * @param {Phaser.GameObject} enemy - Enemy object to animate
     */
    enemyDeathPop(enemy) {
        console.log('💀 Enemy death pop');
        
        // Scale up and fade out
        this.scene.tweens.add({
            targets: enemy,
            scaleX: { from: 1, to: 1.5 },
            scaleY: { from: 1, to: 1.5 },
            alpha: { from: 1, to: 0 },
            duration: 300,
            ease: 'Power2.easeOut'
        });
    }

    /**
     * Make a projectile "whoosh" when fired
     * @param {Phaser.GameObject} projectile - Projectile object to animate
     */
    projectileWhoosh(projectile) {
        console.log('🏹 Projectile whoosh');
        
        // Start small and scale up
        projectile.setScale(0.5);
        
        this.scene.tweens.add({
            targets: projectile,
            scaleX: 1,
            scaleY: 1,
            duration: 100,
            ease: 'Back.easeOut'
        });

        // Add trail effect
        this.addTrailEffect(projectile);
    }

    /**
     * Make UI elements bounce when clicked
     * @param {Phaser.GameObject} uiElement - UI element to bounce
     */
    uiBounce(uiElement) {
        console.log('🖱️ UI bounce');
        
        this.scene.tweens.add({
            targets: uiElement,
            scaleX: { from: 1, to: 0.9 },
            scaleY: { from: 1, to: 0.9 },
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
    }

    /**
     * Make a tower upgrade "power up"
     * @param {Phaser.GameObject} tower - Tower object to animate
     */
    towerUpgradePowerUp(tower) {
        console.log('⚡ Tower upgrade power up');
        console.log('⚡ Tower object:', tower);
        console.log('⚡ Tower position:', tower.x, tower.y);
        console.log('⚡ Tower scale before:', tower.scaleX, tower.scaleY);
        console.log('⚡ Starting tower upgrade animation...');
        
        // Scale up with glow
        this.scene.tweens.add({
            targets: tower,
            scaleX: { from: 1, to: 1.3 },
            scaleY: { from: 1, to: 1.3 },
            duration: 300,
            ease: 'Back.easeOut',
            onStart: () => {
                console.log('⚡ Tower upgrade animation STARTED');
            },
            onUpdate: () => {
                console.log('⚡ Tower upgrade animation UPDATING - scale:', tower.scaleX, tower.scaleY);
            },
            onComplete: () => {
                console.log('⚡ Tower upgrade animation COMPLETED - starting scale back');
                // Scale back to normal
                this.scene.tweens.add({
                    targets: tower,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 200,
                    ease: 'Power2',
                    onStart: () => {
                        console.log('⚡ Tower scale back animation STARTED');
                    },
                    onComplete: () => {
                        console.log('⚡ Tower scale back animation COMPLETED');
                        console.log('⚡ Final tower scale:', tower.scaleX, tower.scaleY);
                    }
                });
            }
        });

        // Add power-up glow
        console.log('⚡ Adding glow effect to tower...');
        this.addGlowEffect(tower, 0xffff00, 500);
    }

    /**
     * Make gold collection sparkle
     * @param {Phaser.GameObject} goldElement - Gold UI element
     */
    goldCollectionSparkle(goldElement) {
        console.log('💰 Gold collection sparkle');
        
        // Scale up and down
        this.scene.tweens.add({
            targets: goldElement,
            scaleX: { from: 1, to: 1.2 },
            scaleY: { from: 1, to: 1.2 },
            duration: 150,
            yoyo: true,
            ease: 'Power2'
        });

        // Add sparkle effect
        this.addGlowEffect(goldElement, 0xffd700, 300);
    }

    /**
     * Add a glow effect to an object
     * @param {Phaser.GameObject} target - Object to glow
     * @param {number} color - Glow color
     * @param {number} duration - Glow duration
     */
    addGlowEffect(target, color, duration) {
        console.log('✨ addGlowEffect called');
        console.log('✨ Target:', target);
        console.log('✨ Target position:', target.x, target.y);
        console.log('✨ Target depth:', target.depth);
        console.log('✨ Color:', color);
        console.log('✨ Duration:', duration);
        
        // Get the world position of the target (in case it's a container)
        const worldX = target.x;
        const worldY = target.y;
        console.log('✨ World position:', worldX, worldY);
        
        // Create multiple glow layers for a more impressive effect
        const glowLayers = [];
        
        // Layer 1: Large outer glow (soft yellow)
        const outerGlow = this.scene.add.graphics();
        outerGlow.x = worldX;
        outerGlow.y = worldY;
        outerGlow.setDepth(1000);
        outerGlow.fillStyle(0xffff00, 0.3); // Soft yellow
        outerGlow.fillCircle(0, 0, 80);
        glowLayers.push(outerGlow);
        
        // Layer 2: Medium glow (bright yellow)
        const mediumGlow = this.scene.add.graphics();
        mediumGlow.x = worldX;
        mediumGlow.y = worldY;
        mediumGlow.setDepth(1001);
        mediumGlow.fillStyle(0xffff00, 0.6); // Bright yellow
        mediumGlow.fillCircle(0, 0, 60);
        glowLayers.push(mediumGlow);
        
        // Layer 3: Inner glow (white core)
        const innerGlow = this.scene.add.graphics();
        innerGlow.x = worldX;
        innerGlow.y = worldY;
        innerGlow.setDepth(1002);
        innerGlow.fillStyle(0xffffff, 0.8); // White core
        innerGlow.fillCircle(0, 0, 40);
        glowLayers.push(innerGlow);
        
        console.log('✨ Multi-layer glow created');

        // Animate all layers together for a dramatic effect
        this.scene.tweens.add({
            targets: glowLayers,
            alpha: { from: 1.0, to: 0 },
            scaleX: { from: 0.5, to: 3 },
            scaleY: { from: 0.5, to: 3 },
            duration: duration,
            ease: 'Power2.easeOut',
            onStart: () => {
                console.log('✨ Multi-layer glow animation STARTED');
            },
            onUpdate: (tween) => {
                // Redraw all layers with current properties
                glowLayers.forEach((glow, index) => {
                    glow.clear();
                    if (index === 0) {
                        glow.fillStyle(0xffff00, glow.alpha * 0.3);
                        glow.fillCircle(0, 0, 80);
                    } else if (index === 1) {
                        glow.fillStyle(0xffff00, glow.alpha * 0.6);
                        glow.fillCircle(0, 0, 60);
                    } else {
                        glow.fillStyle(0xffffff, glow.alpha * 0.8);
                        glow.fillCircle(0, 0, 40);
                    }
                });
            },
            onComplete: () => {
                console.log('✨ Multi-layer glow animation COMPLETED - destroying glows');
                glowLayers.forEach(glow => glow.destroy());
            }
        });
    }

    /**
     * Add a trail effect to a moving object
     * @param {Phaser.GameObject} target - Object to add trail to
     */
    addTrailEffect(target) {
        // Create trail graphics
        const trail = this.scene.add.graphics();
        trail.setDepth(target.depth - 1);

        // Update trail position
        const trailUpdate = () => {
            trail.clear();
            trail.fillStyle(0xffffff, 0.3);
            trail.fillCircle(target.x, target.y, 3);
        };

        // Start trail update
        const trailTimer = this.scene.time.addEvent({
            delay: 50,
            callback: trailUpdate,
            loop: true
        });

        // Stop trail after 1 second
        this.scene.time.delayedCall(1000, () => {
            trailTimer.destroy();
            trail.destroy();
        });
    }

    /**
     * Make the screen flash for special events
     * @param {number} color - Flash color
     * @param {number} duration - Flash duration
     */
    screenFlash(color = 0xffffff, duration = 200) {
        console.log('⚡ Screen flash');
        
        // Create flash overlay
        const flash = this.scene.add.graphics();
        flash.fillStyle(color, 0.5);
        flash.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height);
        flash.setDepth(1000); // Above everything

        // Fade out flash
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: duration,
            ease: 'Power2.easeOut',
            onComplete: () => {
                flash.destroy();
            }
        });
    }

    /**
     * Make a wave start announcement
     * @param {string} text - Text to display
     */
    waveStartAnnouncement(text) {
        console.log(`🌊 Wave start announcement: ${text}`);
        
        // Create announcement text
        const announcement = this.scene.add.text(400, 300, text, {
            font: '32px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        announcement.setOrigin(0.5, 0.5);
        announcement.setDepth(1000);

        // Animate announcement
        announcement.setScale(0);
        announcement.setAlpha(0);

        this.scene.tweens.add({
            targets: announcement,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Hold for a moment
                this.scene.time.delayedCall(1000, () => {
                    // Fade out
                    this.scene.tweens.add({
                        targets: announcement,
                        scaleX: 0,
                        scaleY: 0,
                        alpha: 0,
                        duration: 300,
                        ease: 'Power2.easeIn',
                        onComplete: () => {
                            announcement.destroy();
                        }
                    });
                });
            }
        });
    }

    /**
     * Clean up all active animations
     */
    cleanup() {
        this.activeAnimations.forEach(animation => {
            if (animation && animation.destroy) {
                animation.destroy();
            }
        });
        this.activeAnimations = [];
    }
}

export default VisualJuiceManager;
