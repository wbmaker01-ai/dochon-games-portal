// ========================================================
// 🍩 도넛 틱택토 (Donut Tic-Tac-Toe) 메인 게임 컴포넌트
// ========================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  PLAYERS,
  GAME_MODES,
  OPPONENT_TYPES,
  AI_DIFFICULTIES,
  ASSETS
} from './donutTicTacToeConstants';
import {
  checkGameStatus,
  calculateAIMove,
  calculateRoundScore
} from './donutTicTacToeLogic';
import DonutTicTacToeHowToPlayModal from './DonutTicTacToeHowToPlayModal';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import {
  RotateCcw,
  HelpCircle,
  Trophy,
  Flame,
  User,
  Bot,
  Users,
  Sparkles,
  Award,
  Zap,
  Star
} from 'lucide-react';
import './donutTicTacToe.css';

export default function DonutTicTacToeGame({ onScoreSubmitted }) {
  // --- 게임 설정 상태 ---
  const [gameMode, setGameMode] = useState(GAME_MODES.DONUT_TORUS); // 기본값: 도넛 토러스 모드
  const [opponentType, setOpponentType] = useState(OPPONENT_TYPES.AI);
  const [aiDifficulty, setAiDifficulty] = useState('NORMAL');
  const [isHowToOpen, setIsHowToOpen] = useState(false);

  // --- 보드 및 플레이 상태 ---
  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState(PLAYERS.P1);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // --- 결과 및 점수 상태 ---
  const [gameResult, setGameResult] = useState(null); // { winner, winningLine, isDraw }
  const [roundScore, setRoundScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [winStreak, setWinStreak] = useState(0);
  const [stats, setStats] = useState({ wins: 0, losses: 0, draws: 0 });

  // --- 명예의 전당 점수 등록 상태 ---
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // 새 라운드 시작 (보드 초기화)
  const startNewRound = useCallback((resetStats = false) => {
    setBoard(Array(9).fill(null));
    setTurn(PLAYERS.P1);
    setIsAiThinking(false);
    setGameResult(null);
    setRoundScore(0);
    setHasSubmitted(false);

    if (resetStats) {
      setTotalScore(0);
      setWinStreak(0);
      setStats({ wins: 0, losses: 0, draws: 0 });
    }
  }, []);

  // 모드 또는 상대 변경 시 새 라운드
  const handleModeChange = (mode) => {
    setGameMode(mode);
    startNewRound(false);
  };

  const handleOpponentChange = (type) => {
    setOpponentType(type);
    startNewRound(true);
  };

  const handleDifficultyChange = (diffKey) => {
    setAiDifficulty(diffKey);
    startNewRound(false);
  };

  // 플레이어 착수 처리
  const makeMove = (index) => {
    if (board[index] !== null || gameResult !== null || isAiThinking) {
      return;
    }

    const newBoard = [...board];
    newBoard[index] = turn;
    setBoard(newBoard);

    // 승패 검사
    const status = checkGameStatus(newBoard, gameMode);

    if (status.winner || status.isDraw) {
      handleGameOver(status, newBoard);
    } else {
      // 턴 넘기기
      setTurn(prev => (prev === PLAYERS.P1 ? PLAYERS.P2 : PLAYERS.P1));
    }
  };

  // 게임 종료 처리
  const handleGameOver = (status, finalBoard) => {
    setGameResult(status);

    const isP1Win = status.winner === PLAYERS.P1;
    const isP2Win = status.winner === PLAYERS.P2;
    const isDraw = status.isDraw;

    if (opponentType === OPPONENT_TYPES.AI) {
      const remainingEmpty = finalBoard.filter(c => c === null).length;
      const currentStreak = isP1Win ? winStreak + 1 : (isDraw ? winStreak : 0);
      
      const earned = calculateRoundScore({
        isWin: isP1Win,
        isDraw,
        difficultyKey: aiDifficulty,
        mode: gameMode,
        winStreak: currentStreak,
        remainingEmptyCells: remainingEmpty
      });

      setRoundScore(earned);

      if (isP1Win) {
        setWinStreak(prev => prev + 1);
        setTotalScore(prev => prev + earned);
        setStats(prev => ({ ...prev, wins: prev.wins + 1 }));
      } else if (isDraw) {
        setTotalScore(prev => prev + earned);
        setStats(prev => ({ ...prev, draws: prev.draws + 1 }));
      } else {
        setWinStreak(0);
        setStats(prev => ({ ...prev, losses: prev.losses + 1 }));
      }
    } else {
      // 2인 로컬 대전
      if (isP1Win) setStats(prev => ({ ...prev, wins: prev.wins + 1 }));
      else if (isP2Win) setStats(prev => ({ ...prev, losses: prev.losses + 1 }));
      else setStats(prev => ({ ...prev, draws: prev.draws + 1 }));
    }
  };

  // AI 자동 착수 훅
  useEffect(() => {
    if (
      opponentType === OPPONENT_TYPES.AI &&
      turn === PLAYERS.P2 &&
      gameResult === null
    ) {
      setIsAiThinking(true);
      const thinkTime = 400 + Math.random() * 350; // 자연스러운 생각 시간

      const timer = setTimeout(() => {
        const aiMoveIndex = calculateAIMove(
          board,
          gameMode,
          aiDifficulty,
          PLAYERS.P2,
          PLAYERS.P1
        );

        if (aiMoveIndex !== -1) {
          const newBoard = [...board];
          newBoard[aiMoveIndex] = PLAYERS.P2;
          setBoard(newBoard);

          const status = checkGameStatus(newBoard, gameMode);
          if (status.winner || status.isDraw) {
            handleGameOver(status, newBoard);
          } else {
            setTurn(PLAYERS.P1);
          }
        }
        setIsAiThinking(false);
      }, thinkTime);

      return () => clearTimeout(timer);
    }
  }, [turn, opponentType, board, gameMode, aiDifficulty, gameResult]);

  // 명예의 전당 점수 제출 핸들러 (100점 초과 시)
  const handleSubmitScore = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting || totalScore <= 100) return;

    setIsSubmitting(true);
    try {
      await submitScoreToDB('tictactoe', playerName.trim(), totalScore);
      setHasSubmitted(true);
      if (onScoreSubmitted) {
        onScoreSubmitted();
      }
    } catch (err) {
      console.error('점수 등록 오류:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="donut-game-container"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(30, 21, 40, 0.82) 0%, rgba(18, 12, 24, 0.95) 100%), url(${ASSETS.BAKERY_BG})`
      }}
    >
      {/* 1. 상단 컨트롤 바 */}
      <div className="donut-top-bar">
        <div className="donut-title-pill">
          <span className="text-xl">🍩</span>
          <h2>도촌 도넛 틱택토</h2>
        </div>

        <div className="donut-top-actions">
          <button
            className="donut-icon-btn"
            onClick={() => setIsHowToOpen(true)}
            title="게임 방법"
          >
            <HelpCircle className="w-4 h-4 text-amber-300" />
            <span>방법</span>
          </button>
          <button
            className="donut-icon-btn primary"
            onClick={() => startNewRound(false)}
            title="새 판 시작"
          >
            <RotateCcw className="w-4 h-4" />
            <span>재도전</span>
          </button>
        </div>
      </div>

      {/* 2. 모드 및 난이도 선택 칩 바 */}
      <div className="donut-mode-selector-row">
        {/* 모드 선택 */}
        <div className="donut-chip-group">
          <button
            className={`donut-chip-btn ${gameMode === GAME_MODES.DONUT_TORUS ? 'active' : ''}`}
            onClick={() => handleModeChange(GAME_MODES.DONUT_TORUS)}
          >
            🍩 도넛 토러스
          </button>
          <button
            className={`donut-chip-btn ${gameMode === GAME_MODES.CLASSIC ? 'active' : ''}`}
            onClick={() => handleModeChange(GAME_MODES.CLASSIC)}
          >
            👾 클래식
          </button>
        </div>

        {/* 상대 선택 */}
        <div className="donut-chip-group">
          <button
            className={`donut-chip-btn ${opponentType === OPPONENT_TYPES.AI ? 'active' : ''}`}
            onClick={() => handleOpponentChange(OPPONENT_TYPES.AI)}
          >
            <Bot className="w-3.5 h-3.5" /> AI 대전
          </button>
          <button
            className={`donut-chip-btn ${opponentType === OPPONENT_TYPES.TWO_PLAYER ? 'active' : ''}`}
            onClick={() => handleOpponentChange(OPPONENT_TYPES.TWO_PLAYER)}
          >
            <Users className="w-3.5 h-3.5" /> 2인 대전
          </button>
        </div>

        {/* AI 난이도 (AI 모드일 때만 표시) */}
        {opponentType === OPPONENT_TYPES.AI && (
          <div className="donut-chip-group">
            {Object.keys(AI_DIFFICULTIES).map(diffKey => (
              <button
                key={diffKey}
                className={`donut-chip-btn ${aiDifficulty === diffKey ? 'active gold' : ''}`}
                onClick={() => handleDifficultyChange(diffKey)}
              >
                {diffKey === 'EASY' && '초보'}
                {diffKey === 'NORMAL' && '보통'}
                {diffKey === 'MASTER' && '👑 마스터'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. 플레이어 상태 및 턴 정보 */}
      <div className="donut-status-bar">
        {/* 1P 핑크 도넛 */}
        <div className={`donut-player-card ${turn === PLAYERS.P1 && !gameResult ? 'turn' : ''}`}>
          <img src={ASSETS.PINK_DONUT} alt="1P" className="donut-mini-avatar" />
          <div>
            <div className="donut-player-name text-pink-300">
              {opponentType === OPPONENT_TYPES.AI ? '나 (1P)' : '1P (선공)'}
            </div>
            <div className="donut-player-sub">딸기 스프링클</div>
          </div>
        </div>

        {/* 중앙 점수 / 연승 정보 */}
        {opponentType === OPPONENT_TYPES.AI ? (
          <div className="donut-score-badge">
            <div className="donut-score-num flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{totalScore}점</span>
            </div>
            {winStreak > 1 && (
              <div className="text-[10px] text-pink-400 font-bold flex items-center gap-0.5">
                <Flame className="w-3 h-3 text-pink-500 fill-pink-500 animate-pulse" />
                <span>{winStreak}연승 콤보!</span>
              </div>
            )}
          </div>
        ) : (
          <div className="donut-score-badge">
            <div className="text-xs font-black text-amber-400">
              {stats.wins} : {stats.losses}
            </div>
            <div className="donut-score-label">무승부: {stats.draws}</div>
          </div>
        )}

        {/* 2P / AI 초코 도넛 */}
        <div className={`donut-player-card choco ${turn === PLAYERS.P2 && !gameResult ? 'turn choco' : ''}`}>
          <img src={ASSETS.CHOCO_DONUT} alt="2P" className="donut-mini-avatar" />
          <div>
            <div className="donut-player-name text-amber-200">
              {opponentType === OPPONENT_TYPES.AI ? '도넛 봇 (AI)' : '2P (후공)'}
            </div>
            <div className="donut-player-sub">
              {opponentType === OPPONENT_TYPES.AI ? `${AI_DIFFICULTIES[aiDifficulty].label.split(' ')[0]}` : '초코 글레이즈'}
            </div>
          </div>
        </div>
      </div>

      {/* 4. 3x3 격자 게임 보드 */}
      <div className="donut-board-wrapper">
        <div className="donut-board">
          {board.map((cell, idx) => {
            const isWinningCell = gameResult?.winningLine?.includes(idx);
            return (
              <button
                key={idx}
                className={`donut-cell ${isWinningCell ? 'win-highlight' : ''}`}
                onClick={() => makeMove(idx)}
                disabled={cell !== null || gameResult !== null || isAiThinking}
                aria-label={`셀 ${idx + 1}`}
              >
                {cell === PLAYERS.P1 && (
                  <img
                    src={ASSETS.PINK_DONUT}
                    alt="핑크 도넛"
                    className="donut-piece-img"
                  />
                )}
                {cell === PLAYERS.P2 && (
                  <img
                    src={ASSETS.CHOCO_DONUT}
                    alt="초코 도넛"
                    className="donut-piece-img"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. 게임 결과 안내 및 점수 등록 바 */}
      {gameResult && (
        <div className="donut-result-banner">
          <div className="donut-result-text">
            {gameResult.winner === PLAYERS.P1 && (
              <span className="text-pink-400 flex items-center gap-1.5">
                🎉 {opponentType === OPPONENT_TYPES.AI ? '승리했습니다!' : '1P(핑크) 승리!'}
                {roundScore > 0 && <span className="text-amber-300">(+{roundScore}점)</span>}
              </span>
            )}
            {gameResult.winner === PLAYERS.P2 && (
              <span className="text-amber-300 flex items-center gap-1.5">
                {opponentType === OPPONENT_TYPES.AI ? '도넛 봇의 승리! 다음 판에 설욕해봐요.' : '2P(초코) 승리!'}
              </span>
            )}
            {gameResult.isDraw && (
              <span className="text-slate-300 flex items-center gap-1.5">
                🤝 팽팽한 무승부! ({roundScore > 0 ? `+${roundScore}점` : ''})
              </span>
            )}
          </div>

          {/* 🌟 100점 이하 점수 등록 차단 원칙 준수: totalScore > 100일 때만 등록 폼 노출 */}
          {opponentType === OPPONENT_TYPES.AI && totalScore > 100 && !hasSubmitted && (
            <div className="donut-score-submit-box">
              <p className="text-[11px] text-amber-300 text-center font-bold flex items-center justify-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>도촌초 명예의 전당 등록 가능! ({totalScore}점 달성)</span>
              </p>
              <form onSubmit={handleSubmitScore} className="donut-score-submit-form">
                <input
                  type="text"
                  placeholder="예: 홍길동"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={10}
                  className="donut-score-input"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !playerName.trim()}
                  className="donut-score-submit-btn"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? '등록 중...' : '랭킹 등록'}</span>
                </button>
              </form>
            </div>
          )}

          {hasSubmitted && (
            <p className="text-xs text-emerald-400 font-bold flex items-center gap-1 mt-1">
              ✨ 명예의 전당에 점수가 성공적으로 등록되었습니다!
            </p>
          )}

          <button
            onClick={() => startNewRound(false)}
            className="donut-icon-btn primary mt-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>다음 판 계속하기</span>
          </button>
        </div>
      )}

      {/* 6. 게임 방법 가이드 모달 */}
      <DonutTicTacToeHowToPlayModal
        isOpen={isHowToOpen}
        onClose={() => setIsHowToOpen(false)}
      />
    </div>
  );
}
