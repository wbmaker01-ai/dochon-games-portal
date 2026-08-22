// Canvas 2D Adventure & Puzzle Logic Engine for Dochon Roswell UFO Adventure
import { CANVAS_WIDTH, CANVAS_HEIGHT, SCENES, ITEMS, SCORE_CONFIG, RETRO_COLORS } from './roswellConstants';
import { roswellAudio } from './roswellAudio';

export class RoswellLogic {
  constructor(onEvent) {
    this.onEvent = onEvent; // callback for state sync (dialogue, parts, inv, score)
    this.reset();
  }

  reset() {
    this.currentScene = SCENES.CRASH_SITE;
    this.player = {
      x: 200,
      y: 350,
      targetX: 200,
      speed: 3.5,
      isMoving: false,
      facingRight: true,
      walkCycle: 0,
      teleporting: false,
      visible: true
    };

    // Inventory & UFO Parts
    this.inventory = [];
    this.collectedParts = []; // IDs of collected parts
    this.installedParts = []; // IDs of parts installed into UFO

    // Puzzle State Flags
    this.carrotHarvested = false;
    this.cowFed = false;
    this.coreFound = false;
    this.ropeFound = false;
    this.barnRopeUsed = false;
    this.domeFound = false;
    this.keyFound = false;
    this.boneFound = false;
    this.dogFed = false;
    this.engineFound = false;
    this.lightsOff = false;

    // UFO State
    this.ufoState = 'BROKEN'; // 'BROKEN' | 'REPAIRED' | 'LAUNCHING' | 'ESCAPED'
    this.ufoAnimY = 0;
    this.smokeParticles = [];
    this.starParticles = [];

    // Dialogue / Narrative Banner
    this.dialogue = {
      text: '🛸 외계인: 삐리리... (도촌에 불시착했다! 흩어진 UFO 부품 3개를 찾아야 해!)',
      timer: 260
    };

    // Score & Time
    this.score = 0;
    this.elapsedTime = 0;
    this.isGameClear = false;
    this.isGameOver = false;

    this.initParticles();
    this.syncState();
  }

