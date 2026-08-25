import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Trophy, RotateCcw, Volume2, VolumeX, HelpCircle, Sparkles, 
  Brain, Music, Layers, Zap, Clock, Award, CheckCircle2, AlertCircle, Play, ChevronRight 
} from 'lucide-react';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import { haptics } from '../../../utils/haptics';
import { 
  GAME_MODES, CARD_THEMES, CARD_DIFFICULTIES, SIMON_BUTTONS 
} from './memoryConstants';
import { memoryAudio } from './memoryAudio';
import MemoryHowToPlayModal from './MemoryHowToPlayModal';
import './memory.css';

export default function MemoryGame({ onScoreSubmitted }) {
  // Navigation & Mode
  const [gameMode, setGameMode] = useState(GAME_MODES.CARD_MATCH); // 'card_match' or 'simon_rhythm'
  const [inGame, setInGame] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Common Score & Leaderboard Submission
  const [score, setScore] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [comboText, setComboText] = useState('');

  // ----------------------------------------------------
  // Mode 1: Card Match States
  // ----------------------------------------------------
  const [selectedTheme, setSelectedTheme] = useState('ANIMALS');
  const [selectedDifficulty, setSelectedDifficulty] = useState('MEDIUM');
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [isProcessingMatch, setIsProcessingMatch] = useState(false);

  // ----------------------------------------------------
  // Mode 2: Simon Rhythm States
  // ----------------------------------------------------
  const [simonRound, setSimonRound] = useState(1);
  const [simonSequence, setSimonSequence] = useState([]);
  const [playerStep, setPlayerStep] = useState(0);
  const [activeSimonButton, setActiveSimonButton] = useState(null);
  const [isSimonPlayingSequence, setIsSimonPlayingSequence] = useState(false);
  const [simonStatusText, setSimonStatusText] = useState('집중하세요!');

  // Timer Ref
  const timerRef = useRef(null);

  // Sound Mute Toggle
  const handleToggleMute = () => {
    const muted = memoryAudio.toggleMute();
    setIsMuted(muted);
    haptics.light();
  };

  // Combo trigger helper
  const triggerComboFeedback = (newCombo) => {
    if (newCombo >= 2) {
      setComboText(`🔥 ${newCombo}연속 콤보! +${newCombo * 100}점`);
      setTimeout(() => setComboText(''), 1000);
    }
  };

  // ====================================================
  // Mode 1: Card Match Logic
  // ====================================================
  const initCardMatch = useCallback(() => {
    const diff = CARD_DIFFICULTIES[selectedDifficulty];
    const theme = CARD_THEMES[selectedTheme];
    
    // Pick required number of unique card pairs
    const chosenCards = theme.cards.slice(0, diff.pairs);
    
    // Duplicate for pairs and add unique instance ids
    const deck = [];
    chosenCards.forEach(card => {
      deck.push({ ...card, instanceId: `${card.id}_1`, pairKey: card.id });
      deck.push({ ...card, instanceId: `${card.id}_2`, pairKey: card.id });
    });

    // Fisher-Yates Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlippedIndices([]);
    setMatchedIds([]);
    setMoves(0);
    setTimeLeft(diff.timeLimit);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setInGame(true);
    setGameOver(false);
    setGameWon(false);
    setSubmitSuccess(false);
    setIsProcessingMatch(false);
  }, [selectedDifficulty, selectedTheme]);

  // Card Match Timer
  useEffect(() => {
    if (inGame && gameMode === GAME_MODES.CARD_MATCH && !gameOver && !gameWon) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleCardMatchTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [inGame, gameMode, gameOver, gameWon]);

  const handleCardMatchTimeUp = () => {
    setGameOver(true);
    memoryAudio.playGameOver();
    haptics.error();
  };

  // Handle Card Click
  const handleCardClick = (index) => {
    if (!inGame || isProcessingMatch || gameOver || gameWon) return;
    if (flippedIndices.includes(index) || matchedIds.includes(cards[index].instanceId)) return;

    memoryAudio.playCardFlip();
    haptics.light();

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setIsProcessingMatch(true);

      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = cards[firstIdx];
      const secondCard = cards[secondIdx];

      if (firstCard.pairKey === secondCard.pairKey) {
        // MATCH SUCCESS!
        const nextCombo = combo + 1;
        setCombo(nextCombo);
        if (nextCombo > maxCombo) setMaxCombo(nextCombo);

        const diff = CARD_DIFFICULTIES[selectedDifficulty];
        const matchBaseScore = 150;
        const comboBonus = (nextCombo - 1) * 80;
        setScore(s => s + matchBaseScore + comboBonus);

        memoryAudio.playMatchSuccess(nextCombo);
        haptics.success();
        triggerComboFeedback(nextCombo);

        setMatchedIds(prev => [...prev, firstCard.instanceId, secondCard.instanceId]);
        setFlippedIndices([]);
        setIsProcessingMatch(false);

        // Check Victory
        const diffPairs = diff.pairs;
        if (matchedIds.length + 2 >= diffPairs * 2) {
          handleCardMatchWin(nextCombo);
        }
      } else {
        // MISMATCH
        setCombo(0);
        memoryAudio.playMismatch();
        haptics.medium();

        setTimeout(() => {
          setFlippedIndices([]);
          setIsProcessingMatch(false);
        }, 750);
      }
    }
  };

  const handleCardMatchWin = (finalCombo) => {
    clearInterval(timerRef.current);
    const diff = CARD_DIFFICULTIES[selectedDifficulty];
    const timeBonus = timeLeft * diff.timeBonusMultiplier;
    const accuracyBonus = Math.max(0, (diff.pairs * 2.5 - moves) * 30);
    const totalFinalScore = Math.max(diff.minScore, score + 150 + diff.baseScore + timeBonus + accuracyBonus);

    setScore(Math.round(totalFinalScore));
    setGameWon(true);
    setGameOver(true);
    memoryAudio.playGameWin();
    haptics.success();
  };

  // ====================================================
  // Mode 2: Simon Rhythm Logic
  // ====================================================
  const initSimonGame = useCallback(() => {
    setSimonRound(1);
    setSimonSequence([]);
    setPlayerStep(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setInGame(true);
    setGameOver(false);
    setGameWon(false);
    setSubmitSuccess(false);
    setIsSimonPlayingSequence(true);
    setSimonStatusText('첫 번째 멜로디를 잘 듣고 기억하세요!');

    // Start with 1 random button
    const firstBtn = Math.floor(Math.random() * 4);
    const initialSeq = [firstBtn];
    setSimonSequence(initialSeq);

    setTimeout(() => {
      playSimonSequence(initialSeq);
    }, 800);
  }, []);

  // Play Sequence with lights and audio
  const playSimonSequence = (sequence) => {
    setIsSimonPlayingSequence(true);
    setSimonStatusText('🎶 도촌 멜로디가 연주 중입니다...');

    sequence.forEach((btnId, idx) => {
      setTimeout(() => {
        const btnObj = SIMON_BUTTONS[btnId];
        setActiveSimonButton(btnId);
        memoryAudio.playSimonTone(btnObj.freq, 0.4);

        setTimeout(() => {
          setActiveSimonButton(null);
        }, 320);

        if (idx === sequence.length - 1) {
          setTimeout(() => {
            setIsSimonPlayingSequence(false);
            setPlayerStep(0);
            setSimonStatusText('👉 여러분의 차례입니다! 순서대로 눌러보세요.');
          }, 450);
        }
      }, idx * 600 + 400);
    });
  };

  // Handle Simon Button Click
  const handleSimonButtonClick = (btnId) => {
    if (!inGame || isSimonPlayingSequence || gameOver) return;

    const btnObj = SIMON_BUTTONS[btnId];
    setActiveSimonButton(btnId);
    memoryAudio.playSimonTone(btnObj.freq, 0.3);
    haptics.light();

    setTimeout(() => {
      setActiveSimonButton(null);
    }, 200);

    // Validate Input
    if (simonSequence[playerStep] === btnId) {
      // Correct step
      const nextStep = playerStep + 1;
      setPlayerStep(nextStep);

      if (nextStep === simonSequence.length) {
        // ROUND COMPLETE!
        const nextRound = simonRound + 1;
        const roundScore = simonRound * 250;
        const newScore = score + roundScore;
        setScore(newScore);
        setSimonRound(nextRound);
        setCombo(c => c + 1);

        memoryAudio.playRoundClear();
        haptics.success();
        setSimonStatusText(`🎉 라운드 ${simonRound} 성공! +${roundScore}점`);

        const nextBtn = Math.floor(Math.random() * 4);
        const nextSeq = [...simonSequence, nextBtn];
        setSimonSequence(nextSeq);

        setTimeout(() => {
          playSimonSequence(nextSeq);
        }, 1200);
      }
    } else {
      // WRONG STEP - GAME OVER
      setGameOver(true);
      setSimonStatusText('앗! 순서가 틀렸습니다.');
      memoryAudio.playGameOver();
      haptics.error();
    }
  };

  // ====================================================
  // Submit High Score to Leaderboard
  // ====================================================
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting || score <= 100) return;

    setIsSubmitting(true);
    try {
      await submitScoreToDB('memory', playerName.trim(), score);
      setSubmitSuccess(true);
      haptics.success();

      // Trigger automatic tab switch in Leaderboard modal
      if (onScoreSubmitted) {
        onScoreSubmitted('memory');
      }
    } catch (err) {
      console.error('Score submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get exact CSS class for Grid Columns
  const getGridClass = () => {
    const cols = CARD_DIFFICULTIES[selectedDifficulty].cols;
    if (cols === 5) return 'memory-grid-cols-5';
    if (cols === 4) return 'memory-grid-cols-4';
    return 'memory-grid-cols-3';
  };

  return (
    <div className="memory-game-root">
      
      {/* 1. Top Header Navigation Bar */}
      <div className="memory-header-panel">
        <div className="memory-title-group">
          <div className="memory-logo-badge">
            🧠
          </div>
          <div>
            <div className="memory-title-main">
              도촌 기억력 마스터
            </div>
            <div className="memory-title-sub">
              {gameMode === GAME_MODES.CARD_MATCH ? '🃏 3D 카드 짝 맞추기 퍼즐' : '🎵 멜로디 & 순서 기억 챌린지'}
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="memory-tools-group">
          <button
            onClick={() => setIsHowToPlayOpen(true)}
            className="memory-tool-btn"
            title="게임 가이드"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">가이드</span>
          </button>

          <button
            onClick={handleToggleMute}
            className="memory-tool-btn"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {inGame && (
            <button
              onClick={() => {
                clearInterval(timerRef.current);
                setInGame(false);
                setGameOver(false);
                setGameWon(false);
                haptics.light();
              }}
              className="memory-tool-btn primary"
              title="모드 변경 / 메뉴"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>메뉴</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Combo Banner */}
      {comboText && (
        <div className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black text-xs sm:text-sm rounded-full shadow-lg mb-2 animate-bounce">
          {comboText}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SCREEN 1: Game Mode & Options Selection Menu */}
      {/* ---------------------------------------------------- */}
      {!inGame && !gameOver && (
        <div className="memory-lobby-card">
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>도촌초 어린이 두뇌 훈련 프로젝트</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
            플레이할 두뇌 모드를 선택하세요!
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            단기 기억력과 집중력을 키우는 최고의 아케이드 퍼즐
          </p>

          {/* Mode Tabs */}
          <div className="memory-mode-select-grid">
            
            {/* Mode A: Card Match */}
            <div
              onClick={() => {
                setGameMode(GAME_MODES.CARD_MATCH);
                haptics.light();
              }}
              className={`memory-mode-btn ${gameMode === GAME_MODES.CARD_MATCH ? 'active' : ''}`}
            >
              <span className="text-3xl mb-2">🃏</span>
              <div className="font-black text-sm text-white mb-1">3D 카드 짝 맞추기</div>
              <div className="text-[11px] text-slate-300">
                카드를 뒤집어 같은 짝을 찾고 콤보 기록을 세우세요!
              </div>
            </div>

            {/* Mode B: Simon Rhythm */}
            <div
              onClick={() => {
                setGameMode(GAME_MODES.SIMON_RHYTHM);
                haptics.light();
              }}
              className={`memory-mode-btn ${gameMode === GAME_MODES.SIMON_RHYTHM ? 'active' : ''}`}
            >
              <span className="text-3xl mb-2">🎵</span>
              <div className="font-black text-sm text-white mb-1">멜로디 & 순서 기억</div>
              <div className="text-[11px] text-slate-300">
                동물 악기가 연주하는 소리 순서를 기억해 터치하세요!
              </div>
            </div>
          </div>

          {/* Mode-Specific Sub Options */}
          {gameMode === GAME_MODES.CARD_MATCH && (
            <div className="memory-options-box">
              
              {/* Theme Picker */}
              <div className="memory-option-row">
                <div className="memory-option-label">🎨 카드 테마 선택</div>
                <div className="memory-chips-grid">
                  {Object.keys(CARD_THEMES).map(themeKey => {
                    const t = CARD_THEMES[themeKey];
                    const isSelected = selectedTheme === themeKey;
                    return (
                      <button
                        key={themeKey}
                        onClick={() => {
                          setSelectedTheme(themeKey);
                          haptics.light();
                        }}
                        className={`memory-chip-btn ${isSelected ? 'active' : ''}`}
                      >
                        <span>{t.icon}</span>
                        <span>{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty Picker */}
              <div className="memory-option-row">
                <div className="memory-option-label">⚡ 난이도 선택</div>
                <div className="memory-chips-grid">
                  {Object.keys(CARD_DIFFICULTIES).map(diffKey => {
                    const d = CARD_DIFFICULTIES[diffKey];
                    const isSelected = selectedDifficulty === diffKey;
                    return (
                      <button
                        key={diffKey}
                        onClick={() => {
                          setSelectedDifficulty(diffKey);
                          haptics.light();
                        }}
                        className={`memory-chip-btn ${isSelected ? 'active' : ''}`}
                      >
                        <span>{d.name}</span>
                        <span className="text-[10px] opacity-75">({d.timeLimit}초)</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={() => {
              if (gameMode === GAME_MODES.CARD_MATCH) {
                initCardMatch();
              } else {
                initSimonGame();
              }
              haptics.medium();
            }}
            className="memory-start-btn"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>게임 시작하기!</span>
          </button>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SCREEN 2-A: Card Match Active Gameplay */}
      {/* ---------------------------------------------------- */}
      {inGame && !gameOver && gameMode === GAME_MODES.CARD_MATCH && (
        <div className="w-full flex flex-col items-center">
          
          {/* Dashboard HUD */}
          <div className="memory-hud-bar">
            <div className="memory-hud-card">
              <div className="memory-hud-label">
                <Clock className="w-3.5 h-3.5 text-cyan-400" /> 시간
              </div>
              <div className={`memory-hud-value ${timeLeft <= 10 ? 'urgent' : ''}`}>
                {timeLeft}초
              </div>
            </div>

            <div className="memory-hud-card">
              <div className="memory-hud-label">
                <Layers className="w-3.5 h-3.5 text-amber-400" /> 매칭
              </div>
              <div className="memory-hud-value text-amber-300">
                {matchedIds.length / 2}/{CARD_DIFFICULTIES[selectedDifficulty].pairs}
              </div>
            </div>

            <div className="memory-hud-card">
              <div className="memory-hud-label">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> 콤보
              </div>
              <div className="memory-hud-value text-purple-300">
                {combo > 0 ? `${combo}x` : '-'}
              </div>
            </div>

            <div className="memory-hud-card">
              <div className="memory-hud-label">
                <Zap className="w-3.5 h-3.5 text-pink-400" /> 점수
              </div>
              <div className="memory-hud-value text-pink-300">
                {score.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Cards 3D Board */}
          <div className="memory-board-wrapper">
            <div className={getGridClass()}>
              {cards.map((card, idx) => {
                const isFlipped = flippedIndices.includes(idx);
                const isMatched = matchedIds.includes(card.instanceId);

                return (
                  <div
                    key={card.instanceId}
                    onClick={() => handleCardClick(idx)}
                    className={`memory-card-box ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''}`}
                  >
                    <div className="memory-card-flipper">
                      {/* Hidden Back */}
                      <div className="memory-card-face memory-card-back-style">
                        <div className="memory-card-back-pattern">
                          ?
                        </div>
                      </div>

                      {/* Revealed Front */}
                      <div className="memory-card-face memory-card-front-style">
                        <span className="memory-card-emoji">
                          {card.emoji}
                        </span>
                        <span className="memory-card-label">
                          {card.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SCREEN 2-B: Simon Rhythm Active Gameplay */}
      {/* ---------------------------------------------------- */}
      {inGame && !gameOver && gameMode === GAME_MODES.SIMON_RHYTHM && (
        <div className="w-full flex flex-col items-center">
          
          {/* Dashboard HUD */}
          <div className="memory-hud-bar" style={{ maxWidth: '440px' }}>
            <div className="memory-hud-card" style={{ gridColumn: 'span 2' }}>
              <div className="memory-hud-label">
                <Award className="w-3.5 h-3.5 text-cyan-400" /> 스테이지
              </div>
              <div className="memory-hud-value text-cyan-300">
                STAGE {simonRound}
              </div>
            </div>

            <div className="memory-hud-card" style={{ gridColumn: 'span 2' }}>
              <div className="memory-hud-label">
                <Zap className="w-3.5 h-3.5 text-pink-400" /> 누적 점수
              </div>
              <div className="memory-hud-value text-pink-300">
                {score.toLocaleString()}점
              </div>
            </div>
          </div>

          {/* Simon Board */}
          <div className="memory-simon-board">
            <div className="memory-simon-status-box">
              {simonStatusText}
            </div>

            <div className="memory-simon-grid">
              {SIMON_BUTTONS.map(btn => {
                const isActive = activeSimonButton === btn.id;

                return (
                  <button
                    key={btn.id}
                    disabled={isSimonPlayingSequence}
                    onClick={() => handleSimonButtonClick(btn.id)}
                    className={`memory-simon-pad ${btn.color} ${isActive ? 'active' : ''}`}
                  >
                    <span className="memory-simon-icon">
                      {btn.icon}
                    </span>
                    <span className="memory-simon-name">
                      {btn.name}
                    </span>
                    <span className="memory-simon-sub">
                      {btn.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SCREEN 3: Game Over & Leaderboard Registration Screen */}
      {/* ---------------------------------------------------- */}
      {gameOver && (
        <div className="memory-result-card">
          
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30 mb-3">
            {gameWon ? '🏆' : '🧠'}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white mb-1">
            {gameWon ? '미션 완벽 클리어!' : '도전 종료!'}
          </h2>
          <p className="text-xs text-indigo-200 mb-3">
            {gameMode === GAME_MODES.CARD_MATCH 
              ? '모든 카드의 짝을 완벽하게 맞추셨습니다!' 
              : `스테이지 ${simonRound}단계까지 성공하셨습니다!`}
          </p>

          {/* Final Score Box */}
          <div className="memory-score-highlight-box">
            <div className="text-xs font-bold text-indigo-300 mb-1">최종 획득 점수</div>
            <div className="memory-score-number">
              {score.toLocaleString()} <span className="text-lg text-amber-200">점</span>
            </div>
            {maxCombo >= 2 && (
              <div className="text-xs font-bold text-pink-400 mt-1">
                최고 연속 콤보: {maxCombo}회 달성! 🔥
              </div>
            )}
          </div>

          {/* Leaderboard Form (Rule: score > 100 only) */}
          {score > 100 ? (
            <div className="w-full bg-slate-800/80 border border-amber-500/30 rounded-2xl p-4 mb-2">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 mb-2.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>도촌초 명예의 전당 랭킹 등록</span>
              </div>

              {!submitSuccess ? (
                <form onSubmit={handleScoreSubmit} className="memory-submit-form">
                  <input
                    type="text"
                    required
                    maxLength={12}
                    placeholder="예: 홍길동"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="memory-nickname-input"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !playerName.trim()}
                    className="memory-submit-btn"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>{isSubmitting ? '기록 등록 중...' : '명예의 전당 점수 등록'}</span>
                  </button>
                </form>
              ) : (
                <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>점수가 명예의 전당에 성공적으로 등록되었습니다! 🎉</span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full p-2.5 bg-slate-800/40 border border-slate-700 rounded-xl text-slate-400 text-xs mb-2">
              💡 100점 초과 달성 시 명예의 전당에 점수를 등록할 수 있습니다.
            </div>
          )}

          {/* Bottom Buttons */}
          <div className="memory-btn-row">
            <button
              onClick={() => {
                if (gameMode === GAME_MODES.CARD_MATCH) {
                  initCardMatch();
                } else {
                  initSimonGame();
                }
                haptics.medium();
              }}
              className="memory-action-btn primary"
            >
              <RotateCcw className="w-4 h-4" />
              <span>다시 도전하기</span>
            </button>

            <button
              onClick={() => {
                setInGame(false);
                setGameOver(false);
                setGameWon(false);
                haptics.light();
              }}
              className="memory-action-btn secondary"
            >
              <Layers className="w-4 h-4" />
              <span>모드 선택 메뉴</span>
            </button>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      <MemoryHowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
}
