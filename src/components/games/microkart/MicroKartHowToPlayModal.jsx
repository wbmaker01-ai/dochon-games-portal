// Dochon Games Portal - Micro Kart How to Play Guide Modal
import React from 'react';
import { X, Trophy, Zap, Shield, HelpCircle, Gamepad2, Smartphone, Flag } from 'lucide-react';

export default function MicroKartHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="microkart-overlay">
      <div className="microkart-card" style={{ maxWidth: '580px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>🏎️</span>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#F59E0B' }}>
              도촌 마이크로 카트 레이싱 가이드
            </h2>
          </div>
          <button
            onClick={onClose}
            className="microkart-icon-btn"
            title="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* Story & Overview */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', color: '#CBD5E1', lineHeight: '1.5' }}>
          🏫 <strong>도촌초등학교 교실 책상 서킷에 오신 것을 환영합니다!</strong><br />
          지우개, 연필, 삼각자로 만들어진 아기자기한 트랙을 <strong>총 3바퀴(3 Laps)</strong> 먼저 완주하여 챔피언에 등극하세요!
        </div>

        {/* Controls Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38BDF8', fontWeight: 800, fontSize: '0.9rem' }}>
            <Gamepad2 size={16} />
            <span>조작 방법 (PC 키보드 & 모바일 터치)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.82rem' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '8px', borderRadius: '8px' }}>
              <strong>전진 가속 / 후진:</strong><br />
              ⬆️ / ⬇️ 또는 <code>W</code> / <code>S</code>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '8px', borderRadius: '8px' }}>
              <strong>좌 / 우 핸들링:</strong><br />
              ⬅️ / ➡️ 또는 <code>A</code> / <code>D</code>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '8px', borderRadius: '8px' }}>
              <strong>드리프트 (미니 터보 충전):</strong><br />
              <code>Space</code> 또는 <code>Shift</code> 길게 누르기
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '8px', borderRadius: '8px' }}>
              <strong>아이템 사용:</strong><br />
              <code>Ctrl</code> 또는 <code>E</code> 키 (또는 슬롯 터치)
            </div>
          </div>
        </div>

        {/* Mini Turbo Tip */}
        <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '10px', borderRadius: '10px', fontSize: '0.82rem', color: '#FDE047' }}>
          💡 <strong>드리프트 미니 터보 팁:</strong> 코너를 돌 때 드리프트를 유지하면 바퀴 뒤에서 파란 스파크(1단계) ➔ 빨간 스파크(2단계)가 튑니다. 키를 놓는 순간 폭발적인 가속 부스터가 발동합니다!
        </div>

        {/* 5 Items Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontWeight: 800, fontSize: '0.9rem' }}>
            <Zap size={16} />
            <span>학용품 & 배틀 아이템 5종</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🍌</span>
              <span><strong>바나나 껍질:</strong> 뒤에 설치합니다. 밟은 카트는 360도 스핀하며 멈춥니다.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>💧</span>
              <span><strong>조준 물풍선:</strong> 앞선 상대를 추적하여 날아가며, 물방울에 가두어 정지시킵니다.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🚀</span>
              <span><strong>로켓 연필:</strong> 전방으로 직선 탄도를 고속 발사하여 충돌 시 폭발 넉백을 입힙니다.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>💨</span>
              <span><strong>슈퍼 부스터:</strong> 2초간 최고 속도 145%로 급가속합니다.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🛡️</span>
              <span><strong>자석 실드:</strong> 5초간 적의 아이템 공격을 1회 완벽하게 방어합니다.</span>
            </div>
          </div>
        </div>

        {/* Track Gimmicks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: '#94A3B8' }}>
          <div>🟠 <strong>오렌지 화살표 패드:</strong> 밟으면 즉시 슈퍼 가속 부스터를 얻습니다.</div>
          <div>🎨 <strong>물감 웅덩이:</strong> 밟으면 끈적한 물감에 의해 일시적으로 속도가 느려집니다.</div>
          <div>🧱 <strong>분홍/흰색 지우개:</strong> 부딪히면 튕겨 나가는 탄성 반사벽입니다.</div>
        </div>

        <button
          onClick={onClose}
          className="microkart-btn-primary"
          style={{ marginTop: '4px' }}
        >
          확인하고 레이스 시작! 🏁
        </button>
      </div>
    </div>
  );
}
