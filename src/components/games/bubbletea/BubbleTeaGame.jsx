import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BubbleTeaEngine } from './bubbleTeaEngine';
import { bubbleTeaAudio } from './bubbleTeaAudio';
import BubbleTeaHowToPlayModal from './BubbleTeaHowToPlayModal';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CUSTOMERS,
  RECIPES,
  STEP_PEARLS,
  STEP_TEA,
  STEP_SYRUP,
  STEP_SERVE,
  RATING_CONFIG,
  TOTAL_CUSTOMERS_PER_DAY
} from './bubbleTeaConstants';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import { haptics } from '../../../utils/haptics';
import { Volume2, VolumeX, HelpCircle, RotateCcw, Trophy, Star, Sparkles, Check, Heart, Play } from 'lucide-react';
import './bubbletea.css';

export default function BubbleTeaGame({ onScoreSubmitted }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const animFrameIdRef = useRef(null);

  // Game Progress States
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem('dochon_bubbletea_highscore')) || 0;
    } catch (e) {
      return 0;
    }
  });
  const [customerIndex, setCustomerIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(STEP_PEARLS);
  const [fillProgress, setFillProgress] = useState(0);
  const [syrupFill, setSyrupFill] = useState(0);
  const [isPouring, setIsPouring] = useState(false);
  const [isServing, setIsServing] = useState(false);
  const [combo, setCombo] = useState(0);
  const [customerEmotion, setCustomerEmotion] = useState('normal');
  const [dayComplete, setDayComplete] = useState(false);

  // Sound & Modals
  const [isMuted, setIsMuted] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // Leaderboard Submission
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Refs for real-time loop synchronization
  const isPouringRef = useRef(false);
  const fillProgressRef = useRef(0);
  const syrupFillRef = useRef(0);
  const currentStepRef = useRef(STEP_PEARLS);
  const customerIndexRef = useRef(0);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);

  isPouringRef.current = isPouring;
  fillProgressRef.current = fillProgress;
  syrupFillRef.current = syrupFill;
  currentStepRef.current = currentStep;
  customerIndexRef.current = customerIndex;
  scoreRef.current = score;
  comboRef.current = combo;

  const currentCustomer = CUSTOMERS[customerIndex % CUSTOMERS.length];
  const currentRecipe = RECIPES[customerIndex % RECIPES.length];

  // Initialize Canvas & Engine
  useEffect(() => {
    if (canvasRef.current) {
      engineRef.current = new BubbleTeaEngine(canvasRef.current);
    }
  }, []);

  // Update High Score Persistence
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      try {
        localStorage.setItem('dochon_bubbletea_highscore', String(score));
      } catch (e) {}
    }
  }, [score, highScore]);

  // Main 30FPS Game Loop (Capped at 30FPS for 50% GPU Reduction)
  useEffect(() => {
    const TARGET_FPS = 30;
    const FRAME_INTERVAL = 1000 / TARGET_FPS; // 33.33ms
    let lastRenderTime = performance.now();
    let pearlSpawnTimer = 0;

    const loop = (currentTime) => {
      try {
        const elapsed = currentTime - lastRenderTime;

        if (elapsed >= FRAME_INTERVAL) {
          lastRenderTime = currentTime - (elapsed % FRAME_INTERVAL);
          const dt = Math.min(elapsed / 1000, 0.08);

          const engine = engineRef.current;
          if (engine && canvasRef.current) {
            // Pouring physics simulation
            if (isPouringRef.current && currentStepRef.current <= STEP_SYRUP) {
              const step = currentStepRef.current;
              const recipe = RECIPES[customerIndexRef.current % RECIPES.length];

              // Pour rate
              const fillSpeed = step === STEP_PEARLS ? 0.32 : step === STEP_TEA ? 0.38 : 0.30;
              const newFill = Math.min(fillProgressRef.current + fillSpeed * dt, 0.98);
              fillProgressRef.current = newFill;
              setFillProgress(newFill);

              if (step === STEP_SYRUP) {
                const newSyrup = Math.min(syrupFillRef.current + fillSpeed * dt, 0.25);
                syrupFillRef.current = newSyrup;
                setSyrupFill(newSyrup);
              }

              // Sound pitch updates
              bubbleTeaAudio.updatePourPitch(newFill);

              // Spawn visual entities
              if (step === STEP_PEARLS) {
                pearlSpawnTimer += dt;
                if (pearlSpawnTimer >= 0.08) {
                  pearlSpawnTimer = 0;
                  engine.spawnPearl(recipe, recipe.line1Pct);
                  bubbleTeaAudio.playBubbleDrop();
                }
              } else {
                engine.spawnLiquidStream(recipe, step);
              }
            }

            // Engine physics & rendering
            engine.update(
              isPouringRef.current,
              currentStepRef.current,
              RECIPES[customerIndexRef.current % RECIPES.length],
              fillProgressRef.current
            );

            engine.render({
              customer: CUSTOMERS[customerIndexRef.current % CUSTOMERS.length],
              recipe: RECIPES[customerIndexRef.current % RECIPES.length],
              currentStep: currentStepRef.current,
              fillProgress: fillProgressRef.current,
              syrupFill: syrupFillRef.current,
              isPouring: isPouringRef.current,
              isServing,
              customerEmotion
            });
          }
        }
      } catch (err) {
        console.error('[BubbleTea Loop Error]', err);
      } finally {
        animFrameIdRef.current = requestAnimationFrame(loop);
      }
    };

    lastRenderTime = performance.now();
    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [customerIndex, customerEmotion, isServing]);

  // Start Pouring Handler
  const startPouring = useCallback(() => {
    if (isServing || dayComplete || currentStep > STEP_SYRUP) return;
    if (!isPouringRef.current) {
      isPouringRef.current = true;
      setIsPouring(true);
      haptics.light();
      const isSyrup = currentStep === STEP_SYRUP;
      bubbleTeaAudio.startPour(isSyrup ? 'syrup' : 'tea');
    }
  }, [isServing, dayComplete, currentStep]);

  // Stop Pouring & Step Accuracy Rating Handler
  const stopPouring = useCallback(() => {
    if (!isPouringRef.current || isServing || dayComplete) return;

    isPouringRef.current = false;
    setIsPouring(false);
    bubbleTeaAudio.stopPour();

    const recipe = currentRecipe;
    const step = currentStepRef.current;
    const currentPct = fillProgressRef.current;

    // Determine target percentage based on step
    let targetPct = recipe.line1Pct;
    if (step === STEP_TEA) targetPct = recipe.line2Pct;
    if (step === STEP_SYRUP) targetPct = recipe.line3Pct;

    // Pixel distance error calculation (Cup height is 230px)
    const errorPx = Math.abs(currentPct - targetPct) * 230;

    // Rating determination
    let rating = RATING_CONFIG.MISS;
    let stars = 0;
    if (errorPx <= RATING_CONFIG.PERFECT.maxDiff) {
      rating = RATING_CONFIG.PERFECT;
      stars = 3;
    } else if (errorPx <= RATING_CONFIG.GREAT.maxDiff) {
      rating = RATING_CONFIG.GREAT;
      stars = 2;
    } else if (errorPx <= RATING_CONFIG.GOOD.maxDiff) {
      rating = RATING_CONFIG.GOOD;
      stars = 1;
    }

    // Audio & Haptics feedback
    bubbleTeaAudio.playRatingChime(stars);
    if (stars === 3) haptics.heavy();
    else if (stars >= 1) haptics.medium();
    else haptics.light();

    // Score & Combo calculation
    let earnedScore = rating.score;
    let nextCombo = comboRef.current;

    if (stars === 3) {
      nextCombo += 1;
      earnedScore = Math.round(earnedScore * (1 + nextCombo * 0.2));
      setCustomerEmotion('perfect');
    } else if (stars >= 1) {
      nextCombo = 0;
      setCustomerEmotion('happy');
    } else {
      nextCombo = 0;
      setCustomerEmotion('miss');
    }

    setCombo(nextCombo);
    setScore(prev => prev + earnedScore);

    // Floating text & Sparkles
    const engine = engineRef.current;
    if (engine) {
      const comboText = nextCombo > 1 ? ` (x${nextCombo})` : '';
      engine.addFloatingText(`${rating.label}${comboText} +${earnedScore}`, 400, 320, rating.color);
      if (stars >= 2) {
        engine.addSparkles(400, 340, stars === 3 ? 25 : 12);
      }
    }

    // Advance to next step or complete drink
    if (step === STEP_PEARLS) {
      setTimeout(() => {
        setCurrentStep(STEP_TEA);
        setCustomerEmotion('normal');
      }, 400);
    } else if (step === STEP_TEA) {
      setTimeout(() => {
        setCurrentStep(STEP_SYRUP);
        setCustomerEmotion('normal');
      }, 400);
    } else if (step === STEP_SYRUP) {
      // Step 3 finished -> Transition to Serving Ceremony
      setCurrentStep(STEP_SERVE);
      setIsServing(true);
      setCustomerEmotion(stars >= 2 ? 'perfect' : 'happy');

      setTimeout(() => {
        bubbleTeaAudio.playStrawPop();
        haptics.heavy();
      }, 350);

      setTimeout(() => {
        bubbleTeaAudio.playSlurp();
        if (engineRef.current) {
          engineRef.current.addSparkles(650, 260, 20);
        }
      }, 750);

      // Advance to next customer or complete day
      setTimeout(() => {
        const nextIdx = customerIndexRef.current + 1;
        if (nextIdx >= TOTAL_CUSTOMERS_PER_DAY) {
          // All customers served -> Day Complete
          setDayComplete(true);
          bubbleTeaAudio.playVictoryFanfare();
          if (engineRef.current) {
            engineRef.current.addSparkles(400, 300, 40);
          }
        } else {
          // Next Customer
          setCustomerIndex(nextIdx);
          setCurrentStep(STEP_PEARLS);
          setFillProgress(0);
          setSyrupFill(0);
          fillProgressRef.current = 0;
          syrupFillRef.current = 0;
          setIsServing(false);
          setCustomerEmotion('normal');
          if (engineRef.current) {
            engineRef.current.reset();
          }
        }
      }, 2200);
    }
  }, [currentRecipe, isServing, dayComplete]);

  // Keyboard Space Bar Controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        startPouring();
      }
    };
    const handleKeyUp = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        stopPouring();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startPouring, stopPouring]);

  // Reset / Restart Entire Day
  const handleRestart = () => {
    bubbleTeaAudio.playClick();
    haptics.light();
    setScore(0);
    setCustomerIndex(0);
    setCurrentStep(STEP_PEARLS);
    setFillProgress(0);
    setSyrupFill(0);
    fillProgressRef.current = 0;
    syrupFillRef.current = 0;
    setIsPouring(false);
    setIsServing(false);
    setCombo(0);
    setCustomerEmotion('normal');
    setDayComplete(false);
    setIsSubmitted(false);
    setSubmitError('');
    setPlayerName('');
    if (engineRef.current) {
      engineRef.current.reset();
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    bubbleTeaAudio.setMuted(next);
  };

  // Hall of Fame Leaderboard Submission
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || isSubmitted) return;

    const trimmedName = playerName.trim();
    if (!trimmedName) {
      setSubmitError('이름을 입력해주세요!');
      return;
    }

    if (score <= 100) {
      setSubmitError('100점을 초과해야 명예의 전당에 등록할 수 있습니다.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await submitScoreToDB('bubbletea', trimmedName, score);
      setIsSubmitted(true);
      haptics.heavy();
      if (typeof onScoreSubmitted === 'function') {
        onScoreSubmitted();
      }
    } catch (err) {
      setSubmitError('점수 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bubbletea-container">
      {/* 1. Header HUD Bar */}
      <div className="bubbletea-hud-bar">
        {/* Left: Customer Turn Indicator */}
        <div className="bubbletea-hud-left">
          <span className="bubbletea-hud-badge">
            <span>🐾 손님</span>
            <strong className="text-amber-300">
              {Math.min(customerIndex + 1, TOTAL_CUSTOMERS_PER_DAY)} / {TOTAL_CUSTOMERS_PER_DAY}
            </strong>
          </span>
          {combo > 1 && (
            <span className="bubbletea-hud-badge combo">
              <span>🔥 {combo} COMBO!</span>
            </span>
          )}
        </div>

        {/* Center: Score & High Score */}
        <div className="bubbletea-hud-center">
          <span className="bubbletea-hud-badge score">
            <span>현재 점수</span>
            <strong className="text-amber-400 text-sm">{score.toLocaleString()}점</strong>
          </span>
          <span className="bubbletea-hud-badge high">
            <span>최고 점수</span>
            <strong className="text-sky-300 text-sm">{highScore.toLocaleString()}점</strong>
          </span>
        </div>

        {/* Right: Sound & Help */}
        <div className="bubbletea-hud-right">
          <button
            onClick={() => {
              bubbleTeaAudio.playClick();
              setIsHowToPlayOpen(true);
            }}
            className="bubbletea-btn-icon"
            title="게임 방법"
          >
            <HelpCircle className="w-4 h-4 text-amber-300" />
          </button>
          <button
            onClick={toggleMute}
            className="bubbletea-btn-icon"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* 2. Interactive Canvas Viewport */}
      <div className="bubbletea-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="bubbletea-canvas"
          onMouseDown={startPouring}
          onMouseUp={stopPouring}
          onMouseLeave={stopPouring}
          onTouchStart={(e) => {
            e.preventDefault();
            startPouring();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            stopPouring();
          }}
          onTouchCancel={(e) => {
            e.preventDefault();
            stopPouring();
          }}
        />

        {/* 3. Day Complete / Summary Modal Overlay */}
        {dayComplete && (
          <div className="bubbletea-modal-overlay">
            <div className="bubbletea-summary-box">
              <div style={{ fontSize: '36px' }}>🎉</div>
              <h2 className="bubbletea-summary-title">영업 종료 & 정산 완료!</h2>
              <p style={{ fontSize: '12px', color: '#CBD5E1', margin: 0 }}>
                오늘 방문한 {TOTAL_CUSTOMERS_PER_DAY}명의 귀여운 동물 손님들에게 맛있는 버블티를 모두 대접했습니다!
              </p>

              {/* Score Display */}
              <div className="bubbletea-summary-score-row">
                <div className="bubbletea-score-item">
                  <span className="bubbletea-score-label">오늘 획득 점수</span>
                  <span className="bubbletea-score-val">{score.toLocaleString()}점</span>
                </div>
                <div className="bubbletea-score-item">
                  <span className="bubbletea-score-label">최고 기록</span>
                  <span className="bubbletea-score-val" style={{ color: '#38BDF8' }}>
                    {highScore.toLocaleString()}점
                  </span>
                </div>
              </div>

              {/* Leaderboard Form (Rule: Hide if score <= 100) */}
              {score > 100 ? (
                <div className="bubbletea-ranking-form">
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#FBBF24', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Trophy className="w-4 h-4 text-amber-400" />
                    도촌초등학교 명예의 전당 점수 등록
                  </div>

                  {isSubmitted ? (
                    <div style={{ color: '#4ADE80', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Check className="w-4 h-4" />
                      랭킹 등록이 완료되었습니다!
                    </div>
                  ) : (
                    <form onSubmit={handleScoreSubmit} className="bubbletea-input-row">
                      <input
                        type="text"
                        placeholder="예: 홍길동"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        maxLength={10}
                        className="bubbletea-name-input"
                        disabled={isSubmitting}
                        required
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bubbletea-btn-submit"
                      >
                        {isSubmitting ? '등록 중...' : '기록 등록'}
                      </button>
                    </form>
                  )}

                  {submitError && (
                    <span style={{ fontSize: '11px', color: '#F87171', fontWeight: 700 }}>
                      {submitError}
                    </span>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: '#94A3B8', padding: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
                  💡 100점을 초과하면 명예의 전당에 점수를 등록할 수 있어요!
                </div>
              )}

              {/* Play Again Button */}
              <button onClick={handleRestart} className="bubbletea-btn-again">
                <span>🔄 다음 날 다시 영업하기</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Large Action Controls Bar */}
      <div className="bubbletea-action-bar">
        <button
          onMouseDown={startPouring}
          onMouseUp={stopPouring}
          onMouseLeave={stopPouring}
          onTouchStart={(e) => {
            e.preventDefault();
            startPouring();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            stopPouring();
          }}
          onTouchCancel={(e) => {
            e.preventDefault();
            stopPouring();
          }}
          disabled={isServing || dayComplete}
          className={`bubbletea-btn-hold ${isPouring ? 'pouring' : ''}`}
        >
          <span>🧋</span>
          <span>{isPouring ? '재료 주입 중... (손을 떼면 멈춤)' : '꾹 눌러서 재료 넣기 (HOLD)'}</span>
        </button>

        <button
          onClick={handleRestart}
          className="bubbletea-btn-restart"
          title="처음부터 다시하기"
        >
          <RotateCcw className="w-4 h-4" />
          <span>다시하기</span>
        </button>
      </div>

      {/* 5. How To Play Modal */}
      <BubbleTeaHowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
}
