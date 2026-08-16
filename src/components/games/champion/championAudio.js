// Procedural 16-Bit Retro Web Audio API Sound Synthesizer for Champion Island

class ChampionSoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isBgmPlaying = false;
    this.bgmTimer = null;
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
    if (muted) {
      this.stopBGM();
    }
  }

  playTone(freq, type = 'square', duration = 0.1, gainValue = 0.1, pitchDecay = 0) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(freq, now);
      if (pitchDecay !== 0) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + pitchDecay), now + duration);
      }

      gain.gain.setValueAtTime(gainValue, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  }

  // Step / Footstep
  playStep() {
    this.playTone(180 + Math.random() * 40, 'triangle', 0.04, 0.03, -60);
  }

  // Talk / Dialogue Beep
  playTalk() {
    this.playTone(440 + Math.random() * 120, 'sine', 0.05, 0.05, 50);
  }

  // Enter Sport Arena Whistle
  playWhistle() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(1200, now + 0.08);
      osc.frequency.setValueAtTime(800, now + 0.16);
      osc.frequency.setValueAtTime(1400, now + 0.24);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  // Ping Pong Hit & Smash
  playPingPongHit(isSmash = false) {
    if (isSmash) {
      this.playTone(880, 'square', 0.15, 0.15, -400);
      setTimeout(() => this.playTone(1100, 'triangle', 0.1, 0.1, -300), 50);
    } else {
      this.playTone(520 + Math.random() * 80, 'sine', 0.08, 0.12, 100);
    }
  }

  // Archery Shoot & Hit
  playArrowShoot() {
    this.playTone(700, 'triangle', 0.12, 0.08, -500);
  }

  playArrowHit(score = 10) {
    if (score >= 50) {
      // Bullseye chime
      this.playTone(1046.5, 'sine', 0.18, 0.15, 0); // C6
      setTimeout(() => this.playTone(1318.5, 'sine', 0.22, 0.18, 0), 80); // E6
      setTimeout(() => this.playTone(1567.98, 'sine', 0.3, 0.2, 0), 160); // G6
    } else {
      this.playTone(320, 'square', 0.1, 0.1, -150);
    }
  }

  // Marathon Splash & Boost
  playSplash() {
    this.playTone(180, 'sawtooth', 0.15, 0.08, -100);
  }

  playBoost() {
    this.playTone(400, 'sine', 0.2, 0.12, 600);
    setTimeout(() => this.playTone(800, 'sine', 0.25, 0.15, 400), 100);
  }

  // Climbing Grab & Rock Crash
  playClimbGrab() {
    this.playTone(440, 'triangle', 0.08, 0.08, 80);
  }

  playRockHit() {
    this.playTone(120, 'sawtooth', 0.25, 0.2, -80);
  }

  // Sacred Scroll Collected Fanfare!
  playScrollWin() {
    if (this.isMuted) return;
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 'square', 0.2, 0.12, 0);
      }, i * 90);
    });
  }

  // Victory / Game Complete Fanfare
  playGameVictory() {
    if (this.isMuted) return;
    this.init();
    const melody = [
      { f: 523.25, d: 0.15 },
      { f: 523.25, d: 0.15 },
      { f: 523.25, d: 0.15 },
      { f: 659.25, d: 0.3 },
      { f: 783.99, d: 0.2 },
      { f: 1046.5, d: 0.6 }
    ];
    let time = 0;
    melody.forEach(m => {
      setTimeout(() => {
        this.playTone(m.f, 'triangle', m.d, 0.15, 0);
      }, time);
      time += m.d * 1000 * 0.9;
    });
  }

  // Game Over Tone
  playGameOver() {
    this.playTone(350, 'sawtooth', 0.3, 0.15, -120);
    setTimeout(() => this.playTone(260, 'sawtooth', 0.4, 0.15, -100), 250);
    setTimeout(() => this.playTone(180, 'sawtooth', 0.6, 0.18, -80), 600);
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.isBgmPlaying = false;
  }
}

export const championAudio = new ChampionSoundManager();
