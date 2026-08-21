import React from 'react';
import { X, Trophy, Sparkles, Star, Heart, CheckCircle2 } from 'lucide-react';

export default function BubbleTeaHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(8px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#1E1B4B',
        border: '3px solid #F59E0B',
        borderRadius: '24px',
        maxWidth: '520px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        color: '#FFFFFF',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.12)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            color: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '28px' }}>🧋</span>
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#FBBF24', margin: 0 }}>
              도촌 버블티 카페 이용안내
            </h2>
            <span style={{ fontSize: '28px' }}>✨</span>
          </div>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
            구글 두들 명작 Celebrating Bubble Tea 모티브 힐링 타이쿤
          </p>
        </div>

        {/* Section 1: 3-Step Recipe Rules */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          border: '1.5px solid rgba(251, 191, 36, 0.3)',
          borderRadius: '16px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#FDE047', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles className="w-4 h-4 text-amber-400" />
            3단계 버블티 제조 레시피
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ backgroundColor: '#F59E0B', color: '#78350F', fontWeight: 900, padding: '2px 8px', borderRadius: '6px', fontSize: '11px', flexShrink: 0 }}>1단계</span>
              <span><strong>쫀득 타피오카 펄</strong>: 1번 노란색 점선까지 꾹 눌러 채우기</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ backgroundColor: '#38BDF8', color: '#0C4A6E', fontWeight: 900, padding: '2px 8px', borderRadius: '6px', fontSize: '11px', flexShrink: 0 }}>2단계</span>
              <span><strong>달콤 밀크티 베이스</strong>: 2번 하늘색 점선까지 붓기</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ backgroundColor: '#A855F7', color: '#FFFFFF', fontWeight: 900, padding: '2px 8px', borderRadius: '6px', fontSize: '11px', flexShrink: 0 }}>3단계</span>
              <span><strong>진한 시럽 & 토핑</strong>: 3번 보라색 점선까지 딱 맞추기</span>
            </div>
          </div>
        </div>

        {/* Section 2: Controls */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          border: '1.5px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '16px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#38BDF8', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            🎮 간단하고 쉬운 조작법
          </h3>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#CBD5E1', lineHeight: '1.6' }}>
            <li><strong>PC (컴퓨터)</strong>: 캔버스를 마우스로 <strong>클릭 & 홀드</strong>하거나 키보드 <strong>스페이스바(Space)</strong>를 길게 누르고 있으면 재료가 채워집니다. 선에 닿았을 때 손을 떼세요!</li>
            <li><strong>스마트폰 / 태블릿</strong>: 화면이나 하단 <strong>대형 [🧋 꾹 눌러서 재료 넣기] 버튼</strong>을 터치하고 있으면 채워집니다.</li>
          </ul>
        </div>

        {/* Section 3: Scoring & Leaderboard Tips */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          border: '1.5px solid rgba(244, 63, 94, 0.3)',
          borderRadius: '16px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#FDA4AF', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Trophy className="w-4 h-4 text-amber-400" />
            별점 및 명예의 전당 등록 팁
          </h3>
          <div style={{ fontSize: '12px', color: '#E2E8F0', lineHeight: '1.6' }}>
            <div>⭐️ <strong>PERFECT (별 3개)</strong>: 정량선에 완벽히 맞추면 +150점 & 콤보 보너스!</div>
            <div>⭐️ <strong>연속 콤보(COMBO)</strong>: 연속으로 퍼펙트를 달성하면 점수가 배수로 증가합니다.</div>
            <div style={{ color: '#FBBF24', marginTop: '4px', fontWeight: 700 }}>
              🏆 총 6명의 동물 손님을 만족시키고 <strong>100점 초과</strong>를 달성하면 도촌초등학교 명예의 전당에 이름을 올릴 수 있습니다!
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#F59E0B',
            color: '#78350F',
            fontWeight: 900,
            fontSize: '15px',
            border: 'none',
            borderRadius: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
          }}
        >
          확인했어요! 버블티 만들러 가기 🧋
        </button>
      </div>
    </div>
  );
}
