// Main React Component for Dochon Pangolin Adventure (도촌 천산갑의 모험)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PangolinGameLogic } from './pangolinLogic';
import { pangolinAudio } from './pangolinAudio';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import { CANVAS_WIDTH, CANVAS_HEIGHT, STAGES } from './pangolinConstants';
import PangolinHowToPlayModal from './PangolinHowToPlayModal';
import { Play, RotateCcw, Volume2, VolumeX, HelpCircle, Trophy, Award, ArrowRight, Zap, Compass, ArrowUp, ArrowLeft, ChevronRight } from 'lucide-react';
import './pangolin.css';

export default function PangolinGame({ onScoreSubmitted }) {
  const canvasRef = useRef(null);
  const logicRef = useRef(null);
  const reqIdRef = useRef(null);

  // Key states
  const keysRef = useRef({});
  const mobileInputRef = useRef({ left: false, right: false, jump: false, roll: false });
  const [padActive, setPadActive] = useState({ left: false, right: false, roll: false, jump: false });

  // Game Lifecycle State: 'START' | 'PLAYING' | 'STAGE_CLEAR' | 'VICTORY_ENDING' | 'GAMEOVER'
  const [gameState, setGameState] = useState('START');
  const [hudData, setHudData] = useState({
    score: 0,
    stageIndex: 0,
    stageName: STAGES[0].name,
    country: STAGES[0].country,
    itemEmoji: STAGES[0].itemEmoji,
    collected: 0,
    combo: 0,
    timeLeft: STAGES[0].timeLimit,
    distanceProgress: 0
  });

  // Sound Settings
  const [isMuted, setIsMuted] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // Score Submission State
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Initialize Game Logic instance
  useEffect(() => {
    logicRef.current = new PangolinGameLogic();
  }, []);

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    pangolinAudio.setMuted(next);
  };

  // Start / Restart
  const startGame = () => {
    if (!logicRef.current) {
      logicRef.current = new PangolinGameLogic();
    } else {
      logicRef.current = new PangolinGameLogic();
    }
    setIsSubmitted(false);
    setSubmitError('');
    setPlayerName('');
    setGameState('PLAYING');
    pangolinAudio.startBGM(1);
  };

  const handleNextStage = () => {
    if (logicRef.current) {
      logicRef.current.nextStage();
      setGameState('PLAYING');
      pangolinAudio.startBGM(logicRef.current.stageIndex + 1);
    }
  };

  // Strict Dochon Portal Rule: Score > 100 & Placeholder '예: 홍길동'
  const handleSubmitScore = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting || isSubmitted) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const finalScore = hudData.score;
      const success = await submitScoreToDB('pangolin', playerName.trim(), finalScore);

      if (success) {
        setIsSubmitted(true);
        if (onScoreSubmitted) {
          setTimeout(() => {
            onScoreSubmitted();
          }, 600);
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

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. STAGE_CLEAR 상태일 때 스페이스바 또는 엔터 입력 시 다음 스테이지 이동
      if (gameState === 'STAGE_CLEAR') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          handleNextStage();
          return;
        }
      }

      // 2. START 상태일 때 스페이스바 또는 엔터 입력 시 모험 시작
      if (gameState === 'START') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          startGame();
          return;
        }
      }

      // 3. 인게임 플레이 중 키 처리
      keysRef.current[e.code] = true;

      // Prevent scrolling on Space / Arrow Keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (gameState === 'PLAYING' && (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW')) {
        if (logicRef.current) {
          logicRef.current.jump();
        }
      }
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Main 60FPS Game Loop with Delta Time Normalization & React Throttling
  useEffect(() => {
    if (gameState !== 'PLAYING') {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      return;
    }

    let isRunning = true;
    let lastTime = performance.now();
    let lastHudUpdate = 0;

    const gameLoop = (timestamp) => {
      if (!isRunning) return;

      const elapsed = timestamp ? (timestamp - lastTime) : 16.666;
      lastTime = timestamp || performance.now();
      const dt = Math.min(48, Math.max(1, elapsed));

      const canvas = canvasRef.current;
      const logic = logicRef.current;

      if (canvas && logic) {
        const ctx = canvas.getContext('2d');

        // Update Physics with Delta-Time Normalization
        logic.update(
          keysRef.current,
          mobileInputRef.current.left,
          mobileInputRef.current.right,
          mobileInputRef.current.jump,
          mobileInputRef.current.roll,
          dt
        );

        // Render Canvas
        logic.draw(ctx);

        // Update HUD (Throttled to 75ms to eliminate React re-render lag on Chromebooks)
        const now = performance.now();
        if (now - lastHudUpdate > 75) {
          lastHudUpdate = now;
          const targetDist = logic.currentStage.targetDistance;
          const currentDist = Math.max(0, logic.player.worldX);
          const progress = Math.min(100, Math.floor((currentDist / targetDist) * 100));

          setHudData({
            score: logic.score,
            stageIndex: logic.stageIndex,
            stageName: logic.currentStage.name,
            country: logic.currentStage.country,
            itemEmoji: logic.currentStage.itemEmoji,
            collected: logic.totalCollected,
            combo: logic.combo,
            timeLeft: Math.ceil(logic.timeLeft),
            distanceProgress: progress
          });
        }

        // Check State Transitions
        if (logic.isGameWon) {
          setGameState('VICTORY_ENDING');
          pangolinAudio.stopBGM();
        } else if (logic.isStageCleared) {
          setGameState('STAGE_CLEAR');
          pangolinAudio.stopBGM();
        } else if (logic.isGameOver) {
          setGameState('GAMEOVER');
          pangolinAudio.stopBGM();
        }
      }

      reqIdRef.current = requestAnimationFrame(gameLoop);
    };

    reqIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      isRunning = false;
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
    };
  }, [gameState]);

  return (
    <div className="pangolin-wrapper">
      {/* 1. Top Custom Glassmorphism Header Bar */}
      <div className="pangolin-top-bar">
        <div className="pangolin-top-title-group">
          <span className="pangolin-top-title">
            <span>🦔</span>
            <span>도촌 천산갑의 모험</span>
          </span>
          <span className="pangolin-stage-badge">
            {hudData.stageName} ({hudData.stageIndex + 1}/4)
          </span>
        </div>

        <div className="pangolin-top-actions">
          {/* Custom Styled Sound Toggle Button */}
          <button
            onClick={toggleSound}
            className="pangolin-tool-btn"
            title={isMuted ? '소리 켜기' : '소리 끄기'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isMuted ? '음소거' : '소리 켜짐'}</span>
          </button>

          {/* Custom Styled How to Play Button */}
          <button
            onClick={() => setIsHowToPlayOpen(true)}
            className="pangolin-tool-btn"
            title="게임 가이드 및 조작 방법 확인"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>게임 방법</span>
          </button>
        </div>
      </div>

      {/* 2. Main Canvas Viewport */}
      <div className="pangolin-canvas-container">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="pangolin-canvas"
        />

        {/* 3. In-Game HUD Elements: Score (Left), Progress (Top Center), Time (Right) */}
        {gameState === 'PLAYING' && (
          <div className="pangolin-hud">
            {/* Left: Score & Combo */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="pangolin-hud-chip text-amber-300 border-amber-500/30">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>{hudData.score.toLocaleString()} 점</span>
              </div>
              {hudData.combo > 1 && (
                <div className="pangolin-hud-chip text-pink-300 border-pink-500/40 animate-pulse">
                  <span>🔥 COMBO x{hudData.combo}</span>
                </div>
              )}
            </div>

            {/* Top Center: Relocated Distance Progress Bar (캐릭터를 가리지 않도록 상단 배치) */}
            <div className="pangolin-progress-top">
              <div className="pangolin-progress-top-label">
                <span>{hudData.itemEmoji} {hudData.country}</span>
                <span>{hudData.distanceProgress}% 완주</span>
              </div>
              <div className="pangolin-progress-top-bg">
                <div
                  className="pangolin-progress-top-fill"
                  style={{ width: `${hudData.distanceProgress}%` }}
                />
              </div>
            </div>

            {/* Right: Time Left */}
            <div className="shrink-0">
              <div className={`pangolin-hud-chip ${hudData.timeLeft <= 10 ? 'text-rose-400 border-rose-500/50 animate-bounce' : 'text-sky-300'}`}>
                <span>⏱️ {hudData.timeLeft}초</span>
              </div>
            </div>
          </div>
        )}

        {/* START OVERLAY */}
        {gameState === 'START' && (
          <div className="pangolin-overlay-center">
            <div className="pangolin-result-box">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-4xl mx-auto mb-3 animate-bounce shadow-lg shadow-amber-500/20">
                🦔
              </div>
              <h2 className="text-xl font-black text-amber-300 mb-1">
                도촌 천산갑의 모험
              </h2>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                사랑하는 친구에게 감동적인 선물을 전하기 위해 떠나는 세계 여행!<br />
                몸을 공처럼 둥글게 말아 데굴데굴 구르고 점프하며 완주선에 도달하세요!
              </p>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700 text-left text-xs text-slate-300 space-y-1.5 mb-5 shadow-inner">
                <div className="font-bold text-amber-400 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5" /> 간편 조작 가이드
                </div>
                <div>• <strong className="text-white">좌/우 방향키 (또는 A, D / ◀ ▶)</strong>: 걷기 및 달리기</div>
                <div>• <strong className="text-white">Shift / Z 키 (또는 ⚡ 롤링)</strong>: 데굴데굴 고속 롤링 모드!</div>
                <div>• <strong className="text-white">스페이스바 (또는 ⬆️ 점프)</strong>: 점프 & 2단 더블 점프</div>
              </div>

              <button onClick={startGame} className="pangolin-btn-start w-full py-3">
                <Play className="w-5 h-5 fill-slate-950" />
                <span>모험 시작하기!</span>
              </button>
            </div>
          </div>
        )}

        {/* STAGE CLEAR OVERLAY */}
        {gameState === 'STAGE_CLEAR' && (
          <div className="pangolin-overlay-center">
            <div className="pangolin-result-box border-emerald-500/40">
              <div className="text-4xl mb-2 animate-bounce">🎉</div>
              <h2 className="text-xl font-black text-emerald-400 mb-1">
                {hudData.stageName} 클리어!
              </h2>
              <p className="text-xs text-slate-300 mb-4">
                선물 재료를 안전하게 모으고 다음 목적지로 향합니다!
              </p>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700 my-3 text-sm font-bold text-amber-300">
                현재 누적 점수: <span className="text-lg text-white">{hudData.score.toLocaleString()}</span> 점
              </div>

              <button onClick={handleNextStage} className="pangolin-btn-start w-full py-2.5 px-3 flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap">
                <span className="text-xs sm:text-sm font-extrabold whitespace-nowrap">
                  다음 스테이지로 이동 ({hudData.stageIndex + 2}/4)
                </span>
                <span className="text-[9px] sm:text-[10px] bg-amber-950/50 text-amber-200 px-1.5 py-0.5 rounded-full border border-amber-500/40 font-bold whitespace-nowrap shrink-0">
                  [Space / Enter]
                </span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* VICTORY GRAND ENDING OVERLAY */}
        {gameState === 'VICTORY_ENDING' && (
          <div className="pangolin-overlay-center">
            <div className="pangolin-result-box border-pink-500/50">
              <div className="text-5xl mb-2 animate-bounce">💖</div>
              <h2 className="text-2xl font-black text-pink-300 mb-1">
                해피 발렌타인! 모험 완주 성공!
              </h2>
              <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                4대 테마 월드를 모두 완주하여 사랑의 꽃다발과 선물을 완성했습니다!<br />
                <strong className="text-amber-400 font-extrabold">+5,000점 완주 보너스 획득! 🏆</strong>
              </p>

              <div className="bg-slate-900/90 p-3 rounded-xl border border-pink-500/30 my-3">
                <div className="text-xs text-slate-400">최종 획득 점수</div>
                <div className="text-3xl font-black text-amber-300 my-0.5">
                  {hudData.score.toLocaleString()} <span className="text-sm font-bold text-slate-300">점</span>
                </div>
              </div>

              {/* Strict Rule: Score > 100 Form */}
              {hudData.score > 100 && (
                <div className="mt-3 text-left">
                  {!isSubmitted ? (
                    <form onSubmit={handleSubmitScore} className="space-y-2">
                      <label className="block text-xs font-bold text-amber-300">
                        🏆 도촌초등학교 명예의 전당 랭킹 등록
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                          placeholder="예: 홍길동"
                          maxLength={10}
                          className="pangolin-input-name"
                          disabled={isSubmitting}
                          autoFocus
                        />
                        <button
                          type="submit"
                          disabled={isSubmitting || !playerName.trim()}
                          className="pangolin-btn-submit shrink-0"
                        >
                          {isSubmitting ? '등록 중...' : '점수 등록'}
                        </button>
                      </div>
                      {submitError && (
                        <p className="text-[11px] text-rose-400 font-bold">{submitError}</p>
                      )}
                    </form>
                  ) : (
                    <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-center text-xs font-bold text-emerald-300">
                      ✨ 명예의 전당에 랭킹이 성공적으로 등록되었습니다!
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button onClick={startGame} className="pangolin-btn-start flex-1 py-2.5">
                  <RotateCcw className="w-4 h-4" />
                  <span>다시 도전하기</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GAMEOVER OVERLAY */}
        {gameState === 'GAMEOVER' && (
          <div className="pangolin-overlay-center">
            <div className="pangolin-result-box border-rose-500/50">
              <div className="text-4xl mb-2">⏱️</div>
              <h2 className="text-xl font-black text-rose-400 mb-1">
                제한 시간 초과!
              </h2>
              <p className="text-xs text-slate-300 mb-3">
                아쉽게도 완주선에 도달하지 못했습니다. 다음엔 더 빠르게 굴러보세요!
              </p>

              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-700 my-3">
                <div className="text-xs text-slate-400">최종 점수</div>
                <div className="text-2xl font-black text-amber-300 my-0.5">
                  {hudData.score.toLocaleString()} <span className="text-xs font-bold text-slate-300">점</span>
                </div>
              </div>

              {/* Strict Rule: Score > 100 Form */}
              {hudData.score > 100 && (
                <div className="mt-3 text-left">
                  {!isSubmitted ? (
                    <form onSubmit={handleSubmitScore} className="space-y-2">
                      <label className="block text-xs font-bold text-amber-300">
                        🏆 도촌초등학교 명예의 전당 랭킹 등록
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                          placeholder="예: 홍길동"
                          maxLength={10}
                          className="pangolin-input-name"
                          disabled={isSubmitting}
                          autoFocus
                        />
                        <button
                          type="submit"
                          disabled={isSubmitting || !playerName.trim()}
                          className="pangolin-btn-submit shrink-0"
                        >
                          {isSubmitting ? '등록 중...' : '점수 등록'}
                        </button>
                      </div>
                      {submitError && (
                        <p className="text-[11px] text-rose-400 font-bold">{submitError}</p>
                      )}
                    </form>
                  ) : (
                    <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-center text-xs font-bold text-emerald-300">
                      ✨ 명예의 전당에 랭킹이 성공적으로 등록되었습니다!
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4">
                <button onClick={startGame} className="pangolin-btn-start w-full py-2.5">
                  <RotateCcw className="w-4 h-4" />
                  <span>처음부터 다시하기</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Universal Tablet & Mobile Gamepad Controller Bar */}
      <div className="pangolin-gamepad-bar">
        {/* Left Direction Pad: Left & Right */}
        <div className="pangolin-pad-group">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              mobileInputRef.current.left = true;
              setPadActive(p => ({ ...p, left: true }));
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              mobileInputRef.current.left = false;
              setPadActive(p => ({ ...p, left: false }));
            }}
            onPointerLeave={() => {
              mobileInputRef.current.left = false;
              setPadActive(p => ({ ...p, left: false }));
            }}
            className={`pangolin-pad-btn ${padActive.left ? 'is-active' : ''}`}
            title="왼쪽으로 이동 (A / ◀)"
          >
            <span>◀ 왼쪽</span>
            <span className="pangolin-pad-key-hint">[A / ◀]</span>
          </button>

          <button
            onPointerDown={(e) => {
              e.preventDefault();
              mobileInputRef.current.right = true;
              setPadActive(p => ({ ...p, right: true }));
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              mobileInputRef.current.right = false;
              setPadActive(p => ({ ...p, right: false }));
            }}
            onPointerLeave={() => {
              mobileInputRef.current.right = false;
              setPadActive(p => ({ ...p, right: false }));
            }}
            className={`pangolin-pad-btn ${padActive.right ? 'is-active' : ''}`}
            title="오른쪽으로 이동 및 질주 (D / ▶)"
          >
            <span>오른쪽 ▶</span>
            <span className="pangolin-pad-key-hint">[D / ▶]</span>
          </button>
        </div>

        {/* Right Action Pad: Roll & Jump */}
        <div className="pangolin-pad-group">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              mobileInputRef.current.roll = true;
              setPadActive(p => ({ ...p, roll: true }));
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              mobileInputRef.current.roll = false;
              setPadActive(p => ({ ...p, roll: false }));
            }}
            onPointerLeave={() => {
              mobileInputRef.current.roll = false;
              setPadActive(p => ({ ...p, roll: false }));
            }}
            className={`pangolin-pad-btn btn-roll ${padActive.roll ? 'is-active' : ''}`}
            title="몸을 둥글게 말아 데굴데굴 고속 질주 (Shift / Z)"
          >
            <span>⚡ 롤링</span>
            <span className="pangolin-pad-key-hint">[Shift / Z]</span>
          </button>

          <button
            onPointerDown={(e) => {
              e.preventDefault();
              setPadActive(p => ({ ...p, jump: true }));
              if (logicRef.current && gameState === 'PLAYING') {
                logicRef.current.jump();
              }
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              setPadActive(p => ({ ...p, jump: false }));
            }}
            onPointerLeave={() => {
              setPadActive(p => ({ ...p, jump: false }));
            }}
            className={`pangolin-pad-btn btn-jump ${padActive.jump ? 'is-active' : ''}`}
            title="점프 및 2단 도약 (Space / ⬆)"
          >
            <span>🦘 점프</span>
            <span className="pangolin-pad-key-hint">[Space / ⬆]</span>
          </button>
        </div>
      </div>

      {/* 5. How to Play Guide Modal */}
      <PangolinHowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
}
