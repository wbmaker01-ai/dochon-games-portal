import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MagicGameLogic } from './magicLogic';
import { GestureRecognizer } from './magicRecognizer';
import { magicAudio } from './magicAudio';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_MAX_HP } from './magicConstants';
import MagicCatHowToPlayModal from './MagicCatHowToPlayModal';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import {
  Trophy, RotateCcw, Volume2, VolumeX, HelpCircle,
  Heart, Sparkles, Wand2, Flame, Award, Zap, CheckCircle2
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
      {/* Top HUD Bar */}
      <header className="magic-hud-bar">
        {/* Left: Stage info & HP */}
        <div className="flex items-center gap-3">
          <div className="magic-stat-badge text-purple-300">
            <Wand2 className="w-4 h-4 text-amber-300" />
            <span>{stageIndex + 1}단계: {logicRef.current?.currentStage?.title?.split(':')[1] || '도서관'}</span>
          </div>

          {/* Player HP Hearts */}
          <div className="flex items-center gap-1 bg-slate-900/60 px-2.5 py-1 rounded-xl border border-rose-500/30">
            {Array.from({ length: PLAYER_MAX_HP }).map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 transition-all ${
                  i < playerHp
                    ? 'text-rose-500 fill-rose-500 scale-100'
                    : 'text-slate-600 fill-slate-700/50 scale-90'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Center: Combo Pill (if active) */}
        {combo > 1 && (
          <div className="magic-combo-pill flex items-center gap-1">
            <Flame className="w-4 h-4 animate-bounce text-amber-200" />
            <span>{combo} COMBO! (+{combo * 25})</span>
          </div>
        )}

        {/* Right: Score & Utility Buttons */}
        <div className="flex items-center gap-2.5">
          <div className="magic-stat-badge text-amber-300 font-mono text-sm tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{score.toLocaleString()}점</span>
          </div>

          <button
            onClick={() => setShowHowToPlay(true)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title="게임 방법"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={toggleMute}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Main Drawing Canvas Container */}
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

        {/* Stage Announcement Banner */}
        {stageAnnouncement && (
          <div className="magic-stage-banner">
            <h3 className="text-sm font-black text-amber-300 tracking-wide uppercase flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {stageAnnouncement}
            </h3>
            <p className="text-[11px] text-purple-200 mt-0.5">
              {logicRef.current?.currentStage?.subtitle}
            </p>
          </div>
        )}

        {/* Game Result Overlays (Game Over / Victory) */}
        {(gameState === 'GAME_OVER' || gameState === 'VICTORY') && (
          <div className="magic-result-overlay">
            <div className="magic-result-card">
              {gameState === 'VICTORY' ? (
                <>
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400">
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
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-rose-500/20 border border-rose-400/50 flex items-center justify-center text-rose-400">
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
                <div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase">최종 획득 점수</div>
                  <div className="text-xl font-black text-amber-300 font-mono mt-0.5">
                    {score.toLocaleString()}점
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase">최대 콤보</div>
                  <div className="text-xl font-black text-purple-300 font-mono mt-0.5">
                    {maxCombo}x
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase">도달 스테이지</div>
                  <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                    {stageIndex + 1}단계
                  </div>
                </div>
              </div>

              {/* Leaderboard Submission (Only if score > 100) */}
              {score > 100 && (
                <div className="mb-4 p-3.5 rounded-xl bg-purple-950/70 border border-purple-500/40 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>도촌초등학교 명예의 전당 점수 등록</span>
                  </div>

                  {!isSubmitted ? (
                    <form onSubmit={handleSubmitScore} className="flex gap-2">
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="예: 홍길동"
                        maxLength={10}
                        required
                        className="flex-1 bg-slate-900/90 border border-purple-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting || !playerName.trim()}
                        className="magic-btn-primary !py-2 !px-3 text-xs whitespace-nowrap"
                      >
                        {isSubmitting ? '등록 중...' : '랭킹 등록'}
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/50 p-2 rounded-lg border border-emerald-500/30">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>명예의 전당 등록이 완료되었습니다!</span>
                    </div>
                  )}
                </div>
              )}

              {/* Restart Button */}
              <button onClick={handleRestart} className="magic-btn-primary w-full">
                <RotateCcw className="w-4 h-4" />
                <span>마법학교 다시 시작하기</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* How to Play Modal */}
      <MagicCatHowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />
    </div>
  );
}
