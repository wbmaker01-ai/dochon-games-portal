# 🐎 도촌 포니 익스프레스 (Dochon Pony Express)

미국 서부 개척 시대의 전설적인 릴레이 우편 배달 시스템인 '포니 익스프레스'를 모티브로 한 3레인 액션 러닝 아케이드 게임입니다.

---

## 📁 디렉터리 구성
- `PonyExpressGame.jsx` : 메인 리액트 게임 컴포넌트, 캔버스 생명주기 및 명예의 전당 연동
- `PonyExpressHowToPlayModal.jsx` : 조작법 및 게임 규칙 팝업 모달
- `ponyConstants.js` : 레인 좌표, 스테이지, 장애물/아이템 속성, 물리 파라미터
- `ponyLogic.js` : 충돌 판정, 파티클 시스템, 패럴랙스 배경 및 2D 캔버스 벡터 렌더러
- `ponyAudio.js` : Web Audio API 기반 말발굽, 편지 획득, 장애물 피격 및 승리 팡파르 효과음 합성기
- `pony.css` : 서부 빈티지 톤 반응형 스타일링

---

## 🎯 게임 시스템
1. **3개 레인 러닝 액션**: 상단/중단/하단 레인을 오가며 100통의 편지 수집 및 장애물 회피
2. **3단계 스테이지 진화**:
   - Stage 1: 서부 황무지 사막 (Desert Plains)
   - Stage 2: 붉은 협곡 & 강 (Canyon & River)
   - Stage 3: 설원 산맥 & 웨스턴 타운 (Snowy Peaks & Western Town)
3. **명예의 전당 연동**: 100점 초과 획득 시 랭킹 등록 지원 (placeholder '예: 홍길동')
