// Dochon Games Portal - Dochon Pirate Coin Heist Main Component
// 34th Official Playable Game - WebRTC P2P Multiplayer & Solo AI Practice Battle

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Trophy,
  Volume2,
  VolumeX,
  HelpCircle,
  Play,
  RotateCcw,
  Users,
  Anchor,
  Compass,
  ArrowLeft,
  Shield,
  Zap,
  Check
} from 'lucide-react';
import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  MATCH_DURATION_SEC,
  SHIP_CLASSES,
  ITEM_TYPES,
  TEAM_BASES,
  AI_DIFFICULTIES
} from './pirateCoinConstants.js';
import { PirateCoinMap } from './pirateCoinMap.js';
import { PirateCoinLogic } from './pirateCoinLogic.js';
import { pirateAudio } from './pirateCoinAudio.js';
import { pirateNet } from './pirateCoinNetwork.js';
import PirateCoinHowToPlayModal from './PirateCoinHowToPlayModal.jsx';
import { submitScoreToDB } from '../../../utils/leaderboardApi.js';
import './piratecoin.css';

export default function PirateCoinGame({ onScoreSubmitted, onBackToLobby, isMuted: parentMuted = false }) {
  // Game States
  const [gameState, setGameState] = useState('lobby'); // 'lobby' | 'playing' | 'gameover'
  const [lobbyTab, setLobbyTab] = useState('solo'); // 'solo' | 'multi'
  const [selectedShip, setSelectedShip] = useState('caravel');
  const [selectedDifficulty, setSelectedDifficulty] = useState('normal');
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('dochon_player_name') || '도촌 해적';
  });
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [activeRoomCode, setActiveRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [networkStatus, setNetworkStatus] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // In-game HUD States
  const [timeLeft, setTimeLeft] = useState(MATCH_DURATION_SEC);
  const [heldCoins, setHeldCoins] = useState(0);
  const [bankedScore, setBankedScore] = useState(0);
  const [currentSlotItem, setCurrentSlotItem] = useState(null);
  const [standings, setStandings] = useState([]);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(parentMuted);

  // Game Over States
  const [finalRankings, setFinalRankings] = useState([]);
  const [finalScore, setFinalScore] = useState(0);
  const [submitName, setSubmitName] = useState(playerName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Canvas Refs
  const canvasRef = useRef(null);
  const minimapCanvasRef = useRef(null);
  const animFrameIdRef = useRef(null);

  // Engines
  const mapEngineRef = useRef(new PirateCoinMap());
  const logicEngineRef = useRef(null);

  // Keys State
  const keysPressedRef = useRef({
    forward: false,
    backward: false,
    turnLeft: false,
    turnRight: false,
    useItem: false
  });

  // Sync Audio Mute
  useEffect(() => {
    pirateAudio.setMuted(isAudioMuted);
  }, [isAudioMuted]);

  // Setup P2P Network Callbacks
  useEffect(() => {
    pirateNet.onConnectionStatus = (status) => setNetworkStatus(status);
    pirateNet.onRoomCodeChanged = (code) => setActiveRoomCode(code);
    pirateNet.onLobbyUpdate = (players) => setLobbyPlayers(players);

    pirateNet.onGameStart = (config) => {
      startMatch(config.isMultiplayer, config.difficulty);
    };

    pirateNet.onSnapshot = (snapshot) => {
      if (logicEngineRef.current && !pirateNet.isHost) {
        // Sync guest view from host snapshot
        const logic = logicEngineRef.current;
        if (snapshot.players) {
          snapshot.players.forEach((sp) => {
            const lp = logic.players.find((p) => p.id === sp.id);
            if (lp) {
              lp.x = sp.x;
              lp.y = sp.y;
              lp.angle = sp.angle;
              lp.speed = sp.speed;
              lp.heldCoins = sp.heldCoins;
              lp.bankedScore = sp.bankedScore;
              lp.shieldActive = sp.shieldActive;
              lp.stunEndTime = sp.stunEndTime;
              lp.boostEndTime = sp.boostEndTime;
              lp.currentSlotItem = sp.currentSlotItem;
            }
          });
        }
        if (snapshot.coins) logic.coins = snapshot.coins;
        if (snapshot.crates) logic.itemCrates = snapshot.crates;
        if (snapshot.projectiles) logic.projectiles = snapshot.projectiles;
        if (snapshot.timeLeft !== undefined) setTimeLeft(snapshot.timeLeft);
      }
    };

    pirateNet.onClientInput = (guestId, inputs) => {
      if (logicEngineRef.current && pirateNet.isHost) {
        const guest = logicEngineRef.current.players.find((p) => p.id === guestId);
        if (guest) guest.inputs = inputs;
      }
    };

    pirateNet.onGameOver = (results) => {
      handleMatchEnd(results);
    };

    pirateNet.onError = (err) => {
      setIsConnecting(false);
      alert(err.message || '네트워크 연결 오류');
    };

    return () => {
      pirateNet.destroy();
    };
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;
      const k = e.key.toLowerCase();

      if (k === 'arrowup' || k === 'w') {
        keysPressedRef.current.forward = true;
        e.preventDefault();
      } else if (k === 'arrowdown' || k === 's') {
        keysPressedRef.current.backward = true;
        e.preventDefault();
      } else if (k === 'arrowleft' || k === 'a') {
        keysPressedRef.current.turnLeft = true;
        e.preventDefault();
      } else if (k === 'arrowright' || k === 'd') {
        keysPressedRef.current.turnRight = true;
        e.preventDefault();
      } else if (k === ' ' || k === 'e' || k === 'shift') {
        keysPressedRef.current.useItem = true;
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') keysPressedRef.current.forward = false;
      if (k === 'arrowdown' || k === 's') keysPressedRef.current.backward = false;
      if (k === 'arrowleft' || k === 'a') keysPressedRef.current.turnLeft = false;
      if (k === 'arrowright' || k === 'd') keysPressedRef.current.turnRight = false;
      if (k === ' ' || k === 'e' || k === 'shift') keysPressedRef.current.useItem = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // --- Start Game Match ---
  const startMatch = (isMulti = false, difficultyKey = selectedDifficulty) => {
    localStorage.setItem('dochon_player_name', playerName);

    const logic = new PirateCoinLogic({
      difficulty: difficultyKey,
      isMultiplayer: isMulti
    });

    const myTeamId = isMulti ? pirateNet.myTeamId : 0;
    logic.initMatch({
      id: isMulti ? pirateNet.myPeerId : 'player_me',
      name: playerName,
      shipClass: selectedShip,
      teamId: myTeamId
    });

    logicEngineRef.current = logic;
    setTimeLeft(MATCH_DURATION_SEC);
    setGameState('playing');
    setHasSubmitted(false);
    setSubmitError('');

    pirateAudio.playHorn();

    // Broadcast match start if Host
    if (isMulti && pirateNet.isHost) {
      pirateNet.broadcastGameStart({
        isMultiplayer: true,
        difficulty: difficultyKey
      });
    }
  };

  // --- Host Room Action ---
  const handleHostRoom = async () => {
    setIsConnecting(true);
    try {
      const code = await pirateNet.createHostRoom(roomCodeInput, playerName, selectedShip);
      setActiveRoomCode(code);
      setIsHost(true);
      setIsConnecting(false);
    } catch (e) {
      setIsConnecting(false);
    }
  };

  // --- Join Room Action ---
  const handleJoinRoom = async () => {
    if (!roomCodeInput || roomCodeInput.trim().length !== 4) {
      alert('4자리 숫자 방 코드를 입력해 주세요. (예: 1234)');
      return;
    }
    setIsConnecting(true);
    try {
      const code = await pirateNet.joinGuestRoom(roomCodeInput, playerName, selectedShip);
      setActiveRoomCode(code);
      setIsHost(false);
      setIsConnecting(false);
    } catch (e) {
      setIsConnecting(false);
    }
  };

  // --- Handle Game Over Results ---
  const handleMatchEnd = useCallback((calculatedResults) => {
    setGameState('gameover');
    pirateAudio.playVictory();

    const sorted = [...calculatedResults].sort((a, b) => b.score - a.score);
    setFinalRankings(sorted);

    const myResult = sorted.find((r) => r.isMe);
    const myScore = myResult ? myResult.score : 0;
    setFinalScore(myScore);

    if (pirateNet.isHost) {
      pirateNet.broadcastGameOver(sorted);
    }
  }, []);

  // --- Score Submission to Honor Roll Leaderboard ---
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (!submitName.trim()) {
      setSubmitError('선장님의 이름을 입력해 주세요.');
      return;
    }
    if (finalScore <= 100) {
      setSubmitError('100점 이하의 점수는 명예의 전당에 등록되지 않습니다.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await submitScoreToDB('piratecoin', submitName.trim(), finalScore);
      setHasSubmitted(true);
      setIsSubmitting(false);

      // Trigger global modal switch to 'piratecoin' tab immediately
      if (onScoreSubmitted) {
        onScoreSubmitted('piratecoin');
      }
    } catch (err) {
      setSubmitError('점수 등록 중 오류가 발생했습니다. 다시 시도해 주세요.');
      setIsSubmitting(false);
    }
  };

  // --- Main Animation & Render Loop ---
  useEffect(() => {
    if (gameState !== 'playing') return;

    let lastTime = performance.now();
    let broadcastTimer = 0;
    let matchTimerAcc = 0;
    let localTimeLeft = MATCH_DURATION_SEC;

    const loop = (currentTimestamp) => {
      const dt = Math.min(0.06, (currentTimestamp - lastTime) / 1000);
      lastTime = currentTimestamp;

      const logic = logicEngineRef.current;
      const canvas = canvasRef.current;
      const miniCanvas = minimapCanvasRef.current;

      if (logic && canvas) {
        // 1. Pass User Inputs to Player Ship
        const myShip = logic.players.find((p) => p.isMe);
        if (myShip) {
          myShip.inputs = { ...keysPressedRef.current };

          // Send inputs to host if guest
          if (lobbyTab === 'multi' && !pirateNet.isHost) {
            pirateNet.sendClientInputs(myShip.inputs);
          }
        }

        // 2. Logic Update (Host or Solo authoritatively simulates)
        if (lobbyTab === 'solo' || pirateNet.isHost) {
          logic.update(dt, currentTimestamp / 1000);

          // Update Match Countdown Timer
          matchTimerAcc += dt;
          if (matchTimerAcc >= 1.0) {
            matchTimerAcc -= 1.0;
            localTimeLeft = Math.max(0, localTimeLeft - 1);
            setTimeLeft(localTimeLeft);

            if (localTimeLeft <= 0) {
              const results = logic.players.map((p) => ({
                id: p.id,
                name: p.name,
                teamColor: p.teamColor,
                score: p.bankedScore,
                held: p.heldCoins,
                isMe: p.isMe
              }));
              handleMatchEnd(results);
              return;
            }
          }

          // Broadcast Snapshot (20Hz)
          broadcastTimer += dt;
          if (broadcastTimer >= 0.05 && pirateNet.isHost) {
            broadcastTimer = 0;
            pirateNet.broadcastSnapshot({
              timeLeft: localTimeLeft,
              players: logic.players.map((p) => ({
                id: p.id,
                x: Math.round(p.x),
                y: Math.round(p.y),
                angle: Number(p.angle.toFixed(2)),
                speed: Number(p.speed.toFixed(1)),
                heldCoins: p.heldCoins,
                bankedScore: p.bankedScore,
                shieldActive: p.shieldActive,
                stunEndTime: p.stunEndTime,
                boostEndTime: p.boostEndTime,
                currentSlotItem: p.currentSlotItem
              })),
              coins: logic.coins,
              crates: logic.itemCrates,
              projectiles: logic.projectiles
            });
          }
        }

        // 3. Update React HUD States
        if (myShip) {
          setHeldCoins(myShip.heldCoins);
          setBankedScore(myShip.bankedScore);
          setCurrentSlotItem(myShip.currentSlotItem);
        }

        // 4. Standings calculation
        const currentStandings = logic.players
          .map((p) => ({
            id: p.id,
            name: p.name,
            score: p.bankedScore,
            isMe: p.isMe,
            color: p.teamColor
          }))
          .sort((a, b) => b.score - a.score);
        setStandings(currentStandings);

        // 5. Render Scene onto Canvas
        const ctx = canvas.getContext('2d');
        const viewW = canvas.width;
        const viewH = canvas.height;

        // Camera Follows Player Ship
        const camX = myShip ? myShip.x : WORLD_WIDTH / 2;
        const camY = myShip ? myShip.y : WORLD_HEIGHT / 2;

        ctx.save();
        ctx.clearRect(0, 0, viewW, viewH);

        // Translate to Camera
        ctx.translate(viewW / 2 - camX, viewH / 2 - camY);

        // Draw Map & Environment
        mapEngineRef.current.draw(ctx, { x: camX, y: camY, viewportWidth: viewW, viewportHeight: viewH }, currentTimestamp / 1000);

        // Draw Coins on Island / Sea
        logic.coins.forEach((coin) => {
          ctx.save();
          const bob = Math.sin(currentTimestamp * 0.005 + coin.animPhase) * 3;
          ctx.translate(coin.x, coin.y + bob);

          // Glow
          ctx.fillStyle = coin.glowColor || 'rgba(251, 191, 36, 0.4)';
          ctx.beginPath();
          ctx.arc(0, 0, coin.radius * 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Coin Shape
          ctx.fillStyle = coin.color;
          ctx.beginPath();
          ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Coin Symbol
          ctx.fillStyle = '#78350F';
          ctx.font = `bold ${coin.radius * 1.1}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(coin.type === 'chest' ? '👑' : coin.type === 'skull' ? '☠️' : '$', 0, 1);

          ctx.restore();
        });

        // Draw Item Crates
        logic.itemCrates.forEach((crate) => {
          ctx.save();
          ctx.translate(crate.x, crate.y);
          ctx.fillStyle = '#B45309';
          ctx.fillRect(-16, -16, 32, 32);
          ctx.strokeStyle = '#FDE68A';
          ctx.lineWidth = 2;
          ctx.strokeRect(-16, -16, 32, 32);

          const itemDef = ITEM_TYPES[crate.itemType.toUpperCase()];
          if (itemDef) {
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(itemDef.icon, 0, 0);
          }
          ctx.restore();
        });

        // Draw Ships & Trailing Coins
        logic.players.forEach((ship) => {
          if (!ship.alive) return;

          // A. Draw Trailing Coins Chain behind ship!
          if (ship.trail && ship.trail.length > 0 && ship.heldCoins > 0) {
            const numBags = Math.min(12, ship.heldCoins);
            for (let b = 1; b <= numBags; b++) {
              const trailIndex = Math.min(ship.trail.length - 1, b * 2);
              const tp = ship.trail[trailIndex];
              if (tp) {
                ctx.save();
                ctx.translate(tp.x, tp.y);

                // Little rope line connecting to previous
                ctx.fillStyle = '#F59E0B';
                ctx.beginPath();
                ctx.arc(0, 0, 6 + (b % 3 === 0 ? 3 : 0), 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#78350F';
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.restore();
              }
            }
          }

          // B. Draw Ship Hull
          ctx.save();
          ctx.translate(ship.x, ship.y);
          ctx.rotate(ship.angle);

          const hLen = ship.shipClass.hullLength;
          const hWid = ship.shipClass.hullWidth;

          // Hull body (Pointed Bow, Rounded Stern)
          ctx.fillStyle = '#78350F'; // Dark Oak Wood
          ctx.beginPath();
          ctx.moveTo(hLen * 0.5, 0); // Bow tip
          ctx.quadraticCurveTo(hLen * 0.2, hWid * 0.5, -hLen * 0.45, hWid * 0.45);
          ctx.lineTo(-hLen * 0.45, -hWid * 0.45);
          ctx.quadraticCurveTo(hLen * 0.2, -hWid * 0.5, hLen * 0.5, 0);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#451A03';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Team deck accent color
          ctx.fillStyle = ship.teamColor;
          ctx.fillRect(-hLen * 0.25, -hWid * 0.3, hLen * 0.35, hWid * 0.6);

          // Ship Mast & Sail
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.ellipse(0, 0, 8, hWid * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#CBD5E1';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Mast center pole
          ctx.fillStyle = '#92400E';
          ctx.fillRect(-3, -hWid * 0.6, 6, hWid * 1.2);

          // Stern Rudder flag
          ctx.fillStyle = ship.teamColor;
          ctx.beginPath();
          ctx.moveTo(-hLen * 0.45, 0);
          ctx.lineTo(-hLen * 0.65, -8);
          ctx.lineTo(-hLen * 0.65, 8);
          ctx.closePath();
          ctx.fill();

          ctx.restore();

          // C. Draw Ship Overlays (Shield, Stun, Name Badge)
          ctx.save();
          ctx.translate(ship.x, ship.y);

          // Shield Bubble
          if (ship.shieldActive) {
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)';
            ctx.lineWidth = 3;
            ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
            ctx.beginPath();
            ctx.arc(0, 0, ship.radius * 1.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }

          // Stun Dizzy Stars
          if (currentTimestamp / 1000 < ship.stunEndTime) {
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('💫', 0, -ship.radius - 14);
          }

          // Ship Name & Held Coins Floating Badge
          ctx.font = 'bold 11px "Pretendard", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = ship.isMe ? '#FDE68A' : '#FFFFFF';
          ctx.fillText(`${ship.name}`, 0, ship.radius + 14);

          // Held Coins Pill
          if (ship.heldCoins > 0) {
            ctx.fillStyle = '#F59E0B';
            ctx.beginPath();
            ctx.arc(-8, ship.radius + 25, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FEF08A';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText(`💰 ${ship.heldCoins * 10}점 (${ship.heldCoins}개)`, 0, ship.radius + 28);
          }

          ctx.restore();
        });

        // Draw Cannonballs / Projectiles
        logic.projectiles.forEach((proj) => {
          ctx.save();
          ctx.translate(proj.x, proj.y);
          ctx.fillStyle = '#1E293B';
          ctx.beginPath();
          ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        });

        // Draw Particles
        logic.particles.forEach((p) => {
          ctx.save();
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        // Draw Floating Score & Impact Texts
        logic.floatingTexts.forEach((ft) => {
          ctx.save();
          ctx.font = 'bold 13px "Pretendard", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = ft.color;
          ctx.globalAlpha = ft.alpha;
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.restore();
        });

        ctx.restore();

        // 6. Draw Minimap Radar
        if (miniCanvas) {
          const miniCtx = miniCanvas.getContext('2d');
          mapEngineRef.current.drawMinimap(miniCtx, logic.players, logic.coins);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [gameState, lobbyTab, handleMatchEnd]);

  // Adjust Canvas Resolution Dynamically
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="pirate-container">
      {/* 1. Header Bar */}
      <div className="pirate-header">
        <div className="pirate-header-title">
          <button
            onClick={() => {
              if (gameState === 'playing') {
                if (confirm('게임을 중단하고 로비로 돌아가시겠습니까?')) {
                  setGameState('lobby');
                }
              } else if (onBackToLobby) {
                onBackToLobby();
              }
            }}
            className="pirate-icon-btn"
            title="포털 메인 화면으로 나가기"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>포털로 나가기</span>
          </button>
          <h1>🏴‍☠️ 도촌 해적선 코인 쟁탈전</h1>
        </div>

        <div className="pirate-header-controls">
          <button
            className="pirate-icon-btn"
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            title={isAudioMuted ? '음소거 해제' : '음소거'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            className="pirate-icon-btn"
            onClick={() => setIsHowToPlayOpen(true)}
            title="게임 방법 및 아이템 안내"
          >
            <HelpCircle className="w-4 h-4" />
            <span>도움말</span>
          </button>
        </div>
      </div>

      {/* 2. Main Viewport & Canvas */}
      <div className="pirate-viewport">
        <canvas ref={canvasRef} className="pirate-canvas" width={800} height={560} />

        {/* In-Game HUD: Top Left Pills */}
        {gameState === 'playing' && (
          <>
            <div className="pirate-hud-top">
              <div className="pirate-hud-pill timer">
                <Compass className="w-4 h-4 text-red-400" />
                <span>남은 시간: {timeLeft}초</span>
              </div>
              <div className="pirate-hud-pill held">
                <span className="text-amber-400">💰 소지:</span>
                <span>{heldCoins * 10}점 ({heldCoins}개)</span>
              </div>
              <div className="pirate-hud-pill bank">
                <span className="text-emerald-400">⚓ 입금 완료:</span>
                <span>{bankedScore}점</span>
              </div>
            </div>

            {/* In-Game HUD: Top Right Live Standings */}
            <div className="pirate-standings-bar">
              <div className="text-[11px] font-extrabold text-slate-400 mb-1">실시간 순위</div>
              {standings.map((s, idx) => (
                <div key={s.id} className={`pirate-standing-row ${s.isMe ? 'me' : ''}`}>
                  <span>
                    {idx + 1}위 {s.isMe ? '🚩 ' : ''}{s.name}
                  </span>
                  <span style={{ color: s.color }}>{s.score}점</span>
                </div>
              ))}
            </div>

            {/* In-Game Item Slot (Bottom Right) */}
            <div className="pirate-item-slot-wrapper">
              <button
                className={`pirate-item-slot ${!currentSlotItem ? 'empty' : ''}`}
                onClick={() => {
                  if (logicEngineRef.current) {
                    const me = logicEngineRef.current.players.find((p) => p.isMe);
                    if (me && me.currentSlotItem) {
                      logicEngineRef.current._activateItem(me, performance.now() / 1000);
                    }
                  }
                }}
                title="아이템 사용 (Space / 터치)"
              >
                {currentSlotItem ? ITEM_TYPES[currentSlotItem.toUpperCase()]?.icon : '비어있음'}
              </button>
              <div className="pirate-item-hint">아이템 (Space)</div>
            </div>

            {/* Minimap Radar (Bottom Left) */}
            <div className="pirate-minimap-wrapper">
              <canvas ref={minimapCanvasRef} className="pirate-minimap-canvas" width={140} height={140} />
            </div>

            {/* Mobile / Touch D-Pad & Actions */}
            <div className="pirate-mobile-controls">
              <div className="pirate-touch-dpad">
                <div></div>
                <button
                  className="pirate-touch-btn"
                  onTouchStart={() => { keysPressedRef.current.forward = true; }}
                  onTouchEnd={() => { keysPressedRef.current.forward = false; }}
                >
                  ▲
                </button>
                <div></div>

                <button
                  className="pirate-touch-btn"
                  onTouchStart={() => { keysPressedRef.current.turnLeft = true; }}
                  onTouchEnd={() => { keysPressedRef.current.turnLeft = false; }}
                >
                  ◀
                </button>
                <div></div>
                <button
                  className="pirate-touch-btn"
                  onTouchStart={() => { keysPressedRef.current.turnRight = true; }}
                  onTouchEnd={() => { keysPressedRef.current.turnRight = false; }}
                >
                  ▶
                </button>

                <div></div>
                <button
                  className="pirate-touch-btn"
                  onTouchStart={() => { keysPressedRef.current.backward = true; }}
                  onTouchEnd={() => { keysPressedRef.current.backward = false; }}
                >
                  ▼
                </button>
                <div></div>
              </div>

              <div className="pirate-touch-actions">
                <button
                  className="pirate-touch-act-btn accel"
                  onTouchStart={() => { keysPressedRef.current.forward = true; }}
                  onTouchEnd={() => { keysPressedRef.current.forward = false; }}
                >
                  돛
                </button>
                <button
                  className="pirate-touch-act-btn brake"
                  onTouchStart={() => { keysPressedRef.current.backward = true; }}
                  onTouchEnd={() => { keysPressedRef.current.backward = false; }}
                >
                  닻
                </button>
              </div>
            </div>
          </>
        )}

        {/* 3. Lobby UI Modal */}
        {gameState === 'lobby' && (
          <div className="pirate-overlay">
            <div className="pirate-card">
              <div className="pirate-card-title">
                <h2>🏴‍☠️ 도촌 해적선 코인 쟁탈전</h2>
                <p>보물섬의 황금 코인을 모으고, 상대를 들이받아 코인을 털어내세요!</p>
              </div>

              {/* Solo vs Multi Tabs */}
              <div className="pirate-tabs">
                <button
                  className={`pirate-tab ${lobbyTab === 'solo' ? 'active' : ''}`}
                  onClick={() => setLobbyTab('solo')}
                >
                  ⚔️ 솔로 AI 대전
                </button>
                <button
                  className={`pirate-tab ${lobbyTab === 'multi' ? 'active' : ''}`}
                  onClick={() => setLobbyTab('multi')}
                >
                  👥 P2P 실시간 멀티
                </button>
              </div>

              {/* Player Nickname Input */}
              <div className="pirate-form-row">
                <label>내 해적 선장 이름</label>
                <input
                  type="text"
                  className="pirate-input"
                  value={playerName}
                  maxLength={10}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="예: 홍길동"
                />
              </div>

              {/* Ship Class Picker */}
              <div className="pirate-form-row">
                <label>탑승할 해적선 선택</label>
                <div className="pirate-ship-grid">
                  {Object.values(SHIP_CLASSES).map((sc) => (
                    <div
                      key={sc.id}
                      className={`pirate-ship-card ${selectedShip === sc.id ? 'selected' : ''}`}
                      onClick={() => setSelectedShip(sc.id)}
                    >
                      <div className="pirate-ship-header">
                        <span className="text-xl">{sc.icon}</span>
                        <span className="pirate-ship-name">{sc.name}</span>
                      </div>
                      <div className="pirate-ship-desc">{sc.tagline}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Solo Tab Options */}
              {lobbyTab === 'solo' && (
                <div className="pirate-form-row">
                  <label>AI 해적 난이도</label>
                  <div className="pirate-tabs">
                    {Object.entries(AI_DIFFICULTIES).map(([key, val]) => (
                      <button
                        key={key}
                        className={`pirate-tab ${selectedDifficulty === key ? 'active' : ''}`}
                        onClick={() => setSelectedDifficulty(key)}
                      >
                        {val.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Multiplayer Tab Options */}
              {lobbyTab === 'multi' && (
                <div className="pirate-form-row">
                  <label>4자리 숫자 방 코드</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="pirate-input flex-1"
                      maxLength={4}
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="예: 1234"
                    />
                    <button
                      className="pirate-btn-secondary"
                      onClick={handleHostRoom}
                      disabled={isConnecting}
                    >
                      방 만들기
                    </button>
                    <button
                      className="pirate-btn-secondary"
                      onClick={handleJoinRoom}
                      disabled={isConnecting}
                    >
                      입장하기
                    </button>
                  </div>

                  {activeRoomCode && (
                    <div className="mt-2 p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-center">
                      <div className="text-xs text-amber-300 font-bold">내 방 번호 (친구에게 알려주세요)</div>
                      <div className="text-3xl font-black text-amber-400 tracking-widest my-1">{activeRoomCode}</div>
                      <div className="text-xs text-slate-300">
                        선원 접속 현황: {lobbyPlayers.length} / 4명
                      </div>
                    </div>
                  )}

                  {networkStatus && (
                    <div className="text-xs text-cyan-300 text-center mt-1">{networkStatus}</div>
                  )}
                </div>
              )}

              {/* Action Button */}
              {lobbyTab === 'solo' ? (
                <button className="pirate-btn-primary" onClick={() => startMatch(false)}>
                  <Play className="w-5 h-5" />
                  <span>황금 보물섬으로 출항!</span>
                </button>
              ) : isHost ? (
                <button
                  className="pirate-btn-primary"
                  onClick={() => startMatch(true)}
                  disabled={!activeRoomCode}
                >
                  <Play className="w-5 h-5" />
                  <span>선원들과 함께 출항 시작!</span>
                </button>
              ) : activeRoomCode ? (
                <div className="text-center text-xs text-amber-300 py-2">
                  방장이 출항 버튼을 누르면 자동으로 경기가 시작됩니다... ⏳
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* 4. Game Over Results Modal */}
        {gameState === 'gameover' && (
          <div className="pirate-overlay">
            <div className="pirate-card">
              <div className="pirate-card-title">
                <h2>🏴‍☠️ 항해 종료! 최종 순위</h2>
                <p>90초간의 치열했던 코인 쟁탈전이 마무리되었습니다.</p>
              </div>

              {/* Final Rankings Podium */}
              <div className="pirate-result-podium">
                {finalRankings.map((r, i) => (
                  <div key={r.id} className={`pirate-result-item ${i === 0 ? 'winner' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '⚓'} {i + 1}위
                      </span>
                      <span className="font-bold text-sm" style={{ color: r.teamColor }}>
                        {r.name} {r.isMe ? '(나)' : ''}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-amber-300 text-base">{r.score}점</div>
                      <div className="text-[10px] text-slate-400">미입금 코인: {r.held * 10}점</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Honor Roll Leaderboard Form: ONLY shown if score > 100 per Project Rule! */}
              {finalScore > 100 ? (
                <div className="pirate-score-form">
                  <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
                    <Trophy className="w-4 h-4" />
                    <span>명예의 전당 랭킹 등록 ({finalScore}점)</span>
                  </div>

                  {!hasSubmitted ? (
                    <form onSubmit={handleScoreSubmit} className="flex flex-col gap-2">
                      <input
                        type="text"
                        className="pirate-input"
                        value={submitName}
                        onChange={(e) => setSubmitName(e.target.value)}
                        placeholder="예: 홍길동"
                        maxLength={12}
                        disabled={isSubmitting}
                      />
                      {submitError && <p className="text-xs text-red-400">{submitError}</p>}
                      <button
                        type="submit"
                        className="pirate-btn-primary"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? '등록 중...' : '🏆 명예의 전당에 점수 기록하기'}
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm py-2">
                      <Check className="w-5 h-5" />
                      <span>명예의 전당에 점수가 성공적으로 등록되었습니다!</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-xs text-slate-400 p-2 bg-slate-800/40 rounded-xl">
                  💡 100점을 초과하여 달성하면 명예의 전당에 점수를 등록할 수 있습니다.
                </div>
              )}

              {/* Play Again Buttons */}
              <div className="flex gap-2">
                <button
                  className="pirate-btn-primary flex-1"
                  onClick={() => setGameState('lobby')}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>대기실로 돌아가기</span>
                </button>
                {onBackToLobby && (
                  <button className="pirate-btn-secondary" onClick={onBackToLobby}>
                    포털 메인으로
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. How To Play Modal */}
      <PirateCoinHowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
}
