// Dochon Pani Puri Master - React UI Wrapper
// Connects UI controls directly to the PaniPuriEngine Single Source of Truth

import React, { useState, useEffect, useRef } from 'react';
import { PaniPuriEngine } from './panipuriEngine';
import { panipuriAudio } from './panipuriAudio';
import PaniPuriHowToPlayModal from './PaniPuriHowToPlayModal';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PANI_FLAVORS,
  FLAVOR_LIST,
  PREP_TRAY_MAX_PURIS
} from './panipuriConstants';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  RotateCcw,
  Trophy,
  Sparkles,
  Flame,
  Clock,
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

  // Engine Synced States for UI Rendering
  const [gameState, setGameState] = useState({
    isPlaying: false,
    isGameOver: false,
    score: 0,
    combo: 0,
    servedCount: 0,
    timeLeft: 60,
    feverGauge: 0,
    isFever: false,
    currentCustomer: null,
    customerPatience: 1.0,
    preparedPuris: []
  });

  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem('dochon_panipuri_highscore')) || 0;
    } catch (e) {
      return 0;
    }
  });

  // Audio & How to play modal
  const [isMuted, setIsMuted] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // Hall of Fame Leaderboard Submission States
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Handle Game Over
  const handleGameOverCallback = (finalScore, finalServed) => {
    setHighScore(prev => {
      if (finalScore > prev) {
        try {
          localStorage.setItem('dochon_panipuri_highscore', String(finalScore));
        } catch (e) {}
        return finalScore;
      }
      return prev;
    });
  };

  // Initialize Canvas & Engine Loop ONLY ONCE
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const engine = new PaniPuriEngine(
      canvas,
      (newState) => setGameState(newState),
      handleGameOverCallback
    );
    engineRef.current = engine;
    canvas.__panipuriEngine = engine;

    // Continuous 30fps Loop with 50% GPU Reduction
    const TARGET_FPS = 30;
    const FRAME_INTERVAL = 1000 / TARGET_FPS; // 33.33ms
    let lastRenderTime = performance.now();

    const loop = (currentTime) => {
      try {
        const elapsed = currentTime - lastRenderTime;

        if (elapsed >= FRAME_INTERVAL) {
          lastRenderTime = currentTime - (elapsed % FRAME_INTERVAL);
          if (engineRef.current) {
            engineRef.current.tick(currentTime);
          }
        }
      } catch (err) {
        console.error('[PaniPuri Loop Error]', err);
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
      if (engineRef.current) {
        engineRef.current.endGame();
      }
    };
  }, []);

  // Controls directly calling Engine methods
  const handleStartGame = () => {
    setIsSubmitted(false);
    setSubmitError('');
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  };

  const handlePotClick = (flavor) => {
    if (engineRef.current) {
      engineRef.current.addPuri(flavor);
    }
  };

  const handleRemovePuri = (index) => {
    if (engineRef.current) {
      engineRef.current.removePuri(index);
    }
  };

  const handleClearTray = () => {
    if (engineRef.current) {
      engineRef.current.clearTray();
    }
  };

  const handleServe = () => {
    if (engineRef.current) {
      engineRef.current.serveDish();
    }
  };

  // Keyboard shortcut listener: Enter for Serve, 1-4 for Flavors, C/Delete for Clear
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing inside text input or textarea (e.g. Leaderboard form)
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      // Only active during live gameplay and when modals are closed
      if (!gameState.isPlaying || gameState.isGameOver || isHowToPlayOpen) return;

      if (e.key === 'Enter' || e.code === 'Enter' || e.code === 'NumpadEnter') {
        e.preventDefault();
        handleServe();
      } else if (e.key === '1') {
        e.preventDefault();
        handlePotClick(FLAVOR_LIST[0]);
      } else if (e.key === '2') {
        e.preventDefault();
        handlePotClick(FLAVOR_LIST[1]);
      } else if (e.key === '3') {
        e.preventDefault();
        handlePotClick(FLAVOR_LIST[2]);
      } else if (e.key === '4') {
        e.preventDefault();
        handlePotClick(FLAVOR_LIST[3]);
      } else if (e.key === 'c' || e.key === 'C' || e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleClearTray();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.isPlaying, gameState.isGameOver, isHowToPlayOpen]);

  const handleCanvasClick = (e) => {
    if (!canvasRef.current || !engineRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const clickedPot = engineRef.current.getClickedPot(canvasX, canvasY);
    if (clickedPot) {
      engineRef.current.addPuri(clickedPot);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    panipuriAudio.setMuted(nextMuted);
    if (!nextMuted && gameState.isPlaying) {
      panipuriAudio.startBgm();
    }
  };

  // Calculate if plate matches current customer order
  const isOrderMatching = React.useMemo(() => {
    if (!gameState.currentCustomer || gameState.preparedPuris.length === 0) return false;
    const preparedCounts = {};
    gameState.preparedPuris.forEach(p => {
      preparedCounts[p.flavorKey] = (preparedCounts[p.flavorKey] || 0) + 1;
    });

    let totalReq = 0;
    let match = true;
    gameState.currentCustomer.order.forEach(item => {
      totalReq += item.count;
      if (!gameState.isFever) {
        if ((preparedCounts[item.flavorKey] || 0) !== item.count) {
          match = false;
        }
      }
    });

    if (!gameState.isFever && gameState.preparedPuris.length !== totalReq) match = false;
    if (gameState.isFever && gameState.preparedPuris.length < totalReq) match = false;
    return match;
  }, [gameState.currentCustomer, gameState.preparedPuris, gameState.isFever]);

  // Submit Score to Dochon Leaderboard
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting || isSubmitted) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await submitScoreToDB('panipuri', playerName.trim(), gameState.score);
      if (res) {
        setIsSubmitted(true);
        panipuriAudio.playServeSuccess();
        haptics.success();
        setTimeout(() => {
          if (onScoreSubmitted) {
            onScoreSubmitted();
          }
        }, 700);
      } else {
        setSubmitError('100점 이하의 점수는 명예의 전당에 등록할 수 없습니다.');
      }
    } catch (err) {
      setSubmitError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="panipuri-container">
      {/* 1. Header Toolbar Bar - High-End Arcade HUD */}
      <div className="panipuri-toolbar">
        {/* Left: Brand / Title Badge */}
        <div className="panipuri-brand-block">
          <div className="panipuri-logo-icon-box">
            <span className="panipuri-logo-emoji">🫓</span>
            <span className="panipuri-logo-sparkle">✨</span>
          </div>
          <div className="panipuri-brand-text">
            <div className="flex items-center gap-1.5">
              <h1 className="panipuri-brand-title">파니 푸리 마스터</h1>
              <span className="panipuri-badge-tag">TYCOON</span>
            </div>
            <p className="panipuri-brand-subtitle">Celebrating Pani Puri · 도촌 아케이드</p>
          </div>
        </div>

        {/* Center: Live HUD (Time Counter & Golden Fever Gauge) */}
        <div className="panipuri-hud-center">
          {/* Time Counter Pill */}
          <div className={`panipuri-hud-time ${gameState.timeLeft <= 10 ? 'urgent-pulse' : ''}`} title="남은 영업 시간">
            <div className="panipuri-hud-icon-circle">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="panipuri-hud-time-val">
              <span className="panipuri-hud-label">TIME</span>
              <span className="panipuri-hud-number">
                {Math.ceil(gameState.timeLeft)}
                <span className="text-[10px] opacity-70">s</span>
              </span>
            </div>
          </div>

          {/* Golden Fever Gauge Card */}
          <div className={`panipuri-hud-fever ${gameState.isFever ? 'fever-active' : ''}`} title="100% 달성 시 8초간 2배 점수 골든 피버 발동!">
            <div className="panipuri-fever-header">
              <span className="flex items-center gap-1">
                <Flame className={`w-3.5 h-3.5 ${gameState.isFever ? 'text-amber-300 animate-bounce' : 'text-amber-400'}`} />
                <span className="panipuri-fever-title">{gameState.isFever ? 'FEVER 2X' : 'FEVER'}</span>
              </span>
              <span className="panipuri-fever-pct">{gameState.isFever ? 'ACTIVE!' : `${gameState.feverGauge}%`}</span>
            </div>
            <div className="panipuri-fever-bar-track">
              <div
                className={`panipuri-fever-bar-fill ${gameState.isFever ? 'fever-shimmer' : ''}`}
                style={{ width: gameState.isFever ? '100%' : `${gameState.feverGauge}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Scoreboard & Action Controls */}
        <div className="panipuri-hud-right">
          {/* Combo Multiplier Pill (When Active) */}
          {gameState.combo >= 2 && (
            <div className="panipuri-combo-pill animate-bounce">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>{gameState.combo} COMBO</span>
            </div>
          )}

          {/* Score Counter Card */}
          <div className="panipuri-score-card">
            <div className="panipuri-score-label-row">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>SCORE</span>
            </div>
            <div className="panipuri-score-val-row">
              <span className="panipuri-score-number">{gameState.score.toLocaleString()}</span>
              <span className="panipuri-score-unit">점</span>
            </div>
          </div>

          {/* Control Action Buttons */}
          <div className="panipuri-btn-group">
            <button
              onClick={toggleMute}
              className="panipuri-tool-btn"
              title={isMuted ? '음소거 해제' : '음소거'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={() => setIsHowToPlayOpen(true)}
              className="panipuri-tool-btn"
              title="게임 방법 및 레시피 가이드"
            >
              <HelpCircle className="w-4 h-4 text-cyan-300" />
            </button>

            <button
              onClick={handleStartGame}
              className="panipuri-tool-btn"
              title="처음부터 다시 시작"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
            </button>
          </div>
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
        {!gameState.isPlaying && !gameState.isGameOver && (
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
        {gameState.isGameOver && (
          <div className="panipuri-overlay">
            <div className="panipuri-overlay-card text-center max-w-sm">
              <div className="text-4xl mb-2">🏆</div>
              <h2 className="text-xl font-black text-amber-300 mb-1">영업 마감!</h2>
              <p className="text-xs text-slate-300 mb-3">
                총 <strong className="text-amber-300">{gameState.servedCount}명</strong>의 손님을 만족시켰습니다!
              </p>

              {/* Score Display */}
              <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-3 mb-4">
                <p className="text-xs text-slate-400">최종 획득 점수</p>
                <p className="text-3xl font-black text-amber-400 font-mono">
                  {gameState.score.toLocaleString()} <span className="text-sm">점</span>
                </p>
                {gameState.score > highScore && (
                  <p className="text-[11px] text-emerald-400 font-bold mt-1">🎉 최고 기록 경신!</p>
                )}
              </div>

              {/* Hall of Fame Score Submission (Strict rule: score > 100 only) */}
              {gameState.score > 100 && (
                <div className="panipuri-rank-card">
                  <div className="panipuri-rank-title">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>명예의 전당 점수 등록</span>
                  </div>

                  {!isSubmitted ? (
                    <form onSubmit={handleScoreSubmit} className="space-y-3">
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="예: 홍길동"
                        maxLength={10}
                        className="panipuri-rank-input"
                      />
                      {submitError && (
                        <p className="text-xs text-rose-400 font-bold">{submitError}</p>
                      )}
                      <button
                        type="submit"
                        disabled={isSubmitting || !playerName.trim()}
                        className="panipuri-btn-rank-submit"
                      >
                        <Trophy className="w-4 h-4 text-amber-950 fill-amber-950" />
                        <span>{isSubmitting ? '등록 중...' : '🏆 랭킹 등록하기'}</span>
                      </button>
                    </form>
                  ) : (
                    <div className="panipuri-rank-success">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>명예의 전당에 성공적으로 등록되었습니다!</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="panipuri-action-row">
                <button
                  onClick={handleStartGame}
                  className="panipuri-btn-restart"
                >
                  <RotateCcw className="w-4 h-4" />
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
          {FLAVOR_LIST.map((flavor, idx) => (
            <button
              key={flavor.id}
              onClick={() => handlePotClick(flavor)}
              disabled={!gameState.isPlaying || gameState.isGameOver}
              className="panipuri-flavor-btn group"
              title={`${flavor.name} (단축키: ${idx + 1})`}
              style={{
                borderColor: flavor.color,
                background: `linear-gradient(180deg, rgba(30, 41, 59, 0.95), ${flavor.deepColor}40)`
              }}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {flavor.icon}
              </span>
              <div className="text-left flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-white">{flavor.shortName}</p>
                  <kbd className="panipuri-kbd-num">{idx + 1}</kbd>
                </div>
                <p className="text-[10px] text-slate-300">{flavor.tag}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Tray Action Controls */}
        <div className="panipuri-tray-actions">
          {/* Prepared Puris Mini Badges Preview */}
          <div className="panipuri-tray-preview">
            <span className="text-[10px] text-slate-400 mr-1">접시 ({gameState.preparedPuris.length}/{PREP_TRAY_MAX_PURIS})</span>
            <div className="flex gap-1 items-center">
              {gameState.preparedPuris.map((puri, idx) => {
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
            disabled={!gameState.isPlaying || gameState.isGameOver || gameState.preparedPuris.length === 0}
            className="panipuri-btn-clear"
            title="접시 비우기 (단축키: C 또는 Delete)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>비우기</span>
            <kbd className="panipuri-kbd-hint">C</kbd>
          </button>

          <button
            onClick={handleServe}
            disabled={!gameState.isPlaying || gameState.isGameOver || gameState.preparedPuris.length === 0}
            className={`panipuri-btn-serve ${isOrderMatching ? 'active-ready animate-pulse' : ''}`}
            title="손님에게 서빙하기 (단축키: Enter ↵)"
          >
            <Send className="w-4 h-4" />
            <span>{isOrderMatching ? '✨ 서빙 완료!' : '서빙하기!'}</span>
            <kbd className="panipuri-kbd-hint enter">Enter ↵</kbd>
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
