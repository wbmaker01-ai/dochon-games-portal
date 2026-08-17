import React, { useEffect } from 'react';
import { 
  HelpCircle, 
  X, 
  Smartphone, 
  Trophy, 
  Gamepad2, 
  Sparkles, 
  Volume2, 
  RotateCcw, 
  CheckCircle2, 
  Monitor, 
  Lightbulb, 
  ShieldCheck 
} from 'lucide-react';

export default function GuideModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="changelog-overlay" onClick={onClose}>
      <div
        className="guide-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="changelog-close-btn"
          title="이용안내 닫기"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="changelog-header">
          <div className="flex items-center justify-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 via-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 text-slate-950 font-black shrink-0">
              <HelpCircle className="w-6 h-6 text-slate-950" />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  도촌 게임 포털 이용안내
                </h2>
                <span className="bg-cyan-400/20 text-cyan-300 border border-cyan-400/50 text-[10px] font-black px-2 py-0.5 rounded-full">
                  USER GUIDE
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                더욱 재미있고 쾌적한 게임 플레이를 위한 필수 안내 및 꿀팁
              </p>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="guide-modal-body">
          {/* 🌟 CRITICAL HIGHLIGHT BANNER: Mobile / Tablet Landscape Mode Advice */}
          <div className="guide-highlight-card">
            <div className="guide-highlight-icon-wrap">
              <Smartphone className="w-7 h-7 text-amber-300 animate-bounce" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-md">
                  필독 권장사항
                </span>
                <h3 className="text-sm sm:text-base font-black text-amber-200">
                  📱 핸드폰이나 태블릿으로 이용 시 가로모드를 이용해주세요!
                </h3>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                도촌 게임 포털의 모든 아케이드 게임은 <strong>가로형 디스플레이에 최적화</strong>되어 있습니다.
                스마트폰이나 태블릿(iPad, 갤럭시탭 등)에서 <strong>화면 자동 회전을 켠 후 기기를 가로로 돌려(Landscape Mode)</strong> 플레이하시면 훨씬 더 넓고 시원한 시야와 편리한 조작 버튼으로 쾌적하게 즐기실 수 있습니다!
              </p>
            </div>
          </div>

          {/* Guide Sections Grid */}
          <div className="grid grid-cols-1 gap-3 mt-1">
            {/* Section 1: Leaderboard & Hall of Fame */}
            <div className="guide-section-card">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-amber-300 mb-1 flex items-center gap-1.5">
                    <span>🏆 실시간 도촌 명예의 전당 랭킹 등록</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    게임을 플레이하여 <strong>100점을 초과 달성</strong>하면 게임 종료 시 랭킹 등록 폼이 나타납니다.
                    이름(예: 홍길동 또는 개성 있는 닉네임)을 입력하고 등록 버튼을 누르면 <strong>도촌초 전교 실시간 랭킹</strong>에 바로 기록됩니다!
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Controls for PC & Mobile */}
            <div className="guide-section-card">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-emerald-300 mb-1 flex items-center gap-1.5">
                    <span>🎮 기기별 최적화 조작 지원</span>
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-1 leading-relaxed list-disc list-inside">
                    <li><strong>PC 컴퓨터:</strong> 키보드 방향키(↑ ↓ ← →, W A S D), 스페이스바(Space), 마우스 클릭으로 정밀 조작</li>
                    <li><strong>스마트폰 / 태블릿:</strong> 화면 터치, 스와이프, 과일 합치기/벽돌 격파왕 전용 온스크린 아케이드 버튼 컨트롤러 지원</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 3: Smart Helper Systems */}
            <div className="guide-section-card">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-purple-300 mb-1 flex items-center gap-1.5">
                    <span>💡 막힐 땐 게임별 스마트 도우미 활용</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    게임 중 규칙이 헷갈릴 때는 상단의 <strong>[게임 방법]</strong> 버튼을 언제든 눌러보세요.
                    솔리테어의 <strong>[마법의 셔플]</strong>, 컬러타일의 <strong>[스마트 힌트/재배치]</strong>, 과일 합치기의 <strong>[박스 흔들기]</strong> 등 위기 탈출 도우미가 준비되어 있습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4: Sound & Volume Controls */}
            <div className="guide-section-card">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-sky-300 mb-1 flex items-center gap-1.5">
                    <span>🔊 사운드 및 편의 기능</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    모든 게임은 Web Audio API 기반의 생동감 넘치는 효과음과 콤보음을 지원합니다.
                    조용한 환경(교실, 도서관 등)에서는 게임 상단의 <strong>[소리 ON/OFF]</strong> 버튼으로 간편하게 음소거할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="guide-modal-footer">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>도촌초등학교 학생들을 위한 안전하고 건전한 교육용 비영리 게임 포털입니다.</span>
          </div>
          <button
            onClick={onClose}
            className="guide-confirm-btn"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>이해했어요! 게임 즐기기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
