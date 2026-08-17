// Web Audio API Procedural Sound Synthesizer for Dochon Magic Cat Academy

class MagicAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
  }

  // Wand draw spark sound
  playWandDraw() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + Math.random() * 400, now);
      osc.frequency.exponentialRampToValueAtTime(1200 + Math.random() * 300, now + 0.08);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  // Spell cast success hit (varies by symbol)
  playCastSuccess(symbolType = 'HORIZONTAL') {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      let baseFreq = 523.25; // C5
      if (symbolType === 'HORIZONTAL') baseFreq = 587.33; // D5
      else if (symbolType === 'VERTICAL') baseFreq = 659.25; // E5
      else if (symbolType === 'UP_V') baseFreq = 783.99; // G5
      else if (symbolType === 'DOWN_V') baseFreq = 880.00; // A5
      else if (symbolType === 'LIGHTNING') baseFreq = 1046.50; // C6
      else if (symbolType === 'HEART') baseFreq = 1174.66; // D6

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.15);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {}
  }

  // Ghost purified explosion chime
  playGhostPurified() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [659.25, 783.99, 1046.50, 1318.51].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0.1, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.2);
      });
    } catch (e) {}
  }

  // Lightning AOE Zap
  playThunderZap() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // White noise blast + low rumble oscillator
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  // Heart healing arpeggio
  playHeartHeal() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);

        gain.gain.setValueAtTime(0.12, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.25);
      });
    } catch (e) {}
  }

  // Combo ascending chime
  playComboUp(comboCount) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const pitchFactor = Math.min(2.0, 1.0 + (comboCount * 0.06));
      const freq = 600 * pitchFactor;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.3, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  // Player hurt / meow
  playPlayerHurt() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.22);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  // Stage clear fanfare
  playStageClear() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const melody = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      melody.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);

        gain.gain.setValueAtTime(0.18, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.3);
      });
    } catch (e) {}
  }

  // Boss defeat victory fanfare
  playBossDefeat() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const chords = [
        [523.25, 659.25, 783.99],
        [587.33, 739.99, 880.00],
        [659.25, 830.61, 987.77],
        [1046.50, 1318.51, 1567.98]
      ];
      chords.forEach((chord, step) => {
        chord.forEach((freq) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + step * 0.18);

          gain.gain.setValueAtTime(0.12, now + step * 0.18);
          gain.gain.exponentialRampToValueAtTime(0.001, now + step * 0.18 + 0.45);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + step * 0.18);
          osc.stop(now + step * 0.18 + 0.45);
        });
      });
    } catch (e) {}
  }

  // Game over sound
  playGameOver() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [440, 415.30, 392.00, 349.23];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + i * 0.15);

        gain.gain.setValueAtTime(0.18, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.35);
      });
    } catch (e) {}
  }
}

export const magicAudio = new MagicAudioEngine();
