import React, { useState, useEffect } from 'react';
import { getLeaderboardFromDB, updateScoreInDB, deleteScoreFromDB } from '../utils/leaderboardApi';
import { Trophy, X, Crown, Medal, Zap, RefreshCw, Sparkles, Star, Heart, Lock, Edit2, Trash2, Check, LogOut, ShieldAlert } from 'lucide-react';

// Obfuscated Base64 hash for password '8582'
const ENCODED_PASS = 'ODU4Mg=='; // btoa('8582')

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

  // Secret Hidden Button Trigger on Trophy Icon (No button card styling, looks seamless)
  const handleTrophyClick = () => {
    if (isAdminMode) return;
    setPasswordInput('');
    setPasswordError('');
    setShowPasswordPrompt(true);
  };

  // Verify Admin Password
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const cleanInput = String(passwordInput).trim();
    if (cleanInput === '8582' || btoa(cleanInput) === ENCODED_PASS) {
      setIsAdminMode(true);
      setShowPasswordPrompt(false);
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError('❌ 암호가 올바르지 않습니다. (비밀번호: 4자리)');
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
        
        {/* Vibrant Red Close Button (Top-Right Only, No Bottom Button) */}
        <button
          onClick={onClose}
          className="leaderboard-close-btn"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Seamless Hidden Trophy Secret Button */}
        <div className="flex flex-col items-center justify-center text-center gap-1.5 pt-1">
          <div className="flex items-center justify-center gap-2">
            
            {/* 🏆 Seamless Secret Hidden Trophy Icon (Pastel Circle Background) */}
            <div
              onClick={handleTrophyClick}
              className="w-10 h-10 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/40 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform shrink-0"
              title="도촌초등학교 명예의 전당"
            >
              <Trophy className="w-6 h-6 text-amber-400 fill-amber-400/40" />
            </div>

            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white drop-shadow-md">
              도촌초등학교 <span className="text-amber-300">명예의 전당</span>
            </h2>

            {/* Sparkles Icon inside Pastel Yellow Circle */}
            <div className="w-7 h-7 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 flex items-center justify-center shrink-0 animate-pulse">
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs">
            {/* Heart Icon inside Pastel Pink Circle */}
            <span className="bg-pink-500/20 text-pink-200 border border-pink-400/40 px-2.5 py-1 rounded-full text-[11px] font-black flex items-center gap-1.5 shadow-sm">
              <div className="w-4 h-4 rounded-full bg-pink-500/40 flex items-center justify-center shrink-0">
                <Heart className="w-2.5 h-2.5 text-pink-300 fill-pink-300" />
              </div>
              <span>도촌어린이 랭킹</span>
            </span>

            {/* Refresh Icon inside Pastel Emerald Circle */}
            <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 px-2.5 py-1 rounded-full text-[11px] font-black flex items-center gap-1.5 shadow-sm">
              <div className="w-4 h-4 rounded-full bg-emerald-500/40 flex items-center justify-center shrink-0">
                <RefreshCw className="w-2.5 h-2.5 text-emerald-300 animate-spin" />
              </div>
              <span>실시간 클라우드 DB</span>
            </span>
          </div>

          {/* Admin Mode Active Banner */}
          {isAdminMode && (
            <div className="mt-2 w-full bg-gradient-to-r from-red-600/90 to-rose-600/90 border-2 border-red-400 text-white px-4 py-2 rounded-2xl text-xs font-black flex items-center justify-between shadow-lg animate-pulse">
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

        {/* Leaderboard Score List with Pastel Circle Background Icons */}
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
                  <div className="flex items-center gap-1.5 bg-amber-500 text-white px-2.5 py-1 rounded-full text-xs font-black shadow-md border border-white shrink-0">
                    <div className="w-5 h-5 rounded-full bg-yellow-300/40 flex items-center justify-center shrink-0">
                      <Crown className="w-3.5 h-3.5 text-yellow-200 fill-yellow-200" />
                    </div>
                    <span>1등</span>
                  </div>
                );
              } else if (rank === 2) {
                rowClass = 'rank-2';
                nameColor = 'text-sky-950 font-black';
                scoreColor = 'text-sky-900 font-black';
                rankBadge = (
                  <div className="flex items-center gap-1.5 bg-sky-500 text-white px-2.5 py-1 rounded-full text-xs font-black shadow-md border border-white shrink-0">
                    <div className="w-5 h-5 rounded-full bg-sky-200/40 flex items-center justify-center shrink-0">
                      <Medal className="w-3.5 h-3.5 text-sky-100" />
                    </div>
                    <span>2등</span>
                  </div>
                );
              } else if (rank === 3) {
                rowClass = 'rank-3';
                nameColor = 'text-rose-950 font-black';
                scoreColor = 'text-rose-900 font-black';
                rankBadge = (
                  <div className="flex items-center gap-1.5 bg-rose-500 text-white px-2.5 py-1 rounded-full text-xs font-black shadow-md border border-white shrink-0">
                    <div className="w-5 h-5 rounded-full bg-rose-200/40 flex items-center justify-center shrink-0">
                      <Medal className="w-3.5 h-3.5 text-rose-100" />
                    </div>
                    <span>3등</span>
                  </div>
                );
              } else {
                rankBadge = (
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-extrabold border border-slate-600 shrink-0">
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
                        <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-xl border border-white/20">
                          {/* Score Zap Icon inside Pastel Circle */}
                          <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0">
                            <Zap className={`w-3.5 h-3.5 ${rank <= 3 ? scoreColor : 'text-amber-400'}`} />
                          </div>
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

        {/* Footer Text (Cleaned up, no bottom close button) */}
        <div className="pt-2 border-t border-slate-700/80 flex items-center justify-center">
          <span className="text-xs font-extrabold text-amber-200 flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-yellow-400/20 flex items-center justify-center shrink-0">
              <Star className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
            </div>
            <span>도촌초등학교 게임 명예의 전당</span>
          </span>
        </div>
      </div>

      {/* Secret Password Prompt Overlay Modal */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 z-[100000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1E1B4B] border-4 border-[#FFD166] rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/50 flex items-center justify-center shadow-lg">
                <Lock className="w-6 h-6 text-amber-300" />
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
                className="px-4 py-3 bg-slate-900 border-2 border-amber-400/60 rounded-2xl text-center text-amber-300 font-black text-xl focus:outline-none focus:border-amber-400 tracking-widest"
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
