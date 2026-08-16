import React from 'react';
import { X, Sparkles, Trophy, Lightbulb, Shield, Flag, MousePointer, HelpCircle, CheckCircle, Zap } from 'lucide-react';

export default function MinesweeperHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1E293B',
          border: '2px solid #F59E0B',
          borderRadius: '20px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          position: 'relative',
          color: '#F8FAFC'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '20px' }}>💣</span>
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#FBBF24', margin: 0 }}>
                도촌 지뢰찾기 완벽 가이드
              </h2>
              <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>
                초등학생을 위한 1분 쉬운 룰 설명서 🌿
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(51, 65, 85, 0.8)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94A3B8',
              cursor: 'pointer'
            }}
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Core Rules Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Rule 1: Safe First Click */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '14px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '18px' }}>🌱</span>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#34D399', margin: 0 }}>
                1. 첫 클릭 100% 안전 보장!
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: '1.5', margin: 0 }}>
              처음 누르는 잔디밭은 <strong>절대로 지뢰가 나오지 않아요!</strong> 넓은 공간이 시원하게 열리며 게임이 시작되니 안심하고 아무 곳이나 콕 눌러보세요.
            </p>
          </div>

          {/* Rule 2: Numbers Meaning */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '14px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '18px' }}>🔢</span>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#38BDF8', margin: 0 }}>
                2. 숫자의 비밀 (주변 8칸 지뢰 개수)
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: '1.5', margin: 0 }}>
              파낸 흙에 적힌 숫자는 <strong>그 칸을 둘러싼 주변 8칸 안에 숨은 지뢰 개수</strong>를 뜻해요!<br />
              예: <span style={{ color: '#1976D2', fontWeight: 900 }}>[1]</span> 주변 8칸 중 지뢰는 딱 1개!
            </p>
          </div>

          {/* Rule 3: Flags & Chording */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(248, 113, 113, 0.3)', borderRadius: '14px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '18px' }}>🚩</span>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#F87171', margin: 0 }}>
                3. 깃발 꽂기 & 번개 동시 오픈 (Chording)
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: '1.5', margin: 0 }}>
              • <strong>PC:</strong> 마우스 우클릭으로 깃발(🚩)을 꽂아요.<br />
              • <strong>모바일/태블릿:</strong> 상단 [🚩 깃발 모드] 버튼을 누르거나 길게 터치해요.<br />
              • <strong>번개 오픈:</strong> 숫자 주변에 깃발을 다 꽂았다면, 그 숫자를 클릭해 나머지 안전한 칸들을 한 번에 파헤치세요!
            </p>
          </div>

          {/* Rule 4: Shield & Smart Hint */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '14px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '18px' }}>🛡️</span>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#FBBF24', margin: 0 }}>
                4. 안심 보호막(1회 실수 구원) & 💡 힌트 찬스
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: '1.5', margin: 0 }}>
              • 실수로 지뢰를 밟아도 <strong>🛡️ 안심 보호막이 1회 지뢰를 자동으로 깃발로 해체</strong>해줘요.<br />
              • 어디를 눌러야 할지 막힐 땐 상단 <strong>[💡 힌트]</strong> 버튼을 누르면 100% 확실한 칸을 찾아 반짝여줍니다!
            </p>
          </div>

        </div>

        {/* Footer Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '14px',
            fontWeight: 900,
            cursor: 'pointer',
            marginTop: '18px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
          }}
        >
          이해했어요! 게임 시작하기 🚀
        </button>
      </div>
    </div>
  );
}
