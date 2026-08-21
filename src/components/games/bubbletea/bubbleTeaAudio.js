// Dochon Bubble Tea Cafe - Web Audio API Synthesizer
// Clean, low-latency procedural sound effects without external audio files

class BubbleTeaAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.pourOsc = null;
    this.pourGain = null;
    this.pourFilter = null;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted && this.pourGain) {
      this.stopPour();
    }
  }

  // 🧋 Boba pearl bouncing / dropping into cup sound
  playBubbleDrop() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Frequency drop for plop/bloop feel
    const baseFreq = 480 + Math.random() * 80;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // 🌊 Pouring Liquid (Milk Tea / Syrup stream)
  startPour(type = 'tea') {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    // Prevent duplicate pour oscillators
    if (this.pourOsc) return;

    const now = this.ctx.currentTime;
    this.pourOsc = this.ctx.createOscillator();
    this.pourGain = this.ctx.createGain();
    this.pourFilter = this.ctx.createBiquadFilter();

    this.pourOsc.type = 'triangle';
    this.pourOsc.frequency.setValueAtTime(type === 'syrup' ? 240 : 380, now);

    this.pourFilter.type = 'lowpass';
    this.pourFilter.frequency.setValueAtTime(type === 'syrup' ? 600 : 950, now);

    this.pourGain.gain.setValueAtTime(0.01, now);
    this.pourGain.gain.linearRampToValueAtTime(0.18, now + 0.05);

    this.pourOsc.connect(this.pourFilter);
    this.pourFilter.connect(this.pourGain);
    this.pourGain.connect(this.ctx.destination);

    this.pourOsc.start(now);
  }

  updatePourPitch(progress = 0.5) {
    if (!this.pourOsc || !this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // As cup fills, liquid pitch rises subtly
    const targetFreq = 360 + progress * 240;
    this.pourOsc.frequency.setTargetAtTime(targetFreq, now, 0.05);
  }

  stopPour() {
    if (!this.pourGain || !this.ctx) {
      this.pourOsc = null;
      this.pourGain = null;
      this.pourFilter = null;
      return;
    }
    const now = this.ctx.currentTime;
    try {
      this.pourGain.gain.cancelScheduledValues(now);
      this.pourGain.gain.setValueAtTime(this.pourGain.gain.value, now);
      this.pourGain.gain.linearRampToValueAtTime(0.001, now + 0.04);
      if (this.pourOsc) {
        this.pourOsc.stop(now + 0.05);
      }
    } catch (e) {}

    setTimeout(() => {
      this.pourOsc = null;
      this.pourGain = null;
      this.pourFilter = null;
    }, 60);
  }

  // 🧃 Satisfying Straw piercing / popping into cup
  playStrawPop() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.06);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  // ⭐ Rating result chime (Stars feedback)
  playRatingChime(stars = 3) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const notes = stars === 3
      ? [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6 (Perfect arpeggio)
      : stars === 2
      ? [587.33, 739.99, 880.00]          // D5, F#5, A5 (Great)
      : stars === 1
      ? [440.00, 554.37]                  // A4, C#5 (Good)
      : [329.63, 293.66];                 // E4, D4 (Miss)

    const baseNow = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = baseNow + idx * 0.08;

      osc.type = stars >= 2 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.22, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.3);
    });
  }

  // 🐱 Cute sipping / slurping sound when customer drinks
  playSlurp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.09;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320 + Math.random() * 150, t);
      osc.frequency.linearRampToValueAtTime(650 + Math.random() * 100, t + 0.06);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.08);
    }
  }

  // 🎉 Day clear / victory celebration fanfare
  playVictoryFanfare() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const chords = [
      { notes: [523.25, 659.25, 783.99], time: 0.0 }, // C
      { notes: [587.33, 739.99, 880.00], time: 0.18 }, // D
      { notes: [659.25, 830.61, 987.77], time: 0.36 }, // E
      { notes: [783.99, 987.77, 1174.66, 1567.98], time: 0.58 } // G + C7 High
    ];

    const baseNow = this.ctx.currentTime;
    chords.forEach(chord => {
      chord.notes.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = baseNow + chord.time;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.5);
      });
    });
  }

  // 🔘 Light UI button click
  playClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }
}

export const bubbleTeaAudio = new BubbleTeaAudioEngine();
