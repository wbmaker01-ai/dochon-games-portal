import React from 'react';
import { X, Sparkles, Lightbulb, MousePointer, HelpCircle, CheckCircle, Zap, Clock, Shuffle } from 'lucide-react';

export default function ColorTileHowToPlayModal({ isOpen, onClose }) {
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
              <span style={{ fontSize: '20px' }}>🧩</span>
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#FBBF24', margin: 0 }}>
                도촌 컬러 타일 완벽 가이드
              </h2>
              <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>
                도촌초 학생들을 위한 1분 쉬운 룰 설명서 ✨
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

        {/* 4-Step Rules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          
          {/* Step 1 */}
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', padding: '12px', borderLeft: '4px solid #38BDF8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <MousePointer style={{ width: '16px', height: '16px', color: '#38BDF8' }} />
              <span style={{ fontWeight: 800, fontSize: '13px', color: '#38BDF8' }}>1단계: 타일이 없는 '빈 칸'을 클릭하세요!</span>
            </div>
            <p style={{ fontSize: '12px', color: '#CBD5E1', margin: 0, lineHeight: 1.5 }}>
              마우스를 올리면 십자 가이드라인이 표시됩니다. 타일이 없는 빈 공간을 클릭(또는 터치)하면 상·하·좌·우로 시선(레이저)이 뻗어나갑니다.
            </p>
          </div>

          {/* Step 2 */}
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', padding: '12px', borderLeft: '4px solid #10B981' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Zap style={{ width: '16px', height: '16px', color: '#10B981' }} />
              <span style={{ fontWeight: 800, fontSize: '13px', color: '#10B981' }}>2단계: 같은 색 타일 2개 이상이 마주치면 팡! 파괴됩니다</span>
            </div>
            <p style={{ fontSize: '12px', color: '#CBD5E1', margin: 0, lineHeight: 1.5 }}>
              클릭한 빈 칸 기준으로 4방향에서 <strong>가장 먼저 만난 타일들의 색상</strong>을 비교합니다. 같은 색상이 2개 이상 있다면 모두 사라지며 점수를 획득합니다!
            </p>
          </div>

          {/* Step 3 */}
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', padding: '12px', borderLeft: '4px solid #F59E0B' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Clock style={{ width: '16px', height: '16px', color: '#F59E0B' }} />
              <span style={{ fontWeight: 800, fontSize: '13px', color: '#F59E0B' }}>3단계: 시간 보너스와 콤보를 노리세요!</span>
            </div>
            <p style={{ fontSize: '12px', color: '#CBD5E1', margin: 0, lineHeight: 1.5 }}>
              타일을 맞출 때마다 <strong>+1.5초 이상의 보너스 시간</strong>이 충전됩니다. 빠르게 연속으로 맞추면 콤보 배수(x1.5, x2.0, x3.0...)가 올라가 폭발적인 고득점을 얻습니다!
            </p>
          </div>

          {/* Step 4 */}
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', padding: '12px', borderLeft: '4px solid #A855F7' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Lightbulb style={{ width: '16px', height: '16px', color: '#A855F7' }} />
              <span style={{ fontWeight: 800, fontSize: '13px', color: '#A855F7' }}>4단계: 막힐 때는 힌트(💡)와 셔플(🔀) 아이템!</span>
            </div>
            <p style={{ fontSize: '12px', color: '#CBD5E1', margin: 0, lineHeight: 1.5 }}>
              더 이상 맞출 타일이 안 보일 때는 <strong>힌트(3회)</strong> 버튼을 눌러 최적의 자리를 찾거나, <strong>셔플(2회)</strong> 버튼으로 타일을 섞을 수 있습니다.
            </p>
          </div>

        </div>

        {/* Pro Tips Box */}
        <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px dashed #F59E0B', borderRadius: '12px', padding: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Sparkles style={{ width: '15px', height: '15px', color: '#FBBF24' }} />
            <span style={{ fontWeight: 800, fontSize: '12px', color: '#FBBF24' }}>도촌 챔피언 공략 비법 꿀팁</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11px', color: '#E2E8F0', lineHeight: 1.6 }}>
            <li>타일 뒤쪽에 가려진 타일들을 위해 앞쪽 방해 타일을 먼저 지워 길을 열어주세요.</li>
            <li>빈 공간 클릭 시 3개나 4개가 동시에 터지는 슈퍼 크로스 매치를 찾으면 대량 득점!</li>
            <li>잘못된 빈 칸을 누르면 -1초 페널티가 있으니 신중하게 클릭하세요.</li>
          </ul>
        </div>

        {/* Footer Close Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            backgroundColor: '#F59E0B',
            color: '#0F172A',
            fontWeight: 900,
            fontSize: '14px',
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
          }}
        >
          이해했어요! 지금 바로 플레이하기 🎮
        </button>
      </div>
    </div>
  );
}
