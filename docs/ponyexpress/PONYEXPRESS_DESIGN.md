# 🐎 도촌 포니 익스프레스 (Dochon Pony Express) 설계 및 기술 문서

## 1. 개요
- **게임명**: 도촌 포니 익스프레스 (Dochon Pony Express)
- **장르**: 3레인 액션 러닝 아케이드 (횡스크롤)
- **목표**: 3개 레인을 질주하며 100통의 편지를 수집하여 서부 마을(웨스턴 타운)에 배달하기
- **플랫폼**: PC (키보드), 태블릿/스마트폰 (터치 스와이프 & 온스크린 버튼)

---

## 2. 모듈 및 디렉터리 구성
```
google-game-modify/
├── docs/
│   ├── baseball/
│   ├── cricket/
│   └── ponyexpress/
│       └── PONYEXPRESS_DESIGN.md
├── public/
│   ├── assets/
│   │   └── ponyexpress/
│   └── thumbnails/
│       ├── ponyexpress.jpg
│       └── ponyexpress.svg
└── src/
    └── components/
        └── games/
            └── ponyexpress/
                ├── PonyExpressGame.jsx
                ├── PonyExpressHowToPlayModal.jsx
                ├── ponyConstants.js
                ├── ponyLogic.js
                ├── ponyAudio.js
                ├── pony.css
                └── README.md
```

---

## 3. 핵심 아키텍처 및 메커니즘
1. **PonyGameLogic (물리 및 렌더링 엔진)**:
   - 60FPS 캔버스 2D 벡터 렌더러
   - 플레이어 4프레임 달리는 모션 및 점프 포물선 물리
   - 3단계 스테이지 배경(사막 ➔ 협곡 ➔ 설원 & 마을) 패럴랙스 스크롤
   - 아이템(편지, 황금 편지, 당근) 및 장애물(선인장, 바위, 웅덩이, 울타리, 눈뭉치, 무법자) 스포너
2. **PonyAudio (Web Audio API)**:
   - 실시간 오실레이터 기반 사운드 합성 (말발굽, 편지 수집음, 황금 편지 아르페지오, 피격음, 승리 팡파르)
3. **명예의 전당 연동**:
   - `submitScoreToDB('ponyexpress', name, score)`
   - 100점 초과 시 등록 폼 노출, placeholder `'예: 홍길동'` 통일
