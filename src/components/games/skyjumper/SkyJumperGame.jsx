import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './skyJumperConstants';
import { SkyJumperPhysics } from './skyJumperPhysics';
import { skyJumperAudio } from './skyJumperAudio';
import SkyJumperHowToPlayModal from './SkyJumperHowToPlayModal';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import { haptics } from '../../../utils/haptics';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  HelpCircle,
  Trophy,
  Play,
  Pause,
  ArrowLeft,
  ArrowRight,
  Crosshair,
  Zap,
  Sparkles,
  Rocket
} from 'lucide-react';
import './skyjumper.css';

export default function SkyJumperGame({ onScoreSubmitted }) {
  // Game States
  const [gameState, setGameState] = useState('READY'); // 'READY' | 'COUNTDOWN' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try {
      const saved = localStorage.getItem('dochon_skyjumper_best');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch (e) {
      return 0;
    }
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isHowToOpen, setIsHowToOpen] = useState(false);
  const [gameOverReason, setGameOverReason] = useState('추락');

  // Leaderboard State
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Canvas & Physics Engine Refs
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const reqIdRef = useRef(null);
  const lastTimeRef = useRef(0);
  const dpadIntervalRef = useRef(null);
  const countdownTimersRef = useRef([]);

  const clearCountdownTimers = () => {
    countdownTimersRef.current.forEach(id => clearTimeout(id));
    countdownTimersRef.current = [];
  };

  // Initialize Physics Engine
  useEffect(() => {
    let lastScoreUpdate = 0;

    const engine = new SkyJumperPhysics({
      onScoreAdd: () => {
        const now = performance.now();
        if (now - lastScoreUpdate > 75) {
          lastScoreUpdate = now;
          setScore(engine.score);
          setBestScore(prev => {
            if (engine.score > prev) {
              try {
                localStorage.setItem('dochon_skyjumper_best', String(engine.score));
              } catch (e) {}
              return engine.score;
            }
            return prev;
          });
        }
      },
      onGameOver: (reason, finalScore) => {
        haptics.warning();
        setGameOverReason(reason);
        setScore(finalScore);
        setGameState('GAME_OVER');
      },
      onMilestone: (alt) => {
        haptics.success();
      },
      onItemCollect: (type) => {
        haptics.medium();
      }
    });

    engineRef.current = engine;

    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      clearCountdownTimers();
      skyJumperAudio.stopRocketSound();
      skyJumperAudio.stopPropellerSound();
    };
  }, []);

  // Main 30FPS Game Loop with Delta-Time Normalization (50% GPU Reduction)
  useEffect(() => {
    let animationFrameId;
    const TARGET_FPS = 30;
    const FRAME_INTERVAL = 1000 / TARGET_FPS; // 33.33ms
    let lastRenderTime = performance.now();

    const loop = (currentTime) => {
      try {
        const elapsed = currentTime - lastRenderTime;

        if (elapsed >= FRAME_INTERVAL) {
          lastRenderTime = currentTime - (elapsed % FRAME_INTERVAL);
          const dt = Math.min(64, Math.max(1, elapsed));

          const engine = engineRef.current;
          const canvas = canvasRef.current;

          if (engine && canvas) {
            const ctx = canvas.getContext('2d');

            if (gameState === 'PLAYING') {
              engine.update(currentTime, dt);
            }

            engine.render(ctx);
          }
        }
      } catch (err) {
        console.error('[SkyJumper Loop Error]', err);
      } finally {
        animationFrameId = requestAnimationFrame(loop);
      }
    };

    lastRenderTime = performance.now();
    animationFrameId = requestAnimationFrame(loop);
    reqIdRef.current = animationFrameId;

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [gameState]);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter'].includes(e.key)) {
        e.preventDefault();
      }

      const engine = engineRef.current;
      if (!engine) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        engine.keys.left = true;
        engine.pointerTargetX = null; // Clear mouse pointer lock
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        engine.keys.right = true;
        engine.pointerTargetX = null; // Clear mouse pointer lock
      }
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'Enter') {
        if (gameState === 'READY' || gameState === 'GAME_OVER') {
          startCountdown();
        } else if (gameState === 'PLAYING') {
          engine.shoot();
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }
      const engine = engineRef.current;
      if (!engine) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        engine.keys.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        engine.keys.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Start 3, 2, 1 Countdown Game Flow
  const startCountdown = () => {
    haptics.medium();
    skyJumperAudio.init();
    skyJumperAudio.stopRocketSound();
    skyJumperAudio.stopPropellerSound();
    clearCountdownTimers();

    if (engineRef.current) {
      engineRef.current.reset();
      engineRef.current.pointerTargetX = null;
      engineRef.current.keys.left = false;
      engineRef.current.keys.right = false;
    }

    setScore(0);
    setHasSubmitted(false);
    setCountdownNumber(3);
    setGameState('COUNTDOWN');
    skyJumperAudio.playCountdownBeep(false);

    // Countdown Step 2: 2
    const t1 = setTimeout(() => {
      setCountdownNumber(2);
      skyJumperAudio.playCountdownBeep(false);
    }, 800);

    // Countdown Step 3: 1
    const t2 = setTimeout(() => {
      setCountdownNumber(1);
      skyJumperAudio.playCountdownBeep(false);
    }, 1600);

    // Countdown Step 4: GO! Launch Initial Jump
    const t3 = setTimeout(() => {
      setCountdownNumber('GO!');
      skyJumperAudio.playCountdownBeep(true);
      setGameState('PLAYING');
      if (engineRef.current) {
        engineRef.current.launchInitialJump();
      }
    }, 2400);

    countdownTimersRef.current = [t1, t2, t3];
  };

  // Toggle Pause
  const togglePause = () => {
    if (gameState === 'PLAYING') {
      setGameState('PAUSED');
    } else if (gameState === 'PAUSED') {
      setGameState('PLAYING');
    }
  };

  // Sound Toggle
  const toggleSound = () => {
    const muted = skyJumperAudio.toggleMute();
    setIsMuted(muted);
  };

  // Shoot Bullet
  const handleShoot = () => {
    if (gameState === 'PLAYING' && engineRef.current) {
      haptics.light();
      engineRef.current.shoot();
    }
  };

  // Pointer Movement over Canvas
  const handlePointerMove = (e) => {
    if (gameState !== 'PLAYING' || !canvasRef.current || !engineRef.current) return;
    // When keyboard is used, do not overwrite with stationary mouse
    if (engineRef.current.keys.left || engineRef.current.keys.right) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const canvasX = (clientX - rect.left) * scaleX;
    engineRef.current.pointerTargetX = canvasX;
  };

  const handlePointerLeave = () => {
    if (engineRef.current) {
      engineRef.current.pointerTargetX = null;
    }
  };

  // Touch D-Pad Hold Control
  const startHoldMove = (dir) => {
    if (!engineRef.current || gameState !== 'PLAYING') return;
    haptics.light();
    engineRef.current.pointerTargetX = null; // Clear pointer target

    if (dir === 'left') {
      engineRef.current.keys.left = true;
      engineRef.current.keys.right = false;
    } else {
      engineRef.current.keys.right = true;
      engineRef.current.keys.left = false;
    }
  };

  const stopHoldMove = () => {
    if (engineRef.current) {
      engineRef.current.keys.left = false;
      engineRef.current.keys.right = false;
    }
    if (dpadIntervalRef.current) {
      clearInterval(dpadIntervalRef.current);
      dpadIntervalRef.current = null;
    }
  };

  // Submit Leaderboard Score
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    const cleanName = playerName.trim();
    if (!cleanName || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitScoreToDB('skyjumper', cleanName, score);
      setHasSubmitted(true);
      if (onScoreSubmitted) {
        onScoreSubmitted();
      }
    } catch (err) {
      console.error('Failed to submit skyjumper score:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sj-game-container">
      {/* 1. Top HUD Bar */}
      <div className="sj-hud-bar">
        {/* Current Altitude & Score */}
        <div className="sj-hud-stat">
          <span className="sj-hud-label">현재 고도</span>
          <span className="sj-hud-value">{score.toLocaleString()} m</span>
        </div>

        {/* Best Score */}
        <div className="sj-hud-stat" style={{ alignItems: 'center' }}>
          <span className="sj-hud-label">최고 기록</span>
          <span className="sj-hud-value" style={{ color: '#FDE047' }}>
            {bestScore.toLocaleString()} m
          </span>
        </div>

        {/* Action Controls */}
        <div className="sj-hud-actions">
          <button onClick={toggleSound} className="sj-icon-btn" title={isMuted ? '음소거 해제' : '음소거'}>
            {isMuted ? <VolumeX style={{ width: '18px', height: '18px' }} /> : <Volume2 style={{ width: '18px', height: '18px' }} />}
          </button>

          {gameState === 'PLAYING' || gameState === 'PAUSED' ? (
            <button onClick={togglePause} className="sj-icon-btn" title={gameState === 'PLAYING' ? '일시정지' : '계속하기'}>
              {gameState === 'PLAYING' ? <Pause style={{ width: '18px', height: '18px' }} /> : <Play style={{ width: '18px', height: '18px' }} />}
            </button>
          ) : null}

          <button onClick={() => setIsHowToOpen(true)} className="sj-icon-btn" title="게임 방법">
            <HelpCircle style={{ width: '18px', height: '18px' }} />
          </button>

          <button onClick={startCountdown} className="sj-icon-btn" title="다시 시작">
            <RotateCcw style={{ width: '18px', height: '18px' }} />
          </button>
        </div>
      </div>

      {/* 2. Main Canvas Game Stage */}
      <div
        className="sj-canvas-wrapper"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={handleShoot}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="sj-canvas"
        />

        {/* 3, 2, 1, GO! Countdown Overlay */}
        {gameState === 'COUNTDOWN' && (
          <div className="sj-countdown-overlay">
            <div className="sj-countdown-circle">
              <div key={countdownNumber} className="sj-countdown-number">
                {countdownNumber}
              </div>
            </div>
            <div className="sj-countdown-hint">
              {countdownNumber === 'GO!' ? '🚀 출발!! 점프 시작!' : '⬅️ ➡️ 방향키나 마우스로 발판을 밟으세요!'}
            </div>
          </div>
        )}

        {/* Ready / Start Overlay */}
        {gameState === 'READY' && (
          <div className="sj-overlay-screen">
            <div className="sj-overlay-icon">🚀</div>
            <h2 className="sj-overlay-title">도촌 스카이 점퍼</h2>
            <p className="sj-overlay-desc">
              발판을 딛고 하늘과 우주 끝까지 무한 점프!<br />
              스프링과 제트팩을 타고 최고 고도를 경신하세요.
            </p>

            <button onClick={startCountdown} className="sj-btn-primary" style={{ marginBottom: '14px' }}>
              <Play style={{ width: '18px', height: '18px' }} />
              점프 시작하기
            </button>

            <button
              onClick={() => setIsHowToOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              게임 방법 및 발판 도감 보기
            </button>
          </div>
        )}

        {/* Paused Overlay */}
        {gameState === 'PAUSED' && (
          <div className="sj-overlay-screen">
            <div className="sj-overlay-icon">⏸️</div>
            <h2 className="sj-overlay-title">일시 정지</h2>
            <p className="sj-overlay-desc">잠시 숨을 고르고 점프를 이어가세요!</p>
            <button onClick={togglePause} className="sj-btn-primary">
              <Play style={{ width: '18px', height: '18px' }} />
              게임 계속하기
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'GAME_OVER' && (
          <div className="sj-overlay-screen">
            <div className="sj-overlay-icon">💥</div>
            <h2 className="sj-overlay-title">GAME OVER</h2>
            <p className="sj-overlay-desc">
              {gameOverReason === '추락'
                ? '발판을 놓치고 아래로 추락했습니다!'
                : gameOverReason === '몬스터와 충돌'
                ? '공중 몬스터와 부딪혔습니다!'
                : '블랙홀에 빨려들어갔습니다!'}
            </p>

            {/* Score Card */}
            <div className="sj-score-card">
              <div className="sj-score-col">
                <span className="sj-score-col-label">최종 달성 고도</span>
                <span className="sj-score-col-val">{score.toLocaleString()} m</span>
              </div>
              <div className="sj-score-col">
                <span className="sj-score-col-label">최고 기록</span>
                <span className="sj-score-col-val" style={{ color: '#38BDF8' }}>
                  {bestScore.toLocaleString()} m
                </span>
              </div>
            </div>

            {/* Honor of School Leaderboard Submit Form (Only if score > 100) */}
            {score > 100 && !hasSubmitted && (
              <form onSubmit={handleScoreSubmit} className="sj-submit-form">
                <span style={{ fontSize: '12px', color: '#FDE047', fontWeight: 800 }}>
                  🏆 도촌초 실시간 명예의 전당 랭킹 등록
                </span>
                <div className="sj-input-row">
                  <input
                    type="text"
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    placeholder="예: 홍길동"
                    maxLength={10}
                    className="sj-name-input"
                    disabled={isSubmitting}
                  />
                  <button type="submit" disabled={isSubmitting || !playerName.trim()} className="sj-submit-btn">
                    <Trophy style={{ width: '14px', height: '14px' }} />
                    {isSubmitting ? '등록 중...' : '등록하기'}
                  </button>
                </div>
              </form>
            )}

            {hasSubmitted && (
              <div style={{ color: '#34D399', fontWeight: 800, fontSize: '13px', marginBottom: '14px' }}>
                ✅ 명예의 전당에 기록이 성공적으로 등록되었습니다!
              </div>
            )}

            <button onClick={startCountdown} className="sj-btn-primary">
              <RotateCcw style={{ width: '18px', height: '18px' }} />
              다시 도전하기
            </button>
          </div>
        )}
      </div>

      {/* 3. Mobile Touch Controls */}
      <div className="sj-mobile-controls">
        <div className="sj-ctrl-dpad">
          <button
            onPointerDown={() => startHoldMove('left')}
            onPointerUp={stopHoldMove}
            onPointerLeave={stopHoldMove}
            className="sj-ctrl-btn"
            title="왼쪽 이동"
          >
            <ArrowLeft style={{ width: '22px', height: '22px' }} />
          </button>
          <button
            onPointerDown={() => startHoldMove('right')}
            onPointerUp={stopHoldMove}
            onPointerLeave={stopHoldMove}
            className="sj-ctrl-btn"
            title="오른쪽 이동"
          >
            <ArrowRight style={{ width: '22px', height: '22px' }} />
          </button>
        </div>

        <button onClick={handleShoot} className="sj-action-btn">
          <Crosshair style={{ width: '18px', height: '18px' }} />
          몬스터 슈팅 발사
        </button>
      </div>

      {/* 4. How To Play Modal */}
      <SkyJumperHowToPlayModal
        isOpen={isHowToOpen}
        onClose={() => setIsHowToOpen(false)}
      />
    </div>
  );
}
