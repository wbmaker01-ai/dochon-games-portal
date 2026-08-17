# 도촌 크리켓 (Dochon Cricket)

도촌초등학교 게임 포털의 12번째 공식 정식 출시 게임인 **도촌 크리켓**의 전용 소스코드 폴더입니다.

상세 기획 및 개발 설계 사양은 루트의 [`CRICKET_DESIGN.md`](file:///d:/Antigravity/google-game-modify/CRICKET_DESIGN.md)를 참고하세요.

## 파일 구성
* `CricketGame.jsx`: 60FPS 캔버스 게임 메인 렌더러 및 게임 루프 / HUD
* `cricketConstants.js`: 좌표, 6대 구종, 타이밍 판정 및 스피드 티어 상수
* `cricketLogic.js`: 스프라이트 크로마키 투명화, 3D 잔디 바운드 궤적 및 파티클 엔진
* `cricketAudio.js`: Web Audio API 기반 무지연 사운드 신디사이저
* `CricketHowToPlayModal.jsx`: 플레이 가이드 및 규칙 설명 모달
* `cricket.css`: 반응형 글래스모피즘 HUD 및 모바일 스윙 버튼 스타일
