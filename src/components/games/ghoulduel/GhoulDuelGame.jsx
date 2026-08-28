import React, { useRef, useState, useEffect, useCallback } from 'react';
import { GhoulDuelLogic } from './ghoulDuelLogic';
import { ghoulAudio } from './ghoulDuelAudio';
import { ghoulNet, GhoulDuelNetworkManager } from './ghoulDuelNetwork';
import { CANVAS_WIDTH, CANVAS_HEIGHT, DIFFICULTY_PRESETS } from './ghoulDuelConstants';
import GhoulDuelHowToPlayModal from './GhoulDuelHowToPlayModal';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import { haptics } from '../../../utils/haptics';
import {
  Trophy, RotateCcw, Volume2, VolumeX, HelpCircle,
  Sparkles, Flame, Zap, Award, CheckCircle2, User, Send, Play,
  Users, Globe, Copy, Check, LogOut, Dices, Shield, ArrowRightLeft
} from 'lucide-react';
import './ghoulduel.css';

export default function GhoulDuelGame({ onScoreSubmitted }) {
  const canvasRef = useRef(null);
  const logicRef = useRef(null);
  const reqAnimRef = useRef(null);
  const lastTimeRef = useRef(0);

  // Top Game State
  const [gameState, setGameState] = useState('START'); // 'START' | 'LOBBY' | 'PLAYING' | 'GAME_OVER'
  const [playMode, setPlayMode] = useState('SINGLE');  // 'SINGLE' | 'P2P'
  const [difficulty, setDifficulty] = useState('normal');
  const [teamScores, setTeamScores] = useState({ green: 0, purple: 0 });
  const [matchTime, setMatchTime] = useState(90);
  const [playerTail, setPlayerTail] = useState(0);
  const [playerDeposited, setPlayerDeposited] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // P2P State
  const [p2pCode, setP2pCode] = useState(() => GhoulDuelNetworkManager.generateRandomCode());
  const [p2pName, setP2pName] = useState('');
  const [p2pIsHost, setP2pIsHost] = useState(false);
  const [p2pPlayers, setP2pPlayers] = useState([]);
  const [p2pConnecting, setP2pConnecting] = useState(false);
  const [p2pError, setP2pError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

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

  // --- Start Game Logic (Single / Host / Guest) ---
  const launchGameEngine = useCallback(
    ({ mode = 'local', players = [], myId = 'local', selectedDiff = difficulty }) => {
      ghoulAudio.init();

      const logic = new GhoulDuelLogic({
        difficulty: selectedDiff,
        networkMode: mode,
        networkPlayers: players,
        myPeerId: myId,
        onGameOver: handleGameOver,
        onStateChange: (state) => {
          setTeamScores({ ...state.teamScores });
          setMatchTime(state.matchTime);
          setPlayerTail(state.playerTail);
          setPlayerDeposited(state.playerDeposited);
        },
        onBroadcastSnapshot: (snapshot) => {
          if (mode === 'host') {
            ghoulNet.broadcastSnapshot(snapshot);
          }
        },
        onBroadcastGameOver: (stats) => {
          if (mode === 'host') {
            ghoulNet.broadcastGameOver(stats);
          }
        },
        onSendInput: (vector, angle) => {
          if (mode === 'guest') {
            ghoulNet.sendInput(vector, angle);
          }
        }
      });

      logicRef.current = logic;
      if (typeof window !== 'undefined') window.__ghoulLogic = logic;
      setGameState('PLAYING');
      setGameResult(null);
      lastTimeRef.current = performance.now();
    },
    [difficulty, handleGameOver]
  );

  // Start Single Player Match
  const startSingleGame = () => {
    ghoulNet.disconnect();
    launchGameEngine({ mode: 'local', selectedDiff: difficulty });
  };

  // --- P2P Network Handlers ---
  const handleCreateRoom = async () => {
    setP2pError('');
    setP2pConnecting(true);
    try {
      const hostName = p2pName.trim() || '방장';
      const code = await ghoulNet.createRoom(p2pCode, hostName, 'green');
      setP2pIsHost(true);
      setP2pPlayers(ghoulNet.lobbyPlayers);
      setGameState('LOBBY');
      haptics.medium();
    } catch (err) {
      setP2pError(err.message || '방 생성에 실패했습니다.');
    } finally {
      setP2pConnecting(false);
    }
  };

  const handleJoinRoom = async () => {
    setP2pError('');
    setP2pConnecting(true);
    try {
      const guestName = p2pName.trim() || '도촌 학생';
      const code = await ghoulNet.joinRoom(p2pCode, guestName, 'purple');
      setP2pIsHost(false);
      setP2pPlayers(ghoulNet.lobbyPlayers);
      setGameState('LOBBY');
      haptics.medium();
    } catch (err) {
      setP2pError(err.message || '방 참가에 실패했습니다.');
    } finally {
      setP2pConnecting(false);
    }
  };

  const handleStartP2PMatch = () => {
    if (!p2pIsHost) return;
    const seed = Date.now();
    ghoulNet.broadcastGameStart(seed);
    launchGameEngine({
      mode: 'host',
      players: ghoulNet.lobbyPlayers,
      myId: 'host',
      selectedDiff: difficulty
    });
  };

  const handleToggleTeam = () => {
    ghoulNet.toggleMyTeam();
    haptics.light();
  };

  const handleLeaveLobby = () => {
    ghoulNet.disconnect();
    setGameState('START');
    setP2pError('');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(p2pCode);
    setCopiedCode(true);
    haptics.light();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Setup P2P Network Event Listeners
  useEffect(() => {
    ghoulNet.onLobbyUpdate = (players) => {
      setP2pPlayers([...players]);
    };

    ghoulNet.onGameStart = (packet) => {
      launchGameEngine({
        mode: 'guest',
        players: packet.players,
        myId: ghoulNet.myPeerId,
        selectedDiff: difficulty
      });
    };

    ghoulNet.onSnapshot = (snapshot) => {
      if (logicRef.current) {
        logicRef.current.applySnapshot(snapshot);
      }
    };

    ghoulNet.onGuestInput = (peerId, vector, angle) => {
      if (logicRef.current) {
        logicRef.current.handleGuestInput(peerId, vector, angle);
      }
    };

    ghoulNet.onGameOver = (stats) => {
      // Find my player in roster for Guest
      const myGhost = stats.roster?.find(
        (r) => r.id === ghoulNet.myPeerId || r.isPlayer || (r.name && r.name.includes('(나)'))
      );
      const isGreen = myGhost ? myGhost.team === 'green' : ghoulNet.myTeam === 'green';
      const isVictory = isGreen
        ? stats.teamGreenScore > stats.teamPurpleScore
        : stats.teamPurpleScore > stats.teamGreenScore;

      handleGameOver({
        ...stats,
        isVictory,
        playerScore: myGhost ? myGhost.deposited : 0,
        playerStolen: myGhost ? myGhost.stolen : 0
      });
    };

    ghoulNet.onError = (msg) => {
      setP2pError(msg);
    };

    ghoulNet.onDisconnect = (msg) => {
      setP2pError(msg);
      if (gameState === 'PLAYING' || gameState === 'LOBBY') {
        setGameState('START');
      }
    };

    return () => {
      ghoulNet.onLobbyUpdate = null;
      ghoulNet.onGameStart = null;
      ghoulNet.onSnapshot = null;
      ghoulNet.onGuestInput = null;
      ghoulNet.onGameOver = null;
      ghoulNet.onError = null;
      ghoulNet.onDisconnect = null;
    };
  }, [difficulty, gameState, handleGameOver, launchGameEngine]);

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

  // Leaderboard Score Submit Handler (Only for P2P and score > 100)
  const handleSubmitScore = async (e) => {
    e.preventDefault();
    if (playMode !== 'P2P') return;
    if (!playerName.trim() || isSubmitting || isSubmitted) return;

    const finalPlayerScore = gameResult ? gameResult.playerScore : playerDeposited;
    if (finalPlayerScore <= 100) return;

    setIsSubmitting(true);
    try {
      await submitScoreToDB('ghoulduel', playerName.trim(), finalPlayerScore);
      setIsSubmitted(true);
      haptics.success();

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

  // Count green / purple in lobby
  const greenLobby = p2pPlayers.filter((p) => p.team === 'green');
  const purpleLobby = p2pPlayers.filter((p) => p.team === 'purple');

  return (
    <div className="ghoulduel-container">
      {/* 1. Top Header & Match Dashboard */}
      <div className="ghoulduel-header">
        <div className="ghoulduel-top-bar">
          <div className="ghoulduel-title-group">
            <span className="text-2xl">👻</span>
            <h2>도촌 영혼 대결</h2>
            <span className={`ghoulduel-badge ${playMode === 'P2P' ? 'p2p' : ''}`}>
              {playMode === 'P2P' ? '🌐 P2P 멀티플레이' : '4 vs 4 AI 배틀'}
            </span>
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
                onClick={() => {
                  if (playMode === 'P2P') {
                    handleLeaveLobby();
                  } else {
                    startSingleGame();
                  }
                }}
                title="종료/다시하기"
                aria-label="종료/다시하기"
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
              <span className="team-name">초록 영혼팀</span>
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

        {/* --- SCREEN 1: START SCREEN (SINGLE vs P2P SELECTOR) --- */}
        {gameState === 'START' && (
          <div className="ghoulduel-screen-overlay">
            <div className="ghoulduel-card-box">
              <div className="screen-ghost-hero">👻</div>
              <h1 className="screen-main-title">할로윈 영혼 대결</h1>
              <p className="screen-description">
                영혼 불꽃을 모아 기지로 가져오고, 상대 꼬리를 가로채세요!
              </p>

              {/* Mode Switcher Tabs */}
              <div className="mode-tabs">
                <button
                  className={`mode-tab-btn ${playMode === 'SINGLE' ? 'active' : ''}`}
                  onClick={() => setPlayMode('SINGLE')}
                >
                  <Users size={16} />
                  <span>싱글 봇 대전 (AI)</span>
                </button>
                <button
                  className={`mode-tab-btn p2p ${playMode === 'P2P' ? 'active' : ''}`}
                  onClick={() => setPlayMode('P2P')}
                >
                  <Globe size={16} />
                  <span>실시간 친구 대전 (P2P)</span>
                </button>
              </div>

              {p2pError && <div className="p2p-error-banner">{p2pError}</div>}

              {/* SINGLE PLAYER MODE VIEW */}
              {playMode === 'SINGLE' && (
                <>
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

                  <div className="screen-actions">
                    <button className="btn-primary" onClick={startSingleGame}>
                      <Play size={18} fill="currentColor" />
                      <span>대결 시작하기</span>
                    </button>
                    <button className="btn-secondary" onClick={() => setShowHowToPlay(true)}>
                      <HelpCircle size={18} />
                      <span>게임 방법</span>
                    </button>
                  </div>
                </>
              )}

              {/* P2P 4-DIGIT MULTIPLAYER MODE VIEW */}
              {playMode === 'P2P' && (
                <div className="p2p-entry-box">
                  <div className="p2p-input-row">
                    <div className="p2p-input-header">
                      <label className="p2p-label">내 닉네임</label>
                      <span className="p2p-input-hint">※ 바른말 고운말을 사용합시다.</span>
                    </div>
                    <input
                      type="text"
                      value={p2pName}
                      onChange={(e) => setP2pName(e.target.value)}
                      maxLength={8}
                      placeholder="이름을 입력해 주세요"
                      className="p2p-text-input"
                    />
                  </div>

                  <div className="p2p-input-row">
                    <div className="p2p-input-header">
                      <label className="p2p-label">4자리 숫자 룸코드</label>
                      <button
                        type="button"
                        onClick={() => setP2pCode(GhoulDuelNetworkManager.generateRandomCode())}
                        className="p2p-random-btn"
                      >
                        <Dices size={13} />
                        <span>랜덤 번호</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={p2pCode}
                      onChange={(e) => setP2pCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                      maxLength={4}
                      placeholder="4자리 숫자 (예: 1234)"
                      className="p2p-text-input"
                      style={{ fontSize: '1.3rem', letterSpacing: '6px' }}
                    />
                  </div>

                  <div className="p2p-button-row">
                    <button
                      className="btn-p2p-create"
                      onClick={handleCreateRoom}
                      disabled={p2pConnecting || p2pCode.length < 4}
                    >
                      <Play size={16} fill="currentColor" />
                      <span>{p2pConnecting ? '생성 중...' : '방 만들기'}</span>
                    </button>
                    <button
                      className="btn-p2p-join"
                      onClick={handleJoinRoom}
                      disabled={p2pConnecting || p2pCode.length < 4}
                    >
                      <Users size={16} />
                      <span>{p2pConnecting ? '접속 중...' : '방 참가하기'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- SCREEN 2: P2P LOBBY WAITING ROOM --- */}
        {gameState === 'LOBBY' && (
          <div className="ghoulduel-screen-overlay">
            <div className="ghoulduel-card-box">
              <div className="screen-ghost-hero">🏰</div>
              <h2 className="screen-main-title">P2P 대기실</h2>
              <p className="screen-description">
                친구에게 아래 <strong>4자리 룸코드</strong>를 알려주세요!
              </p>

              {/* 4-Digit Numeric Room Code Badge */}
              <div className="lobby-room-code-badge cursor-pointer" onClick={handleCopyCode} title="클릭하여 번호 복사">
                <span className="text-xs text-purple-300 font-bold">방 번호</span>
                <span className="lobby-code-num">{p2pCode}</span>
                {copiedCode ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} className="text-purple-300" />}
              </div>

              {p2pError && <div className="p2p-error-banner">{p2pError}</div>}

              {/* 8 Slots (Green Team vs Purple Team) */}
              <div className="lobby-slots-container">
                {/* Green Team Column */}
                <div className="lobby-team-col green">
                  <div className="lobby-team-title">초록 영혼팀 ({greenLobby.length}/4)</div>
                  {[0, 1, 2, 3].map((slotIdx) => {
                    const player = greenLobby[slotIdx];
                    return (
                      <div key={slotIdx} className={`slot-item ${player ? 'human' : 'ai'} ${player && player.name.includes('(나)') ? 'me' : ''}`}>
                        <span>{player ? `👑 ${player.name}${player.isHost ? ' (방장)' : ''}` : `🤖 AI 봇 (자동배치)`}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Purple Team Column */}
                <div className="lobby-team-col purple">
                  <div className="lobby-team-title">보라 유령팀 ({purpleLobby.length}/4)</div>
                  {[0, 1, 2, 3].map((slotIdx) => {
                    const player = purpleLobby[slotIdx];
                    return (
                      <div key={slotIdx} className={`slot-item ${player ? 'human' : 'ai'} ${player && player.name.includes('(나)') ? 'me' : ''}`}>
                        <span>{player ? `😈 ${player.name}${player.isHost ? ' (방장)' : ''}` : `🤖 AI 봇 (자동배치)`}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lobby Actions */}
              <div className="lobby-actions">
                <button className="btn-secondary" onClick={handleToggleTeam}>
                  <ArrowRightLeft size={16} />
                  <span>팀 변경</span>
                </button>

                {p2pIsHost ? (
                  <button className="btn-primary" onClick={handleStartP2PMatch}>
                    <Play size={18} fill="currentColor" />
                    <span>게임 시작하기 (Start)</span>
                  </button>
                ) : (
                  <div className="btn-secondary flex-2 text-center text-purple-300 font-bold">
                    <span>방장의 시작을 기다리는 중...</span>
                  </div>
                )}

                <button className="btn-secondary" onClick={handleLeaveLobby} title="방 나가기">
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- SCREEN 3: GAME OVER RESULT OVERLAY --- */}
        {gameState === 'GAME_OVER' && gameResult && (
          <div className="ghoulduel-screen-overlay">
            <div className="ghoulduel-card-box" style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
              {/* 1. Team Outcome Header */}
              <div
                className={`gameover-result-badge ${
                  gameResult.isVictory ? 'victory' : 'defeat'
                }`}
              >
                {gameResult.isVictory ? '🎉 우리 팀 대승리!' : '💥 패배! 다음 판에 설욕하세요!'}
              </div>

              <div className="gameover-score-compare">
                <div className="compare-team green">
                  <span className="team-name">초록 영혼팀</span>
                  <span className="score-num">{gameResult.teamGreenScore}</span>
                  {gameResult.teamGreenScore > gameResult.teamPurpleScore && (
                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#34d399' }}>WINNER 🏆</span>
                  )}
                </div>
                <div className="compare-vs">VS</div>
                <div className="compare-team purple">
                  <span className="team-name">보라 유령팀</span>
                  <span className="score-num">{gameResult.teamPurpleScore}</span>
                  {gameResult.teamPurpleScore > gameResult.teamGreenScore && (
                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#c084fc' }}>WINNER 🏆</span>
                  )}
                </div>
              </div>

              {/* 2. MATCH MVP Highlight Card */}
              {gameResult.mvp && (
                <div className="mvp-highlight-card">
                  <div className="mvp-badge-col">
                    <div className="mvp-crown-icon">👑</div>
                    <div className="mvp-info">
                      <span className="mvp-title-tag">★ MATCH MVP (최우수 선수)</span>
                      <span className="mvp-player-name">
                        {gameResult.mvp.name}
                      </span>
                      <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
                        {gameResult.mvp.team === 'green' ? '🟢 초록 영혼팀' : '🟣 보라 유령팀'}
                      </span>
                    </div>
                  </div>
                  <div className="mvp-score-tag">
                    <span className="mvp-score-num">{gameResult.mvp.deposited}점</span>
                    <span className="mvp-score-label">스틸 {gameResult.mvp.stolen}회</span>
                  </div>
                </div>
              )}

              {/* 3. 8-Player Roster Scoreboard */}
              {gameResult.roster && gameResult.roster.length > 0 && (
                <div className="roster-scoreboard-box">
                  <div className="roster-header">
                    <span>순위 / 플레이어</span>
                    <span>영혼 납품 (꼬리 스틸)</span>
                  </div>
                  <div className="roster-list">
                    {gameResult.roster.map((player, idx) => {
                      const rank = idx + 1;
                      let badgeClass = 'other';
                      if (rank === 1) badgeClass = 'gold';
                      else if (rank === 2) badgeClass = 'silver';
                      else if (rank === 3) badgeClass = 'bronze';

                      const isMe = player.isPlayer || player.name.includes('(나)');
                      const displayName = isMe
                        ? player.name.includes('(나)')
                          ? player.name
                          : `${player.name} (나)`
                        : player.name;

                      return (
                        <div
                          key={player.id || idx}
                          className={`roster-row ${isMe ? 'me' : ''} ${rank === 1 ? 'mvp-row' : ''}`}
                        >
                          <div className="roster-player-identity">
                            <span className={`roster-rank-badge ${badgeClass}`}>
                              {rank === 1 ? '👑' : `${rank}등`}
                            </span>
                            <span className={`team-dot ${player.team === 'green' ? 'green' : 'purple'}`} />
                            <span className="roster-name-text">
                              {displayName}
                            </span>
                          </div>
                          <div className="roster-stats">
                            <span className="roster-score">{player.deposited}점</span>
                            <span className="roster-stolen">(스틸 {player.stolen}회)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. Player Personal Stats */}
              <div className="player-personal-stats">
                <div>
                  🏆 나의 영혼 납품 점수: <strong className="text-emerald-400">{gameResult.playerScore}점</strong>
                </div>
                <div>
                  ⚡ 꼬리 가로채기(스틸): <strong className="text-amber-400">{gameResult.playerStolen}회</strong>
                </div>
              </div>

              {/* 5. LEADERBOARD SUBMISSION: ONLY FOR P2P MULTIPLAYER MODE */}
              {playMode === 'P2P' ? (
                gameResult.playerScore > 100 ? (
                  <div className="leaderboard-submit-form">
                    <div className="form-label">
                      <Award size={16} className="text-amber-400" />
                      <span>도촌초등학교 명예의 전당 점수 등록 (실시간 대전 기록)</span>
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
                ) : (
                  <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', margin: '8px 0', padding: '8px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '8px' }}>
                    ※ 명예의 전당 점수 등록은 100점을 초과하여 달성한 경우에만 가능합니다. (현재 개인 점수: {gameResult.playerScore}점)
                  </div>
                )
              ) : (
                <div className="p2p-single-notice-box">
                  💡 <strong>명예의 전당 랭킹 등록</strong>은 친구들과 함께 플레이하는 <strong>'실시간 친구 대전(P2P)'</strong> 모드에서만 가능합니다.
                </div>
              )}

              {/* 6. Restart / Return Actions */}
              <div className="screen-actions">
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (playMode === 'P2P') {
                      if (p2pIsHost) {
                        setGameState('LOBBY');
                      } else {
                        setGameState('START');
                      }
                    } else {
                      startSingleGame();
                    }
                  }}
                >
                  <RotateCcw size={18} />
                  <span>{playMode === 'P2P' ? '대기실로 돌아가기' : '한 판 더 대결하기'}</span>
                </button>
              </div>
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
            startSingleGame();
          }
        }}
      />
    </div>
  );
}
