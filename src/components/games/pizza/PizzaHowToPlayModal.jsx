import React from 'react';
import { X, Scissors, Award, Sparkles, HelpCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { haptics } from '../../../utils/haptics';

export default function PizzaHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)'
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#0F172A',
          border: '2px solid rgba(245, 158, 11, 0.5)',
          borderRadius: '24px',
          padding: '24px',
          color: '#FFFFFF',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
          maxHeight: '85vh',
          overflowY: 'auto'
        }}
      >
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1E293B', paddingBottom: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '14px', backgroundColor: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
              🍕
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#FBBF24', margin: 0 }}>도촌 피자 마스터 게임 방법</h2>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>분수와 기하학을 배우는 재미있는 피자 커팅 퍼즐!</p>
            </div>
          </div>
          <button
            onClick={() => {
              haptics.light();
              onClose();
            }}
            style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1E293B', color: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px', color: '#F1F5F9' }}>
          
          {/* Rule 1 */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.85)', border: '1.5px solid rgba(245, 158, 11, 0.35)', borderRadius: '18px', padding: '16px', display: 'flex', gap: '14px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.25)', color: '#FCD34D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '16px', flexShrink: 0 }}>
              1
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#FCD34D', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Scissors className="w-4 h-4 text-amber-400" /> 드래그하여 피자 자르기
              </h3>
              <p style={{ fontSize: '13px', color: '#E2E8F0', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                마우스나 손가락으로 피자 위를 <strong style={{ color: '#FDE68A', fontWeight: 800 }}>원하는 지점까지 드래그</strong>하면 피자 커터가 선분 궤적을 따라 정밀하게 잘라냅니다. (중심에서 바깥으로 3번 그으면 3등분 가능!)
              </p>
            </div>
          </div>

          {/* Rule 2 */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.85)', border: '1.5px solid rgba(59, 130, 246, 0.35)', borderRadius: '18px', padding: '16px', display: 'flex', gap: '14px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.25)', color: '#93C5FD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '16px', flexShrink: 0 }}>
              2
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#93C5FD', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HelpCircle className="w-4 h-4 text-blue-400" /> 손님의 분수 주문 조건 맞추기
              </h3>
              <p style={{ fontSize: '13px', color: '#E2E8F0', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                상단 주문서의 조각 수(<span style={{ color: '#FCD34D', fontWeight: 800 }}>1/2, 1/3, 1/4, 1/6, 1/8</span>)와 각 조각에 분배해야 할 <strong style={{ color: '#FDE68A', fontWeight: 800 }}>토핑 종류 및 개수</strong>를 꼼꼼히 확인하세요!
              </p>
            </div>
          </div>

          {/* Rule 3 */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.85)', border: '1.5px solid rgba(16, 185, 129, 0.35)', borderRadius: '18px', padding: '16px', display: 'flex', gap: '14px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.25)', color: '#6EE7B7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '16px', flexShrink: 0 }}>
              3
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#6EE7B7', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award className="w-4 h-4 text-emerald-400" /> 균등한 크기 & 별점 3개 획득
              </h3>
              <p style={{ fontSize: '13px', color: '#E2E8F0', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                피자 조각들의 크기가 서로 똑같이 균일할수록 더 높은 <strong style={{ color: '#A7F3D0', fontWeight: 800 }}>황금 비율 점수</strong>와 3성 별점을 받습니다. 잘못 잘랐을 땐 <strong style={{ color: '#FFFFFF', fontWeight: 800 }}>[컷팅 초기화]</strong> 버튼을 누르세요.
              </p>
            </div>
          </div>

          {/* Rule 4 */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.85)', border: '1.5px solid rgba(168, 85, 247, 0.35)', borderRadius: '18px', padding: '16px', display: 'flex', gap: '14px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: 'rgba(168, 85, 247, 0.25)', color: '#D8B4FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '16px', flexShrink: 0 }}>
              4
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#D8B4FE', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles className="w-4 h-4 text-purple-400" /> 콤보 & 명예의 전당 등록
              </h3>
              <p style={{ fontSize: '13px', color: '#E2E8F0', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                연속으로 완벽하게 주문을 완수하면 콤보 보너스 점수가 쌓입니다! 최종 획득 점수가 <strong style={{ color: '#FCD34D', fontWeight: 800 }}>100점을 초과</strong>하면 도촌초등학교 명예의 전당에 랭킹을 등록할 수 있습니다.
              </p>
            </div>
          </div>

        </div>

        {/* Footer Button */}
        <div style={{ marginTop: '22px' }}>
          <button
            onClick={() => {
              haptics.light();
              onClose();
            }}
            style={{
              width: '100%',
              padding: '14px 22px',
              background: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)',
              color: '#0F172A',
              fontWeight: 900,
              fontSize: '16px',
              borderRadius: '16px',
              border: '1.5px solid #FCD34D',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)'
            }}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>피자 만들기 시작하기!</span>
          </button>
        </div>

      </div>
    </div>
  );
}
