// Dochon Games Portal - School Tag How To Play Modal
// Rules, Mechanics & Keyboard/Touch Control Guide

import React from 'react';
import { X, Key, ShieldAlert, Footprints, HeartPulse, Eye, DoorOpen } from 'lucide-react';

export default function SchoolTagHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="schooltag-modal-overlay" onClick={onClose}>
      <div
        className="schooltag-card"
        style={{ maxWidth: '520px', textAlign: 'left' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#38bdf8', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔦 게임 방법 & 생존 수칙
          </h2>
          <button
            onClick={onClose}
            className="schooltag-btn-icon"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>
          {/* Rule 1 */}
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#fbbf24', marginBottom: '4px' }}>
              <Key size={18} /> 1. 도망자의 목표: 열쇠 3개 수집 & 탈출
            </div>
            학교 곳곳(교실, 과학실, 음악실 등)에 숨겨진 <strong style={{ color: '#fbbf24' }}>황금 열쇠 3개</strong>를 모두 모은 뒤, 1층 중앙 현관의 <strong style={{ color: '#4ade80' }}>비상구 게이트</strong>로 달려가 3초간 버티면 탈출 성공!
          </div>

          {/* Rule 2 */}
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#f87171', marginBottom: '4px' }}>
              <ShieldAlert size={18} /> 2. 심장 박동 & 발자국 소음 주의
            </div>
            술래가 가까워지면 <strong style={{ color: '#f87171' }}>심장 박동 소리(쿵...쿵...)</strong>가 빨라지고 화면 테두리가 붉게 깜빡입니다. 전력 질주(Shift)를 하면 발자국 파동이 생겨 술래에게 위치가 노출됩니다!
          </div>

          {/* Rule 3 */}
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#c084fc', marginBottom: '4px' }}>
              <DoorOpen size={18} /> 3. 사물함 은신 & 보건실 구출
            </div>
            위험할 땐 복도와 교실의 <strong style={{ color: '#38bdf8' }}>사물함(스페이스바)</strong>에 숨으세요. 술래에게 잡힌 친구는 보건실에 갇히며, 다가가서 구출해줄 수 있습니다.
          </div>

          {/* Controls */}
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
            <div style={{ fontWeight: '700', color: '#e2e8f0', marginBottom: '6px' }}>🎮 조작 키 안내 (손전등 스티어링)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.84rem' }}>
              <div>• <strong>↑ / W</strong>: 전진 (손전등 방향)</div>
              <div>• <strong>↓ / S</strong>: 후진</div>
              <div>• <strong>← / A</strong>: 왼쪽 회전 (시야 회전)</div>
              <div>• <strong>→ / D</strong>: 오른쪽 회전 (시야 회전)</div>
              <div>• <strong>Shift</strong>: 전력 질주 (대시)</div>
              <div>• <strong>Space</strong>: 사물함 숨기 / 열쇠 줍기</div>
              <div style={{ gridColumn: 'span 2', color: '#94a3b8', fontSize: '0.78rem', marginTop: '2px' }}>
                * PC 마우스 이동 시 손전등 자유 조준도 함께 지원됩니다.
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="schooltag-btn-primary"
          style={{ marginTop: '18px' }}
        >
          확인하고 게임 시작하기
        </button>
      </div>
    </div>
  );
}
