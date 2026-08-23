# 🫓 도촌 파니 푸리 마스터 (Dochon Pani Puri Master)

구글 두들의 대표 인기 인터랙티브 게임인 **'Celebrating Pani Puri'**를 모티브로 제작된 인도 길거리 음식 테마의 서빙 타이쿤 & 매칭 퍼즐 아케이드 게임입니다.

---

## 🌟 주요 특징

1. **인도 전통 길거리 음식 테마**:
   - 바삭한 튀김 볼(푸리)에 소스를 채우고 손님들의 개성 넘치는 주문을 신속하게 완성하는 타이쿤 매칭 플레이.
2. **4대 시그니처 파니(양념수)**:
   - 🌿 **민트·고수 파니 (Teekha)**: 상쾌하고 매콤한 시그니처 초록 소스
   - 🍯 **스위트 타마린드 파니 (Meetha)**: 달콤새콤한 진갈색 과일 소스
   - 🌶️ **스파이시 칠리 파니 (Chatpata)**: 화끈하고 얼큰한 레드 소스
   - 🥭 **망고 요거트 파니 (Dahi Mango)**: 달콤하고 부드러운 황금빛 요거트 소스
3. **콤보 & 골든 피버 시스템 (Golden Fever Mode)**:
   - 실수 없는 연속 서빙 시 콤보 배수 보너스 적용.
   - 피버 게이지 100% 달성 시 8초간 황금빛 축제와 함께 모든 점수 2배 획득!
4. **자체 렌더링 & 신디사이저 오디오**:
   - HTML5 Canvas 2D 기반의 고해상도 그래픽과 유체/파티클 애니메이션.
   - Web Audio API를 활용한 바삭한 크런치, 찰랑이는 물방울, 인도풍 BGM 음원 합성.
5. **도촌초등학교 명예의 전당 연동**:
   - 100점 초과 달성 시 학교 랭킹 실시간 등록 및 자동 탭 연동.

---

## 📁 폴더 구조

```
src/components/games/panipuri/
├── PaniPuriGame.jsx              # 메인 게임 컨트롤러 및 React UI 래퍼
├── PaniPuriHowToPlayModal.jsx    # 게임 방법 및 맛 가이드 모달
├── panipuriEngine.js             # HTML5 Canvas 2D 그래픽, 손님, 소스 단지, 파티클 엔진
├── panipuriConstants.js          # 맛 데이터, 손님 프로필, 밸런스 및 점수 상수
├── panipuriAudio.js              # Web Audio API 사운드 효과음 및 배경음 신디사이저
├── panipuri.css                  # 아케이드 UI 스타일시트
└── README.md                     # 컴포넌트 설명 문서
```
