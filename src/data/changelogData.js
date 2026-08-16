// Chronological Update History & Changelog Data Store for Dochon Games Portal
// Automatically maintained with date-by-date release notes

export const CHANGELOG_DATA = [
  {
    version: 'v1.7.0',
    date: '2026-08-16',
    title: 'Google 두들 스타일 캐주얼 스포츠 [도촌 야구왕] 정식 출시 & 타이밍 배팅 시스템',
    badge: 'LATEST',
    badgeColor: 'emerald',
    items: [
      {
        tag: 'NEW GAME',
        tagColor: 'amber',
        text: '도촌초등학교 6번째 즉시 플레이 가능 게임 [도촌 야구왕 (Dochon Baseball)] 신규 출시 및 전용 독립 모듈(src/components/games/baseball/) 구축'
      },
      {
        tag: 'ONE-BUTTON',
        tagColor: 'blue',
        text: '[초간단 원버튼 타격 시스템] 탑재 (스페이스바 또는 화면 터치 1회로 배트를 휘두르는 직관적인 타이밍 액션 구현)'
      },
      {
        tag: 'PITCH ENGINE',
        tagColor: 'purple',
        text: '[다채로운 마구 & 변화구 시스템] 직구, 아리랑볼, 체인지업, 커브볼, 싱커, 지그재그 마구, 유령 마구, 불꽃 광속구 등 점수별 난이도 곡선 적용'
      },
      {
        tag: 'DIAMOND HUD',
        tagColor: 'emerald',
        text: '[실시간 다이아몬드 주루 & 3아웃 룰] 안타/장타/홈런 시 주자 진루, 홈인 득점(Runs) 및 3아웃 카운트 시스템 완비'
      },
      {
        tag: 'VISUAL ASSETS',
        tagColor: 'teal',
        text: '[도촌초 전용 에셋 & 인메모리 알파 크로마키] 도촌 야구장 배경, 치비 타자 준비/스윙 스프라이트, 투수 스프라이트, 홈런 배지 고품질 합성'
      },
      {
        tag: 'WEB AUDIO',
        tagColor: 'amber',
        text: '[레트로 야구 신디사이저 효과음] 맑은 배트 쾌타음, 홈런 팡파르, 바람을 가르는 헛스윙음 및 투수 릴리스 비프음 연동'
      },
      {
        tag: 'LEADERBOARD',
        tagColor: 'amber',
        text: '실시간 클라우드 DB [도촌 명예의 전당] 야구 탭 자동 연동 및 100점 룰 / 홍길동 플레이스홀더 표준 100% 준수'
      }
    ]
  },
  {
    version: 'v1.6.0',
    date: '2026-08-16',
    title: 'Google 스타일 클래식 퍼즐 [도촌 지뢰찾기] 정식 출시 & 안심 보호막 시스템 탑재',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'NEW GAME',
        tagColor: 'amber',
        text: '도촌초등학교 5번째 즉시 플레이 가능 게임 [도촌 지뢰찾기 (Dochon Minesweeper)] 신규 출시 및 독립 모듈(src/components/games/minesweeper/) 구축'
      },
      {
        tag: 'SAFE FIRST',
        tagColor: 'emerald',
        text: '[첫 클릭 100% 안전 보장] 시스템 탑재 (첫 클릭 칸과 주변 8칸의 지뢰 배치를 원천 배제하여 시원한 0-영역 개방 보장)'
      },
      {
        tag: 'SHIELD',
        tagColor: 'blue',
        text: '[🛡️ 안심 보호막 (1회 실수 구원)] 기능 신설 (지뢰를 밟아도 1회 자동 방어 후 깃발로 안전하게 해체해주는 초등학생 맞춤형 보호 시스템)'
      },
      {
        tag: 'SMART HINT',
        tagColor: 'amber',
        text: '[💡 스마트 힌트 코칭] 기능 탑재 (막혔을 때 100% 안전한 잔디밭이나 지뢰 위치를 찾아내어 반짝임 및 논리적 이유 설명 제공)'
      },
      {
        tag: 'CONTROLS',
        tagColor: 'teal',
        text: '[PC / 모바일 하이브리드 조작계] 완성 (PC 좌클릭/우클릭/Chording 번개오픈 & 모바일 원터치 [⛏️ 파기] / [🚩 깃발] 모드 스위치 및 롱터치 깃발 지원)'
      },
      {
        tag: 'RULEBOOK',
        tagColor: 'purple',
        text: '[초등학생 눈높이 룰북 모달(📖 룰북)] 제공 (숫자의 비밀, 깃발 꽂기, 번개 동시 오픈 및 1-1 패턴 꿀팁 안내)'
      },
      {
        tag: 'LEADERBOARD',
        tagColor: 'amber',
        text: '실시간 클라우드 DB 연동 [도촌 명예의 전당] 5번째 지뢰찾기 탭 신설 및 100점 룰 / 홍길동 플레이스홀더 표준 준수'
      }
    ]
  },
  {
    version: 'v1.5.0',
    date: '2026-08-16',
    title: '초등학생 맞춤형 카드 퍼즐 [도촌 솔리테어] 정식 출시 & 스마트 코칭 시스템 신설',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'NEW GAME',
        tagColor: 'amber',
        text: '초등학생 눈높이에 맞춘 클래식 카드 퍼즐 [도촌 솔리테어 (Dochon Solitaire)] 정식 출시 및 독립 모듈(src/components/games/solitaire/) 구축'
      },
      {
        tag: 'COACH',
        tagColor: 'teal',
        text: '[초등학생 눈높이 완벽 가이드 모달(📖 게임 방법)] 신설 (그림과 이모지로 색깔 번갈아 놓기, K 빈칸 이동, A 완성칸 올리기 등 4대 핵심 규칙 제공)'
      },
      {
        tag: 'SMART HINT',
        tagColor: 'amber',
        text: '실시간 [스마트 힌트(💡 힌트 보기)] 코칭 시스템 탑재 (이동 가능한 카드에 황금빛 반짝임 효과 및 친절한 다음 행동 가이드 말풍선 제공)'
      },
      {
        tag: 'EASY UX',
        tagColor: 'emerald',
        text: '[원클릭 스마트 자동 이동(Tap-to-Move)] 지원 (카드를 클릭/터치하기만 해도 완성칸 또는 바닥 열로 최적의 위치를 찾아 자동으로 쏙 이동)'
      },
      {
        tag: 'FEATURE',
        tagColor: 'blue',
        text: '초등학생 추천 [1장 뽑기(쉬움, 기본값)] 및 [3장 뽑기(도전)] 난이도 선택, 무제한 [실행 취소(Undo)] 지원'
      },
      {
        tag: 'SOLVABLE',
        tagColor: 'amber',
        text: '100% 클리어 성공 보장 덱 생성 알고리즘(Solvable Deal Generator) 탑재 (불가능한 막힘 덱 원천 차단)'
      },
      {
        tag: 'MAGIC',
        tagColor: 'purple',
        text: '막힘 실시간 감지기(Dead-end Detector) 및 초등학생 구원 [🪄 마법의 셔플 (Magic Shuffle)] 찬스 기능 신설'
      },
      {
        tag: 'UI/UX',
        tagColor: 'blue',
        text: '상단 카드 영역(덱, 뽑은 카드, 완성칸 4개)을 바닥 7열과 동일한 7열 대칭 그리드로 전면 개편하여 카드 크기 확대 및 시각적 시인성 대폭 개선'
      },
      {
        tag: 'FREE SLOT',
        tagColor: 'amber',
        text: '바닥에 4개의 킹(K)이 모두 배치되었을 때 남은 빈칸을 [🌟 자유 빈칸]으로 자동 전환하여 어떤 카드든 자유롭게 놓아 막힌 길을 뚫을 수 있도록 규칙 혁신'
      },
      {
        tag: 'MAGIC FLIP',
        tagColor: 'teal',
        text: '남은 덱이 소진되어 바닥 카드만으로 막혔을 때 숨겨진 카드를 바로 열어주는 [🔮 카드 뒤집기] 구원 기능 탑재'
      },
      {
        tag: 'RULE',
        tagColor: 'indigo',
        text: '상단 완성칸(Foundation)에 올렸던 카드를 바닥 열로 다시 내려 길을 뚫을 수 있는 [완성칸 ➔ 바닥 이동] 지원 및 힌트 연동'
      },
      {
        tag: 'AUTO WIN',
        tagColor: 'emerald',
        text: '바닥 카드가 모두 열려 클리어가 확정되었을 때 1초 만에 덱을 완성하는 [🎉 자동 완성하기] 기능 및 승리 폭죽 세레머니 구현'
      },
      {
        tag: 'AUDIO',
        tagColor: 'teal',
        text: 'Web Audio API 기반 리얼 카드 셔플, 뒤집기음, 안착음, 힌트 차임벨, 마법의 셔플음 및 승리 팡파르 효과음 6종 탑재'
      }
    ]
  },
  {
    version: 'v1.4.0',
    date: '2026-08-16',
    title: '스네이크 터치 D-Pad 고도화 & 업데이트 내역 모달 시스템 신설',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'UI/UX',
        tagColor: 'teal',
        text: '헤더 타이틀 아이콘(🎮, ✨)을 DOCHON GAMES PORTAL 좌우 1열(줄바꿈 방지)로 완벽 고정 및 검색창 최대 너비 600px 황금비율 적용'
      },
      {
        tag: 'HERO',
        tagColor: 'amber',
        text: '메인 명예의 전당 배너에 [종목별 1위 챔피언 랜덤 추천 & 실시간 순환 알고리즘] 적용 (새로고침/접속 시 다양한 게임 1등 챔피언 소개 및 원클릭 즉시 도전)'
      },
      {
        tag: 'UI/UX',
        tagColor: 'purple',
        text: '[업데이트] 버튼을 상단 [학교 랭킹] 버튼 우측으로 재배치하여 헤더 영역 시각적 균형감 및 접근성 최적화'
      },
      {
        tag: 'NEW',
        tagColor: 'emerald',
        text: '포털 상단 [업데이트 내역] 반응형 오버레이 팝업 모달 신설 (날짜별 전체 개발 및 개선 내역 실시간 조회)'
      },
      {
        tag: 'IMPROVE',
        tagColor: 'teal',
        text: '도촌 스네이크(Snake Master) 모바일 터치 컨트롤러를 팩맨 스타일의 고품격 3D 아케이드 D-Pad 패널로 통합 업그레이드'
      },
      {
        tag: 'LAYOUT',
        tagColor: 'blue',
        text: '게임 모달 최대 너비 880px 확장 및 캔버스 좌우 잘림 방지 반응형 뷰포트 최적화'
      }
    ]
  },
  {
    version: 'v1.3.0',
    date: '2026-08-15',
    title: '100점 이하 점수 등록 차단, 포털 전면 UI/UX 개편 & 스네이크 신작 출시',
    badge: 'MAJOR',
    badgeColor: 'amber',
    items: [
      {
        tag: 'SECURITY',
        tagColor: 'rose',
        text: '모든 게임에서 100점 이하(score <= 100) 획득 시 점수 등록 폼 은닉 및 차단 방어 로직 적용 (100점 초과 시에만 명예의 전당 등록 가능)'
      },
      {
        tag: 'GAMEPLAY',
        tagColor: 'blue',
        text: '게임 시작 시 및 목숨 소모 리스폰 직후 3초 무적 쉴드(Invincibility Shield) 보호 모드 구현'
      },
      {
        tag: 'NEW GAME',
        tagColor: 'emerald',
        text: '신규 아케이드 게임 [도촌 스네이크 마스터 (Dochon Snake Master)] 정식 출시 및 랭킹 연동'
      },
      {
        tag: 'UI/UX',
        tagColor: 'purple',
        text: 'Gemini 3.7 기반 딥 인디고 스페이스 그라데이션 및 별빛 파티클 배경 적용'
      },
      {
        tag: 'HERO',
        tagColor: 'amber',
        text: '포털 상단 [오늘의 도촌 명예의 전당 1위 챔피언] 실시간 하이라이트 배너 신설'
      },
      {
        tag: 'FEATURE',
        tagColor: 'teal',
        text: '9개 카테고리 픽토그램 이모지 및 실시간 게임 개수 뱃지 (🎮 전체, 👾 클래식, 🏃 액션 등)'
      },
      {
        tag: 'LUCKY',
        tagColor: 'emerald',
        text: '어떤 게임을 할지 고민될 때 원클릭으로 실행하는 [🎲 랜덤 게임] 룰렛 기능 추가'
      },
      {
        tag: 'FAVORITE',
        tagColor: 'rose',
        text: '학생 맞춤형 [❤️ 즐겨찾기] 토글 및 즐겨찾는 게임 모아보기 필터 지원'
      },
      {
        tag: 'RANKING',
        tagColor: 'amber',
        text: '명예의 전당 동일 이름 중복 등록 시 최고의 최고 점수(Highest Score) 1개만 선별하여 단일 표시 (deduplicateLeaderboard)'
      },
      {
        tag: 'DINO',
        tagColor: 'teal',
        text: '도촌 공룡 달리기 고화질 그래픽 에셋 적용 및 독립 모듈 폴더(src/components/games/dino/) 분리'
      }
    ]
  },
  {
    version: 'v1.0.0',
    date: '2026-08-13',
    title: '도촌초등학교 게임 포털 최초 런칭 & 팩맨 게임 정식 출시',
    badge: 'RELEASE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'PORTAL',
        tagColor: 'amber',
        text: 'Google Games 타일 방식 모방 비영리 도촌초등학교 게임 포털 최초 런칭'
      },
      {
        tag: 'PAC-MAN',
        tagColor: 'amber',
        text: 'D-O-C-H-O-N 알파벳 커스텀 미로 맵 기반 [도촌 팩맨 (Dochon Pac-Man)] 개발 및 정식 출시'
      },
      {
        tag: 'DATABASE',
        tagColor: 'emerald',
        text: 'Firebase Realtime DB 실시간 클라우드 랭킹 시스템 연동 및 0초 즉시 반영(낙관적 UI) 구현'
      },
      {
        tag: 'ADMIN',
        tagColor: 'purple',
        text: '트로피 아이콘 위장 히든 버튼 기반 관리자 모드(암호: 8582) 및 점수 수정/삭제 실시간 동기화 구현'
      },
      {
        tag: 'MODAL',
        tagColor: 'teal',
        text: '새 창 팝업 차단 문제를 완벽 해결한 순수 HTML/CSS 반응형 인페이지 오버레이 모달 시스템 적용'
      },
      {
        tag: 'DEPLOY',
        tagColor: 'blue',
        text: 'GitHub Pages(gh-pages) 무중단 자동 웹 배포 파이프라인 구축'
      }
    ]
  }
];

export const getLatestVersion = () => CHANGELOG_DATA[0]?.version || 'v1.0.0';
export const getLatestDate = () => CHANGELOG_DATA[0]?.date || '2026-08-16';
