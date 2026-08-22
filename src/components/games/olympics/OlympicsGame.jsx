import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GAME_EVENTS,
  EVENT_DETAILS,
  HURDLES_CONFIG,
  BASKETBALL_CONFIG,
  CANOE_CONFIG,
  MEDAL_CUTOFFS,
  ATHLETE_PALETTES
} from './olympicsConstants';
import { OlympicsRenderEngine } from './olympicsEngine';
import { olympicsAudio } from './olympicsAudio';
import OlympicsHowToPlayModal from './OlympicsHowToPlayModal';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import { haptics } from '../../../utils/haptics';
import {
  Trophy,
  Volume2,
  VolumeX,
  RotateCcw,
  Play,
  HelpCircle,
  Award,
  Flame,
  Zap,
  Send,
  Sparkles,
  ChevronRight,
  Flag,
  Target
} from 'lucide-react';
import './olympics.css';

export default function OlympicsGame({ onScoreSubmitted }) {
  // Game Flow States
  const [currentEvent, setCurrentEvent] = useState(GAME_EVENTS.INTRO);
  const [selectedTeam, setSelectedTeam] = useState(ATHLETE_PALETTES[0]);
  const [isMuted, setIsMuted] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // Event Scores
  const [scores, setScores] = useState({
    hurdles: 0,
    basketball: 0,
    canoe: 0,
    total: 0
  });

  // Leaderboard Form States
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // In-Game Live HUD Stats
  const [liveEventScore, setLiveEventScore] = useState(0);
  const [liveProgressText, setLiveProgressText] = useState('');
  const [countdown, setCountdown] = useState(null); // 3, 2, 1, GO!

  // Canvas Reference & Render Engine
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const requestRef = useRef(null);

  // Game Engine Mutable States
  const gameStateRef = useRef({
    time: 0,
    isRunning: false,
    lastFootLeft: false,

    // Hurdles state
    hurdles: {
      distance: 0,
      speed: 0,
      playerY: 0,
      velocityY: 0,
      isJumping: false,
      legPhase: 0,
      isStumbled: false,
      stumbleTimer: 0,
      items: HURDLES_CONFIG.HURDLE_POSITIONS.map((pos, idx) => ({ id: idx, pos, isCleared: false, isFallen: false })),
      elapsedTime: 0,
      perfectJumps: 0
    },

    // Basketball state
    basketball: {
      ballIndex: 1,
      gaugePos: 50,
      gaugeDir: 1,
      isShooting: false,
      streak: 0,
      ball: { x: 0, y: 0, vx: 0, vy: 0, rot: 0, isActive: false },
      shotsLeft: BASKETBALL_CONFIG.TOTAL_BALLS,
      elapsedTime: 0
    },

    // Canoe state
    canoe: {
      playerX: 300,
      playerAngle: 0,
      targetAngle: 0,
      paddlePhase: 0,
      riverScroll: 0,
      distanceTraveled: 0,
      gatesPassed: 0,
      gates: Array.from({ length: CANOE_CONFIG.TOTAL_GATES }, (_, i) => ({
        id: i,
        num: i + 1,
        x: 140 + Math.sin(i * 1.4) * 120,
        y: 120 + i * 70,
        width: 80,
        isPassed: false
      })),
      obstacles: [
        { id: 1, type: 'rock', x: 220, y: 160, radius: 18 },
        { id: 2, type: 'log', x: 380, y: 240 },
        { id: 3, type: 'rock', x: 180, y: 310, radius: 20 },
        { id: 4, type: 'rock', x: 340, y: 390, radius: 19 },
        { id: 5, type: 'log', x: 240, y: 470 },
        { id: 6, type: 'rock', x: 390, y: 550, radius: 22 },
        { id: 7, type: 'rock', x: 160, y: 630, radius: 17 },
        { id: 8, type: 'log', x: 310, y: 700 }
      ],
      elapsedTime: 0
    }
  });

  // Sound Toggle Handler
  const toggleSound = () => {
    const muted = olympicsAudio.toggleMute();
    setIsMuted(muted);
  };

  // Start a Specific Event with Countdown
  const startEvent = (eventKey) => {
    setCurrentEvent(eventKey);
    setLiveEventScore(0);
    setCountdown(3);

    const s = gameStateRef.current;
    s.isRunning = false;
    s.time = 0;

    if (eventKey === GAME_EVENTS.HURDLES) {
      setLiveProgressText('0m / 100m');
      s.hurdles.distance = 0;
      s.hurdles.speed = 0;
      s.hurdles.playerY = 0;
      s.hurdles.velocityY = 0;
      s.hurdles.isJumping = false;
      s.hurdles.legPhase = 0;
      s.hurdles.isStumbled = false;
      s.hurdles.stumbleTimer = 0;
      s.hurdles.elapsedTime = 0;
      s.hurdles.perfectJumps = 0;
      s.hurdles.items = HURDLES_CONFIG.HURDLE_POSITIONS.map((pos, idx) => ({
        id: idx,
        pos,
        isCleared: false,
        isFallen: false
      }));
    } else if (eventKey === GAME_EVENTS.BASKETBALL) {
      setLiveProgressText('공 1 / 8');
      s.basketball.ballIndex = 1;
      s.basketball.gaugePos = 50;
      s.basketball.gaugeDir = 1;
      s.basketball.isShooting = false;
      s.basketball.streak = 0;
      s.basketball.shotsLeft = BASKETBALL_CONFIG.TOTAL_BALLS;
      s.basketball.elapsedTime = 0;
      s.basketball.ball = { x: 0, y: 0, vx: 0, vy: 0, rot: 0, isActive: false };
    } else if (eventKey === GAME_EVENTS.CANOE) {
      setLiveProgressText('0m / 800m');
      s.canoe.playerX = 300;
      s.canoe.playerAngle = 0;
      s.canoe.targetAngle = 0;
      s.canoe.paddlePhase = 0;
      s.canoe.riverScroll = 0;
      s.canoe.distanceTraveled = 0;
      s.canoe.gatesPassed = 0;
      s.canoe.elapsedTime = 0;
      s.canoe.gates.forEach(g => { g.isPassed = false; });
    }

    // 3, 2, 1, GO! Countdown sequence
    olympicsAudio.playBeep(440, 0.1);
    let count = 3;
    const countTimer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        olympicsAudio.playBeep(440, 0.1);
      } else if (count === 0) {
        setCountdown('START!');
        olympicsAudio.playStartGun();
        olympicsAudio.playWhistle();
        s.isRunning = true;
      } else {
        clearInterval(countTimer);
        setCountdown(null);
      }
    }, 850);
  };

  // Complete Event & Move to Next Event or Results
  const finishCurrentEvent = (eventKey, finalEventScore) => {
    const s = gameStateRef.current;
    s.isRunning = false;
    olympicsAudio.playWhistle();
    olympicsAudio.playCheer();

    setScores(prev => {
      const nextScores = { ...prev, [eventKey.toLowerCase()]: finalEventScore };
      nextScores.total = (nextScores.hurdles || 0) + (nextScores.basketball || 0) + (nextScores.canoe || 0);
      return nextScores;
    });

    // Advance to Next Stage
    setTimeout(() => {
      if (eventKey === GAME_EVENTS.HURDLES) {
        startEvent(GAME_EVENTS.BASKETBALL);
      } else if (eventKey === GAME_EVENTS.BASKETBALL) {
        startEvent(GAME_EVENTS.CANOE);
      } else if (eventKey === GAME_EVENTS.CANOE) {
        setCurrentEvent(GAME_EVENTS.RESULTS);
        olympicsAudio.playFanfare();
      }
    }, 1400);
  };

  // -------------------------------------------------------------
  // CONTROLS & ACTIONS
  // -------------------------------------------------------------
  // 1. Hurdles Controls
  const handleHurdleStep = (isLeft) => {
    const s = gameStateRef.current;
    if (!s.isRunning || currentEvent !== GAME_EVENTS.HURDLES || s.hurdles.isStumbled) return;

    if (s.lastFootLeft !== isLeft) {
      s.hurdles.speed = Math.min(s.hurdles.speed + HURDLES_CONFIG.BASE_ACCEL * 1.5, HURDLES_CONFIG.MAX_SPEED);
      s.lastFootLeft = isLeft;
    } else {
      s.hurdles.speed = Math.min(s.hurdles.speed + HURDLES_CONFIG.BASE_ACCEL * 0.5, HURDLES_CONFIG.MAX_SPEED * 0.7);
    }
    s.hurdles.legPhase += 0.8;
    olympicsAudio.playFootstep(isLeft);
    haptics.light();
  };

  const handleHurdleJump = () => {
    const s = gameStateRef.current;
    if (!s.isRunning || currentEvent !== GAME_EVENTS.HURDLES || s.hurdles.isJumping || s.hurdles.isStumbled) return;

    s.hurdles.isJumping = true;
    s.hurdles.velocityY = HURDLES_CONFIG.JUMP_POWER;
    olympicsAudio.playJump();
    haptics.medium();
  };

  // 2. Basketball Controls
  const handleBasketballShoot = () => {
    const s = gameStateRef.current;
    if (!s.isRunning || currentEvent !== GAME_EVENTS.BASKETBALL || s.basketball.ball.isActive) return;

    s.basketball.isShooting = true;
    olympicsAudio.playShoot();
    haptics.heavy();

    const gaugePos = s.basketball.gaugePos;
    const perfectMin = 50 - BASKETBALL_CONFIG.PERFECT_ZONE_WIDTH * 0.5;
    const perfectMax = 50 + BASKETBALL_CONFIG.PERFECT_ZONE_WIDTH * 0.5;
    const goodMin = 50 - BASKETBALL_CONFIG.GOOD_ZONE_WIDTH * 0.5;
    const goodMax = 50 + BASKETBALL_CONFIG.GOOD_ZONE_WIDTH * 0.5;

    let isSuccess = false;
    let earnedScore = 0;
    const isMoneyBall = s.basketball.ballIndex === BASKETBALL_CONFIG.TOTAL_BALLS;
    const baseVal = isMoneyBall ? BASKETBALL_CONFIG.MONEY_BALL_SCORE : BASKETBALL_CONFIG.REGULAR_SHOT_SCORE;

    if (gaugePos >= perfectMin && gaugePos <= perfectMax) {
      // Perfect Swish
      isSuccess = true;
      earnedScore = baseVal + 50 + s.basketball.streak * 30;
      s.basketball.streak += 1;
    } else if (gaugePos >= goodMin && gaugePos <= goodMax) {
      // Good Bank Shot
      isSuccess = true;
      earnedScore = baseVal;
      s.basketball.streak += 1;
    } else {
      // Missed Shot
      isSuccess = false;
      s.basketball.streak = 0;
    }

    // Launch Ball Projectile
    const canvas = canvasRef.current;
    const startX = (canvas?.width || 640) * 0.26;
    const startY = (canvas?.height || 400) * 0.62;
    const hoopX = (canvas?.width || 640) * 0.8;
    const hoopY = (canvas?.height || 400) * 0.3;

    s.basketball.ball = {
      x: startX,
      y: startY,
      targetX: hoopX + (isSuccess ? 0 : (gaugePos < 50 ? -35 : 40)),
      targetY: hoopY + (isSuccess ? 10 : -30),
      isSuccess,
      earnedScore,
      progress: 0,
      rot: 0,
      isActive: true
    };
  };

  // 3. Canoe Controls
  const handleCanoeSteer = (direction) => {
    const s = gameStateRef.current;
    if (!s.isRunning || currentEvent !== GAME_EVENTS.CANOE) return;

    s.canoe.targetAngle = direction * 0.35;
    s.canoe.playerX += direction * CANOE_CONFIG.STEER_SPEED * 3.5;
    s.canoe.paddlePhase += 0.9;
    olympicsAudio.playPaddle();
    haptics.light();
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (currentEvent === GAME_EVENTS.HURDLES) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          handleHurdleStep(true);
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          handleHurdleStep(false);
        } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          e.preventDefault();
          handleHurdleJump();
        }
      } else if (currentEvent === GAME_EVENTS.BASKETBALL) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleBasketballShoot();
        }
      } else if (currentEvent === GAME_EVENTS.CANOE) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          handleCanoeSteer(-1);
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          handleCanoeSteer(1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentEvent]);

  // -------------------------------------------------------------
  // MAIN GAME LOOP (Canvas 2D Engine Update)
  // -------------------------------------------------------------
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = engineRef.current;
    if (!engine) return;

    const width = canvas.width;
    const height = canvas.height;
    const s = gameStateRef.current;

    s.time += 0.016;

    // 1. Hurdles Event Logic
    if (currentEvent === GAME_EVENTS.HURDLES) {
      if (s.isRunning) {
        s.hurdles.elapsedTime += 0.016;

        // Apply Speed & Friction
        s.hurdles.speed *= HURDLES_CONFIG.FRICTION;
        s.hurdles.distance += s.hurdles.speed * 0.04;
        setLiveProgressText(`${Math.min(100, Math.floor(s.hurdles.distance))}m / 100m`);

        // Stumble Recovery
        if (s.hurdles.isStumbled) {
          s.hurdles.stumbleTimer -= 0.016;
          if (s.hurdles.stumbleTimer <= 0) {
            s.hurdles.isStumbled = false;
          }
        }

        // Jump Physics
        if (s.hurdles.isJumping) {
          s.hurdles.playerY += s.hurdles.velocityY;
          s.hurdles.velocityY -= HURDLES_CONFIG.GRAVITY;
          if (s.hurdles.playerY <= 0) {
            s.hurdles.playerY = 0;
            s.hurdles.isJumping = false;
            s.hurdles.velocityY = 0;
          }
        }

        // Hurdle Collision Check
        s.hurdles.items.forEach(h => {
          if (!h.isCleared && !h.isFallen && Math.abs(s.hurdles.distance - h.pos) < 1.2) {
            if (s.hurdles.playerY > 26) {
              // Perfect Jump!
              h.isCleared = true;
              s.hurdles.perfectJumps += 1;
              olympicsAudio.playHurdleClear();
              setLiveEventScore(prev => prev + HURDLES_CONFIG.PERFECT_JUMP_BONUS);
            } else if (s.hurdles.playerY <= 15) {
              // Knocked down hurdle
              h.isFallen = true;
              s.hurdles.isStumbled = true;
              s.hurdles.stumbleTimer = HURDLES_CONFIG.HIT_PENALTY_TIME;
              s.hurdles.speed = Math.max(s.hurdles.speed * 0.25, 0.8);
              olympicsAudio.playHurdleHit();
              haptics.heavy();
            }
          }
        });

        // 100m Finish Check
        if (s.hurdles.distance >= HURDLES_CONFIG.TRACK_LENGTH_METERS) {
          s.hurdles.distance = HURDLES_CONFIG.TRACK_LENGTH_METERS;
          const timeSec = s.hurdles.elapsedTime;
          const timeScore = Math.max(0, Math.round(HURDLES_CONFIG.BASE_SCORE - (timeSec - 9.5) * 45));
          const totalHurdlesScore = timeScore + s.hurdles.perfectJumps * HURDLES_CONFIG.PERFECT_JUMP_BONUS;
          setLiveEventScore(totalHurdlesScore);
          finishCurrentEvent(GAME_EVENTS.HURDLES, totalHurdlesScore);
        }
      }

      engine.renderHurdles({
        width,
        height,
        distance: s.hurdles.distance,
        speed: s.hurdles.speed,
        playerY: s.hurdles.playerY,
        isJumping: s.hurdles.isJumping,
        legPhase: s.hurdles.legPhase,
        hurdles: s.hurdles.items,
        team: selectedTeam,
        trackLength: HURDLES_CONFIG.TRACK_LENGTH_METERS,
        isStumbled: s.hurdles.isStumbled,
        time: s.time
      });
    }

    // 2. Basketball Event Logic
    else if (currentEvent === GAME_EVENTS.BASKETBALL) {
      if (s.isRunning) {
        s.basketball.elapsedTime += 0.016;

        // Gauge Oscillation
        s.basketball.gaugePos += s.basketball.gaugeDir * BASKETBALL_CONFIG.GAUGE_SPEED;
        if (s.basketball.gaugePos >= 96) {
          s.basketball.gaugePos = 96;
          s.basketball.gaugeDir = -1;
        } else if (s.basketball.gaugePos <= 4) {
          s.basketball.gaugePos = 4;
          s.basketball.gaugeDir = 1;
        }

        // Flying Ball Parabolic Arc Animation
        if (s.basketball.ball.isActive) {
          s.basketball.ball.progress += 0.035;
          s.basketball.ball.rot += 0.15;
          const p = s.basketball.ball.progress;

          const startX = width * 0.26;
          const startY = height * 0.62;
          const targetX = s.basketball.ball.targetX;
          const targetY = s.basketball.ball.targetY;

          // Parabolic Bezier Arc
          const midX = (startX + targetX) * 0.5;
          const midY = Math.min(startY, targetY) - 120;

          s.basketball.ball.x = (1 - p) * (1 - p) * startX + 2 * (1 - p) * p * midX + p * p * targetX;
          s.basketball.ball.y = (1 - p) * (1 - p) * startY + 2 * (1 - p) * p * midY + p * p * targetY;

          if (p >= 1) {
            s.basketball.ball.isActive = false;
            s.basketball.isShooting = false;

            if (s.basketball.ball.isSuccess) {
              olympicsAudio.playSwish();
              olympicsAudio.playCheer();
              setLiveEventScore(prev => prev + s.basketball.ball.earnedScore);
            } else {
              olympicsAudio.playRimHit();
            }

            s.basketball.ballIndex += 1;
            s.basketball.shotsLeft -= 1;
            setLiveProgressText(`공 ${Math.min(8, s.basketball.ballIndex)} / 8`);

            if (s.basketball.shotsLeft <= 0) {
              setLiveEventScore(currentLive => {
                finishCurrentEvent(GAME_EVENTS.BASKETBALL, currentLive);
                return currentLive;
              });
            }
          }
        }
      }

      engine.renderBasketball({
        width,
        height,
        ball: s.basketball.ball,
        ballNumber: s.basketball.ballIndex,
        totalBalls: BASKETBALL_CONFIG.TOTAL_BALLS,
        gaugePos: s.basketball.gaugePos,
        isShooting: s.basketball.isShooting,
        streak: s.basketball.streak,
        team: selectedTeam,
        time: s.time
      });
    }

    // 3. Canoe Slalom Event Logic
    else if (currentEvent === GAME_EVENTS.CANOE) {
      if (s.isRunning) {
        s.canoe.elapsedTime += 0.016;

        const riverSpeed = CANOE_CONFIG.RIVER_SPEED;
        s.canoe.riverScroll += riverSpeed * 2;
        s.canoe.distanceTraveled += riverSpeed;
        s.canoe.paddlePhase += 0.08;
        setLiveProgressText(`${Math.min(800, Math.floor(s.canoe.distanceTraveled))}m / 800m`);

        // Smooth Canoe Rotation Angle
        s.canoe.playerAngle += (s.canoe.targetAngle - s.canoe.playerAngle) * 0.15;
        s.canoe.targetAngle *= 0.88;

        // Boundary Clamp
        const bankW = Math.min(width * 0.12, 60);
        s.canoe.playerX = Math.max(bankW + 20, Math.min(width - bankW - 20, s.canoe.playerX));

        // Slalom Gates Passing Check
        const playerScreenY = height * 0.72;
        s.canoe.gates.forEach(gate => {
          const gateScreenY = gate.y - s.canoe.distanceTraveled;
          if (!gate.isPassed && Math.abs(gateScreenY - playerScreenY) < 18) {
            if (Math.abs(s.canoe.playerX - gate.x) < gate.width * 0.5) {
              gate.isPassed = true;
              s.canoe.gatesPassed += 1;
              olympicsAudio.playGatePass();
              setLiveEventScore(prev => prev + CANOE_CONFIG.GATE_PASS_SCORE);
            }
          }
        });

        // Obstacles Collision Check
        s.canoe.obstacles.forEach(obs => {
          const obsScreenY = obs.y - s.canoe.distanceTraveled;
          const dist = Math.hypot(s.canoe.playerX - obs.x, playerScreenY - obsScreenY);
          if (dist < (obs.radius || 20) + 14) {
            olympicsAudio.playCollision();
            haptics.heavy();
            s.canoe.distanceTraveled -= 8;
          }
        });

        // Course Finished
        if (s.canoe.distanceTraveled >= CANOE_CONFIG.COURSE_LENGTH) {
          const gatesScore = s.canoe.gatesPassed * CANOE_CONFIG.GATE_PASS_SCORE;
          const timeBonus = Math.max(0, Math.round(400 - s.canoe.elapsedTime * 8));
          const totalCanoeScore = gatesScore + timeBonus;
          setLiveEventScore(totalCanoeScore);
          finishCurrentEvent(GAME_EVENTS.CANOE, totalCanoeScore);
        }
      }

      engine.renderCanoe({
        width,
        height,
        playerX: s.canoe.playerX,
        playerAngle: s.canoe.playerAngle,
        paddlePhase: s.canoe.paddlePhase,
        riverScroll: s.canoe.riverScroll,
        gates: s.canoe.gates,
        obstacles: s.canoe.obstacles,
        team: selectedTeam,
        courseLength: CANOE_CONFIG.COURSE_LENGTH,
        distanceTraveled: s.canoe.distanceTraveled
      });
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [currentEvent, selectedTeam]);

  // Canvas Initialization and Loop Start
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      engineRef.current = new OlympicsRenderEngine(canvas);
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameLoop]);

  // Handle Leaderboard Score Submission
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting || isSubmitted) return;

    setIsSubmitting(true);
    try {
      await submitScoreToDB('olympics', playerName.trim(), scores.total);
      setIsSubmitted(true);
      haptics.success();
      if (onScoreSubmitted) {
        onScoreSubmitted('olympics');
      }
    } catch (err) {
      alert('점수 등록 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine Medal
  const getMedalInfo = (total) => {
    if (total >= MEDAL_CUTOFFS.GOLD) {
      return { label: '🥇 금메달 (GOLD MEDAL)', color: '#FBBF24', title: '도촌 올림픽 챔피언' };
    }
    if (total >= MEDAL_CUTOFFS.SILVER) {
      return { label: '🥈 은메달 (SILVER MEDAL)', color: '#CBD5E1', title: '도촌 올림픽 준우승' };
    }
    if (total >= MEDAL_CUTOFFS.BRONZE) {
      return { label: '🥉 동메달 (BRONZE MEDAL)', color: '#D97706', title: '도촌 올림픽 입상' };
    }
    return { label: '🎖️ 참가상 (PARTICIPANT)', color: '#94A3B8', title: '열정의 올림픽 도전자' };
  };

  const medalInfo = getMedalInfo(scores.total);

  return (
    <div className="olympics-container">
      {/* 1. Header with Title & Live HUD Stats */}
      <div className="olympics-header">
        <div className="olympics-title-box">
          <span style={{ fontSize: '24px' }}>🏅</span>
          <div>
            <h2 className="olympics-title-main">
              도촌 미니 올림픽
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              {currentEvent !== GAME_EVENTS.INTRO && currentEvent !== GAME_EVENTS.RESULTS ? (
                <span className="olympics-event-badge">
                  {EVENT_DETAILS[currentEvent]?.icon} {EVENT_DETAILS[currentEvent]?.name}
                </span>
              ) : (
                <span className="text-[11px] font-bold text-amber-300">
                  3대 릴레이 스포츠 챔피언십
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Live HUD Stats during Gameplay */}
        {currentEvent !== GAME_EVENTS.INTRO && currentEvent !== GAME_EVENTS.RESULTS && (
          <div className="olympics-hud-stats">
            <div className="olympics-stat-pill">
              <span className="olympics-stat-label">진행도</span>
              <strong className="olympics-stat-value text-white">{liveProgressText}</strong>
            </div>
            <div className="olympics-stat-pill">
              <span className="olympics-stat-label">종목 점수</span>
              <strong className="olympics-stat-value">{liveEventScore.toLocaleString()}점</strong>
            </div>
          </div>
        )}

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <button onClick={toggleSound} className="olympics-btn-icon" title="사운드 켜기/끄기">
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
          <button onClick={() => setIsHowToPlayOpen(true)} className="olympics-btn-icon" title="게임 조작 안내">
            <HelpCircle className="w-5 h-5 text-amber-400" />
          </button>
        </div>
      </div>

      {/* 2. Main Game Viewport */}
      <div className="olympics-viewport">
        <canvas
          ref={canvasRef}
          width={640}
          height={400}
          className="olympics-canvas"
        />

        {/* Countdown Overlay */}
        {countdown !== null && (
          <div className="olympics-countdown-overlay">
            <span className="olympics-countdown-text animate-ping">
              {countdown}
            </span>
          </div>
        )}

        {/* INTRO SCREEN OVERLAY */}
        {currentEvent === GAME_EVENTS.INTRO && (
          <div className="olympics-overlay-screen">
            <div className="olympics-intro-card">
              <div className="text-4xl mb-2 animate-bounce">🏃 🏀 🛶</div>
              <h1 className="text-2xl font-black text-amber-400 mb-1 tracking-tight">
                DOCHON MINI OLYMPICS
              </h1>
              <p className="text-xs text-slate-300 mb-4 font-medium leading-relaxed">
                100m 허들 달리기 · 3점슛 챌린지 · 급류 카누 슬라럼<br />
                <strong className="text-white">도촌초등학교 3대 릴레이 스포츠 챔피언</strong>에 도전하세요!
              </p>

              {/* Team Selection */}
              <div className="mb-5">
                <span className="text-[12px] font-bold text-slate-300 block mb-2">
                  👕 참가 팀 유니폼 선택
                </span>
                <div className="flex justify-center gap-2">
                  {ATHLETE_PALETTES.map(team => (
                    <button
                      key={team.id}
                      onClick={() => {
                        setSelectedTeam(team);
                        haptics.light();
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black border transition-all ${
                        selectedTeam.id === team.id
                          ? 'border-white scale-105 shadow-xl ring-2 ring-amber-400'
                          : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: team.primary, color: '#FFFFFF' }}
                    >
                      {team.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => startEvent(GAME_EVENTS.HURDLES)}
                  className="olympics-btn-primary flex-1 py-3 text-sm font-black flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>올림픽 경기 시작!</span>
                </button>
                <button
                  onClick={() => setIsHowToPlayOpen(true)}
                  className="olympics-btn-secondary px-4 text-xs font-bold"
                >
                  조작법
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FINAL RESULTS & MEDAL CEREMONY SCREEN */}
        {currentEvent === GAME_EVENTS.RESULTS && (
          <div className="olympics-overlay-screen">
            <div className="olympics-results-card">
              <div className="text-4xl mb-1 animate-bounce">🏆</div>
              <h2 className="text-xl font-black text-white mb-0.5">
                도촌 미니 올림픽 <span className="text-amber-400">종합 시상식</span>
              </h2>
              <p className="text-xs text-slate-300 font-bold mb-3">
                {selectedTeam.name}의 모든 경기가 완료되었습니다!
              </p>

              {/* Medal Badge */}
              <div
                className="py-2.5 px-5 rounded-2xl mb-3 font-black text-base border shadow-xl inline-block"
                style={{ borderColor: medalInfo.color, color: medalInfo.color, backgroundColor: 'rgba(0,0,0,0.6)' }}
              >
                {medalInfo.label}
              </div>

              {/* Score Breakdown Table */}
              <div className="bg-slate-950/80 rounded-2xl p-3.5 mb-3 text-xs space-y-2 border border-slate-800 text-left">
                <div className="flex justify-between text-slate-300 font-semibold">
                  <span>🏃 100m 허들 달리기</span>
                  <strong className="text-amber-400 text-sm">{scores.hurdles.toLocaleString()} 점</strong>
                </div>
                <div className="flex justify-between text-slate-300 font-semibold">
                  <span>🏀 3점 슛 챌린지</span>
                  <strong className="text-orange-400 text-sm">{scores.basketball.toLocaleString()} 점</strong>
                </div>
                <div className="flex justify-between text-slate-300 font-semibold">
                  <span>🛶 급류 카누 슬라럼</span>
                  <strong className="text-cyan-400 text-sm">{scores.canoe.toLocaleString()} 점</strong>
                </div>
                <div className="border-t border-slate-700 pt-2 flex justify-between text-white font-black text-base">
                  <span>🥇 올림픽 종합 점수</span>
                  <strong className="text-amber-300 text-lg">{scores.total.toLocaleString()} 점</strong>
                </div>
              </div>

              {/* Leaderboard Submission Form: 100점 이하 숨김 및 placeholder='예: 홍길동' 엄수 */}
              {scores.total > 100 ? (
                <div className="mt-2">
                  {!isSubmitted ? (
                    <form onSubmit={handleScoreSubmit} className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="예: 홍길동"
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                          maxLength={10}
                          className="olympics-name-input"
                          required
                          autoFocus
                        />
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="olympics-btn-primary px-5 text-sm font-black shrink-0 flex items-center gap-1.5"
                        >
                          <Send className="w-4 h-4" />
                          <span>{isSubmitting ? '등록중...' : '랭킹 등록'}</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold">
                      ✅ 도촌초 명예의 전당 랭킹 등록 완료!
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-medium">
                  100점 초과 달성 시 명예의 전당 랭킹에 기록할 수 있습니다.
                </p>
              )}

              {/* Retry Button */}
              <button
                onClick={() => startEvent(GAME_EVENTS.HURDLES)}
                className="mt-3 text-xs text-slate-300 hover:text-white font-bold flex items-center justify-center gap-1.5 w-full py-2"
              >
                <RotateCcw className="w-4 h-4" /> 다시 도전하기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. High-Visibility On-Screen Controls Panel */}
      {currentEvent !== GAME_EVENTS.INTRO && currentEvent !== GAME_EVENTS.RESULTS && (
        <div className="olympics-controls-panel">
          {currentEvent === GAME_EVENTS.HURDLES && (
            <div className="flex items-center justify-center gap-3 w-full max-w-md">
              <button
                onPointerDown={(e) => { e.preventDefault(); handleHurdleStep(true); }}
                className="olympics-control-btn btn-hurdle-step flex-1"
              >
                <span className="olympics-btn-key-badge">← / A</span>
                <span>왼발 달리기</span>
              </button>
              <button
                onPointerDown={(e) => { e.preventDefault(); handleHurdleJump(); }}
                className="olympics-control-btn btn-hurdle-jump flex-1"
              >
                <span className="olympics-btn-key-badge">Space / ↑</span>
                <span>⬆️ 허들 점프!</span>
              </button>
              <button
                onPointerDown={(e) => { e.preventDefault(); handleHurdleStep(false); }}
                className="olympics-control-btn btn-hurdle-step flex-1"
              >
                <span className="olympics-btn-key-badge">→ / D</span>
                <span>오른발 달리기</span>
              </button>
            </div>
          )}

          {currentEvent === GAME_EVENTS.BASKETBALL && (
            <div className="flex items-center justify-center w-full max-w-sm">
              <button
                onPointerDown={(e) => { e.preventDefault(); handleBasketballShoot(); }}
                className="olympics-control-btn btn-shoot-action w-full"
              >
                <span className="olympics-btn-key-badge">SPACE / 터치</span>
                <span className="text-base font-black">🏀 3점 슛 발사!</span>
              </button>
            </div>
          )}

          {currentEvent === GAME_EVENTS.CANOE && (
            <div className="flex items-center justify-center gap-4 w-full max-w-sm">
              <button
                onPointerDown={(e) => { e.preventDefault(); handleCanoeSteer(-1); }}
                className="olympics-control-btn btn-canoe-steer flex-1"
              >
                <span className="olympics-btn-key-badge">← / A</span>
                <span>◀ 좌현 회전</span>
              </button>
              <button
                onPointerDown={(e) => { e.preventDefault(); handleCanoeSteer(1); }}
                className="olympics-control-btn btn-canoe-steer flex-1"
              >
                <span className="olympics-btn-key-badge">→ / D</span>
                <span>우현 회전 ▶</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. How to Play Modal */}
      <OlympicsHowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
}
