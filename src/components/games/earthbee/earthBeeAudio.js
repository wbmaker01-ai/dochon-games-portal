// Web Audio API Procedural Sound Engine for Earth Bee Game
class EarthBeeAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.humOsc = null;
    this.humGain = null;
    this.isHumming = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted) {
      this.stopFlightHum();
    }
  }

  // Soft Bee Flight Humming (Buzzing tone)
  startFlightHum() {
    if (this.isMuted || this.isHumming) return;
    this.init();
    if (!this.ctx) return;

    try {
      this.humOsc = this.ctx.createOscillator();
      this.humGain = this.ctx.createGain();

      this.humOsc.type = 'sawtooth';
      this.humOsc.frequency.setValueAtTime(110, this.ctx.currentTime); // ~110Hz low bee hum

      // Low pass filter to make it soft and organic
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);

      this.humGain.gain.setValueAtTime(0.015, this.ctx.currentTime);

      this.humOsc.connect(filter);
      filter.connect(this.humGain);
      this.humGain.connect(this.ctx.destination);

      this.humOsc.start();
      this.isHumming = true;
    } catch (e) {}
  }

  updateFlightHum(speedRatio = 1) {
    if (!this.isHumming || !this.humOsc || !this.ctx) return;
    try {
      const targetFreq = 100 + speedRatio * 40; // 100Hz ~ 140Hz based on speed
      this.humOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.05);
    } catch (e) {}
  }

  stopFlightHum() {
    if (!this.isHumming) return;
    try {
      if (this.humGain && this.ctx) {
        this.humGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05);
      }
      setTimeout(() => {
        if (this.humOsc) {
          try { this.humOsc.stop(); } catch (e) {}
          this.humOsc.disconnect();
          this.humOsc = null;
        }
        this.isHumming = false;
      }, 60);
    } catch (e) {
      this.isHumming = false;
    }
  }

  // Sparkling Pollen Collection Sound
  playPollenCollect() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  // Resonant Flower Bloom Sound
  playBloom(combo = 1) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const baseFreq = 523.25 * Math.pow(1.05946, Math.min(combo, 8) * 2); // Scales with combo

      // Harmonic Bell Chimes
      [1, 1.5, 2].forEach((mult, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq * mult, now + i * 0.03);

        const vol = (0.12 / (i + 1));
        gain.gain.setValueAtTime(vol, now + i * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35 + i * 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.03);
        osc.stop(now + 0.45);
      });
    } catch (e) {}
  }

  // Multi-Combo Celebration Arpeggio
  playComboChime(combo = 2) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
      const step = Math.min(combo, 4);

      for (let i = 0; i < step; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(notes[i % notes.length], now + i * 0.06);

        gain.gain.setValueAtTime(0.09, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.25);
      }
    } catch (e) {}
  }

  // Level Up Garden Bloom Fanfare
  playLevelUp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const chords = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C major 9th

      chords.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.7);
      });
    } catch (e) {}
  }

  // Game Complete / Time Up Gentle Chord
  playGameOver() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [440, 392, 349.23, 261.63]; // A4 -> G4 -> F4 -> C4
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.1, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.6);
      });
    } catch (e) {}
  }

  // UI Button Click Sound
  playClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }
}

export const earthBeeAudio = new EarthBeeAudio();
