/**
 * Safe Cross-Platform Web Vibration API Haptics Helper
 * Provides realistic game haptic feedback on mobile & tablet devices
 * Gracefully ignores unsupported devices (desktop / non-vibration browsers)
 */

class HapticEngine {
  constructor() {
    this.enabled = true;
  }

  isSupported() {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined' && Boolean(navigator.vibrate);
  }

  vibrate(pattern) {
    if (!this.enabled || !this.isSupported()) return;
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore vibration errors silently
    }
  }

  /**
   * 1. Light Tap (12ms) - Button clicks, tile hover, fruit aim, card select
   */
  light() {
    this.vibrate(12);
  }

  /**
   * 2. Medium Impact (25ms) - Brick break, regular jump, fruit merge step, dot eat
   */
  medium() {
    this.vibrate(25);
  }

  /**
   * 3. Heavy Blast (Pattern: 40ms - 25ms - 40ms) - Homerun, laser shoot, bomb explosion, magic spell cast
   */
  heavy() {
    this.vibrate([40, 25, 40]);
  }

  /**
   * 4. Victory Celebration Fanfare (Pattern: 20ms - 30ms - 30ms - 30ms - 60ms)
   */
  success() {
    this.vibrate([20, 30, 30, 30, 60]);
  }

  /**
   * 5. Game Over / Warning (Pattern: 45ms - 40ms - 45ms)
   */
  warning() {
    this.vibrate([45, 40, 45]);
  }

  /**
   * 6. Toggle Haptics On / Off
   */
  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) this.light();
    return this.enabled;
  }
}

export const haptics = new HapticEngine();
