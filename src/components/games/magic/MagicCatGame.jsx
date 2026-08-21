import React, { useRef, useState, useEffect } from 'react';
import { MagicGameLogic } from './magicLogic';
import { GestureRecognizer } from './magicRecognizer';
import { magicAudio } from './magicAudio';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_MAX_HP } from './magicConstants';
import MagicCatHowToPlayModal from './MagicCatHowToPlayModal';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import { haptics } from '../../../utils/haptics';
import {
  Trophy, RotateCcw, Volume2, VolumeX, HelpCircle,
  Heart, Sparkles, Wand2, Flame, Award, CheckCircle2, User, Send
} from 'lucide-react';
import './magic.css';

export default function MagicCatGame({ onScoreSubmitted }) {
  const canvasRef = useRef(null);
  const logicRef = useRef(null);
  const reqAnimRef = useRef(null);

  const [gameState, setGameState] = useState('PLAYING');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const [isMuted, setIsMuted] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [stageAnnouncement, setStageAnnouncement] = useState(null);

  // Leaderboard submission states
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isDrawingRef = useRef(false);
  const strokePointsRef = useRef([]);

  // Initialize Game
  useEffect(() => {
    const logic = new MagicGameLogic();
    logicRef.current = logic;
    logic.startStage(0);

    setStageAnnouncement(logic.currentStage.title);
    const announceTimer = setTimeout(() => {
      setStageAnnouncement(null);
    }, 2800);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let lastStageIdx = 0;

    const loop = () => {
      if (logicRef.current) {
        logicRef.current.update();
        logicRef.current.render(ctx);

        // Synchronize React states
        setScore(logicRef.current.score);
        setCombo(logicRef.current.combo);
        setMaxCombo(logicRef.current.maxCombo);
        setPlayerHp(logicRef.current.player.hp);
        setGameState(logicRef.current.gameState);

        // Stage change announcement
        if (logicRef.current.stageIndex !== lastStageIdx) {
          lastStageIdx = logicRef.current.stageIndex;
          setStageIndex(lastStageIdx);
          setStageAnnouncement(logicRef.current.currentStage.title);
          setTimeout(() => {
            setStageAnnouncement(null);
          }, 2800);
        }
      }
      reqAnimRef.current = requestAnimationFrame(loop);
    };

    reqAnimRef.current = requestAnimationFrame(loop);

    return () => {
      if (reqAnimRef.current) {
        cancelAnimationFrame(reqAnimRef.current);
      }
      clearTimeout(announceTimer);
    };
  }, []);

  // Handle Audio Mute Toggle
  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    magicAudio.setMuted(nextMute);
  };

  // Restart Game
  const handleRestart = () => {
    if (logicRef.current) {
      logicRef.current.reset();
      logicRef.current.startStage(0);
      setGameState('PLAYING');
      setStageIndex(0);
      setScore(0);
      setCombo(0);
      setIsSubmitted(false);
      setPlayerName('');
      setStageAnnouncement(logicRef.current.currentStage.title);
      setTimeout(() => {
        setStageAnnouncement(null);
      }, 2500);
    }
  };

  // Canvas Coordinate Mapping
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
      y: (clientY - rect.top) * scaleY,
      t: Date.now()
    };
  };

  // Pointer & Touch Drawing Handlers
  const handlePointerDown = (e) => {
    if (gameState !== 'PLAYING') return;
    isDrawingRef.current = true;
    const pt = getCanvasCoords(e);
    strokePointsRef.current = [pt];
    if (logicRef.current) {
      logicRef.current.currentStroke = strokePointsRef.current;
    }
    magicAudio.playWandDraw();
    haptics.light();
  };

  const handlePointerMove = (e) => {
    if (!isDrawingRef.current || gameState !== 'PLAYING') return;
    const pt = getCanvasCoords(e);
    strokePointsRef.current.push(pt);
    if (logicRef.current) {
      logicRef.current.currentStroke = strokePointsRef.current;
    }
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current || gameState !== 'PLAYING') return;
    isDrawingRef.current = false;

    const points = strokePointsRef.current;
    if (points.length >= 5) {
      const recognizedSymbol = GestureRecognizer.recognize(points);
      if (recognizedSymbol && logicRef.current) {
        haptics.heavy();
        logicRef.current.onGestureRecognized(recognizedSymbol);
      }
    }

    strokePointsRef.current = [];
    if (logicRef.current) {
      logicRef.current.currentStroke = [];
    }
  };

  // Leaderboard Score Submission
  const handleSubmitScore = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting || isSubmitted || score <= 100) return;

    setIsSubmitting(true);
    try {
      await submitScoreToDB('magic', playerName.trim(), score);
      setIsSubmitted(true);
      if (onScoreSubmitted) {
        onScoreSubmitted();
      }
    } catch (err) {
      console.error('Failed to submit score:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="magic-game-wrapper">
      {/* 1. Header HUD Bar */}
      <header className="magic-hud-bar">
        {/* Left: Stage info & HP */}
        <div className="magic-hud-left">
          <div className="magic-stat-badge">
            <Wand2 className="w-4 h-4 text-amber-300" />
            <span>{stageIndex + 1}단계: {logicRef.current?.currentStage?.title?.split(':')[1]?.trim() || '도서관'}</span>
          </div>

          {/* Player HP Hearts */}
          <div className="magic-hearts-container" title={`남은 생명력: ${playerHp}/${PLAYER_MAX_HP}`}>
            {Array.from({ length: PLAYER_MAX_HP }).map((_, i) => (
              <Heart
                key={i}
                className={`magic-heart-icon ${i < playerHp ? 'magic-heart-active' : 'magic-heart-lost'}`}
              />
            ))}
          </div>
        </div>

        {/* Center: Combo Pill (if active) */}
        {combo > 1 && (
          <div className="magic-combo-pill">
            <Flame className="w-4 h-4 text-amber-200 animate-bounce" />
            <span>{combo} COMBO! (+{combo * 25})</span>
          </div>
        )}

        {/* Right: Score & Designed Action Buttons */}
        <div className="magic-hud-right">
          <div className="magic-stat-badge magic-score-badge">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{score.toLocaleString()}점</span>
          </div>

          {/* Help Button */}
          <button
            onClick={() => setShowHowToPlay(true)}
            className="magic-hud-btn magic-hud-btn-help"
            title="게임 방법 및 마법 심볼 안내"
          >
            <HelpCircle className="w-4 h-4 text-purple-300" />
            <span>게임방법</span>
          </button>

          {/* Sound Toggle Button */}
          <button
            onClick={toggleMute}
            className={`magic-hud-btn ${isMuted ? 'magic-hud-btn-muted' : 'magic-hud-btn-sound'}`}
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span>음소거</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>소리 켬</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 2. Main Drawing Canvas Container */}
      <main className="magic-canvas-container">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="magic-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />

        {/* In-Game Subtle Hint Guide Bar */}
        {gameState === 'PLAYING' && (
          <div className="magic-hint-bar">
            <span>🪄</span>
            <span>화면에 마법 기호</span>
            <span className="magic-hint-pill">( — │ ∧ ∨ ⚡ ❤️ )</span>
            <span>를 마우스나 터치로 그리세요!</span>
          </div>
        )}

        {/* Stage Announcement Banner */}
        {stageAnnouncement && (
          <div className="magic-stage-banner">
            <h3 className="text-sm font-black text-amber-300 tracking-wide uppercase flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {stageAnnouncement}
            </h3>
            <p className="text-[11px] text-purple-200 mt-1 font-medium">
              {logicRef.current?.currentStage?.subtitle}
            </p>
          </div>
        )}

        {/* 3. Game Result Overlays (Game Over / Victory) */}
        {(gameState === 'GAME_OVER' || gameState === 'VICTORY') && (
          <div className="magic-result-overlay">
            <div className="magic-result-card">
              {gameState === 'VICTORY' ? (
                <>
                  <div className="magic-result-icon-box magic-result-icon-victory">
                    <Trophy className="w-8 h-8 animate-bounce" />
                  </div>
                  <h2 className="magic-result-title text-amber-300">
                    🎉 대마법서 탈환 성공! 축하합니다!
                  </h2>
                  <p className="text-xs text-purple-200 mb-2">
                    모모와 함께 5대 스테이지를 돌파하고 마법학교의 평화를 되찾았습니다!
                  </p>
                </>
              ) : (
                <>
                  <div className="magic-result-icon-box magic-result-icon-defeat">
                    <Wand2 className="w-8 h-8 rotate-45" />
                  </div>
                  <h2 className="magic-result-title text-rose-400">
                    마법학교 수호 실패!
                  </h2>
                  <p className="text-xs text-slate-300 mb-2">
                    유령 군단의 습격을 받았습니다. 지팡이를 다시 들고 도전해보세요!
                  </p>
                </>
              )}

              {/* Score breakdown stats */}
              <div className="magic-score-display">
                <div className="magic-score-stat-box">
                  <span className="magic-score-stat-label">최종 획득 점수</span>
                  <span className="magic-score-stat-val text-amber-300">
                    {score.toLocaleString()}점
                  </span>
                </div>
                <div className="magic-score-stat-box">
                  <span className="magic-score-stat-label">최대 콤보</span>
                  <span className="magic-score-stat-val text-purple-300">
                    {maxCombo}x
                  </span>
                </div>
                <div className="magic-score-stat-box">
                  <span className="magic-score-stat-label">도달 스테이지</span>
                  <span className="magic-score-stat-val text-emerald-400">
                    {stageIndex + 1}단계
                  </span>
                </div>
              </div>

              {/* Designed Leaderboard Submission Box (Only if score > 100) */}
              {score > 100 && (
                <div className="magic-leaderboard-box">
                  <div className="magic-leaderboard-header">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>도촌초등학교 명예의 전당 점수 등록</span>
                  </div>

                  {!isSubmitted ? (
                    <form onSubmit={handleSubmitScore} className="magic-input-form">
                      <div className="magic-input-wrapper">
                        <User className="magic-input-icon" />
                        <input
                          type="text"
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                          placeholder="예: 홍길동"
                          maxLength={10}
                          required
                          className="magic-input-field"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting || !playerName.trim()}
                        className="magic-submit-btn"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSubmitting ? '등록 중...' : '랭킹 등록'}</span>
                      </button>
                    </form>
                  ) : (
                    <div className="magic-submitted-banner">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>명예의 전당 등록이 완료되었습니다!</span>
                    </div>
                  )}
                </div>
              )}

              {/* Restart Button */}
              <button onClick={handleRestart} className="magic-btn-primary magic-btn-restart w-full">
                <RotateCcw className="w-4 h-4" />
                <span>마법학교 다시 시작하기</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 4. How to Play Modal */}
      <MagicCatHowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />
    </div>
  );
}
