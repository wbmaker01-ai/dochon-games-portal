import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  STAGE_MAPS
} from './brickBreakerConstants';
import { PhysicsEngine } from './brickBreakerPhysics';
import { brickAudio } from './brickBreakerAudio';
import BrickBreakerHowToPlayModal from './BrickBreakerHowToPlayModal';
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
  Zap,
  Sparkles,
  Heart
} from 'lucide-react';
import './brickbreaker.css';

export default function BrickBreakerGame({ onScoreSubmitted }) {
  // Game Session States
  const [gameState, setGameState] = useState('READY'); // 'READY' | 'PLAYING' | 'PAUSED' | 'STAGE_CLEAR' | 'ALL_CLEAR' | 'GAME_OVER'
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try {
      const saved = localStorage.getItem('dochon_brickbreaker_best');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch (e) {
      return 0;
    }
  });
  const [stageIndex, setStageIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [isMuted, setIsMuted] = useState(false);
  const [isHowToOpen, setIsHowToOpen] = useState(false);

  // Leaderboard Submit Form State
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Canvas and Engine Refs
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const reqIdRef = useRef(null);
  const moveIntervalRef = useRef(null);

  // Initialize Physics Engine
  useEffect(() => {
    const engine = new PhysicsEngine();
    engine.loadStage(STAGE_MAPS[0]);
    engineRef.current = engine;

    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
    };
  }, []);

  // Update Best Score
  const handleScoreAdd = useCallback((points) => {
    haptics.medium();
    setScore(prev => {
      const updated = prev + points;
      setBestScore(best => {
        if (updated > best) {
          try {
            localStorage.setItem('dochon_brickbreaker_best', String(updated));
          } catch (e) {}
          return updated;
        }
        return best;
      });
      return updated;
    });
  }, []);

  // Life Lost Callback
  const handleLifeLost = useCallback(() => {
    haptics.warning();
    setLives(prev => {
      const remaining = prev - 1;
      if (remaining <= 0) {
        brickAudio.playGameOver();
        setGameState('GAME_OVER');
        return 0;
      }
      return remaining;
    });
  }, []);

  // Extra Life Bonus Callback
  const handleExtraLife = useCallback(() => {
    haptics.light();
    setLives(prev => Math.min(5, prev + 1));
  }, []);

  // Stage Clear Callback
  const handleStageClear = useCallback(() => {
    haptics.success();
    setStageIndex(curr => {
      const nextStage = curr + 1;
      if (nextStage >= STAGE_MAPS.length) {
        setGameState('ALL_CLEAR');
        return curr;
      } else {
        setGameState('STAGE_CLEAR');
        return nextStage;
      }
    });
  }, []);

  // Start Next Stage
  const startNextStage = useCallback(() => {
    if (!engineRef.current) return;
    const nextMap = STAGE_MAPS[stageIndex];
    if (nextMap) {
      engineRef.current.loadStage(nextMap);
      setGameState('PLAYING');
    }
  }, [stageIndex]);

  // Restart / Reset Game
  const resetGame = useCallback(() => {
    if (!engineRef.current) return;
    setScore(0);
    setLives(3);
    setStageIndex(0);
    setHasSubmitted(false);
    setPlayerName('');
    engineRef.current.loadStage(STAGE_MAPS[0]);
    setGameState('READY');
  }, []);

  // Main 60FPS Game Loop with Delta-Time Normalization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const engine = engineRef.current;
    let lastTime = performance.now();

    const render = (timestamp) => {
      const elapsed = timestamp ? (timestamp - lastTime) : 16.666;
      lastTime = timestamp || performance.now();
      // Bound dt to prevent huge jumps on tab switch while ensuring smooth 30~60 FPS
      const dt = Math.min(48, Math.max(1, elapsed));
      const timeScale = dt / 16.666;

      if (engine && ctx) {
        if (gameState === 'PLAYING') {
          engine.update(
            handleScoreAdd,
            handleExtraLife,
            handleLifeLost,
            handleStageClear,
            timeScale
          );
        }
        engine.draw(ctx);
      }
      reqIdRef.current = requestAnimationFrame(render);
    };

    reqIdRef.current = requestAnimationFrame(render);

    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
    };
  }, [gameState, handleScoreAdd, handleExtraLife, handleLifeLost, handleStageClear]);

  // Launch Active Ball
  const launchBall = useCallback(() => {
    if (!engineRef.current) return;
    brickAudio.init();
    haptics.light();

    if (gameState === 'READY') {
      setGameState('PLAYING');
    }

    engineRef.current.balls.forEach(b => {
      if (!b.isLaunched) {
        b.launch(-Math.PI / 3 + (Math.random() * 0.4 - 0.2));
      }
    });

    if (engineRef.current.paddle.isLaserActive) {
      haptics.heavy();
      engineRef.current.paddle.shootLaser(engineRef.current.laserBullets);
    }
  }, [gameState]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
        e.preventDefault();
      }

      if (engineRef.current) {
        engineRef.current.keys[e.code] = true;
      }

      if (e.code === 'Space') {
        launchBall();
      }
    };

    const handleKeyUp = (e) => {
      if (engineRef.current) {
        engineRef.current.keys[e.code] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [launchBall]);

  // Mouse / Touch Canvas Drag Handling
  const handlePointerMove = (e) => {
    if (!canvasRef.current || !engineRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const canvasX = (clientX - rect.left) * scaleX;

    const paddle = engineRef.current.paddle;
    paddle.targetX = canvasX - paddle.width / 2;
  };

  const handlePointerDown = (e) => {
    handlePointerMove(e);
    launchBall();
  };

  // Mobile Hold Movement
  const startHoldMove = (direction) => {
    if (!engineRef.current) return;
    brickAudio.init();
    const step = direction === 'left' ? -10 : 10;

    const moveStep = () => {
      const paddle = engineRef.current.paddle;
      paddle.targetX += step;
    };

    moveStep();
    if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
    moveIntervalRef.current = setInterval(moveStep, 35);
  };

  const stopHoldMove = () => {
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
    }
  };

  // Leaderboard Score Submit
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    const cleanName = playerName.trim();
    if (!cleanName || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitScoreToDB('brickbreaker', cleanName, score);
      setHasSubmitted(true);
      if (onScoreSubmitted) {
        onScoreSubmitted();
      }
    } catch (err) {
      console.error('Failed to submit score:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sound Toggle
  const toggleSound = () => {
    const muted = brickAudio.toggleMute();
    setIsMuted(muted);
  };

  // Pause / Resume Toggle
  const togglePause = () => {
    if (gameState === 'PLAYING') {
      setGameState('PAUSED');
    } else if (gameState === 'PAUSED') {
      setGameState('PLAYING');
    }
  };

  const currentStageName = STAGE_MAPS[stageIndex]?.name || `스테이지 ${stageIndex + 1}`;

  return (
    <div className="bb-game-container">
      {/* 1. Glassmorphism Top HUD Bar */}
      <div className="bb-hud-bar">
        {/* Stage & Life */}
        <div className="bb-hud-item" style={{ alignItems: 'flex-start' }}>
          <span className="bb-hud-label">{STAGE_MAPS[stageIndex]?.name.split(':')[0] || `STAGE ${stageIndex + 1}`}</span>
          <div className="bb-lives-container">
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart
                key={i}
                style={{
                  width: '14px',
                  height: '14px',
                  color: i < lives ? '#EF4444' : '#334155',
                  fill: i < lives ? '#EF4444' : 'transparent',
                  transition: 'all 0.2s'
                }}
              />
            ))}
          </div>
        </div>

        {/* Score & Best */}
        <div className="bb-hud-item">
          <span className="bb-hud-label">SCORE</span>
          <span className="bb-hud-value bb-score-value">{score.toLocaleString()}</span>
        </div>

        <div className="bb-hud-item">
          <span className="bb-hud-label">BEST</span>
          <span className="bb-hud-value" style={{ color: '#38BDF8' }}>{bestScore.toLocaleString()}</span>
        </div>

        {/* Action Controls */}
        <div className="bb-hud-actions">
          <button onClick={toggleSound} className="bb-hud-btn" title={isMuted ? '음소거 해제' : '음소거'}>
            {isMuted ? <VolumeX style={{ width: '15px', height: '15px', color: '#EF4444' }} /> : <Volume2 style={{ width: '15px', height: '15px' }} />}
          </button>
          <button onClick={togglePause} className="bb-hud-btn" title={gameState === 'PAUSED' ? '재개' : '일시정지'}>
            {gameState === 'PAUSED' ? <Play style={{ width: '15px', height: '15px', color: '#34D399' }} /> : <Pause style={{ width: '15px', height: '15px' }} />}
          </button>
          <button onClick={() => setIsHowToOpen(true)} className="bb-hud-btn" title="게임 방법">
            <HelpCircle style={{ width: '15px', height: '15px' }} />
          </button>
          <button onClick={resetGame} className="bb-hud-btn" title="다시 시작">
            <RotateCcw style={{ width: '15px', height: '15px' }} />
          </button>
        </div>
      </div>

      {/* 2. Interactive Canvas Stage */}
      <div
        className="bb-canvas-wrapper"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchStart={handlePointerDown}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="bb-canvas"
        />

        {/* Ready Overlay */}
        {gameState === 'READY' && (
          <div className="bb-overlay-screen">
            <div className="bb-overlay-icon">🧱</div>
            <h2 className="bb-overlay-title">도촌 벽돌 격파왕</h2>
            <p className="bb-overlay-desc">
              마우스 / 터치 드래그로 패들을 움직이고<br />
              화면을 클릭하거나 <strong>[스페이스바]</strong>를 눌러 공을 발사하세요!
            </p>
            <button onClick={launchBall} className="bb-btn-primary">
              <Play style={{ width: '18px', height: '18px' }} />
              게임 시작하기
            </button>
            <button onClick={() => setIsHowToOpen(true)} className="bb-btn-secondary">
              <HelpCircle style={{ width: '14px', height: '14px' }} />
              게임 방법 & 도감 확인
            </button>
          </div>
        )}

        {/* Paused Overlay */}
        {gameState === 'PAUSED' && (
          <div className="bb-overlay-screen">
            <div className="bb-overlay-icon">⏸️</div>
            <h2 className="bb-overlay-title">게임 일시정지</h2>
            <p className="bb-overlay-desc">잠시 휴식 중입니다. 준비가 되면 재개 버튼을 눌러주세요.</p>
            <button onClick={togglePause} className="bb-btn-primary">
              <Play style={{ width: '18px', height: '18px' }} />
              게임 계속하기
            </button>
          </div>
        )}

        {/* Stage Clear Overlay */}
        {gameState === 'STAGE_CLEAR' && (
          <div className="bb-overlay-screen">
            <div className="bb-overlay-icon">🎉</div>
            <h2 className="bb-overlay-title">STAGE CLEAR!</h2>
            <p className="bb-overlay-desc">
              축하합니다! 스테이지를 완벽하게 정복했습니다.<br />
              다음 단계: <strong>{STAGE_MAPS[stageIndex]?.name}</strong>
            </p>
            <div className="bb-score-card">
              <div className="bb-score-col">
                <span className="bb-score-col-label">현재 누적 점수</span>
                <span className="bb-score-col-val">{score.toLocaleString()}</span>
              </div>
            </div>
            <button onClick={startNextStage} className="bb-btn-primary">
              <Sparkles style={{ width: '18px', height: '18px' }} />
              다음 스테이지 도전
            </button>
          </div>
        )}

        {/* All Stages Clear Overlay */}
        {gameState === 'ALL_CLEAR' && (
          <div className="bb-overlay-screen">
            <div className="bb-overlay-icon">👑</div>
            <h2 className="bb-overlay-title">전설의 도촌 격파왕 등극!</h2>
            <p className="bb-overlay-desc">모든 관문을 뚫고 도촌초등학교 최고의 블록 격파 마스터가 되었습니다!</p>

            <div className="bb-score-card">
              <div className="bb-score-col">
                <span className="bb-score-col-label">최종 격파 점수</span>
                <span className="bb-score-col-val">{score.toLocaleString()}</span>
              </div>
            </div>

            {/* Honor of School Leaderboard Submit Form (Only if score > 100) */}
            {score > 100 && !hasSubmitted && (
              <form onSubmit={handleScoreSubmit} className="bb-submit-form">
                <span style={{ fontSize: '12px', color: '#FDE047', fontWeight: 800 }}>
                  🏆 도촌초 실시간 명예의 전당 랭킹 등록
                </span>
                <div className="bb-input-row">
                  <input
                    type="text"
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    placeholder="예: 홍길동"
                    maxLength={10}
                    className="bb-name-input"
                    disabled={isSubmitting}
                  />
                  <button type="submit" disabled={isSubmitting || !playerName.trim()} className="bb-submit-btn">
                    <Trophy style={{ width: '14px', height: '14px' }} />
                    {isSubmitting ? '등록 중...' : '등록하기'}
                  </button>
                </div>
              </form>
            )}

            {hasSubmitted && (
              <div style={{ color: '#34D399', fontWeight: 800, fontSize: '13px', marginBottom: '14px' }}>
                ✅ 명예의 전당에 점수가 성공적으로 등록되었습니다!
              </div>
            )}

            <button onClick={resetGame} className="bb-btn-primary">
              <RotateCcw style={{ width: '18px', height: '18px' }} />
              처음부터 다시 도전
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'GAME_OVER' && (
          <div className="bb-overlay-screen">
            <div className="bb-overlay-icon">💥</div>
            <h2 className="bb-overlay-title">GAME OVER</h2>
            <p className="bb-overlay-desc">모든 공을 놓쳤습니다! 다시 도전하여 최고 기록을 세워보세요.</p>

            <div className="bb-score-card">
              <div className="bb-score-col">
                <span className="bb-score-col-label">최종 획득 점수</span>
                <span className="bb-score-col-val">{score.toLocaleString()}</span>
              </div>
              <div className="bb-score-col">
                <span className="bb-score-col-label">최고 기록</span>
                <span className="bb-score-col-val" style={{ color: '#38BDF8' }}>{bestScore.toLocaleString()}</span>
              </div>
            </div>

            {/* Honor of School Leaderboard Submit Form (Only if score > 100) */}
            {score > 100 && !hasSubmitted && (
              <form onSubmit={handleScoreSubmit} className="bb-submit-form">
                <span style={{ fontSize: '12px', color: '#FDE047', fontWeight: 800 }}>
                  🏆 도촌초 실시간 명예의 전당 랭킹 등록
                </span>
                <div className="bb-input-row">
                  <input
                    type="text"
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    placeholder="예: 홍길동"
                    maxLength={10}
                    className="bb-name-input"
                    disabled={isSubmitting}
                  />
                  <button type="submit" disabled={isSubmitting || !playerName.trim()} className="bb-submit-btn">
                    <Trophy style={{ width: '14px', height: '14px' }} />
                    {isSubmitting ? '등록 중...' : '등록하기'}
                  </button>
                </div>
              </form>
            )}

            {hasSubmitted && (
              <div style={{ color: '#34D399', fontWeight: 800, fontSize: '13px', marginBottom: '14px' }}>
                ✅ 명예의 전당에 점수가 성공적으로 등록되었습니다!
              </div>
            )}

            <button onClick={resetGame} className="bb-btn-primary">
              <RotateCcw style={{ width: '18px', height: '18px' }} />
              다시 플레이하기
            </button>
          </div>
        )}
      </div>

      {/* 3. Mobile Touch Controls Bar */}
      <div className="bb-mobile-controls">
        <div className="bb-ctrl-dpad">
          <button
            onPointerDown={() => startHoldMove('left')}
            onPointerUp={stopHoldMove}
            onPointerLeave={stopHoldMove}
            className="bb-ctrl-btn"
            title="왼쪽 이동"
          >
            <ArrowLeft />
          </button>
          <button
            onPointerDown={() => startHoldMove('right')}
            onPointerUp={stopHoldMove}
            onPointerLeave={stopHoldMove}
            className="bb-ctrl-btn"
            title="오른쪽 이동"
          >
            <ArrowRight />
          </button>
        </div>

        <button onClick={launchBall} className="bb-action-btn">
          <Zap style={{ width: '16px', height: '16px' }} />
          공 발사 / 레이저
        </button>
      </div>

      {/* 4. How To Play Modal */}
      <BrickBreakerHowToPlayModal
        isOpen={isHowToOpen}
        onClose={() => setIsHowToOpen(false)}
      />
    </div>
  );
}
