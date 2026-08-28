// Dochon Games Portal - Snowball Survival React Component
// 100% Zero-Asset Procedural Graphics, Web Audio API Sound & Zero-Cost WebRTC P2P

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SnowballLogic } from './snowballLogic';
import { snowballAudio } from './snowballAudio';
import { snowballNet, SnowballNetworkManager } from './snowballNetwork';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CHARACTER_SKINS,
  DIFFICULTY_PRESETS
} from './snowballConstants';
import SnowballHowToPlayModal from './SnowballHowToPlayModal';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import { haptics } from '../../../utils/haptics';
import {
  Trophy, RotateCcw, Volume2, VolumeX, HelpCircle,
  Sparkles, Play, Users, Globe, Copy, Check, LogOut,
  Send, User, Award, ShieldAlert, Zap, Compass, Dices
} from 'lucide-react';
import './snowball.css';

export default function SnowballGame({ onScoreSubmitted }) {
  const canvasRef = useRef(null);
  const logicRef = useRef(null);
  const reqAnimRef = useRef(null);
  const lastTimeRef = useRef(0);

  // High-Level Game State
  const [gameState, setGameState] = useState('LOBBY'); // 'LOBBY' | 'PLAYING' | 'GAME_OVER'
  const [playMode, setPlayMode] = useState('SOLO');    // 'SOLO' | 'P2P'
  const [selectedSkin, setSelectedSkin] = useState('penguin');
  const [difficulty, setDifficulty] = useState('normal');
  const [isMuted, setIsMuted] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // In-Game Live HUD Stats
  const [hudStats, setHudStats] = useState({
    aliveCount: 8,
    totalPlayers: 8,
    myKills: 0,
    mySnowballSize: 10,
    matchTime: 0,
    arenaRadius: 460,
    isShrinking: false,
    shrinkWarning: false
  });

  // P2P Multiplayer State
  const [p2pSubtab, setP2pSubtab] = useState('CREATE'); // 'CREATE' | 'JOIN'
  const [p2pCode, setP2pCode] = useState(() => SnowballNetworkManager.generateRandomCode());
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [p2pName, setP2pName] = useState('');
  const [p2pIsHost, setP2pIsHost] = useState(false);
  const [p2pPlayers, setP2pPlayers] = useState([]);
  const [p2pConnecting, setP2pConnecting] = useState(false);
  const [p2pError, setP2pError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Game Over & Hall of Fame Form State
  const [gameResult, setGameResult] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Touch Virtual Joystick State
  const joystickRef = useRef(null);
  const [isDraggingJoystick, setIsDraggingJoystick] = useState(false);
  const [thumbPos, setThumbPos] = useState({ x: 0, y: 0 });

  // Handle Game Over
  const handleGameOver = useCallback((stats) => {
    setGameResult(stats);
    setGameState('GAME_OVER');
    setPlayerName(p2pName || '');
    setIsSubmitted(false);
    setIsSubmitting(false);
    haptics.success();
  }, [p2pName]);

  // Launch Game Engine (Solo or P2P)
  const launchGameEngine = useCallback(
    ({ mode = 'local', players = [], myId = 'local', selectedDiff = difficulty, skinId = selectedSkin }) => {
      snowballAudio.init();

      const logic = new SnowballLogic({
        difficulty: selectedDiff,
        networkMode: mode,
        networkPlayers: players,
        myPeerId: myId,
        mySkinId: skinId,
        onGameOver: handleGameOver,
        onStateChange: (state) => {
          setHudStats(state);
        }
      });

      logicRef.current = logic;
      setGameState('PLAYING');
      lastTimeRef.current = performance.now();

      // Main Canvas Animation Loop
      const loop = (currentTime) => {
        const dt = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1);
        lastTimeRef.current = currentTime;

        if (logicRef.current) {
          logicRef.current.update(dt);

          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              logicRef.current.render(ctx);
            }
          }
        }

        reqAnimRef.current = requestAnimationFrame(loop);
      };

      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
      reqAnimRef.current = requestAnimationFrame(loop);
    },
    [difficulty, selectedSkin, handleGameOver]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
      snowballNet.disconnect();
    };
  }, []);

  // Keyboard Event Listeners for WASD / Arrows / Space
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const keys = {};
    const handleKeyDown = (e) => {
      keys[e.key] = true;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
      }
      if (logicRef.current) {
        logicRef.current.updateKeyboardInput(keys);
      }
    };

    const handleKeyUp = (e) => {
      keys[e.key] = false;
      if (logicRef.current) {
        logicRef.current.input.shootRequested = false;
        logicRef.current.updateKeyboardInput(keys);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Mouse Aim & Shoot Handlers on Canvas
  const handleCanvasMouseDown = (e) => {
    if (gameState !== 'PLAYING' || !logicRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    logicRef.current.setMouseAim(cx, cy, true);
  };

  const handleCanvasMouseMove = (e) => {
    if (gameState !== 'PLAYING' || !logicRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    logicRef.current.setMouseAim(cx, cy, logicRef.current.input.isAiming);
  };

  const handleCanvasMouseUp = (e) => {
    if (gameState !== 'PLAYING' || !logicRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    logicRef.current.setMouseAim(cx, cy, false);
  };

  // Virtual Joystick Touch Handlers
  const handleJoystickTouchStart = (e) => {
    setIsDraggingJoystick(true);
    handleJoystickTouchMove(e);
  };

  const handleJoystickTouchMove = (e) => {
    if (!joystickRef.current || !logicRef.current) return;
    const touch = e.touches[0];
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxRadius = rect.width / 2 - 10;

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);
    const thumbX = Math.cos(angle) * clampedDist;
    const thumbY = Math.sin(angle) * clampedDist;

    setThumbPos({ x: thumbX, y: thumbY });
    logicRef.current.setJoystickInput(dx / maxRadius, dy / maxRadius, true);
  };

  const handleJoystickTouchEnd = () => {
    setIsDraggingJoystick(false);
    setThumbPos({ x: 0, y: 0 });
    if (logicRef.current) {
      logicRef.current.setJoystickInput(0, 0, false);
    }
  };

  // --- START SOLO GAME ---
  const handleStartSolo = () => {
    launchGameEngine({
      mode: 'local',
      players: [],
      myId: 'local',
      selectedDiff: difficulty,
      skinId: selectedSkin
    });
  };

  // --- P2P HOST: Create Room ---
  const handleHostCreateRoom = async () => {
    setP2pConnecting(true);
    setP2pError('');
    try {
      snowballNet.onLobbyUpdate = (players) => {
        setP2pPlayers(players);
      };
      snowballNet.onError = (msg) => setP2pError(msg);

      await snowballNet.createRoom(p2pCode, p2pName || '도촌눈사람', selectedSkin);
      setP2pIsHost(true);
      setP2pPlayers(snowballNet.lobbyPlayers);
    } catch (err) {
      setP2pError(err.message || '방 생성 중 오류가 발생했습니다.');
    } finally {
      setP2pConnecting(false);
    }
  };

  // --- P2P GUEST: Join Room ---
  const handleGuestJoinRoom = async () => {
    if (!joinCodeInput || joinCodeInput.length !== 4) {
      setP2pError('4자리 숫자 방 코드를 입력해주세요.');
      return;
    }

    setP2pConnecting(true);
    setP2pError('');

    try {
      snowballNet.onLobbyUpdate = (players) => {
        setP2pPlayers(players);
      };
      snowballNet.onGameStart = (data) => {
        launchGameEngine({
          mode: 'guest',
          players: data.players,
          myId: snowballNet.myPeerId,
          skinId: selectedSkin
        });
      };
      snowballNet.onError = (msg) => setP2pError(msg);

      await snowballNet.joinRoom(joinCodeInput, p2pName || '도촌친구', selectedSkin);
      setP2pIsHost(false);
    } catch (err) {
      setP2pError(err.message || '방 접속에 실패했습니다.');
    } finally {
      setP2pConnecting(false);
    }
  };

  // --- P2P HOST: Start Multiplayer Match ---
  const handleHostStartGame = () => {
    if (!p2pIsHost) return;

    snowballNet.onGameStart = (data) => {
      launchGameEngine({
        mode: 'host',
        players: data.players,
        myId: snowballNet.myPeerId,
        skinId: selectedSkin
      });
    };

    snowballNet.hostStartGame();
  };

  // Copy P2P Room Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(p2pCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Toggle Audio Mute
  const handleToggleMute = () => {
    const nextMuted = snowballAudio.toggleMute();
    setIsMuted(nextMuted);
  };

  // Submit Score to Hall of Fame (P2P Mode ONLY, score > 100, placeholder: '예: 홍길동')
  const handleSubmitScore = async (e) => {
    e.preventDefault();
    // STRICT RULE: Only P2P matches are eligible for Hall of Fame
    if (playMode !== 'P2P') return;
    if (!gameResult || gameResult.totalScore <= 100) return;
    if (!playerName.trim() || isSubmitting || isSubmitted) return;

    setIsSubmitting(true);
    try {
      await submitScoreToDB('snowball', playerName.trim(), gameResult.totalScore);
      setIsSubmitted(true);
      haptics.success();

      // Trigger Portal Leaderboard Modal with auto-tab sync
      if (onScoreSubmitted) {
        setTimeout(() => {
          onScoreSubmitted('snowball');
        }, 400);
      }
    } catch (err) {
      console.error('Score submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Return to Lobby
  const handleBackToLobby = () => {
    if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
    snowballNet.disconnect();
    setP2pPlayers([]);
    setP2pIsHost(false);
    setGameState('LOBBY');
    setGameResult(null);
  };

  return (
    <div className="snowball-game-container">
      {/* Top Header Bar */}
      <div className="snowball-header">
        <div className="snowball-header-title">
          <span style={{ fontSize: '24px' }}>☃️</span>
          <h1>도촌 눈싸움 서바이벌</h1>
        </div>

        <div className="snowball-header-controls">
          <button
            className="snowball-icon-btn"
            onClick={() => setShowHowToPlay(true)}
            title="게임 가이드"
          >
            <HelpCircle size={18} />
          </button>
          <button
            className="snowball-icon-btn"
            onClick={handleToggleMute}
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          {gameState !== 'LOBBY' && (
            <button
              className="snowball-icon-btn"
              onClick={handleBackToLobby}
              title="로비로 나가기"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>

      {/* =========================================
          LOBBY VIEW
          ========================================= */}
      {gameState === 'LOBBY' && (
        <div className="snowball-lobby">
          <div className="snowball-hero-banner">
            <h2>거대 눈덩이를 굴려 링 밖으로 날려라!</h2>
            <p>얼음이 붕괴되어 좁아지는 북극 빙판에서 최후의 1인이 될 때까지 살아남으세요!</p>
          </div>

          {/* Mode Switch Tabs: Solo vs P2P */}
          <div className="snowball-mode-tabs">
            <button
              className={`snowball-mode-tab ${playMode === 'SOLO' ? 'active' : ''}`}
              onClick={() => setPlayMode('SOLO')}
            >
              <User size={16} /> 솔로 서바이벌 (vs AI 7인)
            </button>
            <button
              className={`snowball-mode-tab ${playMode === 'P2P' ? 'active' : ''}`}
              onClick={() => setPlayMode('P2P')}
            >
              <Globe size={16} /> 실시간 P2P 멀티플레이
            </button>
          </div>

          {/* Skin Selection Carousel */}
          <div className="snowball-skin-selector">
            <h3><Sparkles size={16} /> 캐릭터 선택</h3>
            <div className="snowball-skins-grid">
              {CHARACTER_SKINS.map((skin) => (
                <div
                  key={skin.id}
                  className={`snowball-skin-card ${selectedSkin === skin.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedSkin(skin.id);
                    if (p2pPlayers.length > 0) {
                      snowballNet.changeSkin(skin.id);
                    }
                  }}
                >
                  <div className="snowball-skin-emoji">{skin.avatarEmoji}</div>
                  <div className="snowball-skin-name">{skin.name}</div>
                  <div className="snowball-skin-role">{skin.role}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Solo Mode Configuration */}
          {playMode === 'SOLO' && (
            <div className="snowball-config-card">
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#BAE6FD' }}>
                난이도 선택
              </span>
              <div className="snowball-diff-buttons">
                {Object.keys(DIFFICULTY_PRESETS).map((key) => (
                  <button
                    key={key}
                    className={`snowball-diff-btn ${difficulty === key ? 'selected' : ''}`}
                    onClick={() => setDifficulty(key)}
                  >
                    {DIFFICULTY_PRESETS[key].name}
                  </button>
                ))}
              </div>

              <button className="snowball-start-btn" onClick={handleStartSolo}>
                <Play size={20} fill="#FFFFFF" /> 서바이벌 대난투 시작!
              </button>
            </div>
          )}

          {/* P2P Multiplayer Mode Configuration */}
          {playMode === 'P2P' && (
            <div className="snowball-config-card">
              <div className="snowball-p2p-panel">
                <div className="snowball-p2p-subtabs">
                  <button
                    className={`snowball-p2p-subtab ${p2pSubtab === 'CREATE' ? 'active' : ''}`}
                    onClick={() => {
                      setP2pSubtab('CREATE');
                      snowballNet.disconnect();
                      setP2pPlayers([]);
                    }}
                  >
                    방 만들기 (호스트)
                  </button>
                  <button
                    className={`snowball-p2p-subtab ${p2pSubtab === 'JOIN' ? 'active' : ''}`}
                    onClick={() => {
                      setP2pSubtab('JOIN');
                      snowballNet.disconnect();
                      setP2pPlayers([]);
                    }}
                  >
                    코드로 참가하기 (게스트)
                  </button>
                </div>

                {/* Nickname Input */}
                <div className="snowball-input-row">
                  <input
                    type="text"
                    className="snowball-text-input"
                    placeholder="내 닉네임 입력 (기본: 도촌눈사람)"
                    value={p2pName}
                    onChange={(e) => setP2pName(e.target.value)}
                    maxLength={10}
                  />
                </div>

                {/* Subtab 1: Create Room */}
                {p2pSubtab === 'CREATE' && (
                  <>
                    <div className="snowball-code-box">
                      <span style={{ fontSize: '13px', color: '#94A3B8' }}>내 방 코드:</span>
                      <span className="snowball-code-value">{p2pCode}</span>
                      <button
                        className="snowball-icon-btn"
                        onClick={handleCopyCode}
                        title="방 코드 복사"
                      >
                        {copiedCode ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
                      </button>
                      <button
                        className="snowball-icon-btn"
                        onClick={() => setP2pCode(SnowballNetworkManager.generateRandomCode())}
                        title="새 코드 생성"
                      >
                        <Dices size={16} />
                      </button>
                    </div>

                    {p2pPlayers.length === 0 ? (
                      <button
                        className="snowball-start-btn"
                        onClick={handleHostCreateRoom}
                        disabled={p2pConnecting}
                      >
                        {p2pConnecting ? '방 생성 중...' : '방 개설하고 대기하기'}
                      </button>
                    ) : (
                      <>
                        <div style={{ fontSize: '13px', color: '#BAE6FD', fontWeight: 800 }}>
                          대기실 참가자 ({p2pPlayers.length} / 8명):
                        </div>
                        <div className="snowball-p2p-players-list">
                          {p2pPlayers.map((pl) => (
                            <div key={pl.id} className="snowball-p2p-player-chip">
                              <span>{pl.isHost ? '👑' : '⛄'}</span>
                              <span>{pl.name}</span>
                            </div>
                          ))}
                        </div>

                        <button className="snowball-start-btn" onClick={handleHostStartGame}>
                          <Play size={20} fill="#FFFFFF" /> 대결 시작하기! ({p2pPlayers.length}명)
                        </button>
                      </>
                    )}
                  </>
                )}

                {/* Subtab 2: Join Room */}
                {p2pSubtab === 'JOIN' && (
                  <>
                    <div className="snowball-input-row">
                      <input
                        type="text"
                        className="snowball-text-input"
                        placeholder="4자리 숫자 방 코드 입력 (예: 1234)"
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                        maxLength={4}
                      />
                      <button
                        className="snowball-start-btn"
                        style={{ width: 'auto', padding: '10px 20px', fontSize: '14px' }}
                        onClick={handleGuestJoinRoom}
                        disabled={p2pConnecting || joinCodeInput.length !== 4}
                      >
                        {p2pConnecting ? '접속 중...' : '입장'}
                      </button>
                    </div>

                    {p2pPlayers.length > 0 && (
                      <div style={{ textAlign: 'center', padding: '10px', color: '#34D399', fontWeight: 700 }}>
                        방에 접속되었습니다! 방장이 게임을 시작할 때까지 잠시 대기해주세요...
                      </div>
                    )}
                  </>
                )}

                {p2pError && (
                  <div style={{ color: '#F87171', fontSize: '12px', textAlign: 'center' }}>
                    {p2pError}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================
          INGAME VIEW (CANVAS & HUD)
          ========================================= */}
      {(gameState === 'PLAYING' || gameState === 'GAME_OVER') && (
        <div className="snowball-canvas-wrap">
          {/* Top HUD Bar */}
          <div className="snowball-hud-bar">
            <div className="snowball-hud-stat">
              <Users size={16} color="#38BDF8" />
              <span>생존: <strong style={{ color: '#FDE047' }}>{hudStats.aliveCount}</strong> / {hudStats.totalPlayers}</span>
            </div>

            {hudStats.shrinkWarning && (
              <div className="snowball-warning-pill">
                ⚠️ 얼음 빙판이 곧 붕괴됩니다!
              </div>
            )}

            <div className="snowball-hud-stat">
              <span>처치: <strong style={{ color: '#EF4444' }}>{hudStats.myKills}</strong> 킬</span>
              <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
              <span>시간: {hudStats.matchTime}초</span>
            </div>
          </div>

          {/* 1000 x 700 Canvas */}
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="snowball-canvas"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
          />

          {/* Mobile On-Screen Virtual Controls */}
          <div className="snowball-mobile-controls">
            <div
              ref={joystickRef}
              className="snowball-joystick-base"
              onTouchStart={handleJoystickTouchStart}
              onTouchMove={handleJoystickTouchMove}
              onTouchEnd={handleJoystickTouchEnd}
            >
              <div
                className="snowball-joystick-thumb"
                style={{
                  transform: `translate(calc(-50% + ${thumbPos.x}px), calc(-50% + ${thumbPos.y}px))`
                }}
              />
            </div>

            <button
              className="snowball-shoot-btn"
              onTouchStart={() => {
                if (logicRef.current) logicRef.current.triggerShoot();
              }}
              onClick={() => {
                if (logicRef.current) logicRef.current.triggerShoot();
              }}
            >
              <Zap size={22} fill="#FFFFFF" />
              <span>발사!</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================
          GAME OVER RESULT & HALL OF FAME
          ========================================= */}
      {gameState === 'GAME_OVER' && gameResult && (
        <div className="snowball-gameover-overlay">
          <div className="snowball-gameover-card">
            {/* 1. Golden MVP Showcase Card */}
            <div className="snowball-mvp-showcase">
              <div className="snowball-mvp-crown">👑</div>
              <div className="snowball-mvp-badge">
                <Sparkles size={14} /> MVP 1위 챔피언 <Sparkles size={14} />
              </div>
              <div className="snowball-mvp-name-row">
                <span className="snowball-mvp-avatar">{gameResult.mvp?.avatarEmoji || '⛄'}</span>
                <span className="snowball-mvp-title">{gameResult.mvp?.name || '챔피언'}</span>
                {gameResult.mvp?.id === (playMode === 'P2P' ? snowballNet.myPeerId : 'local') && (
                  <span className="snowball-my-tag">⭐ 나</span>
                )}
              </div>
              <div className="snowball-mvp-details">
                <span className="mvp-stat-item">⚔️ 처치: <strong>{gameResult.mvp?.kills || 0}명</strong></span>
                <span className="mvp-stat-divider">|</span>
                <span className="mvp-stat-item">⏱️ 생존: <strong>{gameResult.mvp?.survivalSeconds || 0}초</strong></span>
                <span className="mvp-stat-divider">|</span>
                <span className="mvp-stat-score">✨ {gameResult.mvp?.totalScore || 0}점</span>
              </div>
            </div>

            {/* 2. All Players Scoreboard Table */}
            <div className="snowball-scoreboard-section">
              <div className="snowball-scoreboard-header">
                <span>🏅 전체 참가자 경기 성적표</span>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>총 {gameResult.allPlayers?.length || 0}명 참가</span>
              </div>
              <div className="snowball-scoreboard-list">
                {gameResult.allPlayers?.map((item) => {
                  const isMe = item.id === (playMode === 'P2P' ? snowballNet.myPeerId : 'local');
                  let rankEmoji = `${item.rank}위`;
                  if (item.rank === 1) rankEmoji = '🥇 1위';
                  else if (item.rank === 2) rankEmoji = '🥈 2위';
                  else if (item.rank === 3) rankEmoji = '🥉 3위';

                  return (
                    <div
                      key={item.id}
                      className={`snowball-scoreboard-row ${item.rank === 1 ? 'rank-1' : ''} ${isMe ? 'my-row' : ''}`}
                    >
                      <div className="scoreboard-col-rank">
                        <span className="rank-text">{rankEmoji}</span>
                      </div>
                      <div className="scoreboard-col-player">
                        <span className="player-avatar">{item.avatarEmoji || '⛄'}</span>
                        <span className="player-name">{item.name}</span>
                        {isMe && <span className="snowball-my-tag mini">나</span>}
                      </div>
                      <div className="scoreboard-col-stats">
                        <span className="stat-kill">⚔️ {item.kills}</span>
                        <span className="stat-time">⏱️ {item.survivalSeconds}s</span>
                      </div>
                      <div className="scoreboard-col-score">
                        <strong>{item.totalScore}점</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Hall of Fame Registration Section (P2P Mode ONLY) */}
            {playMode === 'P2P' ? (
              gameResult.totalScore > 100 ? (
                <div className="snowball-halloffame-box p2p-active">
                  <div className="snowball-halloffame-title">
                    <Trophy size={14} color="#FBBF24" />
                    <span>도촌초 명예의 전당 점수 등록 (실시간 P2P 멀티플레이 기록)</span>
                  </div>
                  {isSubmitted ? (
                    <div style={{ color: '#34D399', fontSize: '13px', fontWeight: 800, padding: '6px' }}>
                      ✅ 명예의 전당에 점수({gameResult.totalScore}점)가 등록되었습니다!
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitScore} className="snowball-submit-form">
                      <input
                        type="text"
                        className="snowball-submit-input"
                        placeholder="예: 홍길동"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        maxLength={10}
                        disabled={isSubmitting}
                      />
                      <button
                        type="submit"
                        className="snowball-submit-btn"
                        disabled={isSubmitting || !playerName.trim()}
                      >
                        <Send size={14} /> {isSubmitting ? '등록 중' : '내 점수 등록'}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div className="snowball-score-notice">
                  * 100점을 초과 달성해야 도촌초 명예의 전당에 점수를 등록할 수 있습니다. (현재 {gameResult.totalScore}점)
                </div>
              )
            ) : (
              <div className="snowball-solo-p2p-notice">
                <Globe size={16} color="#38BDF8" style={{ flexShrink: 0 }} />
                <span>
                  도촌초 명예의 전당 점수 등록은 <strong>'실시간 P2P 멀티플레이'</strong> 대결에서만 가능합니다! 친구와 4자리 코드로 함께 대결해보세요 🌐
                </span>
              </div>
            )}

            <div className="snowball-gameover-actions">
              <button className="snowball-btn-secondary" onClick={handleBackToLobby}>
                <LogOut size={16} /> 로비로 나가기
              </button>
              <button
                className="snowball-btn-primary"
                onClick={playMode === 'P2P' ? handleBackToLobby : handleStartSolo}
              >
                <RotateCcw size={16} /> {playMode === 'P2P' ? '새 방 만들기' : '다시 도전'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Guide Modal */}
      <SnowballHowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />
    </div>
  );
}
