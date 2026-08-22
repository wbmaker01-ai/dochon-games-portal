// Web Audio API Procedural Synthesizer for Dochon Pangolin Adventure

class PangolinAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.lastRollTime = 0;
    this.bgmTimer = null;
    this.isBgmPlaying = false;
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

  // 1. Roll / Dash Sound (휘익- 데굴데굴 구르는 회전음)
  playRoll() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    if (now - this.lastRollTime < 0.12) return;
    this.lastRollTime = now;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // 2. Jump Sound (뿅- 통통 튀는 점프)
  playJump() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.15);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // 3. Spring Booster Jump (용수철 버섯 슈퍼 도약음)
  playSpring() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.28);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  // 4. Collect Item Sound (챠링- 맑은 화음)
  playCollect(isSpecial = false) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = isSpecial ? [523.25, 659.25, 783.99, 1046.5] : [587.33, 880.0];

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.12, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.04 + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.18);
    });
  }

  // 5. Combo Sound (연속 수집 시 도-미-솔-도 계단식 상승)
  playCombo(comboCount = 1) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const baseNotes = [440, 493.88, 554.37, 587.33, 659.25, 739.99, 830.61, 880];
    const noteIdx = Math.min(comboCount - 1, baseNotes.length - 1);
    const freq = baseNotes[noteIdx];

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // 6. Hit / Obstacle Collision (둔탁한 충돌음)
  playHit() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.18);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // 7. Stage Clear Fanfare (스테이지 클리어 팡파레)
  playStageClear() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [
      { f: 523.25, d: 0.12 }, // C5
      { f: 659.25, d: 0.12 }, // E5
      { f: 783.99, d: 0.12 }, // G5
      { f: 1046.5, d: 0.35 }  // C6
    ];

    let t = this.ctx.currentTime;
    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + n.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + n.d);
      t += n.d * 0.9;
    });
  }

  // 8. Final Victory Fanfare (최종 엔딩 대형 축하 징글)
  playVictoryFanfare() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [
      { f: 523.25, d: 0.12 },
      { f: 587.33, d: 0.12 },
      { f: 659.25, d: 0.12 },
      { f: 783.99, d: 0.18 },
      { f: 659.25, d: 0.12 },
      { f: 783.99, d: 0.15 },
      { f: 1046.5, d: 0.5 }
    ];

    let t = this.ctx.currentTime;
    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, t);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + n.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + n.d);
      t += n.d * 0.85;
    });
  }

  // 9. Playful BGM Melody Sequencer
  startBGM(stageId = 1) {
    if (this.isMuted || this.isBgmPlaying) return;
    this.init();
    if (!this.ctx) return;

    this.isBgmPlaying = true;
    const stageScales = {
      1: [261.63, 329.63, 392.0, 440.0, 523.25], // C Major Pentatonic (Ghana)
      2: [293.66, 369.99, 440.0, 554.37, 587.33], // D Mixolydian (India)
      3: [329.63, 392.0, 440.0, 493.88, 659.25],  // E Minor Pentatonic (China)
      4: [349.23, 440.0, 523.25, 587.33, 698.46]  // F Lydian (Philippines)
    };

    const scale = stageScales[stageId] || stageScales[1];
    let step = 0;

    const playBgmTick = () => {
      if (!this.isBgmPlaying || this.isMuted || !this.ctx) return;

      const now = this.ctx.currentTime;
      const freq = scale[step % scale.length];

      // Soft bass / chord pulse
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq / 2, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);

      step++;
      this.bgmTimer = setTimeout(playBgmTick, 380);
    };

    playBgmTick();
  }

  stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const pangolinAudio = new PangolinAudio();
