import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RoswellLogic } from './roswellLogic';
import { roswellAudio } from './roswellAudio';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import { CANVAS_WIDTH, CANVAS_HEIGHT, REQUIRED_PARTS, SCENES } from './roswellConstants';
import RoswellHowToPlayModal from './RoswellHowToPlayModal';
import { Play, RotateCcw, Volume2, VolumeX, HelpCircle, Trophy, Sparkles, Compass, CheckCircle2, Send } from 'lucide-react';
import './roswell.css';

export default function RoswellGame({ onScoreSubmitted }) {
  const canvasRef = useRef(null);
  const logicRef = useRef(null);
  const reqIdRef = useRef(null);

  // Game Lifecycle State: 'START' | 'PLAYING' | 'GAME_CLEAR'
  const [gameState, setGameState] = useState('START');
  const [hudState, setHudState] = useState({
    scene: SCENES.CRASH_SITE,
    inventory: [],
    collectedParts: [],
    installedParts: [],
    score: 0,
    dialogue: '',
    isGameClear: false
  });

  const [selectedItem, setSelectedItem] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // Leaderboard Submission States
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Synchronize Game State callback
  const handleLogicEvent = useCallback((state) => {
    setHudState(state);
    if (state.isGameClear) {
      setGameState('GAME_CLEAR');
      roswellAudio.stopBGM();
    }
  }, []);

  // Initialize Game Logic
  useEffect(() => {
    logicRef.current = new RoswellLogic(handleLogicEvent);
    return () => {
      roswellAudio.stopBGM();
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
    };
  }, [handleLogicEvent]);

  // Main Canvas Render Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let lastTime = performance.now();

    const TARGET_FPS = 30;
    const FRAME_INTERVAL = 1000 / TARGET_FPS; // 33.33ms
    let lastRenderTime = performance.now();

    const loop = (currentTime) => {
      try {
        const elapsed = currentTime - lastRenderTime;

        if (elapsed >= FRAME_INTERVAL) {
          lastRenderTime = currentTime - (elapsed % FRAME_INTERVAL);
          const deltaTime = Math.min(elapsed / 1000, 0.08);

          if (logicRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            logicRef.current.update(deltaTime);
            logicRef.current.render(ctx);
          }
        }
      } catch (err) {
        console.error('[Roswell Loop Error]', err);
      } finally {
        reqIdRef.current = requestAnimationFrame(loop);
      }
    };

    lastRenderTime = performance.now();
    reqIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
    };
  }, [gameState]);

  // Start / Restart Game
  const handleStartGame = () => {
    if (!logicRef.current) {
      logicRef.current = new RoswellLogic(handleLogicEvent);
    } else {
      logicRef.current.reset();
    }
    setSelectedItem(null);
    setIsSubmitted(false);
    setSubmitError('');
    setPlayerName('');
    setGameState('PLAYING');
    roswellAudio.startBGM();
  };

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    roswellAudio.setMuted(next);
  };

  // Canvas Click / Touch Coordinates Converter
  const handleCanvasClick = (e) => {
    if (!canvasRef.current || !logicRef.current || gameState !== 'PLAYING') return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;

    logicRef.current.handleCanvasClick(canvasX, canvasY, selectedItem);
  };

  // Handle Item Selection from Inventory
  const handleSelectSlot = (item) => {
    if (!item) return;
    if (selectedItem && selectedItem.id === item.id) {
      setSelectedItem(null); // Unselect
    } else {
      setSelectedItem(item);
      roswellAudio.playClick();
    }
  };

  // Score Submit Handler (Strict Dochon Portal Rule: Score > 100 & Placeholder '예: 홍길동')
  const handleSubmitScore = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting || isSubmitted) return;

    const finalScore = logicRef.current ? logicRef.current.getFinalScore() : hudState.score;
    if (finalScore <= 100) return; // 100점 이하 차단

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const success = await submitScoreToDB('roswell', playerName.trim(), finalScore);
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

  const getSceneName = (sceneKey) => {
    switch (sceneKey) {
      case SCENES.CRASH_SITE: return '불시착 지점 🛸';
      case SCENES.FARMLAND: return '도촌 농장 들판 🌾';
      case SCENES.BARN: return '오래된 헛간 🏚️';
      case SCENES.FARMHOUSE: return '농부의 오두막 🏡';
      default: return '도촌 마을';
    }
  };

  const finalScoreValue = logicRef.current ? logicRef.current.getFinalScore() : hudState.score;

  return (
    <div className="roswell-game-container">
      {/* Top Action & Status Bar */}
      <div className="roswell-top-bar">
        <div className="roswell-stat-group">
          <div className="roswell-badge">
            <span>📍</span>
            <span>{getSceneName(hudState.scene)}</span>
          </div>
          <div className="roswell-badge">
            <span>⭐</span>
            <span>{hudState.score}점</span>
          </div>
        </div>

        <div className="roswell-stat-group">
          <button
            onClick={() => setIsHowToPlayOpen(true)}
            className="roswell-icon-btn"
            title="게임 방법 및 힌트 가이드"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
            onClick={toggleSound}
            className="roswell-icon-btn"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Main Viewport / Canvas Area */}
      <div className="roswell-canvas-wrapper" onClick={handleCanvasClick}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="roswell-canvas"
        />

        {/* Narrative Dialogue Banner */}
        {gameState === 'PLAYING' && hudState.dialogue && (
          <div className="roswell-dialogue-banner">
            {hudState.dialogue}
          </div>
        )}

        {/* START OVERLAY SCREEN */}
        {gameState === 'START' && (
          <div className="roswell-victory-overlay">
            <div className="text-5xl mb-3 animate-bounce">🛸</div>
            <h1 className="text-2xl sm:text-3xl font-black text-emerald-300 mb-2">
              도촌 UFO 탈출작전
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
              지구에 불시착한 외계인을 도와 흩어진 <strong className="text-emerald-400">3대 부품</strong>을 찾아 비행접시를 수리하고 우주로 탈출시키세요!
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleStartGame}
                className="roswell-start-btn"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>작전 시작하기</span>
              </button>
              <button
                onClick={() => setIsHowToPlayOpen(true)}
                className="roswell-guide-btn"
              >
                <span>게임 방법</span>
              </button>
            </div>
          </div>
        )}

        {/* GAME CLEAR / VICTORY OVERLAY SCREEN */}
        {gameState === 'GAME_CLEAR' && (
          <div className="roswell-victory-overlay">
            <div className="text-5xl mb-2 animate-bounce">✨🛸🌌</div>
            <h2 className="text-2xl font-black text-emerald-300 mb-1">
              🎉 탈출 대성공! (MISSION ACCOMPLISHED)
            </h2>
            <p className="text-xs text-slate-300 mb-4">
              외계인이 고향 별로 무사히 귀환했습니다! 도촌초 명예의 전당에 이름을 남겨보세요.
            </p>

            <div className="bg-slate-900/80 border border-emerald-500/40 rounded-2xl p-4 mb-4 w-full max-w-sm">
              <div className="text-xs text-slate-400 mb-1">최종 달성 점수</div>
              <div className="text-3xl font-black text-emerald-400 mb-2">
                {finalScoreValue.toLocaleString()}점
              </div>

              {/* Strict Rule: Score > 100 Form */}
              {finalScoreValue > 100 && (
                <div style={{ width: '100%' }}>
                  {!isSubmitted ? (
                    <form onSubmit={handleSubmitScore} className="roswell-submit-form">
                      <div className="roswell-input-group">
                        <input
                          type="text"
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                          placeholder="예: 홍길동"
                          maxLength={10}
                          className="roswell-name-input"
                          disabled={isSubmitting}
                          autoFocus
                        />
                        <button
                          type="submit"
                          disabled={!playerName.trim() || isSubmitting}
                          className="roswell-submit-btn"
                        >
                          <Send className="w-4 h-4" />
                          <span>{isSubmitting ? '등록 중...' : '등록'}</span>
                        </button>
                      </div>
                      {submitError && <div style={{ color: '#f87171', fontSize: '11px', fontWeight: 'bold', marginTop: '6px' }}>{submitError}</div>}
                    </form>
                  ) : (
                    <div style={{ color: '#86efac', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '12px' }}>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>명예의 전당에 등록되었습니다!</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleStartGame}
              className="roswell-restart-btn"
            >
              <RotateCcw className="w-4 h-4" />
              <span>다시 플레이하기</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Inventory & Parts Bar */}
      <div className="roswell-inventory-bar">
        {/* Inventory Slots */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold text-slate-400">🎒 인벤토리 (가방)</span>
          <div className="roswell-inventory-slots">
            {[0, 1, 2, 3].map((slotIdx) => {
              const item = hudState.inventory[slotIdx];
              const isSelected = selectedItem && item && selectedItem.id === item.id;

              return (
                <div
                  key={slotIdx}
                  onClick={() => handleSelectSlot(item)}
                  className={`roswell-item-slot ${item ? '' : 'empty'} ${isSelected ? 'selected' : ''}`}
                  title={item ? `${item.name} (${item.desc})` : '빈 슬롯'}
                >
                  {item ? item.icon : ''}
                </div>
              );
            })}
          </div>
        </div>

        {/* UFO 3 Parts Indicator */}
        <div className="flex flex-col gap-1 items-end">
          <span className="text-[11px] font-bold text-emerald-400">🛸 수집된 UFO 핵심 부품 ({hudState.collectedParts.length}/3)</span>
          <div className="roswell-parts-indicator">
            {REQUIRED_PARTS.map((part) => {
              const isCollected = hudState.collectedParts.includes(part.id);
              return (
                <div
                  key={part.id}
                  className={`roswell-part-gem ${isCollected ? 'active' : ''}`}
                  title={`${part.name}: ${isCollected ? '획득 완료' : '미획득'}`}
                >
                  {part.icon}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* How to play modal */}
      <RoswellHowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
}
