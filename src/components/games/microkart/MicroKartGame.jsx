// Dochon Games Portal - Micro Kart Racing React Component
// 100% Zero-Asset Procedural Graphics, Web Audio API & WebRTC P2P Support

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MicroKartLogic } from './microKartLogic';
import { microKartAudio } from './microKartAudio';
import { microKartNet, MicroKartNetworkManager } from './microKartNetwork';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  TOTAL_LAPS,
  KART_SKINS,
  ITEM_CONFIGS,
  DIFFICULTY_PRESETS
} from './microKartConstants';
import { renderTrack, TRACK_WAYPOINTS } from './microKartTrack';
import MicroKartHowToPlayModal from './MicroKartHowToPlayModal';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import { haptics } from '../../../utils/haptics';
import {
  Trophy, RotateCcw, Volume2, VolumeX, HelpCircle,
  Sparkles, Play, Users, Globe, Copy, Check, LogOut,
  Send, User, Award, ShieldAlert, Zap, Flag, ArrowUp, ArrowDown,
  ArrowLeft, ArrowRight
} from 'lucide-react';
import './microkart.css';

export default function MicroKartGame({ onScoreSubmitted }) {
  const canvasRef = useRef(null);
  const minimapCanvasRef = useRef(null);
  const logicRef = useRef(null);
  const reqAnimRef = useRef(null);
  const lastTimeRef = useRef(0);
  const cameraRef = useRef({ x: 500, y: 1950 });

  // High-Level Game State
  const [gameState, setGameState] = useState('LOBBY'); // 'LOBBY' | 'PLAYING' | 'GAME_OVER'
  const [playMode, setPlayMode] = useState('SOLO');    // 'SOLO' | 'P2P'
  const [selectedSkin, setSelectedSkin] = useState('eraser');
  const [difficulty, setDifficulty] = useState('normal');
  const [isMuted, setIsMuted] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // In-Game Live HUD Stats
  const [hudStats, setHudStats] = useState({
    currentLap: 1,
    totalLaps: TOTAL_LAPS,
    myRank: 1,
    totalRacers: 5,
    speed: 0,
    raceTime: 0,
    currentItem: null
  });

  // P2P Multiplayer State
  const [p2pSubtab, setP2pSubtab] = useState('CREATE'); // 'CREATE' | 'JOIN'
  const [p2pCode, setP2pCode] = useState(() => MicroKartNetworkManager.generateRandomCode());
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [p2pName, setP2pName] = useState('');
  const [p2pIsHost, setP2pIsHost] = useState(false);
  const [p2pPlayers, setP2pPlayers] = useState([]);
  const [p2pConnecting, setP2pConnecting] = useState(false);
  const [p2pStatus, setP2pStatus] = useState('');
  const [p2pError, setP2pError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Results & Leaderboard Submission State
  const [gameResult, setGameResult] = useState(null);
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [isScoreSubmitted, setIsScoreSubmitted] = useState(false);

  // Keyboard Input State Tracking
  const keyStateRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    drift: false,
    item: false
  });

  // Mute Audio Toggle
  const handleToggleMute = () => {
    const muted = microKartAudio.toggleMute();
    setIsMuted(muted);
  };

  // --- KEYBOARD CONTROLS LISTENERS ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'PLAYING') return;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        keyStateRef.current.up = true;
        e.preventDefault();
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        keyStateRef.current.down = true;
        e.preventDefault();
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keyStateRef.current.left = true;
        e.preventDefault();
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keyStateRef.current.right = true;
        e.preventDefault();
      }
      if (e.key === ' ' || e.key === 'Shift') {
        keyStateRef.current.drift = true;
        e.preventDefault();
      }
      if (e.key === 'Control' || e.key === 'e' || e.key === 'E') {
        keyStateRef.current.item = true;
        if (logicRef.current) logicRef.current.usePlayerItem();
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        keyStateRef.current.up = false;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        keyStateRef.current.down = false;
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keyStateRef.current.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keyStateRef.current.right = false;
      }
      if (e.key === ' ' || e.key === 'Shift') {
        keyStateRef.current.drift = false;
      }
      if (e.key === 'Control' || e.key === 'e' || e.key === 'E') {
        keyStateRef.current.item = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Touch Virtual Controls
  const handleTouchControl = (action, isPressed) => {
    if (action === 'up') keyStateRef.current.up = isPressed;
    if (action === 'down') keyStateRef.current.down = isPressed;
    if (action === 'left') keyStateRef.current.left = isPressed;
    if (action === 'right') keyStateRef.current.right = isPressed;
    if (action === 'drift') keyStateRef.current.drift = isPressed;
    if (action === 'item' && isPressed) {
      if (logicRef.current) logicRef.current.usePlayerItem();
    }
  };

  // Launch Local Engine
  const startMatch = useCallback(() => {
    const logic = new MicroKartLogic({
      mode: playMode,
      difficulty,
      playerSkin: selectedSkin,
      playerName: p2pName.trim() || '나',
      audio: microKartAudio,
      onRaceFinish: (results) => {
        setGameResult(results);
        setGameState('GAME_OVER');
      }
    });

    logicRef.current = logic;
    lastTimeRef.current = performance.now();
    setGameState('PLAYING');
    setIsScoreSubmitted(false);
  }, [playMode, difficulty, selectedSkin, p2pName]);

  // --- P2P NETWORK EVENT BINDINGS ---
  useEffect(() => {
    microKartNet.onConnectionStatus = (msg) => setP2pStatus(msg);
    microKartNet.onError = (err) => {
      setP2pError(err);
      setP2pConnecting(false);
    };
    microKartNet.onLobbyUpdate = (players) => {
      setP2pPlayers(players);
      setP2pConnecting(false);
    };
    microKartNet.onRoomCodeChanged = (newCode) => setP2pCode(newCode);
    microKartNet.onGameStart = () => startMatch();

    return () => {
      microKartNet.disconnect();
    };
  }, [startMatch]);

  // Host Creates P2P Room
  const handleCreateRoom = async () => {
    setP2pConnecting(true);
    setP2pError('');
    setP2pStatus('방 생성 중...');
    try {
      const code = await microKartNet.createRoom(p2pCode, p2pName || '호스트', selectedSkin);
      setP2pIsHost(true);
      setP2pCode(code);
    } catch (e) {
      setP2pConnecting(false);
    }
  };

  // Guest Joins P2P Room
  const handleJoinRoom = async () => {
    if (!joinCodeInput.trim()) {
      setP2pError('4자리 방 번호를 입력해주세요.');
      return;
    }
    setP2pConnecting(true);
    setP2pError('');
    try {
      await microKartNet.joinRoom(joinCodeInput, p2pName || '게스트', selectedSkin);
      setP2pIsHost(false);
    } catch (e) {
      setP2pConnecting(false);
    }
  };

  // Host Starts P2P Match
  const handleHostStartMatch = () => {
    if (!p2pIsHost) return;
    microKartNet.broadcastGameStart();
    startMatch();
  };

  // Copy Room Code Helper
  const handleCopyCode = () => {
    navigator.clipboard.writeText(p2pCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // --- GAME LOOP (Capped at 30FPS Smart Rendering for Chromebook 50% GPU Reduction) ---
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let animId;
    const TARGET_FPS = 30;
    const FRAME_INTERVAL = 1000 / TARGET_FPS; // 33.33ms
    let lastRenderTime = performance.now();

    const loop = (currentTime) => {
      try {
        const elapsed = currentTime - lastRenderTime;

        if (elapsed >= FRAME_INTERVAL) {
          lastRenderTime = currentTime - (elapsed % FRAME_INTERVAL);
          const dt = Math.min(elapsed / 1000, 0.08);

          const logic = logicRef.current;
          const canvas = canvasRef.current;

          if (logic && canvas) {
            // 1. Update Player Controls
            const steer = (keyStateRef.current.right ? 1 : 0) - (keyStateRef.current.left ? 1 : 0);
            const throttle = (keyStateRef.current.up ? 1 : 0) - (keyStateRef.current.down ? 1 : 0);
            logic.setPlayerInput({
              throttle,
              steer,
              drift: keyStateRef.current.drift
            });

            // 2. Step Physics Engine
            logic.update(dt);

            // 3. Update HUD Stats
            const player = logic.karts.find(k => k.isPlayer);
            if (player) {
              setHudStats({
                currentLap: Math.min(player.currentLap, TOTAL_LAPS),
                totalLaps: TOTAL_LAPS,
                myRank: logic.getKartRank('player'),
                totalRacers: logic.karts.length,
                speed: Math.round(Math.abs(player.speed) * 14),
                raceTime: logic.totalRaceTime,
                currentItem: player.item
              });

              // Smooth Camera Follow Lerp
              const targetCamX = player.x - CANVAS_WIDTH / 2;
              const targetCamY = player.y - CANVAS_HEIGHT / 2;
              cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.12;
              cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.12;

              // Clamp Camera to World
              cameraRef.current.x = Math.max(0, Math.min(WORLD_WIDTH - CANVAS_WIDTH, cameraRef.current.x));
              cameraRef.current.y = Math.max(0, Math.min(WORLD_HEIGHT - CANVAS_HEIGHT, cameraRef.current.y));
            }

            // 4. Render Main Game Viewport
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.save();
              // Camera Translation
              ctx.translate(-cameraRef.current.x, -cameraRef.current.y);

              const viewport = {
                left: cameraRef.current.x,
                top: cameraRef.current.y,
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT
              };

              // Render Track & Desk Environment
              renderTrack(ctx, viewport, logic.animTick, logic.itemBoxes);

              // Render Skidmarks
              ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
              ctx.lineWidth = 14;
              ctx.lineCap = 'round';
              logic.skidmarks.forEach(sm => {
                ctx.beginPath();
                ctx.arc(sm.x, sm.y, 7, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(15, 23, 42, ${sm.alpha})`;
                ctx.fill();
              });

              // Render Traps (Bananas)
              logic.traps.forEach(trap => {
                ctx.save();
                ctx.translate(trap.x, trap.y);
                ctx.font = '22px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🍌', 0, 0);
                ctx.restore();
              });

              // Render Projectiles
              logic.projectiles.forEach(proj => {
                ctx.save();
                ctx.translate(proj.x, proj.y);
                ctx.font = '24px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                if (proj.type === 'WATER_BALLOON') {
                  ctx.fillText('💧', 0, 0);
                } else if (proj.type === 'ROCKET') {
                  ctx.rotate(proj.angle || 0);
                  ctx.fillText('🚀', 0, 0);
                }
                ctx.restore();
              });

              // Render Karts
              logic.karts.forEach(kart => {
                ctx.save();
                ctx.translate(kart.x, kart.y);
                ctx.rotate(kart.angle);

                // Shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
                ctx.beginPath();
                ctx.ellipse(3, 4, 24, 16, 0, 0, Math.PI * 2);
                ctx.fill();

                // Kart Body (Chassis)
                const skin = kart.skin || KART_SKINS[0];
                ctx.fillStyle = skin.bodyColor || '#38BDF8';
                ctx.beginPath();
                ctx.roundRect(-22, -14, 44, 28, 6);
                ctx.fill();

                // Kart Nose / Hood Accent
                ctx.fillStyle = skin.accentColor || '#0284C7';
                ctx.beginPath();
                ctx.roundRect(4, -10, 16, 20, 4);
                ctx.fill();

                // Wheels (4 black rubber tires)
                ctx.fillStyle = '#0F172A';
                // Front tires
                ctx.fillRect(8, -17, 10, 6);
                ctx.fillRect(8, 11, 10, 6);
                // Rear tires
                ctx.fillRect(-18, -17, 12, 6);
                ctx.fillRect(-18, 11, 12, 6);

                // Driver Helmet / Character Emoji
                ctx.font = '16px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(skin.avatarEmoji || '🏎️', -2, 0);

                // Shield Bubble Effect
                if (kart.shieldTimer > 0) {
                  ctx.strokeStyle = '#8B5CF6';
                  ctx.lineWidth = 3;
                  ctx.beginPath();
                  ctx.arc(0, 0, 30, 0, Math.PI * 2);
                  ctx.stroke();
                  ctx.fillStyle = 'rgba(139, 92, 246, 0.2)';
                  ctx.fill();
                }

                // Water Bubble Cage
                if (kart.waterTrapTimer > 0) {
                  ctx.strokeStyle = '#38BDF8';
                  ctx.lineWidth = 3;
                  ctx.beginPath();
                  ctx.arc(0, 0, 28, 0, Math.PI * 2);
                  ctx.stroke();
                  ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
                  ctx.fill();
                }

                // Reverse rotation for upright name label
                ctx.rotate(-kart.angle);
                ctx.font = 'bold 11px sans-serif';
                ctx.fillStyle = kart.isPlayer ? '#FDE047' : '#FFFFFF';
                ctx.textAlign = 'center';
                ctx.fillText(kart.name, 0, -26);

                ctx.restore();
              });

              // Render Particle Systems
              logic.particles.forEach(p => {
                ctx.save();
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life / p.maxLife;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
              });

              ctx.restore();
            }

            // 5. Render Minimap Radar (Throttled to every 3 frames for Chromebook performance)
            if (logic.animTick % 3 === 0) {
              const mCanvas = minimapCanvasRef.current;
              if (mCanvas) {
                const mCtx = mCanvas.getContext('2d');
                if (mCtx) {
                  mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height);
                  const scaleX = mCanvas.width / WORLD_WIDTH;
                  const scaleY = mCanvas.height / WORLD_HEIGHT;

                  // Draw miniature track path
                  mCtx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
                  mCtx.lineWidth = 5;
                  mCtx.beginPath();
                  mCtx.moveTo(TRACK_WAYPOINTS[0].x * scaleX, TRACK_WAYPOINTS[0].y * scaleY);
                  TRACK_WAYPOINTS.forEach(wp => {
                    mCtx.lineTo(wp.x * scaleX, wp.y * scaleY);
                  });
                  mCtx.closePath();
                  mCtx.stroke();

                  // Draw Kart Blips
                  logic.karts.forEach(k => {
                    mCtx.beginPath();
                    mCtx.arc(k.x * scaleX, k.y * scaleY, k.isPlayer ? 4.5 : 3, 0, Math.PI * 2);
                    mCtx.fillStyle = k.isPlayer ? '#F59E0B' : (k.skin ? k.skin.color : '#FFFFFF');
                    mCtx.fill();
                  });
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('[MicroKart Loop Error]', err);
      } finally {
        animId = requestAnimationFrame(loop);
        reqAnimRef.current = animId;
      }
    };

    animId = requestAnimationFrame(loop);
    reqAnimRef.current = animId;

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [gameState]);

  // Submit Score to Hall of Fame
  // STRICT RULES:
  // 1. score <= 100 is hidden/blocked
  // 2. placeholder = '예: 홍길동'
  // 3. onScoreSubmitted('microkart') opens leaderboard with microkart tab!
  const handleSubmitScore = async (e) => {
    e.preventDefault();
    if (!gameResult || gameResult.totalScore <= 100) return;
    if (!playerNameInput.trim() || isSubmittingScore || isScoreSubmitted) return;

    setIsSubmittingScore(true);
    try {
      await submitScoreToDB('microkart', playerNameInput.trim(), gameResult.totalScore);
      setIsScoreSubmitted(true);
      haptics.success();

      if (onScoreSubmitted) {
        setTimeout(() => {
          onScoreSubmitted('microkart');
        }, 400);
      }
    } catch (err) {
      console.error('Failed to submit microkart score:', err);
    } finally {
      setIsSubmittingScore(false);
    }
  };

  const handleBackToLobby = () => {
    if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
    microKartNet.disconnect();
    setP2pPlayers([]);
    setP2pIsHost(false);
    setGameState('LOBBY');
    setGameResult(null);
  };

  return (
    <div className="microkart-container">
      {/* Top Header Bar */}
      <div className="microkart-header">
        <div className="microkart-header-title">
          <span style={{ fontSize: '24px' }}>🏎️</span>
          <h1>도촌 마이크로 카트 레이싱</h1>
        </div>

        <div className="microkart-header-controls">
          <button
            className="microkart-icon-btn"
            onClick={() => setShowHowToPlay(true)}
            title="게임 가이드"
          >
            <HelpCircle size={18} />
          </button>
          <button
            className="microkart-icon-btn"
            onClick={handleToggleMute}
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          {gameState !== 'LOBBY' && (
            <button
              className="microkart-icon-btn"
              onClick={handleBackToLobby}
              title="로비로 나가기"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Viewport Area */}
      <div className="microkart-viewport">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="microkart-canvas"
        />

        {/* In-Game HUD (Only during PLAYING) */}
        {gameState === 'PLAYING' && (
          <>
            {/* Top Left: Lap & Speed */}
            <div className="microkart-hud-top-left">
              <div className="microkart-badge microkart-lap-badge">
                <Flag size={14} />
                <span>LAP {hudStats.currentLap} / {hudStats.totalLaps}</span>
              </div>
              <div className="microkart-badge">
                <Zap size={14} color="#FBBF24" />
                <span>{hudStats.speed} KM/H</span>
              </div>
            </div>

            {/* Top Center: Minimap Radar */}
            <div className="microkart-minimap-wrapper">
              <canvas
                ref={minimapCanvasRef}
                width={140}
                height={105}
                className="microkart-minimap-canvas"
              />
            </div>

            {/* Top Right: Rank Badge */}
            <div className="microkart-hud-top-right">
              <div className={`microkart-rank-badge ${hudStats.myRank === 1 ? 'microkart-rank-1' : hudStats.myRank === 2 ? 'microkart-rank-2' : 'microkart-rank-other'}`}>
                <Trophy size={18} />
                <span>{hudStats.myRank}위</span>
              </div>
            </div>

            {/* Bottom Center: Item Slot */}
            <div className="microkart-item-slot-wrapper">
              <div
                className={`microkart-item-slot ${!hudStats.currentItem ? 'empty' : ''}`}
                onClick={() => {
                  if (logicRef.current) logicRef.current.usePlayerItem();
                }}
              >
                {hudStats.currentItem ? (
                  ITEM_CONFIGS[hudStats.currentItem] ? ITEM_CONFIGS[hudStats.currentItem].emoji : '❓'
                ) : (
                  <span style={{ fontSize: '18px', opacity: 0.3 }}>ITEM</span>
                )}
              </div>
              <div className="microkart-item-hint">E / Ctrl / 터치로 사용</div>
            </div>

            {/* Mobile Touch Virtual Controls */}
            <div className="microkart-mobile-controls">
              <div className="microkart-touch-dpad">
                <button
                  className="microkart-touch-btn"
                  onTouchStart={() => handleTouchControl('left', true)}
                  onTouchEnd={() => handleTouchControl('left', false)}
                >
                  <ArrowLeft size={24} />
                </button>
                <button
                  className="microkart-touch-btn"
                  onTouchStart={() => handleTouchControl('right', true)}
                  onTouchEnd={() => handleTouchControl('right', false)}
                >
                  <ArrowRight size={24} />
                </button>
              </div>

              <div className="microkart-touch-actions">
                <button
                  className="microkart-touch-btn drift"
                  onTouchStart={() => handleTouchControl('drift', true)}
                  onTouchEnd={() => handleTouchControl('drift', false)}
                >
                  DRIFT
                </button>
                <button
                  className="microkart-touch-btn brake"
                  onTouchStart={() => handleTouchControl('down', true)}
                  onTouchEnd={() => handleTouchControl('down', false)}
                >
                  <ArrowDown size={22} />
                </button>
                <button
                  className="microkart-touch-btn accel"
                  onTouchStart={() => handleTouchControl('up', true)}
                  onTouchEnd={() => handleTouchControl('up', false)}
                >
                  <ArrowUp size={28} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* LOBBY MODAL */}
        {gameState === 'LOBBY' && (
          <div className="microkart-overlay">
            <div className="microkart-card">
              <h2 className="microkart-card-title">🏁 도촌 마이크로 카트 레이싱</h2>

              {/* Mode Select Tabs */}
              <div className="microkart-tabs">
                <button
                  className={`microkart-tab ${playMode === 'SOLO' ? 'active' : ''}`}
                  onClick={() => setPlayMode('SOLO')}
                >
                  <User size={16} />
                  솔로 모드 (vs AI)
                </button>
                <button
                  className={`microkart-tab ${playMode === 'P2P' ? 'active' : ''}`}
                  onClick={() => setPlayMode('P2P')}
                >
                  <Users size={16} />
                  실시간 P2P 친구 대전
                </button>
              </div>

              {/* Racer Name Input */}
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 700, marginBottom: '4px', display: 'block' }}>
                  레이서 닉네임
                </label>
                <input
                  type="text"
                  value={p2pName}
                  onChange={(e) => setP2pName(e.target.value)}
                  placeholder="예: 김도촌 (6A)"
                  maxLength={10}
                  className="microkart-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {/* Kart Skin Selector */}
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 700, marginBottom: '4px', display: 'block' }}>
                  머신 선택
                </label>
                <div className="microkart-skin-grid">
                  {KART_SKINS.map(skin => (
                    <div
                      key={skin.id}
                      className={`microkart-skin-card ${selectedSkin === skin.id ? 'selected' : ''}`}
                      onClick={() => setSelectedSkin(skin.id)}
                    >
                      <span style={{ fontSize: '24px' }}>{skin.avatarEmoji}</span>
                      <div className="microkart-skin-info">
                        <span className="microkart-skin-name" style={{ color: skin.color }}>{skin.name}</span>
                        <span className="microkart-skin-type">{skin.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Solo Mode Settings */}
              {playMode === 'SOLO' && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 700, marginBottom: '4px', display: 'block' }}>
                    난이도 설정
                  </label>
                  <div className="microkart-tabs">
                    {Object.keys(DIFFICULTY_PRESETS).map(key => (
                      <button
                        key={key}
                        className={`microkart-tab ${difficulty === key ? 'active' : ''}`}
                        onClick={() => setDifficulty(key)}
                      >
                        {DIFFICULTY_PRESETS[key].name}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={startMatch}
                    className="microkart-btn-primary"
                    style={{ marginTop: '14px' }}
                  >
                    <Play size={18} />
                    경기 시작 (3 Laps)
                  </button>
                </div>
              )}

              {/* P2P Multiplayer Room Management */}
              {playMode === 'P2P' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="microkart-tabs">
                    <button
                      className={`microkart-tab ${p2pSubtab === 'CREATE' ? 'active' : ''}`}
                      onClick={() => setP2pSubtab('CREATE')}
                    >
                      방 만들기
                    </button>
                    <button
                      className={`microkart-tab ${p2pSubtab === 'JOIN' ? 'active' : ''}`}
                      onClick={() => setP2pSubtab('JOIN')}
                    >
                      방 참여하기
                    </button>
                  </div>

                  {p2pSubtab === 'CREATE' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>내 방 번호</span>
                          <div style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '2px', color: '#FBBF24' }}>
                            {p2pCode}
                          </div>
                        </div>
                        <button onClick={handleCopyCode} className="microkart-icon-btn">
                          {copiedCode ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
                        </button>
                      </div>

                      {p2pPlayers.length === 0 ? (
                        <button
                          onClick={handleCreateRoom}
                          disabled={p2pConnecting}
                          className="microkart-btn-primary"
                        >
                          {p2pConnecting ? '방 생성 중...' : '방 생성 & 대기실 열기'}
                        </button>
                      ) : (
                        <div>
                          <div style={{ fontSize: '0.82rem', color: '#10B981', fontWeight: 700, marginBottom: '6px' }}>
                            참여 인원 ({p2pPlayers.length}/4)
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                            {p2pPlayers.map((p, i) => (
                              <div key={p.id || i} style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{p.name} {p.isHost && '👑'}</span>
                                <span style={{ color: '#94A3B8' }}>Ready</span>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={handleHostStartMatch}
                            className="microkart-btn-primary"
                          >
                            <Play size={18} />
                            참가자들과 레이스 시작!
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {p2pSubtab === 'JOIN' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value)}
                        placeholder="친구의 4자리 방 번호 입력"
                        maxLength={4}
                        className="microkart-input"
                        style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '3px' }}
                      />
                      <button
                        onClick={handleJoinRoom}
                        disabled={p2pConnecting}
                        className="microkart-btn-primary"
                      >
                        {p2pConnecting ? '입장 중...' : '방 입장하기'}
                      </button>
                    </div>
                  )}

                  {p2pStatus && <div style={{ fontSize: '0.75rem', color: '#38BDF8', textAlign: 'center' }}>{p2pStatus}</div>}
                  {p2pError && <div style={{ fontSize: '0.75rem', color: '#EF4444', textAlign: 'center' }}>{p2pError}</div>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* RESULTS & HALL OF FAME MODAL */}
        {gameState === 'GAME_OVER' && gameResult && (
          <div className="microkart-overlay">
            <div className="microkart-card">
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '38px' }}>
                  {gameResult.playerRank === 1 ? '🏆' : gameResult.playerRank === 2 ? '🥈' : '🥉'}
                </span>
                <h2 className="microkart-card-title" style={{ marginTop: '4px' }}>
                  {gameResult.playerRank}위 완주!
                </h2>
              </div>

              {/* Score Breakdown Box */}
              <div className="microkart-result-score-box">
                <div className="microkart-result-row">
                  <span>완주 순위 배점 ({gameResult.playerRank}위)</span>
                  <span style={{ color: '#FFFFFF' }}>+{gameResult.rankBasePoints}점</span>
                </div>
                <div className="microkart-result-row">
                  <span>기록 시간 보너스 ({Math.floor(gameResult.finalTime)}초)</span>
                  <span style={{ color: '#FFFFFF' }}>+{gameResult.timeBonus}점</span>
                </div>
                <div className="microkart-result-row">
                  <span>드리프트 성공 보너스</span>
                  <span style={{ color: '#FFFFFF' }}>+{gameResult.driftBonus}점</span>
                </div>
                <div className="microkart-result-row">
                  <span>아이템 적중 보너스</span>
                  <span style={{ color: '#FFFFFF' }}>+{gameResult.itemBonus}점</span>
                </div>
                <div className="microkart-result-row total">
                  <span>최종 획득 점수</span>
                  <span>{gameResult.totalScore.toLocaleString()}점</span>
                </div>
              </div>

              {/* Hall of Fame Score Submission (STRICT RULES ENFORCED) */}
              {/* Rule: score <= 100 is completely hidden */}
              {gameResult.totalScore > 100 && (
                <form onSubmit={handleSubmitScore} className="microkart-submit-form">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 800, color: '#F59E0B' }}>
                    <Trophy size={16} />
                    <span>도촌 명예의 전당 점수 등록</span>
                  </div>
                  {isScoreSubmitted ? (
                    <div style={{ color: '#10B981', fontSize: '0.82rem', fontWeight: 800, textAlign: 'center', padding: '6px' }}>
                      ✅ 점수가 명예의 전당에 성공적으로 등록되었습니다!
                    </div>
                  ) : (
                    <div className="microkart-input-group">
                      <input
                        type="text"
                        value={playerNameInput}
                        onChange={(e) => setPlayerNameInput(e.target.value)}
                        placeholder="예: 홍길동"
                        maxLength={12}
                        className="microkart-input"
                        disabled={isSubmittingScore}
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingScore || !playerNameInput.trim()}
                        className="microkart-submit-btn"
                      >
                        {isSubmittingScore ? '등록 중...' : '등록'}
                      </button>
                    </div>
                  )}
                </form>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={startMatch}
                  className="microkart-btn-primary"
                >
                  <RotateCcw size={16} />
                  다시 달리기
                </button>
                <button
                  onClick={handleBackToLobby}
                  className="microkart-btn-secondary"
                >
                  로비로 나가기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Game Guide Modal */}
      <MicroKartHowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />
    </div>
  );
}
