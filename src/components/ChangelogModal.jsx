import React, { useEffect } from 'react';
import { CHANGELOG_DATA } from '../data/changelogData';
import { Sparkles, X, History, Calendar, CheckCircle2, Zap } from 'lucide-react';

export default function ChangelogModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getTagBadgeStyle = (tagColor) => {
    switch (tagColor) {
      case 'amber':
        return 'bg-amber-400/15 text-amber-300 border-amber-400/40';
      case 'teal':
        return 'bg-teal-400/15 text-teal-300 border-teal-400/40';
      case 'emerald':
        return 'bg-emerald-400/15 text-emerald-300 border-emerald-400/40';
      case 'purple':
        return 'bg-purple-400/15 text-purple-300 border-purple-400/40';
      case 'rose':
        return 'bg-rose-400/15 text-rose-300 border-rose-400/40';
      case 'blue':
      default:
        return 'bg-sky-400/15 text-sky-300 border-sky-400/40';
    }
  };

  return (
    <div className="changelog-overlay" onClick={onClose}>
      <div
        className="changelog-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="changelog-close-btn"
          title="업데이트 내역 닫기"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="changelog-header">
          <div className="flex items-center justify-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 text-slate-950 font-black">
              <History className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  포털 업데이트 내역
                </h2>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/50 text-[10px] font-black px-2 py-0.5 rounded-full">
                  Release Notes
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                도촌초등학교 게임 포털의 개발 및 개선 히스토리
              </p>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Timeline Body */}
        <div className="changelog-body">
          {CHANGELOG_DATA.map((entry, idx) => (
            <div key={entry.version || idx} className="changelog-entry">
              {/* Date & Version Header Row */}
              <div className="changelog-entry-header">
                <div className="flex items-center gap-2">
                  <div className="changelog-date-badge">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>{entry.date}</span>
                  </div>
                  <span className="changelog-version-tag">
                    {entry.version}
                  </span>
                </div>

                {entry.badge && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    entry.badge === 'LATEST'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 animate-pulse'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {entry.badge}
                  </span>
                )}
              </div>

              {/* Title / Summary */}
              <h3 className="changelog-entry-title">
                {entry.title}
              </h3>

              {/* Bullet Item List */}
              <ul className="changelog-item-list">
                {entry.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="changelog-item">
                    <span className={`changelog-item-tag ${getTagBadgeStyle(item.tagColor)}`}>
                      {item.tag}
                    </span>
                    <span className="changelog-item-text">
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Modal Footer Note */}
        <div className="changelog-footer">
          <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300/80 font-bold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>도촌초 학생들을 위한 새로운 기능과 게임이 계속 업데이트됩니다!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
