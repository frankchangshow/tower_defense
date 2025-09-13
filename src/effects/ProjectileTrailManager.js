/**
 * ProjectileTrailManager - Creates glowing trails behind projectiles
 * Makes projectiles feel fast and magical with visual trails
 */
class ProjectileTrailManager {
    constructor(scene) {
        this.scene = scene;
        this.trails = new Map(); // Map of projectile ID to trail graphics
        this.maxTrailLength = 8; // Maximum number of trail segments
    }

    /**
     * Start a trail for a projectile
     * @param {Phaser.GameObject} projectile - Projectile to add trail to
     * @param {number} color - Trail color
     * @param {number} width - Trail width
     */
    startTrail(projectile, color = 0xffffff, width = 3) {
        const projectileId = projectile.id || Math.random().toString(36);
        
        // Create trail graphics
        const trail = this.scene.add.graphics();
        trail.setDepth(projectile.depth - 1);
        
        // Store trail data
        this.trails.set(projectileId, {
            graphics: trail,
            segments: [],
            color: color,
            width: width,
            projectile: projectile
        });

        console.log(`🏹 Started trail for projectile ${projectileId}`);
    }

    /**
     * Update a projectile's trail
     * @param {Phaser.GameObject} projectile - Projectile to update trail for
     */
    updateTrail(projectile) {
        const projectileId = projectile.id || this.findProjectileId(projectile);
        if (!projectileId || !this.trails.has(projectileId)) return;

        const trailData = this.trails.get(projectileId);
        
        // Add current position to trail segments
        trailData.segments.push({
            x: projectile.x,
            y: projectile.y,
            time: this.scene.time.now
        });

        // Limit trail length
        if (trailData.segments.length > this.maxTrailLength) {
            trailData.segments.shift();
        }

        // Redraw trail
        this.drawTrail(trailData);
    }

    /**
     * End a projectile's trail
     * @param {Phaser.GameObject} projectile - Projectile to end trail for
     */
    endTrail(projectile) {
        const projectileId = projectile.id || this.findProjectileId(projectile);
        if (!projectileId || !this.trails.has(projectileId)) return;

        const trailData = this.trails.get(projectileId);
        
        // Fade out trail
        this.scene.tweens.add({
            targets: trailData.graphics,
            alpha: 0,
            duration: 300,
            ease: 'Power2.easeOut',
            onComplete: () => {
                trailData.graphics.destroy();
                this.trails.delete(projectileId);
            }
        });

        console.log(`🏹 Ended trail for projectile ${projectileId}`);
    }

    /**
     * Draw the trail graphics
     * @param {object} trailData - Trail data object
     */
    drawTrail(trailData) {
        const { graphics, segments, color, width } = trailData;
        
        graphics.clear();

        if (segments.length < 2) return;

        // Draw trail segments with fading alpha
        for (let i = 0; i < segments.length - 1; i++) {
            const segment = segments[i];
            const nextSegment = segments[i + 1];
            
            // Calculate alpha based on segment age
            const age = (this.scene.time.now - segment.time) / 1000;
            const alpha = Math.max(0, 1 - (age * 2)); // Fade over 0.5 seconds
            
            // Calculate width based on segment age
            const segmentWidth = width * alpha;
            
            if (segmentWidth > 0.1) {
                graphics.lineStyle(segmentWidth, color, alpha);
                graphics.beginPath();
                graphics.moveTo(segment.x, segment.y);
                graphics.lineTo(nextSegment.x, nextSegment.y);
                graphics.strokePath();
            }
        }
    }

    /**
     * Find projectile ID by searching through trails
     * @param {Phaser.GameObject} projectile - Projectile to find ID for
     * @returns {string|null} Projectile ID or null
     */
    findProjectileId(projectile) {
        for (const [id, trailData] of this.trails.entries()) {
            if (trailData.projectile === projectile) {
                return id;
            }
        }
        return null;
    }

    /**
     * Create a special trail effect for different projectile types
     * @param {Phaser.GameObject} projectile - Projectile to add special trail to
     * @param {string} type - Projectile type (arrow, cannon, frost)
     */
    createSpecialTrail(projectile, type) {
        const trailConfigs = {
            arrow: {
                color: 0x00ff00,
                width: 2,
                segments: 6
            },
            cannon: {
                color: 0xff4444,
                width: 4,
                segments: 8
            },
            frost: {
                color: 0x87CEEB,
                width: 3,
                segments: 10
            }
        };

        const config = trailConfigs[type] || trailConfigs.arrow;
        this.startTrail(projectile, config.color, config.width);
        this.maxTrailLength = config.segments;
    }

    /**
     * Create a magical trail with sparkles
     * @param {Phaser.GameObject} projectile - Projectile to add magical trail to
     */
    createMagicalTrail(projectile) {
        this.startTrail(projectile, 0xffffff, 3);
        
        // Add sparkle particles along the trail
        const sparkleTimer = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                if (projectile && projectile.active) {
                    // Create sparkle at projectile position
                    const sparkle = this.scene.add.graphics();
                    sparkle.x = projectile.x;
                    sparkle.y = projectile.y;
                    sparkle.setDepth(projectile.depth + 1);
                    
                    sparkle.fillStyle(0xffd700, 0.8);
                    sparkle.fillCircle(0, 0, 2);
                    
                    // Fade out sparkle
                    this.scene.tweens.add({
                        targets: sparkle,
                        alpha: 0,
                        scaleX: 0,
                        scaleY: 0,
                        duration: 500,
                        ease: 'Power2.easeOut',
                        onComplete: () => {
                            sparkle.destroy();
                        }
                    });
                }
            },
            loop: true
        });

        // Store sparkle timer with trail data
        const projectileId = projectile.id || this.findProjectileId(projectile);
        if (projectileId && this.trails.has(projectileId)) {
            this.trails.get(projectileId).sparkleTimer = sparkleTimer;
        }
    }

    /**
     * Update all trails
     * @param {number} time - Current time
     * @param {number} delta - Delta time
     */
    update(time, delta) {
        // Clean up trails for destroyed projectiles
        for (const [id, trailData] of this.trails.entries()) {
            if (!trailData.projectile || !trailData.projectile.active) {
                this.endTrail(trailData.projectile);
            }
        }
    }

    /**
     * Clear all trails
     */
    clear() {
        for (const [id, trailData] of this.trails.entries()) {
            if (trailData.sparkleTimer) {
                trailData.sparkleTimer.destroy();
            }
            trailData.graphics.destroy();
        }
        this.trails.clear();
    }

    /**
     * Get trail count
     */
    getTrailCount() {
        return this.trails.size;
    }
}

export default ProjectileTrailManager;
