/**
 * Dochon Sky Jumper - Physics Engine & Canvas Procedural Renderer
 */

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_CONFIG,
  PLATFORM_CONFIG,
  PLATFORM_TYPES,
  ITEM_TYPES,
  MONSTER_TYPES,
  ALTITUDE_THEMES
} from './skyJumperConstants';
import { skyJumperAudio } from './skyJumperAudio';

export class SkyJumperPhysics {
  constructor(callbacks = {}) {
    this.onScoreAdd = callbacks.onScoreAdd || (() => {});
    this.onGameOver = callbacks.onGameOver || (() => {});
    this.onMilestone = callbacks.onMilestone || (() => {});
    this.onItemCollect = callbacks.onItemCollect || (() => {});

    this.reset();
  }

  reset() {
    // Player State
    this.player = {
      x: CANVAS_WIDTH / 2 - PLAYER_CONFIG.WIDTH / 2,
      y: CANVAS_HEIGHT - 100 - PLAYER_CONFIG.HEIGHT,
      vx: 0,
      vy: 0,
      width: PLAYER_CONFIG.WIDTH,
      height: PLAYER_CONFIG.HEIGHT,
      facing: 'right',
      powerup: null, // { type, endTime }
      hasShield: false,
      lastShootTime: 0,
      squash: 1.0, // For jump squash/stretch animation
      isDead: false
    };

    // Game Progression States
    this.score = 0;
    this.maxAltitude = 0;
    this.highestPlatformY = CANVAS_HEIGHT - 30;
    this.lastMilestonePassed = 0;
    this.milestonePopup = null; // { text, timer }

    // World Entities
    this.platforms = [];
    this.items = [];
    this.monsters = [];
    this.blackHoles = [];
    this.bullets = [];
    this.particles = [];
    this.floatingTexts = [];

    // Background Elements
    this.clouds = this.initClouds();
    this.stars = this.initStars();
    this.shootingStars = [];

    // Controls
    this.keys = { left: false, right: false };
    this.pointerTargetX = null;

    // Platform ID Counter
    this.nextEntityId = 1;

    // Generate Initial World
    this.initWorld();
  }

  // Launch the initial jump when countdown reaches GO!
  launchInitialJump() {
    this.player.vy = PLAYER_CONFIG.NORMAL_JUMP_VY;
    this.player.squash = 0.65;
    skyJumperAudio.playJump();
    this.spawnJumpParticles(this.player.x + this.player.width / 2, CANVAS_HEIGHT - 100);
  }

