// Dochon Pani Puri Master - Main Game Controller Component (Robust State & Render Architecture)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PaniPuriEngine } from './panipuriEngine';
import { panipuriAudio } from './panipuriAudio';
import PaniPuriHowToPlayModal from './PaniPuriHowToPlayModal';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PANI_FLAVORS,
  FLAVOR_LIST,
  CUSTOMER_PROFILES,
  INITIAL_TIME_LIMIT,
  MAX_TIME_LIMIT,
  TIME_BONUS_ON_SUCCESS,
  TIME_PENALTY_ON_WRONG,
  BASE_SCORE_PER_PURI,
  PERFECT_ORDER_BONUS,
  COMBO_MULTIPLIER_STEP,
  FEVER_DURATION,
  FEVER_SCORE_MULTIPLIER,
  FEVER_REQ_POINTS,
  PREP_TRAY_MAX_PURIS
} from './panipuriConstants';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import { haptics } from '../../../utils/haptics';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  RotateCcw,
  Trophy,
  Star,
  Sparkles,
  Flame,
  Clock,
  Award,
  Crown,
  Play,
  CheckCircle2,
  Trash2,
  Send
} from 'lucide-react';
import './panipuri.css';

export default function PaniPuriGame({ onScoreSubmitted }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const animFrameIdRef = useRef(null);

  // Game Lifecycle States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [servedCount, setServedCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME_LIMIT);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem('dochon_panipuri_highscore')) || 0;
    } catch (e) {
      return 0;
    }
  });

  // Fever Mode States
  const [feverGauge, setFeverGauge] = useState(0);
  const [isFever, setIsFever] = useState(false);
  const feverTimerRef = useRef(null);

  // In-Game Cooking & Customer States
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [customerPatience, setCustomerPatience] = useState(1.0); // 1.0 down to 0
  const [preparedPuris, setPreparedPuris] = useState([]);

  // Audio & How to play modal
  const [isMuted, setIsMuted] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // Hall of Fame Leaderboard Submission States
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Latest State Ref for 60fps Animation Loop without re-creating engine
  const stateRef = useRef({
    currentCustomer: null,
    customerPatience: 1.0,
    preparedPuris: [],
    isFever: false,
    score: 0,
    combo: 0
  });

  useEffect(() => {
    stateRef.current = {
      currentCustomer,
      customerPatience,
      preparedPuris,
      isFever,
      score,
      combo
    };
  }, [currentCustomer, customerPatience, preparedPuris, isFever, score, combo]);

  // Generate a realistic customer order based on difficulty
  const spawnNewCustomer = useCallback((currentServed = 0) => {
    const profile = CUSTOMER_PROFILES[Math.floor(Math.random() * CUSTOMER_PROFILES.length)];
    
    // Order difficulty grows with served count
    let distinctFlavorsCount = 1;
    if (currentServed >= 3) distinctFlavorsCount = 2;
    if (currentServed >= 8) distinctFlavorsCount = Math.random() > 0.4 ? 3 : 2;

    // Pick random distinct flavors
    const shuffledFlavors = [...FLAVOR_LIST].sort(() => Math.random() - 0.5);
    const orderItems = [];

    for (let i = 0; i < distinctFlavorsCount; i++) {
      const flavor = shuffledFlavors[i];
      const maxCount = distinctFlavorsCount === 1 ? (currentServed > 5 ? 3 : 2) : (Math.random() > 0.5 ? 2 : 1);
      orderItems.push({
        flavorKey: flavor.id,
        count: maxCount
      });
    }

    const newCustomer = {
      ...profile,
      order: orderItems,
      maxPatience: profile.patienceTime,
      remainingPatience: profile.patienceTime
    };

    setCurrentCustomer(newCustomer);
    setCustomerPatience(1.0);
  }, []);

  // Initialize Canvas & Engine ONLY ONCE
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const engine = new PaniPuriEngine(canvas);
    engineRef.current = engine;

    const renderLoop = () => {
      if (engineRef.current) {
        engineRef.current.render(stateRef.current);
      }
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };
    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  // Customer Timeout handler
  const handleCustomerLeaveTimeout = useCallback(() => {
    panipuriAudio.playWrong();
    haptics.heavy();
    setCombo(0);
    setTimeLeft(t => Math.max(0, t - TIME_PENALTY_ON_WRONG));
    
    if (engineRef.current) {
      engineRef.current.addFloatingText('손님이 기다리다 떠났어요! 💦', 240, 180, '#EF4444', 20);
    }
    setPreparedPuris([]);
    spawnNewCustomer(servedCount);
  }, [servedCount, spawnNewCustomer]);

  // Main Game Timer & Customer Patience Tick
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const timer = setInterval(() => {
      // 1. Overall Game Time
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          clearInterval(timer);
          handleGameOver();
          return 0;
        }
        return prev - 0.1;
      });

      // 2. Customer Patience Decay
      setCustomerPatience(prev => {
        const decayRate = 0.1 / (currentCustomer?.maxPatience || 14);
        const next = prev - decayRate;
        if (next <= 0) {
          handleCustomerLeaveTimeout();
          return 1.0;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isPlaying, isGameOver, currentCustomer, handleCustomerLeaveTimeout]);

  // Start / Restart Game
  const handleStartGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setCombo(0);
    setServedCount(0);
    setTimeLeft(INITIAL_TIME_LIMIT);
    setFeverGauge(0);
    setIsFever(false);
    setPreparedPuris([]);
    setIsSubmitted(false);
    setSubmitError('');

    panipuriAudio.startBgm();
    spawnNewCustomer(0);
  };

  // End Game
  const handleGameOver = () => {
    setIsPlaying(false);
    setIsGameOver(true);
    panipuriAudio.stopBgm();
    panipuriAudio.playGameOver();
    haptics.success();

    setScore(currentScore => {
      setHighScore(prev => {
        if (currentScore > prev) {
          try {
            localStorage.setItem('dochon_panipuri_highscore', String(currentScore));
          } catch (e) {}
          return currentScore;
        }
        return prev;
      });
      return currentScore;
    });
  };

  // Add Puri to Tray (Chef clicks a Pot)
  const handlePotClick = (flavor) => {
    if (!isPlaying || isGameOver) return;

    if (preparedPuris.length >= PREP_TRAY_MAX_PURIS) {
      haptics.light();
      if (engineRef.current) {
        engineRef.current.addFloatingText('접시가 가득 찼어요!', 660, 360, '#F59E0B', 14);
      }
      return;
    }

    panipuriAudio.playCrack();
    panipuriAudio.playSplash(flavor.id);
    haptics.light();

    if (engineRef.current) {
      engineRef.current.addParticle(660, 410, flavor.color, 6, 3, 'liquid');
    }

    const newPuri = {
      id: Date.now() + Math.random(),
      flavorKey: flavor.id
    };
    setPreparedPuris(prev => [...prev, newPuri]);
  };

  // Direct Canvas Click Handling
  const handleCanvasClick = (e) => {
    if (!isPlaying || isGameOver || !canvasRef.current || !engineRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const clickedPot = engineRef.current.getClickedPot(canvasX, canvasY);
    if (clickedPot) {
      handlePotClick(clickedPot);
    }
  };

  // Remove single puri from tray
  const handleRemovePuri = (indexToRemove) => {
    if (!isPlaying || isGameOver) return;
    panipuriAudio.playCrack();
    haptics.light();
    setPreparedPuris(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Clear all puris on tray
  const handleClearTray = () => {
    if (!isPlaying || isGameOver || preparedPuris.length === 0) return;
    haptics.medium();
    setPreparedPuris([]);
    if (engineRef.current) {
      engineRef.current.addFloatingText('접시 비움', 660, 410, '#94A3B8', 14);
    }
  };

  // Trigger Golden Fever Mode
  const triggerFeverMode = () => {
    setIsFever(true);
    panipuriAudio.playFeverStart();
    haptics.success();

    if (engineRef.current) {
      engineRef.current.addFloatingText('✨ GOLDEN FEVER TIME! (점수 2배) ✨', CANVAS_WIDTH / 2, 120, '#FEF08A', 26);
    }

    if (feverTimerRef.current) clearTimeout(feverTimerRef.current);
    feverTimerRef.current = setTimeout(() => {
      setIsFever(false);
    }, FEVER_DURATION * 1000);
  };

  // Serve Dish to Customer!
  const handleServe = () => {
    if (!isPlaying || isGameOver || !currentCustomer) return;

    if (preparedPuris.length === 0) {
      haptics.light();
      if (engineRef.current) {
        engineRef.current.addFloatingText('파니 푸리를 먼저 담으세요!', 660, 360, '#F59E0B', 14);
      }
      return;
    }

    // Count prepared puris by flavor
    const preparedCounts = {};
    preparedPuris.forEach(p => {
      preparedCounts[p.flavorKey] = (preparedCounts[p.flavorKey] || 0) + 1;
    });

    // Check against customer order
    let isMatch = true;
    let totalRequiredCount = 0;

    currentCustomer.order.forEach(item => {
      totalRequiredCount += item.count;
      if (!isFever) {
        if ((preparedCounts[item.flavorKey] || 0) !== item.count) {
          isMatch = false;
        }
      }
    });

    // In non-fever mode, total count must match exactly
    if (!isFever && preparedPuris.length !== totalRequiredCount) {
      isMatch = false;
    }

    // In Fever mode: any Puri combination works as long as count matches!
    if (isFever && preparedPuris.length < totalRequiredCount) {
      isMatch = false;
    }

    if (isMatch) {
      // 🌟 SUCCESSFUL SERVE!
      const newCombo = combo + 1;
      const nextServed = servedCount + 1;
      
      setCombo(newCombo);
      setServedCount(nextServed);

      // Score Calculation
      const basePoints = preparedPuris.length * BASE_SCORE_PER_PURI;
      const speedBonus = Math.floor(customerPatience * SPEED_BONUS_MAX);
      const comboMultiplier = 1 + (newCombo - 1) * COMBO_MULTIPLIER_STEP;
      const feverMultiplier = isFever ? FEVER_SCORE_MULTIPLIER : 1.0;
      
      const earnedScore = Math.floor((basePoints + PERFECT_ORDER_BONUS + speedBonus) * comboMultiplier * feverMultiplier);
      setScore(prev => prev + earnedScore);

      // Time Bonus
      setTimeLeft(t => Math.min(MAX_TIME_LIMIT, t + TIME_BONUS_ON_SUCCESS));

      // Audio & Haptics & Particles
      panipuriAudio.playServeSuccess();
      if (newCombo >= 2) {
        panipuriAudio.playCombo(newCombo);
      }
      haptics.medium();

      if (engineRef.current) {
        engineRef.current.addFloatingText(`+${earnedScore}!`, 380, 180, '#FACC15', 24);
        if (newCombo >= 3) {
          engineRef.current.addFloatingText(`🔥 ${newCombo} 콤보!`, 380, 215, '#F97316', 18);
        }
        engineRef.current.addParticle(380, 200, '#FDE047', 14, 5, 'sparkle');
      }

      // Fever Gauge Progress
      if (!isFever) {
        setFeverGauge(prev => {
          const next = prev + 25;
          if (next >= FEVER_REQ_POINTS) {
            triggerFeverMode();
            return 0;
          }
          return next;
        });
      }

      // Clear Tray & Spawn Next Customer IMMEDIATELY
      setPreparedPuris([]);
      spawnNewCustomer(nextServed);

    } else {
      // ❌ WRONG ORDER
      panipuriAudio.playWrong();
      haptics.heavy();
      setCombo(0);
      setTimeLeft(t => Math.max(0, t - TIME_PENALTY_ON_WRONG));

      if (engineRef.current) {
        engineRef.current.addFloatingText('주문이 달라요! (-3초)', 380, 190, '#EF4444', 20);
      }
    }
  };

  // Sound Toggle
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    panipuriAudio.setMuted(nextMuted);
    if (!nextMuted && isPlaying) {
      panipuriAudio.startBgm();
    }
  };

  // Submit Score to Dochon Leaderboard
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting || isSubmitted) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await submitScoreToDB('panipuri', playerName.trim(), score);
      if (res && res.success) {
        setIsSubmitted(true);
        if (onScoreSubmitted) {
          onScoreSubmitted();
        }
      } else {
        setSubmitError(res?.message || '등록 중 오류가 발생했습니다.');
      }
    } catch (err) {
      setSubmitError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="panipuri-container">
      {/* 1. Header Toolbar Bar */}
      <div className="panipuri-toolbar">
        <div className="flex items-center gap-3">
          <div className="panipuri-badge-title">
            <span className="text-xl">🫓</span>
            <div>
              <h1 className="text-sm font-black text-amber-400">파니 푸리 마스터</h1>
              <p className="text-[10px] text-slate-400">Celebrating Pani Puri</p>
            </div>
          </div>

          {/* Time Display */}
          <div className={`panipuri-stat-pill ${timeLeft <= 10 ? 'animate-pulse border-red-500 bg-red-950/80 text-red-300' : 'text-cyan-300'}`}>
            <Clock className="w-4 h-4" />
            <span className="font-mono text-base font-bold">{Math.ceil(timeLeft)}s</span>
          </div>

          {/* Fever Bar */}
          <div className="panipuri-fever-bar-container" title="100% 달성 시 골든 피버 발동!">
            <div className="flex items-center justify-between text-[10px] text-amber-200 px-1 mb-0.5">
              <span className="flex items-center gap-1 font-bold">
                <Flame className="w-3 h-3 text-amber-400" />
                {isFever ? '✨ FEVER 2X ✨' : 'FEVER'}
              </span>
              <span>{isFever ? 'ON!' : `${feverGauge}%`}</span>
            </div>
            <div className="panipuri-fever-track">
              <div
                className={`panipuri-fever-fill ${isFever ? 'bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 animate-pulse' : 'bg-gradient-to-r from-amber-500 to-yellow-400'}`}
                style={{ width: isFever ? '100%' : `${feverGauge}%` }}
              />
            </div>
          </div>
        </div>

        {/* Score & Combo */}
        <div className="flex items-center gap-2">
          {combo >= 2 && (
            <div className="panipuri-combo-badge animate-bounce">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>{combo} COMBO</span>
            </div>
          )}

          <div className="panipuri-stat-pill text-amber-300">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="font-mono text-base font-black">{score.toLocaleString()}</span>
            <span className="text-[11px] text-slate-400">점</span>
          </div>

          {/* Audio Button */}
          <button
            onClick={toggleMute}
            className="panipuri-tool-btn"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* How to Play Guide Button */}
          <button
            onClick={() => setIsHowToPlayOpen(true)}
            className="panipuri-tool-btn text-cyan-300"
            title="게임 방법"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Restart Button */}
          <button
            onClick={handleStartGame}
            className="panipuri-tool-btn text-amber-300"
            title="다시 시작"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main Game Canvas Area */}
      <div className="panipuri-canvas-wrapper">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="panipuri-canvas cursor-pointer"
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
        />

        {/* Ready / Start Overlay */}
        {!isPlaying && !isGameOver && (
          <div className="panipuri-overlay">
            <div className="panipuri-overlay-card text-center">
              <span className="text-5xl mb-2 block animate-bounce">🫓</span>
              <h2 className="text-2xl font-black text-amber-300 mb-1">
                도촌 파니 푸리 마스터
              </h2>
              <p className="text-xs text-slate-300 mb-4">
                손님들의 개성 넘치는 주문을 신속하게 조리하고 서빙하세요!
              </p>

              <div className="flex justify-center gap-3">
                <button
                  onClick={handleStartGame}
                  className="panipuri-btn-start flex items-center gap-2"
                >
                  <Play className="w-5 h-5 fill-slate-950" />
                  <span>게임 시작</span>
                </button>
                <button
                  onClick={() => setIsHowToPlayOpen(true)}
                  className="panipuri-btn-secondary flex items-center gap-1.5"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>게임 가이드</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Over / Result Overlay */}
        {isGameOver && (
          <div className="panipuri-overlay">
            <div className="panipuri-overlay-card text-center max-w-sm">
              <div className="text-4xl mb-2">🏆</div>
              <h2 className="text-xl font-black text-amber-300 mb-1">영업 마감!</h2>
              <p className="text-xs text-slate-300 mb-3">
                총 <strong className="text-amber-300">{servedCount}명</strong>의 손님을 만족시켰습니다!
              </p>

              {/* Score Display */}
              <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-3 mb-4">
                <p className="text-xs text-slate-400">최종 획득 점수</p>
                <p className="text-3xl font-black text-amber-400 font-mono">
                  {score.toLocaleString()} <span className="text-sm">점</span>
                </p>
                {score > highScore && (
                  <p className="text-[11px] text-emerald-400 font-bold mt-1">🎉 최고 기록 경신!</p>
                )}
              </div>

              {/* Hall of Fame Score Submission (Strict rule: score > 100 only) */}
              {score > 100 && (
                <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-3 mb-3 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-2">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>명예의 전당 점수 등록</span>
                  </div>

                  {!isSubmitted ? (
                    <form onSubmit={handleScoreSubmit} className="space-y-2">
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="예: 홍길동"
                        maxLength={10}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none"
                      />
                      {submitError && (
                        <p className="text-[11px] text-rose-400">{submitError}</p>
                      )}
                      <button
                        type="submit"
                        disabled={isSubmitting || !playerName.trim()}
                        className="w-full py-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 disabled:opacity-50 text-slate-950 font-black rounded-lg text-xs flex items-center justify-center gap-1 shadow-md"
                      >
                        {isSubmitting ? '등록 중...' : '🏆 랭킹 등록하기'}
                      </button>
                    </form>
                  ) : (
                    <div className="text-center py-2 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>명예의 전당에 성공적으로 등록되었습니다!</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleStartGame}
                  className="panipuri-btn-primary flex-1 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>다시 도전하기</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Interactive Control Dock (Chef's Prep Stations) */}
      <div className="panipuri-control-dock">
        {/* Flavor Selection Buttons (Pani Pots) */}
        <div className="panipuri-flavor-grid">
          {FLAVOR_LIST.map(flavor => (
            <button
              key={flavor.id}
              onClick={() => handlePotClick(flavor)}
              disabled={!isPlaying || isGameOver}
              className="panipuri-flavor-btn group"
              style={{
                borderColor: flavor.color,
                background: `linear-gradient(180deg, rgba(30, 41, 59, 0.95), ${flavor.deepColor}40)`
              }}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {flavor.icon}
              </span>
              <div className="text-left">
                <p className="text-xs font-black text-white">{flavor.shortName}</p>
                <p className="text-[10px] text-slate-300">{flavor.tag}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Tray Action Controls */}
        <div className="panipuri-tray-actions">
          {/* Prepared Puris Mini Badges Preview */}
          <div className="panipuri-tray-preview">
            <span className="text-[10px] text-slate-400 mr-1">접시 ({preparedPuris.length}/{PREP_TRAY_MAX_PURIS})</span>
            <div className="flex gap-1 items-center">
              {preparedPuris.map((puri, idx) => {
                const flavor = PANI_FLAVORS[puri.flavorKey.toUpperCase()] || PANI_FLAVORS.MINT;
                return (
                  <button
                    key={puri.id}
                    onClick={() => handleRemovePuri(idx)}
                    className="w-6 h-6 rounded-full border border-amber-300/40 flex items-center justify-center text-xs shadow hover:scale-110 transition-transform"
                    style={{ backgroundColor: flavor.liquidColor }}
                    title={`${flavor.shortName} (클릭 시 제거)`}
                  >
                    {flavor.icon}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleClearTray}
            disabled={!isPlaying || isGameOver || preparedPuris.length === 0}
            className="panipuri-btn-clear"
            title="접시 비우기"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>비우기</span>
          </button>

          <button
            onClick={handleServe}
            disabled={!isPlaying || isGameOver || preparedPuris.length === 0}
            className="panipuri-btn-serve"
          >
            <Send className="w-4 h-4" />
            <span>서빙하기!</span>
          </button>
        </div>
      </div>

      {/* 4. How to Play Guide Modal */}
      <PaniPuriHowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
}
