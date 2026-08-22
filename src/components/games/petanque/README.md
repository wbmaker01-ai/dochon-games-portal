# Dochon Pétanque Master (도촌 페탕크 마스터)

도촌초등학교 게임 포털의 26번째 공식 신작 게임 **'도촌 페탕크 마스터'** 독립 컴포넌트 패키지입니다.

---

## 1. 게임 개요
- **장르**: 스포츠 / 물리 시뮬레이션 / 전략 아케이드
- **모티브**: 프랑스 남부 프로방스 전통 구기 레저 스포츠 페탕크(Pétanque) & 2022 구글 두들 인터랙티브 기념작
- **기술 스택**: React, Canvas 2D (2.5D Perspective Projection), Web Audio API Synth, Lucide Icons, Tailwind CSS

---

## 2. 파일 구조 및 역할

```
src/components/games/petanque/
├── PetanqueGame.jsx           # 메인 게임 컴포넌트, 상태 흐름, 라운드 스코어보드, 명예의 전당 등록
├── PetanqueEngine.js         # 2.5D 원근감 캔버스 렌더러, 포물선 & 롤링 마찰 물리, 탄성 충돌, 줄자 측정
├── PetanqueHowToPlayModal.jsx # 페탕크 룰 및 조작법 안내 팝업 모달
├── petanqueAudio.js          # Web Audio API 기반 금속 충돌음, 착지음, 휘슬, 환호 사운드
├── petanqueConstants.js      # 경기장 좌표, 물리 계수, AI 난이도, 점수 산출 상수
├── petanque.css              # 반응형 게임패드 및 고대비 HUD 스타일시트
└── README.md                 # 패키지 아키텍처 및 상세 설명서
```

---

## 3. 핵심 기능 및 물리 엔진
1. **2.5D 원근감 투영 (Perspective Projection)**:
   - 깊이($y$)에 따른 비례 축소 스케일링 ($0.45 \sim 1.05$) 및 바닥 그림자 크기/투명도 연동.
2. **포물선 비행 & 롤링 물리**:
   - $z > 0$: 공중 포물선 궤적, 중력 가속도 및 바운스 감쇠.
   - $z = 0$: 자갈/모래 바닥 마찰 계수 기반 부드러운 롤링 감속.
3. **탄성 충돌 (Elastic Collision)**:
   - 쇠구슬 간 및 표적구(뷔슈)와의 2D 물리 충돌 시 운동량 보존 법칙 적용 및 스파크/충돌음 재생.
4. **2대 투구 전술**:
   - **포앵테 (Point)**: 낮은 탄도 정밀 롤링 샷.
   - **티레 (Tirer)**: 높은 포물선 상대 공 직격 타격 샷.
5. **정밀 줄자 측정 시스템**:
   - 엔드 종료 시 뷔슈 중심 실시간 거리(cm) 레이저 점선 및 1~6위 랭킹 시각화.
