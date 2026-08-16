import React from 'react';
import { X, Shield, Heart, Zap, Sparkles, Flame, Trophy, Award } from 'lucide-react';
import { PLAYER_CLASSES } from './popcornConstants';

export default function PopcornHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-amber-400/60 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col text-slate-100 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍿</span>
            <div>
              <h2 className="text-xl font-black text-amber-400 tracking-tight">
                도촌 팝콘 서바이벌 게임 방법
              </h2>
              <p className="text-xs text-slate-400">
                달궈진 프라이팬 위에서 끝까지 튀겨지지 말고 생존하세요!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4 custom-scrollbar text-sm">
          
          {/* 1. Core Goal */}
          <section className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <h3 className="font-extrabold text-amber-300 flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              1. 게임 목표 & 기본 규칙
            </h3>
            <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
              플레이어는 뜨거운 프라이팬 위의 <strong>옥수수 알갱이</strong>입니다. 
              보스가 쏘는 불꽃과 녹아내리는 버터 폭탄, 바닥의 열기를 피해 끝까지 생존하세요. 
              체력이 모두 소진되면 <strong>하얗게 튀겨진 팝콘</strong>이 되며 게임이 종료됩니다!
            </p>
          </section>

          {/* 2. Character Classes */}
          <section className="space-y-3">
            <h3 className="font-extrabold text-amber-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              2. 옥수수 캐릭터 클래스 및 특수 능력 (Space 키)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.values(PLAYER_CLASSES).map((cls) => (
                <div
                  key={cls.id}
                  className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 flex flex-col items-center text-center"
                >
                  <img
                    src={cls.avatar}
                    alt={cls.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-amber-400/40 mb-2"
                  />
                  <div className="font-bold text-slate-100 text-sm">{cls.name}</div>
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full my-1"
                    style={{ backgroundColor: `${cls.badgeColor}33`, color: cls.badgeColor }}
                  >
                    {cls.badge}
                  </span>
                  <div className="text-[11px] text-slate-300 mt-1">{cls.skillDesc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Items & Graze Bonus */}
          <section className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-2">
            <h3 className="font-extrabold text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              3. 아이템 & 스침(Graze) 보너스
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg">
                <span className="text-lg">❤️</span>
                <span><strong>하트:</strong> 잃어버린 체력 1 회복</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg">
                <span className="text-lg">💎</span>
                <span><strong>소금 크리스털:</strong> +300점 보너스 점수</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg">
                <span className="text-lg">❄️</span>
                <span><strong>얼음:</strong> 4초간 탄막 속도 50% 둔화</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              💡 <strong>스침(Graze) 시스템:</strong> 탄막에 아슬아슬하게 스쳐 지나갈 때마다 추가 점수(+30점)를 획득합니다!
            </p>
          </section>

          {/* 4. Controls */}
          <section className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <h3 className="font-extrabold text-amber-300 flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              4. 조작 방법
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/80 p-2.5 rounded-lg">
                <div className="text-amber-400 font-bold mb-1">💻 키보드 조작</div>
                <div>• 이동: <strong>방향키 (↑, ↓, ←, →)</strong> 또는 <strong>W, A, S, D</strong></div>
                <div>• 특수 스킬: <strong>Spacebar</strong></div>
                <div>• 일시정지: <strong>ESC</strong> / <strong>P</strong></div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg">
                <div className="text-amber-400 font-bold mb-1">📱 모바일 / 태블릿</div>
                <div>• 좌측 하단 <strong>방향키 버튼</strong>으로 자유 이동</div>
                <div>• 우측 하단 <strong>스킬 원형 버튼</strong> 터치</div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-700/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition"
          >
            확인 및 게임 시작
          </button>
        </div>

      </div>
    </div>
  );
}
