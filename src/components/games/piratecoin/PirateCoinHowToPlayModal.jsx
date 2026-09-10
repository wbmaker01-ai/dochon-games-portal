// Dochon Games Portal - Dochon Pirate Coin Heist How To Play Guide Modal
import React from 'react';
import { X, Shield, Zap, Sparkles, Navigation, Anchor, Skull, Trophy } from 'lucide-react';

export default function PirateCoinHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="pirate-modal-backdrop" onClick={onClose}>
      <div className="pirate-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="pirate-modal-header">
          <div className="pirate-modal-title">
            <span className="text-2xl">🏴‍☠️</span>
            <h2>도촌 해적선 코인 쟁탈전 게임 가이드</h2>
          </div>
          <button className="pirate-modal-close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="pirate-modal-body">
          {/* Section 1: Core Rules */}
          <div className="pirate-guide-section">
            <h3 className="pirate-guide-title">
              <Anchor className="w-4 h-4 text-amber-400" />
              1. 핵심 승리 규칙 (수집 & 입금)
            </h3>
            <div className="pirate-guide-grid">
              <div className="pirate-rule-card">
                <div className="text-2xl mb-1">🏝️</div>
                <div className="font-bold text-amber-300 text-sm">황금 보물섬 코인 수집</div>
                <div className="text-xs text-slate-300 mt-1 leading-relaxed">
                  중앙 보물섬과 바다에 쏟아지는 <strong>금화(+10점)</strong>와 <strong>보물상자(+50점)</strong>를 획득하여 배 뒤에 주렁주렁 매달아 보세요.
                </div>
              </div>
              <div className="pirate-rule-card">
                <div className="text-2xl mb-1">⚓</div>
                <div className="font-bold text-emerald-400 text-sm">해적선 선착장 입금</div>
                <div className="text-xs text-slate-300 mt-1 leading-relaxed">
                  소지한 코인은 <strong>자신의 팀 선착장</strong> 안으로 들어가야 영구 점수(Bank)로 안전하게 입금되어 털리지 않습니다!
                </div>
              </div>
              <div className="pirate-rule-card">
                <div className="text-2xl mb-1">⚖️</div>
                <div className="font-bold text-sky-300 text-sm">무게 리스크 & 리턴</div>
                <div className="text-xs text-slate-300 mt-1 leading-relaxed">
                  코인을 많이 달고 있을수록 배가 무거워져 <strong>속도가 최대 30% 감속</strong>됩니다. 적당할 때 입금하세요!
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Ramming & Heist */}
          <div className="pirate-guide-section">
            <h3 className="pirate-guide-title">
              <Skull className="w-4 h-4 text-red-400" />
              2. 들이받기 & 코인 털기 (충돌 배틀)
            </h3>
            <div className="pirate-guide-box bg-red-950/40 border border-red-800/40 p-3 rounded-xl text-xs text-slate-200 leading-relaxed">
              코인을 잔뜩 매달고 가는 상대 해적선을 <strong>최고 속도로 들이받으면</strong> 상대가 들고 있던 코인의 <strong>약 45%가 바닥에 와르르 튕겨져 나옵니다!</strong> 튕겨져 나온 코인을 재빨리 가로채 내 배에 싣고 달아나세요!
            </div>
          </div>

          {/* Section 3: 4 Pirate Battle Items */}
          <div className="pirate-guide-section">
            <h3 className="pirate-guide-title">
              <Zap className="w-4 h-4 text-cyan-400" />
              3. 해적 배틀 아이템 4종
            </h3>
            <div className="pirate-items-grid">
              <div className="pirate-item-pill">
                <span className="text-xl">💣</span>
                <div>
                  <span className="font-bold text-red-400 text-xs">해적 대포알:</span>
                  <p className="text-[11px] text-slate-300">전방 직선 발사. 직격 시 상대 1.5초 스턴 및 코인 3개 강제 드롭</p>
                </div>
              </div>
              <div className="pirate-item-pill">
                <span className="text-xl">💨</span>
                <div>
                  <span className="font-bold text-cyan-400 text-xs">순풍 부스터:</span>
                  <p className="text-[11px] text-slate-300">2.5초간 1.7배 가속. 신속 도주 또는 강력한 충돌 들이받기 시전</p>
                </div>
              </div>
              <div className="pirate-item-pill">
                <span className="text-xl">🧲</span>
                <div>
                  <span className="font-bold text-amber-400 text-xs">황금 자석:</span>
                  <p className="text-[11px] text-slate-300">3.5초간 주변 350px 반경 내의 모든 금화를 자동으로 끌어당김</p>
                </div>
              </div>
              <div className="pirate-item-pill">
                <span className="text-xl">🛡️</span>
                <div>
                  <span className="font-bold text-purple-400 text-xs">크라켄 방패:</span>
                  <p className="text-[11px] text-slate-300">5초간 1회의 대포알 또는 적 들이받기 공격을 완벽히 방어</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Controls */}
          <div className="pirate-guide-section">
            <h3 className="pirate-guide-title">
              <Navigation className="w-4 h-4 text-yellow-400" />
              4. 조작 방법
            </h3>
            <div className="pirate-controls-table">
              <div className="pirate-ctrl-row">
                <span className="pirate-key-badge">W / ↑</span>
                <span className="text-xs text-slate-300">돛 올리기 & 전진 가속</span>
              </div>
              <div className="pirate-ctrl-row">
                <span className="pirate-key-badge">S / ↓</span>
                <span className="text-xs text-slate-300">닻 내리기 / 후진 감속</span>
              </div>
              <div className="pirate-ctrl-row">
                <span className="pirate-key-badge">A / D 또는 ← / →</span>
                <span className="text-xs text-slate-300">좌우 방향타 회전</span>
              </div>
              <div className="pirate-ctrl-row">
                <span className="pirate-key-badge">Space / E / Shift</span>
                <span className="text-xs text-slate-300">보유 아이템 사용 (대포 발사, 부스터 등)</span>
              </div>
              <div className="pirate-ctrl-row">
                <span className="pirate-key-badge">모바일/태블릿</span>
                <span className="text-xs text-slate-300">화면 하단 좌측 가상 방향키 + 우측 가속/감속/아이템 버튼</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pirate-modal-footer">
          <button className="pirate-confirm-btn" onClick={onClose}>
            확인했습니다! 바다로 출항하기 ⚓
          </button>
        </div>
      </div>
    </div>
  );
}
