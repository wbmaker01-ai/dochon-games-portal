import React, { useState, useEffect } from 'react';
import { getLeaderboardFromDB, updateScoreInDB, deleteScoreFromDB } from '../utils/leaderboardApi';
import { Trophy, X, Crown, Medal, Zap, RefreshCw, Sparkles, Star, Heart, Lock, Edit2, Trash2, Check, LogOut, ShieldAlert } from 'lucide-react';

// Precomputed SHA-256 Hash of Password '8582'
const ADMIN_PASSWORD_HASH = 'd7a8581e28fa0313f8c85351a99d45e546170d740c2688849b29c9103e65ebcf';

async function sha256(message) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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

  // Secret Hidden Button Trigger on Trophy Icon
  const handleTrophyClick = () => {
    if (isAdminMode) return;
    setPasswordInput('');
    setPasswordError('');
    setShowPasswordPrompt(true);
  };

  // Verify Admin Password Hash
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const inputHash = await sha256(passwordInput.trim());
    if (inputHash === ADMIN_PASSWORD_HASH) {
      setIsAdminMode(true);
      setShowPasswordPrompt(false);
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError('❌ 암호가 올바르지 않습니다. (비밀번호 힌트: 4자리)');
    }
  };

  // Admin Edit Handler
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

  const saveEditing = async (id) => {
    if (!editName.trim() || isNaN(editScore)) return;
    await updateScoreInDB(currentTab, id, editName, editScore);
    setEditingId(null);
    await loadScores();
  };

  // Admin Delete Handler
  const handleDelete = async (id, name) => {
    if (window.confirm(`[관리자 경고] '${name}' 학생의 기록을 정말 삭제하시겠습니까?\n삭제된 데이터는 Cloud DB에서 영구 삭제됩니다.`)) {
      await deleteScoreFromDB(currentTab, id);
      await loadScores();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="leaderboard-overlay">
      {/* Colorful 3D Candy Pop Container Box */}
      <div className="leaderboard-modal-box">
        
        {/* Vibrant Red Close Button (Top-Right) */}
        <button
          onClick={onClose}
          className="leaderboard-close-btn"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Playful Header with Hidden Secret Admin Trophy Button */}
        <div className="flex flex-col items-center justify-center text-center gap-1.5 pt-1">
          <div className="flex items-center justify-center gap-2">
            {/* Hidden Secret Trigger Button */}
            <button
              onClick={handleTrophyClick}
              className="p-2 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-2xl shadow-lg border-2 border-white rotate-3 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
              title="도촌 관리자 전용 비밀 버튼"
            >
              <Trophy className="w-7 h-7 text-amber-950 fill-amber-900" />
            </button>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white drop-shadow-md">
              도촌초등학교 <span className="text-amber-300">명예의 전당</span>
            </h2>
            <Sparkles className="w-6 h-6 text-yellow-300 animate-bounce" />
          </div>

          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="bg-pink-500/30 text-pink-200 border border-pink-400/50 px-2.5 py-0.5 rounded-full text-[11px] font-black flex items-center gap-1 shadow-sm">
              <Heart className="w-3 h-3 text-pink-400 fill-pink-400" /> 도촌어린이 랭킹
            </span>
            <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/50 px-2.5 py-0.5 rounded-full text-[11px] font-black flex items-center gap-1 shadow-sm">
              <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" /> 실시간 클라우드 DB
            </span>
          </div>

          {/* Admin Mode Badge Header */}
          {isAdminMode && (
            <div className="mt-2 w-full bg-gradient-to-r from-red-600/90 to-rose-600/90 border-2 border-red-400 text-white px-4 py-1.5 rounded-2xl text-xs font-black flex items-center justify-between shadow-lg animate-pulse">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-yellow-300" />
                🔐 관리자 모드 (수정 및 삭제 권한 활성화됨)
              </span>
              <button
                onClick={() => setIsAdminMode(false)}
                className="bg-black/40 hover:bg-black/60 px-2.5 py-1 rounded-xl text-[10px] text-white flex items-center gap-1 transition"
              >
                <LogOut className="w-3 h-3" /> 로그아웃
              </button>
            </div>
          )}
        </div>

        {/* Colorful Game Tab Switcher */}
        <div className="flex items-center justify-center gap-2.5 bg-slate-900/80 p-2 rounded-2xl border-2 border-slate-700/80 w-full shadow-inner">
          <button
            onClick={() => setCurrentTab('pacman')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs md:text-sm font-black transition-all flex items-center justify-center gap-2 shadow-md ${
              currentTab === 'pacman'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 scale-105 border-2 border-white'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <span className="text-base">🟡</span>
            <span>도촌 팩맨</span>
          </button>

          <button
            onClick={() => setCurrentTab('dino')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs md:text-sm font-black transition-all flex items-center justify-center gap-2 shadow-md ${
              currentTab === 'dino'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-emerald-950 scale-105 border-2 border-white'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <span className="text-base">🦖</span>
            <span>도촌 공룡</span>
          </button>
        </div>

        {/* Leaderboard Score List with Admin Edit & Delete Controls */}
        <div className="flex flex-col gap-2.5 max-h-[300px] md:max-h-[340px] overflow-y-auto pr-1">
          {loading && scores.length === 0 ? (
            <div className="py-8 text-center text-amber-300 text-xs font-bold flex items-center justify-center gap-2 bg-slate-900/50 rounded-2xl border border-slate-700">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>클라우드 백엔드 DB에서 랭킹을 불러오는 중...</span>
            </div>
          ) : scores.length === 0 ? (
            <div className="py-8 text-center text-slate-300 text-xs font-bold bg-slate-900/50 rounded-2xl border border-slate-700">
              아직 등록된 랭킹 기록이 없습니다.<br />첫 번째 랭커에 도전해보세요! 🚀
            </div>
          ) : (
            scores.map((item, idx) => {
              const rank = idx + 1;
              let rankBadge = null;
              let rowClass = 'rank-other';
              let nameColor = 'text-white';
              let scoreColor = 'text-amber-300';

              if (rank === 1) {
                rowClass = 'rank-1';
                nameColor = 'text-amber-950 font-black';
                scoreColor = 'text-amber-900 font-black';
                rankBadge = (
                  <div className="flex items-center gap-1 bg-amber-500 text-white px-2 py-0.5 rounded-full text-xs font-black shadow-md border border-white shrink-0">
                    <Crown className="w-4 h-4 text-yellow-200 fill-yellow-200" /> 1등
                  </div>
                );
              } else if (rank === 2) {
                rowClass = 'rank-2';
                nameColor = 'text-sky-950 font-black';
                scoreColor = 'text-sky-900 font-black';
                rankBadge = (
                  <div className="flex items-center gap-1 bg-sky-500 text-white px-2 py-0.5 rounded-full text-xs font-black shadow-md border border-white shrink-0">
                    <Medal className="w-4 h-4 text-sky-100" /> 2등
                  </div>
                );
              } else if (rank === 3) {
                rowClass = 'rank-3';
                nameColor = 'text-rose-950 font-black';
                scoreColor = 'text-rose-900 font-black';
                rankBadge = (
                  <div className="flex items-center gap-1 bg-rose-500 text-white px-2 py-0.5 rounded-full text-xs font-black shadow-md border border-white shrink-0">
                    <Medal className="w-4 h-4 text-rose-100" /> 3등
                  </div>
                );
              } else {
                rankBadge = (
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-extrabold border border-slate-600 shrink-0">
                    {rank}
                  </div>
                );
              }

              const isEditingThis = editingId === item.id;

              return (
                <div
                  key={item.id || idx}
                  className={`leaderboard-score-row ${rowClass} relative`}
                >
                  {isEditingThis ? (
                    /* Inline Admin Edit Form */
                    <div className="flex flex-col gap-2 w-full p-2 bg-slate-900 rounded-xl border-2 border-amber-400 text-white">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                        <span>✏️ 기록 수정하기</span>
                        <span className="text-[10px] text-slate-400">ID: {item.id}</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                          placeholder="학생 이름/반"
                        />
                        <input
                          type="number"
                          value={editScore}
                          onChange={(e) => setEditScore(e.target.value)}
                          className="w-24 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400 text-right"
                          placeholder="점수"
                        />
                      </div>
                      <div className="flex justify-end gap-2 mt-1">
                        <button
                          onClick={() => saveEditing(item.id)}
                          className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-black flex items-center gap-1 shadow"
                        >
                          <Check className="w-3.5 h-3.5" /> 저장
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-bold"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Normal Display Row with Optional Admin Buttons */
                    <>
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {rankBadge}
                        <div className="flex flex-col text-left truncate">
                          <span className={`text-sm md:text-base font-black truncate ${nameColor}`}>
                            {item.name}
                          </span>
                          <span className={`text-[10px] ${rank <= 3 ? 'opacity-80 font-bold' : 'text-slate-400'}`}>
                            {item.date || '2026-08-13'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-xl border border-white/20">
                          <Zap className={`w-4 h-4 ${rank <= 3 ? scoreColor : 'text-amber-400'}`} />
                          <span className={`text-base md:text-lg font-black ${scoreColor}`}>
                            {item.score.toLocaleString()} <span className="text-[11px] font-bold opacity-80">점</span>
                          </span>
                        </div>

                        {/* Admin Operation Action Buttons */}
                        {isAdminMode && (
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              onClick={() => startEditing(item)}
                              className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shadow-md"
                              title="수정"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.name)}
                              className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition shadow-md"
                              title="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

        {/* Footer Text (Cleaned up, no '닫기' button at bottom) */}
        <div className="pt-2 border-t border-slate-700/80 flex items-center justify-center">
          <span className="text-xs font-extrabold text-amber-200 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> 도촌초등학교 게임 명예의 전당
          </span>
        </div>
      </div>

      {/* Secret Password Prompt Overlay Modal */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 z-[100000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1C1F24] border-4 border-amber-400 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-amber-400/20 text-amber-400 rounded-2xl border border-amber-400/50">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-white">🔐 관리자 암호 인증</h3>
              <p className="text-xs text-slate-300">
                리더보드 관리자 모드 진입을 위한 암호를 입력하세요.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
              <input
                type="password"
                placeholder="관리자 암호 (4자리)"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-2xl text-center text-white font-black text-lg focus:outline-none focus:border-amber-400 tracking-widest"
                autoFocus
                required
              />

              {passwordError && (
                <p className="text-xs font-bold text-rose-400">{passwordError}</p>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 font-black rounded-xl text-sm shadow-md hover:brightness-110"
                >
                  인증 및 진입
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordPrompt(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-700"
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
