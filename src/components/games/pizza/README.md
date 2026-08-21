# 도촌 피자 마스터 (Dochon Pizza Master)

## 1. 게임 개요
- **장르**: 수학 분수 & 기하학 커팅 퍼즐 / 타이쿤
- **모티브**: Google Doodle 'Celebrating Pizza'
- **개발 방식**: HTML5 2D Canvas 절차적 렌더링 + Web Audio API 무의존성 사운드 엔진

## 2. 주요 기능 및 아키텍처
- **`PizzaGame.jsx`**: 게임 라이프사이클(스테이지, 주문, 점수, 타이머, 콤보, 명예의 전당 등록) 관리
- **`pizzaEngine.js`**: 
  - 피자 도우/크러스트/토핑 절차적 벡터 렌더링
  - 마우스/터치 드래그 직선 컷팅 알고리즘 ($ax + by + c = 0$ 수식 기반의 다각형 분할 & 영역 분류)
  - 조각별 면적 균등도 및 토핑 분배 검증 알고리즘
- **`pizzaConstants.js`**: 레벨 1~10 스테이지 데이터, 무한 챌린지 생성기, 토핑/점수 상수
- **`pizzaAudio.js`**: Web Audio API 기반의 커팅/벨/팡파르/별 효과음 합성기
- **`PizzaHowToPlayModal.jsx`**: 게임 방법 및 분수 팁 모달
- **`pizza.css`**: 반응형 및 터치 최적화 스타일시트

## 3. 메모리 및 가이드라인 준수
- 명예의 전당 점수 등록 placeholder: `'예: 홍길동'`
- 100점 이하 점수 등록 차단: `score <= 100` 시 등록 폼 숨김
- 점수 등록 성공 시 리더보드 모달에서 'pizza' 탭 자동 선택 연동
