import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  DIRECTION,
  DIRECTION_DELTA,
  TILE_TYPE,
  BLOCK_TYPE,
  BLOCK_INFO,
  STAGES
} from './kidsCodingConstants';
import {
  countTotalBlocks,
  compileInstructions,
  createInitialSimulationState,
  executeStep
} from './kidsCodingEngine';
import { kidsCodingAudio } from './kidsCodingAudio';
import KidsCodingHowToPlayModal from './KidsCodingHowToPlayModal';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import { haptics } from '../../../utils/haptics';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  HelpCircle,
  Trophy,
  Play,
  Pause,
  SkipForward,
  Trash2,
  Star,
  Sparkles,
  ChevronRight,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import './kidscoding.css';

export default function KidsCodingGame({ onScoreSubmitted }) {
  // Game & Stage Session
  const [stageIndex, setStageIndex] = useState(0);
  const currentStage = STAGES[stageIndex] || STAGES[0];
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try {
      const saved = localStorage.getItem('dochon_kidscoding_best');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch (e) {
      return 0;
    }
  });

  // Stage Scores & Star Ratings Map: { [stageId]: { stars: number, score: number } }
  const [clearedStages, setClearedStages] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [isHowToOpen, setIsHowToOpen] = useState(false);

  // Coding Workspace State
  const [blocks, setBlocks] = useState([]);
  const [gameState, setGameState] = useState('EDITING'); // 'EDITING' | 'RUNNING' | 'PAUSED' | 'STAGE_CLEAR' | 'ALL_CLEAR' | 'FAILED'

  // Live Simulation State
  const [simState, setSimState] = useState(() => createInitialSimulationState(currentStage));
  const [instructions, setInstructions] = useState([]);
  const [instructionPointer, setInstructionPointer] = useState(0);
  const [rabbitJumping, setRabbitJumping] = useState(false);

  // Leaderboard Submission States
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Execution Timer Ref
  const runTimerRef = useRef(null);

  // Update Mute in Audio Engine
  useEffect(() => {
    kidsCodingAudio.setMuted(isMuted);
  }, [isMuted]);

  // Stage Change Handler
  useEffect(() => {
    stopExecution();
    setBlocks([]);
    setGameState('EDITING');
    setSimState(createInitialSimulationState(currentStage));
    setInstructions([]);
    setInstructionPointer(0);
  }, [stageIndex]);

  // Total Used Blocks
  const totalBlocksUsed = countTotalBlocks(blocks);

  // Stop Running Timer
  const stopExecution = useCallback(() => {
    if (runTimerRef.current) {
      clearTimeout(runTimerRef.current);
      runTimerRef.current = null;
    }
  }, []);

  // Workspace Block Operations
  const handleAddBlock = (type, parentLoopId = null) => {
    haptics.light();
    kidsCodingAudio.playBlockSnap();

    const newBlock = {
      id: `b_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      type: type,
      ...(type === BLOCK_TYPE.LOOP ? { count: 2, children: [] } : {})
    };

    if (!parentLoopId) {
      setBlocks(prev => [...prev, newBlock]);
    } else {
      setBlocks(prev => {
        function insertChild(list) {
          return list.map(b => {
            if (b.id === parentLoopId && b.type === BLOCK_TYPE.LOOP) {
              return { ...b, children: [...(b.children || []), newBlock] };
            }
            if (b.type === BLOCK_TYPE.LOOP && b.children) {
              return { ...b, children: insertChild(b.children) };
            }
            return b;
          });
        }
        return insertChild(prev);
      });
    }
  };

  const handleRemoveBlock = (blockId) => {
    haptics.light();
    kidsCodingAudio.playBlockRemove();
    setBlocks(prev => {
      function removeRecursive(list) {
        return list
          .filter(b => b.id !== blockId)
          .map(b => {
            if (b.type === BLOCK_TYPE.LOOP && b.children) {
              return { ...b, children: removeRecursive(b.children) };
            }
            return b;
          });
      }
      return removeRecursive(prev);
    });
  };

  const handleChangeLoopCount = (loopId, delta) => {
    haptics.light();
    kidsCodingAudio.playBlockSnap();
    setBlocks(prev => {
      function updateLoop(list) {
        return list.map(b => {
          if (b.id === loopId && b.type === BLOCK_TYPE.LOOP) {
            const nextCount = Math.max(2, Math.min(9, (b.count || 2) + delta));
            return { ...b, count: nextCount };
          }
          if (b.type === BLOCK_TYPE.LOOP && b.children) {
            return { ...b, children: updateLoop(b.children) };
          }
          return b;
        });
      }
      return updateLoop(prev);
    });
  };

  const handleClearWorkspace = () => {
    haptics.medium();
    kidsCodingAudio.playBlockRemove();
    stopExecution();
    setBlocks([]);
    handleResetSimulation();
  };

  const handleResetSimulation = () => {
    stopExecution();
    setGameState('EDITING');
    setSimState(createInitialSimulationState(currentStage));
    setInstructionPointer(0);
    setRabbitJumping(false);
  };

  // Execution Step Processor
  const processNextStep = useCallback((currState, currInstructions, ptr) => {
    if (ptr >= currInstructions.length) {
      // Execution reached end of script
      const finalState = executeStep(currState, null, currentStage);
      setSimState(finalState);

      if (finalState.isClear) {
        handleStageClear(finalState);
      } else {
        kidsCodingAudio.playError();
        setGameState('FAILED');
      }
      return;
    }

    const instr = currInstructions[ptr];
    const nextState = executeStep(currState, instr, currentStage);

    // Sound & Motion Effects
    if (instr.action === BLOCK_TYPE.FORWARD) {
      setRabbitJumping(true);
      setTimeout(() => setRabbitJumping(false), 240);
      kidsCodingAudio.playHop();
    } else if (instr.action === BLOCK_TYPE.TURN_LEFT || instr.action === BLOCK_TYPE.TURN_RIGHT) {
      kidsCodingAudio.playTurn();
    }

    // Check if new carrot was harvested
    const prevCarrots = currState.carrots.filter(c => c.collected).length;
    const nextCarrots = nextState.carrots.filter(c => c.collected).length;
    if (nextCarrots > prevCarrots) {
      kidsCodingAudio.playCarrot();
    }

    setSimState(nextState);
    setInstructionPointer(ptr + 1);

    if (nextState.isFailed) {
      kidsCodingAudio.playError();
      setGameState('FAILED');
      return;
    }

    if (nextState.isClear) {
      handleStageClear(nextState);
      return;
    }

    // Queue next step if still running
    runTimerRef.current = setTimeout(() => {
      processNextStep(nextState, currInstructions, ptr + 1);
    }, 320);
  }, [currentStage, stageIndex]);

  // Stage Clear Logic & Score Calculation
  const handleStageClear = (finalState) => {
    stopExecution();
    haptics.success();

    const usedCount = countTotalBlocks(blocks);
    const isOptimal = usedCount <= currentStage.targetBlocks;
    const isGood = usedCount <= currentStage.targetBlocks + 2;
    const starsEarned = isOptimal ? 3 : isGood ? 2 : 1;

    let stageEarnedScore = currentStage.clearScore;
    if (isOptimal) {
      stageEarnedScore += currentStage.optimalBonus;
      kidsCodingAudio.playOptimalStar();
    } else {
      kidsCodingAudio.playStageClear();
    }

    // Update cumulative score if first time or improved
    const prevRecord = clearedStages[currentStage.id];
    const prevScore = prevRecord ? prevRecord.score : 0;
    const diff = Math.max(0, stageEarnedScore - prevScore);

    const newScore = score + diff;
    setScore(newScore);

    if (newScore > bestScore) {
      setBestScore(newScore);
      try {
        localStorage.setItem('dochon_kidscoding_best', String(newScore));
      } catch (e) {}
    }

    setClearedStages(prev => ({
      ...prev,
      [currentStage.id]: {
        stars: Math.max(starsEarned, prev[currentStage.id]?.stars || 0),
        score: Math.max(stageEarnedScore, prevScore)
      }
    }));

    if (stageIndex === STAGES.length - 1) {
      kidsCodingAudio.playGrandFanfare();
      setGameState('ALL_CLEAR');
    } else {
      setGameState('STAGE_CLEAR');
    }
  };

  // Play / Pause Toggle
  const handleTogglePlay = () => {
    haptics.medium();

    if (gameState === 'RUNNING') {
      stopExecution();
      setGameState('PAUSED');
      return;
    }

    if (blocks.length === 0) return;

    let currState = simState;
    let currInstrs = instructions;
    let ptr = instructionPointer;

    if (gameState === 'EDITING' || gameState === 'FAILED' || gameState === 'STAGE_CLEAR') {
      currState = createInitialSimulationState(currentStage);
      currInstrs = compileInstructions(blocks);
      ptr = 0;
      setSimState(currState);
      setInstructions(currInstrs);
      setInstructionPointer(0);
    }

    setGameState('RUNNING');
    runTimerRef.current = setTimeout(() => {
      processNextStep(currState, currInstrs, ptr);
    }, 150);
  };

  // Single Step Debugger
  const handleSingleStep = () => {
    haptics.light();
    stopExecution();

    let currState = simState;
    let currInstrs = instructions;
    let ptr = instructionPointer;

    if (gameState === 'EDITING' || gameState === 'FAILED' || gameState === 'STAGE_CLEAR') {
      currState = createInitialSimulationState(currentStage);
      currInstrs = compileInstructions(blocks);
      ptr = 0;
      setSimState(currState);
      setInstructions(currInstrs);
      setInstructionPointer(0);
    }

    setGameState('PAUSED');
    processNextStep(currState, currInstrs, ptr);
  };

  // Next Stage Handler
  const handleNextStage = () => {
    haptics.medium();
    if (stageIndex < STAGES.length - 1) {
      setStageIndex(prev => prev + 1);
    }
  };

  // Leaderboard Form Submit (Rule Compliant: placeholder '예: 홍길동', > 100 pts)
  const handleSubmitScore = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting || hasSubmitted || score <= 100) return;

    setIsSubmitting(true);
    haptics.medium();

    try {
      await submitScoreToDB('kidscoding', playerName.trim(), score);
      setHasSubmitted(true);
      if (onScoreSubmitted) {
        onScoreSubmitted();
      }
    } catch (err) {
      console.error('Failed to submit score:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper renderer for block items in script workspace
  const renderBlockItem = (block, parentLoopId = null) => {
    const isRunning = simState.activeBlockId === block.id;

    if (block.type === BLOCK_TYPE.LOOP) {
      return (
        <div
          key={block.id}
          className={`kc-loop-container ${isRunning ? 'running' : ''}`}
        >
          <div className="kc-loop-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🔁 반복하기</span>
              <div className="kc-loop-counter-pill">
                <button
                  onClick={() => handleChangeLoopCount(block.id, -1)}
                  className="kc-loop-btn-small"
                  title="반복 횟수 감소"
                >
                  -
                </button>
                <span>{block.count || 2}회</span>
                <button
                  onClick={() => handleChangeLoopCount(block.id, 1)}
                  className="kc-loop-btn-small"
                  title="반복 횟수 증가"
                >
                  +
                </button>
              </div>
            </div>
            <button
              onClick={() => handleRemoveBlock(block.id)}
              className="kc-block-remove-btn"
              title="루프 블록 삭제"
            >
              ✕
            </button>
          </div>

          {/* Loop Inner Body */}
          <div className="kc-loop-body">
            {block.children && block.children.length > 0 ? (
              block.children.map(child => renderBlockItem(child, block.id))
            ) : (
              <div className="kc-loop-empty-slot">
                반복할 블록을 아래 팔레트에서 추가하세요 ⬇️
              </div>
            )}
          </div>

          {/* Quick Sub-Block Adders */}
          <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
            {currentStage.allowedBlocks
              .filter(t => t !== BLOCK_TYPE.LOOP)
              .map(t => (
                <button
                  key={t}
                  onClick={() => handleAddBlock(t, block.id)}
                  className="kc-loop-btn-small"
                  style={{ width: 'auto', padding: '2px 6px', fontSize: '0.7rem' }}
                  title={`루프 안에 ${BLOCK_INFO[t].name} 추가`}
                >
                  + {BLOCK_INFO[t].symbol}
                </button>
              ))}
          </div>
        </div>
      );
    }

    const info = BLOCK_INFO[block.type];
    return (
      <div
        key={block.id}
        className={`kc-code-block ${isRunning ? 'running' : ''}`}
        style={{ backgroundColor: info.color }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{info.symbol}</span>
          <span>{info.name}</span>
        </div>
        <button
          onClick={() => handleRemoveBlock(block.id)}
          className="kc-block-remove-btn"
          title="블록 삭제"
        >
          ✕
        </button>
      </div>
    );
  };

  return (
    <div className="kc-game-container">
      {/* 1. TOP HEADER & HUD TOOLBAR */}
      <div className="kc-top-bar">
        <div className="kc-stage-badge">
          <span className="kc-stage-chip">STAGE {currentStage.id} / {STAGES.length}</span>
          <span className="kc-stage-title-text">{currentStage.title}</span>
        </div>

        <div className="kc-hud-stats">
          {/* Blocks Counter vs Target */}
          <div className="kc-stat-item" title="현재 사용 블록 수 / 최적 목표 블록 수">
            <span className="kc-stat-label">블록 수:</span>
            <span className={`kc-stat-value ${totalBlocksUsed <= currentStage.targetBlocks ? 'optimal' : 'warning'}`}>
              {totalBlocksUsed} / {currentStage.targetBlocks}개
            </span>
          </div>

          {/* Current Total Score */}
          <div className="kc-stat-item" title="누적 획득 점수">
            <Trophy style={{ width: '13px', height: '13px', color: '#FBBF24' }} />
            <span className="kc-stat-label">점수:</span>
            <span className="kc-stat-value">{score}점</span>
          </div>

          {/* Best Score */}
          <div className="kc-stat-item" title="최고 기록">
            <Sparkles style={{ width: '13px', height: '13px', color: '#38BDF8' }} />
            <span className="kc-stat-label">최고:</span>
            <span style={{ color: '#38BDF8' }}>{bestScore}점</span>
          </div>
        </div>

        <div className="kc-header-actions">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="kc-icon-btn"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button
            onClick={() => setIsHowToOpen(true)}
            className="kc-icon-btn"
            title="게임 방법 및 블록 설명"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </div>

      {/* 2. MAIN SPLIT VIEW (MAP + CODE PANEL) */}
      <div className="kc-main-workspace">
        {/* LEFT / TOP: 2.5D TILE GRID MAP VIEWPORT */}
        <div className="kc-map-viewport">
          <div className="kc-stage-hint-bar">
            <Sparkles size={14} className="text-amber-400 shrink-0" />
            <span>{currentStage.subtitle}</span>
          </div>

          {/* Map Grid Container */}
          <div className="kc-grid-wrapper">
            <div
              className="kc-tile-grid"
              style={{
                gridTemplateColumns: `repeat(${currentStage.gridWidth}, 48px)`
              }}
            >
              {currentStage.grid.map((row, y) =>
                row.map((tile, x) => {
                  let tileClass = 'kc-tile-empty';
                  if (tile === TILE_TYPE.GRASS) tileClass = 'kc-tile-grass';
                  if (tile === TILE_TYPE.DIRT) tileClass = 'kc-tile-dirt';
                  if (tile === TILE_TYPE.WATER) tileClass = 'kc-tile-water';
                  if (tile === TILE_TYPE.STONE) tileClass = 'kc-tile-stone';

                  return (
                    <div key={`${x}-${y}`} className={`kc-tile-cell ${tileClass}`}>
                      {tile === TILE_TYPE.STONE && <span style={{ fontSize: '1.2rem' }}>🪨</span>}
                      {tile === TILE_TYPE.WATER && <span style={{ fontSize: '1.0rem' }}>💧</span>}
                    </div>
                  );
                })
              )}
            </div>

            {/* Carrots Layer */}
            {simState.carrots.map((carrot) => (
              <div
                key={carrot.id}
                className={`kc-carrot ${carrot.collected ? 'collected' : ''}`}
                style={{
                  left: `${12 + carrot.x * 52 + 8}px`,
                  top: `${12 + carrot.y * 52 + 8}px`
                }}
              >
                <svg viewBox="0 0 40 40" width="32" height="32">
                  <path d="M20 12 C18 4, 14 0, 10 2 C14 8, 16 12, 18 14" fill="#22C55E" />
                  <path d="M20 12 C22 4, 26 0, 30 2 C26 8, 24 12, 22 14" fill="#16A34A" />
                  <path d="M20 10 C19 2, 20 0, 21 0 C22 2, 21 10, 20 10" fill="#4ADE80" />
                  <path d="M14 14 Q20 12 26 14 Q24 28 20 38 Q16 28 14 14 Z" fill="#F97316" stroke="#C2410C" strokeWidth="1.5" />
                  <path d="M16 18 Q20 19 24 18" stroke="#EA580C" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M17 24 Q20 25 23 24" stroke="#EA580C" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
              </div>
            ))}

            {/* Animated Rabbit Entity */}
            <div
              className={`kc-rabbit-entity ${rabbitJumping ? 'kc-rabbit-jumping' : ''} ${simState.isFailed ? 'kc-rabbit-fail' : ''}`}
              style={{
                left: `${12 + simState.rabbit.x * 52 + 2}px`,
                top: `${12 + simState.rabbit.y * 52 + 2}px`
              }}
            >
              <div
                className="kc-rabbit-inner"
                style={{
                  transform: `rotate(${DIRECTION_DELTA[simState.rabbit.dir].angle}deg)`
                }}
              >
                <svg viewBox="0 0 50 50" width="44" height="44">
                  {/* Rabbit Ears */}
                  <ellipse cx="18" cy="10" rx="4" ry="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
                  <ellipse cx="18" cy="10" rx="2" ry="7" fill="#FDA4AF" />
                  <ellipse cx="32" cy="10" rx="4" ry="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
                  <ellipse cx="32" cy="10" rx="2" ry="7" fill="#FDA4AF" />
                  {/* Body & Head */}
                  <circle cx="25" cy="30" r="16" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
                  {/* Cheeks */}
                  <circle cx="16" cy="32" r="3" fill="#FECDD3" opacity="0.8" />
                  <circle cx="34" cy="32" r="3" fill="#FECDD3" opacity="0.8" />
                  {/* Eyes */}
                  <circle cx="19" cy="26" r="2.5" fill="#1E293B" />
                  <circle cx="18.2" cy="25.2" r="0.8" fill="#FFFFFF" />
                  <circle cx="31" cy="26" r="2.5" fill="#1E293B" />
                  <circle cx="30.2" cy="25.2" r="0.8" fill="#FFFFFF" />
                  {/* Cute Nose & Mouth */}
                  <polygon points="25,29 23,31 27,31" fill="#F43F5E" />
                  <path d="M23 32 Q25 34 27 32" stroke="#64748B" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT / BOTTOM: SCRATCH-STYLE CODING WORKSPACE */}
        <div className="kc-code-panel">
          {/* TOOLBOX PALETTE */}
          <div className="kc-toolbox-section">
            <div className="kc-section-label">
              <Zap size={12} className="text-amber-400" />
              <span>명령어 블록 팔레트</span>
            </div>
            <div className="kc-palette-tray">
              {currentStage.allowedBlocks.map(blockType => {
                const info = BLOCK_INFO[blockType];
                return (
                  <button
                    key={blockType}
                    onClick={() => handleAddBlock(blockType)}
                    className="kc-block-btn"
                    style={{ backgroundColor: info.color }}
                  >
                    <span>{info.symbol}</span>
                    <span>{info.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ASSEMBLED SCRIPT WORKSPACE */}
          <div className="kc-script-workspace">
            {blocks.length === 0 ? (
              <div className="kc-empty-workspace-msg">
                <p>위 팔레트에서 블록을 클릭하여 추가하세요.</p>
                <p style={{ fontSize: '0.72rem', marginTop: '4px', color: '#475569' }}>
                  힌트: {currentStage.hint}
                </p>
              </div>
            ) : (
              blocks.map(block => renderBlockItem(block))
            )}
          </div>

          {/* CONTROLS TOOLBAR */}
          <div className="kc-controls-bar">
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleTogglePlay}
                disabled={blocks.length === 0}
                className={`kc-play-btn ${gameState === 'RUNNING' ? 'running' : ''}`}
              >
                {gameState === 'RUNNING' ? (
                  <>
                    <Pause size={16} />
                    <span>일시정지</span>
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    <span>실행 (Play)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSingleStep}
                disabled={blocks.length === 0 || gameState === 'RUNNING'}
                className="kc-secondary-btn"
                title="한 단계씩 실행"
              >
                <SkipForward size={14} />
                <span>1단계</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleResetSimulation}
                className="kc-secondary-btn"
                title="토끼 위치 초기화"
              >
                <RotateCcw size={14} />
                <span>원위치</span>
              </button>

              <button
                onClick={handleClearWorkspace}
                className="kc-secondary-btn"
                title="작업 공간 블록 전체 삭제"
              >
                <Trash2 size={14} className="text-red-400" />
                <span>비우기</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. STAGE CLEAR OVERLAY MODAL */}
      {gameState === 'STAGE_CLEAR' && (
        <div className="kc-overlay-modal">
          <div className="kc-modal-card">
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎉</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34D399', margin: 0 }}>
              스테이지 클리어!
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '4px' }}>
              모든 당근을 완벽하게 수확했습니다!
            </p>

            {/* Stars Rating */}
            <div className="kc-stars-row">
              <Star className="kc-star-icon" />
              <Star className={`kc-star-icon ${totalBlocksUsed <= currentStage.targetBlocks + 2 ? '' : 'empty'}`} />
              <Star className={`kc-star-icon ${totalBlocksUsed <= currentStage.targetBlocks ? '' : 'empty'}`} />
            </div>

            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '10px',
              padding: '10px',
              margin: '12px 0',
              fontSize: '0.8rem'
            }}>
              <div>사용한 블록: <strong>{totalBlocksUsed}개</strong> (최적 목표: {currentStage.targetBlocks}개)</div>
              {totalBlocksUsed <= currentStage.targetBlocks ? (
                <div style={{ color: '#FBBF24', fontWeight: 800, marginTop: '4px' }}>
                  ✨ 최적화 보너스 획득! (+{currentStage.optimalBonus}점)
                </div>
              ) : (
                <div style={{ color: '#94A3B8', fontSize: '0.72rem', marginTop: '4px' }}>
                  💡 블록 수를 줄이면 최적화 보너스 점수를 받을 수 있어요!
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={handleResetSimulation}
                className="kc-secondary-btn"
                style={{ padding: '8px 16px' }}
              >
                다시 도전 🔄
              </button>
              <button
                onClick={handleNextStage}
                className="kc-play-btn"
              >
                <span>다음 스테이지</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. ALL STAGES MASTERED / VICTORY OVERLAY */}
      {gameState === 'ALL_CLEAR' && (
        <div className="kc-overlay-modal">
          <div className="kc-modal-card">
            <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🏆</div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#FBBF24', margin: 0 }}>
              도촌 코딩 마스터 등극!
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#E2E8F0', marginTop: '6px' }}>
              모든 8개 스테이지를 정복하고 당근을 모두 수확했습니다!
            </p>

            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '12px',
              padding: '12px',
              margin: '14px 0',
              border: '1px solid rgba(251, 191, 36, 0.4)'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>최종 달성 점수</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FBBF24' }}>
                {score}점
              </div>
            </div>

            {/* Hall of Fame Submission Form (GEMINI.md Rule: score > 100) */}
            {score > 100 && (
              <div className="kc-leaderboard-form">
                <div className="kc-leaderboard-title">
                  <Trophy size={15} />
                  <span>도촌초등학교 명예의 전당 등록</span>
                </div>
                {hasSubmitted ? (
                  <div style={{ color: '#10B981', fontSize: '0.82rem', fontWeight: 800, marginTop: '8px' }}>
                    ✅ 명예의 전당에 점수가 성공적으로 등록되었습니다!
                  </div>
                ) : (
                  <form onSubmit={handleSubmitScore}>
                    <p style={{ fontSize: '0.72rem', color: '#94A3B8', margin: '0 0 6px 0' }}>
                      이름을 입력하고 학교 친구들과 순위를 겨뤄보세요!
                    </p>
                    <div className="kc-input-row">
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="예: 홍길동"
                        maxLength={10}
                        className="kc-input"
                        disabled={isSubmitting}
                      />
                      <button
                        type="submit"
                        disabled={!playerName.trim() || isSubmitting}
                        className="kc-submit-btn"
                      >
                        {isSubmitting ? '등록 중...' : '랭킹 등록'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            <div style={{ marginTop: '16px' }}>
              <button
                onClick={() => {
                  setStageIndex(0);
                  setScore(0);
                  setClearedStages({});
                  handleResetSimulation();
                }}
                className="kc-secondary-btn"
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
              >
                처음부터 다시 플레이하기 🔄
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. EXECUTION FAILURE OVERLAY */}
      {gameState === 'FAILED' && (
        <div className="kc-overlay-modal" style={{ background: 'rgba(15, 23, 42, 0.7)' }}>
          <div className="kc-modal-card" style={{ borderColor: '#EF4444' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🐰💦</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#F87171', margin: 0 }}>
              당근을 다 먹지 못했어요!
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#CBD5E1', marginTop: '6px' }}>
              {simState.failReason === 'FALL' && '토끼가 밭 바깥으로 떨어졌어요! 회전 블록을 확인해보세요.'}
              {simState.failReason === 'WATER' && '토끼가 물웅덩이에 빠졌어요! 길을 우회해보세요.'}
              {simState.failReason === 'BLOCKED' && '돌 장애물에 부딪혔어요! 다른 경로를 설계해보세요.'}
              {simState.failReason === 'INCOMPLETE' && '코드가 끝났지만 남은 당근이 있어요. 블록을 더 추가해보세요!'}
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
              <button
                onClick={handleResetSimulation}
                className="kc-play-btn"
                style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}
              >
                코드 수정 & 재도전 🛠️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. HOW TO PLAY MODAL */}
      <KidsCodingHowToPlayModal
        isOpen={isHowToOpen}
        onClose={() => setIsHowToOpen(false)}
      />
    </div>
  );
}
