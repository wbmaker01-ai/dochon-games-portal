import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BOX_LEFT,
  BOX_RIGHT,
  BOX_BOTTOM,
  SPAWN_Y,
  DROP_COOLDOWN_MS,
  FRUITS,
  getRandomSpawnFruit
} from './fruitMergeConstants';
import { fruitAudio } from './fruitMergeAudio';
import { PhysicsEngine, Fruit } from './fruitMergePhysics';
import FruitMergeHowToPlayModal from './FruitMergeHowToPlayModal';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import './fruitmerge.css';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Trophy,
  Dices,
  Send,
  User,
  CheckCircle2
} from 'lucide-react';

export default function FruitMergeGame({ onScoreSubmitted }) {
  // Game States
  const [gameState, setGameState] = useState('playing'); // 'playing' | 'gameover'
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try {
      const saved = localStorage.getItem('dochon_fruitmerge_best');
      return saved ? Number(saved) : 0;
    } catch (e) {
      return 0;
    }
  });
  const [maxFruitLevel, setMaxFruitLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [shakeCount, setShakeCount] = useState(2); // 2 emergency shakes per game

  // Next and Current Dropping Fruits
  const [currentLevel, setCurrentLevel] = useState(() => getRandomSpawnFruit());
  const [nextLevel, setNextLevel] = useState(() => getRandomSpawnFruit());
  const [canDrop, setCanDrop] = useState(true);

  // Leaderboard Form State
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Canvas & Physics Refs
  const canvasRef = useRef(null);
  const engineRef = useRef(new PhysicsEngine());
  const animFrameRef = useRef(null);
  const aimXRef = useRef(CANVAS_WIDTH / 2);
  const lastDropTimeRef = useRef(0);
  const isGameOverRef = useRef(false);
  const keysPressed = useRef({});

  // Update sound mute state
  useEffect(() => {
    fruitAudio.setMuted(isMuted);
  }, [isMuted]);

  // Restart / Reset Game
  const handleRestart = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    isGameOverRef.current = false;
    engineRef.current.reset();

    const first = getRandomSpawnFruit();
    const second = getRandomSpawnFruit();
    setCurrentLevel(first);
    setNextLevel(second);
    setScore(0);
    setMaxFruitLevel(0);
    setShakeCount(2);
    setCanDrop(true);
    setGameState('playing');
    setPlayerName('');
    setSubmitSuccess(false);
    setIsSubmitting(false);
    lastDropTimeRef.current = 0;
  }, []);

  // Trigger Box Shake Skill
  const handleShake = useCallback(() => {
    if (shakeCount <= 0 || gameState !== 'playing') return;
    engineRef.current.shakeBox();
    setShakeCount(prev => prev - 1);
  }, [shakeCount, gameState]);

  // Drop Fruit Execution
  const triggerDrop = useCallback(() => {
    if (gameState !== 'playing' || !canDrop || isGameOverRef.current) return;

    const now = Date.now();
    if (now - lastDropTimeRef.current < DROP_COOLDOWN_MS) return;

    fruitAudio.init();
    fruitAudio.playDrop();

    const fruitData = FRUITS[currentLevel];
    const clampedX = Math.max(
      BOX_LEFT + fruitData.radius,
      Math.min(BOX_RIGHT - fruitData.radius, aimXRef.current)
    );

    // Spawn falling fruit entity
    const newFruit = new Fruit(currentLevel, clampedX, SPAWN_Y, 0, 1.5);
    engineRef.current.addFruit(newFruit);

    lastDropTimeRef.current = now;
    setCanDrop(false);

    // Roll next fruit
    setCurrentLevel(nextLevel);
    setNextLevel(getRandomSpawnFruit());

    // Unlock drop after cooldown
    setTimeout(() => {
      if (!isGameOverRef.current) {
        setCanDrop(true);
      }
    }, DROP_COOLDOWN_MS);
  }, [gameState, canDrop, currentLevel, nextLevel]);

  // Score Addition Callback
  const handleScoreAdd = useCallback((addedScore) => {
    setScore(prev => {
      const updated = prev + addedScore;
      setBestScore(oldBest => {
        if (updated > oldBest) {
          try {
            localStorage.setItem('dochon_fruitmerge_best', String(updated));
          } catch (e) {}
          return updated;
        }
        return oldBest;
      });
      return updated;
    });
  }, []);

  // Fruit Merge Milestone Callback
  const handleFruitMerge = useCallback((mergedLevel, combo) => {
    setMaxFruitLevel(prev => Math.max(prev, mergedLevel));

    // Giant Watermelon Celebration!
    if (mergedLevel === 10) {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  }, []);

  // Game Over Handler
  const handleGameOver = useCallback(() => {
    if (isGameOverRef.current) return;
    isGameOverRef.current = true;
    setGameState('gameover');
    setCanDrop(false);
  }, []);

  // Keyboard Controls (Arrow Keys, A/D, Space, Down, Enter, Z)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore key events if user is typing their name in the Leaderboard form
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }

      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'Space', 'KeyA', 'KeyD', 'KeyS'].includes(e.code)) {
        e.preventDefault();
      }

      keysPressed.current[e.code] = true;

      // Snappy immediate step on single tap
      const curRadius = FRUITS[currentLevel]?.radius || 17;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        aimXRef.current = Math.max(BOX_LEFT + curRadius, aimXRef.current - 18);
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        aimXRef.current = Math.min(BOX_RIGHT - curRadius, aimXRef.current + 18);
      }

      // Drop on Space, Down Arrow, or Enter
      if ((e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'Enter') && !e.repeat) {
        if (gameState === 'playing') {
          triggerDrop();
        }
      }

      // Quick Shake on Z
      if (e.code === 'KeyZ' && !e.repeat) {
        handleShake();
      }
    };

    const handleKeyUp = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'Space', 'KeyA', 'KeyD', 'KeyS'].includes(e.code)) {
        e.preventDefault();
      }
      keysPressed.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, triggerDrop, handleShake]);

  // Main 60FPS Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let isRunning = true;

    const gameLoop = () => {
      if (!isRunning) return;

      // Keyboard Smooth Movement
      if (keysPressed.current['ArrowLeft'] || keysPressed.current['KeyA']) {
        const curRadius = FRUITS[currentLevel]?.radius || 17;
        aimXRef.current = Math.max(BOX_LEFT + curRadius, aimXRef.current - 7.5);
      }
      if (keysPressed.current['ArrowRight'] || keysPressed.current['KeyD']) {
        const curRadius = FRUITS[currentLevel]?.radius || 17;
        aimXRef.current = Math.min(BOX_RIGHT - curRadius, aimXRef.current + 7.5);
      }

      if (!isGameOverRef.current) {
        engineRef.current.update(
          handleFruitMerge,
          handleScoreAdd,
          handleGameOver
        );
      }

      // Draw World
      const currentFruitData = canDrop && !isGameOverRef.current ? FRUITS[currentLevel] : null;
      engineRef.current.draw(ctx, aimXRef.current, currentFruitData);

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [canDrop, currentLevel, handleFruitMerge, handleScoreAdd, handleGameOver]);

  // Mouse & Touch Input Handlers
  const handlePointerMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const scaleX = CANVAS_WIDTH / rect.width;
    const canvasX = (clientX - rect.left) * scaleX;

    aimXRef.current = Math.max(BOX_LEFT + 15, Math.min(BOX_RIGHT - 15, canvasX));
  };

  const handlePointerDown = (e) => {
    fruitAudio.init();
    handlePointerMove(e);
  };

  const handlePointerUp = (e) => {
    if (gameState === 'playing' && canDrop) {
      triggerDrop();
    }
  };

  // Submit High Score to Leaderboard DB
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (score <= 100 || isSubmitting) return;

    const cleanName = playerName.trim() || '도촌 학생';
    setIsSubmitting(true);

    try {
      await submitScoreToDB('fruitmerge', cleanName, score);
      setSubmitSuccess(true);
      if (onScoreSubmitted) {
        setTimeout(() => {
          onScoreSubmitted();
        }, 600);
      }
    } catch (err) {
      console.error('Score submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextFruitData = FRUITS[nextLevel];

  return (
    <div className="fruit-game-container">
      {/* 1. Top HUD Header */}
      <div className="fruit-hud">
        {/* Score & Best */}
        <div className="fruit-score-badge">
          <span className="fruit-score-label">SCORE</span>
          <span className="fruit-score-value">{score.toLocaleString()}</span>
        </div>

        {/* Next Fruit Preview */}
        <div className="fruit-next-preview">
          <span className="fruit-next-label">NEXT</span>
          <div
            className="fruit-next-icon"
            style={{
              backgroundColor: nextFruitData.color,
              boxShadow: `0 0 10px ${nextFruitData.color}60`
            }}
          >
            {nextFruitData.emoji}
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="fruit-tool-bar">
          {/* Shake Skill */}
          <button
            onClick={handleShake}
            disabled={shakeCount <= 0 || gameState !== 'playing'}
            className="fruit-shake-btn"
            title="상자 흔들기 (끼인 과일 탈출)"
          >
            <Dices className="w-4 h-4" />
            <span>흔들기 ({shakeCount})</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="fruit-btn-icon"
            title={isMuted ? '소리 켜기' : '소리 끄기'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* How to Play */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="fruit-btn-icon"
            title="게임 설명서"
          >
            <HelpCircle className="w-4 h-4 text-amber-300" />
          </button>

          {/* Restart */}
          <button
            onClick={handleRestart}
            className="fruit-btn-icon"
            title="다시 시작"
          >
            <RotateCcw className="w-4 h-4 text-slate-200" />
          </button>
        </div>
      </div>

      {/* 2. Main Game Canvas Arena */}
      <div className="fruit-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="fruit-game-canvas"
          onMouseMove={handlePointerMove}
          onMouseDown={handlePointerDown}
          onMouseUp={handlePointerUp}
          onTouchMove={handlePointerMove}
          onTouchStart={handlePointerDown}
          onTouchEnd={handlePointerUp}
        />

        {/* 3. Game Over Screen */}
        {gameState === 'gameover' && (
          <div className="fruit-gameover-overlay">
            <div className="fruit-gameover-card">
              <div className="text-4xl mb-1 animate-bounce">🍉</div>
              <h3 className="fruit-gameover-title">게임 종료!</h3>
              <p className="text-xs text-slate-300">상자가 가득 차 한계선을 넘었습니다.</p>

              <div className="fruit-gameover-score-badge">
                <div className="text-xs text-amber-300 font-bold mb-0.5">최종 획득 점수</div>
                <div className="fruit-gameover-score-num">{score.toLocaleString()}점</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  최고 기록: {bestScore.toLocaleString()}점 · 최고 달성: {FRUITS[maxFruitLevel]?.emoji} {FRUITS[maxFruitLevel]?.name}
                </div>
              </div>

              {/* Leaderboard Form: ONLY rendered if score > 100 */}
              {score > 100 ? (
                <div className="fruit-leaderboard-box">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-400 mb-2">
                    <Trophy className="w-4 h-4" />
                    도촌초 명예의 전당 등록
                  </div>

                  {!submitSuccess ? (
                    <form onSubmit={handleScoreSubmit} className="space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                          placeholder="예: 홍길동"
                          maxLength={10}
                          className="fruit-name-input"
                          disabled={isSubmitting}
                          autoFocus
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="fruit-submit-btn"
                      >
                        {isSubmitting ? (
                          <span>등록 중...</span>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>명예의 전당 점수 등록</span>
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="py-2 flex items-center justify-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-950/60 rounded-lg border border-emerald-500/30">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>명예의 전당에 성공적으로 등록되었습니다!</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400">
                  💡 100점 초과 달성 시 명예의 전당에 등록할 수 있습니다.
                </div>
              )}

              {/* Play Again Button */}
              <button onClick={handleRestart} className="fruit-retry-btn">
                <RotateCcw className="w-5 h-5" />
                <span>다시 도전하기</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Controls Quick Keyboard & Mouse Hint Bar */}
      <div className="fruit-controls-hint">
        <span className="fruit-hint-badge">⌨️ [← / →] 이동</span>
        <span className="fruit-hint-badge">[스페이스바 / ↓] 과일 낙하</span>
        <span className="fruit-hint-badge">[Z] 흔들기</span>
      </div>

      {/* 5. Bottom Fruit Evolution Sequence Rail */}
      <div className="fruit-evolution-rail">
        {FRUITS.map((fruit, idx) => (
          <React.Fragment key={fruit.level}>
            <div
              className={`fruit-rail-item ${maxFruitLevel >= fruit.level ? 'active' : ''}`}
              title={`${fruit.name} (+${fruit.score}점)`}
            >
              <span>{fruit.emoji}</span>
            </div>
            {idx < FRUITS.length - 1 && <span className="fruit-rail-arrow">›</span>}
          </React.Fragment>
        ))}
      </div>

      {/* 5. How to Play Modal */}
      <FruitMergeHowToPlayModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
