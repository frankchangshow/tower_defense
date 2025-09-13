/**
 * ScreenShakeManager - Handles camera shake effects for visual impact
 * Makes explosions, hits, and impacts feel powerful and satisfying
 */
class ScreenShakeManager {
    constructor(scene) {
        this.scene = scene;
        this.camera = scene.cameras.main;
        
        // Shake state
        this.isShaking = false;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeTimer = 0;
        
        // Original camera position
        this.originalX = 0;
        this.originalY = 0;
    }

    /**
     * Start a screen shake effect
     * @param {number} intensity - How strong the shake (1-10)
     * @param {number} duration - How long in milliseconds
     */
    shake(intensity = 5, duration = 200) {
        if (this.isShaking) {
            // If already shaking, combine intensities
            this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
            this.shakeDuration = Math.max(this.shakeDuration, duration);
        } else {
            this.startShake(intensity, duration);
        }
    }

    startShake(intensity, duration) {
        this.isShaking = true;
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeTimer = 0;
        
        // Store original camera position
        this.originalX = this.camera.scrollX;
        this.originalY = this.camera.scrollY;
        
        console.log(`📳 Screen shake started: intensity=${intensity}, duration=${duration}ms`);
    }

    update(time, delta) {
        if (!this.isShaking) return;

        this.shakeTimer += delta;

        if (this.shakeTimer >= this.shakeDuration) {
            // Shake finished
            this.stopShake();
        } else {
            // Continue shaking
            this.updateShake();
        }
    }

    updateShake() {
        // Calculate shake progress (0 to 1)
        const progress = this.shakeTimer / this.shakeDuration;
        
        // Easing function - shake gets weaker over time
        const easeOut = 1 - Math.pow(progress, 2);
        
        // Current shake strength
        const currentIntensity = this.shakeIntensity * easeOut;
        
        // Generate random shake offset
        const shakeX = (Math.random() - 0.5) * currentIntensity;
        const shakeY = (Math.random() - 0.5) * currentIntensity;
        
        // Apply shake to camera
        this.camera.setScroll(
            this.originalX + shakeX,
            this.originalY + shakeY
        );
    }

    stopShake() {
        this.isShaking = false;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeTimer = 0;
        
        // Return camera to original position
        this.camera.setScroll(this.originalX, this.originalY);
        
        console.log('📳 Screen shake finished');
    }

    /**
     * Quick shake for small impacts
     */
    lightShake() {
        this.shake(8, 300); // Increased intensity from 2 to 8, duration from 100ms to 300ms
    }

    /**
     * Medium shake for medium impacts
     */
    mediumShake() {
        this.shake(4, 200);
    }

    /**
     * Heavy shake for big explosions
     */
    heavyShake() {
        this.shake(8, 400);
    }

    /**
     * Massive shake for boss deaths or major events
     */
    massiveShake() {
        this.shake(12, 600);
    }
}

export default ScreenShakeManager;
