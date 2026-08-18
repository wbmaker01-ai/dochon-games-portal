# Dochon Kids Coding (도촌 코딩 토끼)

## 개요
* **게임명**: 도촌 코딩 토끼 (Dochon Kids Coding)
* **모티브**: Google Doodle 50주년 어린이 코딩 기념작 (*Coding for Carrots*)
* **장르**: 블록 코딩 기반 알고리즘 & 컴퓨팅 사고력 학습형 퍼즐

## 디렉토리 구조
* `KidsCodingGame.jsx`: 메인 게임 컨트롤러, 뷰포트, UI 바, 리더보드 점수 등록
* `kidsCodingConstants.js`: 8개 스테이지 정의, 타일/방향/블록 타입, 최적화 기준
* `kidsCodingEngine.js`: 블록 인터프리터, 가상 머신, 루프 실행기, 유효성 검사기
* `kidsCodingAudio.js`: Web Audio API 기반 토끼 점프/턴/당근 수확/클리어 효과음 신시사이저
* `KidsCodingHowToPlayModal.jsx`: 게임 방법 및 코딩 블록 설명 모달
* `kidscoding.css`: 반응형 스크래치 스타일 블록 UI 및 맵 그리드 스타일시트

## 주요 기능
1. **8단계 점진적 난이도 스테이지**: 전진, 좌/우 회전, 반복문(Loop), 복합 패턴, 장애물 회피
2. **스크래치/블록클리 스타일 블록 코딩**: 블록 추가, 삭제, 루프 중첩, 횟수 조절
3. **최적화 챌린지 (Shortest Code)**: 최소 블록 수 달성 시 별 3개(⭐️⭐️⭐️) 및 최적화 보너스 점수 부여
4. **명예의 전당 연동**: 100점 초과 시 점수 등록 활성화, 등록 시 리더보드 자동 탭 선택
