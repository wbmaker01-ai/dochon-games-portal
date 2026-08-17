# 제리 로슨 (Jerry Lawson) 게임 프로젝트

도촌초등학교 게임 포털의 인터랙티브 레트로 아케이드 & 게임 메이커 **제리 로슨(Jerry Lawson)** 전용 프로젝트 폴더입니다.

## 📁 에셋 경로 (`public/assets/jerrylawson/`)
* `console_frame.jpg`: Fairchild Channel F 및 8비트 레트로 콘솔 프레임 UI
* `story_cutscene.jpg`: 제리 로슨 일대기 스토리 및 튜토리얼 컷씬 카드
* `lab_background.jpg`: 1970년대 마이크로 전자공학 연구실 스테이지 배경
* `arcade_background.jpg`: 1980년대 네온 사이버 아케이드 스테이지 배경

## 📁 소스코드 구성 (예정)
* `JerryLawsonGame.jsx`: 메인 게임 컴포넌트 & 캔버스 엔진
* `jerryConstants.js`: 레벨 데이터, 타일맵, 픽셀 매트릭스 및 물리 상수
* `jerryAudio.js`: 8비트 칩튠 사운드 신디사이저 (Web Audio API)
* `jerryEditor.js`: 레벨 에디터 & 맵 커스텀 로직
* `JerryHowToPlayModal.jsx`: 조작법 및 제리 로슨 스토리 모달
* `jerrylawson.css`: 레트로 콘솔 HUD 및 에디터 툴바 스타일
