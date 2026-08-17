import React, { useState, useEffect, useRef, useCallback } from 'react';
import { JerryGameLogic } from './jerryLogic';
import { jerryAudio } from './jerryAudio';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TILE_SIZE,
  COLS,
  ROWS,
  TILES,
  STAGE_PRESETS
} from './jerryConstants';
import JerryHowToPlayModal from './JerryHowToPlayModal';
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  HelpCircle,
  Trophy,
  Award,
  Edit3,
  Sparkles,
  Gamepad2,
  Trash2,
  Pause,
  ChevronLeft,
  ChevronRight,
  ArrowUp
} from 'lucide-react';
import './jerrylawson.css';

export default function JerryLawsonGame({ onScoreSubmitted }) {
  const canvasRef = useRef(null);
  const logicRef = useRef(null);
  const reqIdRef = useRef(null);

  // Game Lifecycle State: 'START' | 'PLAYING' | 'PAUSED' | 'EDITOR' | 'GAMEOVER' | 'VICTORY'
  const [gameState, setGameState] = useState('START');
  const [isMuted, setIsMuted] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // HUD State
  const [hudData, setHudData] = useState({
    score: 0,
    lives: 3,
    timeLeft: 90,
    coins: 0,
    totalCoins: 0,
    stageIndex: 0,
    stageName: '1976 연구소',
    mode: 'ADVENTURE'
  });

  // Editor State
  const [selectedTool, setSelectedTool] = useState(TILES.SOLID);
  const [isDrawing, setIsDrawing] = useState(false);
  const [customGrid, setCustomGrid] = useState(() =>
    Array(ROWS).fill(null).map((_, r) => {
      const row = Array(COLS).fill(TILES.EMPTY);
      if (r === ROWS - 1) row.fill(TILES.SOLID); // Floor
      return row;
    })
  );

  // Score Registration State
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Input Tracking
  const inputRef = useRef({
    left: false,
    right: false,
    jump: false
  });

  // Initialize Game Logic
  useEffect(() => {
    logicRef.current = new JerryGameLogic();
  }, []);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        inputRef.current.left = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        inputRef.current.right = true;
      }
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        inputRef.current.jump = true;
      }

      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (gameState === 'PLAYING') setGameState('PAUSED');
        else if (gameState === 'PAUSED') setGameState('PLAYING');
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        inputRef.current.left = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        inputRef.current.right = false;
      }
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        inputRef.current.jump = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Main 60FPS Game Loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (currentTime) => {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const logic = logicRef.current;
      const canvas = canvasRef.current;

      if (logic && canvas) {
        const ctx = canvas.getContext('2d');

        if (gameState === 'PLAYING') {
          logic.handleInput(inputRef.current);
          logic.update(deltaTime);
          logic.render(ctx);

          // Sync HUD
          const currentStage = STAGE_PRESETS[logic.stageIndex % STAGE_PRESETS.length];
          setHudData({
            score: logic.score,
            lives: logic.lives,
            timeLeft: logic.timeLeft,
            coins: logic.coinsCollected,
            totalCoins: logic.totalCoinsInLevel,
            stageIndex: logic.stageIndex,
            stageName: logic.currentMode === 'ADVENTURE' ? currentStage.name : '커스텀 스테이지',
            mode: logic.currentMode
          });

          // Check Game State Changes
          if (logic.isGameOver && gameState !== 'GAMEOVER') {
            setGameState('GAMEOVER');
          } else if (logic.isVictory && gameState !== 'VICTORY') {
            setGameState('VICTORY');
          }
        } else if (gameState === 'EDITOR') {
          renderEditorGrid(ctx);
        } else if (gameState === 'START' || gameState === 'PAUSED' || gameState === 'GAMEOVER' || gameState === 'VICTORY') {
          logic.render(ctx);
        }
      }

      reqIdRef.current = requestAnimationFrame(loop);
    };

    reqIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
    };
  }, [gameState, customGrid, selectedTool]);

  // Render Grid and Cursor for Editor Mode
  const renderEditorGrid = (ctx) => {
    const logic = logicRef.current;
    if (!logic) return;

    // Draw base background
    logic.renderBackground(ctx);

    // Draw placed tiles in customGrid
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = customGrid[r][c];
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        if (tile === TILES.SOLID) {
          ctx.fillStyle = '#8B5A2B';
          ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          ctx.strokeStyle = '#654321';
          ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
        } else if (tile === TILES.PLATFORM) {
          ctx.fillStyle = '#00ADB5';
          ctx.fillRect(x, y, TILE_SIZE, 8);
          ctx.fillStyle = '#00FFF5';
          ctx.fillRect(x + 4, y + 2, TILE_SIZE - 8, 3);
        } else if (tile === TILES.SPIKE) {
          ctx.fillStyle = '#FF2E63';
          ctx.beginPath();
          ctx.moveTo(x + 4, y + TILE_SIZE);
          ctx.lineTo(x + 16, y + 8);
          ctx.lineTo(x + 28, y + TILE_SIZE);
          ctx.closePath();
          ctx.fill();
        } else if (tile === TILES.COIN) {
          ctx.fillStyle = '#FFD700';
          ctx.fillRect(x + 8, y + 6, 16, 20);
          ctx.strokeStyle = '#FFA500';
          ctx.strokeRect(x + 8, y + 6, 16, 20);
        } else if (tile === TILES.SPRING) {
          ctx.fillStyle = '#4A5568';
          ctx.fillRect(x + 4, y + 22, 24, 8);
          ctx.fillStyle = '#00FF66';
          ctx.fillRect(x + 8, y + 12, 16, 10);
        } else if (tile === TILES.ENEMY_BUG) {
          ctx.fillStyle = '#E84545';
          ctx.fillRect(x + 6, y + 10, 20, 14);
          ctx.fillStyle = '#00FFF5';
          ctx.fillRect(x + 10, y + 12, 4, 4);
        } else if (tile === TILES.GOAL_CARTRIDGE) {
          ctx.fillStyle = '#FFB800';
          ctx.fillRect(x + 4, y + 2, 24, 28);
          ctx.fillStyle = '#333333';
          ctx.fillRect(x + 6, y + 8, 20, 12);
        }
      }
    }

    // Grid Overlay Lines
    ctx.strokeStyle = 'rgba(0, 173, 181, 0.25)';
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * TILE_SIZE, 0);
      ctx.lineTo(c * TILE_SIZE, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * TILE_SIZE);
      ctx.lineTo(CANVAS_WIDTH, r * TILE_SIZE);
      ctx.stroke();
    }
  };

  // Sound Toggle
  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    jerryAudio.setMuted(next);
  };

  // Start Adventure Game
  const startAdventureGame = () => {
    if (logicRef.current) {
      logicRef.current.resetAll();
    }
    setIsSubmitted(false);
    setSubmitError('');
    setPlayerName('');
    setGameState('PLAYING');
  };

  // Start Custom Level Test Play
  const startTestPlay = () => {
    if (logicRef.current) {
      logicRef.current.loadCustomMap(customGrid);
    }
    setIsSubmitted(false);
    setSubmitError('');
    setPlayerName('');
    setGameState('PLAYING');
  };

  // Editor Tile Placement
  const handleCanvasMouseDown = (e) => {
    if (gameState !== 'EDITOR') return;
    setIsDrawing(true);
    placeTileAtMouse(e);
  };

  const handleCanvasMouseMove = (e) => {
    if (gameState !== 'EDITOR' || !isDrawing) return;
    placeTileAtMouse(e);
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  const placeTileAtMouse = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const col = Math.floor(mouseX / TILE_SIZE);
    const row = Math.floor(mouseY / TILE_SIZE);

    if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
      setCustomGrid(prev => {
        const next = prev.map(r => [...r]);
        next[row][col] = selectedTool;
        return next;
      });
      jerryAudio.playTileClick(selectedTool === TILES.EMPTY);
    }
  };

  // Reset Custom Grid
  const resetCustomGrid = () => {
    setCustomGrid(
      Array(ROWS).fill(null).map((_, r) => {
        const row = Array(COLS).fill(TILES.EMPTY);
        if (r === ROWS - 1) row.fill(TILES.SOLID);
        return row;
      })
    );
    jerryAudio.playTileClick(true);
  };

  // Load Preset 1 to Editor
  const loadPresetToEditor = (presetIdx = 0) => {
    const stage = STAGE_PRESETS[presetIdx];
    const newGrid = Array(ROWS).fill(null).map(() => Array(COLS).fill(TILES.EMPTY));

    for (let r = 0; r < ROWS && r < stage.map.length; r++) {
      const line = stage.map[r];
      for (let c = 0; c < COLS && c < line.length; c++) {
        const ch = line[c];
        if (ch === 'S') newGrid[r][c] = TILES.SOLID;
        else if (ch === 'P') newGrid[r][c] = TILES.PLATFORM;
        else if (ch === '^') newGrid[r][c] = TILES.SPIKE;
        else if (ch === 'C') newGrid[r][c] = TILES.COIN;
        else if (ch === 'J') newGrid[r][c] = TILES.SPRING;
        else if (ch === 'E') newGrid[r][c] = TILES.ENEMY_BUG;
        else if (ch === 'G') newGrid[r][c] = TILES.GOAL_CARTRIDGE;
      }
    }
    setCustomGrid(newGrid);
    jerryAudio.playTileClick(false);
  };

  // Score Submit Handler
  const handleSubmitScore = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await submitScoreToDB('jerrylawson', playerName.trim(), hudData.score);
      setIsSubmitted(true);
      if (onScoreSubmitted) {
        onScoreSubmitted();
      }
    } catch (err) {
      setSubmitError('점수 등록에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="jerry-container">
      {/* 1. Retro Console Frame */}
      <div className="jerry-console-frame">
        {/* Top HUD */}
        <div className="jerry-hud">
          <div className="flex items-center gap-4">
            <div className="jerry-hud-stat">
              <span>SCORE</span>
              <span className="jerry-hud-val">{hudData.score}</span>
            </div>
            <div className="jerry-hud-stat">
              <span>LIVES</span>
              <span className="jerry-hud-val">{'❤️'.repeat(Math.max(0, hudData.lives))}</span>
            </div>
            <div className="jerry-hud-stat">
              <span>TIME</span>
              <span className="jerry-hud-val">{hudData.timeLeft}s</span>
            </div>
            <div className="jerry-hud-stat">
              <span>COINS</span>
              <span className="jerry-hud-val">🪙 {hudData.coins}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setGameState(gameState === 'EDITOR' ? 'START' : 'EDITOR')}
              className={`jerry-hud-btn ${gameState === 'EDITOR' ? 'active' : ''}`}
              title="레벨 에디터 전환"
            >
              <Edit3 className="w-4 h-4" />
              <span>{gameState === 'EDITOR' ? '게임 모드' : '🛠️ 에디터'}</span>
            </button>

            <button onClick={toggleSound} className="jerry-hud-btn" title="음소거 토글">
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>

            <button
              onClick={() => setIsHowToPlayOpen(true)}
              className="jerry-hud-btn"
              title="게임 방법 및 스토리 보기"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Level Editor Toolbar */}
        {gameState === 'EDITOR' && (
          <div className="jerry-editor-bar animate-fadeIn">
            <div className="jerry-palette-group">
              <button
                onClick={() => setSelectedTool(TILES.SOLID)}
                className={`jerry-tool-btn ${selectedTool === TILES.SOLID ? 'selected' : ''}`}
              >
                🧱 블록
              </button>
              <button
                onClick={() => setSelectedTool(TILES.PLATFORM)}
                className={`jerry-tool-btn ${selectedTool === TILES.PLATFORM ? 'selected' : ''}`}
              >
                💻 발판
              </button>
              <button
                onClick={() => setSelectedTool(TILES.SPRING)}
                className={`jerry-tool-btn ${selectedTool === TILES.SPRING ? 'selected' : ''}`}
              >
                🦘 스프링
              </button>
              <button
                onClick={() => setSelectedTool(TILES.COIN)}
                className={`jerry-tool-btn ${selectedTool === TILES.COIN ? 'selected' : ''}`}
              >
                🪙 코인
              </button>
              <button
                onClick={() => setSelectedTool(TILES.SPIKE)}
                className={`jerry-tool-btn ${selectedTool === TILES.SPIKE ? 'selected' : ''}`}
              >
                ⚡ 스파크
              </button>
              <button
                onClick={() => setSelectedTool(TILES.ENEMY_BUG)}
                className={`jerry-tool-btn ${selectedTool === TILES.ENEMY_BUG ? 'selected' : ''}`}
              >
                👾 버그
              </button>
              <button
                onClick={() => setSelectedTool(TILES.GOAL_CARTRIDGE)}
                className={`jerry-tool-btn ${selectedTool === TILES.GOAL_CARTRIDGE ? 'selected' : ''}`}
              >
                🏆 골 카트리지
              </button>
              <button
                onClick={() => setSelectedTool(TILES.EMPTY)}
                className={`jerry-tool-btn ${selectedTool === TILES.EMPTY ? 'selected' : ''}`}
              >
                🧹 지우개
              </button>
            </div>

            <div className="flex gap-2">
              <button onClick={() => loadPresetToEditor(0)} className="jerry-tool-btn text-xs">
                샘플 맵
              </button>
              <button onClick={resetCustomGrid} className="jerry-tool-btn text-xs text-rose-300">
                <Trash2 className="w-3.5 h-3.5" /> 초기화
              </button>
              <button onClick={startTestPlay} className="jerry-btn text-xs py-1.5 px-3">
                <Play className="w-3.5 h-3.5 fill-current" /> 테스트 플레이
              </button>
            </div>
          </div>
        )}

        {/* Screen Box & Canvas */}
        <div className="jerry-screen-box">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="jerry-canvas"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />

          {/* Start Screen Overlay */}
          {gameState === 'START' && (
            <div className="jerry-overlay animate-fadeIn">
              <div className="jerry-title-card">
                <div className="text-4xl mb-2">🕹️💾</div>
                <h2 className="jerry-title-text">도촌 제리 로슨 (Jerry Lawson)</h2>
                <p className="jerry-subtitle-text">
                  비디오 게임 롬 카트리지의 아버지! 8비트 레트로 모험을 떠나거나 나만의 게임을 직접 만들어보세요!
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button onClick={startAdventureGame} className="jerry-btn text-base py-3 px-8 shadow-xl">
                  <Play className="w-5 h-5 fill-current" /> 스토리 어드벤처 시작
                </button>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setGameState('EDITOR')}
                    className="jerry-btn jerry-btn-secondary text-xs py-2 px-4"
                  >
                    <Edit3 className="w-4 h-4" /> 🛠️ 나만의 게임 만들기
                  </button>
                  <button
                    onClick={() => setIsHowToPlayOpen(true)}
                    className="jerry-btn jerry-btn-secondary text-xs py-2 px-4"
                  >
                    <HelpCircle className="w-4 h-4" /> 게임 방법
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pause Screen Overlay */}
          {gameState === 'PAUSED' && (
            <div className="jerry-overlay animate-fadeIn">
              <div className="jerry-title-card">
                <h2 className="jerry-title-text">⏸️ 일시 정지</h2>
                <p className="jerry-subtitle-text">잠시 연구실에서 숨을 고르고 있습니다.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setGameState('PLAYING')} className="jerry-btn">
                  <Play className="w-4 h-4 fill-current" /> 계속하기
                </button>
                <button onClick={startAdventureGame} className="jerry-btn jerry-btn-secondary">
                  <RotateCcw className="w-4 h-4" /> 재시작
                </button>
              </div>
            </div>
          )}

          {/* Game Over Screen Overlay */}
          {gameState === 'GAMEOVER' && (
            <div className="jerry-overlay animate-fadeIn">
              <div className="jerry-title-card">
                <div className="text-4xl mb-2">💥👾</div>
                <h2 className="text-2xl font-black text-rose-400 mb-1">GAME OVER</h2>
                <p className="text-xs text-slate-300">시스템 오류 발생! 다시 카트리지를 장착하고 도전하세요.</p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-700 w-full max-w-sm mb-3">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-400">최종 획득 점수</span>
                  <span className="text-amber-400 font-bold text-base font-mono">{hudData.score} 점</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">수집한 코인</span>
                  <span className="text-cyan-300 font-bold font-mono">🪙 {hudData.coins} 개</span>
                </div>
              </div>

              {/* Strict Dochon Rule: Score > 100 condition & placeholder "예: 홍길동" */}
              {hudData.score > 100 ? (
                <div className="jerry-submit-form">
                  <p className="text-xs text-amber-300 font-medium">
                    🏆 100점 돌파! 도촌초 명예의 전당에 이름을 등록하세요:
                  </p>
                  {!isSubmitted ? (
                    <form onSubmit={handleSubmitScore} className="jerry-submit-input-group">
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="예: 홍길동"
                        maxLength={12}
                        className="jerry-submit-input"
                        disabled={isSubmitting}
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting || !playerName.trim()}
                        className="jerry-btn text-xs py-2 px-4 whitespace-nowrap"
                      >
                        {isSubmitting ? '등록 중...' : '기록 등록'}
                      </button>
                    </form>
                  ) : (
                    <div className="p-2 mt-2 bg-emerald-950/70 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      도촌초 명예의 전당에 등록되었습니다!
                    </div>
                  )}
                  {submitError && <p className="text-xs text-rose-400 mt-1">{submitError}</p>}
                </div>
              ) : (
                <div className="p-2 bg-slate-800/80 rounded-lg text-xs text-slate-400 mb-2">
                  💡 100점을 초과하여 달성하면 도촌초 명예의 전당에 등록할 수 있습니다!
                </div>
              )}

              <div className="flex gap-3 mt-3">
                <button onClick={startAdventureGame} className="jerry-btn">
                  <RotateCcw className="w-4 h-4" /> 다시 도전하기
                </button>
                <button onClick={() => setGameState('START')} className="jerry-btn jerry-btn-secondary">
                  메인으로
                </button>
              </div>
            </div>
          )}

          {/* Victory Screen Overlay */}
          {gameState === 'VICTORY' && (
            <div className="jerry-overlay animate-fadeIn">
              <div className="jerry-title-card">
                <div className="text-4xl mb-2">🏆👑</div>
                <h2 className="jerry-title-text">모든 스테이지 완전 정복!</h2>
                <p className="jerry-subtitle-text">
                  축하합니다! 제리 로슨과 함께 롬 카트리지 시대를 열고 진정한 게임 마스터가 되었습니다!
                </p>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-amber-500/40 w-full max-w-sm mb-3">
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-amber-300 font-bold">최종 챔피언 점수</span>
                  <span className="text-amber-400 font-black text-xl font-mono">{hudData.score} 점</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>수집한 전자 롬 칩</span>
                  <span className="text-cyan-300 font-bold font-mono">🪙 {hudData.coins} 개</span>
                </div>
              </div>

              {/* Strict Dochon Rule: Score > 100 condition & placeholder "예: 홍길동" */}
              {hudData.score > 100 && (
                <div className="jerry-submit-form">
                  <p className="text-xs text-amber-300 font-medium">
                    👑 전설의 챔피언! 도촌초 명예의 전당에 이름을 새기세요:
                  </p>
                  {!isSubmitted ? (
                    <form onSubmit={handleSubmitScore} className="jerry-submit-input-group">
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="예: 홍길동"
                        maxLength={12}
                        className="jerry-submit-input"
                        disabled={isSubmitting}
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting || !playerName.trim()}
                        className="jerry-btn text-xs py-2 px-4 whitespace-nowrap"
                      >
                        {isSubmitting ? '등록 중...' : '명예 등록'}
                      </button>
                    </form>
                  ) : (
                    <div className="p-2 mt-2 bg-emerald-950/70 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      도촌초 명예의 전당에 등록되었습니다!
                    </div>
                  )}
                  {submitError && <p className="text-xs text-rose-400 mt-1">{submitError}</p>}
                </div>
              )}

              <div className="flex gap-3 mt-3">
                <button onClick={startAdventureGame} className="jerry-btn">
                  <RotateCcw className="w-4 h-4" /> 다시 플레이
                </button>
                <button onClick={() => setGameState('START')} className="jerry-btn jerry-btn-secondary">
                  메인으로
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Virtual On-Screen Controls for Touch / Mobile */}
        <div className="jerry-controls-bar">
          <div className="jerry-controls-guide">
            🎮 <strong>조작법:</strong> <kbd>←</kbd>/<kbd>A</kbd> 좌 <kbd>→</kbd>/<kbd>D</kbd> 우 · <kbd>↑</kbd>/<kbd>W</kbd>/<kbd>Space</kbd> 점프
          </div>

          <div className="jerry-virtual-btns">
            <button
              onMouseDown={() => (inputRef.current.left = true)}
              onMouseUp={() => (inputRef.current.left = false)}
              onTouchStart={() => (inputRef.current.left = true)}
              onTouchEnd={() => (inputRef.current.left = false)}
              className="jerry-vbtn"
              title="왼쪽 이동"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onMouseDown={() => (inputRef.current.right = true)}
              onMouseUp={() => (inputRef.current.right = false)}
              onTouchStart={() => (inputRef.current.right = true)}
              onTouchEnd={() => (inputRef.current.right = false)}
              className="jerry-vbtn"
              title="오른쪽 이동"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onMouseDown={() => (inputRef.current.jump = true)}
              onMouseUp={() => (inputRef.current.jump = false)}
              onTouchStart={() => (inputRef.current.jump = true)}
              onTouchEnd={() => (inputRef.current.jump = false)}
              className="jerry-vbtn bg-amber-600/30"
              title="점프"
            >
              <ArrowUp className="w-5 h-5" /> 점프
            </button>
          </div>
        </div>
      </div>

      {/* Guide & Story Modal */}
      <JerryHowToPlayModal isOpen={isHowToPlayOpen} onClose={() => setIsHowToPlayOpen(false)} />
    </div>
  );
}
