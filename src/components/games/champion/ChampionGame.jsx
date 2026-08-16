import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MAP_COLS,
  MAP_ROWS,
  TILE_SIZE,
  OVERWORLD_MAP,
  TILES,
  NPCS,
  SPORTS,
  TEAMS
} from './championConstants';
import {
  checkOverworldCollision,
  checkNPCInteraction,
  checkArenaTrigger,
  TableTennisEngine,
  ArcheryEngine,
  MarathonEngine,
  ClimbingEngine
} from './championLogic';
import { championAudio } from './championAudio';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import ChampionHowToPlayModal from './ChampionHowToPlayModal';
import './champion.css';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  RotateCcw,
  Trophy,
  Sparkles,
  Flame,
  Award,
  Crown,
  Send,
  User,
  ArrowRight,
  CheckCircle2,
  Flag,
  Swords,
  Scroll
} from 'lucide-react';

export default function ChampionGame({ onScoreSubmitted }) {
  // Game Flow States
  // mode: 'team_select' | 'overworld' | 'playing_sport' | 'result'
  const [gameMode, setGameMode] = useState('team_select');
  const [selectedTeam, setSelectedTeam] = useState(TEAMS[0]);
  const [activeSport, setActiveSport] = useState(null);
  const [collectedScrolls, setCollectedScrolls] = useState({
    table_tennis: false,
    archery: false,
    marathon: false,
    climbing: false
  });
  const [totalScore, setTotalScore] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Active NPC Dialogue
  const [activeDialogue, setActiveDialogue] = useState(null);
  // Arena Trigger Banner
  const [arenaPrompt, setArenaPrompt] = useState(null);

  // Result & Leaderboard Submission
  const [lastMatchResult, setLastMatchResult] = useState(null); // { sport, score, won }
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Canvas & Physics Loop Refs
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const keysPressed = useRef({});

  // Overworld Player Entity
  const playerRef = useRef({
    x: 12 * TILE_SIZE + 16,
    y: 7 * TILE_SIZE + 16,
    vx: 0,
    vy: 0,
    speed: 3.8,
    direction: 'down', // 'up' | 'down' | 'left' | 'right'
    animFrame: 0,
    stepTimer: 0
  });

  // Sports Engines Refs
  const ttEngineRef = useRef(null);
  const archeryEngineRef = useRef(null);
  const marathonEngineRef = useRef(null);
  const climbingEngineRef = useRef(null);

  // Initialize Sound
  useEffect(() => {
    championAudio.init();
  }, []);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    championAudio.setMuted(nextMuted);
  };

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent scrolling for game control keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      keysPressed.current[e.code] = true;

      // Overworld Space / Enter Interaction Trigger
      if ((e.code === 'Space' || e.code === 'Enter') && gameMode === 'overworld') {
        if (activeDialogue) {
          setActiveDialogue(null);
          return;
        }

        // Check NPC interaction
        const npc = checkNPCInteraction(playerRef.current.x, playerRef.current.y);
        if (npc) {
          setActiveDialogue(npc);
          championAudio.playTalk();
          return;
        }

        // Check Arena Trigger
        const arena = checkArenaTrigger(playerRef.current.x, playerRef.current.y);
        if (arena) {
          startSportArena(arena);
        }
      }
    };

    const handleKeyUp = (e) => {
      keysPressed.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameMode, activeDialogue]);

  // Start a Sport Arena
  const startSportArena = (sport) => {
    championAudio.playWhistle();
    setActiveSport(sport);
    setActiveDialogue(null);

    if (sport.id === 'table_tennis') {
      ttEngineRef.current = new TableTennisEngine();
    } else if (sport.id === 'archery') {
      archeryEngineRef.current = new ArcheryEngine();
    } else if (sport.id === 'marathon') {
      marathonEngineRef.current = new MarathonEngine();
    } else if (sport.id === 'climbing') {
      climbingEngineRef.current = new ClimbingEngine();
    }

    setGameMode('playing_sport');
  };

  // Return to Overworld
  const returnToOverworld = () => {
    setGameMode('overworld');
    setActiveSport(null);
    setLastMatchResult(null);
  };

  // Full Game Reset
  const resetGame = () => {
    setGameMode('team_select');
    setActiveSport(null);
    setCollectedScrolls({
      table_tennis: false,
      archery: false,
      marathon: false,
      climbing: false
    });
    setTotalScore(0);
    setLastMatchResult(null);
    setSubmitSuccess(false);
    setPlayerName('');
    playerRef.current.x = 12 * TILE_SIZE + 16;
    playerRef.current.y = 7 * TILE_SIZE + 16;
  };

  // Team Selection Handler
  const handleSelectTeam = (team) => {
    setSelectedTeam(team);
    championAudio.playBoost();
    setGameMode('overworld');
  };

  // Submit Score to Hall of Fame
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await submitScoreToDB('champion', playerName.trim(), totalScore);
      if (success) {
        setSubmitSuccess(true);
        championAudio.playScrollWin();
        if (onScoreSubmitted) {
          setTimeout(() => {
            onScoreSubmitted();
          }, 800);
        }
      }
    } catch (err) {
      console.error('Score submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // RENDER ROUTINES: 16-BIT RETRO PIXEL SPRITES & CANVASES
  // ============================================================

  // 1. Render Overworld Map & Entities
  const drawOverworld = (ctx) => {
    // Background Clear
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Tiles Grid
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        const tile = OVERWORLD_MAP[r][c];
        const tx = c * TILE_SIZE;
        const ty = r * TILE_SIZE;

        if (tile === TILES.GRASS) {
          ctx.fillStyle = '#22C55E';
          ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
          // Grass texture dots
          ctx.fillStyle = '#16A34A';
          ctx.fillRect(tx + 4, ty + 6, 4, 4);
          ctx.fillRect(tx + 18, ty + 16, 4, 4);
        } else if (tile === TILES.PATH) {
          ctx.fillStyle = '#E2E8F0';
          ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#CBD5E1';
          ctx.fillRect(tx + 2, ty + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        } else if (tile === TILES.WATER) {
          ctx.fillStyle = '#0284C7';
          ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
          // Wave ripple
          ctx.fillStyle = '#38BDF8';
          const waveOff = (Math.sin((Date.now() / 300) + c) * 3);
          ctx.fillRect(tx + 4, ty + 12 + waveOff, 12, 3);
        } else if (tile === TILES.SAND) {
          ctx.fillStyle = '#FBBF24';
          ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#F59E0B';
          ctx.fillRect(tx + 8, ty + 8, 3, 3);
          ctx.fillRect(tx + 20, ty + 18, 3, 3);
        } else if (tile === TILES.SNOW) {
          ctx.fillStyle = '#E0F2FE';
          ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#BAE6FD';
          ctx.fillRect(tx + 6, ty + 6, 6, 6);
        } else if (tile === TILES.TREE) {
          ctx.fillStyle = '#22C55E';
          ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
          // Pine / Cherry Blossom Tree
          ctx.fillStyle = r < 5 ? '#F472B6' : '#15803D';
          ctx.beginPath();
          ctx.arc(tx + TILE_SIZE / 2, ty + TILE_SIZE / 2, 14, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === TILES.TORII_GATE) {
          ctx.fillStyle = '#E2E8F0';
          ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
          // Red Torii Arch
          ctx.fillStyle = '#DC2626';
          ctx.fillRect(tx + 4, ty + 4, 6, TILE_SIZE - 4);
          ctx.fillRect(tx + TILE_SIZE - 10, ty + 4, 6, TILE_SIZE - 4);
          ctx.fillRect(tx, ty + 2, TILE_SIZE, 6);
        } else if (tile === TILES.SHRINE) {
          // Central Shrine
          ctx.fillStyle = '#CBD5E1';
          ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#F59E0B';
          ctx.fillRect(tx + 6, ty + 6, TILE_SIZE - 12, TILE_SIZE - 12);
        } else if (tile === TILES.LANTERN) {
          ctx.fillStyle = '#22C55E';
          ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#64748B';
          ctx.fillRect(tx + 12, ty + 14, 8, 14);
          ctx.fillStyle = '#FDE047';
          ctx.fillRect(tx + 10, ty + 8, 12, 10);
        } else if (tile === TILES.ARENA_PINGPONG) {
          ctx.fillStyle = '#EF4444';
          ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
        } else if (tile === TILES.ARENA_ARCHERY) {
          ctx.fillStyle = '#F59E0B';
          ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
        } else if (tile === TILES.ARENA_MARATHON) {
          ctx.fillStyle = '#10B981';
          ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
        } else if (tile === TILES.ARENA_CLIMBING) {
          ctx.fillStyle = '#8B5CF6';
          ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // Draw Arena Labels & Gateways
    const arenaMarks = [
      { text: '🏓 탁구 도조', col: 2, row: 3, color: '#EF4444' },
      { text: '🎯 양궁장', col: 20, row: 3, color: '#F59E0B' },
      { text: '🏃 마라톤 해변', col: 1, row: 11, color: '#10B981' },
      { text: '🧗 설산 클라이밍', col: 12, row: 0, color: '#8B5CF6' }
    ];

    arenaMarks.forEach(m => {
      const ax = m.col * TILE_SIZE + TILE_SIZE / 2;
      const ay = m.row * TILE_SIZE + TILE_SIZE / 2;

      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(ax, ay, 18, 0, Math.PI * 2);
      ctx.fill();

      // Glowing pulsing boundary
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(m.text, ax, ay - 24);
    });

    // Draw NPCs
    NPCS.forEach(npc => {
      const nx = npc.tileX * TILE_SIZE + TILE_SIZE / 2;
      const ny = npc.tileY * TILE_SIZE + TILE_SIZE / 2;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(nx, ny + 12, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // NPC Emoji / Icon
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(npc.icon, nx, ny);

      // Name Tag
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(nx - 36, ny - 28, 72, 18);
      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 10px Pretendard, sans-serif';
      ctx.fillText(npc.name, nx, ny - 19);
    });

    // Draw Lucky the Ninja Cat (Player)
    const p = playerRef.current;

    // Cat Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 12, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cat Body (Calico: Orange / White / Black)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
    ctx.fill();

    // Ninja Headband (Team Color!)
    ctx.fillStyle = selectedTeam.color;
    ctx.fillRect(p.x - 12, p.y - 12, 24, 6);
    // Headband ribbon tails
    ctx.beginPath();
    ctx.moveTo(p.x - 12, p.y - 10);
    ctx.lineTo(p.x - 20, p.y - 6);
    ctx.lineTo(p.x - 12, p.y - 4);
    ctx.fill();

    // Cat Ears
    ctx.fillStyle = '#F59E0B'; // Orange ear
    ctx.beginPath();
    ctx.moveTo(p.x - 10, p.y - 12);
    ctx.lineTo(p.x - 4, p.y - 22);
    ctx.lineTo(p.x + 2, p.y - 12);
    ctx.fill();

    ctx.fillStyle = '#1E293B'; // Black ear
    ctx.beginPath();
    ctx.moveTo(p.x + 2, p.y - 12);
    ctx.lineTo(p.x + 8, p.y - 22);
    ctx.lineTo(p.x + 14, p.y - 12);
    ctx.fill();

    // Cute Cat Eyes & Whiskers
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(p.x - 6, p.y - 3, 3, 5);
    ctx.fillRect(p.x + 3, p.y - 3, 3, 5);
    ctx.fillStyle = '#F43F5E';
    ctx.fillRect(p.x - 2, p.y + 2, 4, 3); // Pink Nose
  };

  // 2. Render Table Tennis Match
  const drawTableTennis = (ctx) => {
    const engine = ttEngineRef.current;
    if (!engine) return;

    // Ping Pong Dojo Arena Background
    ctx.fillStyle = '#064E3B'; // Green Table Surface
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // White Outer Borders & Net
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, CANVAS_WIDTH - 60, CANVAS_HEIGHT - 60);

    // Center Net
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 30);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    ctx.stroke();
    ctx.setLineDash([]);

    // Score Board
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${engine.playerScore}`, CANVAS_WIDTH / 2 - 80, 75);
    ctx.fillText(`${engine.tenguScore}`, CANVAS_WIDTH / 2 + 80, 75);

    ctx.font = 'bold 14px Pretendard, sans-serif';
    ctx.fillStyle = '#FCD34D';
    ctx.fillText(`연속 랠리: ${engine.rallyCount} 회`, CANVAS_WIDTH / 2, 60);

    // Player Paddle (Left side, Team Color)
    ctx.fillStyle = selectedTeam.color;
    ctx.fillRect(70 - engine.paddleWidth / 2, engine.playerY - engine.paddleHeight / 2, engine.paddleWidth, engine.paddleHeight);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(70 - engine.paddleWidth / 2, engine.playerY - engine.paddleHeight / 2, engine.paddleWidth, engine.paddleHeight);

    // Player Cat Icon
    ctx.font = '20px sans-serif';
    ctx.fillText('🐱 럭키', 70, engine.playerY - engine.paddleHeight / 2 - 12);

    // Tengu Paddle (Right side, Red Boss)
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(CANVAS_WIDTH - 70 - engine.paddleWidth / 2, engine.tenguY - engine.paddleHeight / 2, engine.paddleWidth, engine.paddleHeight);
    ctx.strokeStyle = '#FCA5A5';
    ctx.lineWidth = 2;
    ctx.strokeRect(CANVAS_WIDTH - 70 - engine.paddleWidth / 2, engine.tenguY - engine.paddleHeight / 2, engine.paddleWidth, engine.paddleHeight);

    // Tengu Boss Icon
    ctx.fillText('👺 텐구', CANVAS_WIDTH - 70, engine.tenguY - engine.paddleHeight / 2 - 12);

    // Ball
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(engine.ballX, engine.ballY, engine.ballRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Hit Particles
    engine.effectParticles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // 3. Render Archery Match
  const drawArchery = (ctx) => {
    const engine = archeryEngineRef.current;
    if (!engine) return;

    // Misty Lake Range Background
    ctx.fillStyle = '#1E3A8A';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Distant Fog & Lake ripples
    ctx.fillStyle = '#1E40AF';
    ctx.fillRect(0, CANVAS_HEIGHT - 120, CANVAS_WIDTH, 120);

    // HUD: Arrows left & Wind
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Pretendard, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🏹 남은 화살: ${engine.arrowsLeft} 개`, 40, 50);
    ctx.fillText(`💨 바람: ${engine.wind > 0 ? `→ +${engine.wind}` : `← ${engine.wind}`} m/s`, 40, 80);

    ctx.textAlign = 'right';
    ctx.fillText(`점수: ${engine.score} 점`, CANVAS_WIDTH - 40, 50);

    // Player Cat Archer (Left)
    ctx.font = '32px sans-serif';
    ctx.fillText('🐱', 90, engine.aimY + 10);

    // Aim Line & Bow Draw Indicator
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(110, engine.aimY);
    ctx.lineTo(CANVAS_WIDTH, engine.aimY + engine.wind * 15);
    ctx.stroke();
    ctx.setLineDash([]);

    // Power Charge Gauge
    if (engine.isCharging) {
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(80, engine.aimY + 30, engine.chargePower * 0.8, 8);
      ctx.strokeStyle = '#FFFFFF';
      ctx.strokeRect(80, engine.aimY + 30, 80, 8);
    }

    // Moving Targets
    engine.targets.forEach((t, i) => {
      // Stand Line
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(t.x, 60);
      ctx.lineTo(t.x, CANVAS_HEIGHT - 60);
      ctx.stroke();

      // Concentric Rings (Yellow, Red, Blue, White)
      const colors = ['#F59E0B', '#EF4444', '#3B82F6', '#FFFFFF'];
      for (let r = 4; r >= 1; r--) {
        ctx.fillStyle = colors[r - 1];
        ctx.beginPath();
        ctx.arc(t.x, t.y, (t.radius / 4) * r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // Flying Arrow
    if (engine.activeArrow) {
      ctx.fillStyle = '#FCD34D';
      ctx.fillRect(engine.activeArrow.x - 18, engine.activeArrow.y - 2, 24, 4);
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.moveTo(engine.activeArrow.x + 8, engine.activeArrow.y);
      ctx.lineTo(engine.activeArrow.x + 2, engine.activeArrow.y - 4);
      ctx.lineTo(engine.activeArrow.x + 2, engine.activeArrow.y + 4);
      ctx.fill();
    }

    // Floating Score Feedbacks
    engine.hitFeedbacks.forEach(f => {
      ctx.fillStyle = f.color;
      ctx.font = 'bold 18px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
    });
  };

  // 4. Render Marathon Match
  const drawMarathon = (ctx) => {
    const engine = marathonEngineRef.current;
    if (!engine) return;

    // Sandy Beach Track
    ctx.fillStyle = '#FBBF24';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Ocean Waves (Top)
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 90);

    // Race Track Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.setLineDash([14, 14]);
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT / 2);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Distance & Stamina HUD
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 16px Pretendard, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🚩 달린 거리: ${Math.floor(engine.distance)}m / ${engine.targetDistance}m`, 40, 45);

    // Stamina Bar
    ctx.fillText(`⚡ 스태미나:`, 40, 75);
    ctx.fillStyle = '#10B981';
    ctx.fillRect(130, 62, engine.stamina * 1.5, 14);
    ctx.strokeStyle = '#1E293B';
    ctx.strokeRect(130, 62, 150, 14);

    // Obstacles (Crabs 🦀, Puddles 🌊)
    engine.obstacles.forEach(obs => {
      ctx.font = '26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(obs.type === 'crab' ? '🦀' : '🌊', obs.x, obs.y);
    });

    // Items (Watermelon 🍉)
    engine.items.forEach(it => {
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🍉', it.x, it.y);
    });

    // Player Lucky the Cat (Fixed X = 150)
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🐱', 150, engine.playerLaneY);
    ctx.font = 'bold 11px Pretendard, sans-serif';
    ctx.fillStyle = '#0F172A';
    ctx.fillText('럭키', 150, engine.playerLaneY - 24);

    // Kappa Boss (Behind or competing)
    const kappaX = 150 + ((engine.kappaSpeed - engine.playerSpeed) * 30);
    ctx.font = '32px sans-serif';
    ctx.fillText('🐢', Math.max(50, Math.min(CANVAS_WIDTH - 60, kappaX)), engine.kappaLaneY);
  };

  // 5. Render Climbing Match
  const drawClimbing = (ctx) => {
    const engine = climbingEngineRef.current;
    if (!engine) return;

    // Mountain Rock Cliff Background
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Ice & Snow Crags
    ctx.fillStyle = '#475569';
    ctx.fillRect(80, 0, CANVAS_WIDTH - 160, CANVAS_HEIGHT);

    // Altitude & Stamina HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Pretendard, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`⛰️ 고도: ${Math.floor(engine.altitude)}m / ${engine.targetAltitude}m`, 40, 45);

    ctx.fillText(`⚡ 악력(스태미나):`, 40, 75);
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(160, 62, engine.stamina * 1.5, 14);
    ctx.strokeStyle = '#FFFFFF';
    ctx.strokeRect(160, 62, 150, 14);

    // Climbing Holds
    engine.holds.forEach(h => {
      ctx.fillStyle = h.color;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Falling Snowballs & Rocks
    engine.fallingRocks.forEach(r => {
      ctx.fillStyle = '#BAE6FD';
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0284C7';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Lucky Ninja Cat Climber
    ctx.font = '34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🐱', engine.playerX, engine.playerY);
  };

  // ============================================================
  // MAIN GAME ENGINE LOOP (60 FPS)
  // ============================================================
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (gameMode === 'overworld') {
      // Update Overworld Player Movement
      const p = playerRef.current;
      let dx = 0;
      let dy = 0;

      if (keysPressed.current.ArrowLeft || keysPressed.current.KeyA) {
        dx -= p.speed;
        p.direction = 'left';
      }
      if (keysPressed.current.ArrowRight || keysPressed.current.KeyD) {
        dx += p.speed;
        p.direction = 'right';
      }
      if (keysPressed.current.ArrowUp || keysPressed.current.KeyW) {
        dy -= p.speed;
        p.direction = 'up';
      }
      if (keysPressed.current.ArrowDown || keysPressed.current.KeyS) {
        dy += p.speed;
        p.direction = 'down';
      }

      if (dx !== 0 || dy !== 0) {
        // Step audio
        p.stepTimer++;
        if (p.stepTimer > 16) {
          p.stepTimer = 0;
          championAudio.playStep();
        }

        // Collision Check
        const newX = p.x + dx;
        const newY = p.y + dy;
        if (!checkOverworldCollision(newX, p.y)) {
          p.x = newX;
        }
        if (!checkOverworldCollision(p.x, newY)) {
          p.y = newY;
        }
      }

      // Check Arena Prompt Banner
      const arena = checkArenaTrigger(p.x, p.y);
      setArenaPrompt(arena);

      // Draw Overworld
      drawOverworld(ctx);
    } else if (gameMode === 'playing_sport' && activeSport) {
      // Update Sport Engines
      if (activeSport.id === 'table_tennis' && ttEngineRef.current) {
        const eng = ttEngineRef.current;
        eng.update(keysPressed.current);
        drawTableTennis(ctx);

        if (eng.winner) {
          const won = eng.winner === 'player';
          const matchScore = eng.playerScore * 100 + (won ? 500 : 0) + eng.maxRally * 20;
          if (won) {
            setCollectedScrolls(prev => ({ ...prev, table_tennis: true }));
          }
          setTotalScore(prev => prev + matchScore);
          setLastMatchResult({ sport: activeSport, score: matchScore, won });
          setGameMode('result');
        }
      } else if (activeSport.id === 'archery' && archeryEngineRef.current) {
        const eng = archeryEngineRef.current;
        eng.update(keysPressed.current);
        drawArchery(ctx);

        if (eng.winner !== null) {
          const won = eng.winner === 'player';
          const matchScore = eng.score + (won ? 400 : 0);
          if (won) {
            setCollectedScrolls(prev => ({ ...prev, archery: true }));
          }
          setTotalScore(prev => prev + matchScore);
          setLastMatchResult({ sport: activeSport, score: matchScore, won });
          setGameMode('result');
        }
      } else if (activeSport.id === 'marathon' && marathonEngineRef.current) {
        const eng = marathonEngineRef.current;
        eng.update(keysPressed.current);
        drawMarathon(ctx);

        if (eng.winner) {
          const matchScore = eng.score;
          setCollectedScrolls(prev => ({ ...prev, marathon: true }));
          setTotalScore(prev => prev + matchScore);
          setLastMatchResult({ sport: activeSport, score: matchScore, won: true });
          setGameMode('result');
        }
      } else if (activeSport.id === 'climbing' && climbingEngineRef.current) {
        const eng = climbingEngineRef.current;
        eng.update(keysPressed.current);
        drawClimbing(ctx);

        if (eng.winner) {
          const matchScore = eng.score;
          setCollectedScrolls(prev => ({ ...prev, climbing: true }));
          setTotalScore(prev => prev + matchScore);
          setLastMatchResult({ sport: activeSport, score: matchScore, won: true });
          setGameMode('result');
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameMode, activeSport, selectedTeam]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [gameLoop]);

  // Mobile Virtual Button Handlers
  const handleMobileDpad = (key, isPressed) => {
    keysPressed.current[key] = isPressed;
  };

  const handleMobileAction = () => {
    if (gameMode === 'overworld') {
      if (activeDialogue) {
        setActiveDialogue(null);
        return;
      }
      const npc = checkNPCInteraction(playerRef.current.x, playerRef.current.y);
      if (npc) {
        setActiveDialogue(npc);
        championAudio.playTalk();
        return;
      }
      const arena = checkArenaTrigger(playerRef.current.x, playerRef.current.y);
      if (arena) {
        startSportArena(arena);
      }
    } else if (gameMode === 'playing_sport') {
      keysPressed.current.Space = true;
      setTimeout(() => {
        keysPressed.current.Space = false;
      }, 150);
    }
  };

  return (
    <div className="champion-game-container">
      {/* Top HUD */}
      <div className="champion-hud">
        <div className="hud-left">
          <div className="team-badge-pill" style={{ color: selectedTeam.color }}>
            <span>{selectedTeam.icon}</span>
            <span>{selectedTeam.name}</span>
          </div>

          <div className="scrolls-tracker" title="성스러운 두루마리 수집 현황">
            <span className="scroll-label" style={{ fontSize: '11px', color: '#CBD5E1', marginRight: '4px' }}>📜 성스러운 두루마리:</span>
            <span className={`scroll-icon ${collectedScrolls.table_tennis ? 'collected' : ''}`} title="탁구 두루마리">🏓</span>
            <span className={`scroll-icon ${collectedScrolls.archery ? 'collected' : ''}`} title="양궁 두루마리">🎯</span>
            <span className={`scroll-icon ${collectedScrolls.marathon ? 'collected' : ''}`} title="마라톤 두루마리">🏃</span>
            <span className={`scroll-icon ${collectedScrolls.climbing ? 'collected' : ''}`} title="클라이밍 두루마리">🧗</span>
          </div>
        </div>

        <div className="hud-right">
          <div className="score-display">
            <span className="score-label">챔피언 총점</span>
            <span className="score-val">{totalScore.toLocaleString()}</span>
          </div>

          <div className="hud-actions">
            <button className="btn-hud-icon" onClick={toggleMute} title={isMuted ? '음소거 해제' : '음소거'}>
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button className="btn-hud-icon" onClick={() => setIsHelpOpen(true)} title="게임 방법">
              <HelpCircle size={18} />
            </button>
            <button className="btn-hud-icon" onClick={resetGame} title="게임 다시 시작">
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="champion-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="champion-canvas"
        />

        {/* 1. Team Selection Overlay */}
        {gameMode === 'team_select' && (
          <div className="team-select-overlay">
            <h1 className="team-select-title">🏝️ 도촌 챔피언 아일랜드</h1>
            <p className="team-select-subtitle">참가할 팀을 선택하고 섬의 4대 챔피언에게 도전하세요!</p>
            <div className="team-cards-row">
              {TEAMS.map(team => (
                <div
                  key={team.id}
                  className="team-select-card"
                  style={{ color: team.color }}
                  onClick={() => handleSelectTeam(team)}
                >
                  <div className="team-card-icon">{team.icon}</div>
                  <div className="team-card-name">{team.name}</div>
                  <div className="team-card-motto">{team.motto}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Overworld Prompt Banner */}
        {gameMode === 'overworld' && arenaPrompt && (
          <div className="champion-prompt-banner">
            <span>{arenaPrompt.bossIcon}</span>
            <span>[{arenaPrompt.name}] 경기장에 입장하려면 <strong>Space / 액션 버튼</strong>을 누르세요!</span>
          </div>
        )}

        {/* 3. NPC Dialogue Popup */}
        {gameMode === 'overworld' && activeDialogue && (
          <div className="champion-dialogue-box">
            <div className="npc-portrait">{activeDialogue.icon}</div>
            <div className="dialogue-content">
              <div className="dialogue-name">{activeDialogue.name}</div>
              <div className="dialogue-text">{activeDialogue.speech}</div>
              <div className="dialogue-close-hint">[Space / Enter 또는 화면 터치로 닫기]</div>
            </div>
          </div>
        )}

        {/* 4. Match Result / Scroll Ceremony Modal */}
        {gameMode === 'result' && lastMatchResult && (
          <div className="game-result-modal">
            <div className="result-card">
              <div className="result-badge-icon">
                {lastMatchResult.won ? '📜✨' : '🔥'}
              </div>
              <h2 className="result-title">
                {lastMatchResult.won
                  ? `[${lastMatchResult.sport.scrollName}] 획득 성공!`
                  : `경기 종료 (${lastMatchResult.sport.name})`}
              </h2>
              <p className="result-subtitle">
                {lastMatchResult.won
                  ? `챔피언 ${lastMatchResult.sport.boss}를 꺾고 성스러운 두루마리를 손에 넣었습니다!`
                  : '아쉽습니다! 다음 도전에서 챔피언을 꺾어보세요!'}
              </p>

              <div className="result-score-box">
                <div className="result-score-label">이번 경기 획득 점수</div>
                <div className="result-score-val">+{lastMatchResult.score.toLocaleString()}점</div>
              </div>

              {/* Hall of Fame Score Registration Form: ONLY for score > 100 */}
              {totalScore > 100 && !submitSuccess && (
                <form onSubmit={handleScoreSubmit} className="leaderboard-form">
                  <input
                    type="text"
                    className="leaderboard-input"
                    placeholder="예: 홍길동"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={10}
                    required
                  />
                  <button type="submit" className="btn-submit-score" disabled={isSubmitting}>
                    <Trophy size={16} />
                    <span>{isSubmitting ? '등록 중...' : '도촌초 명예의 전당 등록'}</span>
                  </button>
                </form>
              )}

              {submitSuccess && (
                <div style={{ color: '#10B981', fontWeight: 800, margin: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <CheckCircle2 size={18} />
                  <span>명예의 전당에 성공적으로 등록되었습니다!</span>
                </div>
              )}

              <div className="result-buttons-row">
                <button className="btn-return-map" onClick={returnToOverworld}>
                  <span>섬으로 돌아가기</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Touch Controls */}
      <div className="mobile-controls">
        <div className="dpad-container">
          <button
            className="btn-dpad dpad-up"
            onTouchStart={() => handleMobileDpad('ArrowUp', true)}
            onTouchEnd={() => handleMobileDpad('ArrowUp', false)}
            onMouseDown={() => handleMobileDpad('ArrowUp', true)}
            onMouseUp={() => handleMobileDpad('ArrowUp', false)}
          >▲</button>
          <button
            className="btn-dpad dpad-left"
            onTouchStart={() => handleMobileDpad('ArrowLeft', true)}
            onTouchEnd={() => handleMobileDpad('ArrowLeft', false)}
            onMouseDown={() => handleMobileDpad('ArrowLeft', true)}
            onMouseUp={() => handleMobileDpad('ArrowLeft', false)}
          >◀</button>
          <button
            className="btn-dpad dpad-right"
            onTouchStart={() => handleMobileDpad('ArrowRight', true)}
            onTouchEnd={() => handleMobileDpad('ArrowRight', false)}
            onMouseDown={() => handleMobileDpad('ArrowRight', true)}
            onMouseUp={() => handleMobileDpad('ArrowRight', false)}
          >▶</button>
          <button
            className="btn-dpad dpad-down"
            onTouchStart={() => handleMobileDpad('ArrowDown', true)}
            onTouchEnd={() => handleMobileDpad('ArrowDown', false)}
            onMouseDown={() => handleMobileDpad('ArrowDown', true)}
            onMouseUp={() => handleMobileDpad('ArrowDown', false)}
          >▼</button>
        </div>

        <div className="action-buttons-container">
          <button
            className="btn-action-round"
            onClick={handleMobileAction}
          >
            <span>ACTION</span>
            <span style={{ fontSize: '10px' }}>SPACE</span>
          </button>
        </div>
      </div>

      {/* How to Play Modal */}
      <ChampionHowToPlayModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
