import React from 'react';
import { X, Sparkles, Lightbulb, CheckCircle2, Crown, Zap, ShieldCheck, Heart, Shuffle } from 'lucide-react';

export default function SolitaireHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="solitaire-help-overlay" onClick={onClose}>
      <div className="solitaire-help-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="solitaire-help-header">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-bounce">🃏</span>
            <div>
              <h2 className="solitaire-help-title">도촌 솔리테어 완벽 가이드</h2>
              <p className="solitaire-help-subtitle">초등학생도 1분이면 쉽게 배우는 솔리테어 필승 규칙!</p>
            </div>
          </div>
          <button onClick={onClose} className="solitaire-help-close-btn" title="닫기">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content Body */}
        <div className="solitaire-help-body">
          {/* Main Goal Banner */}
          <div className="solitaire-help-banner">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <strong className="text-amber-300 text-sm sm:text-base">게임의 최종 목표!</strong>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              모든 카드를 오른쪽 상단 <strong>4개의 완성칸(파운데이션 ♠♥♦♣)</strong>에 
              <span className="text-amber-300 font-bold ml-1">A(에이스)부터 K(킹)까지 순서대로</span> 모두 모으면 승리합니다! 🎉
            </p>
          </div>

          {/* 4 Golden Rules Cards Grid */}
          <div className="solitaire-rules-grid">
            {/* Rule 1: Alternating Colors */}
            <div className="solitaire-rule-card">
              <div className="solitaire-rule-header">
                <span className="solitaire-rule-badge">규칙 1</span>
                <span className="solitaire-rule-name">🎨 색깔은 번갈아가며!</span>
              </div>
              <p className="solitaire-rule-desc">
                바닥의 카드는 <strong>검정(♠, ♣)</strong>과 <strong>빨강(♥, ♦)</strong>이 번갈아 가며 지그재그로 붙어야 해요.
              </p>
              <div className="solitaire-demo-box">
                <div className="solitaire-mini-card card-black">♠ 8</div>
                <span className="text-emerald-400 font-black text-sm">⬇️ 붙이기</span>
                <div className="solitaire-mini-card card-red">♥ 7</div>
              </div>
            </div>

            {/* Rule 2: Descending Order */}
            <div className="solitaire-rule-card">
              <div className="solitaire-rule-header">
                <span className="solitaire-rule-badge">규칙 2</span>
                <span className="solitaire-rule-name">🔢 숫자는 1씩 작아지게!</span>
              </div>
              <p className="solitaire-rule-desc">
                위 카드보다 <strong>정확히 1 작은 숫자</strong>의 카드만 아래에 놓을 수 있어요.
              </p>
              <div className="solitaire-demo-sequence">
                <span className="badge-tag">K(13)</span> ➔ 
                <span className="badge-tag">Q(12)</span> ➔ 
                <span className="badge-tag">J(11)</span> ➔ 
                <span className="badge-tag">10…2</span> ➔ 
                <span className="badge-tag">A(1)</span>
              </div>
            </div>

            {/* Rule 3: King on Empty Column */}
            <div className="solitaire-rule-card">
              <div className="solitaire-rule-header">
                <span className="solitaire-rule-badge">규칙 3</span>
                <span className="solitaire-rule-name">👑 빈자리는 오직 K(킹)만!</span>
              </div>
              <p className="solitaire-rule-desc">
                바닥의 한 줄이 텅 비게 되면, <strong>오직 K(킹) 또는 K로 시작하는 카드 묶음</strong>만 그 빈칸으로 이동할 수 있어요!
              </p>
              <div className="solitaire-demo-box">
                <div className="solitaire-mini-card card-empty">빈 자리 [ ]</div>
                <span className="text-amber-400 font-black text-sm">➔ K만 이동 가능!</span>
                <div className="solitaire-mini-card card-gold">👑 K</div>
              </div>
            </div>

            {/* Rule 4: Foundation Pile */}
            <div className="solitaire-rule-card">
              <div className="solitaire-rule-header">
                <span className="solitaire-rule-badge">규칙 4</span>
                <span className="solitaire-rule-name">🌟 A는 바로 완성칸으로!</span>
              </div>
              <p className="solitaire-rule-desc">
                <strong>A(에이스)</strong>가 나타나면 무조건 위쪽 완성칸으로 올려주세요. 그 위에 <strong>2 ➔ 3 ➔ … ➔ K</strong> 순서대로 차곡차곡 쌓아요!
              </p>
              <div className="solitaire-demo-sequence">
                <span className="badge-tag text-amber-300 font-black">A(시작)</span> ➔ 
                <span className="badge-tag">2</span> ➔ 
                <span className="badge-tag">3</span> ➔ 
                <span className="badge-tag">…</span> ➔ 
                <span className="badge-tag text-emerald-300 font-black">K(완성)</span>
              </div>
            </div>
          </div>

          {/* Special Tips for Kids */}
          <div className="solitaire-tips-panel">
            <h4 className="solitaire-tips-title flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>선생님이 알려주는 초특급 꿀팁 3가지!</span>
            </h4>
            <ul className="solitaire-tips-list">
              <li>
                <strong>⚡ 원클릭 스마트 자동 이동 (Tap-to-Move)</strong>: 카드를 마우스로 <strong>클릭만 해도</strong> 가장 좋은 위치로 자동으로 쏙 날아가요!
              </li>
              <li>
                <strong>💡 스마트 힌트</strong>: 다음 수를 모를 땐 <strong>[힌트] 버튼</strong>을 눌러보세요. 어디로 옮겨야 할지 반짝임과 친절한 말풍선으로 코칭해 줍니다!
              </li>
              <li>
                <strong>↩️ 무제한 실행 취소</strong>: 잘못 옮겼어도 걱정 NO! <strong>[되돌리기]</strong>를 누르면 얼마든지 실수 전으로 돌아갈 수 있어요.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="solitaire-help-footer">
          <button onClick={onClose} className="solitaire-help-start-btn">
            <CheckCircle2 className="w-5 h-5 text-emerald-950 fill-emerald-400" />
            <span>이해했어요! 신나게 게임 시작하기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
