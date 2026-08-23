# 도촌 기억력 마스터 (Dochon Memory Master)

도촌초등학교 게임 포털을 위한 두뇌 트레이닝 및 기억력 집중력 향상 아케이드 게임 모듈입니다.

## 📁 디렉토리 구조
- `MemoryGame.jsx`: 메인 게임 컴포넌트 (모드 선택, 카드 매칭, 사이먼 순서 기억, 점수 등록)
- `MemoryHowToPlayModal.jsx`: 게임 방법 및 룰 안내 모달
- `memoryConstants.js`: 테마 데이터, 난이도 설정, 버튼 음계 및 점수 상수
- `memoryAudio.js`: Web Audio API 기반 신디사이저 사운드 엔진
- `memory.css`: 3D 카드 플립 애니메이션 및 특수 UI 스타일

## 🎮 게임 모드
1. **카드 짝 맞추기 (Card Match)**: 4가지 테마(동물, 디저트, 우주, 학교)와 3가지 난이도(초급, 중급, 고급) 지원
2. **멜로디 & 순서 기억 (Simon Rhythm)**: 4가지 동물 캐릭터 악기 멜로디 시퀀스 기억 및 단계별 도전

## 🏆 리더보드 연동
- 점수 `> 100`점 시 명예의 전당 등록 폼 노출
- placeholder `예: 홍길동`
- 등록 완료 시 `memory` 리더보드 탭 자동 연동
