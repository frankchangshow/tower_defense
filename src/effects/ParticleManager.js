/**
 * ParticleManager - Creates particle effects for explosions, sparkles, and visual flair
 * Makes the game feel alive and satisfying with colorful particle effects
 */
class ParticleManager {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.maxParticles = 100;
    }

    /**
     * Create explosion particles at a position
     * @param {number} x - World X position
     * @param {number} y - World Y position
     * @param {string} color - Hex color for particles
     * @param {number} count - Number of particles
     */
    createExplosion(x, y, color = 0xff4444, count = 8) {
        console.log(`💥 Creating explosion at (${x}, ${y}) with ${count} particles`);
        
        for (let i = 0; i < count; i++) {
            this.createParticle(x, y, color, 'explosion');
        }
    }

    /**
     * Create gold collection sparkles
     * @param {number} x - World X position
     * @param {number} y - World Y position
     */
    createGoldSparkles(x, y) {
        console.log(`✨ Creating gold sparkles at (${x}, ${y})`);
        
        for (let i = 0; i < 6; i++) {
            this.createParticle(x, y, 0xffd700, 'sparkle');
        }
    }

    /**
     * Create tower placement dust effect
     * @param {number} x - World X position
     * @param {number} y - World Y position
     */
    createTowerPlacementDust(x, y) {
        console.log(`🏗️ Creating tower placement dust at (${x}, ${y})`);
        
        // Create more particles and make them more visible
        for (let i = 0; i < 12; i++) { // Increased from 4 to 12 particles
            this.createParticle(x, y, 0x8B4513, 'dust');
        }
    }

    /**
     * Create projectile impact sparks
     * @param {number} x - World X position
     * @param {number} y - World Y position
     * @param {string} color - Color of the projectile
     */
    createImpactSparks(x, y, color = 0xffffff) {
        console.log(`⚡ Creating impact sparks at (${x}, ${y})`);
        
        for (let i = 0; i < 5; i++) {
            this.createParticle(x, y, color, 'spark');
        }
    }

    /**
     * Create frost effect particles
     * @param {number} x - World X position
     * @param {number} y - World Y position
     */
    createFrostEffect(x, y) {
        console.log(`❄️ Creating frost effect at (${x}, ${y})`);
        
        for (let i = 0; i < 6; i++) {
            this.createParticle(x, y, 0x87CEEB, 'frost');
        }
    }

    /**
     * Create a single particle
     * @param {number} x - Starting X position
     * @param {number} y - Starting Y position
     * @param {number} color - Particle color
     * @param {string} type - Particle type for different behaviors
     */
    createParticle(x, y, color, type) {
        // Limit particle count
        if (this.particles.length >= this.maxParticles) {
            const oldParticle = this.particles.shift();
            if (oldParticle && oldParticle.destroy) {
                oldParticle.destroy();
            }
        }

        // Create particle graphics
        const particle = this.scene.add.graphics();
        particle.x = x;
        particle.y = y;

        // Configure particle based on type
        const config = this.getParticleConfig(type);
        
        // Draw particle shape
        particle.fillStyle(color, config.alpha);
        particle.fillCircle(0, 0, config.size);

        // Set particle properties
        particle.particleData = {
            type: type,
            velocityX: (Math.random() - 0.5) * config.speed,
            velocityY: (Math.random() - 0.5) * config.speed,
            life: config.life,
            maxLife: config.life,
            gravity: config.gravity,
            fade: config.fade,
            shrink: config.shrink
        };

        // Add to particles array
        this.particles.push(particle);

        return particle;
    }

    /**
     * Get particle configuration based on type
     * @param {string} type - Particle type
     * @returns {object} Configuration object
     */
    getParticleConfig(type) {
        const configs = {
            explosion: {
                size: 4,
                speed: 200,
                life: 800,
                alpha: 0.8,
                gravity: 0.3,
                fade: true,
                shrink: true
            },
            sparkle: {
                size: 2,
                speed: 100,
                life: 1000,
                alpha: 1.0,
                gravity: 0.1,
                fade: true,
                shrink: false
            },
            dust: {
                size: 6, // Increased from 3 to 6
                speed: 120, // Increased from 80 to 120
                life: 1000, // Increased from 600 to 1000
                alpha: 0.9, // Increased from 0.6 to 0.9
                gravity: 0.2,
                fade: true,
                shrink: true
            },
            spark: {
                size: 2,
                speed: 150,
                life: 400,
                alpha: 0.9,
                gravity: 0.1,
                fade: true,
                shrink: true
            },
            frost: {
                size: 3,
                speed: 60,
                life: 1200,
                alpha: 0.7,
                gravity: 0.05,
                fade: true,
                shrink: false
            }
        };

        return configs[type] || configs.explosion;
    }

    /**
     * Update all particles
     * @param {number} time - Current time
     * @param {number} delta - Delta time
     */
    update(time, delta) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            const data = particle.particleData;

            if (!data) {
                this.particles.splice(i, 1);
                continue;
            }

            // Update particle life
            data.life -= delta;

            if (data.life <= 0) {
                // Particle is dead, remove it
                particle.destroy();
                this.particles.splice(i, 1);
                continue;
            }

            // Update particle position
            particle.x += data.velocityX * delta / 1000;
            particle.y += data.velocityY * delta / 1000;

            // Apply gravity
            data.velocityY += data.gravity * delta / 1000;

            // Update particle appearance
            const lifeRatio = data.life / data.maxLife;

            if (data.fade) {
                particle.alpha = lifeRatio * 0.8;
            }

            if (data.shrink) {
                const scale = lifeRatio;
                particle.scaleX = scale;
                particle.scaleY = scale;
            }
        }
    }

    /**
     * Clear all particles
     */
    clear() {
        this.particles.forEach(particle => {
            if (particle && particle.destroy) {
                particle.destroy();
            }
        });
        this.particles = [];
    }

    /**
     * Get particle count
     */
    getParticleCount() {
        return this.particles.length;
    }
}

export default ParticleManager;
