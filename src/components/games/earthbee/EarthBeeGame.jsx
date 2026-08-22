import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EarthBeeEngine } from './earthBeeEngine';
import { earthBeeAudio } from './earthBeeAudio';
import EarthBeeHowToPlayModal from './EarthBeeHowToPlayModal';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  INITIAL_GAME_TIME,
  ECO_FACTS
} from './earthBeeConstants';
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
  Check,
  Heart,
  Play,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import './earthbee.css';

const DIRECTION_KEYS = {
  // Arrow keys (standard & legacy)
  'ArrowUp': 'up',
  'Up': 'up',
  'ArrowDown': 'down',
  'Down': 'down',
  'ArrowLeft': 'left',
  'Left': 'left',
  'ArrowRight': 'right',
  'Right': 'right',
  // WASD (codes)
  'KeyW': 'up',
  'KeyS': 'down',
  'KeyA': 'left',
  'KeyD': 'right',
  // WASD (keys English)
  'w': 'up',
  'W': 'up',
  's': 'down',
  'S': 'down',
  'a': 'left',
  'A': 'left',
  'd': 'right',
  'D': 'right',
  // WASD (Korean IME on WASD keys)
  'ㅈ': 'up',
  'ㅉ': 'up',
  'ㄴ': 'down',
  'ㅁ': 'left',
  'ㅇ': 'right'
};

