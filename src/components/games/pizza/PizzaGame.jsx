// Dochon Pizza Master - Main Game Controller Component
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PizzaEngine } from './pizzaEngine';
import { pizzaAudio } from './pizzaAudio';
import PizzaHowToPlayModal from './PizzaHowToPlayModal';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  STAGES,
  TOTAL_STAGES,
  TOPPING_INFO,
  SCORE_BASE_SUCCESS,
  SCORE_PER_PERFECT_STAR,
  SCORE_COMBO_MULTIPLIER,
  SCORE_TIME_BONUS_PER_SEC,
  SCORE_ALL_CLEAR_BONUS
} from './pizzaConstants';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import { haptics } from '../../../utils/haptics';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  RotateCcw,
  Trophy,
  Star,
  Scissors,
  CheckCircle2,
  AlertCircle,
  Play,
  Flame,
  Clock,
  Sparkles,
  Award,
  Crown
} from 'lucide-react';
import './pizza.css';

export default function PizzaGame({ onScoreSubmitted }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const animFrameIdRef = useRef(null);

  // Game States
  const [isPlaying, setIsPlaying] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [currentStage, setCurrentStage] = useState(STAGES[0]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(STAGES[0].timeLimit);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameClear, setIsGameClear] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem('dochon_pizza_highscore')) || 0;
    } catch (e) {
      return 0;
    }
  });

  // Stage Result / Feedback state
  const [stageResult, setStageResult] = useState(null); // { isSuccess, stars, message, uniformityScore }
  const [cutsRemaining, setCutsRemaining] = useState(STAGES[0].maxCuts);

  // Audio & How to play modal
  const [isMuted, setIsMuted] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // Hall of Fame Leaderboard Submission States
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Real-time animation loop (Capped at 30FPS for 50% GPU Reduction)
  const lastRenderTimeRef = useRef(0);
  const TARGET_FPS = 30;
  const FRAME_INTERVAL = 1000 / TARGET_FPS; // 33.33ms

  const renderLoop = useCallback(() => {
    try {
      const currentTime = performance.now();
      const elapsed = currentTime - lastRenderTimeRef.current;

      if (elapsed >= FRAME_INTERVAL) {
        lastRenderTimeRef.current = currentTime - (elapsed % FRAME_INTERVAL);
        if (engineRef.current && currentStage) {
          engineRef.current.render(currentStage);
        }
      }
    } catch (err) {
      console.error('[Pizza Render Error]', err);
    } finally {
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    }
  }, [currentStage]);

  // Initialize Canvas & Engine
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      const engine = new PizzaEngine(canvas);
      engineRef.current = engine;
      renderLoop();
    }
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [renderLoop]);

  // Stage Setup function
  const loadStage = useCallback((index) => {
    if (index >= STAGES.length) return;
    const stage = STAGES[index];

    setCurrentStage(stage);
    setTimeLeft(stage.timeLimit);
    setCutsRemaining(stage.maxCuts);
    setStageResult(null);

    if (engineRef.current) {
      engineRef.current.reset();
    }
    pizzaAudio.playOrderBell();
  }, []);

  // Start Game
  const handleStartGame = () => {
    haptics.medium();
    setIsPlaying(true);
    setIsGameOver(false);
    setIsGameClear(false);
    setScore(0);
    setCombo(0);
    setStageIndex(0);
    loadStage(0);
    pizzaAudio.playClick();
  };

  // Timer Tick
  useEffect(() => {
    if (!isPlaying || isGameOver || stageResult) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, isGameOver, stageResult]);

  // Game Over Handler
  const handleGameOver = () => {
    setIsGameOver(true);
    setStageResult(null);
    pizzaAudio.playFail();
    setHighScore(prev => {
      const newHigh = Math.max(prev, score);
      try {
        localStorage.setItem('dochon_pizza_highscore', String(newHigh));
      } catch (e) {}
      return newHigh;
    });
  };

  // Convert Pointer Coordinates to Canvas Resolution (640 x 560)
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  // Pointer Down (Start dragging cut line)
  const handlePointerDown = (e) => {
    if (!isPlaying || isGameOver || stageResult || cutsRemaining <= 0) return;
    const coords = getCanvasCoords(e);
    const engine = engineRef.current;
    if (engine) {
      engine.isDragging = true;
      engine.dragStart = coords;
      engine.dragCurrent = coords;
    }
  };

  // Pointer Move (Update dragging laser line)
  const handlePointerMove = (e) => {
    const engine = engineRef.current;
    if (!engine || !engine.isDragging) return;
    const coords = getCanvasCoords(e);
    engine.dragCurrent = coords;
  };

  // Pointer Up (Finalize cut)
  const handlePointerUp = (e) => {
    const engine = engineRef.current;
    if (!engine || !engine.isDragging) return;

    const start = engine.dragStart;
    const end = engine.dragCurrent;
    engine.isDragging = false;
    engine.dragStart = null;
    engine.dragCurrent = null;

    if (start && end) {
      const isCutAdded = engine.addCut(start, end);
      if (isCutAdded) {
        pizzaAudio.playSlice();
        haptics.light();
        const nextCuts = cutsRemaining - 1;
        setCutsRemaining(nextCuts);

        // Auto validate if max cuts reached
        if (nextCuts === 0) {
          setTimeout(() => {
            validatePizza();
          }, 300);
        }
      }
    }
  };

  // Reset current stage cut lines
  const handleResetCuts = () => {
    if (!isPlaying || isGameOver || stageResult) return;
    haptics.light();
    pizzaAudio.playClick();
    if (engineRef.current) {
      engineRef.current.reset();
    }
    setCutsRemaining(currentStage.maxCuts);
  };

  // Validate Pizza Cutting against Stage Requirements
  const validatePizza = () => {
    const engine = engineRef.current;
    if (!engine || !currentStage) return;

    const result = engine.validateStage(currentStage);
    setStageResult(result);

    if (result.isSuccess) {
      pizzaAudio.playSuccess();
      haptics.success();

      // Trigger sparkle particles at center
      engine.spawnSparkles(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 20);

      // Score Calculation
      const stars = result.stars;
      const timeBonus = timeLeft * SCORE_TIME_BONUS_PER_SEC;
      const comboBonus = combo * SCORE_COMBO_MULTIPLIER;
      const stageScore = SCORE_BASE_SUCCESS + stars * SCORE_PER_PERFECT_STAR + timeBonus + comboBonus;

      setScore(prev => prev + stageScore);
      setCombo(prev => prev + 1);

      // Play Star sounds with slight delay
      for (let i = 0; i < stars; i++) {
        setTimeout(() => {
          pizzaAudio.playStar(i);
        }, 150 * (i + 1));
      }
    } else {
      pizzaAudio.playFail();
      haptics.warning();
      setCombo(0); // Reset combo on fail
    }
  };

  // Next Stage Button
  const handleNextStage = () => {
    haptics.medium();
    pizzaAudio.playClick();
    setStageResult(null);
    const nextIdx = stageIndex + 1;

    if (nextIdx >= TOTAL_STAGES) {
      // 🎉 All 10 Stages Cleared! Total Victory Ending!
      setIsGameClear(true);
      setIsGameOver(true);
      pizzaAudio.playSuccess();
      haptics.success();

      const finalTotalScore = score + SCORE_ALL_CLEAR_BONUS;
      setScore(finalTotalScore);
      setHighScore(prev => {
        const newHigh = Math.max(prev, finalTotalScore);
        try {
          localStorage.setItem('dochon_pizza_highscore', String(newHigh));
        } catch (e) {}
        return newHigh;
      });
    } else {
      setStageIndex(nextIdx);
      loadStage(nextIdx);
    }
  };

  // Retry Current Stage on Fail
  const handleRetryStage = () => {
    haptics.light();
    pizzaAudio.playClick();
    loadStage(stageIndex);
  };

  // Hall of Fame Leaderboard Submission
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await submitScoreToDB('pizza', playerName.trim(), score);
      if (res) {
        setIsSubmitted(true);
        haptics.success();
        pizzaAudio.playSuccess();
        setTimeout(() => {
          if (onScoreSubmitted) {
            onScoreSubmitted();
          }
        }, 700);
      } else {
        setSubmitError('등록 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } catch (err) {
      setSubmitError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sound Toggle
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    pizzaAudio.setMuted(nextMuted);
  };

  return (
    <div className="pizza-game-container">
      {/* 1. Top HUD Statistics */}
      <div className="pizza-hud">
        <div className="pizza-hud-stat">
          <span className="pizza-hud-label">점수</span>
          <span className="pizza-hud-value gold">{score.toLocaleString()}</span>
        </div>

        {combo > 1 && (
          <div className="pizza-hud-stat">
            <span className="pizza-hud-label">연속 성공</span>
            <span className="pizza-hud-value combo flex items-center gap-1">
              <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
              {combo} COMBO!
            </span>
          </div>
        )}

        <div className="pizza-hud-stat">
          <span className="pizza-hud-label">남은 시간</span>
          <span className="pizza-hud-value flex items-center gap-1">
            <Clock className="w-4 h-4 text-amber-400" />
            {timeLeft}초
          </span>
        </div>

        <div className="pizza-hud-stat">
          <span className="pizza-hud-label">최고 기록</span>
          <span className="pizza-hud-value">{highScore.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="pizza-btn-icon"
            title={isMuted ? '소리 켜기' : '소리 끄기'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsHowToPlayOpen(true)}
            className="pizza-btn-icon"
            title="게임 방법"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Customer Order Ticket Card */}
      {isPlaying && !isGameOver && currentStage && (
        <div className="pizza-order-card">
          <div className="pizza-order-header">
            <div className="pizza-customer-badge">
              <span className="pizza-customer-avatar">{currentStage.customerAvatar}</span>
              <span className="pizza-customer-name">
                {currentStage.customerName}의 주문 <span className="text-amber-300 font-bold ml-1">({stageIndex + 1}/{TOTAL_STAGES})</span>
              </span>
            </div>
            <span className="pizza-fraction-badge">{currentStage.fractionText}</span>
          </div>

          <p className="pizza-order-speech">"{currentStage.customerSpeech}"</p>

          <div className="pizza-reqs-row">
            {currentStage.requirements.map((req, i) => (
              <div key={i} className="pizza-req-pill">
                <span>{TOPPING_INFO[req.type]?.emoji}</span>
                <span>{req.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Timer Progress Bar */}
      {isPlaying && !isGameOver && (
        <div className="pizza-timer-bar-wrap">
          <div
            className="pizza-timer-bar-fill"
            style={{ width: `${(timeLeft / (currentStage?.timeLimit || 30)) * 100}%` }}
          />
        </div>
      )}

      {/* 4. Canvas Play Area */}
      <div className="pizza-canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="pizza-canvas"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />

        {/* Cuts indicator badge */}
        {isPlaying && !isGameOver && !stageResult && (
          <div className="pizza-cuts-hud">
            <Scissors className="w-3.5 h-3.5 text-amber-400" />
            <span>남은 컷: {cutsRemaining}회</span>
            <div className="flex items-center gap-1 ml-1.5">
              {Array.from({ length: currentStage.maxCuts }).map((_, idx) => (
                <div
                  key={idx}
                  className={`pizza-cut-dot ${idx < cutsRemaining ? 'active' : ''}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Stage Result / Clear Overlay */}
        {stageResult && (
          <div className="pizza-stage-result-overlay">
            <div className={`text-5xl mb-3 ${stageResult.isSuccess ? 'animate-bounce' : ''}`}>
              {stageResult.isSuccess ? '🍕' : '😢'}
            </div>

            <h3 className={`text-2xl sm:text-3xl font-black mb-2 tracking-tight ${stageResult.isSuccess ? 'text-amber-400' : 'text-rose-400'}`}>
              {stageResult.isSuccess ? (stageIndex + 1 === TOTAL_STAGES ? '🎉 최종 승급전 완수!' : '주문 완수 성공!') : '주문 실패!'}
            </h3>

            <p className="text-base sm:text-lg text-slate-100 font-medium max-w-sm mb-4 leading-relaxed">
              {stageResult.message}
            </p>

            {/* Stars row */}
            {stageResult.isSuccess && (
              <div className="pizza-stars-row">
                {[1, 2, 3].map(s => (
                  <Star
                    key={s}
                    className={`pizza-star-icon ${s <= stageResult.stars ? 'filled' : ''}`}
                  />
                ))}
              </div>
            )}

            <div className="text-sm sm:text-base text-slate-200 mb-6 font-semibold">
              분할 정확도: <strong className="text-amber-400 font-black text-xl sm:text-2xl ml-1">{stageResult.uniformityScore}%</strong>
            </div>

            <div className="flex items-center gap-3">
              {stageResult.isSuccess ? (
                <button onClick={handleNextStage} className="pizza-btn pizza-btn-serve py-3.5 px-8 text-base sm:text-lg">
                  {stageIndex + 1 === TOTAL_STAGES ? (
                    <>
                      <Crown className="w-5 h-5 text-slate-950" />
                      <span>최종 결과 & 마스터 등극</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-slate-950" />
                      <span>다음 주문 받기 ({stageIndex + 2}/{TOTAL_STAGES})</span>
                    </>
                  )}
                </button>
              ) : (
                <button onClick={handleRetryStage} className="pizza-btn pizza-btn-serve py-3.5 px-8 text-base sm:text-lg">
                  <RotateCcw className="w-5 h-5 text-slate-950" />
                  <span>다시 자르기</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Start Game Splash Overlay */}
        {!isPlaying && !isGameOver && (
          <div className="pizza-stage-result-overlay">
            <div className="text-6xl mb-3 animate-pulse">🍕</div>
            <h2 className="text-3xl font-black text-amber-400 mb-2 tracking-tight">도촌 피자 마스터</h2>
            <p className="text-sm sm:text-base text-slate-100 font-semibold max-w-xs mb-7 leading-relaxed">
              피자를 자르고 분수를 마스터하라!<br />
              총 10개 코스 주문을 완성하고 마스터 셰프에 등극해보세요! (플레이 타임 약 2분)
            </p>
            <button
              onClick={handleStartGame}
              className="pizza-btn pizza-btn-serve py-3.5 px-9 text-base sm:text-lg font-black shadow-2xl"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>주방 오픈 & 10개 코스 도전</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. Bottom Action Bar */}
      {isPlaying && !isGameOver && !stageResult && (
        <div className="pizza-action-bar">
          <button onClick={handleResetCuts} className="pizza-btn pizza-btn-reset">
            <RotateCcw className="w-5 h-5" />
            <span>컷팅 초기화</span>
          </button>

          <button
            onClick={validatePizza}
            disabled={engineRef.current?.cuts.length === 0}
            className="pizza-btn pizza-btn-serve"
          >
            <CheckCircle2 className="w-5 h-5 text-slate-950" />
            <span>피자 서빙하기 ({currentStage.targetSlices}등분 확인)</span>
          </button>
        </div>
      )}

      {/* 6. Game Over & Hall of Fame Modal (Responsive Overlay Popup) */}
      {isGameOver && (
        <div className="pizza-gameover-overlay">
          <div className="pizza-gameover-card">
            <span className="pizza-gameover-icon">
              {isGameClear ? '👑' : '⏰'}
            </span>

            <div className="pizza-gameover-badge">
              {isGameClear ? (
                <>
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>10개 코스 완주 제패</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>도달 코스 {stageIndex + 1}/{TOTAL_STAGES}</span>
                </>
              )}
            </div>

            <h2 className="pizza-gameover-title">
              {isGameClear ? '전설의 피자 마스터 등극!' : '영업 마감!'}
            </h2>

            <p className="pizza-gameover-desc">
              {isGameClear
                ? '축하합니다! 10개 코스를 완벽하게 제패하여 도촌 최고의 피자 셰프로 인증되었습니다!'
                : `오늘의 피자 주방 영업이 마감되었습니다. (총 ${TOTAL_STAGES}개 코스 중 ${stageIndex + 1}단계 도달)`}
            </p>

            {/* Score Display Card */}
            <div className="pizza-score-card">
              <div className="pizza-score-label">최종 달성 점수</div>
              <div className="pizza-score-number">{score.toLocaleString()}점</div>
              {isGameClear && (
                <div className="pizza-score-bonus">
                  ✨ 10개 코스 완주 보너스 (+5,000점) 포함!
                </div>
              )}
            </div>

            {/* Hall of Fame Submission Form (Strictly > 100 points rule) */}
            {score > 100 ? (
              <div className="pizza-hall-card">
                <div className="pizza-hall-header">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span>명예의 전당 점수 등록</span>
                </div>

                {isSubmitted ? (
                  <div className="pizza-hall-success">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>명예의 전당에 랭킹이 성공적으로 등록되었습니다!</span>
                  </div>
                ) : (
                  <form onSubmit={handleScoreSubmit} className="pizza-input-group">
                    <div>
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="예: 홍길동"
                        maxLength={10}
                        required
                        className="pizza-hall-input"
                      />
                    </div>
                    {submitError && (
                      <p className="text-xs text-rose-400 font-bold">{submitError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting || !playerName.trim()}
                      className="pizza-btn-submit-hall"
                    >
                      <Trophy className="w-4 h-4 text-slate-950" />
                      <span>{isSubmitting ? '등록 중...' : '명예의 전당에 기록하기'}</span>
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mb-5 font-semibold">
                (100점 초과 달성 시 명예의 전당에 등록할 수 있습니다)
              </p>
            )}

            {/* Restart Button */}
            <button onClick={handleStartGame} className="pizza-btn-restart">
              <RotateCcw className="w-5 h-5" />
              <span>{isGameClear ? '처음부터 다시 도전하기' : '다시 도전하기'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 7. How To Play Modal */}
      <PizzaHowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
}
