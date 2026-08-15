// Chronological Update History & Changelog Data Store for Dochon Games Portal
// Automatically maintained with date-by-date release notes

export const CHANGELOG_DATA = [
  {
    version: 'v1.4.0',
    date: '2026-08-16',
    title: '스네이크 터치 D-Pad 고도화 & 업데이트 내역 모달 시스템 신설',
    badge: 'LATEST',
    badgeColor: 'emerald',
    items: [
      {
        tag: 'NEW',
        tagColor: 'amber',
        text: '포털 상단 [업데이트 내역] 반응형 오버레이 팝업 모달 신설 (날짜별 전체 개발 및 개선 내역 실시간 조회)'
      },
      {
        tag: 'IMPROVE',
        tagColor: 'teal',
        text: '도촌 스네이크(Snake Master) 모바일 터치 컨트롤러를 팩맨 스타일의 고품격 3D 아케이드 D-Pad 패널로 통합 업그레이드'
      },
      {
        tag: 'UI/UX',
        tagColor: 'purple',
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
