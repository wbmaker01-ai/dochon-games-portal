// Dochon Pétanque Master Main Game Component

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GAME_STATES,
  SHOT_TYPES,
  TEAMS,
  FIELD_CONFIG,
  MATCH_CONFIG,
  AI_DIFFICULTY
} from './petanqueConstants';
import { PetanqueEngine } from './PetanqueEngine';
import { petanqueAudio } from './petanqueAudio';
import PetanqueHowToPlayModal from './PetanqueHowToPlayModal';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import { haptics } from '../../../utils/haptics';
import {
  Trophy,
  Volume2,
  VolumeX,
  RotateCcw,
  Play,
  HelpCircle,
  Award,
  Sparkles,
  Send,
  Target,
  Zap,
  ChevronRight
} from 'lucide-react';
import './petanque.css';

export default function PetanqueGame({ onScoreSubmitted }) {
  // Game Flow States
  const [gameState, setGameState] = useState(GAME_STATES.INTRO);
  const [currentRound, setCurrentRound] = useState(1);
  const [difficulty, setDifficulty] = useState(AI_DIFFICULTY.NORMAL);
  const [isMuted, setIsMuted] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // Match Scores
  const [scores, setScores] = useState({
    player: 0,
    ai: 0,
    playerBonusScore: 0,
    totalFinalScore: 0
  });

  // Current Round Balls Left
  const [playerBallsLeft, setPlayerBallsLeft] = useState(MATCH_CONFIG.BALLS_PER_PLAYER);
  const [aiBallsLeft, setAiBallsLeft] = useState(MATCH_CONFIG.BALLS_PER_PLAYER);
  const [currentTurnTeam, setCurrentTurnTeam] = useState(TEAMS.PLAYER.id);

  // Throw Aiming Parameters
  const [aimAngle, setAimAngle] = useState(90); // 90 is straight forward
  const [aimPower, setAimPower] = useState(65);
  const [shotType, setShotType] = useState(SHOT_TYPES.POINTER);
  const [isChargingPower, setIsChargingPower] = useState(false);
  const [inGameMessage, setInGameMessage] = useState('');

  // Round Results Cache
  const [roundResultInfo, setRoundResultInfo] = useState(null);

  // Leaderboard Registration States
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Canvas & Engine References
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const animationFrameRef = useRef(null);
  const chargeIntervalRef = useRef(null);
  const chargeDirRef = useRef(1);

  // Initialize Canvas & Engine
  useEffect(() => {
    if (canvasRef.current) {
      engineRef.current = new PetanqueEngine(canvasRef.current);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (chargeIntervalRef.current) {
        clearInterval(chargeIntervalRef.current);
      }
    };
  }, []);

  // Main Render & Physics Loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (time) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      if (engineRef.current) {
        const isMoving = engineRef.current.updatePhysics(dt);

        // Transition from BALLS_MOVING to either next throw or MEASURING
        if (gameState === GAME_STATES.BALLS_MOVING && !isMoving) {
          handleBallsStopped();
        }

        // Render scene
        engineRef.current.render({
          isAiming: gameState === GAME_STATES.READY_THROW && currentTurnTeam === TEAMS.PLAYER.id,
          aimAngle,
          aimPower,
          shotType,
          currentTeam: currentTurnTeam,
          isMeasuring: gameState === GAME_STATES.MEASURING || gameState === GAME_STATES.END_ROUND
        });
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [gameState, aimAngle, aimPower, shotType, currentTurnTeam]);

  // Start Full Match
  const startMatch = (chosenDifficulty = difficulty) => {
    haptics.impact();
    petanqueAudio.playWhistle();
    setDifficulty(chosenDifficulty);
    setCurrentRound(1);
    setScores({
      player: 0,
      ai: 0,
      playerBonusScore: 0,
      totalFinalScore: 0
    });
    setPlayerName('');
    setIsSubmitted(false);
    setIsSubmitting(false);

    startRound(1);
  };

  // Start a specific End (Round)
  const startRound = (roundNum) => {
    setCurrentRound(roundNum);
    setPlayerBallsLeft(MATCH_CONFIG.BALLS_PER_PLAYER);
    setAiBallsLeft(MATCH_CONFIG.BALLS_PER_PLAYER);
    setCurrentTurnTeam(TEAMS.PLAYER.id);
    setInGameMessage(`제 ${roundNum}엔드 시작! 🔵 나의 첫 번째 투구 차례`);
    setRoundResultInfo(null);

    if (engineRef.current) {
      engineRef.current.initEndRound(roundNum);
    }
    setGameState(GAME_STATES.READY_THROW);
  };

  // Execute Player Throw
  const executePlayerThrow = useCallback(() => {
    if (gameState !== GAME_STATES.READY_THROW || currentTurnTeam !== TEAMS.PLAYER.id) return;
    if (playerBallsLeft <= 0) return;

    haptics.impact();
    setPlayerBallsLeft(prev => prev - 1);
    setGameState(GAME_STATES.BALLS_MOVING);
    setInGameMessage('🔵 공이 날아갑니다!');

    if (engineRef.current) {
      engineRef.current.launchBoule({
        team: TEAMS.PLAYER.id,
        shotType,
        angleDeg: aimAngle,
        powerPercent: aimPower
      });
    }
  }, [gameState, currentTurnTeam, playerBallsLeft, aimAngle, aimPower, shotType]);

  // Trigger AI Throw with smart heuristic strategy
  const executeAiThrow = useCallback((pLeft, aLeft) => {
    if (!engineRef.current) return;
    setInGameMessage('🔴 도촌 백팀 (AI)이 조준하고 있습니다...');
    setGameState(GAME_STATES.BALLS_MOVING);

    setTimeout(() => {
      if (!engineRef.current) return;

      const cochonnet = engineRef.current.cochonnet;
      const targetX = cochonnet ? cochonnet.x : 400;
      const targetY = cochonnet ? cochonnet.y : 250;

      // Calculate base angle to target Cochonnet
      const dx = targetX - FIELD_CONFIG.LAUNCH_X;
      const dy = targetY - FIELD_CONFIG.LAUNCH_Y;
      let baseAngle = (Math.atan2(dy, dx) * 180 / Math.PI) + 90;

      // AI shot type decision: If player is very close to Cochonnet, try Tirer to smash player's ball
      const distances = engineRef.current.calculateDistances();
      const closestBall = distances[0];
      const shouldTirer = closestBall &&
        closestBall.team === TEAMS.PLAYER.id &&
        closestBall.cmDist < 60 &&
        Math.random() < difficulty.tirerChance;

      const aiShotType = shouldTirer ? SHOT_TYPES.TIRER : SHOT_TYPES.POINTER;

      // Apply organic AI variance based on difficulty
      const variance = (Math.random() - 0.5) * difficulty.errorVariance * 35;
      const finalAngle = Math.max(65, Math.min(115, baseAngle + variance));

      // Calculate distance power ratio
      const distPx = Math.hypot(dx, dy);
      let basePower = ((distPx - 150) / 280) * 100;
      if (aiShotType === SHOT_TYPES.TIRER) {
        basePower += 10;
      }
      const powerVariance = (Math.random() - 0.5) * difficulty.errorVariance * 25;
      const finalPower = Math.max(30, Math.min(95, basePower + powerVariance));

      setAiBallsLeft(prev => prev - 1);
      engineRef.current.launchBoule({
        team: TEAMS.AI.id,
        shotType: aiShotType,
        angleDeg: finalAngle,
        powerPercent: finalPower
      });

      setInGameMessage('🔴 AI가 공을 투구했습니다!');
    }, 900);
  }, [difficulty]);

  // Handle when all balls stop rolling
  const handleBallsStopped = () => {
    if (!engineRef.current) return;

    // Check remaining balls
    const curPlayerLeft = playerBallsLeft;
    const curAiLeft = aiBallsLeft;

    if (curPlayerLeft === 0 && curAiLeft === 0) {
      // End of this round -> Start measuring
      triggerEndMeasuring();
    } else if (currentTurnTeam === TEAMS.PLAYER.id) {
      // Switch to AI if AI has balls, otherwise keep player
      if (curAiLeft > 0) {
        setCurrentTurnTeam(TEAMS.AI.id);
        executeAiThrow(curPlayerLeft, curAiLeft);
      } else {
        setCurrentTurnTeam(TEAMS.PLAYER.id);
        setGameState(GAME_STATES.READY_THROW);
        setInGameMessage('🔵 나의 연속 투구 차례입니다!');
      }
    } else {
      // Was AI's turn -> Switch to Player if Player has balls, otherwise AI continues
      if (curPlayerLeft > 0) {
        setCurrentTurnTeam(TEAMS.PLAYER.id);
        setGameState(GAME_STATES.READY_THROW);
        setInGameMessage('🔵 나의 투구 차례입니다!');
      } else if (curAiLeft > 0) {
        setCurrentTurnTeam(TEAMS.AI.id);
        executeAiThrow(curPlayerLeft, curAiLeft);
      }
    }
  };

  // Trigger End Round Measuring & Scoring
  const triggerEndMeasuring = () => {
    setGameState(GAME_STATES.MEASURING);
    setInGameMessage('📏 줄자 거리 측정 중...');
    petanqueAudio.playMeasureReveal();

    setTimeout(() => {
      if (!engineRef.current) return;
      const distances = engineRef.current.calculateDistances();

      if (distances.length === 0) return;

      const winningTeam = distances[0].team;
      const losingTeam = winningTeam === TEAMS.PLAYER.id ? TEAMS.AI.id : TEAMS.PLAYER.id;

      // Find shortest distance of the losing team
      const losingClosest = distances.find(d => d.team === losingTeam);
      const losingMinDist = losingClosest ? losingClosest.cmDist : Infinity;

      // Count winning balls closer than opponent's best ball
      let roundPoints = 0;
      distances.forEach(d => {
        if (d.team === winningTeam && d.cmDist < losingMinDist) {
          roundPoints++;
        }
      });

      // Bonus points calculation for leaderboard score
      let roundBonus = 0;
      if (winningTeam === TEAMS.PLAYER.id) {
        // Bullseye bonus: Closest ball within 25cm
        if (distances[0].cmDist <= 25) {
          roundBonus += MATCH_CONFIG.BULLSEYE_BONUS;
        }
        // Sweep bonus: All 3 balls closer
        if (roundPoints === 3) {
          roundBonus += MATCH_CONFIG.SWEEP_BONUS;
        }
      }

      setScores(prev => ({
        ...prev,
        player: winningTeam === TEAMS.PLAYER.id ? prev.player + roundPoints : prev.player,
        ai: winningTeam === TEAMS.AI.id ? prev.ai + roundPoints : prev.ai,
        playerBonusScore: prev.playerBonusScore + roundBonus
      }));

      setRoundResultInfo({
        winningTeam,
        roundPoints,
        distances,
        roundBonus
      });

      petanqueAudio.playScorePoint();
      setGameState(GAME_STATES.END_ROUND);
    }, 1800);
  };

  // Next Round or Match Over Transition
  const handleNextRoundOrFinish = () => {
    if (currentRound < MATCH_CONFIG.TOTAL_ROUNDS) {
      startRound(currentRound + 1);
    } else {
      // Match Complete -> Calculate Final Score
      const isPlayerWinner = scores.player > scores.ai;
      const winBonus = isPlayerWinner ? MATCH_CONFIG.WIN_BONUS : 0;
      const finalScore = MATCH_CONFIG.BASE_SCORE +
        (scores.player * MATCH_CONFIG.ROUND_POINT_SCORE) +
        scores.playerBonusScore +
        winBonus;

      setScores(prev => ({
        ...prev,
        totalFinalScore: finalScore
      }));

      petanqueAudio.playMatchVictory();
      setGameState(GAME_STATES.GAME_OVER);
    }
  };

  // Power Charge Press Handlers (Spacebar or Button Hold)
  const startCharging = () => {
    if (gameState !== GAME_STATES.READY_THROW || currentTurnTeam !== TEAMS.PLAYER.id) return;
    setIsChargingPower(true);
    chargeIntervalRef.current = setInterval(() => {
      setAimPower(prev => {
        let next = prev + chargeDirRef.current * 3;
        if (next >= 98) {
          next = 98;
          chargeDirRef.current = -1;
        } else if (next <= 25) {
          next = 25;
          chargeDirRef.current = 1;
        }
        return next;
      });
    }, 30);
  };

  const stopChargingAndThrow = () => {
    if (!isChargingPower) return;
    setIsChargingPower(false);
    if (chargeIntervalRef.current) {
      clearInterval(chargeIntervalRef.current);
    }
    executePlayerThrow();
  };

  // Keyboard Shortcuts (Arrow keys to aim, Space to charge/throw)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== GAME_STATES.READY_THROW || currentTurnTeam !== TEAMS.PLAYER.id) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setAimAngle(prev => Math.max(65, prev - 2));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setAimAngle(prev => Math.min(115, prev + 2));
      } else if (e.key === ' ' && !e.repeat && !isChargingPower) {
        e.preventDefault();
        startCharging();
      } else if (e.key === '1') {
        setShotType(SHOT_TYPES.POINTER);
      } else if (e.key === '2') {
        setShotType(SHOT_TYPES.TIRER);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === ' ' && isChargingPower) {
        e.preventDefault();
        stopChargingAndThrow();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, currentTurnTeam, isChargingPower]);

  // Handle Leaderboard Score Submission
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting || isSubmitted) return;

    setIsSubmitting(true);
    haptics.impact();

    const cleanName = playerName.trim();
    const finalScore = scores.totalFinalScore;

    try {
      await submitScoreToDB('petanque', cleanName, finalScore);
      setIsSubmitted(true);
      if (onScoreSubmitted) {
        onScoreSubmitted();
      }
    } catch (err) {
      console.error('Score submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sound Toggle
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    petanqueAudio.setMuted(nextMuted);
  };

  return (
    <div className="petanque-game-container">
      
      {/* 1. Header Toolbar */}
      <div className="petanque-header-toolbar">
        <div className="petanque-title-row">
          <div className="petanque-icon-badge">🎯</div>
          <div>
            <div className="petanque-title-main">도촌 페탕크 마스터</div>
            <div className="petanque-title-sub">프랑스 전통 구기 스포츠 · 2.5D 물리 챌린지</div>
          </div>
        </div>

        <div className="petanque-header-actions">
          <button
            onClick={() => setIsHowToPlayOpen(true)}
            className="petanque-btn-icon"
            title="게임 방법 보기"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={toggleMute}
            className="petanque-btn-icon"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* 2. Match Scoreboard Banner */}
      <div className="petanque-scoreboard-banner">
        {/* Player Team */}
        <div className="petanque-team-card">
          <div className="text-right">
            <div className="text-xs font-bold text-blue-400">🔵 도촌 청팀 (나)</div>
            <div className="text-lg font-black text-blue-200">{scores.player}점</div>
          </div>
          <div className="petanque-team-balls">
            {Array.from({ length: MATCH_CONFIG.BALLS_PER_PLAYER }).map((_, idx) => (
              <div
                key={`p_${idx}`}
                className={`petanque-ball-dot ${idx < playerBallsLeft ? 'ready-blue' : 'used'}`}
                title={`청팀 쇠구슬 ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Center Round Badge */}
        <div className="petanque-center-round-badge">
          <div className="petanque-round-pill">
            {gameState === GAME_STATES.INTRO ? '대기 중' : `${currentRound} / ${MATCH_CONFIG.TOTAL_ROUNDS} 엔드`}
          </div>
          <div className="petanque-score-text">
            {scores.player} : {scores.ai}
          </div>
        </div>

        {/* AI Team */}
        <div className="petanque-team-card flex-row-reverse">
          <div className="text-left">
            <div className="text-xs font-bold text-rose-400">🔴 도촌 백팀 (AI)</div>
            <div className="text-lg font-black text-rose-200">{scores.ai}점</div>
          </div>
          <div className="petanque-team-balls">
            {Array.from({ length: MATCH_CONFIG.BALLS_PER_PLAYER }).map((_, idx) => (
              <div
                key={`ai_${idx}`}
                className={`petanque-ball-dot ${idx < aiBallsLeft ? 'ready-red' : 'used'}`}
                title={`백팀 쇠구슬 ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 3. Canvas Viewport Area */}
      <div className="petanque-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={FIELD_CONFIG.WIDTH}
          height={FIELD_CONFIG.HEIGHT}
          className="petanque-canvas"
        />

        {/* Live Notification Message Ribbon */}
        {gameState !== GAME_STATES.INTRO && gameState !== GAME_STATES.GAME_OVER && (
          <div className="petanque-in-game-banner">
            {inGameMessage}
          </div>
        )}

        {/* 3-A. Intro Screen Overlay */}
        {gameState === GAME_STATES.INTRO && (
          <div className="petanque-overlay-modal">
            <div className="petanque-intro-card">
              <div className="text-4xl mb-2">🎯 🇫🇷 ⚪</div>
              <h2 className="text-xl font-black text-amber-300 mb-1">
                도촌 페탕크 마스터
              </h2>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                노란 표적구(뷔슈)에 쇠구슬을 가장 가깝게 붙이거나,<br />
                상대방 공을 쳐내어 승리하세요!
              </p>

              {/* Difficulty Selection */}
              <div className="mb-4">
                <div className="text-[11px] font-bold text-slate-400 mb-1.5">AI 상대 난이도 선택</div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(AI_DIFFICULTY).map((diff) => (
                    <button
                      key={diff.name}
                      onClick={() => setDifficulty(diff)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        difficulty.name === diff.name
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {diff.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => startMatch(difficulty)}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black rounded-xl shadow-lg hover:from-amber-400 hover:to-amber-300 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>경기 시작하기</span>
                </button>
                <button
                  onClick={() => setIsHowToPlayOpen(true)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 text-xs flex items-center justify-center gap-1.5"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>게임 방법 & 규칙 보기</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3-B. End of Round Score Popup Overlay */}
        {gameState === GAME_STATES.END_ROUND && roundResultInfo && (
          <div className="petanque-overlay-modal">
            <div className="petanque-result-card animate-fade-in">
              <div className="text-3xl mb-1">
                {roundResultInfo.winningTeam === TEAMS.PLAYER.id ? '🎉 🔵' : '😢 🔴'}
              </div>
              <h3 className="text-lg font-black text-amber-300 mb-1">
                {currentRound}엔드 종료!
              </h3>
              <p className="text-sm font-bold text-white mb-3">
                {roundResultInfo.winningTeam === TEAMS.PLAYER.id
                  ? `도촌 청팀 (나) 승리! (+${roundResultInfo.roundPoints}점)`
                  : `도촌 백팀 (AI) 승리! (+${roundResultInfo.roundPoints}점)`}
              </p>

              {/* Bonus Information */}
              {roundResultInfo.roundBonus > 0 && (
                <div className="p-2 mb-3 bg-amber-950/40 border border-amber-500/40 rounded-lg text-xs text-amber-300 font-bold flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>정밀 투구 보너스 +{roundResultInfo.roundBonus}점 획득!</span>
                </div>
              )}

              {/* Distances List */}
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 mb-4 text-xs space-y-1 max-h-28 overflow-y-auto">
                <div className="text-[11px] text-slate-400 font-bold mb-1">뷔슈(목표구)와의 최종 거리</div>
                {roundResultInfo.distances.map((d, i) => (
                  <div key={i} className="flex justify-between items-center text-slate-200">
                    <span className={d.team === TEAMS.PLAYER.id ? 'text-blue-400 font-bold' : 'text-rose-400 font-bold'}>
                      {i + 1}위: {d.team === TEAMS.PLAYER.id ? '🔵 나' : '🔴 AI'}
                    </span>
                    <span className="font-mono text-amber-200">{d.cmDist} cm</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleNextRoundOrFinish}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-sm"
              >
                <span>{currentRound < MATCH_CONFIG.TOTAL_ROUNDS ? '다음 엔드 진행하기' : '최종 경기 결과 보기'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 3-C. Match Over & Hall of Fame Screen */}
        {gameState === GAME_STATES.GAME_OVER && (
          <div className="petanque-overlay-modal">
            <div className="petanque-result-card animate-fade-in">
              <div className="text-4xl mb-1">
                {scores.player > scores.ai ? '🏆 🥇' : '🥈 👏'}
              </div>
              <h2 className="text-xl font-black text-amber-300 mb-1">
                {scores.player > scores.ai ? '도촌 페탕크 챔피언 등극!' : '경기 종료! 아쉬운 준우승'}
              </h2>
              <p className="text-xs text-slate-300 mb-3">
                최종 스코어 {scores.player} : {scores.ai} (도촌 청팀 vs 백팀)
              </p>

              {/* Total Score Display */}
              <div className="p-3 bg-amber-950/40 border border-amber-500/50 rounded-xl mb-4 text-center">
                <div className="text-xs text-amber-400 font-bold">최종 획득 점수</div>
                <div className="text-3xl font-black text-amber-300 font-mono tracking-tight mt-0.5">
                  {scores.totalFinalScore} <span className="text-sm font-bold text-amber-400">점</span>
                </div>
              </div>

              {/* Hall of Fame Submission Form (Strict rule: Only when score > 100) */}
              {scores.totalFinalScore > 100 ? (
                <div className="mb-4 bg-slate-900/80 p-3.5 rounded-xl border border-slate-700">
                  <div className="text-xs font-bold text-amber-300 mb-2 flex items-center justify-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>명예의 전당 랭킹 등록</span>
                  </div>

                  {isSubmitted ? (
                    <div className="p-2 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>성공적으로 랭킹에 등록되었습니다!</span>
                    </div>
                  ) : (
                    <form onSubmit={handleScoreSubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="예: 홍길동"
                        maxLength={10}
                        required
                        disabled={isSubmitting}
                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-xs focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting || !playerName.trim()}
                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSubmitting ? '등록 중...' : '등록'}</span>
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-medium mb-3">
                  100점 초과 달성 시 명예의 전당 랭킹에 기록할 수 있습니다.
                </p>
              )}

              {/* Retry Button */}
              <button
                onClick={() => startMatch(difficulty)}
                className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl border border-slate-600 transition-all flex items-center justify-center gap-2 text-xs"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>새 경기 다시하기</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Controls Gamepad Panel */}
      {gameState === GAME_STATES.READY_THROW && currentTurnTeam === TEAMS.PLAYER.id && (
        <div className="petanque-controls-panel">
          <div className="petanque-controls-row">
            {/* Shot Type Switcher */}
            <div className="petanque-shot-selector">
              <button
                onClick={() => setShotType(SHOT_TYPES.POINTER)}
                className={`petanque-shot-btn ${shotType === SHOT_TYPES.POINTER ? 'active-pointer' : ''}`}
              >
                🎯 포앵테 (정밀 롤링)
              </button>
              <button
                onClick={() => setShotType(SHOT_TYPES.TIRER)}
                className={`petanque-shot-btn ${shotType === SHOT_TYPES.TIRER ? 'active-tirer' : ''}`}
              >
                💥 티레 (타격 샷)
              </button>
            </div>

            {/* Angle Slider */}
            <div className="petanque-slider-group">
              <span className="petanque-slider-label">각도: {aimAngle}°</span>
              <input
                type="range"
                min="65"
                max="115"
                value={aimAngle}
                onChange={(e) => setAimAngle(Number(e.target.value))}
                className="petanque-slider-range"
              />
            </div>

            {/* Power Slider */}
            <div className="petanque-slider-group">
              <span className="petanque-slider-label">파워: {Math.round(aimPower)}%</span>
              <input
                type="range"
                min="25"
                max="98"
                value={aimPower}
                onChange={(e) => setAimPower(Number(e.target.value))}
                className="petanque-slider-range"
              />
            </div>
          </div>

          {/* Launch Action Button with Hold-to-Charge Support */}
          <button
            onPointerDown={startCharging}
            onPointerUp={stopChargingAndThrow}
            onPointerLeave={stopChargingAndThrow}
            className="petanque-btn-launch"
          >
            <Target className="w-5 h-5" />
            <span>
              {isChargingPower ? '🔥 게이지 충전 중! (손을 떼면 발사)' : '🚀 쇠구슬 투구 (스페이스바 / 터치 홀드)'}
            </span>
          </button>
        </div>
      )}

      {/* How to Play Modal */}
      <PetanqueHowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

    </div>
  );
}