  initClouds() {
    const clouds = [];
    for (let i = 0; i < 8; i++) {
      clouds.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        radius: 20 + Math.random() * 25,
        speed: 0.15 + Math.random() * 0.35
      });
    }
    return clouds;
  }

  initStars() {
    const stars = [];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: 0.8 + Math.random() * 2.2,
        twinkleSpeed: 0.02 + Math.random() * 0.05,
        twinklePhase: Math.random() * Math.PI * 2,
        baseAlpha: 0.3 + Math.random() * 0.7
      });
    }
    return stars;
  }

  initWorld() {
    // 1. Starting platform right below the player
    this.platforms.push({
      id: this.nextEntityId++,
      x: CANVAS_WIDTH / 2 - PLATFORM_CONFIG.WIDTH / 2,
      y: CANVAS_HEIGHT - 100,
      width: PLATFORM_CONFIG.WIDTH,
      height: PLATFORM_CONFIG.HEIGHT,
      type: 'regular',
      vx: 0,
      vy: 0,
      initialY: CANVAS_HEIGHT - 100,
      dir: 1,
      isBroken: false,
      brokenTime: 0,
      hasDisappeared: false,
      item: null
    });

    // 2. Procedurally generate initial platforms up to the top
    let currentY = CANVAS_HEIGHT - 100;
    while (currentY > -100) {
      currentY -= PLATFORM_CONFIG.MIN_Y_GAP + Math.random() * (PLATFORM_CONFIG.MAX_Y_GAP - PLATFORM_CONFIG.MIN_Y_GAP);
      this.spawnPlatformAt(currentY);
    }
    this.highestPlatformY = currentY;
  }

  spawnPlatformAt(y) {
    const alt = this.maxAltitude;
    const x = Math.max(10, Math.min(CANVAS_WIDTH - PLATFORM_CONFIG.WIDTH - 10, Math.random() * (CANVAS_WIDTH - PLATFORM_CONFIG.WIDTH)));

    // Choose Platform Type according to altitude
    let type = 'regular';
    const rand = Math.random();

    if (alt > 8000) {
      if (rand < 0.28) type = 'moving';
      else if (rand < 0.48) type = 'disappearing';
      else if (rand < 0.65) type = 'broken';
      else if (rand < 0.80) type = 'vertical';
      else if (rand < 0.90) type = 'cloud';
    } else if (alt > 4000) {
      if (rand < 0.32) type = 'moving';
      else if (rand < 0.50) type = 'broken';
      else if (rand < 0.68) type = 'disappearing';
      else if (rand < 0.82) type = 'vertical';
    } else if (alt > 1500) {
      if (rand < 0.30) type = 'moving';
      else if (rand < 0.48) type = 'broken';
      else if (rand < 0.62) type = 'cloud';
    } else if (alt > 500) {
      if (rand < 0.22) type = 'moving';
      else if (rand < 0.35) type = 'broken';
    }

    const platform = {
      id: this.nextEntityId++,
      x,
      y,
      width: PLATFORM_CONFIG.WIDTH,
      height: PLATFORM_CONFIG.HEIGHT,
      type,
      vx: type === 'moving' ? (Math.random() > 0.5 ? 2.2 : -2.2) : 0,
      vy: type === 'vertical' ? 1.5 : 0,
      initialY: y,
      verticalDir: 1,
      isBroken: false,
      brokenTime: 0,
      hasDisappeared: false,
      item: null
    };

    // Item Spawning (Only on solid non-broken platforms)
    if (type !== 'broken' && type !== 'disappearing') {
      const itemRand = Math.random();
      if (itemRand < 0.04) {
        platform.item = { type: 'rocket', id: this.nextEntityId++ };
      } else if (itemRand < 0.09) {
        platform.item = { type: 'propeller', id: this.nextEntityId++ };
      } else if (itemRand < 0.16) {
        platform.item = { type: 'trampoline', id: this.nextEntityId++ };
      } else if (itemRand < 0.28) {
        platform.item = { type: 'spring', id: this.nextEntityId++, state: 'normal' };
      } else if (itemRand < 0.34) {
        platform.item = { type: 'shield', id: this.nextEntityId++ };
      } else if (itemRand < 0.45) {
        platform.item = { type: 'star', id: this.nextEntityId++ };
      }
    }

    this.platforms.push(platform);

    // Monster / Obstacle Spawning
    if (alt > 1200 && Math.random() < 0.12 && this.monsters.length < 3) {
      const monsterType = alt > 3500 && Math.random() < 0.35 ? 'black_hole' : 'flying';
      if (monsterType === 'flying') {
        this.monsters.push({
          id: this.nextEntityId++,
          type: 'flying',
          x: Math.random() * (CANVAS_WIDTH - 60) + 10,
          y: y - 55 - Math.random() * 40,
          width: MONSTER_TYPES.FLYING.width,
          height: MONSTER_TYPES.FLYING.height,
          vx: Math.random() > 0.5 ? 1.4 : -1.4,
          baseY: y - 55,
          flyTimer: Math.random() * Math.PI * 2,
          isDead: false
        });
      } else {
        this.blackHoles.push({
          id: this.nextEntityId++,
          x: Math.random() * (CANVAS_WIDTH - 100) + 50,
          y: y - 70,
          radius: MONSTER_TYPES.BLACK_HOLE.radius,
          pullRadius: MONSTER_TYPES.BLACK_HOLE.pullRadius,
          angle: 0
        });
      }
    }
  }

  // Update Game Loop (dt: Delta Time in ms)
  update(timestamp, dt = 16.66) {
    if (this.player.isDead) return;

    const timeScale = Math.min(2.5, Math.max(0.2, dt / 16.666));
    const p = this.player;

    // 1. Check Powerup Timers
    if (p.powerup) {
      if (timestamp >= p.powerup.endTime) {
        if (p.powerup.type === 'rocket') skyJumperAudio.stopRocketSound();
        if (p.powerup.type === 'propeller') skyJumperAudio.stopPropellerSound();
        p.powerup = null;
      }
    }

    // 2. Horizontal Movement (Keyboard & Touch Pointer)
    let moveDir = 0;
    const isKeyboardActive = this.keys.left || this.keys.right;

    if (isKeyboardActive) {
      // Keyboard input has absolute priority
      if (this.keys.left) moveDir -= 1;
      if (this.keys.right) moveDir += 1;
      this.pointerTargetX = null; // Clear pointer target so it doesn't fight keyboard
    } else if (this.pointerTargetX !== null) {
      const pCenterX = p.x + p.width / 2;
      const dx = this.pointerTargetX - pCenterX;
      if (Math.abs(dx) > 12) {
        moveDir = dx > 0 ? 1 : -1;
      }
    }

    if (moveDir !== 0) {
      p.vx += moveDir * PLAYER_CONFIG.ACCELERATION * timeScale;
      p.vx = Math.max(-PLAYER_CONFIG.MOVE_SPEED, Math.min(PLAYER_CONFIG.MOVE_SPEED, p.vx));
      p.facing = moveDir > 0 ? 'right' : 'left';
    } else {
      p.vx *= Math.pow(PLAYER_CONFIG.FRICTION, timeScale);
      if (Math.abs(p.vx) < 0.1) p.vx = 0;
    }

    p.x += p.vx * timeScale;

    // Wrap-around screen
    if (p.x < -p.width / 2) {
      p.x = CANVAS_WIDTH - p.width / 2;
    } else if (p.x > CANVAS_WIDTH - p.width / 2) {
      p.x = -p.width / 2;
    }

    // 3. Vertical Movement & Gravity
    if (p.powerup) {
      if (p.powerup.type === 'rocket') {
        p.vy = PLAYER_CONFIG.ROCKET_VY;
        // Spawn rocket thruster fire particles
        this.spawnRocketParticles(p.x + p.width / 2, p.y + p.height);
      } else if (p.powerup.type === 'propeller') {
        p.vy = PLAYER_CONFIG.PROPELLER_VY;
        this.spawnPropellerParticles(p.x + p.width / 2, p.y);
      }
    } else {
      p.vy += PLAYER_CONFIG.GRAVITY * timeScale;
      if (p.vy > PLAYER_CONFIG.MAX_FALL_SPEED) {
        p.vy = PLAYER_CONFIG.MAX_FALL_SPEED;
      }
    }

    p.y += p.vy * timeScale;

    // Squash & stretch recovery
    if (p.squash !== 1.0) {
      p.squash += (1.0 - p.squash) * Math.min(1, 0.15 * timeScale);
    }

    // 4. Platform Updates & Collisions
    this.updatePlatforms(timestamp, timeScale);

    // 5. Monster & Obstacle Updates & Collisions
    this.updateMonsters(timestamp, timeScale);

    // 6. Black Hole Updates & Collisions
    this.updateBlackHoles(timeScale);

    // 7. Bullets Updates
    this.updateBullets(timeScale);

    // 8. Particles & Visual Effects
    this.updateParticles(timeScale);

    // 9. Camera Scrolling & Altitude Tracking
    this.handleCameraScroll();

    // 10. Check Milestone Alerts
    this.checkMilestones();

    // 11. Check Death / Fall Below Screen
    if (p.y > CANVAS_HEIGHT + 30) {
      this.triggerGameOver('추락');
    }
  }

  updatePlatforms(timestamp, timeScale = 1) {
    const p = this.player;

    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const plat = this.platforms[i];

      // Update Moving Platform
      if (plat.type === 'moving') {
        plat.x += plat.vx * timeScale;
        if (plat.x <= 5 || plat.x + plat.width >= CANVAS_WIDTH - 5) {
          plat.vx = -plat.vx;
        }
      }

      // Update Vertical Platform
      if (plat.type === 'vertical') {
        plat.y += plat.vy * plat.verticalDir * timeScale;
        if (Math.abs(plat.y - plat.initialY) > PLATFORM_TYPES.VERTICAL.range) {
          plat.verticalDir *= -1;
        }
      }

      // Update Broken Platform falling animation
      if (plat.isBroken) {
        plat.brokenTime += 1 * timeScale;
        plat.y += plat.brokenTime * 0.6 * timeScale;
      }

      // Disappearing Platform visibility phase
      let isVisible = true;
      if (plat.type === 'disappearing') {
        const cycle = PLATFORM_TYPES.DISAPPEARING.cycleMs;
        const phase = (timestamp + plat.id * 300) % cycle;
        isVisible = phase < cycle * 0.65;
        plat.hasDisappeared = !isVisible;
      }

      // Collision Check: Only collide when falling downwards (vy > 0)
      if (p.vy > 0 && !p.powerup && !plat.isBroken && isVisible) {
        const playerBottom = p.y + p.height;
        const prevPlayerBottom = playerBottom - p.vy;
        const platTop = plat.y;

        // Bounding box collision for landing on top
        if (
          p.x + p.width * 0.75 > plat.x &&
          p.x + p.width * 0.25 < plat.x + plat.width &&
          playerBottom >= platTop &&
          prevPlayerBottom <= platTop + 14
        ) {
          // Landing logic
          if (plat.type === 'broken') {
            plat.isBroken = true;
            skyJumperAudio.playBrokenPlatform();
            this.spawnPlatformBrokenParticles(plat.x + plat.width / 2, plat.y);
          } else {
            // Check Item Interaction on the platform
            let jumpedWithItem = false;
            if (plat.item) {
              jumpedWithItem = this.handleItemInteraction(plat.item, plat);
            }

            if (!jumpedWithItem) {
              p.vy = PLAYER_CONFIG.NORMAL_JUMP_VY;
              p.squash = 0.65;
              skyJumperAudio.playJump();
              this.spawnJumpParticles(p.x + p.width / 2, plat.y);
            }

            // If 1-use cloud platform, remove after jump
            if (plat.type === 'cloud') {
              this.spawnPlatformBrokenParticles(plat.x + plat.width / 2, plat.y, '#FFFFFF');
              this.platforms.splice(i, 1);
            }
          }
        }
      }
    }
  }

  handleItemInteraction(item, plat) {
    const p = this.player;

    if (item.type === 'spring') {
      p.vy = PLAYER_CONFIG.SPRING_JUMP_VY;
      p.squash = 0.5;
      item.state = 'expanded';
      skyJumperAudio.playSpringJump();
      this.spawnJumpParticles(p.x + p.width / 2, plat.y, '#FBBF24', 12);
      this.addFloatingText('🌀 SUPER JUMP!', p.x, p.y - 20, '#FBBF24');
      return true;
    } else if (item.type === 'trampoline') {
      p.vy = PLAYER_CONFIG.TRAMPOLINE_JUMP_VY;
      p.squash = 0.4;
      skyJumperAudio.playTrampolineJump();
      this.spawnJumpParticles(p.x + p.width / 2, plat.y, '#EC4899', 16);
      this.addFloatingText('🎪 MEGA BOUNCE!', p.x, p.y - 20, '#EC4899');
      return true;
    } else if (item.type === 'propeller') {
      p.powerup = {
        type: 'propeller',
        endTime: performance.now() + PLAYER_CONFIG.PROPELLER_DURATION
      };
      plat.item = null;
      skyJumperAudio.playItemPick();
      skyJumperAudio.startPropellerSound();
      this.addFloatingText('🧢 PROPELLER HAT!', p.x, p.y - 20, '#38BDF8');
      this.onItemCollect('propeller');
      return true;
    } else if (item.type === 'rocket') {
      p.powerup = {
        type: 'rocket',
        endTime: performance.now() + PLAYER_CONFIG.ROCKET_DURATION
      };
      plat.item = null;
      skyJumperAudio.playItemPick();
      skyJumperAudio.startRocketSound();
      this.addFloatingText('🚀 ROCKET JETPACK!', p.x, p.y - 20, '#EF4444');
      this.onItemCollect('rocket');
      return true;
    } else if (item.type === 'shield') {
      p.hasShield = true;
      plat.item = null;
      skyJumperAudio.playItemPick();
      this.addFloatingText('🛡️ SHIELD ACTIVE!', p.x, p.y - 20, '#60A5FA');
      this.onItemCollect('shield');
      return false;
    } else if (item.type === 'star') {
      this.addScore(ITEM_TYPES.STAR.points);
      plat.item = null;
      skyJumperAudio.playItemPick();
      this.addFloatingText(`⭐ +${ITEM_TYPES.STAR.points}`, p.x, p.y - 20, '#FDE047');
      this.spawnStarParticles(p.x + p.width / 2, p.y);
      return false;
    }
    return false;
  }

  updateMonsters(timestamp, timeScale = 1) {
    const p = this.player;

    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      if (m.isDead) continue;

      // Floating sine wave animation
      m.flyTimer += 0.04 * timeScale;
      m.x += m.vx * timeScale;
      m.y = m.baseY + Math.sin(m.flyTimer) * 16;

      if (m.x < 10 || m.x + m.width > CANVAS_WIDTH - 10) {
        m.vx = -m.vx;
      }

      // Check Collision with Player
      const pBox = { left: p.x + 6, right: p.x + p.width - 6, top: p.y + 6, bottom: p.y + p.height - 6 };
      const mBox = { left: m.x, right: m.x + m.width, top: m.y, bottom: m.y + m.height };

      if (
        pBox.right > mBox.left &&
        pBox.left < mBox.right &&
        pBox.bottom > mBox.top &&
        pBox.top < mBox.bottom
      ) {
        // If player has Rocket or falls onto monster from above
        if (p.powerup?.type === 'rocket' || (p.vy > 0 && p.y + p.height - p.vy <= m.y + 12)) {
          // Defeat monster
          m.isDead = true;
          p.vy = PLAYER_CONFIG.NORMAL_JUMP_VY;
          this.addScore(MONSTER_TYPES.FLYING.points);
          skyJumperAudio.playMonsterDefeat();
          this.spawnMonsterExplosion(m.x + m.width / 2, m.y + m.height / 2);
          this.addFloatingText(`👾 +${MONSTER_TYPES.FLYING.points}`, m.x, m.y, '#A855F7');
          this.monsters.splice(i, 1);
        } else if (p.hasShield) {
          // Shield blocks damage
          p.hasShield = false;
          m.isDead = true;
          skyJumperAudio.playShieldBlock();
          this.spawnMonsterExplosion(m.x + m.width / 2, m.y + m.height / 2, '#38BDF8');
          this.addFloatingText('🛡️ SHIELD SAVED!', p.x, p.y - 20, '#38BDF8');
          this.monsters.splice(i, 1);
        } else {
          // Player hit and dies
          this.triggerGameOver('몬스터와 충돌');
          return;
        }
      }
    }
  }

  updateBlackHoles(timeScale = 1) {
    const p = this.player;

    for (let i = this.blackHoles.length - 1; i >= 0; i--) {
      const bh = this.blackHoles[i];
      bh.angle += 0.06 * timeScale;

      const pCenterX = p.x + p.width / 2;
      const pCenterY = p.y + p.height / 2;
      const dx = bh.x - pCenterX;
      const dy = bh.y - pCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Gravitational Pull
      if (dist < bh.pullRadius && !p.powerup) {
        const pull = (1 - dist / bh.pullRadius) * MONSTER_TYPES.BLACK_HOLE.pullForce;
        p.x += (dx / dist) * pull * 10 * timeScale;
        p.y += (dy / dist) * pull * 10 * timeScale;
      }

      // Absorbed into Black Hole
      if (dist < bh.radius + 10) {
        if (p.powerup?.type === 'rocket') {
          // Rocket blasts through black hole
          this.blackHoles.splice(i, 1);
          skyJumperAudio.playMonsterDefeat();
          this.spawnMonsterExplosion(bh.x, bh.y, '#9333EA');
          this.addFloatingText('💥 BLACK HOLE DESTROYED!', bh.x, bh.y, '#A855F7');
        } else if (p.hasShield) {
          p.hasShield = false;
          this.blackHoles.splice(i, 1);
          skyJumperAudio.playShieldBlock();
          this.addFloatingText('🛡️ SHIELD SAVED!', p.x, p.y - 20, '#38BDF8');
        } else {
          this.triggerGameOver('블랙홀 흡수');
          return;
        }
      }
    }
  }

  // Shoot Bullet
  shoot() {
    if (this.player.isDead) return;
    const now = performance.now();
    if (now - this.player.lastShootTime < PLAYER_CONFIG.SHOOT_COOLDOWN) return;

    this.player.lastShootTime = now;
    this.bullets.push({
      x: this.player.x + this.player.width / 2,
      y: this.player.y - 4,
      vy: PLAYER_CONFIG.BULLET_SPEED,
      radius: 5
    });

    skyJumperAudio.playShoot();
  }

  updateBullets(timeScale = 1) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.y += b.vy * timeScale;

      // Check collision with monsters
      let bulletHit = false;
      for (let j = this.monsters.length - 1; j >= 0; j--) {
        const m = this.monsters[j];
        if (
          b.x > m.x &&
          b.x < m.x + m.width &&
          b.y > m.y &&
          b.y < m.y + m.height
        ) {
          m.isDead = true;
          bulletHit = true;
          this.addScore(MONSTER_TYPES.FLYING.points);
          skyJumperAudio.playMonsterDefeat();
          this.spawnMonsterExplosion(m.x + m.width / 2, m.y + m.height / 2);
          this.addFloatingText(`🎯 +${MONSTER_TYPES.FLYING.points}`, m.x, m.y, '#FBBF24');
          this.monsters.splice(j, 1);
          break;
        }
      }

      if (bulletHit || b.y < -20) {
        this.bullets.splice(i, 1);
      }
    }
  }

  handleCameraScroll() {
    const p = this.player;
    const scrollTargetY = 320;

    if (p.y < scrollTargetY) {
      const deltaY = scrollTargetY - p.y;
      p.y = scrollTargetY;

      // Increase Score / Altitude
      const points = Math.round(deltaY);
      this.addScore(points);
      this.maxAltitude += Math.round(deltaY / 1.5);

      // Shift world objects downwards
      this.highestPlatformY += deltaY;

      for (let plat of this.platforms) {
        plat.y += deltaY;
        plat.initialY += deltaY;
      }
      for (let m of this.monsters) {
        m.y += deltaY;
        m.baseY += deltaY;
      }
      for (let bh of this.blackHoles) {
        bh.y += deltaY;
      }
      for (let part of this.particles) {
        part.y += deltaY;
      }
      for (let txt of this.floatingTexts) {
        txt.y += deltaY;
      }

      // Parallax scroll for clouds and stars
      for (let cloud of this.clouds) {
        cloud.y += deltaY * 0.3;
        if (cloud.y > CANVAS_HEIGHT + 50) {
          cloud.y = -50;
          cloud.x = Math.random() * CANVAS_WIDTH;
        }
      }

      for (let star of this.stars) {
        star.y += deltaY * 0.1;
        if (star.y > CANVAS_HEIGHT) {
          star.y = 0;
          star.x = Math.random() * CANVAS_WIDTH;
        }
      }

      // Clean up fallen platforms & spawn new platforms above
      this.platforms = this.platforms.filter(plat => plat.y < CANVAS_HEIGHT + 60);
      this.monsters = this.monsters.filter(m => m.y < CANVAS_HEIGHT + 80);
      this.blackHoles = this.blackHoles.filter(bh => bh.y < CANVAS_HEIGHT + 100);

      while (this.highestPlatformY > -80) {
        this.highestPlatformY -= PLATFORM_CONFIG.MIN_Y_GAP + Math.random() * (PLATFORM_CONFIG.MAX_Y_GAP - PLATFORM_CONFIG.MIN_Y_GAP);
        this.spawnPlatformAt(this.highestPlatformY);
      }
    }
  }

  addScore(points) {
    this.score += points;
    this.onScoreAdd(points);
  }

  checkMilestones() {
    const milestones = [1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 30000, 50000];
    for (let ms of milestones) {
      if (this.score >= ms && this.lastMilestonePassed < ms) {
        this.lastMilestonePassed = ms;
        skyJumperAudio.playMilestone();
        this.milestonePopup = {
          text: `🎉 ${ms.toLocaleString()}m 고도 돌파!`,
          timer: 160
        };
        this.onMilestone(ms);
        break;
      }
    }
  }

  triggerGameOver(reason = '추락') {
    if (this.player.isDead) return;
    this.player.isDead = true;
    skyJumperAudio.playGameOver();
    this.onGameOver(reason, this.score);
  }

  // Particle & Effect Helpers
  spawnJumpParticles(x, y, color = '#22C55E', count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.PI + (Math.random() - 0.5) * 1.5;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        color,
        alpha: 1.0,
        decay: 0.05
      });
    }
  }

  spawnPlatformBrokenParticles(x, y, color = '#B45309') {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 40,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: -2 + Math.random() * 5,
        size: 4 + Math.random() * 4,
        color,
        alpha: 1.0,
        decay: 0.03
      });
    }
  }

  spawnRocketParticles(x, y) {
    for (let i = 0; i < 3; i++) {
      const colors = ['#EF4444', '#F97316', '#FDE047', '#94A3B8'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y + Math.random() * 6,
        vx: (Math.random() - 0.5) * 2,
        vy: 3 + Math.random() * 5,
        size: 4 + Math.random() * 5,
        color,
        alpha: 1.0,
        decay: 0.08
      });
    }
  }

  spawnPropellerParticles(x, y) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 16,
      y: y + 2,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 1.5 + Math.random() * 2,
      size: 2.5 + Math.random() * 2,
      color: '#E0F2FE',
      alpha: 0.7,
      decay: 0.09
    });
  }

  spawnMonsterExplosion(x, y, color = '#A855F7') {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color,
        alpha: 1.0,
        decay: 0.04
      });
    }
  }

  spawnStarParticles(x, y) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        color: '#FDE047',
        alpha: 1.0,
        decay: 0.04
      });
    }
  }

  addFloatingText(text, x, y, color = '#FFFFFF') {
    this.floatingTexts.push({
      text,
      x: Math.max(20, Math.min(CANVAS_WIDTH - 120, x)),
      y,
      color,
      alpha: 1.0,
      timer: 45
    });
  }

  updateParticles(timeScale = 1) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * timeScale;
      p.y += p.vy * timeScale;
      p.alpha -= p.decay * timeScale;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y -= 1.0 * timeScale;
      t.timer -= 1 * timeScale;
      t.alpha = Math.max(0, t.timer / 45);
      if (t.timer <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    if (this.milestonePopup) {
      this.milestonePopup.timer -= 1 * timeScale;
      if (this.milestonePopup.timer <= 0) {
        this.milestonePopup = null;
      }
    }
  }

  // ==========================================
  // CANVAS 2D PROCEDURAL RENDERING ENGINE
  // ==========================================

  render(ctx) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Draw Altitude-responsive Background
    this.renderBackground(ctx);

    // 2. Draw Platforms & Items
    this.renderPlatforms(ctx);

    // 3. Draw Monsters & Black Holes
    this.renderBlackHoles(ctx);
    this.renderMonsters(ctx);

    // 4. Draw Bullets
    this.renderBullets(ctx);

    // 5. Draw Player Character
    this.renderPlayer(ctx);

    // 6. Draw Particles & Effects
    this.renderParticles(ctx);

    // 7. Draw Floating Texts & Milestones
    this.renderFloatingTexts(ctx);
  }

  getCurrentTheme() {
    const alt = this.maxAltitude;
    for (let theme of ALTITUDE_THEMES) {
      if (alt >= theme.minAlt && alt < theme.maxAlt) {
        return theme;
      }
    }
    return ALTITUDE_THEMES[ALTITUDE_THEMES.length - 1];
  }

  renderBackground(ctx) {
    const theme = this.getCurrentTheme();

    // Vertical Background Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    grad.addColorStop(0, theme.topColor);
    grad.addColorStop(1, theme.bottomColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Stars (Visible in sunset, night, space)
    if (theme.starCount > 0) {
      const now = performance.now() * 0.001;
      ctx.save();
      for (let star of this.stars.slice(0, theme.starCount)) {
        const twinkle = Math.sin(now * star.twinkleSpeed * 50 + star.twinklePhase);
        const alpha = Math.max(0.1, Math.min(1.0, star.baseAlpha + twinkle * 0.35));
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Clouds (Visible in daytime and sunset)
    if (theme.cloudCount > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      for (let cloud of this.clouds.slice(0, theme.cloudCount)) {
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.radius * 0.7, cloud.y - cloud.radius * 0.2, cloud.radius * 0.7, 0, Math.PI * 2);
        ctx.arc(cloud.x - cloud.radius * 0.7, cloud.y - cloud.radius * 0.1, cloud.radius * 0.65, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.radius * 1.3, cloud.y + cloud.radius * 0.1, cloud.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  renderPlatforms(ctx) {
    for (let plat of this.platforms) {
      ctx.save();

      if (plat.type === 'disappearing' && plat.hasDisappeared) {
        ctx.globalAlpha = 0.15;
      }

      if (plat.isBroken) {
        // Draw split broken platform
        ctx.fillStyle = '#B45309';
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 2;

        // Left half
        ctx.save();
        ctx.translate(plat.x + plat.width * 0.25, plat.y);
        ctx.rotate(-plat.brokenTime * 0.04);
        ctx.beginPath();
        ctx.roundRect(-plat.width * 0.25, -plat.height / 2, plat.width * 0.48, plat.height, 4);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Right half
        ctx.save();
        ctx.translate(plat.x + plat.width * 0.75, plat.y);
        ctx.rotate(plat.brokenTime * 0.04);
        ctx.beginPath();
        ctx.roundRect(-plat.width * 0.25, -plat.height / 2, plat.width * 0.48, plat.height, 4);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.restore();
        continue;
      }

      // Draw Normal / Moving / Disappearing / Cloud Platforms
      let mainColor = '#22C55E';
      let strokeColor = '#15803D';

      if (plat.type === 'moving') {
        mainColor = '#0EA5E9';
        strokeColor = '#0284C7';
      } else if (plat.type === 'disappearing') {
        mainColor = '#A855F7';
        strokeColor = '#7E22CE';
      } else if (plat.type === 'cloud') {
        mainColor = '#F8FAFC';
        strokeColor = '#CBD5E1';
      } else if (plat.type === 'vertical') {
        mainColor = '#F97316';
        strokeColor = '#C2410C';
      }

      // Platform Body Gradient
      const platGrad = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.height);
      platGrad.addColorStop(0, mainColor);
      platGrad.addColorStop(1, strokeColor);

      ctx.fillStyle = platGrad;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.roundRect(plat.x, plat.y, plat.width, plat.height, 6);
      ctx.fill();
      ctx.stroke();

      // Top Gloss Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.roundRect(plat.x + 3, plat.y + 2, plat.width - 6, 3, 2);
      ctx.fill();

      // Side Arrows for Moving Platform
      if (plat.type === 'moving') {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⟷', plat.x + plat.width / 2, plat.y + plat.height / 2 + 1);
      }

      // Up/Down Arrows for Vertical Platform
      if (plat.type === 'vertical') {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⥮', plat.x + plat.width / 2, plat.y + plat.height / 2 + 1);
      }

      // Draw Item on platform if any
      if (plat.item) {
        this.renderItem(ctx, plat.item, plat);
      }

      ctx.restore();
    }
  }

  renderItem(ctx, item, plat) {
    const cx = plat.x + plat.width / 2;
    const cy = plat.y - 12;

    ctx.save();
    if (item.type === 'spring') {
      // Spring Coil
      const isExpanded = item.state === 'expanded';
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (isExpanded) {
        ctx.moveTo(cx - 8, plat.y);
        ctx.lineTo(cx + 8, plat.y - 8);
        ctx.lineTo(cx - 8, plat.y - 16);
        ctx.lineTo(cx + 8, plat.y - 24);
        ctx.lineTo(cx, plat.y - 28);
      } else {
        ctx.moveTo(cx - 7, plat.y);
        ctx.lineTo(cx + 7, plat.y - 4);
        ctx.lineTo(cx - 7, plat.y - 8);
        ctx.lineTo(cx + 7, plat.y - 12);
      }
      ctx.stroke();

      // Top Red cap
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(cx, isExpanded ? plat.y - 28 : plat.y - 12, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.type === 'trampoline') {
      // Trampoline
      ctx.fillStyle = '#475569';
      ctx.fillRect(cx - 14, plat.y - 10, 28, 4);
      // Striped bouncing bed
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(cx - 12, plat.y - 12, 24, 3);
      ctx.fillStyle = '#FDE047';
      ctx.fillRect(cx - 6, plat.y - 12, 12, 3);
      // Legs
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 12, plat.y - 6);
      ctx.lineTo(cx - 14, plat.y);
      ctx.moveTo(cx + 12, plat.y - 6);
      ctx.lineTo(cx + 14, plat.y);
      ctx.stroke();
    } else if (item.type === 'propeller') {
      // Propeller Hat Icon
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🧢', cx, cy - 2);
    } else if (item.type === 'rocket') {
      // Rocket Icon
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🚀', cx, cy - 4);
    } else if (item.type === 'shield') {
      // Shield Icon
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🛡️', cx, cy - 2);
    } else if (item.type === 'star') {
      // Star Icon
      const starBob = Math.sin(performance.now() * 0.006) * 3;
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⭐', cx, cy + starBob);
    }
    ctx.restore();
  }

  renderMonsters(ctx) {
    for (let m of this.monsters) {
      if (m.isDead) continue;
      ctx.save();
      const cx = m.x + m.width / 2;
      const cy = m.y + m.height / 2;

      // Alien Monster Body
      ctx.fillStyle = '#A855F7';
      ctx.strokeStyle = '#6B21A8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cute Little Wings
      ctx.fillStyle = '#E9D5FF';
      ctx.beginPath();
      ctx.ellipse(cx - 16, cy - 4, 8, 4, -0.3, 0, Math.PI * 2);
      ctx.ellipse(cx + 16, cy - 4, 8, 4, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Big Eye
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(cx, cy - 2, 7, 0, Math.PI * 2);
      ctx.fill();

      // Pupil (Looking toward player)
      const p = this.player;
      const eyeDx = p.x > cx ? 2 : -2;
      ctx.fillStyle = '#1E1B4B';
      ctx.beginPath();
      ctx.arc(cx + eyeDx, cy - 2, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Spiky Antenna
      ctx.strokeStyle = '#A855F7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 18);
      ctx.lineTo(cx, cy - 26);
      ctx.stroke();

      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(cx, cy - 26, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  renderBlackHoles(ctx) {
    for (let bh of this.blackHoles) {
      ctx.save();
      ctx.translate(bh.x, bh.y);
      ctx.rotate(bh.angle);

      // Gravitational Aura
      const auraGrad = ctx.createRadialGradient(0, 0, bh.radius * 0.5, 0, 0, bh.pullRadius);
      auraGrad.addColorStop(0, 'rgba(147, 51, 234, 0.4)');
      auraGrad.addColorStop(0.6, 'rgba(59, 130, 246, 0.15)');
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, bh.pullRadius, 0, Math.PI * 2);
      ctx.fill();

      // Swirling Spiral Arms
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.6)';
      ctx.lineWidth = 3;
      for (let a = 0; a < 3; a++) {
        ctx.beginPath();
        ctx.arc(0, 0, bh.radius * 1.2, a * (Math.PI * 2 / 3), a * (Math.PI * 2 / 3) + 1.2);
        ctx.stroke();
      }

      // Event Horizon Core (Black Circle)
      ctx.fillStyle = '#030712';
      ctx.strokeStyle = '#9333EA';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, bh.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  }

  renderBullets(ctx) {
    for (let b of this.bullets) {
      ctx.save();
      ctx.fillStyle = '#FDE047';
      ctx.strokeStyle = '#EAB308';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Laser Glow
      ctx.fillStyle = 'rgba(253, 224, 71, 0.4)';
      ctx.beginPath();
      ctx.arc(b.x, b.y + 4, b.radius * 1.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  renderPlayer(ctx) {
    const p = this.player;
    ctx.save();

    const cx = p.x + p.width / 2;
    const cy = p.y + p.height / 2;

    ctx.translate(cx, cy);

    // Flip if facing left
    if (p.facing === 'left') {
      ctx.scale(-1, 1);
    }

    // Squash & Stretch
    const sx = 1.0 / p.squash;
    const sy = p.squash;
    ctx.scale(sx, sy);

    // 1. Draw Jetpack on back if active
    if (p.powerup?.type === 'rocket') {
      ctx.fillStyle = '#EF4444';
      ctx.strokeStyle = '#991B1B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-22, -14, 12, 28, 4);
      ctx.fill();
      ctx.stroke();

      // Rocket Nozzle
      ctx.fillStyle = '#475569';
      ctx.fillRect(-20, 14, 8, 4);
    }

    // 2. Main Cute Character Body (Dochon Green Jumper)
    const bodyGrad = ctx.createRadialGradient(-4, -6, 4, 0, 0, 22);
    bodyGrad.addColorStop(0, '#86EFAC');
    bodyGrad.addColorStop(0.7, '#22C55E');
    bodyGrad.addColorStop(1, '#15803D');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#166534';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.roundRect(-18, -18, 36, 36, 12);
    ctx.fill();
    ctx.stroke();

    // 3. Cute Snout / Nose Tube (for jumping & shooting)
    ctx.fillStyle = '#22C55E';
    ctx.strokeStyle = '#166534';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(10, 0, 14, 10, 4);
    ctx.fill();
    ctx.stroke();

    // 4. Large Expressive Eyes
    // Eye 1
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(2, -6, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#14532D';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pupil 1
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(4, -6, 3, 0, Math.PI * 2);
    ctx.fill();

    // Eye 2
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(12, -6, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pupil 2
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(14, -6, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // 5. Cute Feet
    ctx.fillStyle = '#15803D';
    ctx.beginPath();
    ctx.roundRect(-14, 16, 10, 6, 3);
    ctx.roundRect(4, 16, 10, 6, 3);
    ctx.fill();

    // 6. Propeller Hat if active
    if (p.powerup?.type === 'propeller') {
      // Hat base
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.roundRect(-14, -24, 28, 8, [4, 4, 0, 0]);
      ctx.fill();

      // Spinning Blade
      const propSpin = Math.sin(performance.now() * 0.04);
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-18 * propSpin, -28);
      ctx.lineTo(18 * propSpin, -28);
      ctx.stroke();

      // Center bead
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(0, -28, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Shield Bubble if active
    if (p.hasShield) {
      ctx.restore(); // restore from flip/squash to draw perfect circular shield
      ctx.save();
      ctx.translate(cx, cy);

      const shieldTime = performance.now() * 0.003;
      const shieldGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, 32);
      shieldGrad.addColorStop(0, 'rgba(56, 189, 248, 0.15)');
      shieldGrad.addColorStop(0.8, 'rgba(99, 102, 241, 0.4)');
      shieldGrad.addColorStop(1, 'rgba(14, 165, 233, 0.8)');

      ctx.fillStyle = shieldGrad;
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 30 + Math.sin(shieldTime * 4) * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Star Sparkle on shield
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✨', 22 * Math.cos(shieldTime), 22 * Math.sin(shieldTime));
      ctx.restore();
      return;
    }

    ctx.restore();
  }

  renderParticles(ctx) {
    for (let part of this.particles) {
      ctx.save();
      ctx.fillStyle = part.color;
      ctx.globalAlpha = Math.max(0, part.alpha);
      ctx.beginPath();
      ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  renderFloatingTexts(ctx) {
    for (let txt of this.floatingTexts) {
      ctx.save();
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = txt.color;
      ctx.globalAlpha = txt.alpha;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;
      ctx.fillText(txt.text, txt.x, txt.y);
      ctx.restore();
    }

    // Milestone Floating Banner
    if (this.milestonePopup) {
      ctx.save();
      const alpha = Math.min(1.0, this.milestonePopup.timer / 30);
      ctx.globalAlpha = alpha;

      const bw = 240;
      const bh = 42;
      const bx = (CANVAS_WIDTH - bw) / 2;
      const by = 80;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 10);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FDE047';
      ctx.fillText(this.milestonePopup.text, CANVAS_WIDTH / 2, by + bh / 2);

      ctx.restore();
    }
  }
}
