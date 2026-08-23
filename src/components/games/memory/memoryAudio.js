// Web Audio API Sound Synthesizer for Dochon Memory Master

class MemoryAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmOsc = null;
    this.bgmGain = null;
    this.isBgmPlaying = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.isBgmPlaying) {
      this.stopBGM();
    }
    return this.isMuted;
  }

  // Play a simple synthesized tone with ADSR envelope
  playTone(freq, type = 'sine', duration = 0.2, gainLevel = 0.25) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(gainLevel, this.ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Card Flip Sound (Crisp paper/card swoosh)
  playCardFlip() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  // Card Match Success (Bright sweet bell arpeggio)
  playMatchSuccess(combo = 1) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const baseFreq = 523.25; // C5
    const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2]; // C5, E5, G5, C6
    const pitchShift = Math.min(1 + (combo - 1) * 0.1, 1.6);

    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (this.ctx) {
          try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq * pitchShift, this.ctx.currentTime);

            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.35);
          } catch (e) {}
        }
      }, idx * 60);
    });
  }

  // Card Mismatch / Wrong Note (Low soft thud)
  playMismatch() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }

  // Simon Says Sound (Clear bell-like pure tone)
  playSimonTone(freq, duration = 0.35) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  // Simon Level Up / Round Clear
  playRoundClear() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const chords = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    chords.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.2, 0.22);
      }, idx * 70);
    });
  }

  // Victory / Game Complete Fanfare
  playGameWin() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const melody = [
      { freq: 523.25, delay: 0, dur: 0.15 },
      { freq: 523.25, delay: 150, dur: 0.15 },
      { freq: 523.25, delay: 300, dur: 0.15 },
      { freq: 659.25, delay: 450, dur: 0.3 },
      { freq: 783.99, delay: 750, dur: 0.2 },
      { freq: 1046.5, delay: 950, dur: 0.6 }
    ];

    melody.forEach(item => {
      setTimeout(() => {
        this.playTone(item.freq, 'sine', item.dur, 0.3);
      }, item.delay);
    });
  }

  // Game Over Sound
  playGameOver() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [392.00, 349.23, 329.63, 261.63];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sawtooth', 0.25, 0.2);
      }, idx * 120);
    });
  }
}

export const memoryAudio = new MemoryAudioEngine();
