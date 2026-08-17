import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Gamepad2
} from 'lucide-react';
import { haptics } from '../utils/haptics';

export default function RulesNoticeModal({ isOpen, onClose }) {
  const [understoodAgreed, setUnderstoodAgreed] = useState(false);
  const [hideToday, setHideToday] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!understoodAgreed) return;

    haptics.success();

    if (hideToday) {
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      try {
        localStorage.setItem('dochon_rules_hide_today', today);
      } catch (e) {}
    }

    onClose();
  };

  return (
    <div className="changelog-overlay" style={{ zIndex: 9999 }}>
      <div 
        className="rules-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="rules-modal-header">
          <div className="rules-header-icon-wrap">
            <ShieldCheck className="w-6 h-6 text-amber-950" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                도촌초 게임 포털 이용 및 안전 수칙
              </h2>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/50 text-[10px] font-black px-2 py-0.5 rounded-full">
                필수 확인
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium">
              안전하고 즐거운 학교 디지털 쉼터를 만들기 위해 함께 약속해요! 🤝
            </p>
          </div>
        </div>

        {/* Modal Body: Rules List */}
        <div className="rules-modal-body">
          {/* Intro Notice */}
          <div className="rules-intro-card">
            <p className="text-xs text-amber-200/90 leading-relaxed font-semibold">
              🌟 <strong>도촌초 게임 포털</strong>은 학생들이 공부 후 잠시 쉴 때 재미있게 즐길 수 있는 <strong>건전하고 안전한 교육용 미니 게임</strong>을 모아두었습니다.
            </p>
          </div>

          {/* Rule Item 1 */}
          <div className="rules-item-card">
            <div className="rules-item-icon bg-emerald-500/20 border-emerald-500/40 text-emerald-300">
              🏫
            </div>
            <div className="rules-item-content">
              <h4 className="rules-item-title text-emerald-300">
                1. 선생님께 먼저 허락받고 플레이하기
              </h4>
              <p className="rules-item-desc">
                이 게임을 학교에서 할 때는 <strong>선생님께 먼저 허락을 받고</strong>, 정해진 시간과 장소에서만 플레이합니다.
              </p>
            </div>
          </div>

          {/* Rule Item 2 */}
          <div className="rules-item-card">
            <div className="rules-item-icon bg-sky-500/20 border-sky-500/40 text-sky-300">
              🗣️
            </div>
            <div className="rules-item-content">
              <h4 className="rules-item-title text-sky-300">
                2. 바른 말, 고운 말 사용하기
              </h4>
              <p className="rules-item-desc">
                게임을 하면서 <strong>욕설이나 거친 말을 절대 하지 않고</strong>, 언제나 친구를 배려하는 바른 말을 사용합시다.
              </p>
            </div>
          </div>

          {/* Rule Item 3 */}
          <div className="rules-item-card">
            <div className="rules-item-icon bg-pink-500/20 border-pink-500/40 text-pink-300">
              🤝
            </div>
            <div className="rules-item-content">
              <h4 className="rules-item-title text-pink-300">
                3. 싸우지 않고 사이좋게 경쟁하기
              </h4>
              <p className="rules-item-desc">
                점수나 승패 때문에 <strong>친구와 다투거나 싸우지 맙시다.</strong> 친구들과 정정당당하게 즐겁게 경쟁하며 사이좋게 플레이합시다.
              </p>
            </div>
          </div>

          {/* Rule Item 4 */}
          <div className="rules-item-card">
            <div className="rules-item-icon bg-purple-500/20 border-purple-500/40 text-purple-300">
              ⏳
            </div>
            <div className="rules-item-content">
              <h4 className="rules-item-title text-purple-300">
                4. 스스로 정해진 시간만 지키고 종료하기
              </h4>
              <p className="rules-item-desc">
                게임에 지나치게 빠지거나 중독되지 않도록 유의합니다. <strong>정해진 시간(쉬는 시간 등)만 게임을 하고 스스로 종료</strong>합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Agreement Checkboxes Section */}
        <div className="rules-agreement-section">
          {/* Checkbox 1 (Mandatory Agreement) */}
          <label className={`rules-check-label ${understoodAgreed ? 'checked' : ''}`}>
            <input
              type="checkbox"
              checked={understoodAgreed}
              onChange={(e) => {
                haptics.light();
                setUnderstoodAgreed(e.target.checked);
              }}
              className="rules-checkbox"
            />
            <span className="rules-check-text text-amber-300 font-bold">
              위 내용을 모두 이해했으며, 성실히 실천하겠습니다. (필수)
            </span>
          </label>

          {/* Checkbox 2 (Optional: Hide Today) */}
          <label className={`rules-check-label ${hideToday ? 'checked' : ''}`}>
            <input
              type="checkbox"
              checked={hideToday}
              onChange={(e) => {
                haptics.light();
                setHideToday(e.target.checked);
              }}
              className="rules-checkbox"
            />
            <span className="rules-check-text text-slate-300 font-medium">
              오늘 하루는 이 안내 팝업을 다시 보지 않겠습니다.
            </span>
          </label>
        </div>

        {/* Footer Action Button */}
        <div className="rules-modal-footer">
          <button
            onClick={handleConfirm}
            disabled={!understoodAgreed}
            className={`rules-confirm-btn ${understoodAgreed ? 'active' : 'disabled'}`}
          >
            {understoodAgreed ? (
              <>
                <Gamepad2 className="w-5 h-5 fill-current" />
                <span>약속 완료! 게임 포털 시작하기</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>위 수칙 실천에 체크하면 시작할 수 있습니다</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
