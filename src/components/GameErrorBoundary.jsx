import React from 'react';
import { RotateCcw, Home, AlertTriangle } from 'lucide-react';

export default class GameErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[GameErrorBoundary] Game runtime exception caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleExit = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onClose) {
      this.props.onClose();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '360px',
          padding: '24px',
          textAlign: 'center',
          backgroundColor: '#0F172A',
          borderRadius: '20px',
          border: '2px solid rgba(244, 63, 94, 0.4)',
          color: '#FFFFFF',
          margin: '20px auto',
          maxWidth: '520px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'rgba(244, 63, 94, 0.15)',
            border: '2px solid rgba(244, 63, 94, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            color: '#FB7185'
          }}>
            <AlertTriangle style={{ width: '32px', height: '32px' }} />
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#FEE2E2', marginBottom: '8px' }}>
            게임 실행 중 예외가 발생했습니다
          </h3>

          <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.6, marginBottom: '20px', maxWidth: '380px' }}>
            일시적인 브라우저 그래픽 또는 리소스 로딩 오류일 수 있습니다.<br />
            아래 버튼을 눌러 다시 시도하거나 포털 메인으로 돌아가세요.
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={this.handleRetry}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                borderRadius: '12px',
                backgroundColor: '#F59E0B',
                color: '#78350F',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                border: 'none',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
              }}
            >
              <RotateCcw style={{ width: '15px', height: '15px' }} />
              다시 시도
            </button>

            <button
              onClick={this.handleExit}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                borderRadius: '12px',
                backgroundColor: '#334155',
                color: '#F8FAFC',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
            >
              <Home style={{ width: '15px', height: '15px' }} />
              포털로 돌아가기
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
