# 도촌 미니 올림픽 (Dochon Mini Olympics)

도촌초등학교 게임 포털을 위해 개발된 **100% 순수 코드 렌더링(HTML5 Canvas 2D + Web Audio API) 3대 릴레이 스포츠 아케이드 게임** 모듈입니다.

## 📂 파일 구조 및 역할

- **`OlympicsGame.jsx`**: 메인 게임 컴포넌트 (상태 머신, 화면 전환, HUD, 키보드/모바일 터치 컨트롤, 점수 등록).
- **`OlympicsHowToPlayModal.jsx`**: 종목별 상세 규칙 및 조작법 팝업 모달.
- **`olympicsEngine.js`**: Canvas 2D 벡터 그래픽 렌더링 엔진 (트랙, 농구 코트, 급류 강물, 캐릭터 애니메이션, 파티클).
- **`olympicsAudio.js`**: Web Audio API 신디사이저 사운드 엔진 (출발 총성, 휘슬, 점프, 슛, 패들, 환호성, 팡파레).
- **`olympicsConstants.js`**: 종목 설정, 물리 계수, 점수 테이블, 유니폼 색상, 메달 기준.
- **`olympics.css`**: 반응형 뷰포트 및 UI 애니메이션 스타일.

## 🏃 3대 릴레이 종목 구성

1. **100m 허들 달리기 (100m Hurdles)**: 좌우 키 교차 연타 가속 및 타이밍 허들 점프.
2. **3점 슛 챌린지 (3-Point Shootout)**: 타이밍 게이지를 맞추어 연속 득점과 콤보 달성.
3. **급류 카누 슬라럼 (Canoe Slalom)**: 급류를 타며 바위/통나무를 피하고 녹색 게이트 통과.

## 🎖️ 규칙 준수

- **명예의 전당 점수 등록 placeholder**: `'예: 홍길동'`
- **100점 이하 점수 등록 차단**: 100점 초과 시에만 등록 폼 노출
- **점수 등록 후 리더보드 자동 동기화**: `openInPageLeaderboardModal('olympics')`