  initParticles() {
    this.starParticles = [];
    for (let i = 0; i < 40; i++) {
      this.starParticles.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * (CANVAS_HEIGHT * 0.5),
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.05 + 0.01
      });
    }
  }

  syncState() {
    if (this.onEvent) {
      this.onEvent({
        scene: this.currentScene,
        inventory: [...this.inventory],
        collectedParts: [...this.collectedParts],
        installedParts: [...this.installedParts],
        score: this.calculateCurrentScore(),
        dialogue: this.dialogue.text,
        isGameClear: this.isGameClear
      });
    }
  }

  setDialogue(text, durationFrames = 220) {
    this.dialogue = { text, timer: durationFrames };
    roswellAudio.playAlienTalk();
    this.syncState();
  }

  calculateCurrentScore() {
    let pts = this.score;
    pts += this.installedParts.length * 400;
    pts += this.collectedParts.length * 200;
    return pts;
  }

  getFinalScore() {
    const timeBonus = Math.max(0, (SCORE_CONFIG.TIME_LIMIT_SECONDS - Math.floor(this.elapsedTime)) * SCORE_CONFIG.TIME_BONUS_MULTIPLIER);
    return SCORE_CONFIG.BASE_CLEAR_SCORE + timeBonus + (this.collectedParts.length * 200) + SCORE_CONFIG.PERFECT_DISCOVERY_BONUS;
  }

  // Handle Scene Transitions
  changeScene(nextScene, playerStartX) {
    this.currentScene = nextScene;
    this.player.x = playerStartX;
    this.player.targetX = playerStartX;
    this.player.isMoving = false;
    roswellAudio.playClick();
    this.syncState();
  }

  // Click & Interaction Handling
  handleCanvasClick(canvasX, canvasY, selectedItem) {
    if (this.isGameClear || this.ufoState === 'LAUNCHING' || this.ufoState === 'ESCAPED') return;

    // Check Scene Navigation Arrows
    if (this.checkNavigationClick(canvasX, canvasY)) return;

    // Check Scene Specific Hotspots
    switch (this.currentScene) {
      case SCENES.CRASH_SITE:
        this.handleCrashSiteClick(canvasX, canvasY, selectedItem);
        break;
      case SCENES.FARMLAND:
        this.handleFarmlandClick(canvasX, canvasY, selectedItem);
        break;
      case SCENES.BARN:
        this.handleBarnClick(canvasX, canvasY, selectedItem);
        break;
      case SCENES.FARMHOUSE:
        this.handleFarmhouseClick(canvasX, canvasY, selectedItem);
        break;
    }

    // Default Walk command
    if (canvasY > 260 && canvasY < 420) {
      this.player.targetX = Math.max(60, Math.min(CANVAS_WIDTH - 60, canvasX));
    }
  }

  checkNavigationClick(x, y) {
    // Left Arrow
    if (x >= 15 && x <= 75 && y >= 320 && y <= 400) {
      if (this.currentScene === SCENES.FARMLAND) this.changeScene(SCENES.CRASH_SITE, 700);
      else if (this.currentScene === SCENES.BARN) this.changeScene(SCENES.FARMLAND, 700);
      else if (this.currentScene === SCENES.FARMHOUSE) this.changeScene(SCENES.BARN, 700);
      return true;
    }
    // Right Arrow
    if (x >= CANVAS_WIDTH - 75 && x <= CANVAS_WIDTH - 15 && y >= 320 && y <= 400) {
      if (this.currentScene === SCENES.CRASH_SITE) this.changeScene(SCENES.FARMLAND, 100);
      else if (this.currentScene === SCENES.FARMLAND) this.changeScene(SCENES.BARN, 100);
      else if (this.currentScene === SCENES.BARN) this.changeScene(SCENES.FARMHOUSE, 100);
      return true;
    }
    return false;
  }

  // 1. Scene 1: Crash Site Interactions
  handleCrashSiteClick(x, y, selectedItem) {
    // UFO Ship (x: 280~520, y: 190~360)
    if (x >= 280 && x <= 520 && y >= 190 && y <= 360) {
      if (this.collectedParts.length === 3) {
        // All parts ready to assemble!
        if (this.installedParts.length < 3) {
          this.installedParts = ['part_core', 'part_dome', 'part_engine'];
          this.ufoState = 'REPAIRED';
          this.score += 500;
          roswellAudio.playPartFound();
          this.setDialogue('✨ 찌리릿! 3개의 핵심 부품을 모두 장착해 UFO가 완벽히 수리되었습니다!');
        } else if (this.ufoState === 'REPAIRED') {
          // Launch UFO!
          this.ufoState = 'LAUNCHING';
          roswellAudio.playUFOEscape();
          this.setDialogue('🚀 UFO 이륙 성공! 도촌초 상공을 넘어 우주로 탈출합니다!');
        }
      } else {
        const remaining = 3 - this.collectedParts.length;
        this.setDialogue(`🛸 고장 난 UFO: 연기가 피어오릅니다. 아직 ${remaining}개의 부품이 부족합니다. (오른쪽으로 이동해 찾아보세요!)`);
      }
      return;
    }

    // Debris search
    if (x >= 140 && x <= 220 && y >= 330 && y <= 390) {
      if (!this.ropeFound) {
        this.ropeFound = true;
        this.inventory.push(ITEMS.ROPE);
        this.score += SCORE_CONFIG.INTERACTION_BONUS;
        roswellAudio.playItemPickup();
        this.setDialogue('🪢 잔해 속에서 [튼튼한 밧줄]을 발견해 가방에 넣었습니다!');
      } else {
        this.setDialogue('불타버린 잔해 더미입니다. 더 이상 쓸 만한 물건은 없습니다.');
      }
    }
  }

  // 2. Scene 2: Farmland Interactions
  handleFarmlandClick(x, y, selectedItem) {
    // Carrot Patch (x: 180~270, y: 330~400)
    if (x >= 180 && x <= 270 && y >= 330 && y <= 400) {
      if (!this.carrotHarvested) {
        this.carrotHarvested = true;
        this.inventory.push(ITEMS.CARROT);
        this.score += SCORE_CONFIG.INTERACTION_BONUS;
        roswellAudio.playItemPickup();
        this.setDialogue('🥕 싱싱한 도촌 [유기농 당근]을 밭에서 뽑았습니다!');
      } else {
        this.setDialogue('당근을 뽑아낸 흙구덩이입니다.');
      }
      return;
    }

    // Sleeping Cow (x: 460~640, y: 260~380)
    if (x >= 460 && x <= 640 && y >= 260 && y <= 380) {
      if (!this.cowFed) {
        if (selectedItem && selectedItem.id === 'carrot') {
          this.cowFed = true;
          this.inventory = this.inventory.filter(i => i.id !== 'carrot');
          this.score += 150;
          roswellAudio.playItemPickup();
          this.setDialogue('🐮 음메~ 배고픈 소가 당근을 맛있게 먹고 자리를 비켜주었습니다!');
        } else {
          this.setDialogue('🐮 커다란 점박이 소가 길을 막고 졸고 있습니다. 맛있는 먹이를 주면 비켜줄 것 같습니다.');
        }
      } else if (!this.coreFound) {
        this.coreFound = true;
        this.collectedParts.push('part_core');
        this.score += 300;
        roswellAudio.playPartFound();
        this.setDialogue('💎 소가 깔고 누워있던 자리에 빛나는 [UFO 에너지 코어]를 회수했습니다! (부품 1/3 획득)');
      } else {
        this.setDialogue('🐮 배부른 소가 기분 좋게 되새김질을 하고 있습니다.');
      }
      return;
    }
  }

  // 3. Scene 3: Barn Interactions
  handleBarnClick(x, y, selectedItem) {
    // Windmill / Pulley on Barn (x: 320~460, y: 140~260)
    if (x >= 320 && x <= 460 && y >= 140 && y <= 260) {
      if (!this.barnRopeUsed) {
        if (selectedItem && selectedItem.id === 'rope') {
          this.barnRopeUsed = true;
          this.inventory = this.inventory.filter(i => i.id !== 'rope');
          this.score += 150;
          roswellAudio.playItemPickup();
          this.setDialogue('🪢 풍차 도르래에 밧줄을 걸었습니다! 지붕 위에 걸린 부품을 끌어내릴 수 있게 되었습니다!');
        } else {
          this.setDialogue('헛간 높은 지붕 위에 반짝이는 물건이 걸려 있습니다. 밧줄을 걸 수 있는 도르래가 보입니다.');
        }
      } else if (!this.domeFound) {
        this.domeFound = true;
        this.collectedParts.push('part_dome');
        this.score += 300;
        roswellAudio.playPartFound();
        this.setDialogue('🔮 밧줄을 당겨 지붕 위의 [UFO 조종석 유리 돔]을 안전하게 내려받았습니다! (부품 2/3 획득)');
      } else {
        this.setDialogue('풍차 날개가 평화롭게 돌고 있습니다.');
      }
      return;
    }

    // Barn Tool Box / Key (x: 580~670, y: 330~400)
    if (x >= 580 && x <= 670 && y >= 330 && y <= 400) {
      if (!this.boneFound) {
        this.boneFound = true;
        this.inventory.push(ITEMS.BONE);
        this.score += SCORE_CONFIG.INTERACTION_BONUS;
        roswellAudio.playItemPickup();
        this.setDialogue('🦴 건초더미 아래에서 농부의 강아지가 숨겨둔 [맛있는 뼈다귀]를 발견했습니다!');
      } else {
        this.setDialogue('비어있는 건초더미입니다.');
      }
      return;
    }
  }

  // 4. Scene 4: Farmhouse Interactions
  handleFarmhouseClick(x, y, selectedItem) {
    // Watchdog (x: 200~320, y: 310~390)
    if (x >= 200 && x <= 320 && y >= 310 && y <= 390) {
      if (!this.dogFed) {
        if (selectedItem && selectedItem.id === 'bone') {
          this.dogFed = true;
          this.inventory = this.inventory.filter(i => i.id !== 'bone');
          this.score += 150;
          roswellAudio.playItemPickup();
          this.setDialogue('🐶 멍멍! 강아지가 뼈다귀를 물고 신나서 구석으로 달려갔습니다!');
        } else {
          this.setDialogue('🐶 경비견이 으르렁거리며 침대 쪽을 지키고 있습니다. 맛있는 간식으로 유인해야 합니다.');
        }
      } else {
        this.setDialogue('🐶 강아지가 뼈다귀를 행복하게 갉아먹고 있습니다.');
      }
      return;
    }

    // Sleeping Farmer & Bed Drawer (x: 480~680, y: 240~380)
    if (x >= 480 && x <= 680 && y >= 240 && y <= 380) {
      if (!this.dogFed) {
        this.setDialogue('🐶 강아지가 짖으면 농부가 깨어날 수 있습니다! 먼저 강아지를 조용히 시켜야 합니다.');
        return;
      }

      if (!this.engineFound) {
        this.engineFound = true;
        this.collectedParts.push('part_engine');
        this.score += 300;
        roswellAudio.playPartFound();
        this.setDialogue('📡 드르렁~ 자고 있는 농부의 협탁에서 [초공간 추진 안테나]를 조용히 획득했습니다! (부품 3/3 획득 완료!)');
      } else {
        this.setDialogue('농부가 쿨쿨 잠들어 있습니다. (Zzz...)');
      }
      return;
    }
  }

  // Main Loop Update
  update(deltaTime = 1 / 60) {
    this.elapsedTime += deltaTime;

    // Update Dialogue Timer
    if (this.dialogue.timer > 0) {
      this.dialogue.timer--;
      if (this.dialogue.timer <= 0) {
        this.dialogue.text = '';
        this.syncState();
      }
    }

    // Player Movement
    const dx = this.player.targetX - this.player.x;
    if (Math.abs(dx) > 2) {
      this.player.isMoving = true;
      this.player.facingRight = dx > 0;
      this.player.x += Math.sign(dx) * this.player.speed;
      this.player.walkCycle += 0.2;
      roswellAudio.playFootstep();
    } else {
      this.player.isMoving = false;
      this.player.walkCycle = 0;
    }

    // UFO Launch Sequence
    if (this.ufoState === 'LAUNCHING') {
      this.ufoAnimY -= 3.5;
      // Spawn propulsion smoke
      if (Math.random() < 0.6) {
        this.smokeParticles.push({
          x: 400 + (Math.random() * 40 - 20),
          y: 280 + this.ufoAnimY,
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * 2 + 1,
          size: Math.random() * 12 + 8,
          alpha: 0.8
        });
      }

      if (this.ufoAnimY < -350) {
        this.ufoState = 'ESCAPED';
        this.isGameClear = true;
        this.syncState();
      }
    }

    // Update Smoke Particles
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const p = this.smokeParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.size += 0.3;
      p.alpha -= 0.015;
      if (p.alpha <= 0) this.smokeParticles.splice(i, 1);
    }
  }

  // Canvas 2D Drawing Engine
  render(ctx) {
    ctx.save();

    // 1. Draw Background Sky & Stars
    this.renderSky(ctx);

    // 2. Draw Scene Specific Environment
    switch (this.currentScene) {
      case SCENES.CRASH_SITE:
        this.renderCrashSite(ctx);
        break;
      case SCENES.FARMLAND:
        this.renderFarmland(ctx);
        break;
      case SCENES.BARN:
        this.renderBarn(ctx);
        break;
      case SCENES.FARMHOUSE:
        this.renderFarmhouse(ctx);
        break;
    }

    // 3. Draw Player Alien
    if (this.ufoState !== 'LAUNCHING' && this.ufoState !== 'ESCAPED') {
      this.renderPlayer(ctx);
    }

    // 4. Draw Navigation Arrows & Hotspot Hints
    this.renderNavigationArrows(ctx);

    // 5. Draw Smoke Particles
    this.renderParticles(ctx);

    // 6. Draw Retro Film Vignette & Scanlines
    this.renderVintageEffects(ctx);

    ctx.restore();
  }

  renderSky(ctx) {
    // Dark Retro Night Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT * 0.7);
    skyGrad.addColorStop(0, '#0a0f0a');
    skyGrad.addColorStop(1, '#1b261b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Twinkling Stars
    ctx.fillStyle = '#d5e3cf';
    this.starParticles.forEach(star => {
      star.alpha += (Math.random() - 0.5) * star.twinkleSpeed;
      if (star.alpha > 0.9) star.alpha = 0.9;
      if (star.alpha < 0.2) star.alpha = 0.2;
      ctx.globalAlpha = star.alpha;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Glowing Retro Moon
    ctx.fillStyle = '#eaf2e8';
    ctx.beginPath();
    ctx.arc(710, 80, 36, 0, Math.PI * 2);
    ctx.fill();

    // Moon Crater Details
    ctx.fillStyle = '#b8c9b5';
    ctx.beginPath();
    ctx.arc(698, 72, 8, 0, Math.PI * 2);
    ctx.arc(722, 90, 11, 0, Math.PI * 2);
    ctx.arc(712, 65, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Scene 1: Crash Site
  renderCrashSite(ctx) {
    // Rolling Hills
    ctx.fillStyle = '#1c291c';
    ctx.beginPath();
    ctx.ellipse(200, 320, 320, 120, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#141d14';
    ctx.beginPath();
    ctx.ellipse(620, 340, 350, 130, 0, 0, Math.PI * 2);
    ctx.fill();

    // Foreground Terrain
    ctx.fillStyle = '#223022';
    ctx.fillRect(0, 330, CANVAS_WIDTH, CANVAS_HEIGHT - 330);

    // Debris & Impact Crater
    ctx.fillStyle = '#111711';
    ctx.beginPath();
    ctx.ellipse(400, 355, 140, 35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Broken Debris Box (Rope source)
    ctx.fillStyle = '#3a4a38';
    ctx.fillRect(160, 345, 50, 30);
    ctx.fillStyle = '#2d3b2c';
    ctx.fillRect(165, 350, 40, 20);
    if (!this.ropeFound) {
      ctx.font = '20px sans-serif';
      ctx.fillText('🪢', 172, 368);
    }

    // Render UFO
    this.renderUFO(ctx, 400, 270 + this.ufoAnimY);
  }

  // Scene 2: Farmland
  renderFarmland(ctx) {
    // Farm Fields Background
    ctx.fillStyle = '#1d2a1d';
    ctx.fillRect(0, 260, CANVAS_WIDTH, CANVAS_HEIGHT - 260);

    // Fence
    ctx.strokeStyle = '#4e5f4c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 300);
    ctx.lineTo(CANVAS_WIDTH, 300);
    ctx.moveTo(0, 325);
    ctx.lineTo(CANVAS_WIDTH, 325);
    ctx.stroke();

    for (let x = 40; x < CANVAS_WIDTH; x += 80) {
      ctx.fillStyle = '#384836';
      ctx.fillRect(x, 285, 10, 50);
    }

    // Carrot Patch
    ctx.fillStyle = '#2b3d29';
    ctx.beginPath();
    ctx.ellipse(225, 365, 55, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    if (!this.carrotHarvested) {
      ctx.font = '28px sans-serif';
      ctx.fillText('🥕', 200, 365);
      ctx.fillText('🥕', 225, 372);
      ctx.fillText('🥕', 245, 362);
    }

    // Cow / Pasture
    const cowX = this.cowFed ? 650 : 540;
    const cowY = 320;
    
    // Cow Body
    ctx.fillStyle = '#e2ede0';
    ctx.beginPath();
    ctx.ellipse(cowX, cowY, 48, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cow Spots
    ctx.fillStyle = '#222f21';
    ctx.beginPath();
    ctx.arc(cowX - 15, cowY - 8, 14, 0, Math.PI * 2);
    ctx.arc(cowX + 18, cowY + 5, 16, 0, Math.PI * 2);
    ctx.fill();

    // Cow Head
    ctx.fillStyle = '#e2ede0';
    ctx.beginPath();
    ctx.arc(cowX - 45, cowY - 12, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1b261b';
    ctx.beginPath();
    ctx.arc(cowX - 50, cowY - 14, 3, 0, Math.PI * 2);
    ctx.fill();

    // Power Core under Cow
    if (this.cowFed && !this.coreFound) {
      ctx.font = '26px sans-serif';
      ctx.fillText('💎', 480, 360);
    }
  }

  // Scene 3: Barn & Windmill
  renderBarn(ctx) {
    // Barn Structure
    ctx.fillStyle = '#2a1a1a';
    ctx.fillRect(260, 180, 280, 160);

    // Barn Roof
    ctx.fillStyle = '#3f2525';
    ctx.beginPath();
    ctx.moveTo(240, 180);
    ctx.lineTo(400, 100);
    ctx.lineTo(560, 180);
    ctx.closePath();
    ctx.fill();

    // Barn Door
    ctx.fillStyle = '#1c1010';
    ctx.fillRect(360, 240, 80, 100);

    // Windmill Blades on Roof
    const bladeAngle = (this.elapsedTime * 1.5) % (Math.PI * 2);
    ctx.save();
    ctx.translate(400, 120);
    ctx.rotate(bladeAngle);
    ctx.fillStyle = '#8da688';
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillRect(-6, -60, 12, 60);
    }
    ctx.restore();

    // Cockpit Dome on Roof / Lowered
    if (!this.domeFound) {
      const domeY = this.barnRopeUsed ? 230 : 110;
      ctx.font = '28px sans-serif';
      ctx.fillText('🔮', 386, domeY);
      if (this.barnRopeUsed) {
        ctx.strokeStyle = '#c4b5a0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(400, 120);
        ctx.lineTo(400, 210);
        ctx.stroke();
      }
    }

    // Haystack & Bone Box
    ctx.fillStyle = '#4a5948';
    ctx.beginPath();
    ctx.arc(630, 350, 40, 0, Math.PI, true);
    ctx.fill();
    if (!this.boneFound) {
      ctx.font = '22px sans-serif';
      ctx.fillText('🦴', 620, 355);
    }

    // Ground
    ctx.fillStyle = '#1b261b';
    ctx.fillRect(0, 340, CANVAS_WIDTH, CANVAS_HEIGHT - 340);
  }

  // Scene 4: Farmhouse
  renderFarmhouse(ctx) {
    // Room Walls & Wallpaper
    ctx.fillStyle = '#222822';
    ctx.fillRect(0, 80, CANVAS_WIDTH, 260);

    // Floor Boards
    ctx.fillStyle = '#33241c';
    ctx.fillRect(0, 340, CANVAS_WIDTH, CANVAS_HEIGHT - 340);
    ctx.strokeStyle = '#241913';
    ctx.lineWidth = 2;
    for (let y = 350; y < CANVAS_HEIGHT; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Window with Night View
    ctx.fillStyle = '#0e170e';
    ctx.fillRect(100, 120, 90, 110);
    ctx.strokeStyle = '#5a463a';
    ctx.lineWidth = 4;
    ctx.strokeRect(100, 120, 90, 110);

    // Watchdog
    const dogX = this.dogFed ? 140 : 260;
    ctx.fillStyle = '#8a6548';
    ctx.beginPath();
    ctx.ellipse(dogX, 350, 22, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(dogX + 16, 342, 10, 0, Math.PI * 2);
    ctx.fill();
    if (!this.dogFed) {
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#f87171';
      ctx.fillText('Grrr!', dogX - 10, 325);
    } else {
      ctx.font = '18px sans-serif';
      ctx.fillText('🦴', dogX + 15, 350);
    }

    // Farmer's Bed
    ctx.fillStyle = '#4f3c30';
    ctx.fillRect(500, 280, 160, 65);
    ctx.fillStyle = '#7a8f76';
    ctx.fillRect(520, 290, 135, 45); // Blanket
    ctx.fillStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.arc(515, 305, 14, 0, Math.PI * 2); // Pillow
    ctx.fill();

    // Sleeping Farmer Head & Zzz
    ctx.fillStyle = '#f3c49f';
    ctx.beginPath();
    ctx.arc(518, 302, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#d5e3cf';
    ctx.fillText('Zzz...', 535, 270);

    // Bedside Table & UFO Antenna
    ctx.fillStyle = '#3a2b22';
    ctx.fillRect(670, 295, 45, 50);
    if (!this.engineFound) {
      ctx.font = '26px sans-serif';
      ctx.fillText('📡', 678, 290);
    }
  }

  // UFO Ship Drawing
  renderUFO(ctx, cx, cy) {
    // UFO Hull Base
    ctx.fillStyle = '#617560';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 95, 32, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bottom Rim
    ctx.fillStyle = '#425241';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 12, 75, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lights around UFO
    const lightGlow = this.installedParts.includes('part_core') ? '#4ade80' : '#334032';
    ctx.fillStyle = lightGlow;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(cx + i * 22, cy + 4, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glass Dome
    if (this.installedParts.includes('part_dome')) {
      ctx.fillStyle = 'rgba(167, 243, 208, 0.45)';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 20, 44, 30, 0, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#6ee7b7';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Propulsion Antenna
    if (this.installedParts.includes('part_engine')) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 50);
      ctx.lineTo(cx, cy - 70);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx, cy - 72, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Player Alien Character Drawing
  renderPlayer(ctx) {
    const px = this.player.x;
    const py = this.player.y;
    const legOffset = this.player.isMoving ? Math.sin(this.player.walkCycle) * 6 : 0;

    ctx.save();
    ctx.translate(px, py);
    if (!this.player.facingRight) ctx.scale(-1, 1);

    // Legs
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, 12);
    ctx.lineTo(-6 + legOffset, 28);
    ctx.moveTo(6, 12);
    ctx.lineTo(6 - legOffset, 28);
    ctx.stroke();

    // Body (Slim Alien Suit)
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(0, 4, 10, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belt / Badge
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-6, 6, 12, 3);

    // Big Classic Alien Head (Teardrop shape)
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.bezierCurveTo(18, -32, 16, -8, 0, -6);
    ctx.bezierCurveTo(-16, -8, -18, -32, 0, -32);
    ctx.fill();

    // Big Oval Black Eyes
    ctx.fillStyle = '#0a140a';
    ctx.beginPath();
    ctx.ellipse(-6, -20, 5, 8, -Math.PI / 8, 0, Math.PI * 2);
    ctx.ellipse(6, -20, 5, 8, Math.PI / 8, 0, Math.PI * 2);
    ctx.fill();

    // Eye Reflection Highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-5, -23, 2, 0, Math.PI * 2);
    ctx.arc(7, -23, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Navigation Arrows & Screen Guides
  renderNavigationArrows(ctx) {
    // Left Arrow
    if (this.currentScene !== SCENES.CRASH_SITE) {
      ctx.fillStyle = 'rgba(20, 30, 20, 0.7)';
      ctx.beginPath();
      ctx.arc(45, 360, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d5e3cf';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('◀', 34, 367);
    }

    // Right Arrow
    if (this.currentScene !== SCENES.FARMHOUSE) {
      ctx.fillStyle = 'rgba(20, 30, 20, 0.7)';
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH - 45, 360, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d5e3cf';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('▶', CANVAS_WIDTH - 54, 367);
    }
  }

  renderParticles(ctx) {
    ctx.fillStyle = 'rgba(200, 230, 200, 0.8)';
    this.smokeParticles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  }

  // Vintage Film Overlay & Vignette
  renderVintageEffects(ctx) {
    // Film Vignette Border
    const vigGrad = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * 0.45,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.7
    );
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Subtle Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    for (let y = 0; y < CANVAS_HEIGHT; y += 4) {
      ctx.fillRect(0, y, CANVAS_WIDTH, 1.5);
    }
  }
}
