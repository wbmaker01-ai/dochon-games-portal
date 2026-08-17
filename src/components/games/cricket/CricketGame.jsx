import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BOWLER_POS,
  BATTER_POS,
  WICKET_POS,
  HIT_ZONE_POS,
  PITCH_BOUNCE_Y,
  PITCH_TYPES,
  HIT_RESULTS,
  SPEED_LEVELS
} from './cricketConstants';
import {
  createTransparentSprite,
  calculatePitchSpeed,
  selectNextPitch,
  calculateBallState,
  judgeSwing,
  ParticleSystem,
  WicketEntity
} from './cricketLogic';
import { cricketAudio } from './cricketAudio';
import CricketHowToPlayModal from './CricketHowToPlayModal';
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
import './cricket.css';

// Base Asset Path Helper
const getAsset = (file) => `${import.meta.env.BASE_URL}assets/cricket/${file}`;

export default function CricketGame({ onScoreSubmitted }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const particleSystemRef = useRef(new ParticleSystem());
  const wicketEntityRef = useRef(new WicketEntity(WICKET_POS.x, WICKET_POS.y));

  // Asset Refs
  const assetsLoadedRef = useRef(false);
  const bgImgRef = useRef(null);
  const batterReadySpriteRef = useRef(null);
  const batterSwingSpriteRef = useRef(null);
  const bowlerSpriteRef = useRef(null);
  const sixBadgeImgRef = useRef(null);

  // =========================================================================
  // Pure 60FPS Timestamp-Driven Game State Machine (Zero setTimeout Dependency)
  // =========================================================================
  const gameStateRef = useRef('IDLE'); // 'IDLE' | 'BOWLER_WINDUP' | 'PITCHING' | 'HIT_ANIMATION' | 'WICKET_OUT_ANIMATION' | 'GAME_OVER'
  const stateStartTimeRef = useRef(performance.now());
  const idleDurationRef = useRef(800); // ms to wait before windup
  const hitDurationRef = useRef(1800); // ms to show hit flight & celebration

  const scoreRef = useRef(0);
  const highScoreRef = useRef(0);
  const currentPitchConfigRef = useRef(PITCH_TYPES.FASTBALL);
  const currentSpeedLevelRef = useRef(SPEED_LEVELS[0]);

  // Pitch & Delivery Timeline Refs
  const pitchStartTimeRef = useRef(0);
  const pitchTotalDurationRef = useRef(1700);
  const expectedContactTimeRef = useRef(0);
  const hasSwungRef = useRef(false);
  const swingStartTimeRef = useRef(0);
  const lastBounceTriggeredRef = useRef(false);

  // Hit & Flight Animation Refs
  const hitResultRef = useRef(null);
  const hitBallTrajectoryRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, scale: 1 });

  // React State for UI HUD
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speedTier, setSpeedTier] = useState(SPEED_LEVELS[0]);
  const [currentPitchInfo, setCurrentPitchInfo] = useState(PITCH_TYPES.FASTBALL);
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [activeHitAnnouncement, setActiveHitAnnouncement] = useState(null);

  // Modals & Controls State
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Load High Score from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dochon_cricket_high_score');
      if (saved) {
        const val = parseInt(saved, 10) || 0;
        highScoreRef.current = val;
        setHighScore(val);
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, []);

  // Update Mute in Audio Engine
  useEffect(() => {
    cricketAudio.setMuted(isMuted);
  }, [isMuted]);

  // =========================================================================
  // Load & Process Images (Runs once on mount)
  // =========================================================================
  useEffect(() => {
    let isMounted = true;

    const loadImages = async () => {
      const bgImg = new Image();
      bgImg.src = getAsset('bg_stadium.jpg');

      const bReadyRaw = new Image();
      bReadyRaw.src = getAsset('batter_ready.jpg');

      const bSwingRaw = new Image();
      bSwingRaw.src = getAsset('batter_swing.jpg');

      const bowlerRaw = new Image();
      bowlerRaw.src = getAsset('bowler_throw.jpg');

      const sixBadgeRaw = new Image();
      sixBadgeRaw.src = getAsset('six_badge.jpg');

      const waitImg = (img) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) resolve(img);
          else {
            img.onload = () => resolve(img);
            img.onerror = () => resolve(img);
          }
        });

      await Promise.all([
        waitImg(bgImg),
        waitImg(bReadyRaw),
        waitImg(bSwingRaw),
        waitImg(bowlerRaw),
        waitImg(sixBadgeRaw)
      ]);

      if (!isMounted) return;

      bgImgRef.current = bgImg;
      batterReadySpriteRef.current = createTransparentSprite(bReadyRaw, 225);
      batterSwingSpriteRef.current = createTransparentSprite(bSwingRaw, 225);
      bowlerSpriteRef.current = createTransparentSprite(bowlerRaw, 225);
      sixBadgeImgRef.current = createTransparentSprite(sixBadgeRaw, 225);
      assetsLoadedRef.current = true;

      // Start initial delivery in render loop
      stateStartTimeRef.current = performance.now();
      idleDurationRef.current = 600;
      gameStateRef.current = 'IDLE';
    };

    loadImages();

    return () => {
      isMounted = false;
    };
  }, []);

  // =========================================================================
  // Game Restart (100% Synchronous, Zero Lingering Timers)
  // =========================================================================
  const restartGame = useCallback(() => {
    scoreRef.current = 0;
    setScore(0);
    setIsGameOver(false);
    setFinalScore(0);
    setActiveHitAnnouncement(null);
    setPlayerName('');
    setSubmittedSuccess(false);
    wicketEntityRef.current.reset();
    particleSystemRef.current.clear();

    stateStartTimeRef.current = performance.now();
    idleDurationRef.current = 400;
    gameStateRef.current = 'IDLE';
  }, []);

  // =========================================================================
  // Swing Bat Action
  // =========================================================================
  const handleSwing = useCallback(() => {
    // If Game Over, space/click restarts cleanly
    if (gameStateRef.current === 'GAME_OVER') {
      restartGame();
      return;
    }

    const now = performance.now();
    swingStartTimeRef.current = now;

    if (gameStateRef.current !== 'PITCHING' || hasSwungRef.current) {
      // Swung during windup or idle -> early swing miss
      hasSwungRef.current = true;
      cricketAudio.playWhoosh();
      return;
    }

    hasSwungRef.current = true;
    const diff = now - expectedContactTimeRef.current;
    const judgment = judgeSwing(diff);

    if (judgment.result) {
      // HIT SUCCESS! (SIX, FOUR, 2 RUNS, 1 RUN)
      hitResultRef.current = judgment.result;
      hitDurationRef.current = judgment.result.animationDuration;
      stateStartTimeRef.current = now;
      gameStateRef.current = 'HIT_ANIMATION';

      // Update Score
      const newScore = scoreRef.current + judgment.result.points;
      scoreRef.current = newScore;
      setScore(newScore);

      if (newScore > highScoreRef.current) {
        highScoreRef.current = newScore;
        setHighScore(newScore);
        try {
          localStorage.setItem('dochon_cricket_high_score', String(newScore));
        } catch (e) {}
      }

      // Audio & Particle Effects
      if (judgment.result.id === 'SIX') {
        cricketAudio.playBatHit(true);
        cricketAudio.playSixCelebration();
        particleSystemRef.current.addConfetti(
          HIT_ZONE_POS.x,
          HIT_ZONE_POS.y - 40,
          80
        );
        particleSystemRef.current.addHitSparks(
          HIT_ZONE_POS.x,
          HIT_ZONE_POS.y - 20,
          40,
          '#F59E0B'
        );
      } else if (judgment.result.id === 'FOUR') {
        cricketAudio.playBatHit(true);
        cricketAudio.playFourBoundary();
        particleSystemRef.current.addHitSparks(
          HIT_ZONE_POS.x,
          HIT_ZONE_POS.y - 20,
          30,
          '#10B981'
        );
      } else {
        cricketAudio.playBatHit(false);
        cricketAudio.playFootstep();
        particleSystemRef.current.addHitSparks(
          HIT_ZONE_POS.x,
          HIT_ZONE_POS.y - 10,
          15,
          '#3B82F6'
        );
      }

      // Show Announcement Popup
      setActiveHitAnnouncement(judgment.result);

      // Initialize Hit Ball Trajectory
      const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 0.6;
      let power = 15;
      if (judgment.result.id === 'SIX') power = 26;
      else if (judgment.result.id === 'FOUR') power = 20;
      else if (judgment.result.id === 'TWO_RUNS') power = 12;
      else power = 8;

      hitBallTrajectoryRef.current = {
        x: HIT_ZONE_POS.x,
        y: HIT_ZONE_POS.y - 10,
        vx: Math.sin(angle) * power,
        vy: -Math.cos(angle) * power,
        scale: 1.0
      };
    } else {
      // Swung too early or late -> Whiff whoosh
      cricketAudio.playWhoosh();
    }
  }, [restartGame]);

  // =========================================================================
  // Leaderboard Score Submission Handler
  // =========================================================================
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting || finalScore <= 100) return;

    setIsSubmitting(true);
    try {
      const res = await submitScoreToDB('cricket', playerName.trim(), finalScore);
      if (res === true || res?.success || res) {
        setSubmittedSuccess(true);
        if (onScoreSubmitted) {
          onScoreSubmitted();
        }
      } else {
        alert('점수 등록에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (err) {
      console.error('Score submit error:', err);
      alert('오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // Keyboard Listeners
  // =========================================================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleSwing();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSwing]);

  // =========================================================================
  // 60FPS Pure Timestamp-Driven Main Canvas Render & Physics Loop
  // =========================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      const now = performance.now();
      const stateElapsed = now - stateStartTimeRef.current;

      // =====================================================================
      // State Machine Frame Transitions (Frame-Perfect, 100% Stutter/Freeze Free)
      // =====================================================================
      if (assetsLoadedRef.current) {
        // 1. IDLE State -> Advance to BOWLER_WINDUP
        if (gameStateRef.current === 'IDLE') {
          if (stateElapsed >= idleDurationRef.current) {
            // Select next pitch & speed
            const pitch = selectNextPitch(scoreRef.current);
            currentPitchConfigRef.current = pitch;
            setCurrentPitchInfo(pitch);

            const { actualDuration, speedLevel } = calculatePitchSpeed(
              scoreRef.current,
              pitch
            );
            pitchTotalDurationRef.current = Math.max(720, actualDuration);
            currentSpeedLevelRef.current = speedLevel;
            setSpeedTier(speedLevel);

            // Transition to BOWLER_WINDUP
            stateStartTimeRef.current = now;
            gameStateRef.current = 'BOWLER_WINDUP';
            cricketAudio.playWhoosh();
          }
        }

        // 2. BOWLER_WINDUP State -> Advance to PITCHING
        else if (gameStateRef.current === 'BOWLER_WINDUP') {
          if (stateElapsed >= 400) {
            pitchStartTimeRef.current = now;
            expectedContactTimeRef.current = now + pitchTotalDurationRef.current;
            hasSwungRef.current = false;
            lastBounceTriggeredRef.current = false;

            stateStartTimeRef.current = now;
            gameStateRef.current = 'PITCHING';
          }
        }

        // 3. PITCHING State -> Missed/Overflown -> Advance to WICKET_OUT_ANIMATION
        else if (gameStateRef.current === 'PITCHING') {
          const pitchElapsed = now - pitchStartTimeRef.current;
          const progress = pitchElapsed / pitchTotalDurationRef.current;

          if (progress >= 1.02) {
            // Missed! Ball hits wicket -> Bowled Out!
            wicketEntityRef.current.shatter();
            particleSystemRef.current.addWicketSplinters(
              WICKET_POS.x,
              WICKET_POS.y - 15
            );
            cricketAudio.playWicketCrash();
            setActiveHitAnnouncement(HIT_RESULTS.WICKET_OUT);

            stateStartTimeRef.current = now;
            gameStateRef.current = 'WICKET_OUT_ANIMATION';
          }
        }

        // 4. HIT_ANIMATION State -> Advance back to IDLE for Next Pitch
        else if (gameStateRef.current === 'HIT_ANIMATION') {
          // Hide announcement badge near end of animation
          if (stateElapsed >= hitDurationRef.current - 300) {
            setActiveHitAnnouncement(null);
          }

          if (stateElapsed >= hitDurationRef.current) {
            setActiveHitAnnouncement(null);
            idleDurationRef.current = 500;
            stateStartTimeRef.current = now;
            gameStateRef.current = 'IDLE';
          }
        }

        // 5. WICKET_OUT_ANIMATION State -> Advance to GAME_OVER Modal
        else if (gameStateRef.current === 'WICKET_OUT_ANIMATION') {
          if (stateElapsed >= 1600) {
            cricketAudio.playGameOver();
            setFinalScore(scoreRef.current);
            setIsGameOver(true);
            setActiveHitAnnouncement(null);

            stateStartTimeRef.current = now;
            gameStateRef.current = 'GAME_OVER';
          }
        }
      }

      // =====================================================================
      // Canvas Drawing & Visual Rendering
      // =====================================================================

      // 1. Background Stadium
      if (bgImgRef.current && bgImgRef.current.complete) {
        ctx.drawImage(bgImgRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else {
        ctx.fillStyle = '#22C55E';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      // 2. Pitch Strip Shadows & Crease Lines
      ctx.save();
      // Bowler Crease
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(BOWLER_POS.x - 70, BOWLER_POS.y + 15);
      ctx.lineTo(BOWLER_POS.x + 70, BOWLER_POS.y + 15);
      ctx.stroke();

      // Popping Crease (Batter line)
      ctx.beginPath();
      ctx.moveTo(WICKET_POS.x - 110, WICKET_POS.y - 25);
      ctx.lineTo(WICKET_POS.x + 110, WICKET_POS.y - 25);
      ctx.stroke();
      ctx.restore();

      // 3. Draw Bowler Stumps
      ctx.fillStyle = '#D97706';
      ctx.fillRect(BOWLER_POS.x - 6, BOWLER_POS.y - 12, 12, 16);

      // 4. Draw Bowler (Snail)
      if (bowlerSpriteRef.current) {
        const bob = Math.sin(now * 0.005) * 2;
        const windupOffset =
          gameStateRef.current === 'BOWLER_WINDUP' ? -8 : 0;
        ctx.drawImage(
          bowlerSpriteRef.current,
          BOWLER_POS.x - 45,
          BOWLER_POS.y - 50 + bob + windupOffset,
          90,
          90
        );
      }

      // 5. Draw Wickets behind Batter
      wicketEntityRef.current.update();
      wicketEntityRef.current.draw(ctx);

      // 6. Draw Batter (Cricket)
      const isSwinging =
        now - swingStartTimeRef.current < 260 && swingStartTimeRef.current > 0;
      const batterSprite =
        isSwinging && batterSwingSpriteRef.current
          ? batterSwingSpriteRef.current
          : batterReadySpriteRef.current;

      if (batterSprite) {
        const idleBob = Math.sin(now * 0.006) * 3;
        ctx.drawImage(
          batterSprite,
          BATTER_POS.x - 75,
          BATTER_POS.y - 120 + idleBob,
          150,
          150
        );
      }

      // 7. Ball Physics & Rendering in 'PITCHING' state
      if (gameStateRef.current === 'PITCHING') {
        const pitchElapsed = now - pitchStartTimeRef.current;
        const progress = pitchElapsed / pitchTotalDurationRef.current;

        const ball = calculateBallState(progress, currentPitchConfigRef.current);

        // Check Turf Bounce Moment for Dust & Sound
        if (ball.isPostBounce && !lastBounceTriggeredRef.current) {
          lastBounceTriggeredRef.current = true;
          cricketAudio.playPitchBounce();
          particleSystemRef.current.addBounceDust(ball.x, PITCH_BOUNCE_Y, 10);
        }

        // Draw Ball Shadow
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(
          ball.shadowX,
          ball.shadowY,
          ball.radius * 1.2,
          ball.radius * 0.5,
          0,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(0, 0, 0, ${ball.shadowAlpha * 0.4})`;
        ctx.fill();
        ctx.restore();

        // Draw Flying Ball
        ctx.save();
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(
          ball.x - ball.radius * 0.3,
          ball.y - ball.radius * 0.3,
          ball.radius * 0.1,
          ball.x,
          ball.y,
          ball.radius
        );
        grad.addColorStop(0, '#F87171');
        grad.addColorStop(0.7, '#DC2626');
        grad.addColorStop(1, '#991B1B');
        ctx.fillStyle = grad;
        ctx.fill();

        // White seam stitches
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = Math.max(1, 2 * ball.scale);
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius * 0.8, -0.6, 0.6);
        ctx.stroke();

        // Special Fire Effect for Fireball Yorker
        if (currentPitchConfigRef.current.isFire) {
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
          ctx.lineWidth = 4 * ball.scale;
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.radius + 3, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 8. Hit Ball Flight Animation in 'HIT_ANIMATION' state
      if (gameStateRef.current === 'HIT_ANIMATION') {
        const hitBall = hitBallTrajectoryRef.current;
        hitBall.x += hitBall.vx;
        hitBall.y += hitBall.vy;
        hitBall.vy += 0.45; // Gravity
        hitBall.scale = Math.max(0.2, hitBall.scale * 0.985);

        ctx.save();
        ctx.beginPath();
        ctx.arc(hitBall.x, hitBall.y, 9 * hitBall.scale, 0, Math.PI * 2);
        ctx.fillStyle = '#DC2626';
        ctx.fill();
        ctx.restore();
      }

      // 9. Update and Draw Particle System
      particleSystemRef.current.update();
      particleSystemRef.current.draw(ctx);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="cricket-game-wrapper">
      {/* 1. Modern Top HUD Bar */}
      <div className="cricket-hud-bar">
        <div className="cricket-hud-left">
          {/* Score Badge */}
          <div className="cricket-score-badge">
            <span className="cricket-score-label">SCORE (RUNS)</span>
            <span className="cricket-score-val">{score}</span>
          </div>

          {/* High Score Badge */}
          <div className="cricket-score-badge">
            <span className="cricket-score-label">BEST</span>
            <span className="cricket-score-val" style={{ color: '#38BDF8' }}>
              {highScore}
            </span>
          </div>

          {/* Speed Tier Badge */}
          <div
            className="cricket-level-badge"
            style={{ background: speedTier.color }}
          >
            <Zap style={{ width: '14px', height: '14px' }} />
            <span>{speedTier.badge}</span>
          </div>
        </div>

        <div className="cricket-hud-right">
          {/* Pitch Indicator */}
          <div className="cricket-pitch-indicator">
            <span>{currentPitchInfo.name}</span>
          </div>

          {/* How to play modal trigger */}
          <button
            className="cricket-hud-btn"
            onClick={() => setIsHowToPlayOpen(true)}
            title="게임 가이드 및 규칙"
          >
            <HelpCircle style={{ width: '18px', height: '18px' }} />
          </button>

          {/* Audio Mute Toggle */}
          <button
            className="cricket-hud-btn"
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? '소리 켜기' : '소리 끄기'}
          >
            {isMuted ? (
              <VolumeX style={{ width: '18px', height: '18px', color: '#EF4444' }} />
            ) : (
              <Volume2 style={{ width: '18px', height: '18px', color: '#10B981' }} />
            )}
          </button>

          {/* Restart Button */}
          <button
            className="cricket-hud-btn"
            onClick={restartGame}
            title="게임 다시 시작"
          >
            <RotateCcw style={{ width: '18px', height: '18px' }} />
          </button>
        </div>
      </div>

      {/* 2. Interactive 16:9 Canvas Play Area */}
      <div className="cricket-canvas-wrapper" onClick={handleSwing}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="cricket-canvas"
        />

        {/* Mobile Swing Button */}
        <button
          className="cricket-mobile-swing-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleSwing();
          }}
        >
          <span>SWING</span>
          <span style={{ fontSize: '11px' }}>스윙</span>
        </button>

        {/* Hit Result Announcement Overlay */}
        {activeHitAnnouncement && (
          <div className="cricket-hit-announcement">
            <span
              className="cricket-hit-title"
              style={{ color: activeHitAnnouncement.color }}
            >
              {activeHitAnnouncement.label}
            </span>
            <span className="cricket-hit-subtitle">
              {activeHitAnnouncement.subLabel}
            </span>
          </div>
        )}

        {/* Game Over Modal Card Overlay */}
        {isGameOver && (
          <div
            className="cricket-gameover-overlay"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cricket-gameover-card">
              <div className="cricket-gameover-tag">
                <span>🔴 아웃 판정: BOWLED OUT</span>
              </div>
              <div className="cricket-gameover-icon">🏏</div>
              <h2 className="cricket-gameover-title">경기 종료 (GAME OVER)</h2>

              {/* Clear Reason Alert Box */}
              <div className="cricket-gameover-alertbox">
                <div className="cricket-gameover-alert-main">
                  공이 위켓(나무 기둥)을 맞춰 아웃되었습니다!
                </div>
                <div className="cricket-gameover-alert-sub">
                  크리켓은 단 한 번의 위켓 피격으로도 즉시 경기가 끝나는 서든데스 룰입니다.
                </div>
              </div>

              {/* Score Summary Box */}
              <div className="cricket-gameover-scorebox">
                <div className="cricket-gameover-score-row">
                  <span>최종 득점 (RUNS)</span>
                  <span className="cricket-score-num">{finalScore}점</span>
                </div>
                <div className="cricket-gameover-score-row">
                  <span>최고 기록 (BEST)</span>
                  <span style={{ fontWeight: '700', color: '#38BDF8' }}>
                    {highScore}점
                  </span>
                </div>
                <div className="cricket-gameover-score-row">
                  <span>달성 난이도</span>
                  <span style={{ fontWeight: '700', color: speedTier.color }}>
                    {speedTier.badge} ({speedTier.name})
                  </span>
                </div>
              </div>

              {/* Tip box for scores <= 100 */}
              {finalScore <= 100 && (
                <div className="cricket-gameover-tip">
                  💡 <strong>100점을 초과 달성</strong>하면 도촌초 실시간 명예의 전당 랭킹에 이름을 남길 수 있습니다!
                </div>
              )}

              {/* Hall of Fame Score Submission (Strict 100+ points rule compliance) */}
              {finalScore > 100 && (
                <div className="cricket-submit-box">
                  <div className="cricket-submit-title">
                    <Trophy style={{ width: '16px', height: '16px' }} />
                    <span>도촌초 명예의 전당 점수 등록</span>
                  </div>
                  {submittedSuccess ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        color: '#10B981',
                        fontSize: '13px',
                        fontWeight: '700'
                      }}
                    >
                      <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                      <span>등록 완료! 명예의 전당을 확인하세요.</span>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleScoreSubmit}
                      className="cricket-submit-form"
                    >
                      <input
                        type="text"
                        className="cricket-input"
                        placeholder="예: 홍길동"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        maxLength={10}
                        required
                        disabled={isSubmitting}
                      />
                      <button
                        type="submit"
                        className="cricket-submit-btn"
                        disabled={isSubmitting || !playerName.trim()}
                      >
                        <Send style={{ width: '14px', height: '14px' }} />
                        <span>{isSubmitting ? '등록 중...' : '등록'}</span>
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Restart Button */}
              <button className="cricket-restart-btn" onClick={restartGame}>
                <RotateCcw style={{ width: '16px', height: '16px' }} />
                <span>다시 도전하기 (Spacebar / Enter / 클릭)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. How to Play Modal */}
      <CricketHowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
}
