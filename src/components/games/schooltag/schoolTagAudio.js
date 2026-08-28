// Dochon Games Portal - School Tag Web Audio Procedural Synthesizer
// 100% Zero-External-Asset Audio Engine (Heartbeat, Flashlight, Steps, Jingle, Siren)

class SchoolTagAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.heartbeatTimer = null;
    this.heartbeatIntervalMs = 1200;
    this.heartbeatVolume = 0;
    this.isHeartbeatActive = false;
  }

  _initContext() {
    if (!this.ctx) {
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
    if (muted) {
      this.stopHeartbeat();
    }
  }

  // 1. Flashlight On/Off Click (Tactile Switch)
  playFlashlightClick() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // 2. Soft/Loud Footstep
  playFootstep(isRunning = false) {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    const baseFreq = isRunning ? 160 : 110;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isRunning ? 600 : 350, now);

    const vol = isRunning ? 0.25 : 0.12;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // 3. Dynamic Heartbeat Loop (Thump-Thump depending on tagger proximity)
  updateHeartbeat(distance, maxDist = 320) {
    if (this.isMuted) {
      this.stopHeartbeat();
      return;
    }

    if (distance > maxDist || distance <= 0) {
      this.stopHeartbeat();
      return;
    }

    this._initContext();
    if (!this.ctx) return;

    // Normalize proximity: 0 (furthest) to 1 (closest)
    const proximity = Math.max(0, Math.min(1, 1 - (distance / maxDist)));
    
    // Interval ranges from 1100ms (slow calm thump) down to 360ms (panicked rapid pounding)
    this.heartbeatIntervalMs = Math.max(340, Math.floor(1100 - proximity * 740));
    // Volume from 0.1 to 0.75
    this.heartbeatVolume = 0.15 + proximity * 0.6;

    if (!this.isHeartbeatActive) {
      this.isHeartbeatActive = true;
      this._scheduleNextHeartbeat();
    }
  }

  _scheduleNextHeartbeat() {
    if (!this.isHeartbeatActive || this.isMuted) return;

    this._playSingleHeartbeatThump();

    this.heartbeatTimer = setTimeout(() => {
      this._scheduleNextHeartbeat();
    }, this.heartbeatIntervalMs);
  }

  _playSingleHeartbeatThump() {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;

    // Sub-bass First Thump (Lub)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(65, now);
    osc1.frequency.exponentialRampToValueAtTime(32, now + 0.12);
    gain1.gain.setValueAtTime(this.heartbeatVolume, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.14);

    // Second Thump (Dub - slightly delayed and softer)
    const t2 = now + 0.16;
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(75, t2);
    osc2.frequency.exponentialRampToValueAtTime(36, t2 + 0.1);
    gain2.gain.setValueAtTime(this.heartbeatVolume * 0.7, t2);
    gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.11);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(t2);
    osc2.stop(t2 + 0.12);
  }

  stopHeartbeat() {
    this.isHeartbeatActive = false;
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // 4. Golden Key Collect Jingle (Bright Crystal Chime)
  playKeyCollect() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.45);
    });
  }

  // 5. Emergency Gate Unlocked Siren (Wailing Alarm)
  playGateAlarm() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.3);
    osc.frequency.linearRampToValueAtTime(400, now + 0.6);
    osc.frequency.linearRampToValueAtTime(800, now + 0.9);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.15);
  }

  // 6. Locker In/Out Rustle
  playLockerRustle() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // 7. Tagged Jumpscare (Abrupt Dissonance)
  playTagJumpscare() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [220, 233, 440, 466].forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    });
  }

  // 8. Teammate Rescued Chime
  playRescue() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [440, 554.37, 659.25].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0.25, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.4);
    });
  }

  // 9. Win Fanfare
  playWinFanfare() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    const melody = [
      { f: 523.25, d: 0.15 },
      { f: 659.25, d: 0.15 },
      { f: 783.99, d: 0.15 },
      { f: 1046.5, d: 0.5 },
    ];
    let curTime = this.ctx.currentTime;

    melody.forEach((note) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, curTime);

      gain.gain.setValueAtTime(0.3, curTime);
      gain.gain.exponentialRampToValueAtTime(0.001, curTime + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(curTime);
      osc.stop(curTime + note.d + 0.05);
      curTime += note.d;
    });
  }

  // 10. Game Over Sound
  playGameOver() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    const chords = [392.0, 369.99, 329.63, 293.66];
    let curTime = this.ctx.currentTime;

    chords.forEach((f) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, curTime);

      gain.gain.setValueAtTime(0.2, curTime);
      gain.gain.exponentialRampToValueAtTime(0.001, curTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(curTime);
      osc.stop(curTime + 0.4);
      curTime += 0.25;
    });
  }
}

export const schoolTagAudio = new SchoolTagAudioEngine();
