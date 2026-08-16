// Game Logic, Bullet-Hell Patterns, Physics, and Web Audio Synthesizer for Popcorn Survival

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PAN_CENTER_X,
  PAN_CENTER_Y,
  PAN_RADIUS,
  GRAZE_DISTANCE,
  GRAZE_SCORE,
  ITEM_TYPES
} from './popcornConstants';

// --- Web Audio API Sound Synthesizer ---
class SoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
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

  playPop() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160 + Math.random() * 200, now);
      osc.frequency.exponentialRampToValueAtTime(800 + Math.random() * 400, now + 0.04);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  playHit() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {}
  }

  playShield() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } catch (e) {}
  }

  playHeal() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.2, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.22);
      });
    } catch (e) {}
  }

  playDash() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.18);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  }

  playItem() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.12);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) {}
  }

  playGraze() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200 + Math.random() * 300, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  playBossRoar() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.4);
      osc.frequency.linearRampToValueAtTime(40, now + 0.8);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.9);
    } catch (e) {}
  }

  playVictory() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.3, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.4);
      });
    } catch (e) {}
  }

  playGameOver() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [440, 392, 349.23, 261.63];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.18);
        gain.gain.setValueAtTime(0.3, now + idx * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.18 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.18);
        osc.stop(now + idx * 0.18 + 0.28);
      });
    } catch (e) {}
  }
}

export const soundManager = new SoundManager();

// --- Particle Engine ---
export class Particle {
  constructor(x, y, vx, vy, color, radius, life, maxLife, shape = 'circle') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.radius = radius;
    this.life = life;
    this.maxLife = maxLife;
    this.shape = shape; // 'circle' | 'star' | 'heart' | 'smoke'
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    if (this.shape === 'circle' || this.shape === 'smoke') {
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.shape === 'heart') {
      // Draw small heart
      const size = this.radius * 1.5;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.bezierCurveTo(this.x - size / 2, this.y - size / 2, this.x - size, this.y + size / 3, this.x, this.y + size);
      ctx.bezierCurveTo(this.x + size, this.y + size / 3, this.x + size / 2, this.y - size / 2, this.x, this.y);
      ctx.fill();
    }
    ctx.restore();
  }
}

// --- Bullet Entity ---
export class Bullet {
  constructor(x, y, vx, vy, radius = 7, color = '#F59E0B', type = 'butter', damage = 1) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.color = color;
    this.type = type; // 'butter' | 'flame' | 'laser' | 'seed'
    this.damage = damage;
    this.grazed = false;
    this.age = 0;
  }

  update(speedMultiplier = 1.0) {
    this.x += this.vx * speedMultiplier;
    this.y += this.vy * speedMultiplier;
    this.age++;
  }

  isOutOfBounds() {
    return (
      this.x < -40 ||
      this.x > CANVAS_WIDTH + 40 ||
      this.y < -40 ||
      this.y > CANVAS_HEIGHT + 40
    );
  }

  draw(ctx) {
    ctx.save();
    if (this.type === 'butter') {
      // Golden glowing melting butter droplet
      ctx.shadowColor = '#FBBF24';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner highlight
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'flame') {
      // Fiery glowing fireball
      ctx.shadowColor = '#EF4444';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Flame core
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// --- Item Entity ---
export class GameItem {
  constructor(typeConfig, x, y) {
    this.id = Math.random().toString();
    this.type = typeConfig;
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.createdAt = Date.now();
    this.duration = typeConfig.duration || 8000;
    this.floatAngle = Math.random() * Math.PI * 2;
  }

  isExpired() {
    return Date.now() - this.createdAt > this.duration;
  }

  draw(ctx) {
    this.floatAngle += 0.05;
    const offsetY = Math.sin(this.floatAngle) * 4;
    const drawY = this.y + offsetY;

    ctx.save();
    ctx.shadowColor = this.type.color;
    ctx.shadowBlur = 10;

    // Glowing background bubble
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(this.x, drawY, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = this.type.color;
    ctx.stroke();

    // Emoji or symbol icon
    ctx.font = '16px "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (this.type.id === 'heart') {
      ctx.fillText('❤️', this.x, drawY);
    } else if (this.type.id === 'salt') {
      ctx.fillText('💎', this.x, drawY);
    } else if (this.type.id === 'ice') {
      ctx.fillText('❄️', this.x, drawY);
    }
    ctx.restore();
  }
}

// --- Bullet Spawner Utility Functions ---
export function createRingPattern(originX, originY, count, speed, type = 'butter', bulletRadius = 7) {
  const bullets = [];
  const angleStep = (Math.PI * 2) / count;
  const offset = Math.random() * Math.PI;
  for (let i = 0; i < count; i++) {
    const angle = i * angleStep + offset;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    bullets.push(new Bullet(originX, originY, vx, vy, bulletRadius, type === 'flame' ? '#EF4444' : '#F59E0B', type));
  }
  return bullets;
}

export function createSpiralPattern(originX, originY, currentAngle, arms, speed, type = 'flame') {
  const bullets = [];
  const angleStep = (Math.PI * 2) / arms;
  for (let i = 0; i < arms; i++) {
    const angle = currentAngle + i * angleStep;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    bullets.push(new Bullet(originX, originY, vx, vy, 7.5, '#EF4444', type));
  }
  return bullets;
}

export function createAimedSpread(originX, originY, targetX, targetY, count, spreadAngleRad, speed, type = 'butter') {
  const bullets = [];
  const baseAngle = Math.atan2(targetY - originY, targetX - originX);
  const startAngle = baseAngle - spreadAngleRad / 2;
  const step = count > 1 ? spreadAngleRad / (count - 1) : 0;

  for (let i = 0; i < count; i++) {
    const angle = startAngle + i * step;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    bullets.push(new Bullet(originX, originY, vx, vy, 8, '#F59E0B', type));
  }
  return bullets;
}

// --- Clamp Player Position inside Pan Circle ---
export function clampToPanArena(x, y, playerRadius = 18) {
  const dx = x - PAN_CENTER_X;
  const dy = y - PAN_CENTER_Y;
  const dist = Math.hypot(dx, dy);
  const maxRadius = PAN_RADIUS - playerRadius;

  if (dist > maxRadius) {
    const angle = Math.atan2(dy, dx);
    return {
      x: PAN_CENTER_X + Math.cos(angle) * maxRadius,
      y: PAN_CENTER_Y + Math.sin(angle) * maxRadius
    };
  }
  return { x, y };
}

// --- Spawn Random Item inside Pan Arena ---
export function generateRandomItem() {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.random() * (PAN_RADIUS - 50);
  const x = PAN_CENTER_X + Math.cos(angle) * r;
  const y = PAN_CENTER_Y + Math.sin(angle) * r;

  const rand = Math.random();
  let type = ITEM_TYPES.SALT;
  if (rand < 0.35) {
    type = ITEM_TYPES.HEART;
  } else if (rand < 0.65) {
    type = ITEM_TYPES.ICE;
  }

  return new GameItem(type, x, y);
}
