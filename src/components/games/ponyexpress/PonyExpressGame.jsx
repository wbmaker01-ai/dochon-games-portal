import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PonyGameLogic } from './ponyLogic';
import { ponyAudio } from './ponyAudio';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TOTAL_LETTERS } from './ponyConstants';
import PonyExpressHowToPlayModal from './PonyExpressHowToPlayModal';
import { Play, RotateCcw, Volume2, VolumeX, HelpCircle, Trophy, Award, ArrowUp, ArrowDown, ChevronUp, ChevronDown } from 'lucide-react';
import './pony.css';

export default function PonyExpressGame({ onScoreSubmitted }) {
  const canvasRef = useRef(null);
  const logicRef = useRef(null);
  const reqIdRef = useRef(null);

  // Game State
  const [gameState, setGameState] = useState('START'); // 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
  const [hudData, setHudData] = useState({
    score: 0,
    letters: 0,
    combo: 0,
    stage: 1,
    stageName: '서부 황무지 사막'
  });

  // Sound Settings
  const [isMuted, setIsMuted] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // Score Registration State
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Touch Swipe Handling
  const touchStartYRef = useRef(0);

  // Initialize Game Logic instance
  useEffect(() => {
    logicRef.current = new PonyGameLogic();
  }, []);

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    ponyAudio.setMuted(next);
  };

  // Start / Restart Game
  const startGame = () => {
    if (!logicRef.current) {
      logicRef.current = new PonyGameLogic();
    } else {
      logicRef.current.reset();
    }
    setIsSubmitted(false);
    setSubmitError('');
    setPlayerName('');
    setGameState('PLAYING');
  };

  const resumeGame = () => {
    setGameState('PLAYING');
  };

  const pauseGame = () => {
    if (gameState === 'PLAYING') {
      setGameState('PAUSED');
    }
  };

  // Submit High Score to Cloud DB (Strict Dochon Rule: score > 100 & placeholder "예: 홍길동")
  const handleSubmitScore = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting || isSubmitted) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const finalScore = hudData.score;
      const success = await submitScoreToDB('ponyexpress', playerName.trim(), finalScore);

      if (success) {
        setIsSubmitted(true);
        if (onScoreSubmitted) {
          onScoreSubmitted();
        }
      } else {
        setSubmitError('점수 등록에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (err) {
      setSubmitError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Main 60FPS Game Loop
  // Main 60FPS Game Loop with Delta Time Normalization & React Throttling
  useEffect(() => {
    if (gameState !== 'PLAYING') {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const logic = logicRef.current;

    let isRunning = true;
    let lastTime = performance.now();
    let lastHudUpdate = 0;

    const loop = (timestamp) => {
      if (!isRunning) return;

      const elapsed = timestamp ? (timestamp - lastTime) : 16.666;
      lastTime = timestamp || performance.now();
      const dt = Math.min(48, Math.max(1, elapsed));

      logic.update(dt);
      logic.draw(ctx);

      // Update HUD State (Throttled to 75ms)
      const now = performance.now();
      if (now - lastHudUpdate > 75) {
        lastHudUpdate = now;
        setHudData({
          score: logic.score,
          letters: logic.collectedLetters,
          combo: logic.combo,
          stage: logic.stageIndex + 1,
          stageName: logic.currentStage.name
        });
      }

      // Check if Game Completed (Arrived at Town Goal)
      if (logic.isGoalReached && logic.goalTimer > 120) {
        setGameState('GAMEOVER');
        return;
      }

      reqIdRef.current = requestAnimationFrame(loop);
    };

    reqIdRef.current = requestAnimationFrame(loop);

    return () => {
      isRunning = false;
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
    };
  }, [gameState]);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'PLAYING' || !logicRef.current) return;

      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        logicRef.current.moveUp();
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        logicRef.current.moveDown();
      } else if (e.code === 'Space') {
        e.preventDefault();
        logicRef.current.jump();
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        pauseGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Touch Swipe Handlers for Canvas
  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length > 0) {
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e) => {
    if (!logicRef.current || gameState !== 'PLAYING') return;
    if (e.changedTouches && e.changedTouches.length > 0) {
      const touchEndY = e.changedTouches[0].clientY;
      const diffY = touchEndY - touchStartYRef.current;

      if (diffY < -30) {
        // Swipe Up
        logicRef.current.moveUp();
      } else if (diffY > 30) {
        // Swipe Down
        logicRef.current.moveDown();
      } else if (Math.abs(diffY) <= 15) {
        // Tap -> Jump
        logicRef.current.jump();
      }
    }
  };

  // Virtual Button Handlers
  const handleVirtualUp = () => {
    if (logicRef.current && gameState === 'PLAYING') logicRef.current.moveUp();
  };

  const handleVirtualDown = () => {
    if (logicRef.current && gameState === 'PLAYING') logicRef.current.moveDown();
  };

  const handleVirtualJump = () => {
    if (logicRef.current && gameState === 'PLAYING') logicRef.current.jump();
  };

  // Calculate Stars (1 ~ 3 Stars)
  const getStars = () => {
    const letters = hudData.letters;
    if (letters >= 90) return '⭐⭐⭐';
    if (letters >= 60) return '⭐⭐';
    return '⭐';
  };

  return (
    <div className="pony-container">
      {/* 1. Header Bar with HUD & Controls */}
      <div className="pony-header-bar">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐎</span>
          <div>
            <h2 className="text-base font-black text-amber-300">도촌 포니 익스프레스</h2>
            <p className="text-xs text-amber-200/70">{hudData.stageName}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="pony-hud-item">
            <span className="pony-hud-badge">✉️ {hudData.letters} / {TOTAL_LETTERS}</span>
          </div>

          <div className="pony-hud-item">
            <span className="pony-hud-score">{hudData.score.toLocaleString()}점</span>
          </div>

          {hudData.combo > 1 && (
            <div className="pony-hud-item animate-bounce">
              <span className="bg-amber-500 text-amber-950 px-2 py-0.5 rounded-full text-xs font-black">
                {hudData.combo} COMBO!
              </span>
            </div>
          )}

          {/* Sound & Help Buttons */}
          <div className="flex items-center gap-1.5 ml-2">
            <button
              onClick={toggleSound}
              className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-amber-400 rounded-lg border border-amber-500/30 transition-colors"
              title={isMuted ? '음소거 해제' : '음소거'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsHowToPlayOpen(true)}
              className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-amber-400 rounded-lg border border-amber-500/30 transition-colors"
              title="게임 방법"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Game Canvas Area */}
      <div className="pony-canvas-wrapper">
        {/* Stage Letter Progress Bar */}
        <div className="pony-progress-bar-container">
          <div
            className="pony-progress-fill"
            style={{ width: `${(hudData.letters / TOTAL_LETTERS) * 100}%` }}
          />
        </div>

        {/* Stage Tag Overlay */}
        {gameState === 'PLAYING' && (
          <div className="pony-stage-banner">
            <span>Stage {hudData.stage}: {hudData.stageName}</span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="pony-canvas"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />

        {/* 3. Game Over / Victory Modal Overlay */}
        {gameState === 'GAMEOVER' && (
          <div className="pony-overlay animate-fadeIn">
            <div className="pony-title-card">
              <h2 className="pony-title-text">🎉 우편 배달 완료!</h2>
              <p className="pony-subtitle-text">웨스턴 타운에 무사히 편지를 배달했습니다!</p>
            </div>

            <div className="pony-result-box">
              <div className="pony-stars-row">{getStars()}</div>

              <div className="pony-stat-row">
                <span className="text-slate-300">수집한 편지</span>
                <span className="pony-stat-val">✉️ {hudData.letters} / {TOTAL_LETTERS}통</span>
              </div>

              <div className="pony-stat-row">
                <span className="text-slate-300">최대 연속 콤보</span>
                <span className="pony-stat-val">🔥 {logicRef.current?.maxCombo || 0} 콤보</span>
              </div>

              <div className="pony-stat-row">
                <span className="text-slate-300">장애물 충돌 횟수</span>
                <span className="pony-stat-val">💥 {logicRef.current?.hits || 0}회</span>
              </div>

              <div className="pony-stat-row pt-2 border-t border-amber-500/30">
                <span className="text-base font-bold text-amber-300">최종 달성 점수</span>
                <span className="text-xl font-black text-amber-400">{hudData.score.toLocaleString()} 점</span>
              </div>

              {/* Strict Dochon Rule: Score Registration Form only if score > 100, placeholder "예: 홍길동" */}
              {hudData.score > 100 ? (
                <div className="pony-submit-form">
                  <p className="text-xs text-amber-300/90 font-medium">
                    🏆 100점 돌파! 도촌초 명예의 전당에 이름을 등록하세요:
                  </p>
                  {!isSubmitted ? (
                    <form onSubmit={handleSubmitScore} className="pony-submit-input-group">
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="예: 홍길동"
                        maxLength={12}
                        className="pony-submit-input"
                        disabled={isSubmitting}
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting || !playerName.trim()}
                        className="pony-btn text-xs py-2 px-4 whitespace-nowrap"
                      >
                        {isSubmitting ? '등록 중...' : '기록 등록'}
                      </button>
                    </form>
                  ) : (
                    <div className="p-2.5 mt-2 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      도촌초 명예의 전당에 등록되었습니다!
                    </div>
                  )}
                  {submitError && (
                    <p className="text-xs text-rose-400 mt-1.5">{submitError}</p>
                  )}
                </div>
              ) : (
                <div className="mt-3 p-2 bg-slate-800/80 rounded-lg text-xs text-slate-400">
                  💡 100점을 초과하여 달성하면 도촌초 명예의 전당에 등록할 수 있습니다!
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-2">
              <button onClick={startGame} className="pony-btn">
                <RotateCcw className="w-4 h-4" /> 다시 달리기
              </button>
            </div>
          </div>
        )}

        {/* 4. Start Screen Overlay */}
        {gameState === 'START' && (
          <div className="pony-overlay animate-fadeIn">
            <div className="pony-title-card">
              <div className="text-4xl mb-2">🐎✉️</div>
              <h2 className="pony-title-text">도촌 포니 익스프레스</h2>
              <p className="pony-subtitle-text">100통의 편지를 싣고 서부 황무지를 가로질러 질주하세요!</p>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={startGame} className="pony-btn text-lg py-3 px-8 shadow-xl">
                <Play className="w-5 h-5 fill-current" /> 게임 시작
              </button>
              <button
                onClick={() => setIsHowToPlayOpen(true)}
                className="pony-btn pony-btn-secondary text-xs py-2 px-4"
              >
                <HelpCircle className="w-4 h-4" /> 게임 방법 보기
              </button>
            </div>
          </div>
        )}

        {/* 5. Pause Screen Overlay */}
        {gameState === 'PAUSED' && (
          <div className="pony-overlay animate-fadeIn">
            <div className="pony-title-card">
              <h2 className="pony-title-text">⏸️ 일시 정지</h2>
              <p className="pony-subtitle-text">잠시 숨을 고르고 있습니다.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={resumeGame} className="pony-btn">
                <Play className="w-4 h-4 fill-current" /> 계속하기
              </button>
              <button onClick={startGame} className="pony-btn pony-btn-secondary">
                <RotateCcw className="w-4 h-4" /> 재시작
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Controls Guide & Virtual Buttons for Touch/Mobile */}
      <div className="pony-controls-bar">
        <div className="pony-controls-guide">
          🎮 <strong>조작법:</strong> <kbd>↑</kbd>/<kbd>W</kbd> 위쪽 레인 · <kbd>↓</kbd>/<kbd>S</kbd> 아래쪽 레인 · <kbd>Space</kbd> 점프
        </div>

        <div className="pony-virtual-controls">
          <button onClick={handleVirtualUp} className="pony-virtual-btn" title="위쪽 레인으로 이동">
            <ChevronUp className="w-4 h-4" /> 위쪽
          </button>
          <button onClick={handleVirtualDown} className="pony-virtual-btn" title="아래쪽 레인으로 이동">
            <ChevronDown className="w-4 h-4" /> 아래쪽
          </button>
          <button onClick={handleVirtualJump} className="pony-virtual-btn bg-amber-600/30" title="장애물 점프">
            🦘 점프
          </button>
        </div>
      </div>

      {/* 7. How To Play Modal */}
      <PonyExpressHowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
}
