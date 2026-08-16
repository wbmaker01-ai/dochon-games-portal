import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PITCHER_POS,
  BATTER_POS,
  HOME_PLATE_POS,
  PITCH_TYPES,
  HIT_RESULTS
} from './baseballConstants';
import {
  createTransparentSprite,
  selectNextPitch,
  calculateBallState,
  judgeSwing,
  advanceRunners,
  ParticleSystem
} from './baseballLogic';
import BaseballHowToPlayModal from './BaseballHowToPlayModal';
import { soundFx } from '../../../utils/audio';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  RotateCcw,
  Trophy,
  Flame,
  Zap,
  Sparkles,
  Award,
  Send,
  CheckCircle2
} from 'lucide-react';
import './baseball.css';

// Base Asset Path Helper
const getAsset = (file) => `${import.meta.env.BASE_URL}assets/baseball/${file}`;

export default function BaseballGame({ onScoreSubmitted }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const particleSystemRef = useRef(new ParticleSystem());

  // Image & Sprite Refs
  const assetsLoadedRef = useRef(false);
  const bgImgRef = useRef(null);
  const batterReadySpriteRef = useRef(null);
  const batterSwingSpriteRef = useRef(null);
  const pitcherSpriteRef = useRef(null);
  const homerunBadgeImgRef = useRef(null);

  // =========================================================================
  // Single Source of Truth REFS for 100% Stutter-Free State Machine
  // =========================================================================
  const gameStateRef = useRef('IDLE'); // 'IDLE' | 'PITCHING' | 'HIT_ANIMATION' | 'MISS_ANIMATION' | 'GAME_OVER'
  const scoreRef = useRef(0);
  const runsRef = useRef(0);
  const hitsRef = useRef(0);
  const homerunsRef = useRef(0);
  const longestDistanceRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const strikesRef = useRef(0);
  const outsRef = useRef(0);
  const runnersRef = useRef([false, false, false]); // [1B, 2B, 3B]

  const currentPitchRef = useRef(PITCH_TYPES.FASTBALL);
  const pitchStartTimeRef = useRef(0);
  const pitchDurationRef = useRef(2000);
  const isSwungRef = useRef(false);
  const swingDisplayTimerRef = useRef(null);
  const batterStateRef = useRef('READY'); // 'READY' | 'SWING'
  const nextPitchTimeoutRef = useRef(null);

  // =========================================================================
  // React State for UI HUD Sync
  // =========================================================================
  const [gameState, setGameState] = useState('IDLE');
  const [score, setScore] = useState(0);
  const [runs, setRuns] = useState(0);
  const [hits, setHits] = useState(0);
  const [homeruns, setHomeruns] = useState(0);
  const [longestDistance, setLongestDistance] = useState(0);
  const [combo, setCombo] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [outs, setOuts] = useState(0);
  const [runners, setRunners] = useState([false, false, false]);

  // UI / Feedback Overlays
  const [isMuted, setIsMuted] = useState(soundFx.muted);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [pitchToast, setPitchToast] = useState(null);
  const [hitFeedback, setHitFeedback] = useState(null);
  const [showHomerunBadge, setShowHomerunBadge] = useState(false);

  // Leaderboard Registration
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Synchronize refs to React state for UI rendering
  const syncUiState = useCallback(() => {
    setGameState(gameStateRef.current);
    setScore(scoreRef.current);
    setRuns(runsRef.current);
    setHits(hitsRef.current);
    setHomeruns(homerunsRef.current);
    setLongestDistance(longestDistanceRef.current);
    setCombo(comboRef.current);
    setStrikes(strikesRef.current);
    setOuts(outsRef.current);
    setRunners([...runnersRef.current]);
  }, []);

  // 1. Asset Preloading & Transparent Sprite Generation
  useEffect(() => {
    let isMounted = true;

    const bg = new Image();
    const bReady = new Image();
    const bSwing = new Image();
    const pitcher = new Image();
    const badge = new Image();

    bg.src = getAsset('bg_stadium.jpg');
    bReady.src = getAsset('batter_ready.jpg');
    bSwing.src = getAsset('batter_swing.jpg');
    pitcher.src = getAsset('pitcher_throw.jpg');
    badge.src = getAsset('homerun_badge.jpg');

    let loadedCount = 0;
    const totalToLoad = 5;

    const onAssetLoaded = () => {
      loadedCount++;
      if (loadedCount === totalToLoad && isMounted) {
        bgImgRef.current = bg;
        batterReadySpriteRef.current = createTransparentSprite(bReady, 235);
        batterSwingSpriteRef.current = createTransparentSprite(bSwing, 235);
        pitcherSpriteRef.current = createTransparentSprite(pitcher, 235);
        homerunBadgeImgRef.current = badge;
        assetsLoadedRef.current = true;
      }
    };

    bg.onload = onAssetLoaded;
    bReady.onload = onAssetLoaded;
    bSwing.onload = onAssetLoaded;
    pitcher.onload = onAssetLoaded;
    badge.onload = onAssetLoaded;

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (nextPitchTimeoutRef.current) clearTimeout(nextPitchTimeoutRef.current);
      if (swingDisplayTimerRef.current) clearTimeout(swingDisplayTimerRef.current);
    };
  }, []);

  // Audio Toggle
  const toggleSound = () => {
    const nextMuted = soundFx.toggleMute();
    setIsMuted(nextMuted);
  };

  // 2. Start a New Pitch (Always reads from live refs)
  const startNextPitch = useCallback(() => {
    if (nextPitchTimeoutRef.current) clearTimeout(nextPitchTimeoutRef.current);

    if (outsRef.current >= 3) {
      gameStateRef.current = 'GAME_OVER';
      syncUiState();
      return;
    }

    const currentScore = scoreRef.current;
    const currentCombo = comboRef.current;
    const pitch = selectNextPitch(currentScore, currentCombo);

    currentPitchRef.current = pitch;
    pitchDurationRef.current = pitch.baseSpeed;
    pitchStartTimeRef.current = performance.now();
    isSwungRef.current = false;
    batterStateRef.current = 'READY';

    gameStateRef.current = 'PITCHING';
    setPitchToast(pitch);
    syncUiState();

    soundFx.playBaseballPitch();
  }, [syncUiState]);

  // 3. Game Reset & Restart
  const handleRestartGame = () => {
    if (nextPitchTimeoutRef.current) clearTimeout(nextPitchTimeoutRef.current);
    if (swingDisplayTimerRef.current) clearTimeout(swingDisplayTimerRef.current);

    particleSystemRef.current.clear();
    scoreRef.current = 0;
    runsRef.current = 0;
    hitsRef.current = 0;
    homerunsRef.current = 0;
    longestDistanceRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    strikesRef.current = 0;
    outsRef.current = 0;
    runnersRef.current = [false, false, false];
    gameStateRef.current = 'IDLE';

    setHitFeedback(null);
    setShowHomerunBadge(false);
    setIsSubmitted(false);
    setPlayerName('');
    syncUiState();

    // Auto launch first pitch
    setTimeout(() => {
      startNextPitch();
    }, 400);
  };

  // 4. Bat Swing Execution (Always checks live gameStateRef)
  const handleSwing = useCallback(() => {
    if (gameStateRef.current === 'GAME_OVER') return;

    if (gameStateRef.current === 'IDLE') {
      startNextPitch();
      return;
    }

    if (gameStateRef.current !== 'PITCHING' || isSwungRef.current) return;

    const now = performance.now();
    const elapsed = now - pitchStartTimeRef.current;
    const duration = pitchDurationRef.current;
    const targetArrival = duration;

    // Early swing safety buffer (ignore accidental clicks within 300ms of pitch release)
    if (elapsed < 300) {
      batterStateRef.current = 'SWING';
      if (swingDisplayTimerRef.current) clearTimeout(swingDisplayTimerRef.current);
      swingDisplayTimerRef.current = setTimeout(() => {
        batterStateRef.current = 'READY';
      }, 250);
      return;
    }

    isSwungRef.current = true;
    batterStateRef.current = 'SWING';

    const pitch = currentPitchRef.current || PITCH_TYPES.FASTBALL;
    const result = judgeSwing(elapsed, targetArrival, pitch, runnersRef.current);

    // Revert batter swing sprite back to ready after 350ms
    if (swingDisplayTimerRef.current) clearTimeout(swingDisplayTimerRef.current);
    swingDisplayTimerRef.current = setTimeout(() => {
      batterStateRef.current = 'READY';
    }, 350);

    // Handle Strike / Miss
    if (result.bases === 0 && result.label.includes('STRIKE')) {
      soundFx.playBaseballSwingMiss();
      setHitFeedback({
        label: 'STRIKE! ❌',
        desc: result.timingFeedback,
        color: '#EF4444'
      });

      const nextStrikes = strikesRef.current + 1;
      if (nextStrikes >= 3) {
        const nextOuts = outsRef.current + 1;
        strikesRef.current = 0;
        outsRef.current = nextOuts;
        comboRef.current = 0;

        if (nextOuts >= 3) {
          gameStateRef.current = 'GAME_OVER';
          soundFx.playPacmanGameOver();
          syncUiState();
          return;
        } else {
          setHitFeedback({
            label: 'OUT! 🚫',
            desc: `삼진 아웃! (아웃 ${nextOuts}/3)`,
            color: '#DC2626'
          });
        }
      } else {
        strikesRef.current = nextStrikes;
      }

      gameStateRef.current = 'MISS_ANIMATION';
      syncUiState();

      nextPitchTimeoutRef.current = setTimeout(() => {
        setHitFeedback(null);
        startNextPitch();
      }, 1200);
      return;
    }

    // Handle Foul
    if (result.bases === 0 && result.label.includes('FOUL')) {
      soundFx.playBaseballHit();
      setHitFeedback({
        label: 'FOUL ⚠️',
        desc: result.timingFeedback,
        color: '#F97316'
      });

      if (strikesRef.current < 2) {
        strikesRef.current += 1;
      }
      comboRef.current = 0;

      gameStateRef.current = 'MISS_ANIMATION';
      syncUiState();

      nextPitchTimeoutRef.current = setTimeout(() => {
        setHitFeedback(null);
        startNextPitch();
      }, 1200);
      return;
    }

    // Handle Successful Hit (Single, Double, Triple, Homerun, Grand Slam)
    const isHomerun = result.bases >= 4;
    if (isHomerun) {
      soundFx.playBaseballHomerun();
      soundFx.playPacmanEatFruit();
      particleSystemRef.current.addHomerunFireworks();
      setShowHomerunBadge(true);
      setTimeout(() => setShowHomerunBadge(false), 2200);
    } else {
      soundFx.playBaseballHit();
      particleSystemRef.current.addHitSparks(HOME_PLATE_POS.x, HOME_PLATE_POS.y - 15, 25, result.color);
    }

    // Advance Runners
    const advanceResult = advanceRunners(runnersRef.current, result.bases);
    runnersRef.current = advanceResult.newRunners;

    // Calculate Scores & Bonuses
    const nextCombo = comboRef.current + 1;
    comboRef.current = nextCombo;
    maxComboRef.current = Math.max(maxComboRef.current, nextCombo);
    hitsRef.current += 1;
    if (isHomerun) homerunsRef.current += 1;
    if (result.distance > longestDistanceRef.current) longestDistanceRef.current = result.distance;

    const comboBonus = nextCombo * 20;
    const distanceBonus = result.distance > 100 ? Math.floor((result.distance - 100) * 1.5) : 0;
    const runsScore = advanceResult.runsScored * 100;
    const totalGained = result.baseScore + runsScore + comboBonus + distanceBonus;

    scoreRef.current += totalGained;
    runsRef.current += advanceResult.runsScored;
    strikesRef.current = 0;

    gameStateRef.current = 'HIT_ANIMATION';
    syncUiState();

    setHitFeedback({
      label: result.label,
      desc: result.timingFeedback,
      distance: result.distance,
      color: result.color,
      points: totalGained
    });

    nextPitchTimeoutRef.current = setTimeout(() => {
      setHitFeedback(null);
      startNextPitch();
    }, isHomerun ? 2000 : 1300);
  }, [startNextPitch, syncUiState]);

  // Keyboard Event Listener (Spacebar & Enter)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        handleSwing();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSwing]);

  // 5. Uninterrupted Main 3D Perspective Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      try {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // =========================================================================
        // A. Draw 3D Perspective Stadium Background & Field
        // =========================================================================
        if (bgImgRef.current) {
          ctx.drawImage(bgImgRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        } else {
          // Fallback Sky & Bleachers
          ctx.fillStyle = '#38BDF8';
          ctx.fillRect(0, 0, CANVAS_WIDTH, 140);
          ctx.fillStyle = '#22C55E';
          ctx.fillRect(0, 140, CANVAS_WIDTH, CANVAS_HEIGHT - 140);

          // Infield Dirt Area
          ctx.save();
          ctx.fillStyle = '#E2B184';
          ctx.beginPath();
          ctx.moveTo(PITCHER_POS.x, PITCHER_POS.y - 10);
          ctx.lineTo(820, CANVAS_HEIGHT);
          ctx.lineTo(140, CANVAS_HEIGHT);
          ctx.closePath();
          ctx.fill();

          // 3D Foul Lines
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(HOME_PLATE_POS.x, HOME_PLATE_POS.y);
          ctx.lineTo(80, 240);
          ctx.moveTo(HOME_PLATE_POS.x, HOME_PLATE_POS.y);
          ctx.lineTo(880, 240);
          ctx.stroke();
          ctx.restore();
        }

        // Home Plate Sweet Spot Target Indicator
        ctx.save();
        ctx.fillStyle = '#3B82F6';
        ctx.beginPath();
        ctx.arc(HOME_PLATE_POS.x, HOME_PLATE_POS.y + 2, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚾', HOME_PLATE_POS.x, HOME_PLATE_POS.y + 3);
        ctx.restore();

        // =========================================================================
        // B. Draw Distant Pitcher (Proportioned Cute Size)
        // =========================================================================
        if (pitcherSpriteRef.current) {
          const pW = 85;
          const pH = 85;
          const pX = PITCHER_POS.x - pW / 2;
          const pY = PITCHER_POS.y - pH + 12;

          ctx.save();
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.beginPath();
          ctx.ellipse(PITCHER_POS.x, PITCHER_POS.y + 12, 16, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          ctx.drawImage(pitcherSpriteRef.current, pX, pY, pW, pH);
        }

        // =========================================================================
        // C. Draw 3D Ball & Dynamic Shadow in Flight
        // =========================================================================
        if (gameStateRef.current === 'PITCHING' && currentPitchRef.current) {
          const now = performance.now();
          const elapsed = now - pitchStartTimeRef.current;
          const duration = Math.max(500, pitchDurationRef.current || 2000);

          // Auto Miss if ball travels past plate
          if (elapsed > duration + 200 && !isSwungRef.current) {
            isSwungRef.current = true;
            soundFx.playBaseballSwingMiss();
            setHitFeedback({
              label: 'STRIKE! ❌',
              desc: '루킹 스트라이크! 공을 지켜보았습니다.',
              color: '#EF4444'
            });

            const nextStrikes = strikesRef.current + 1;
            if (nextStrikes >= 3) {
              const nextOuts = outsRef.current + 1;
              strikesRef.current = 0;
              outsRef.current = nextOuts;
              comboRef.current = 0;

              if (nextOuts >= 3) {
                gameStateRef.current = 'GAME_OVER';
                soundFx.playPacmanGameOver();
                syncUiState();
              }
            } else {
              strikesRef.current = nextStrikes;
            }

            if (gameStateRef.current !== 'GAME_OVER') {
              gameStateRef.current = 'MISS_ANIMATION';
              syncUiState();
              nextPitchTimeoutRef.current = setTimeout(() => {
                setHitFeedback(null);
                startNextPitch();
              }, 1200);
            }
          } else {
            const ball = calculateBallState(currentPitchRef.current, elapsed, duration);

            if (currentPitchRef.current.hasFlameEffect) {
              particleSystemRef.current.addFireballTrail(ball.x, ball.y);
            }

            // 1. Sweet Spot Converging Timing Ring
            if (ball.timingRingRadius > 2 && ball.opacity > 0.2) {
              ctx.save();
              ctx.strokeStyle = ball.isAtSweetSpot ? '#FBBF24' : 'rgba(251, 191, 36, 0.6)';
              ctx.lineWidth = ball.isAtSweetSpot ? 3.5 : 2;
              ctx.beginPath();
              ctx.arc(HOME_PLATE_POS.x, HOME_PLATE_POS.y + 2, Math.max(1, 18 + ball.timingRingRadius), 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            }

            // 2. Draw 3D Ground Shadow on Field
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, 0.4 * ball.opacity));
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.ellipse(ball.shadowX, ball.shadowY, Math.max(1, ball.shadowRadiusX), Math.max(1, ball.shadowRadiusY), 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // 3. Draw 3D Ball with Glowing Atmosphere
            ctx.save();
            ctx.globalAlpha = Math.max(0.1, Math.min(1, ball.opacity));

            if (currentPitchRef.current.id !== 'FASTBALL') {
              ctx.shadowColor = currentPitchRef.current.color;
              ctx.shadowBlur = 12;
            }

            ctx.fillStyle = currentPitchRef.current.color || '#FFFFFF';
            ctx.strokeStyle = '#1E293B';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, Math.max(4, ball.radius), 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#EF4444';
            ctx.lineWidth = Math.max(1, ball.radius * 0.1);
            ctx.beginPath();
            ctx.arc(ball.x - ball.radius * 0.35, ball.y, Math.max(1, ball.radius * 0.75), -0.6, 0.6);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(ball.x + ball.radius * 0.35, ball.y, Math.max(1, ball.radius * 0.75), Math.PI - 0.6, Math.PI + 0.6);
            ctx.stroke();
            ctx.restore();
          }
        }

        // =========================================================================
        // D. Draw Batter in Left Batter's Box
        // =========================================================================
        const activeBatterSprite = batterStateRef.current === 'SWING'
          ? batterSwingSpriteRef.current
          : batterReadySpriteRef.current;

        if (activeBatterSprite) {
          const bW = 185;
          const bH = 185;
          const bX = BATTER_POS.x - bW / 2;
          const bY = BATTER_POS.y - bH / 2;

          ctx.save();
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.beginPath();
          ctx.ellipse(BATTER_POS.x, BATTER_POS.y + bH * 0.38, bW * 0.32, 14, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          ctx.drawImage(activeBatterSprite, bX, bY, bW, bH);

          if (batterStateRef.current === 'SWING') {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(BATTER_POS.x + 30, BATTER_POS.y - 10, 110, -0.3, 0.8);
            ctx.stroke();
            ctx.restore();
          }
        }

        // =========================================================================
        // E. Update & Draw Particles
        // =========================================================================
        particleSystemRef.current.update();
        particleSystemRef.current.render(ctx);
      } catch (err) {
        console.error('Canvas render loop caught exception:', err);
      } finally {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [syncUiState, startNextPitch]);

  // 6. Submit High Score to Cloud DB (Strict Rule: score > 100 & placeholder "예: 홍길동")
  const handleSubmitScore = async (e) => {
    e.preventDefault();
    if (scoreRef.current <= 100 || isSubmitting || isSubmitted) return;

    const trimmedName = playerName.trim() || '도촌 타자왕';
    setIsSubmitting(true);

    try {
      await submitScoreToDB('baseball', trimmedName, scoreRef.current);
      setIsSubmitted(true);
      if (onScoreSubmitted) {
        onScoreSubmitted();
      }
    } catch (err) {
      console.error('Failed to submit baseball score:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="baseball-game-container">
      {/* 1. Top Stadium Scoreboard HUD */}
      <div className="baseball-scoreboard-hud">
        {/* Left: Score & Combo */}
        <div className="scoreboard-left">
          <div className="scoreboard-score-card">
            <span className="scoreboard-label">SCORE</span>
            <span className="scoreboard-value-score">{score.toLocaleString()}</span>
          </div>
          {combo > 1 && (
            <div className="scoreboard-combo-pill">
              <Flame style={{ width: '13px', height: '13px' }} />
              <span>{combo} COMBO!</span>
            </div>
          )}
        </div>

        {/* Center: Diamond Bases & Count Meters */}
        <div className="scoreboard-center">
          <div className="mini-diamond-box" title="주자 다이아몬드 (1루, 2루, 3루)">
            <div className="mini-diamond-outline" />
            <div className={`base-dot b-second ${runners[1] ? 'active' : ''}`} />
            <div className={`base-dot b-third ${runners[2] ? 'active' : ''}`} />
            <div className={`base-dot b-first ${runners[0] ? 'active' : ''}`} />
            <div className="base-dot b-home" />
          </div>

          <div className="count-meters-box">
            <div className="count-row">
              <span className="count-name">S</span>
              <div className="count-dots">
                <div className={`count-lamp strike ${strikes >= 1 ? 'on' : ''}`} />
                <div className={`count-lamp strike ${strikes >= 2 ? 'on' : ''}`} />
              </div>
            </div>
            <div className="count-row">
              <span className="count-name">O</span>
              <div className="count-dots">
                <div className={`count-lamp out ${outs >= 1 ? 'on' : ''}`} />
                <div className={`count-lamp out ${outs >= 2 ? 'on' : ''}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Stats & Game Controls */}
        <div className="scoreboard-right">
          <div className="hud-stat-pill" title="홈런 개수">
            <span className="scoreboard-label">HOMERUN</span>
            <span className="hud-stat-num">{homeruns}</span>
          </div>
          <div className="hud-stat-pill" title="홈인 득점 (Runs)">
            <span className="scoreboard-label">RUNS</span>
            <span className="hud-stat-num">{runs}</span>
          </div>

          <button
            className="hud-ctrl-btn"
            onClick={toggleSound}
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? (
              <VolumeX style={{ width: '16px', height: '16px', color: '#F87171' }} />
            ) : (
              <Volume2 style={{ width: '16px', height: '16px', color: '#34D399' }} />
            )}
          </button>

          <button
            className="hud-ctrl-btn"
            onClick={() => setIsHowToPlayOpen(true)}
            title="게임 방법 & 룰북"
          >
            <HelpCircle style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      </div>

      {/* 2. Main Stadium Canvas Viewport */}
      <div className="baseball-canvas-wrapper" onClick={handleSwing}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="baseball-main-canvas"
        />

        {/* Pitch Name Alert Toast */}
        {gameState === 'PITCHING' && pitchToast && (
          <div className="pitch-name-toast">
            <Zap style={{ width: '14px', height: '14px', color: pitchToast.color }} />
            <span>{pitchToast.name}</span>
          </div>
        )}

        {/* Hit Result Feedback Popup */}
        {hitFeedback && (
          <div className="hit-feedback-popup">
            <h1 className="hit-feedback-title" style={{ color: hitFeedback.color }}>
              {hitFeedback.label}
            </h1>
            <div className="hit-feedback-desc">{hitFeedback.desc}</div>
            {hitFeedback.distance && (
              <div className="hit-feedback-distance">
                비거리 {hitFeedback.distance}m (+{hitFeedback.points}점)
              </div>
            )}
          </div>
        )}

        {/* Homerun Badge Overlay */}
        {showHomerunBadge && (
          <div className="homerun-badge-overlay">
            <img
              src={getAsset('homerun_badge.jpg')}
              alt="Homerun Badge"
              className="homerun-badge-img"
            />
          </div>
        )}

        {/* Game Over Modal Screen */}
        {gameState === 'GAME_OVER' && (
          <div className="baseball-gameover-overlay" onClick={(e) => e.stopPropagation()}>
            <div className="baseball-gameover-card">
              <div className="gameover-badge">3 OUTS · GAME OVER</div>
              <h2 className="gameover-title">⚾ 경기 종료!</h2>

              <div className="gameover-score-wrap">
                <span className="gameover-score-label">최종 획득 점수</span>
                <div className="gameover-score-val">{score.toLocaleString()}점</div>
              </div>

              {/* Game Stats Matrix */}
              <div className="gameover-stats-grid">
                <div className="stat-box">
                  <span className="stat-box-lbl">홈런</span>
                  <span className="stat-box-val">{homeruns}개</span>
                </div>
                <div className="stat-box">
                  <span className="stat-box-lbl">총 안타</span>
                  <span className="stat-box-val">{hits}개</span>
                </div>
                <div className="stat-box">
                  <span className="stat-box-lbl">최장 비거리</span>
                  <span className="stat-box-val">{longestDistance}m</span>
                </div>
              </div>

              {/* Strict Rule: Score Registration Form only if score > 100, with placeholder "예: 홍길동" */}
              {score > 100 ? (
                <div className="leaderboard-register-box">
                  <div className="leaderboard-box-title">
                    <Trophy style={{ width: '15px', height: '15px' }} />
                    <span>도촌초 명예의 전당 점수 등록</span>
                  </div>

                  {isSubmitted ? (
                    <div style={{ color: '#34D399', fontSize: '13px', fontWeight: 800, padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                      <span>명예의 전당 등록이 완료되었습니다!</span>
                    </div>
                  ) : (
                    <form className="leaderboard-form" onSubmit={handleSubmitScore}>
                      <input
                        type="text"
                        className="leaderboard-input"
                        placeholder="예: 홍길동"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        maxLength={12}
                        required
                        disabled={isSubmitting}
                      />
                      <button
                        type="submit"
                        className="leaderboard-submit-btn"
                        disabled={isSubmitting || !playerName.trim()}
                      >
                        {isSubmitting ? '등록 중...' : '등록'}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div className="low-score-notice">
                  💡 100점을 초과하여 득점하면 도촌초 명예의 전당에 이름을 남길 수 있습니다!
                </div>
              )}

              {/* Action Buttons */}
              <div className="gameover-btn-row">
                <button className="retry-action-btn" onClick={handleRestartGame}>
                  <RotateCcw style={{ width: '16px', height: '16px' }} />
                  <span>다시 도전하기</span>
                </button>
                {onScoreSubmitted && (
                  <button className="hall-action-btn" onClick={onScoreSubmitted}>
                    <Trophy style={{ width: '16px', height: '16px', color: '#FBBF24' }} />
                    <span>명예의 전당</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Action Bar (Mobile Touch Assist & Desktop Hint) */}
      <div className="baseball-bottom-controls">
        <button
          className="mobile-swing-btn"
          onClick={handleSwing}
          title="배트 휘두르기 (스페이스바 또는 화면 터치)"
        >
          <Zap style={{ width: '20px', height: '20px', color: '#FBBF24' }} />
          <span>{gameState === 'IDLE' ? '⚾ 게임 시작 (타석 입장)' : '⚡ 배트 휘두르기 (SWING)'}</span>
        </button>
        <div className="desktop-key-hint">
          <span>PC 조작:</span>
          <kbd>Spacebar</kbd>
          <span>또는</span>
          <kbd>Enter</kbd>
          <span>/ 마우스 클릭</span>
        </div>
      </div>

      {/* 4. How To Play Modal */}
      <BaseballHowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
}
