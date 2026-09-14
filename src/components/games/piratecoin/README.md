# 도촌 해적선 코인 쟁탈전 (Dochon Pirate Coin Heist)

황금 보물섬에서 쏟아지는 금화를 모아 자신의 해적선으로 안전하게 수송하고, 상대 배를 전속력으로 들이받아 코인을 강탈하는 4인 실시간 P2P 배틀 아케이드 게임입니다.

---

## 📁 파일 구성 (게임별 독립 전용 폴더)

- `PirateCoinGame.jsx`: 메인 게임 컴포넌트, 캔버스 뷰포트, 카메라 추적, HUD, 로비/결과 모달, 명예의 전당 등록 및 모바일 터치 컨트롤러
- `PirateCoinHowToPlayModal.jsx`: 조작법(키보드/터치), 코인 수집 및 입금 룰, 4종 배틀 아이템 안내 모달
- `pirateCoinConstants.js`: 전장 크기, 4종 선박 스펙, 코인/아이템 정의, 물리 파라미터, AI 난이도 상수
- `pirateCoinMap.js`: 푸른 바다 파도 애니메이션, 중앙 황금 보물섬, 암초, 소용돌이, 4개 팀 베이스 선착장 및 미니맵 레이더 절차적 렌더러
- `pirateCoinLogic.js`: 선박 2D 가속/감속/선회 물리, 소지 코인 트레일 체인 동역학, 충돌 들이받기(Tackle) & 코인 스필 연산, 입금 존 판정, AI 봇 의사결정 트리
- `pirateCoinAudio.js`: Web Audio API 기반 100% 무에셋 사운드 신시사이저 (파도, 뱃고동, 코인 짤랑, 들이받기 쿵, 대포 발사, 입금 팡파레)
- `pirateCoinNetwork.js`: 도촌초 전용 Firebase RTDB 기반 WebRTC P2P + 실시간 릴레이 자동 폴백(Hybrid Fallback) 멀티플레이어 동기화 매니저 (4초 직결 타임아웃 ➔ 0.5초 무중단 릴레이 전환, 10Hz 대역폭 델타 압축, 잔여 0-Byte 자동 삭제)
- `piratecoin.css`: 해적 골드 & 네이비 테마 반응형 HUD, 미니맵, 가상 D-Pad 및 게임 모달 스타일
- `README.md`: 본 문서

---

## 📋 프로젝트 전역 규칙(Global Constraints) 준수 현황

1. **게임별 독립 폴더 관리 원칙**: 모든 게임 관련 코드가 `src/components/games/piratecoin/` 폴더 내에 100% 분리/관리됨.
2. **명예의 전당 점수 등록 힌트 텍스트**: 점수 등록 입력창의 `placeholder`가 `'예: 홍길동'`으로 작성됨.
3. **100점 이하 점수 등록 차단 원칙**: `finalScore <= 100`인 경우 점수 등록 폼 및 버튼이 일체 숨김 처리됨.
4. **점수 등록 후 리더보드 자동 탭 선택**: 등록 완료 시 `onScoreSubmitted('piratecoin')`를 호출하여 리더보드 모달에서 `piratecoin` 탭이 즉시 자동 활성화됨.
5. **WebRTC P2P + Firebase RTDB 실시간 릴레이 하이브리드 폴백**: 외부 공개 시그널링 서버 의존성을 배제하고, 교사용 PC와 학생용 크롬북 간 상이한 접속 환경에서도 1차 직결 P2P(4초) 및 2차 Firebase 안전 릴레이 모드로 100% 무조건 접속을 보장함.
