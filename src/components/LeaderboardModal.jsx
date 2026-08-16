import React, { useState, useEffect } from 'react';
import { getLeaderboardFromDB, updateScoreInDB, deleteScoreFromDB, deduplicateLeaderboard } from '../utils/leaderboardApi';
import { PLAYABLE_GAMES } from '../data/gamesData';
import { Trophy, X, Crown, Medal, Zap, RefreshCw, Sparkles, Star, Heart, Lock, Edit2, Trash2, Check, LogOut, ShieldAlert } from 'lucide-react';

export default function LeaderboardModal({ isOpen, onClose, activeTab = 'pacman' }) {
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin Mode States
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Editing Item State
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editScore, setEditScore] = useState('');

  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (isOpen) {
      loadScores();
      const interval = setInterval(loadScores, 6000);
      return () => clearInterval(interval);
    }
  }, [isOpen, currentTab]);

  const loadScores = async () => {
    setLoading(true);
    const data = await getLeaderboardFromDB(currentTab);
    setScores(data);
    setLoading(false);
  };

  // Secret Hidden Trigger on Left Trophy Circle (Seamless Graphic)
  const handleTrophyClick = () => {
    if (isAdminMode) return;
    setPasswordInput('');
    setPasswordError('');
    setShowPasswordPrompt(true);
  };

  // 100% Reliable Admin Password Verification for '8582'
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const cleanInput = String(passwordInput).trim();
    if (cleanInput === '8582' || btoa(cleanInput) === 'ODU4Mg==') {
      setIsAdminMode(true);
      setShowPasswordPrompt(false);
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError('❌ 관리자 암호가 올바르지 않습니다.');
    }
  };

  // Admin Edit Handler (Optimistic UI Update + Cloud DB Sync)
  const startEditing = (item) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditScore(item.score);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditScore('');
  };

  const saveEditing = async (id, e) => {
    if (e) e.preventDefault();
    if (!editName.trim() || isNaN(editScore)) return;

    const updatedName = editName.trim();
    const updatedScore = Number(editScore);

    // 1. Optimistic UI update immediately with deduplication
    setScores(prev => {
      const newList = prev.map(item => String(item.id) === String(id) ? { ...item, name: updatedName, score: updatedScore } : item);
      return deduplicateLeaderboard(newList);
    });

    setEditingId(null);

    // 2. Perform DB update & reload
    await updateScoreInDB(currentTab, id, updatedName, updatedScore);
    await loadScores();
  };

  // Admin Delete Handler (Optimistic UI Update + Cloud DB Sync)
  const handleDelete = async (id, name, e) => {
    if (e) e.preventDefault();
    if (window.confirm(`[관리자 경고] '${name}' 학생의 기록을 정말 삭제하시겠습니까?\n삭제된 데이터는 Cloud DB에서 영구 삭제됩니다.`)) {
      // 1. Optimistic UI delete immediately
      setScores(prev => prev.filter(item => String(item.id) !== String(id)));
      
      // 2. Perform DB deletion & reload
      await deleteScoreFromDB(currentTab, id);
      await loadScores();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="leaderboard-overlay">
      {/* Premium Pastel Candy Pop Container Box (Zero Horizontal Scrollbar) */}
      <div className="leaderboard-modal-box">
        
        {/* Vibrant Red Close Button (Top-Right Only) */}
        <button
          onClick={onClose}
          className="leaderboard-close-btn"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1-Line Balanced Header Layout */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          
          {/* Main Title Row: Left Trophy Circle | Title | Right Sparkle Circle */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%' }}>
            
            {/* 🏆 Seamless Secret Hidden Trophy Graphic (Pastel Circle Background) */}
            <div
              onClick={handleTrophyClick}
              className="secret-admin-trigger"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'rgba(251, 191, 36, 0.25)',
                border: '1.5px solid rgba(251, 191, 36, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'default',
                userSelect: 'none',
                flexShrink: 0
              }}
              title="도촌초등학교 명예의 전당"
            >
              <Trophy style={{ width: '20px', height: '20px', color: '#FBBF24', fill: 'rgba(251, 191, 36, 0.5)' }} />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', margin: 0, whiteSpace: 'nowrap' }}>
              도촌초등학교 <span style={{ color: '#FBBF24' }}>명예의 전당</span>
            </h2>

            {/* Right Pastel Sparkles Circle */}
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(253, 224, 71, 0.25)',
              border: '1.5px solid rgba(253, 224, 71, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              flexShrink: 0
            }}>
              <Sparkles style={{ width: '18px', height: '18px', color: '#FDE047' }} />
            </div>
          </div>

          {/* Sub-Badges Row */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
            {/* Left Badge: Heart - 도촌어린이 랭킹 - Star */}
            <span style={{
              backgroundColor: 'rgba(244, 63, 94, 0.18)',
              color: '#FDA4AF',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 800,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '6px'
            }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#F43F5E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart style={{ width: '10px', height: '10px', color: '#FFFFFF', fill: '#FFFFFF' }} />
              </div>
              <span>도촌어린이 랭킹</span>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#F43F5E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Star style={{ width: '10px', height: '10px', color: '#FFFFFF', fill: '#FFFFFF' }} />
              </div>
            </span>

            {/* Right Badge: Refresh - 실시간 클라우드 DB - Zap */}
            <span style={{
              backgroundColor: 'rgba(16, 185, 129, 0.18)',
              color: '#6EE7B7',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 800,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '6px'
            }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCw style={{ width: '10px', height: '10px', color: '#FFFFFF' }} />
              </div>
              <span>실시간 클라우드 DB</span>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap style={{ width: '10px', height: '10px', color: '#FFFFFF', fill: '#FFFFFF' }} />
              </div>
            </span>
          </div>

          {/* Admin Mode Active Banner */}
          {isAdminMode && (
            <div style={{
              width: '100%',
              background: 'linear-gradient(135deg, #DC2626, #EF4444)',
              border: '2px solid #F87171',
              color: '#FFFFFF',
              padding: '6px 14px',
              borderRadius: '14px',
              fontSize: '11px',
              fontWeight: 900,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert style={{ width: '16px', height: '16px', color: '#FDE047' }} />
                🔐 관리자 모드 (수정 및 삭제 권한 활성화됨)
              </span>
              <button
                onClick={() => setIsAdminMode(false)}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '3px 8px',
                  borderRadius: '8px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                로그아웃
              </button>
            </div>
          )}
        </div>

        {/* Future-Proof Dynamic Game Tab Bar (No horizontal scroll, wrap-enabled) */}
        <div className="leaderboard-tab-container">
          {PLAYABLE_GAMES.map(game => {
            const isActive = currentTab === game.id;
            let iconEmoji = '🕹️';
            if (game.id === 'pacman') iconEmoji = '🟡';
            if (game.id === 'dino') iconEmoji = '🦖';
            if (game.id === 'snake') iconEmoji = '🐍';
            if (game.id === 'solitaire') iconEmoji = '🃏';
            if (game.id === 'minesweeper') iconEmoji = '💣';
            if (game.id === 'baseball') iconEmoji = '⚾';
            if (game.id === 'gnome') iconEmoji = '🌿';
            if (game.id === 'colortile') iconEmoji = '🧩';

            // Remove '도촌 ' prefix for compact and clean layout
            const shortTitle = game.title.replace(/^도촌\s*/, '');

            let activeCustomStyle = {};
            if (isActive) {
              if (game.id === 'pacman') activeCustomStyle = { background: 'linear-gradient(135deg, #FBBF24, #F59E0B)', color: '#78350F' };
              else if (game.id === 'dino') activeCustomStyle = { background: 'linear-gradient(135deg, #34D399, #10B981)', color: '#064E3B' };
              else if (game.id === 'snake') activeCustomStyle = { background: 'linear-gradient(135deg, #10B981, #059669)', color: '#FFFFFF' };
              else if (game.id === 'solitaire') activeCustomStyle = { background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' };
              else if (game.id === 'minesweeper') activeCustomStyle = { background: 'linear-gradient(135deg, #10B981, #047857)', color: '#FFFFFF' };
              else if (game.id === 'baseball') activeCustomStyle = { background: 'linear-gradient(135deg, #38BDF8, #0284C7)', color: '#FFFFFF' };
              else if (game.id === 'gnome') activeCustomStyle = { background: 'linear-gradient(135deg, #48BB78, #2F855A)', color: '#FFFFFF' };
              else if (game.id === 'colortile') activeCustomStyle = { background: 'linear-gradient(135deg, #EC4899, #8B5CF6)', color: '#FFFFFF' };
            }

            return (
              <button
                key={game.id}
                onClick={() => setCurrentTab(game.id)}
                className={`leaderboard-tab-chip ${isActive ? 'active' : ''}`}
                style={activeCustomStyle}
              >
                <span style={{ fontSize: '13px' }}>{iconEmoji}</span>
                <span>{shortTitle}</span>
              </button>
            );
          })}
        </div>

        {/* Leaderboard Score List */}
        <div className="leaderboard-score-list">
          {loading && scores.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#FBBF24', fontSize: '12px', fontWeight: 700 }}>
              <RefreshCw style={{ width: '16px', height: '16px', display: 'inline-block', marginRight: '6px' }} />
              클라우드 DB에서 랭킹을 불러오는 중...
            </div>
          ) : scores.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8', fontSize: '12px', fontWeight: 700 }}>
              아직 등록된 랭킹 기록이 없습니다.<br />첫 번째 랭커에 도전해보세요! 🚀
            </div>
          ) : (
            scores.map((item, idx) => {
              const rank = idx + 1;
              let rankBadge = null;
              let rowClass = 'rank-other';
              let nameColor = '#FFFFFF';
              let scoreColor = '#FBBF24';

              if (rank === 1) {
                rowClass = 'rank-1';
                nameColor = '#78350F';
                scoreColor = '#78350F';
                rankBadge = (
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px', backgroundColor: '#F59E0B', color: '#FFFFFF', padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 900, flexShrink: 0 }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justify: 'center' }}>
                      <Crown style={{ width: '10px', height: '10px', color: '#FFFFFF', fill: '#FFFFFF' }} />
                    </div>
                    <span>1등</span>
                  </div>
                );
              } else if (rank === 2) {
                rowClass = 'rank-2';
                nameColor = '#0C4A6E';
                scoreColor = '#0C4A6E';
                rankBadge = (
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px', backgroundColor: '#0284C7', color: '#FFFFFF', padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 900, flexShrink: 0 }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justify: 'center' }}>
                      <Medal style={{ width: '10px', height: '10px', color: '#FFFFFF' }} />
                    </div>
                    <span>2등</span>
                  </div>
                );
              } else if (rank === 3) {
                rowClass = 'rank-3';
                nameColor = '#881337';
                scoreColor = '#881337';
                rankBadge = (
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px', backgroundColor: '#E11D48', color: '#FFFFFF', padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 900, flexShrink: 0 }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justify: 'center' }}>
                      <Medal style={{ width: '10px', height: '10px', color: '#FFFFFF' }} />
                    </div>
                    <span>3등</span>
                  </div>
                );
              } else {
                rankBadge = (
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#334155', color: '#94A3B8', display: 'flex', alignItems: 'center', justify: 'center', fontSize: '11px', fontWeight: 900, flexShrink: 0 }}>
                    {rank}
                  </div>
                );
              }

              const isEditingThis = editingId === item.id;

              return (
                <div key={item.id || idx} className={`leaderboard-score-row ${rowClass}`}>
                  {isEditingThis ? (
                    <form onSubmit={(e) => saveEditing(item.id, e)} style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', padding: '6px', backgroundColor: '#0F172A', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800, color: '#FBBF24' }}>
                        <span>✏️ 기록 수정</span>
                        <span>ID: {item.id}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          style={{ flex: 1, padding: '4px 8px', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', color: '#FFFFFF', fontSize: '12px' }}
                          autoFocus
                          required
                        />
                        <input
                          type="number"
                          value={editScore}
                          onChange={(e) => setEditScore(e.target.value)}
                          style={{ width: '80px', padding: '4px 8px', backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '6px', color: '#FBBF24', fontSize: '12px', textAlign: 'right' }}
                          required
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button type="submit" style={{ backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
                          저장
                        </button>
                        <button type="button" onClick={cancelEditing} style={{ backgroundColor: '#475569', color: '#FFFFFF', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                          취소
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {/* Left Side: Rank Badge + Name */}
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                        {rankBadge}
                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', minWidth: 0 }}>
                          <span style={{ fontSize: '13px', fontWeight: 900, color: nameColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </span>
                          <span style={{ fontSize: '10px', opacity: 0.7 }}>
                            {item.date || '2026-08-13'}
                          </span>
                        </div>
                      </div>

                      {/* Right Side: Score Pill with Circle Zap Icon */}
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                          <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justify: 'center' }}>
                            <Zap style={{ width: '10px', height: '10px', color: scoreColor, fill: scoreColor }} />
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: 900, color: scoreColor }}>
                            {item.score.toLocaleString()} <span style={{ fontSize: '10px', fontWeight: 600 }}>점</span>
                          </span>
                        </div>

                        {isAdminMode && (
                          <div style={{ display: 'flex', gap: '4px', marginLeft: '4px' }}>
                            <button onClick={() => startEditing(item)} style={{ backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }} title="수정">
                              <Edit2 style={{ width: '12px', height: '12px' }} />
                            </button>
                            <button onClick={(e) => handleDelete(item.id, item.name, e)} style={{ backgroundColor: '#E11D48', color: '#FFFFFF', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }} title="삭제">
                              <Trash2 style={{ width: '12px', height: '12px' }} />
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer (No bottom Close button, 1-line horizontal text with circle icons) */}
        <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'row', alignItems: 'center', justify: 'center', gap: '6px' }}>
          <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'rgba(253, 224, 71, 0.3)', display: 'flex', alignItems: 'center', justify: 'center' }}>
            <Star style={{ width: '10px', height: '10px', color: '#FDE047', fill: '#FDE047' }} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#FDE047' }}>도촌초등학교 게임 명예의 전당</span>
        </div>
      </div>

      {/* Secret Password Prompt Overlay Modal */}
      {showPasswordPrompt && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 100000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#1E1B4B',
            border: '3px solid #FBBF24',
            borderRadius: '24px',
            padding: '24px',
            width: '100%',
            maxWidth: '360px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            color: '#FFFFFF'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.2)', border: '1px solid #F59E0B', display: 'flex', alignItems: 'center', justify: 'center' }}>
                <Lock style={{ width: '20px', height: '20px', color: '#FBBF24' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>🔐 관리자 암호 인증</h3>
              <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>
                리더보드 관리자 모드 진입을 위한 암호를 입력하세요.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="password"
                placeholder="관리자 암호"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#0F172A',
                  border: '2px solid #FBBF24',
                  borderRadius: '12px',
                  textAlign: 'center',
                  color: '#FBBF24',
                  fontWeight: 900,
                  fontSize: '18px',
                  letterSpacing: '4px',
                  outline: 'none'
                }}
                autoFocus
                required
              />

              {passwordError && (
                <p style={{ fontSize: '11px', fontWeight: 800, color: '#F87171', margin: 0 }}>{passwordError}</p>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
                    color: '#78350F',
                    fontWeight: 900,
                    fontSize: '13px',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  인증 및 진입
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordPrompt(false)}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#334155',
                    color: '#CBD5E1',
                    fontWeight: 700,
                    fontSize: '13px',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
