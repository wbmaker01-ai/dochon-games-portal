import React, { useRef, useState, useEffect, useCallback } from 'react';
import { GhoulDuelLogic } from './ghoulDuelLogic';
import { ghoulAudio } from './ghoulDuelAudio';
import { CANVAS_WIDTH, CANVAS_HEIGHT, DIFFICULTY_PRESETS } from './ghoulDuelConstants';
import GhoulDuelHowToPlayModal from './GhoulDuelHowToPlayModal';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import { haptics } from '../../../utils/haptics';
import {
  Trophy, RotateCcw, Volume2, VolumeX, HelpCircle,
  Sparkles, Flame, Zap, Award, CheckCircle2, User, Send, Play
} from 'lucide-react';
import './ghoulduel.css';

export default function GhoulDuelGame({ onScoreSubmitted }) {
  const canvasRef = useRef(null);
  const logicRef = useRef(null);
  const reqAnimRef = useRef(null);
  const lastTimeRef = useRef(0);

  const [gameState, setGameState] = useState('START'); // 'START' | 'PLAYING' | 'GAME_OVER'
  const [difficulty, setDifficulty] = useState('normal');
  const [teamScores, setTeamScores] = useState({ green: 0, purple: 0 });
  const [matchTime, setMatchTime] = useState(90);
  const [playerTail, setPlayerTail] = useState(0);
  const [playerDeposited, setPlayerDeposited] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Final Match Result State
  const [gameResult, setGameResult] = useState(null);

  // Leaderboard Form State
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Touch Virtual Joystick State
  const joystickRef = useRef(null);
  const [isDraggingJoystick, setIsDraggingJoystick] = useState(false);
  const [thumbPos, setThumbPos] = useState({ x: 0, y: 0 });

  // Handle Game Over from Logic Engine
  const handleGameOver = useCallback((stats) => {
    setGameResult(stats);
    setGameState('GAME_OVER');
    setPlayerName('');
    setIsSubmitted(false);
    setIsSubmitting(false);
    haptics.success();
  }, []);

  // Initialize and Start Game
  const startGame = useCallback((selectedDiff = difficulty) => {
    ghoulAudio.init();
    const logic = new GhoulDuelLogic({
      difficulty: selectedDiff,
      onGameOver: handleGameOver,
      onStateChange: (state) => {
        setTeamScores({ ...state.teamScores });
        setMatchTime(state.matchTime);
        setPlayerTail(state.playerTail);
        setPlayerDeposited(state.playerDeposited);
      }
    });

    logicRef.current = logic;
    setGameState('PLAYING');
    setGameResult(null);
    lastTimeRef.current = performance.now();
  }, [difficulty, handleGameOver]);

  // Main Render Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const loop = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = Math.min(0.1, (timestamp - lastTimeRef.current) / 1000);
      lastTimeRef.current = timestamp;

      if (logicRef.current && gameState === 'PLAYING') {
        logicRef.current.update(deltaTime);
        logicRef.current.render(ctx);
      }

      reqAnimRef.current = requestAnimationFrame(loop);
    };

    reqAnimRef.current = requestAnimationFrame(loop);

    return () => {
      if (reqAnimRef.current) {
        cancelAnimationFrame(reqAnimRef.current);
      }
    };
  }, [gameState]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      if (logicRef.current) {
        logicRef.current.handleKeyDown(e.code);
      }
    };

    const handleKeyUp = (e) => {
      if (logicRef.current) {
        logicRef.current.handleKeyUp(e.code);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Sound Toggle
  const handleToggleMute = () => {
    const nextMute = ghoulAudio.toggleMute();
    setIsMuted(nextMute);
  };

  // Virtual Joystick Handlers
  const handleJoystickPointerDown = (e) => {
    setIsDraggingJoystick(true);
    updateJoystickPos(e);
  };

  const handleJoystickPointerMove = (e) => {
    if (!isDraggingJoystick) return;
    updateJoystickPos(e);
  };

  const handleJoystickPointerUp = () => {
    setIsDraggingJoystick(false);
    setThumbPos({ x: 0, y: 0 });
    if (logicRef.current) {
      logicRef.current.setJoystick({ x: 0, y: 0 });
    }
  };

  const updateJoystickPos = (e) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxRadius = rect.width / 2 - 10;

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const tx = Math.cos(angle) * clampedDist;
    const ty = Math.sin(angle) * clampedDist;

    setThumbPos({ x: tx, y: ty });

    if (logicRef.current) {
      const normX = (tx / maxRadius) * 1.5;
      const normY = (ty / maxRadius) * 1.5;
      logicRef.current.setJoystick({ x: normX, y: normY });
    }
  };

  // Leaderboard Score Submit Handler
  const handleSubmitScore = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting || isSubmitted) return;

    const finalPlayerScore = gameResult ? gameResult.playerScore : playerDeposited;
    if (finalPlayerScore <= 100) return; // Strict Rule: <= 100 points block

    setIsSubmitting(true);
    try {
      await submitScoreToDB('ghoulduel', playerName.trim(), finalPlayerScore);
      setIsSubmitted(true);
      haptics.success();

      // Open Leaderboard Modal and switch to ghoulduel tab
      if (onScoreSubmitted) {
        setTimeout(() => {
          onScoreSubmitted();
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to submit ghoulduel score:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate Tug-of-war Percentage
  const totalScore = teamScores.green + teamScores.purple;
  const greenPct = totalScore === 0 ? 50 : Math.max(5, Math.min(95, (teamScores.green / totalScore) * 100));

  return (
    <div className="ghoulduel-container">
      {/* 1. Top Header & Match Dashboard */}
      <div className="ghoulduel-header">
        <div className="ghoulduel-top-bar">
          <div className="ghoulduel-title-group">
            <span className="text-2xl">👻</span>
            <h2>도촌 영혼 대결</h2>
            <span className="ghoulduel-badge">4 vs 4 배틀</span>
          </div>

          <div className="ghoulduel-controls">
            <button
              className="ghoulduel-btn-icon"
              onClick={() => setShowHowToPlay(true)}
              title="게임 방법"
              aria-label="게임 방법"
            >
              <HelpCircle size={18} />
            </button>
            <button
              className="ghoulduel-btn-icon"
              onClick={handleToggleMute}
              title={isMuted ? '소리 켜기' : '음소거'}
              aria-label="소리 설정"
            >
              {isMuted ? <VolumeX size={18} className="text-rose-400" /> : <Volume2 size={18} className="text-emerald-400" />}
            </button>
            {gameState === 'PLAYING' && (
              <button
                className="ghoulduel-btn-icon"
                onClick={() => startGame(difficulty)}
                title="다시 시작"
                aria-label="다시 시작"
              >
                <RotateCcw size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Live Score Tug-of-War Bar */}
        <div className="ghoulduel-score-board">
          <div className="team-score-card green">
            <span className="team-avatar">👑</span>
            <div className="team-info">
              <span className="team-name">초록 영혼팀 (나)</span>
              <span className="team-pts">{teamScores.green}</span>
            </div>
          </div>

          <div className="match-timer-box">
            <span className="timer-label">경기 시간</span>
            <span className={`timer-value ${matchTime <= 10 ? 'urgent' : ''}`}>
              {Math.floor(matchTime / 60)}:{String(matchTime % 60).padStart(2, '0')}
            </span>
          </div>

          <div className="team-score-card purple">
            <div className="team-info" style={{ textAlign: 'right' }}>
              <span className="team-name">보라 유령팀</span>
              <span className="team-pts">{teamScores.purple}</span>
            </div>
            <span className="team-avatar">😈</span>
          </div>
        </div>

        {/* Gauge Bar */}
        <div className="team-gauge-bar">
          <div className="team-gauge-fill" style={{ width: `${greenPct}%` }} />
        </div>
      </div>

      {/* 2. Main 2D Canvas Area */}
      <div className="ghoulduel-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="ghoulduel-canvas"
        />

        {/* In-Game Live HUD Badges */}
        {gameState === 'PLAYING' && (
          <div className="ghoulduel-hud-overlay">
            <div className="hud-pill tail-count">
              <Flame size={15} />
              <span>내 꼬리 영혼: {playerTail}개</span>
            </div>
            <div className="hud-pill player-score">
              <Sparkles size={15} />
              <span>내 납품 점수: {playerDeposited}점</span>
            </div>
          </div>
        )}

        {/* START SCREEN OVERLAY */}
        {gameState === 'START' && (
          <div className="ghoulduel-screen-overlay">
            <div className="ghoulduel-card-box">
              <div className="screen-ghost-hero">👻</div>
              <h1 className="screen-main-title">할로윈 영혼 대결</h1>
              <p className="screen-description">
                초록팀 vs 보라팀 4:4 실시간 팀 액션!<br />
                영혼 불꽃을 모아 기지로 가져오고, 상대 꼬리를 가로채세요!
              </p>

              {/* Difficulty Selection */}
              <div className="difficulty-selector">
                {Object.keys(DIFFICULTY_PRESETS).map((key) => (
                  <button
                    key={key}
                    className={`diff-btn ${difficulty === key ? 'active' : ''}`}
                    onClick={() => setDifficulty(key)}
                  >
                    {DIFFICULTY_PRESETS[key].name}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="screen-actions">
                <button className="btn-primary" onClick={() => startGame(difficulty)}>
                  <Play size={18} fill="currentColor" />
                  <span>대결 시작하기</span>
                </button>
                <button className="btn-secondary" onClick={() => setShowHowToPlay(true)}>
                  <HelpCircle size={18} />
                  <span>게임 방법</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GAME OVER RESULT OVERLAY */}
        {gameState === 'GAME_OVER' && gameResult && (
          <div className="ghoulduel-screen-overlay">
            <div className="ghoulduel-card-box">
              <div
                className={`gameover-result-badge ${
                  gameResult.isVictory ? 'victory' : 'defeat'
                }`}
              >
                {gameResult.isVictory ? '🎉 초록팀 대승리!' : '💥 보라팀 승리! (패배)'}
              </div>

              <div className="gameover-score-compare">
                <div className="compare-team green">
                  <span className="team-name">초록팀</span>
                  <span className="score-num">{gameResult.teamGreenScore}</span>
                </div>
                <div className="compare-vs">VS</div>
                <div className="compare-team purple">
                  <span className="team-name">보라팀</span>
                  <span className="score-num">{gameResult.teamPurpleScore}</span>
                </div>
              </div>

              {/* Player Personal Stats */}
              <div className="player-personal-stats">
                <div>
                  🏆 나의 영혼 납품 점수: <strong className="text-emerald-400">{gameResult.playerScore}점</strong>
                </div>
                <div>
                  ⚡ 꼬리 가로채기(스틸): <strong className="text-amber-400">{gameResult.playerStolen}회</strong>
                </div>
              </div>

              {/* LEADERBOARD SUBMISSION: ONLY IF SCORE > 100 (Project Memory Rule) */}
              {gameResult.playerScore > 100 && (
                <div className="leaderboard-submit-form">
                  <div className="form-label">
                    <Award size={16} className="text-amber-400" />
                    <span>도촌초등학교 명예의 전당 점수 등록</span>
                  </div>

                  {!isSubmitted ? (
                    <form onSubmit={handleSubmitScore} className="input-submit-row">
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="예: 홍길동"
                        maxLength={10}
                        required
                        className="name-input"
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting || !playerName.trim()}
                        className="btn-submit-score"
                      >
                        {isSubmitting ? '등록 중...' : '등록하기'}
                      </button>
                    </form>
                  ) : (
                    <div className="score-submitted-badge">
                      <CheckCircle2 size={16} className="inline mr-1" />
                      명예의 전당 등록이 완료되었습니다!
                    </div>
                  )}
                </div>
              )}

              {/* Restart Button */}
              <button className="btn-primary" onClick={() => startGame(difficulty)}>
                <RotateCcw size={18} />
                <span>한 판 더 대결하기</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Mobile / Touch Virtual Joystick */}
      <div className="virtual-joystick-container">
        <div
          ref={joystickRef}
          className="joystick-base"
          onPointerDown={handleJoystickPointerDown}
          onPointerMove={handleJoystickPointerMove}
          onPointerUp={handleJoystickPointerUp}
          onPointerCancel={handleJoystickPointerUp}
        >
          <div
            className="joystick-thumb"
            style={{
              transform: `translate(calc(-50% + ${thumbPos.x}px), calc(-50% + ${thumbPos.y}px))`
            }}
          />
        </div>
      </div>

      {/* 4. How To Play Modal */}
      <GhoulDuelHowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
        onStartGame={() => {
          if (gameState !== 'PLAYING') {
            startGame(difficulty);
          }
        }}
      />
    </div>
  );
}