export default function EarthBeeGame({ onScoreSubmitted }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const stageBoxRef = useRef(null);

  // Game States
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem('dochon_earthbee_highscore')) || 0;
    } catch (e) {
      return 0;
    }
  });
  const [timeLeft, setTimeLeft] = useState(INITIAL_GAME_TIME);
  const [pollenPct, setPollenPct] = useState(20);
  const [combo, setCombo] = useState(0);
  const [totalBlooms, setTotalBlooms] = useState(0);
  const [ecoLevel, setEcoLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);

  // Sound & Modals
  const [isMuted, setIsMuted] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // Educational Eco Fact Toast
  const [factMessage, setFactMessage] = useState(ECO_FACTS[0]);
  const [showFact, setShowFact] = useState(true);

  // Leaderboard Form
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Active key state tracking
  const keysPressedRef = useRef({ up: false, down: false, left: false, right: false });

  // High Score Persistence
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      try {
        localStorage.setItem('dochon_earthbee_highscore', String(score));
      } catch (e) {}
    }
  }, [score, highScore]);

  // Fact cycle
  useEffect(() => {
    const factInterval = setInterval(() => {
      const randomFact = ECO_FACTS[Math.floor(Math.random() * ECO_FACTS.length)];
      setFactMessage(randomFact);
      setShowFact(true);
      setTimeout(() => setShowFact(false), 5000);
    }, 12000);
    return () => clearInterval(factInterval);
  }, []);

  // Initialize Canvas & Engine
  useEffect(() => {
    if (canvasRef.current) {
      const engine = new EarthBeeEngine(canvasRef.current);
      engineRef.current = engine;

      // Event Callbacks from Engine
      engine.onBloomCallback = ({ score: earned, timeBonus, combo: curCombo, totalBlooms: blooms, ecoLevel: lvl }) => {
        setScore(prev => prev + earned);
        setTimeLeft(prev => Math.min(prev + timeBonus, 99));
        setCombo(curCombo);
        setTotalBlooms(blooms);
        setPollenPct(engine.bee.pollenCount);

        earthBeeAudio.playBloom(curCombo);
        if (curCombo >= 2) {
          earthBeeAudio.playComboChime(curCombo);
        }
        haptics.light();
      };

      engine.onPollenCollectCallback = () => {
        setPollenPct(engine.bee.pollenCount);
        earthBeeAudio.playPollenCollect();
        haptics.light();
      };

      engine.onLevelUpCallback = (lvl, name) => {
        setEcoLevel(lvl);
        setScore(prev => prev + 250); // Big level up bonus!
        setTimeLeft(prev => Math.min(prev + 10, 99));
        setFactMessage(`🎉 [생태계 레벨 ${lvl}] ${name} 달성! 보너스 +10초`);
        setShowFact(true);
        earthBeeAudio.playLevelUp();
        haptics.medium();
      };
    }
  }, []);

  // Main 60FPS Game Loop & Timer
  useEffect(() => {
    let lastTime = performance.now();
    let secAccumulator = 0;

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (isPlaying && !isGameOver) {
        // Countdown Timer
        secAccumulator += dt;
        if (secAccumulator >= 1.0) {
          secAccumulator = 0;
          setTimeLeft(prev => {
            if (prev <= 1) {
              handleGameOver();
              return 0;
            }
            return prev - 1;
          });
        }

        // Directional Keyboard & D-Pad Steering
        const kp = keysPressedRef.current;
        let dx = 0;
        let dy = 0;
        if (kp.left) dx -= 1;
        if (kp.right) dx += 1;
        if (kp.up) dy -= 1;
        if (kp.down) dy += 1;

        if (engineRef.current) {
          engineRef.current.setKeyboardInput(dx, dy);
          engineRef.current.update(dt);
          engineRef.current.render();
          setPollenPct(engineRef.current.bee.pollenCount);
          setCombo(engineRef.current.combo);

          // Audio hum
          const speed = Math.hypot(engineRef.current.bee.vx, engineRef.current.bee.vy) / 260;
          earthBeeAudio.updateFlightHum(speed);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isPlaying, isGameOver]);

  // Robust Global Keyboard Event Listeners for Arrow Keys & WASD
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept when typing player name in an input form
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }

      const dir = DIRECTION_KEYS[e.code] || DIRECTION_KEYS[e.key];
      if (dir) {
        e.preventDefault();
        keysPressedRef.current[dir] = true;
        earthBeeAudio.startFlightHum();
      }
    };

    const handleKeyUp = (e) => {
      const dir = DIRECTION_KEYS[e.code] || DIRECTION_KEYS[e.key];
      if (dir) {
        e.preventDefault();
        keysPressedRef.current[dir] = false;
      }
    };

    const handleBlur = () => {
      keysPressedRef.current = { up: false, down: false, left: false, right: false };
      earthBeeAudio.stopFlightHum();
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const handleGameOver = () => {
    setIsGameOver(true);
    setIsPlaying(false);
    keysPressedRef.current = { up: false, down: false, left: false, right: false };
    earthBeeAudio.stopFlightHum();
    earthBeeAudio.playGameOver();
    haptics.heavy();
  };

  // Canvas Mouse & Touch Steering Handlers
  const handlePointerMove = (e) => {
    if (!isPlaying || isGameOver || !stageBoxRef.current || !engineRef.current) return;
    const rect = stageBoxRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const screenX = (clientX - rect.left) * (CANVAS_WIDTH / rect.width);
    const screenY = (clientY - rect.top) * (CANVAS_HEIGHT / rect.height);

    engineRef.current.setTargetPosition(screenX, screenY);
    earthBeeAudio.startFlightHum();
  };

  const handlePointerDown = (e) => {
    earthBeeAudio.init();
    earthBeeAudio.startFlightHum();
    handlePointerMove(e);
  };

  // Sound Toggle
  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    earthBeeAudio.setMuted(nextMute);
  };

  // Restart Game
  const handleRestart = () => {
    earthBeeAudio.playClick();
    if (engineRef.current) {
      engineRef.current.initWorld();
    }
    keysPressedRef.current = { up: false, down: false, left: false, right: false };
    setScore(0);
    setTimeLeft(INITIAL_GAME_TIME);
    setCombo(0);
    setTotalBlooms(0);
    setEcoLevel(1);
    setPollenPct(20);
    setIsGameOver(false);
    setIsPlaying(true);
    setIsSubmitted(false);
    setSubmitError('');
    setPlayerName('');
  };

  // D-Pad Button Helper for Touch & Click Controls
  const handleDpadAction = (dir, isDown) => {
    if (!isPlaying || isGameOver) return;
    keysPressedRef.current[dir] = isDown;
    if (isDown) {
      earthBeeAudio.init();
      earthBeeAudio.startFlightHum();
      haptics.light();
    }
  };

  // Leaderboard Score Submission (strictly score > 100)
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (score <= 100) return;
    if (!playerName.trim()) {
      setSubmitError('이름을 입력해 주세요!');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await submitScoreToDB('earthbee', playerName.trim(), score);
      setIsSubmitted(true);
      haptics.success();
      if (onScoreSubmitted) {
        onScoreSubmitted();
      }
    } catch (err) {
      setSubmitError('등록 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="earthbee-container">
      {/* 1. Header Status Bar */}
      <div className="earthbee-header-bar">
        {/* Score & High Score */}
        <div className="flex items-center gap-4">
          <div className="earthbee-stat-item">
            <span className="earthbee-stat-label">SCORE</span>
            <span className="earthbee-stat-value text-amber-300">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="earthbee-stat-item hidden sm:flex">
            <span className="earthbee-stat-label">HIGH</span>
            <span className="earthbee-stat-value text-slate-400">
              {highScore.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Pollen Gauge */}
        <div className="earthbee-pollen-container">
          <span className="earthbee-stat-label">꽃가루 (POLLEN)</span>
          <div className="earthbee-pollen-bar-bg">
            <div
              className="earthbee-pollen-bar-fill"
              style={{ width: `${Math.min(100, pollenPct)}%` }}
            />
          </div>
        </div>

        {/* Time Left & Eco Level */}
        <div className="flex items-center gap-3">
          <div className="earthbee-stat-item">
            <span className="earthbee-stat-label">TIME</span>
            <span className={`earthbee-stat-value font-mono ${timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
              {timeLeft}s
            </span>
          </div>

          <div className="earthbee-stat-item hidden sm:flex">
            <span className="earthbee-stat-label">생태계</span>
            <span className="earthbee-stat-value text-purple-300">
              Lv.{ecoLevel}
            </span>
          </div>

          {/* Action Buttons */}
          <button
            onClick={toggleMute}
            className="earthbee-btn-icon"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
          </button>

          <button
            onClick={() => setIsHowToPlayOpen(true)}
            className="earthbee-btn-icon"
            title="게임 방법"
          >
            <HelpCircle className="w-4 h-4 text-sky-300" />
          </button>
        </div>
      </div>

      {/* 2. Main Canvas Interactive Stage */}
      <div
        ref={stageBoxRef}
        className="earthbee-stage-box"
        onMouseMove={handlePointerMove}
        onMouseDown={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchStart={handlePointerDown}
      >
        <canvas ref={canvasRef} className="earthbee-canvas" />

        {/* In-Game Fact Notification Toast */}
        {showFact && (
          <div className="earthbee-fact-toast">
            🌱 {factMessage}
          </div>
        )}

        {/* Combo Floating Badge */}
        {combo >= 2 && (
          <div className="earthbee-combo-float">
            🔥 {combo} COMBO (x{Math.min(combo, 5)})
          </div>
        )}

        {/* 3. Game Over / Result Modal Overlay */}
        {isGameOver && (
          <div className="earthbee-overlay">
            <div className="earthbee-result-card">
              <div className="text-4xl mb-2 animate-bounce">🐝</div>
              <h2 className="earthbee-result-title">
                도촌 꿀벌의 하루 비행 완료!
              </h2>

              <div className="earthbee-score-grid">
                <div className="earthbee-score-box">
                  <span className="text-xs text-slate-400 block font-bold">최종 점수</span>
                  <span className="text-2xl font-black text-amber-300">
                    {score.toLocaleString()}점
                  </span>
                </div>
                <div className="earthbee-score-box">
                  <span className="text-xs text-slate-400 block font-bold">피운 꽃 송이</span>
                  <span className="text-2xl font-black text-emerald-400">
                    {totalBlooms}송이
                  </span>
                </div>
              </div>

              {/* Leaderboard Submission Area (strictly score > 100) */}
              {score > 100 ? (
                <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3.5 mb-3">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300 font-bold mb-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>도촌초 명예의 전당 랭킹 등록</span>
                  </div>

                  {isSubmitted ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-xs py-1.5">
                      <Check className="w-4 h-4" />
                      <span>명예의 전당에 성공적으로 등록되었습니다!</span>
                    </div>
                  ) : (
                    <form onSubmit={handleScoreSubmit} className="earthbee-input-row">
                      <input
                        type="text"
                        placeholder="예: 홍길동"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        maxLength={10}
                        className="earthbee-name-input"
                        disabled={isSubmitting}
                        required
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="earthbee-btn-submit"
                      >
                        {isSubmitting ? '등록 중...' : '기록 등록'}
                      </button>
                    </form>
                  )}

                  {submitError && (
                    <p className="text-[11px] text-rose-400 font-bold mt-1.5">
                      {submitError}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700 mb-3">
                  💡 100점을 초과하면 명예의 전당에 이름을 남길 수 있어요!
                </div>
              )}

              <button onClick={handleRestart} className="earthbee-btn-again">
                <span>🔄 정원으로 다시 날아가기</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Controls Bar (Keyboard Directions & On-Screen D-Pad) */}
      <div className="earthbee-footer-bar">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold text-xs">🎮 비행 조작:</span>
          <span className="text-slate-300 text-xs hidden sm:inline">
            키보드 방향키 (<kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-amber-300 font-mono text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-amber-300 font-mono text-[10px]">↓</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-amber-300 font-mono text-[10px]">←</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-amber-300 font-mono text-[10px]">→</kbd> / WASD) 또는 마우스/터치 드래그
          </span>
          <span className="text-slate-300 text-xs sm:hidden">
            방향키 / 터치 드래그
          </span>
        </div>

        {/* On-Screen Touch / Click Directional Buttons (D-Pad) */}
        <div className="earthbee-dpad-compact">
          <button
            onPointerDown={(e) => { e.preventDefault(); handleDpadAction('left', true); }}
            onPointerUp={(e) => { e.preventDefault(); handleDpadAction('left', false); }}
            onPointerLeave={() => handleDpadAction('left', false)}
            className="earthbee-dpad-btn"
            title="왼쪽으로 비행 (← / A)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div className="flex flex-col gap-1">
            <button
              onPointerDown={(e) => { e.preventDefault(); handleDpadAction('up', true); }}
              onPointerUp={(e) => { e.preventDefault(); handleDpadAction('up', false); }}
              onPointerLeave={() => handleDpadAction('up', false)}
              className="earthbee-dpad-btn"
              title="위로 비행 (↑ / W)"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onPointerDown={(e) => { e.preventDefault(); handleDpadAction('down', true); }}
              onPointerUp={(e) => { e.preventDefault(); handleDpadAction('down', false); }}
              onPointerLeave={() => handleDpadAction('down', false)}
              className="earthbee-dpad-btn"
              title="아래로 비행 (↓ / S)"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onPointerDown={(e) => { e.preventDefault(); handleDpadAction('right', true); }}
            onPointerUp={(e) => { e.preventDefault(); handleDpadAction('right', false); }}
            onPointerLeave={() => handleDpadAction('right', false)}
            className="earthbee-dpad-btn"
            title="오른쪽으로 비행 (→ / D)"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5. How To Play Modal */}
      <EarthBeeHowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
}
