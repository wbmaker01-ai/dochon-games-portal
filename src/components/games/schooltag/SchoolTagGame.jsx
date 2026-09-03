// Dochon Games Portal - School Tag (도촌 야간 학교 숨바꼭질) Main Component
// 2D Fog of War Raycasting Lighting, Stealth Survival Mechanics, Web Audio & P2P WebRTC

import React, { useState, useEffect, useRef } from 'react';
import {
  SCHOOL_TAG_CONSTANTS,
  ROLE_TYPES,
  GAME_STATES,
  CHARACTER_SKINS,
} from './schoolTagConstants';
import { schoolTagAudio } from './schoolTagAudio';
import {
  createSchoolMap,
  pickRandomKeyLocations,
  TILE_TYPES,
  ROOM_LABELS,
} from './schoolTagMap';
import {
  computeFlashlightPolygon,
  moveEntityWithSliding,
  SmartTaggerAI,
  calculateSchoolTagScore,
} from './schoolTagLogic';
import { SchoolTagNetworkManager } from './schoolTagNetwork';
import SchoolTagHowToPlayModal from './SchoolTagHowToPlayModal';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  Play,
  Users,
  RotateCcw,
  Key,
  ShieldAlert,
  Trophy,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import './schooltag.css';

export default function SchoolTagGame({ onScoreSubmitted }) {
  // Game States
  const [gameState, setGameState] = useState(GAME_STATES.MENU);
  const [gameMode, setGameMode] = useState('SINGLE'); // 'SINGLE' or 'MULTI'
  const [isMuted, setIsMuted] = useState(false);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [selectedSkin, setSelectedSkin] = useState('boy');
  const [playerRole, setPlayerRole] = useState(ROLE_TYPES.RUNNER);

  // HUD & In-Game Values
  const [remainingTime, setRemainingTime] = useState(SCHOOL_TAG_CONSTANTS.MATCH_DURATION_SEC);
  const [collectedKeysCount, setCollectedKeysCount] = useState(0);
  const [staminaPercent, setStaminaPercent] = useState(100);
  const [isGateUnlocked, setIsGateUnlocked] = useState(false);
  const [isNearInteractable, setIsNearInteractable] = useState(null); // 'LOCKER', 'KEY', 'GATE'
  const [vignetteActive, setVignetteActive] = useState(false);
  const [countdownNum, setCountdownNum] = useState(SCHOOL_TAG_CONSTANTS.COUNTDOWN_SEC);

  // Results & Score
  const [finalScore, setFinalScore] = useState(0);
  const [gameResult, setGameResult] = useState(null); // 'ESCAPE_SUCCESS', 'CAUGHT', 'TIME_OVER'
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [isScoreSubmitted, setIsScoreSubmitted] = useState(false);

  // P2P Multi Room States
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [currentRoomCode, setCurrentRoomCode] = useState('');
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [networkError, setNetworkError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Refs for Animation Loop & Persistent Game Entities
  const canvasRef = useRef(null);
  const lightCanvasRef = useRef(null);
  const networkRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const isPlayingRef = useRef(false);
  const lastTimeRef = useRef(0);
  const keysDownRef = useRef({});
  const mousePosRef = useRef({ x: 0, y: 0 });
  const hasMovedMouseRef = useRef(false);

  // Map & Game State Mutable Storage
  const mapDataRef = useRef(null);
  const playerRef = useRef(null);
  const taggerRef = useRef(null);
  const taggerAIRef = useRef(null);
  const keysRef = useRef([]);
  const noiseWavesRef = useRef([]);
  const otherPlayersRef = useRef(new Map()); // id -> player obj
  const gateStayTimerRef = useRef(0);
  const noiseSpawnTimerRef = useRef(0);
  const matchDurationTimerRef = useRef(SCHOOL_TAG_CONSTANTS.MATCH_DURATION_SEC);

  // Initialize Network Manager on Mount
  useEffect(() => {
    networkRef.current = new SchoolTagNetworkManager();

    networkRef.current.onConnectionStatus = (statusMsg) => {
      setConnectionStatus(statusMsg);
    };

    networkRef.current.onRoomCodeChanged = (newCode) => {
      setCurrentRoomCode(newCode);
    };

    networkRef.current.onError = (err) => {
      setNetworkError(err);
      setIsConnecting(false);
    };

    networkRef.current.onDisconnect = (msg) => {
      setNetworkError(msg);
      setCurrentRoomCode('');
      setIsConnecting(false);
      setGameState(GAME_STATES.MENU);
    };

    networkRef.current.onLobbyUpdate = (players) => {
      setLobbyPlayers(players);
    };

    networkRef.current.onGameStart = (matchData) => {
      startMatchSession(matchData);
    };

    networkRef.current.onGameStateUpdate = (state) => {
      // Sync other players' positions
      if (state && state.players) {
        state.players.forEach((p) => {
          if (p.id !== networkRef.current.myPeerId) {
            otherPlayersRef.current.set(p.id, p);
          }
        });
      }
      if (state && state.tagger && playerRole !== ROLE_TYPES.TAGGER) {
        if (taggerRef.current) {
          taggerRef.current.x = state.tagger.x;
          taggerRef.current.y = state.tagger.y;
          taggerRef.current.facingAngle = state.tagger.facingAngle;
        }
      }
    };

    networkRef.current.onTagEvent = (tagData) => {
      schoolTagAudio.playTagJumpscare();
      if (tagData.targetId === networkRef.current.myPeerId) {
        if (playerRef.current) {
          playerRef.current.isJailed = true;
          playerRef.current.x = 18 * SCHOOL_TAG_CONSTANTS.TILE_SIZE;
          playerRef.current.y = 9 * SCHOOL_TAG_CONSTANTS.TILE_SIZE;
        }
      }
    };

    networkRef.current.onKeyEvent = (keyData) => {
      schoolTagAudio.playKeyCollect();
      setCollectedKeysCount((prev) => prev + 1);
    };

    networkRef.current.onGameOver = (result) => {
      endMatch(result);
    };

    return () => {
      isPlayingRef.current = false;
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (networkRef.current) networkRef.current.disconnect();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      schoolTagAudio.stopHeartbeat();
    };
  }, [playerRole]);

  // Audio Mute Toggle
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    schoolTagAudio.setMuted(nextMuted);
  };

  // Keyboard Event Handlers (Permanent Mount, Supports WASD, Arrow keys, Korean IME)
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysDownRef.current[e.code] = true;
      if (e.key) {
        keysDownRef.current[e.key] = true;
        keysDownRef.current[e.key.toLowerCase()] = true;
      }

      // Space bar action trigger
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        handleSpaceAction();
      }
    };

    const handleKeyUp = (e) => {
      keysDownRef.current[e.code] = false;
      if (e.key) {
        keysDownRef.current[e.key] = false;
        keysDownRef.current[e.key.toLowerCase()] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle Space Bar Action (Hiding in Locker, Picking Key)
  const handleSpaceAction = () => {
    const p = playerRef.current;
    const map = mapDataRef.current;
    if (!p || !map || p.isJailed || p.isEscaped) return;

    // 1. Locker Toggle
    if (p.isHiding) {
      p.isHiding = false;
      schoolTagAudio.playLockerRustle();
      return;
    }

    // Check if near any locker
    for (let i = 0; i < map.lockers.length; i++) {
      const loc = map.lockers[i];
      const dist = Math.hypot(loc.x - p.x, loc.y - p.y);
      if (dist <= SCHOOL_TAG_CONSTANTS.HIDING_DISTANCE) {
        p.isHiding = true;
        schoolTagAudio.playLockerRustle();
        return;
      }
    }

    // 2. Collect Key
    keysRef.current.forEach((k) => {
      if (!k.isCollected) {
        const dist = Math.hypot(k.x - p.x, k.y - p.y);
        if (dist <= 48) {
          k.isCollected = true;
          schoolTagAudio.playKeyCollect();
          const newCount = keysRef.current.filter((key) => key.isCollected).length;
          setCollectedKeysCount(newCount);

          if (networkRef.current && networkRef.current.isHost) {
            networkRef.current.broadcastKeyEvent({ keyId: k.id, totalCollected: newCount });
          }

          if (newCount >= SCHOOL_TAG_CONSTANTS.REQUIRED_KEYS) {
            setIsGateUnlocked(true);
            schoolTagAudio.playGateAlarm();
          }
        }
      }
    });
  };

  // Start a New Match Session
  const startSinglePlayerGame = () => {
    setGameMode('SINGLE');
    setPlayerRole(ROLE_TYPES.RUNNER);
    startMatchSession();
  };

  const startMatchSession = (matchData = null) => {
    const map = createSchoolMap();
    mapDataRef.current = map;

    // Golden Keys
    keysRef.current = matchData ? matchData.keys : pickRandomKeyLocations(3);
    setCollectedKeysCount(0);
    setIsGateUnlocked(false);
    gateStayTimerRef.current = 0;
    noiseWavesRef.current = [];
    matchDurationTimerRef.current = SCHOOL_TAG_CONSTANTS.MATCH_DURATION_SEC;
    setRemainingTime(SCHOOL_TAG_CONSTANTS.MATCH_DURATION_SEC);
    setStaminaPercent(100);
    setGameResult(null);
    setIsScoreSubmitted(false);
    hasMovedMouseRef.current = false;

    // Spawn Player (Runner) at center of clean floor tile in Classroom 1
    playerRef.current = {
      x: 4.5 * SCHOOL_TAG_CONSTANTS.TILE_SIZE,
      y: 2.5 * SCHOOL_TAG_CONSTANTS.TILE_SIZE,
      facingAngle: 0,
      radius: SCHOOL_TAG_CONSTANTS.RUNNER_RADIUS,
      stamina: SCHOOL_TAG_CONSTANTS.RUNNER_STAMINA_MAX,
      isHiding: false,
      isJailed: false,
      isEscaped: false,
      role: playerRole,
      skinId: selectedSkin,
    };

    // Spawn Tagger in Hallway
    taggerRef.current = {
      x: 13.5 * SCHOOL_TAG_CONSTANTS.TILE_SIZE,
      y: 5.5 * SCHOOL_TAG_CONSTANTS.TILE_SIZE,
      facingAngle: Math.PI,
      radius: SCHOOL_TAG_CONSTANTS.TAGGER_RADIUS,
      isStunned: false,
      stunTimer: 0,
    };

    taggerAIRef.current = new SmartTaggerAI(taggerRef.current);

    // Cancel previous intervals & frames
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    isPlayingRef.current = false;

    // Begin Countdown State
    setGameState(GAME_STATES.COUNTDOWN);
    setCountdownNum(SCHOOL_TAG_CONSTANTS.COUNTDOWN_SEC);

    let count = SCHOOL_TAG_CONSTANTS.COUNTDOWN_SEC;
    countdownIntervalRef.current = setInterval(() => {
      count -= 1;
      setCountdownNum(count);
      if (count <= 0) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        isPlayingRef.current = true;
        setGameState(GAME_STATES.PLAYING);
        lastTimeRef.current = performance.now();
        animFrameIdRef.current = requestAnimationFrame(gameLoop);
      }
    }, 1000);
  };

  // Host P2P Room
  const handleCreateRoom = async () => {
    setNetworkError('');
    setConnectionStatus('');
    setIsConnecting(true);
    const code = SchoolTagNetworkManager.generateRandomCode();
    try {
      const createdCode = await networkRef.current.createRoom(code, '방장(학생)', ROLE_TYPES.RUNNER, selectedSkin);
      setCurrentRoomCode(createdCode);
      setGameState(GAME_STATES.LOBBY);
      setGameMode('MULTI');
    } catch (err) {
      setNetworkError(err.message || '방 생성에 실패했습니다.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Join P2P Room
  const handleJoinRoom = async () => {
    const cleanCode = (roomCodeInput || '').replace(/\D/g, '').trim();
    if (cleanCode.length !== 4) {
      setNetworkError('4자리 숫자 방 코드를 입력하세요.');
      return;
    }
    setNetworkError('');
    setConnectionStatus('');
    setIsConnecting(true);
    try {
      const joinedCode = await networkRef.current.joinRoom(cleanCode, '친구(학생)', selectedSkin);
      setCurrentRoomCode(joinedCode);
      setGameState(GAME_STATES.LOBBY);
      setGameMode('MULTI');
    } catch (err) {
      setNetworkError(err.message || '방 입장에 실패했습니다.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Host Starts Match in Multiplayer
  const handleStartMultiMatch = () => {
    if (!networkRef.current.isHost) return;
    const matchData = {
      keys: pickRandomKeyLocations(3),
    };
    networkRef.current.broadcastGameStart(matchData);
  };

  // Mouse Move for Flashlight Aiming
  const handleMouseMove = (e) => {
    hasMovedMouseRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = SCHOOL_TAG_CONSTANTS.CANVAS_WIDTH / rect.width;
    const scaleY = SCHOOL_TAG_CONSTANTS.CANVAS_HEIGHT / rect.height;

    mousePosRef.current = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // --- Main Animation & Simulation Loop (Capped at 30FPS for 50% GPU Reduction) ---
  const TARGET_FPS = 30;
  const FRAME_INTERVAL = 1000 / TARGET_FPS; // 33.33ms
  const lastRenderTimeRef = useRef(0);

  const gameLoop = (timestamp) => {
    if (!isPlayingRef.current) return;

    try {
      const elapsed = timestamp - lastRenderTimeRef.current;

      if (elapsed >= FRAME_INTERVAL) {
        lastRenderTimeRef.current = timestamp - (elapsed % FRAME_INTERVAL);
        const dt = Math.min(0.08, elapsed / 1000);

        updateGame(dt);
        renderGame();
      }
    } catch (err) {
      console.error('[SchoolTag Loop Error]', err);
    } finally {
      if (isPlayingRef.current) {
        animFrameIdRef.current = requestAnimationFrame(gameLoop);
      }
    }
  };

  // Update Game Logic
  const updateGame = (dt) => {
    const p = playerRef.current;
    const t = taggerRef.current;
    const map = mapDataRef.current;
    if (!p || !t || !map) return;

    // 1. Match Timer Countdown
    matchDurationTimerRef.current -= dt;
    const currentRemaining = Math.max(0, matchDurationTimerRef.current);
    setRemainingTime(Math.ceil(currentRemaining));

    if (currentRemaining <= 0) {
      endMatch('TIME_OVER');
      return;
    }

    // 2. Player Input & Movement
    // 2. Player Input & Steering Controls
    // [User Request]: Left/Right rotates view & flashlight, Up/Down moves forward/backward
    if (!p.isHiding && !p.isJailed && !p.isEscaped) {
      const keys = keysDownRef.current;
      const isUp = keys['KeyW'] || keys['ArrowUp'] || keys['w'] || keys['W'] || keys['ㅈ'];
      const isDown = keys['KeyS'] || keys['ArrowDown'] || keys['s'] || keys['S'] || keys['ㄴ'];
      const isLeft = keys['KeyA'] || keys['ArrowLeft'] || keys['a'] || keys['A'] || keys['ㅁ'];
      const isRight = keys['KeyD'] || keys['ArrowRight'] || keys['d'] || keys['D'] || keys['ㅇ'];

      // A. Smooth View & Flashlight Rotation (3.6 rad/s ≈ 206 deg/sec)
      const ROTATION_SPEED = 3.6;
      if (isLeft) {
        hasMovedMouseRef.current = false;
        p.facingAngle -= ROTATION_SPEED * dt;
      }
      if (isRight) {
        hasMovedMouseRef.current = false;
        p.facingAngle += ROTATION_SPEED * dt;
      }

      // Normalize facing angle to [-PI, PI]
      while (p.facingAngle < -Math.PI) p.facingAngle += Math.PI * 2;
      while (p.facingAngle > Math.PI) p.facingAngle -= Math.PI * 2;

      // Optional Mouse Aiming Override (Active only when mouse is moved and no keyboard rotation is held)
      if (hasMovedMouseRef.current && !isLeft && !isRight) {
        const cameraX = p.x - SCHOOL_TAG_CONSTANTS.CANVAS_WIDTH / 2;
        const cameraY = p.y - SCHOOL_TAG_CONSTANTS.CANVAS_HEIGHT / 2;
        const worldMouseX = mousePosRef.current.x + cameraX;
        const worldMouseY = mousePosRef.current.y + cameraY;
        p.facingAngle = Math.atan2(worldMouseY - p.y, worldMouseX - p.x);
      }

      // B. Forward & Backward Movement along Flashlight Direction
      let moveDir = 0; // +1 = Forward (facing direction), -1 = Backward
      if (isUp) moveDir += 1;
      if (isDown) moveDir -= 1;

      const isSprinting = (keys['ShiftLeft'] || keys['ShiftRight'] || keys['Shift']) && p.stamina > 10;
      const baseSpeed = isSprinting ? SCHOOL_TAG_CONSTANTS.RUNNER_RUN_SPEED : SCHOOL_TAG_CONSTANTS.RUNNER_WALK_SPEED;
      // Backward movement is 75% speed for survival horror realism
      const currentSpeed = moveDir < 0 ? baseSpeed * 0.75 : baseSpeed;

      if (moveDir !== 0) {
        const moveX = Math.cos(p.facingAngle) * currentSpeed * moveDir;
        const moveY = Math.sin(p.facingAngle) * currentSpeed * moveDir;

        moveEntityWithSliding(p, moveX, moveY, dt, map.walls, map.width, map.height);

        // Footstep Audio & Noise Wave Generation
        noiseSpawnTimerRef.current += dt;
        const interval = isSprinting
          ? SCHOOL_TAG_CONSTANTS.RUN_NOISE_WAVE_INTERVAL
          : SCHOOL_TAG_CONSTANTS.WALK_NOISE_WAVE_INTERVAL;

        if (noiseSpawnTimerRef.current >= interval) {
          noiseSpawnTimerRef.current = 0;
          schoolTagAudio.playFootstep(isSprinting);

          if (isSprinting && moveDir > 0) {
            noiseWavesRef.current.push({
              x: p.x,
              y: p.y,
              radius: 10,
              maxRadius: 160,
              alpha: 0.8,
              lifetime: SCHOOL_TAG_CONSTANTS.NOISE_WAVE_LIFETIME,
              maxLifetime: SCHOOL_TAG_CONSTANTS.NOISE_WAVE_LIFETIME,
            });
          }
        }

        // Stamina consumption while sprinting forward
        if (isSprinting && moveDir > 0) {
          p.stamina = Math.max(0, p.stamina - SCHOOL_TAG_CONSTANTS.RUNNER_STAMINA_DRAIN_RATE * dt);
        }
      } else {
        // Recover stamina when not moving
        p.stamina = Math.min(
          SCHOOL_TAG_CONSTANTS.RUNNER_STAMINA_MAX,
          p.stamina + SCHOOL_TAG_CONSTANTS.RUNNER_STAMINA_RECOVERY_RATE * dt
        );
      }

      setStaminaPercent(Math.floor((p.stamina / SCHOOL_TAG_CONSTANTS.RUNNER_STAMINA_MAX) * 100));
    }

    // 3. Update Noise Waves
    for (let i = noiseWavesRef.current.length - 1; i >= 0; i--) {
      const nw = noiseWavesRef.current[i];
      nw.lifetime -= dt;
      nw.radius += 100 * dt;
      nw.alpha = Math.max(0, nw.lifetime / nw.maxLifetime);
      if (nw.lifetime <= 0) {
        noiseWavesRef.current.splice(i, 1);
      }
    }

    // 4. Update Tagger AI (in Single Mode or Host)
    if (gameMode === 'SINGLE' || (networkRef.current && networkRef.current.isHost)) {
      taggerAIRef.current.update(
        dt,
        [p, ...Array.from(otherPlayersRef.current.values())],
        noiseWavesRef.current,
        map.walls,
        map.width,
        map.height
      );

      // Check Tagging Collision
      if (!p.isHiding && !p.isJailed && !p.isEscaped) {
        const distToTagger = Math.hypot(t.x - p.x, t.y - p.y);
        if (distToTagger < p.radius + t.radius) {
          schoolTagAudio.playTagJumpscare();
          p.isJailed = true;
          p.x = 18 * SCHOOL_TAG_CONSTANTS.TILE_SIZE;
          p.y = 9 * SCHOOL_TAG_CONSTANTS.TILE_SIZE;

          if (gameMode === 'SINGLE') {
            endMatch('CAUGHT');
            return;
          }
        }
      }
    }

    // 5. Dynamic Heartbeat Audio & Red Vignette Pulse
    const distToTagger = Math.hypot(t.x - p.x, t.y - p.y);
    if (!p.isJailed && !p.isEscaped && distToTagger < SCHOOL_TAG_CONSTANTS.HEARTBEAT_TRIGGER_DISTANCE) {
      setVignetteActive(true);
      schoolTagAudio.updateHeartbeat(distToTagger, SCHOOL_TAG_CONSTANTS.HEARTBEAT_TRIGGER_DISTANCE);
    } else {
      setVignetteActive(false);
      schoolTagAudio.stopHeartbeat();
    }

    // 6. Proximity to Interactables (Locker, Key, Exit Gate)
    let prompt = null;

    // Check lockers
    for (let i = 0; i < map.lockers.length; i++) {
      const loc = map.lockers[i];
      if (Math.hypot(loc.x - p.x, loc.y - p.y) <= SCHOOL_TAG_CONSTANTS.HIDING_DISTANCE) {
        prompt = p.isHiding ? '🚪 [SPACE] 사물함에서 나가기' : '🚪 [SPACE] 사물함에 숨기';
        break;
      }
    }

    // Check keys
    if (!prompt) {
      keysRef.current.forEach((k) => {
        if (!k.isCollected && Math.hypot(k.x - p.x, k.y - p.y) <= 48) {
          prompt = `🔑 [SPACE] 황금 열쇠 줍기 (${k.room || '교실'})`;
        }
      });
    }

    // Check Exit Gate Zone
    const gate = map.exitGate;
    if (gate && p.x >= gate.x && p.x <= gate.x + gate.w && p.y >= gate.y && p.y <= gate.y + gate.h) {
      if (isGateUnlocked) {
        gateStayTimerRef.current += dt;
        const remaining = Math.max(0, SCHOOL_TAG_CONSTANTS.GATE_UNLOCK_TIME_SEC - gateStayTimerRef.current);
        prompt = `🚨 비상구 탈출 중! (${remaining.toFixed(1)}초 버티기)`;

        if (gateStayTimerRef.current >= SCHOOL_TAG_CONSTANTS.GATE_UNLOCK_TIME_SEC) {
          p.isEscaped = true;
          endMatch('ESCAPE_SUCCESS');
          return;
        }
      } else {
        prompt = `🔒 비상구 잠김 (황금 열쇠 3개 필요: ${keysRef.current.filter((k) => k.isCollected).length}/3)`;
      }
    } else {
      gateStayTimerRef.current = 0;
    }

    setIsNearInteractable(prompt);

    // 7. Multiplayer Sync Packet
    if (gameMode === 'MULTI' && networkRef.current) {
      if (networkRef.current.isHost) {
        networkRef.current.broadcastGameState({
          players: [
            { id: networkRef.current.myPeerId, x: p.x, y: p.y, facingAngle: p.facingAngle, role: p.role },
            ...Array.from(otherPlayersRef.current.values()),
          ],
          tagger: { x: t.x, y: t.y, facingAngle: t.facingAngle },
        });
      } else {
        networkRef.current.sendClientInput({
          x: p.x,
          y: p.y,
          facingAngle: p.facingAngle,
          isHiding: p.isHiding,
        });
      }
    }
  };

  // End Match & Calculate Final Score
  const endMatch = (result) => {
    isPlayingRef.current = false;
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    setGameState(GAME_STATES.GAMEOVER);
    setGameResult(result);
    schoolTagAudio.stopHeartbeat();

    const collected = keysRef.current ? keysRef.current.filter((k) => k.isCollected).length : 0;
    const score = calculateSchoolTagScore({
      isEscaped: result === 'ESCAPE_SUCCESS',
      remainingSeconds: matchDurationTimerRef.current,
      keysCollected: collected,
      rescuedCount: 0,
      timeSurvivedSeconds: SCHOOL_TAG_CONSTANTS.MATCH_DURATION_SEC - matchDurationTimerRef.current,
      isTagger: playerRole === ROLE_TYPES.TAGGER,
      taggedCount: 0,
    });

    setFinalScore(score);

    if (result === 'ESCAPE_SUCCESS') {
      schoolTagAudio.playWinFanfare();
    } else {
      schoolTagAudio.playGameOver();
    }
  };

  const handleReturnToMenu = () => {
    isPlayingRef.current = false;
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    schoolTagAudio.stopHeartbeat();
    setGameState(GAME_STATES.MENU);
  };

  // Handle Score Submission to Cloud DB (Strict Rule Enforcement)
  const handleSubmitScore = async (e) => {
    e.preventDefault();
    if (finalScore <= 100 || isSubmittingScore || isScoreSubmitted) return;

    const trimmedName = playerNameInput.trim() || '익명의 도촌러';
    setIsSubmittingScore(true);

    try {
      await submitScoreToDB('schooltag', trimmedName, finalScore);
      setIsScoreSubmitted(true);
      if (onScoreSubmitted) {
        onScoreSubmitted();
      }
    } catch (err) {
      console.error('Failed to submit score:', err);
    } finally {
      setIsSubmittingScore(false);
    }
  };

  // --- Render 2D Canvas & Fog of War Lighting ---
  const renderGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const p = playerRef.current;
    const t = taggerRef.current;
    const map = mapDataRef.current;
    if (!p || !t || !map) return;

    const cw = SCHOOL_TAG_CONSTANTS.CANVAS_WIDTH;
    const ch = SCHOOL_TAG_CONSTANTS.CANVAS_HEIGHT;

    // Camera following the player
    const camX = p.x - cw / 2;
    const camY = p.y - ch / 2;

    ctx.save();
    ctx.clearRect(0, 0, cw, ch);

    // Apply Camera Transform
    ctx.translate(-camX, -camY);

    // 1. Draw Floor
    ctx.fillStyle = '#0b1329';
    ctx.fillRect(0, 0, map.width, map.height);

    // 2. Draw Floor Grid Pattern (Subtle Hallway Tiles)
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 1;
    const ts = map.tileSize;
    for (let x = 0; x < map.width; x += ts) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, map.height);
      ctx.stroke();
    }
    for (let y = 0; y < map.height; y += ts) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(map.width, y);
      ctx.stroke();
    }

    // 3. Room Labels on Floor
    ctx.font = 'bold 15px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
    ROOM_LABELS.forEach((lbl) => {
      ctx.fillText(lbl.name, (lbl.col + 1.5) * ts, (lbl.row + 1.5) * ts);
    });

    // 4. Draw Exit Gate Pad
    const gate = map.exitGate;
    if (gate) {
      ctx.fillStyle = isGateUnlocked ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.15)';
      ctx.fillRect(gate.x, gate.y, gate.w, gate.h);
      ctx.strokeStyle = isGateUnlocked ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 3;
      ctx.strokeRect(gate.x, gate.y, gate.w, gate.h);

      ctx.fillStyle = isGateUnlocked ? '#4ade80' : '#f87171';
      ctx.font = 'bold 16px Pretendard, sans-serif';
      ctx.fillText(isGateUnlocked ? '🚨 비상구 개방!' : '🔒 비상구 (잠김)', gate.x + gate.w / 2, gate.y + gate.h / 2);
    }

    // 5. Draw Infirmary Jail Beds
    map.jailBeds.forEach((bed) => {
      ctx.fillStyle = 'rgba(220, 38, 38, 0.3)';
      ctx.fillRect(bed.x - ts / 2 + 4, bed.y - ts / 2 + 4, ts - 8, ts - 8);
      ctx.strokeStyle = '#ef4444';
      ctx.strokeRect(bed.x - ts / 2 + 4, bed.y - ts / 2 + 4, ts - 8, ts - 8);
      ctx.fillStyle = '#fca5a5';
      ctx.font = '12px sans-serif';
      ctx.fillText('침대', bed.x, bed.y + 4);
    });

    // 6. Draw Walls & Desks
    map.walls.forEach((w) => {
      if (w.isDesk) {
        ctx.fillStyle = '#334155';
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(w.x + 2, w.y + 2, w.w - 4, w.h - 4);
      } else {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.strokeRect(w.x, w.y, w.w, w.h);
      }
    });

    // 7. Draw Lockers
    map.lockers.forEach((loc) => {
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(loc.x - 18, loc.y - 18, 36, 36);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(loc.x - 18, loc.y - 18, 36, 36);
      ctx.fillStyle = '#e0f2fe';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('사물함', loc.x, loc.y + 4);
    });

    // 8. Draw Golden Keys (Sparkling & Pulsing with Location Tag)
    const nowTime = performance.now() * 0.006;
    const pulseScale = 1 + Math.sin(nowTime) * 0.15;
    keysRef.current.forEach((k) => {
      if (!k.isCollected) {
        ctx.save();
        ctx.translate(k.x, k.y);
        ctx.scale(pulseScale, pulseScale);
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔑', 0, 1);
        ctx.restore();
      }
    });

    // 9. Draw Noise Waves (Footstep Ripples in the dark)
    noiseWavesRef.current.forEach((nw) => {
      ctx.save();
      ctx.strokeStyle = `rgba(56, 189, 248, ${nw.alpha * 0.7})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(nw.x, nw.y, nw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // 10. Draw Tagger Entity
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.facingAngle);
    // Body
    ctx.fillStyle = '#dc2626';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
    ctx.fill();
    // Red glowing eyes
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(4, -5, 5, 3);
    ctx.fillRect(4, 2, 5, 3);
    ctx.restore();

    // 11. Draw Player Entity (Runner)
    if (!p.isHiding) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.facingAngle);
      // Body
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();
      // Flashlight hand
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(8, -3, 8, 6);
      ctx.restore();
    }

    ctx.restore(); // Restore Camera Transform

    // ==========================================
    // LAYER 2: 2D FOG OF WAR & DYNAMIC LIGHTING
    // ==========================================
    // Use an offscreen canvas buffer to create a dark mask and carve out light cones
    if (!lightCanvasRef.current) {
      lightCanvasRef.current = document.createElement('canvas');
    }
    const lightCanvas = lightCanvasRef.current;
    if (lightCanvas.width !== cw || lightCanvas.height !== ch) {
      lightCanvas.width = cw;
      lightCanvas.height = ch;
    }
    const lctx = lightCanvas.getContext('2d');

    // 1. Fill light buffer with dark night fog (0.93 opacity: deep darkness, but soft silhouettes)
    lctx.clearRect(0, 0, cw, ch);
    lctx.fillStyle = 'rgba(2, 6, 23, 0.93)';
    lctx.fillRect(0, 0, cw, ch);

    const pScreenX = p.x - camX;
    const pScreenY = p.y - camY;
    const tScreenX = t.x - camX;
    const tScreenY = t.y - camY;

    // 2. Carve out Player Flashlight Cone & Ambient Body Glow on OFFSCREEN buffer
    let lightPolygon = [];
    if (!p.isHiding) {
      lightPolygon = computeFlashlightPolygon(
        p.x,
        p.y,
        p.facingAngle,
        SCHOOL_TAG_CONSTANTS.RUNNER_FOV_ANGLE,
        SCHOOL_TAG_CONSTANTS.RUNNER_LIGHT_DISTANCE,
        map.segments
      );

      lctx.save();
      lctx.globalCompositeOperation = 'destination-out';

      // A. Flashlight cone cutout with smooth falloff
      if (lightPolygon.length > 0) {
        const grad = lctx.createRadialGradient(
          pScreenX,
          pScreenY,
          10,
          pScreenX,
          pScreenY,
          SCHOOL_TAG_CONSTANTS.RUNNER_LIGHT_DISTANCE
        );
        grad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
        grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.9)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
        lctx.fillStyle = grad;
        lctx.beginPath();
        lctx.moveTo(pScreenX, pScreenY);
        lightPolygon.forEach((pt) => {
          lctx.lineTo(pt.x - camX, pt.y - camY);
        });
        lctx.closePath();
        lctx.fill();
      }

      // B. Ambient circular light around player feet (always clearly see self and immediate surroundings)
      const ambientGrad = lctx.createRadialGradient(
        pScreenX,
        pScreenY,
        0,
        pScreenX,
        pScreenY,
        70
      );
      ambientGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
      ambientGrad.addColorStop(0.75, 'rgba(0, 0, 0, 0.8)');
      ambientGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      lctx.fillStyle = ambientGrad;
      lctx.beginPath();
      lctx.arc(pScreenX, pScreenY, 70, 0, Math.PI * 2);
      lctx.fill();

      lctx.restore();
    }

    // 3. Carve out Tagger's Red Lantern Light Cone & Evil Aura on OFFSCREEN buffer
    const taggerPoly = computeFlashlightPolygon(
      t.x,
      t.y,
      t.facingAngle,
      SCHOOL_TAG_CONSTANTS.TAGGER_FOV_ANGLE,
      SCHOOL_TAG_CONSTANTS.TAGGER_LIGHT_DISTANCE,
      map.segments
    );

    lctx.save();
    lctx.globalCompositeOperation = 'destination-out';
    if (taggerPoly.length > 0) {
      const taggerGrad = lctx.createRadialGradient(
        tScreenX,
        tScreenY,
        10,
        tScreenX,
        tScreenY,
        SCHOOL_TAG_CONSTANTS.TAGGER_LIGHT_DISTANCE
      );
      taggerGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
      taggerGrad.addColorStop(0.75, 'rgba(0, 0, 0, 0.7)');
      taggerGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      lctx.fillStyle = taggerGrad;
      lctx.beginPath();
      lctx.moveTo(tScreenX, tScreenY);
      taggerPoly.forEach((pt) => {
        lctx.lineTo(pt.x - camX, pt.y - camY);
      });
      lctx.closePath();
      lctx.fill();
    }

    // Tagger ambient aura cutout
    const taggerAmbGrad = lctx.createRadialGradient(
      tScreenX,
      tScreenY,
      0,
      tScreenX,
      tScreenY,
      SCHOOL_TAG_CONSTANTS.TAGGER_RED_AURA_RADIUS
    );
    taggerAmbGrad.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
    taggerAmbGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    lctx.fillStyle = taggerAmbGrad;
    lctx.beginPath();
    lctx.arc(tScreenX, tScreenY, SCHOOL_TAG_CONSTANTS.TAGGER_RED_AURA_RADIUS, 0, Math.PI * 2);
    lctx.fill();
    lctx.restore();

    // 4. Carve out Golden Key Gleams (Glimmer through the darkness)
    keysRef.current.forEach((k) => {
      if (!k.isCollected) {
        const kScreenX = k.x - camX;
        const kScreenY = k.y - camY;
        lctx.save();
        lctx.globalCompositeOperation = 'destination-out';
        const keyGleam = lctx.createRadialGradient(kScreenX, kScreenY, 0, kScreenX, kScreenY, 55);
        keyGleam.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
        keyGleam.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
        lctx.fillStyle = keyGleam;
        lctx.beginPath();
        lctx.arc(kScreenX, kScreenY, 55, 0, Math.PI * 2);
        lctx.fill();
        lctx.restore();
      }
    });

    // 5. Draw the Darkness Mask onto the Main Canvas
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(lightCanvas, 0, 0);
    ctx.restore();

    // 6. Draw Atmospheric Light Beam & Sinister Tagger Glow
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // Warm flashlight beam glow
    if (!p.isHiding && lightPolygon.length > 0) {
      const beamGrad = ctx.createRadialGradient(
        pScreenX,
        pScreenY,
        10,
        pScreenX,
        pScreenY,
        SCHOOL_TAG_CONSTANTS.RUNNER_LIGHT_DISTANCE
      );
      beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.32)');
      beamGrad.addColorStop(0.7, 'rgba(254, 240, 138, 0.12)');
      beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0.0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(pScreenX, pScreenY);
      lightPolygon.forEach((pt) => {
        ctx.lineTo(pt.x - camX, pt.y - camY);
      });
      ctx.closePath();
      ctx.fill();
    }

    // Sinister red aura around tagger
    const redAuraGrad = ctx.createRadialGradient(
      tScreenX,
      tScreenY,
      0,
      tScreenX,
      tScreenY,
      SCHOOL_TAG_CONSTANTS.TAGGER_RED_AURA_RADIUS
    );
    redAuraGrad.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
    redAuraGrad.addColorStop(0.7, 'rgba(239, 68, 68, 0.2)');
    redAuraGrad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
    ctx.fillStyle = redAuraGrad;
    ctx.beginPath();
    ctx.arc(tScreenX, tScreenY, SCHOOL_TAG_CONSTANTS.TAGGER_RED_AURA_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  return (
    <div className="schooltag-container">
      {/* 1. Header & Control Bar */}
      <div className="schooltag-header">
        <div className="schooltag-title">
          <span>🔦</span>
          <span>도촌 야간 학교 숨바꼭질</span>
        </div>

        <div className="schooltag-header-actions">
          <button
            onClick={toggleMute}
            className="schooltag-btn-icon"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button
            onClick={() => setHowToPlayOpen(true)}
            className="schooltag-btn-icon"
            title="게임 방법"
          >
            <HelpCircle size={18} />
          </button>
          {gameState === GAME_STATES.PLAYING && (
            <button
              onClick={handleReturnToMenu}
              className="schooltag-btn-icon"
              title="게임 나가기"
            >
              <RotateCcw size={18} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Viewport & Canvas */}
      <div className="schooltag-viewport" onMouseMove={handleMouseMove}>
        <canvas
          ref={canvasRef}
          width={SCHOOL_TAG_CONSTANTS.CANVAS_WIDTH}
          height={SCHOOL_TAG_CONSTANTS.CANVAS_HEIGHT}
          className="schooltag-canvas"
        />

        {/* Dynamic Red Heartbeat Vignette Pulse */}
        <div className={`schooltag-vignette ${vignetteActive ? 'active' : ''}`} />

        {/* Countdown Overlay */}
        {gameState === GAME_STATES.COUNTDOWN && (
          <div className="schooltag-modal-overlay">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#38bdf8', marginBottom: '8px' }}>
                당직선생님이 순찰을 시작하기 전에 숨으세요!
              </div>
              <div style={{ fontSize: '5.5rem', fontWeight: '900', color: '#fbbf24', fontFamily: 'monospace' }}>
                {countdownNum}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                교실과 복도의 사물함으로 이동하여 Space를 누르면 은신할 수 있습니다.
              </div>
            </div>
          </div>
        )}

        {/* In-Game HUD */}
        {gameState === GAME_STATES.PLAYING && (
          <>
            <div className="schooltag-hud">
              {/* HUD Left: Key Tracker & Stamina Bar */}
              <div className="schooltag-hud-left">
                <div className="schooltag-key-tracker">
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fbbf24' }}>황금 열쇠</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3].map((slot) => (
                      <span
                        key={slot}
                        className={`schooltag-key-slot ${slot <= collectedKeysCount ? 'collected' : ''}`}
                      >
                        🔑
                      </span>
                    ))}
                  </div>
                </div>

                <div className="schooltag-stamina-bar-container">
                  <Zap size={15} color={staminaPercent < 25 ? '#ef4444' : '#38bdf8'} />
                  <div className="schooltag-stamina-bar">
                    <div
                      className={`schooltag-stamina-fill ${staminaPercent < 25 ? 'low' : ''}`}
                      style={{ width: `${staminaPercent}%` }}
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', width: '32px' }}>{staminaPercent}%</span>
                </div>
              </div>

              {/* HUD Right: Timer Badge & Gate Status */}
              <div className="schooltag-hud-right">
                <div className="schooltag-timer-badge">
                  <span>⏱️</span>
                  <span>
                    {Math.floor(remainingTime / 60)}:{String(remainingTime % 60).padStart(2, '0')}
                  </span>
                </div>
                {isGateUnlocked ? (
                  <div className="schooltag-gate-status">
                    🚨 1층 중앙현관 비상구 개방됨!
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    비상구 잠김 ({collectedKeysCount}/3)
                  </div>
                )}
              </div>
            </div>

            {/* Interaction Prompt Banner */}
            {isNearInteractable && (
              <div className="schooltag-prompt">
                {isNearInteractable}
              </div>
            )}
          </>
        )}

        {/* 3. Main Menu Modal */}
        {gameState === GAME_STATES.MENU && (
          <div className="schooltag-modal-overlay">
            <div className="schooltag-card">
              <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🔦</div>
              <h2 className="schooltag-card-title">도촌 불 꺼진 학교 숨바꼭질</h2>
              <p className="schooltag-card-desc">
                손전등 불빛만 믿고 달린다! 심장 쫄깃한 야간 술래잡기<br />
                불 꺼진 도촌초 교실에서 황금 열쇠 3개를 찾아 비상구로 탈출하세요.
              </p>

              {/* Character Skin Selection */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                {CHARACTER_SKINS.slice(0, 3).map((skin) => (
                  <button
                    key={skin.id}
                    onClick={() => setSelectedSkin(skin.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '12px',
                      background: selectedSkin === skin.id ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                      border: selectedSkin === skin.id ? '2px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.2)',
                      color: '#f8fafc',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>{skin.icon}</span>
                    <span>{skin.name}</span>
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <button onClick={startSinglePlayerGame} className="schooltag-btn-primary">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Play size={18} />
                  <span>혼자서 플레이 (vs AI 당직선생님)</span>
                </div>
              </button>

              <div style={{ margin: '12px 0 6px', fontSize: '0.85rem', color: '#64748b' }}>또는 친구들과 함께</div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCreateRoom}
                  disabled={isConnecting}
                  className="schooltag-btn-secondary"
                  style={{ marginTop: 0, opacity: isConnecting ? 0.6 : 1 }}
                >
                  {isConnecting ? '방 생성 중...' : '방 만들기'}
                </button>
                <button
                  onClick={() => {
                    setGameState(GAME_STATES.LOBBY);
                    setNetworkError('');
                    setConnectionStatus('');
                  }}
                  disabled={isConnecting}
                  className="schooltag-btn-secondary"
                  style={{ marginTop: 0, opacity: isConnecting ? 0.6 : 1 }}
                >
                  방 참가하기
                </button>
              </div>

              {connectionStatus && (
                <div style={{ color: '#38bdf8', fontSize: '0.82rem', marginTop: '10px' }}>
                  {connectionStatus}
                </div>
              )}

              {networkError && (
                <div style={{ color: '#f87171', fontSize: '0.82rem', marginTop: '10px' }}>
                  {networkError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. Multi Lobby Modal */}
        {gameState === GAME_STATES.LOBBY && (
          <div className="schooltag-modal-overlay">
            <div className="schooltag-card">
              <h2 className="schooltag-card-title">👥 P2P 멀티플레이 대기실</h2>

              {!currentRoomCode ? (
                <div style={{ margin: '16px 0' }}>
                  <p className="schooltag-card-desc">친구의 4자리 방 번호를 입력하세요.</p>
                  <input
                    type="text"
                    maxLength={4}
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="예: 7421"
                    disabled={isConnecting}
                    style={{
                      width: '140px',
                      padding: '10px',
                      fontSize: '1.4rem',
                      textAlign: 'center',
                      fontFamily: 'monospace',
                      fontWeight: '800',
                      borderRadius: '10px',
                      background: '#1e293b',
                      border: '2px solid #38bdf8',
                      color: '#f8fafc',
                      marginBottom: '14px',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleJoinRoom}
                      disabled={isConnecting || !roomCodeInput}
                      className="schooltag-btn-primary"
                      style={{ opacity: (isConnecting || !roomCodeInput) ? 0.6 : 1 }}
                    >
                      {isConnecting ? '연결 중...' : '참가하기'}
                    </button>
                    <button
                      onClick={() => {
                        setGameState(GAME_STATES.MENU);
                        setNetworkError('');
                        setConnectionStatus('');
                      }}
                      disabled={isConnecting}
                      className="schooltag-btn-secondary"
                      style={{ marginTop: 0 }}
                    >
                      취소
                    </button>
                  </div>

                  {connectionStatus && (
                    <div style={{ color: '#38bdf8', fontSize: '0.82rem', marginTop: '10px' }}>
                      {connectionStatus}
                    </div>
                  )}

                  {networkError && (
                    <div style={{ color: '#f87171', fontSize: '0.82rem', marginTop: '10px' }}>
                      {networkError}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      margin: '16px 0',
                      padding: '16px 14px',
                      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95))',
                      border: '2px solid rgba(251, 191, 36, 0.5)',
                      borderRadius: '16px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 0 15px rgba(251, 191, 36, 0.1)',
                    }}
                  >
                    <div style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <span>📢 친구들에게 아래 4자리 번호를 알려주세요!</span>
                    </div>

                    {/* 4자리 개별 거대 네온 디지털 번호 카드 */}
                    <div
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(currentRoomCode);
                          setIsCopied(true);
                          setTimeout(() => setIsCopied(false), 2000);
                        }
                      }}
                      title="클릭하여 방 번호 복사"
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px',
                        margin: '6px 0',
                        cursor: 'pointer',
                      }}
                    >
                      {String(currentRoomCode).padStart(4, '0').split('').map((digit, i) => (
                        <div
                          key={i}
                          style={{
                            width: '56px',
                            height: '68px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'radial-gradient(circle, #1e293b 0%, #0f172a 100%)',
                            border: '2.5px solid #fbbf24',
                            borderRadius: '12px',
                            fontSize: '3.2rem',
                            fontWeight: '900',
                            color: '#fef08a',
                            fontFamily: 'monospace',
                            textShadow: '0 0 14px rgba(251, 191, 36, 0.8), 0 0 28px rgba(245, 158, 11, 0.5)',
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5), inset 0 0 12px rgba(251, 191, 36, 0.2)',
                            userSelect: 'none',
                          }}
                        >
                          {digit}
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: isCopied ? '#4ade80' : '#fbbf24',
                        marginTop: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(currentRoomCode);
                          setIsCopied(true);
                          setTimeout(() => setIsCopied(false), 2000);
                        }
                      }}
                    >
                      <span>{isCopied ? '✨ 방 번호가 클립보드에 복사되었습니다!' : '📋 번호를 누르면 복사됩니다'}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'left', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#38bdf8', marginBottom: '8px' }}>
                      접속한 학생 ({lobbyPlayers.length}/4)
                    </div>
                    {lobbyPlayers.map((player, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: 'rgba(15, 23, 42, 0.8)',
                          borderRadius: '8px',
                          marginBottom: '6px',
                          fontSize: '0.9rem',
                        }}
                      >
                        <span style={{ fontWeight: '600' }}>{player.name} {player.isHost && '👑'}</span>
                        <span style={{ color: '#38bdf8', fontSize: '0.8rem' }}>준비 완료</span>
                      </div>
                    ))}
                  </div>

                  {connectionStatus && (
                    <div style={{ color: '#38bdf8', fontSize: '0.82rem', marginBottom: '10px' }}>
                      {connectionStatus}
                    </div>
                  )}

                  {networkRef.current && networkRef.current.isHost ? (
                    <button onClick={handleStartMultiMatch} className="schooltag-btn-primary">
                      게임 시작하기
                    </button>
                  ) : (
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '10px' }}>
                      방장이 게임을 시작하기를 기다리는 중...
                    </div>
                  )}

                  <button
                    onClick={() => {
                      networkRef.current.disconnect();
                      setCurrentRoomCode('');
                      setConnectionStatus('');
                      setGameState(GAME_STATES.MENU);
                    }}
                    className="schooltag-btn-secondary"
                  >
                    나가기
                  </button>
                </div>
              )}

              {networkError && (
                <div style={{ color: '#f87171', fontSize: '0.82rem', marginTop: '10px' }}>
                  {networkError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. Game Over & Result Modal */}
        {gameState === GAME_STATES.GAMEOVER && (
          <div className="schooltag-modal-overlay">
            <div className="schooltag-card">
              <div style={{ fontSize: '3rem', marginBottom: '8px' }}>
                {gameResult === 'ESCAPE_SUCCESS' ? '🎉' : '😱'}
              </div>

              <h2 className="schooltag-card-title">
                {gameResult === 'ESCAPE_SUCCESS'
                  ? '탈출 성공! 축하합니다!'
                  : gameResult === 'CAUGHT'
                  ? '당직선생님에게 잡혔습니다!'
                  : '제한 시간 초과! (탈출 실패)'}
              </h2>

              <p className="schooltag-card-desc">
                {gameResult === 'ESCAPE_SUCCESS'
                  ? '황금 열쇠를 모두 찾고 불 꺼진 도촌초등학교를 무사히 빠져나왔습니다!'
                  : '어두운 복도에서 발각되어 양호실로 이송되었습니다. 다시 도전해보세요!'}
              </p>

              {/* Final Score Display */}
              <div className="schooltag-score-display">
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>최종 달성 점수</span>
                <span className="schooltag-score-value">{finalScore.toLocaleString()}점</span>
              </div>

              {/* Strict Rule: Score Submission Form only shown if score > 100 */}
              {finalScore > 100 ? (
                <div style={{ marginBottom: '18px' }}>
                  {!isScoreSubmitted ? (
                    <form onSubmit={handleSubmitScore} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: '700' }}>
                        🏆 명예의 전당 점수 등록
                      </div>
                      <input
                        type="text"
                        value={playerNameInput}
                        onChange={(e) => setPlayerNameInput(e.target.value)}
                        placeholder="예: 홍길동"
                        maxLength={10}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          background: '#1e293b',
                          color: '#f8fafc',
                          fontSize: '0.95rem',
                          textAlign: 'center',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingScore}
                        className="schooltag-btn-primary"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                      >
                        {isSubmittingScore ? '등록 중...' : '명예의 전당에 점수 기록하기'}
                      </button>
                    </form>
                  ) : (
                    <div style={{ color: '#4ade80', fontWeight: '700', fontSize: '0.9rem', padding: '10px', background: 'rgba(34, 197, 94, 0.15)', borderRadius: '10px' }}>
                      ✨ 명예의 전당 등록이 완료되었습니다!
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '16px' }}>
                  (100점을 초과하여 달성해야 명예의 전당에 점수를 등록할 수 있습니다.)
                </div>
              )}

              <button onClick={startSinglePlayerGame} className="schooltag-btn-primary">
                다시 플레이하기
              </button>
              <button
                onClick={handleReturnToMenu}
                className="schooltag-btn-secondary"
              >
                메인 메뉴로
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Mobile Touch Controls (D-Pad & Buttons - Works with Touch & Mouse) */}
      <div className="schooltag-mobile-controls">
        <div className="schooltag-dpad">
          <div />
          <button
            className="schooltag-dpad-btn"
            title="전진 (손전등 방향)"
            aria-label="전진"
            onTouchStart={() => (keysDownRef.current['ArrowUp'] = true)}
            onTouchEnd={() => (keysDownRef.current['ArrowUp'] = false)}
            onMouseDown={() => (keysDownRef.current['ArrowUp'] = true)}
            onMouseUp={() => (keysDownRef.current['ArrowUp'] = false)}
            onMouseLeave={() => (keysDownRef.current['ArrowUp'] = false)}
          >
            <ArrowUp size={20} />
          </button>
          <div />
          <button
            className="schooltag-dpad-btn"
            title="왼쪽 회전 (손전등 시야 회전)"
            aria-label="왼쪽 회전"
            onTouchStart={() => (keysDownRef.current['ArrowLeft'] = true)}
            onTouchEnd={() => (keysDownRef.current['ArrowLeft'] = false)}
            onMouseDown={() => (keysDownRef.current['ArrowLeft'] = true)}
            onMouseUp={() => (keysDownRef.current['ArrowLeft'] = false)}
            onMouseLeave={() => (keysDownRef.current['ArrowLeft'] = false)}
          >
            <ArrowLeft size={20} />
          </button>
          <div />
          <button
            className="schooltag-dpad-btn"
            title="오른쪽 회전 (손전등 시야 회전)"
            aria-label="오른쪽 회전"
            onTouchStart={() => (keysDownRef.current['ArrowRight'] = true)}
            onTouchEnd={() => (keysDownRef.current['ArrowRight'] = false)}
            onMouseDown={() => (keysDownRef.current['ArrowRight'] = true)}
            onMouseUp={() => (keysDownRef.current['ArrowRight'] = false)}
            onMouseLeave={() => (keysDownRef.current['ArrowRight'] = false)}
          >
            <ArrowRight size={20} />
          </button>
          <div />
          <button
            className="schooltag-dpad-btn"
            title="후진"
            aria-label="후진"
            onTouchStart={() => (keysDownRef.current['ArrowDown'] = true)}
            onTouchEnd={() => (keysDownRef.current['ArrowDown'] = false)}
            onMouseDown={() => (keysDownRef.current['ArrowDown'] = true)}
            onMouseUp={() => (keysDownRef.current['ArrowDown'] = false)}
            onMouseLeave={() => (keysDownRef.current['ArrowDown'] = false)}
          >
            <ArrowDown size={20} />
          </button>
          <div />
        </div>

        <div className="schooltag-mobile-actions">
          <button
            className="schooltag-action-btn sprint"
            onTouchStart={() => (keysDownRef.current['ShiftLeft'] = true)}
            onTouchEnd={() => (keysDownRef.current['ShiftLeft'] = false)}
            onMouseDown={() => (keysDownRef.current['ShiftLeft'] = true)}
            onMouseUp={() => (keysDownRef.current['ShiftLeft'] = false)}
            onMouseLeave={() => (keysDownRef.current['ShiftLeft'] = false)}
          >
            ⚡ 대시
          </button>
          <button
            className="schooltag-action-btn interact"
            onTouchStart={handleSpaceAction}
            onClick={handleSpaceAction}
          >
            ✋ 액션
          </button>
        </div>
      </div>

      {/* 7. How To Play Modal */}
      <SchoolTagHowToPlayModal
        isOpen={howToPlayOpen}
        onClose={() => setHowToPlayOpen(false)}
      />
    </div>
  );
}
