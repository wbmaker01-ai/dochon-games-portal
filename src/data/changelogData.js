// Chronological Update History & Changelog Data Store for Dochon Games Portal
// Automatically maintained with date-by-date release notes

export const CHANGELOG_DATA = [
  {
    version: 'v1.36.2',
    date: '2026-08-22',
    title: '[도촌 미니 올림픽] 카누 슬라럼 물살 정방향 물리 개편 & 플레이 타임 밸런싱(1,200m/10발) & 수평 1줄 조작계 적용',
    badge: 'LATEST',
    badgeColor: 'emerald',
    items: [
      {
        tag: 'CANOE FORWARD FLOW',
        tagColor: 'blue',
        text: '[카누 슬라럼 정방향 물살 & 게이트 물리 개편] 카누 전진 시 게이트(GATE 1~10)와 장애물이 화면 위쪽에서 자연스럽게 다가와 아래로 흐르도록 상대 거리 벡터 수식을 정방향으로 전면 개편'
      },
      {
        tag: 'GAMEPLAY BALANCE',
        tagColor: 'emerald',
        text: '[종목별 플레이 타임 & 몰입도 강화] 너무 빠르게 끝나던 문제를 해결하여 카누 코스를 1,200m(10개 게이트)로 확장하고 슛 기회를 10발로 확대, 허들 가속 커브를 실감나는 12~16초 완주로 최적화'
      },
      {
        tag: 'GAMEPAD 1-ROW',
        tagColor: 'amber',
        text: '[카누 모드 수평 1줄 게임패드 적용] 좌측에 [◀ 좌회전 + 우회전 ▶] 버튼을 1줄 수평으로 나란히 배치하고, 우측에 [⚡ 패들 가속] 액션 버튼을 배치하여 완벽한 양손 모바일 조작 완성'
      }
    ]
  },
  {
    version: 'v1.36.1',
    date: '2026-08-22',
    title: '[도촌 미니 올림픽] 가상 게임패드 수평 1줄 듀얼 클러스터(왼쪽: 달리기 / 오른쪽: 점프) 레이아웃 개편',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'GAMEPAD LAYOUT',
        tagColor: 'amber',
        text: '[수평 1줄 게임패드 분리 배치] 기존 세로 3줄 정렬을 전면 개편하여, 1줄 수평(Horizontal 1-Row)으로 왼쪽에 [왼발 달리기 + 오른발 달리기], 오른쪽에 [⬆️ 허들 점프!]를 양손 분리 배치하여 최적의 모바일 터치 조작감 제공'
      }
    ]
  },
  {
    version: 'v1.36.0',
    date: '2026-08-22',
    title: '[포털 & 피자 마스터] 전체 UI 가독성 전면 개편 & 고대비 타이포그래피 및 대형 액션 버튼 적용',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'UI & CONTRAST',
        tagColor: 'amber',
        text: '[주문서 & 텍스트 시인성 대폭 강화] 도촌 피자 마스터의 손님 주문 대사, 토핑 요구조건 뱃지, 분할 정확도(%) 및 결과 팝업 폰트를 고대비 순백색 볼드 타이포그래피로 전면 개편하여 한눈에 명확히 읽히도록 개선'
      },
      {
        tag: 'TACTILE BUTTONS',
        tagColor: 'emerald',
        text: '[조작 버튼 스케일업 & 터치 친화적 UI] 피자 서빙하기, 컷팅 초기화, 다음 주문 받기, 게임 시작/재도전 버튼의 크기와 높이(52px+)를 확대하고 고대비 그라데이션 및 클릭 피드백 강화'
      },
      {
        tag: 'PORTAL REFINEMENT',
        tagColor: 'blue',
        text: '[포털 메인 카테고리 칩 & 헤더 버튼 개선] 메인 포털 카테고리 필터 탭과 랭킹/다이스 버튼의 폰트 및 배경 대비를 향상하여 작은 화면에서도 글자와 아이콘이 선명하게 노출되도록 최적화'
      }
    ]
  },
  {
    version: 'v1.35.4',
    date: '2026-08-22',
    title: '[도촌 피자 마스터] 선분 기반 정밀 컷팅 엔진 개편 & 3등분(Y자 커팅) 완벽 지원',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'PHYSICS & SLICE',
        tagColor: 'amber',
        text: '[선분 기반 정밀 커팅 엔진으로 전면 개편] 마우스 드래그 지점을 관통하여 무한 연장되던 직선 렌더링을 사용자가 그은 실제 선분(Segment) 궤적만 정확히 자르는 정밀 방식으로 개편하여 중심점 출발 1/3 3등분(Y자 컷) 및 자유자재 부분 커팅 지원'
      },
      {
        tag: 'SMART SNAPPING',
        tagColor: 'teal',
        text: '[중심점 & 크러스트 스마트 스냅 및 래스터 플러드필 분할] 피자 중심 부근 및 테두리 외곽 지점의 미세한 틈새를 보정하는 스마트 스냅과 2D Raster Wall BFS 알고리즘을 구축하여 3등분·4등분 등 모든 분수 단계의 분할 판정 정밀도 극대화'
      }
    ]
  },
  {
    version: 'v1.35.3',
    date: '2026-08-22',
    title: '[도촌 미니 올림픽] 컨트롤 버튼 가독성 전면 개편 & 경기장 고화질 벡터 그래픽 및 HUD 업그레이드',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'UI & READABILITY',
        tagColor: 'amber',
        text: '[가상 컨트롤 버튼 시인성 대폭 개선] 흰색 바탕과 흰색 글씨로 인해 발생하던 텍스트 미노출 현상을 해결하고, 고대비 그라데이션 버튼 및 선명한 키 뱃지([← / A], [Space / ↑], [→ / D])를 적용하여 조작 키와 명칭이 즉각 보이도록 개선'
      },
      {
        tag: 'CANVAS GRAPHICS',
        tagColor: 'blue',
        text: '[경기장 전광판 & 캐릭터 벡터 그래픽 고도화] 100m 허들 전광판 폰트 시인성 강화, 거리 표시(m) 다크 뱃지 추가, 관중석 및 선수 캐릭터 스케일업(1.3배) 및 고화질 외곽선 적용'
      },
      {
        tag: 'LIVE HUD',
        tagColor: 'emerald',
        text: '[상단 실시간 올림픽 HUD 탑재] 종목별 실시간 진행도(거리/공 개수) 및 실시간 획득 점수 인디케이터를 상단 바에 글래스모피즘으로 배치'
      }
    ]
  },
  {
    version: 'v1.35.2',
    date: '2026-08-22',
    title: '[도촌 꿀벌의 비행] 키보드 방향키(↑ ↓ ← → / WASD) 직접 조향 물리 엔진 개편 및 터치 D-Pad 추가',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'KEYBOARD CONTROL',
        tagColor: 'amber',
        text: '[키보드 방향키 조향 전면 개편] 키보드 상·하·좌·우 화살표(↑ ↓ ← →), WASD 및 한글 입력 모드 키를 누를 때 꿀벌이 해당 방향으로 즉각적이고 부드럽게 가속 비행하도록 독립 키보드 조향 물리 엔진 구축 및 화면 스크롤 간섭 방지'
      },
      {
        tag: 'TOUCH D-PAD',
        tagColor: 'teal',
        text: '[하단 미니 D-Pad 컨트롤러 탑재] 키보드 외에도 마우스 클릭 및 모바일 터치로 방향을 미세 조종할 수 있는 4방향 가상 버튼 배치'
      }
    ]
  },
  {
    version: 'v1.35.1',
    date: '2026-08-22',
    title: '[도촌 피자 마스터] 3단계 반반 피자 분할 판정 조건 알고리즘 긴급 패치',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'BUG FIX',
        tagColor: 'rose',
        text: '[3단계 반반 피자 판정 로직 정상화] 페퍼로니 2조각·버섯 2조각 분할 요구조건 검사 시 전체 조각 검사 분기가 우선 적용되어 무조건 실패 처리되던 조건문 우선순위 결함을 수정하여 십자 4등분 시 정상 클리어되도록 조치'
      }
    ]
  },
  {
    version: 'v1.35.0',
    date: '2026-08-21',
    title: '제23탄 신규 게임 [도촌 미니 올림픽 (3대 릴레이 스포츠 챔피언십)] 정식 개장',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'NEW GAME',
        tagColor: 'emerald',
        text: '[도촌 미니 올림픽 정식 개장] Google 올림픽 기념 인터랙티브 스포츠 아케이드를 모티브로 한 3대 종목(100m 허들 달리기, 3점 슛 챌린지, 급류 카누 슬라럼) 릴레이 챔피언십 정식 오픈'
      },
      {
        tag: 'PURE CODE ENGINE',
        tagColor: 'amber',
        text: '[100% 순수 코드 2D Canvas 그래픽 엔진] 외부 이미지 파일 없이 올림픽 몬도 트랙, 원목 농구 코트, 급류 물결 및 선수 캐릭터 애니메이션(달리기·슈팅·패들링) 벡터 렌더링 구현'
      },
      {
        tag: 'AUDIO SYNTH',
        tagColor: 'blue',
        text: '[Web Audio API 스포츠 효과음 신디사이저] 출발 총성, 심판 휘슬, 발소리, 허들 점프 및 클리어 벨, 농구 림 스위시, 카누 물살, 관중 환호성, 시상식 팡파레 자체 합성'
      },
      {
        tag: 'TEAM & MULTI-EVENT',
        tagColor: 'teal',
        text: '[4개 참가팀 선택 & 3종목 종합 채점 시스템] 도촌 불꽃·푸른·에메랄드·번개팀 유니폼 선택, 종목별 기록 합산 올림픽 종합 점수 및 금/은/동 메달 수여식 지원'
      },
      {
        tag: 'LEADERBOARD',
        tagColor: 'purple',
        text: '[도촌초 실시간 명예의 전당 연동] 100점 초과 달성 시 실시간 전교 랭킹 점수 등록 지원 및 점수 등록 후 미니 올림픽 리더보드 탭 자동 동기화'
      }
    ]
  },
  {
    version: 'v1.34.0',
    date: '2026-08-21',
    title: '제22탄 신규 게임 [도촌 꿀벌의 비행 (Earth Day Bee 모티브)] 정식 개장 & 힐링 비행 액션 오픈',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'NEW GAME',
        tagColor: 'emerald',
        text: '[도촌 꿀벌의 비행 정식 개장] 2020년 지구의 날(Earth Day 50주년) 구글 두들을 모티브로 한 꽃가루 수분 & 도촌초 생태계 가꾸기 힐링 비행 액션 정식 오픈'
      },
      {
        tag: 'FLIGHT PHYSICS',
        tagColor: 'amber',
        text: '[2D Canvas 꿀벌 비행 & 수분 물리 엔진] 부드러운 날갯짓과 회전 스티어링 물리, 시차 스크롤 잔디밭 & 구름 배경, 5종 꽃(데이지·튤립·해바라기·라벤더·무지개꽃) 개화(Bloom) 및 꽃가루 파티클 연출'
      },
      {
        tag: 'AUDIO SYNTH',
        tagColor: 'blue',
        text: '[Web Audio API 자연 힐링 사운드 신디사이저] 꿀벌 비행 허밍음, 꽃가루 획득 챠임, 꽃 개화 벨소리, 콤보 상승 아르페지오 및 레벨업 팡파르 100% 자체 합성 구현'
      },
      {
        tag: 'ECOFACTS & COMBO',
        tagColor: 'teal',
        text: '[도촌 생태계 레벨 & 환경 꿀벌 상식] 단계별 화단 번성 시스템, 연속 개화 콤보(최대 x5) 및 생태계 보호 교육 팩트 토스트 제공'
      },
      {
        tag: 'LEADERBOARD',
        tagColor: 'purple',
        text: '[도촌초 실시간 명예의 전당 연동] 100점 초과 달성 시 실시간 전교 랭킹 점수 등록 지원 및 점수 등록 후 꿀벌의 비행 리더보드 탭 자동 동기화'
      }
    ]
  },
  {
    version: 'v1.33.0',
    date: '2026-08-21',
    title: '제21탄 신규 게임 [도촌 피자 마스터 (Celebrating Pizza 모티브)] 정식 개장 & 수학 분수 퍼즐 오픈',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'NEW GAME',
        tagColor: 'emerald',
        text: '[도촌 피자 마스터 정식 개장] 구글 두들 명작 Celebrating Pizza를 모티브로 한 토핑 분배 & 기하학 분수 커팅 퍼즐 정식 오픈 (1/2, 1/4, 1/3, 1/6, 1/8 등분 단계별 미션 및 무한 셰프 챌린지 모드)'
      },
      {
        tag: 'GEOMETRIC ENGINE',
        tagColor: 'amber',
        text: '[2D Canvas 기하학 슬라이스 & 면적 판정] 마우스/터치 드래그 직선 컷팅 알고리즘, 실시간 다각형 분할 및 조각별 면적 균등도·토핑 분배 정밀 검증 시스템 구축'
      },
      {
        tag: 'PROCEDURAL ART',
        tagColor: 'rose',
        text: '[노릇노릇 절차적 피자 그래픽] 원목 도마, 모차렐라 치즈 그라데이션, 페퍼로니·올리브·양송이·파프리카·바질·방울토마토 6종 고화질 벡터 토핑 및 치즈 파티클 연출'
      },
      {
        tag: 'AUDIO SYNTH',
        tagColor: 'blue',
        text: '[Web Audio API 사운드 신디사이저] 피자 컷터 슬라이스 삭-삭 마찰음, 주문 벨소리, 완성 팡파르, 3단 별점 차임 및 무의존성 오디오 엔진 자체 제작'
      },
      {
        tag: 'LEADERBOARD',
        tagColor: 'purple',
        text: '[도촌초 실시간 명예의 전당 연동] 100점 초과 달성 시 실시간 전교 랭킹 점수 등록 지원 및 점수 등록 후 피자 마스터 리더보드 탭 자동 동기화'
      }
    ]
  },
  {
    version: 'v1.32.0',
    date: '2026-08-21',
    title: '즐겨찾기 초기 진입 상태 전체 해제(Clean State) 기본값 적용 및 로컬 저장소 동기화',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'FAVORITES INIT',
        tagColor: 'pink',
        text: '[초기 접속 시 즐겨찾기 전체 해제] 신규 사용자 또는 첫 접속 시 임의의 추천 게임이 강제 등록되지 않고 모든 즐겨찾기가 깨끗하게 해제된 초기 상태로 시작하도록 기본값 개편'
      },
      {
        tag: 'USER CHOICE PERSISTENCE',
        tagColor: 'teal',
        text: '[사용자 맞춤 즐겨찾기 영구 저장] 사용자가 게임 카드 상단의 하트(💖) 아이콘을 직접 눌러 등록/해제한 내역만 브라우저 로컬 저장소(localStorage)에 안전하게 기록 및 동기화'
      },
      {
        tag: 'EMPTY STATE UX',
        tagColor: 'amber',
        text: '[즐겨찾기 필터 빈 상태 안내 화면 추가] 등록된 즐겨찾기가 0개일 때 즐겨찾기 탭 진입 시 친절한 하트 등록 방법 가이드 카드 표시'
      }
    ]
  },
  {
    version: 'v1.31.0',
    date: '2026-08-21',
    title: '제20탄 신규 게임 [도촌 버블티 카페 (Bubble Tea 모티브)] 정식 개장 & 힐링 타이쿤 오픈',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'NEW GAME',
        tagColor: 'emerald',
        text: '[도촌 버블티 카페 정식 개장] 구글 두들 글로벌 명작 Celebrating Bubble Tea를 모티브로 한 3단계 정량 맞추기 타이밍 힐링 아케이드 정식 오픈 (펄 투입, 밀크티 붓기, 시럽 토핑 단계별 구현)'
      },
      {
        tag: 'PHYSICS & VISUAL',
        tagColor: 'amber',
        text: '[2D Canvas 유체 표면 파동 & 쫀득 펄 물리] 컵 내 차오르는 액체의 실시간 표면 파동(Sine Wave) 연출, 펄 탄성 충돌 물리, 스트로우 꽂힘 및 6종 귀여운 동물 손님 힐링 애니메이션 탑재'
      },
      {
        tag: 'AUDIO ENGINE',
        tagColor: 'blue',
        text: '[Web Audio API ASMR 사운드 신디사이저] 펄 떨어지는 퐁당퐁당 소리, 음료 차오르는 쪼르륵 주입음, 스트로우 뽁! 효과음, 별점 판정 차임벨 및 호로록 음미 사운드 100% 자체 합성 구현'
      },
      {
        tag: 'LEADERBOARD',
        tagColor: 'purple',
        text: '[도촌초 실시간 명예의 전당 연동] 100점 초과 달성 시 실시간 전교 랭킹 점수 등록 지원 및 점수 등록 후 버블티 카페 리더보드 탭 자동 동기화'
      }
    ]
  },
  {
    version: 'v1.30.1',
    date: '2026-08-21',
    title: '[도촌 매직 캣 아카데미] 유령 충돌 시 하트 감소 판정 정상화 및 피격 시각 피드백 강화',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'BUG FIX',
        tagColor: 'rose',
        text: '[유령 충돌 및 하트 감소 판정 버그 수정] 무적 시간 중 다중 유령 충돌 시 유령이 대미지 없이 소멸하던 현상 및 제스처 오인식에 의한 무분별한 힐링 문제를 수정하여 정확한 하트 감소 보장'
      },
      {
        tag: 'VISUAL FX',
        tagColor: 'amber',
        text: '[인게임 체력 표시 및 피격 연출 대폭 강화] 주인공 고양이 모모 머리 위에 5개 미니 하트 실시간 UI 배치, 피격 시 -1 HP 💔 플로팅 대미지 텍스트, 아파하는 표정 연출 및 화면 붉은빛 비네트 이펙트 탑재'
      }
    ]
  },
  {
    version: 'v1.30.0',
    date: '2026-08-19',
    title: '[도촌 스카이 점퍼] 3·2·1 카운트다운 시스템 도입 및 키보드 조작감(마우스 간섭 방지) 개선',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'GAMEPLAY',
        tagColor: 'emerald',
        text: '[3·2·1 카운트다운 & 초기 점프 동기화] 게임 시작 및 재도전 시 화면 중앙 펄스 링과 함께 3, 2, 1, GO! 카운트다운 및 사운드 효과음 출력 후 첫 점프를 시작하도록 개선하여 플레이 준비 시간 제공'
      },
      {
        tag: 'CONTROLS',
        tagColor: 'blue',
        text: '[키보드 조작 우선권 및 마우스 고착 현상 완벽 해결] 마우스 커서가 캔버스 중앙에 위치할 때 키보드 좌/우 방향키 입력이 방해받던 문제를 해결하고 키보드 입력 시 마우스 포인터 타깃을 즉시 초기화하도록 조작감 최적화'
      }
    ]
  },
  {
    version: 'v1.29.0',
    date: '2026-08-19',
    title: '제19탄 신규 게임 [도촌 코딩 토끼 (Kids Coding 모티브)] 정식 개장 & 알고리즘 퍼즐 탑재',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'NEW GAME',
        tagColor: 'emerald',
        text: '[도촌 코딩 토끼 정식 개장] 구글 어린이 코딩 50주년 기념작을 모티브로 한 8단계 점진적 알고리즘 교육 퍼즐 정식 오픈 (전진, 좌/우 회전, 반복 루프 블록 시스템 탑재)'
      },
      {
        tag: 'OPTIMIZATION',
        tagColor: 'amber',
        text: '[최적화 챌린지 & 3-Star 평가 시스템] 최소 블록 수로 해결하는 알고리즘 최적화 달성 시 별 3개(⭐️⭐️⭐️) 및 대량의 보너스 점수 부여'
      },
      {
        tag: 'AUDIO & UI',
        tagColor: 'blue',
        text: '[Web Audio 효과음 & 반응형 블록 코딩 UI] 깡총깡총 점프음, 당근 수확 차임벨, 스크래치 스타일 직관적 블록 조립 UI 및 단계별 디버깅(1단계 실행) 지원'
      },
      {
        tag: 'LEADERBOARD',
        tagColor: 'purple',
        text: '[실시간 명예의 전당 랭킹 연동] 100점 초과 달성 시 실시간 도촌초등학교 랭킹 등록 지원 및 제출 후 코딩 토끼 리더보드 탭 자동 선택'
      }
    ]
  },
  {
    version: 'v1.28.0',
    date: '2026-08-19',
    title: '제18탄 신규 게임 [도촌 스카이 점퍼 (두들 점프 모티브)] 정식 개장 & 명예의 전당 연동',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'NEW GAME',
        tagColor: 'emerald',
        text: '[도촌 스카이 점퍼 정식 개장] 수직 무한 점프 물리 엔진, 6종 특수 발판(이동/부서짐/유령/1회용/수직), 5종 파워업 아이템(스프링/트램펄린/프로펠러/로켓/보호막) 및 공중 몬스터 슈팅 격파 시스템 탑재'
      },
      {
        tag: 'VISUAL & AUDIO',
        tagColor: 'blue',
        text: '[고도별 4단계 동적 배경 & Web Audio 신시사이저] 맑은 하늘(0~2000m)부터 황혼 노을, 밤하늘, 심우주 은하수(10000m+)까지 고도에 따른 실시간 테마 전환 및 경쾌한 자체 사운드 효과음 구현'
      },
      {
        tag: 'LEADERBOARD',
        tagColor: 'purple',
        text: '[도촌초 실시간 명예의 전당 연동] 최고 달성 고도 점수(100m 초과) 클라우드 랭킹 등록 및 점수 제출 시 스카이 점퍼 랭킹 탭 자동 동기화'
      }
    ]
  },
  {
    version: 'v1.27.0',
    date: '2026-08-18',
    title: '신규 순차 개장 준비(Coming Soon) [도촌 스카이 점퍼 (두들 점프 모티브)] 등록 & 3D 썸네일 탑재',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'COMING SOON',
        tagColor: 'amber',
        text: '[도촌 스카이 점퍼 (Doodle Jump 모티브) 등록] 발판을 밟고 우주 끝까지 무한 점프 상승하는 국민 아케이드 게임 개장 준비 라인업 등록 및 나노바나나 고화질 3D 썸네일 탑재'
      }
    ]
  },
  {
    version: 'v1.26.0',
    date: '2026-08-18',
    title: '신규 순차 개장 준비(Coming Soon) 명작 구글 두들 라인업 7종 대거 등록 & 고화질 3D 썸네일 탑재',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'COMING SOON',
        tagColor: 'amber',
        text: '[도촌 코딩 토끼 (Kids Coding 모티브)] 블록 코딩으로 당근을 수확하는 어린이 코딩 50주년 기념 교육 퍼즐 개장 준비 라인업 등록 및 3D 썸네일 탑재'
      },
      {
        tag: 'COMING SOON',
        tagColor: 'blue',
        text: '[도촌 버블티 카페 (Bubble Tea 모티브)] 귀여운 동물 손님들의 주문에 맞춰 펄과 밀크티를 정량 채우는 힐링 타이쿤 개장 준비 라인업 등록 및 3D 썸네일 탑재'
      },
      {
        tag: 'COMING SOON',
        tagColor: 'purple',
        text: '[도촌 피자 마스터 (Pizza 모티브)] 토핑 조건에 맞게 피자를 등분하여 분수와 기하학을 배우는 수학 퍼즐 개장 준비 라인업 등록 및 3D 썸네일 탑재'
      },
      {
        tag: 'COMING SOON',
        tagColor: 'emerald',
        text: '[도촌 꿀벌의 비행 (Earth Day Bee 모티브)] 꽃가루를 묻혀 꽃을 피우고 생태계를 가꾸는 힐링 비행 액션 개장 준비 라인업 등록 및 3D 썸네일 탑재'
      },
      {
        tag: 'COMING SOON',
        tagColor: 'amber',
        text: '[도촌 미니 올림픽 (London 2012 Games 모티브)] 허들 달리기, 농구 3점슛, 축구 골키퍼 등 스릴 넘치는 미니 스포츠 아케이드 개장 준비 라인업 등록 및 3D 썸네일 탑재'
      },
      {
        tag: 'COMING SOON',
        tagColor: 'teal',
        text: '[도촌 천산갑의 모험 (Pangolin Love 모티브)] 몸을 둥글게 말아 데굴데굴 구르고 점프하는 횡스크롤 플랫폼 액션 개장 준비 라인업 등록 및 3D 썸네일 탑재'
      },
      {
        tag: 'COMING SOON',
        tagColor: 'blue',
        text: '[도촌 UFO 탈출작전 (Roswell Incident 모티브)] 불시착한 외계인을 도와 부품을 찾아 우주로 탈출하는 포인트 앤 클릭 어드벤처 개장 준비 라인업 등록 및 3D 썸네일 탑재'
      }
    ]
  },
  {
    version: 'v1.25.0',
    date: '2026-08-17',
    title: '도촌초 게임 이용 및 안전 수칙 반응형 팝업 모달 신설 (필수 실천 서약 & 오늘 하루 보지 않기)',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'SAFETY RULES',
        tagColor: 'amber',
        text: '[도촌초 게임 이용 및 안전 수칙 팝업 신설] 학생들의 올바른 게임 이용 문화 조성을 위해 4대 핵심 수칙(선생님 허락 후 플레이, 바른 말 고운 말 사용, 친구와 사이좋게 경쟁, 스스로 정해진 시간 지키기) 안내 팝업 탑재'
      },
      {
        tag: 'MANDATORY AGREEMENT',
        tagColor: 'teal',
        text: '[필수 실천 서약 체크박스 시스템] "위 내용을 모두 이해했으며, 성실히 실천하겠습니다" 필수 체크 시에만 게임 포털 입장 및 플레이가 가능하도록 안전 장치 적용'
      },
      {
        tag: 'DAILY OPTION',
        tagColor: 'blue',
        text: '[오늘 하루 다시 보지 않기 & 툴바 상시 열람] "오늘 하루는 이 안내 팝업을 다시 보지 않겠습니다" 선택 옵션 제공 및 메인 상단 툴바 [🛡️ 이용수칙] 버튼을 통해 언제든 재확인 가능'
      }
    ]
  },
  {
    version: 'v1.24.0',
    date: '2026-08-17',
    title: '도촌 팩맨 상단 점수/목숨 HUD 한 줄 레이아웃 개편 및 전용 스타일 분리',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'SCORE HUD',
        tagColor: 'amber',
        text: '[점수 및 최고점수 라벨 개편] "현재 점수" 및 "최고 점수"로 명칭을 명확하게 수정하고, "현재 점수 100점 / 최고 점수 3,250점" 형태로 상단에 한 줄로 나란히 배치'
      },
      {
        tag: 'LIVES HUD',
        tagColor: 'teal',
        text: '[목숨 및 하트 아이콘 한 줄 배치] "목숨 💖💖💖" 형태로 하트 아이콘을 텍스트와 함께 한 줄로 깔끔하게 정렬'
      },
      {
        tag: 'DEDICATED STYLES',
        tagColor: 'purple',
        text: '[팩맨 전용 스타일 시트 분리] pacman.css 독립 파일로 분리하여 캔버스, 점수판, 목숨판, 랭킹 등록창, 조작키의 시각적 완성도 및 반응형 레이아웃 강화'
      }
    ]
  },
  {
    version: 'v1.23.0',
    date: '2026-08-17',
    title: '모바일 UX 3대 개선안 [터치 제스처 최적화 · 인게임 가로모드 알림 · 스마트폰 손맛 햅틱 진동]',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'TOUCH ACTION',
        tagColor: 'teal',
        text: '[모바일 브라우저 제스처 간섭 차단] touch-action: none 및 manipulation을 적용하여 빠른 연속 탭 시 화면 더블탭 확대 딜레이, 당겨서 새로고침(Pull-to-Refresh), 텍스트 선택 잔상을 완벽 차단'
      },
      {
        tag: 'ORIENTATION TIP',
        tagColor: 'amber',
        text: '[인게임 가로모드 추천 알림 바 신설] 세로 모드 스마트폰으로 게임 진입 시 "스마트폰을 가로로 돌리면 훨씬 넓고 쾌적하게 플레이할 수 있어요! 🔄" 반응형 안내 바 자동 노출'
      },
      {
        tag: 'HAPTIC ENGINE',
        tagColor: 'purple',
        text: '[스마트폰 손맛 웹 햅틱 진동 시스템 탑재] 타격, 블록 격파, 과일 합성, 팩맨 파워쿠키, 마법 제스처 성공 시 콘솔 게임기 수준의 미세 손맛 진동(Haptics) 피드백 제공'
      }
    ]
  },
  {
    version: 'v1.22.1',
    date: '2026-08-17',
    title: '도촌 크리켓 모바일/태블릿 전용 하단 대형 스윙 버튼 컨트롤러 탑재',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'MOBILE CONTROLS',
        tagColor: 'amber',
        text: '[모바일/태블릿 전용 대형 스윙 컨트롤러 탑재] 스마트폰 및 태블릿 터치 환경에서 캔버스 화면 가림 없이 쾌적하게 배트를 휘두를 수 있도록 하단 전용 대형 [🏏 배트 휘두르기 (SWING)] 글래스모피즘 액션 버튼 및 키보드 조작 안내 바 신설'
      }
    ]
  },
  {
    version: 'v1.22.0',
    date: '2026-08-17',
    title: '[도촌 게임 포털 이용안내] 전용 모달 신설 및 모바일·태블릿 가로모드 권장 가이드 탑재',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'PORTAL GUIDE',
        tagColor: 'blue',
        text: '[메인 툴바 [💡 이용안내] 전용 모달 신설] 포털 메인 상단 툴바에 이용안내 버튼을 신설하여 랭킹 등록 규칙, PC/모바일 조작법, 스마트 도우미 기능, 사운드 설정 등 필수 가이드를 원클릭으로 제공'
      },
      {
        tag: 'MOBILE ADVICE',
        tagColor: 'amber',
        text: '[모바일/태블릿 가로모드 권장 배너 탑재] 스마트폰 및 태블릿 접속 시 시원한 화면과 편리한 아케이드 컨트롤러 조작을 위해 "핸드폰이나 태블릿으로 이용 시 가로모드를 이용해주세요." 권장 가이드를 포털 상단 및 이용안내 모달, 게임 설명서에 전면 적용'
      }
    ]
  },
  {
    version: 'v1.21.0',
    date: '2026-08-17',
    title: '신규 17호 블록 격파 아케이드 [도촌 벽돌 격파왕] 공식 출시 & 전교 랭킹 오픈',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'NEW GAME',
        tagColor: 'amber',
        text: '[신규 17호 게임 도촌 벽돌 격파왕 정식 오픈] 패들을 조작하여 공을 튕겨내고 다채로운 블록을 격파하는 클래식 아케이드 블록 브레이커 정식 개장'
      },
      {
        tag: '5 STAGES',
        tagColor: 'blue',
        text: '[5단계 유니크 스테이지 맵] 도촌 클래식 무지개, 도촌 사랑의 하트, 다이아몬드 요새, 우주 침공 인베이더, 대마왕 관문 등 개성 넘치는 스테이지 맵 구성'
      },
      {
        tag: 'SPECIAL BRICKS',
        tagColor: 'purple',
        text: '[4종 특수 블록 시스템] 1HP 일반 블록, 2~3HP 강화 철갑 블록, 3x3 연쇄 폭탄 블록, 100점 대량 보너스 스타 블록 탑재'
      },
      {
        tag: '7 POWER-UPS',
        tagColor: 'amber',
        text: '[7종 파워업 캡슐 아이템] 3구 멀티볼, 와이드 패들, 레이저 캐논 연사, 관통 파이어볼, 바닥 안전 방어막, 슬로우 모션, 라이프 보너스 지원'
      },
      {
        tag: 'AUDIO SYNTH',
        tagColor: 'emerald',
        text: '[Web Audio API 사운드 신디사이저] 벽돌 격파 콤보에 따라 음계가 상승하는 멜로디 하모니, 레이저 발사음, 폭발음, 클리어 팡파레 탑재'
      },
      {
        tag: 'LEADERBOARD',
        tagColor: 'amber',
        text: '[도촌초 실시간 명예의 전당 연동] 100점 초과 달성 시 전교 랭킹 등록 및 점수 등록 후 벽돌 격파왕 탭 자동 선택 지원'
      }
    ]
  },
  {
    version: 'v1.20.4',
    date: '2026-08-17',
    title: '도촌 과일 합치기 모바일/터치 전용 디자인 버튼 컨트롤러 탑재',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'MOBILE CONTROLS',
        tagColor: 'amber',
        text: '[모바일 전용 터치 컨트롤러 구현] 스마트폰과 태블릿 환경에서도 쾌적하게 플레이할 수 있도록 좌측 [왼쪽/오른쪽] 방향키 버튼과 우측 대형 [과일 낙하] 액션 버튼을 직관적인 글래스모피즘 아케이드 디자인으로 탑재'
      },
      {
        tag: 'SMOOTH HOLD',
        tagColor: 'blue',
        text: '[터치 탭 & 연속 홀드 이동 지원] 이동 버튼을 가볍게 탭하면 단계별 이동, 길게 누르고 있으면 60FPS 부드러운 연속 슬라이드 이동 지원'
      }
    ]
  },
  {
    version: 'v1.20.3',
    date: '2026-08-17',
    title: '도촌 과일 합치기 키보드 전용 조작계(화살표·스페이스바·단축키) 전격 탑재',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'CONTROLS',
        tagColor: 'amber',
        text: '[PC 키보드 풀 컨트롤 시스템 지원] 마우스 없이도 좌우 방향키(← / →) 및 A / D 키로 과일 조준 위치를 부드럽게 이동하고, 스페이스바(Space) 또는 아래 방향키(↓) / Enter 키로 신속하게 과일을 낙하할 수 있는 정밀 키보드 조작계 구현'
      },
      {
        tag: 'SHORTCUTS',
        tagColor: 'blue',
        text: '[비상 흔들기 단축키 & 가이드 바 추가] [Z] 키로 상자 흔들기 스킬 즉시 시동 지원 및 캔버스 하단에 직관적인 키보드 단축키 안내 힌트 바 적용'
      }
    ]
  },
  {
    version: 'v1.20.2',
    date: '2026-08-17',
    title: '포털 라인업 재정비 및 게임 목록 최적화',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'PORTAL UPDATE',
        tagColor: 'teal',
        text: '[포털 라인업 재정비] 메인 랜딩페이지 게임 목록에서 정원 요정 항목을 정비하고 플레이어 선호도 기반의 쾌적한 게임 탐색 환경 제공 (게임 원본 소스 보존)'
      }
    ]
  },
  {
    version: 'v1.20.1',
    date: '2026-08-17',
    title: '순차 개장 라인업 타이틀 표준화 [도촌 벽돌 격파왕]',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'TITLE UPDATE',
        tagColor: 'blue',
        text: '[게임 타이틀 명칭 표준화] 순차 개장 준비 라인업 액션 아케이드 게임 명칭을 \'도촌 벽돌 격파왕\'으로 공식 수정 및 포털 데이터 동기화'
      }
    ]
  },
  {
    version: 'v1.20.0',
    date: '2026-08-17',
    title: '신규 16호 2D 물리 합성 퍼즐 [도촌 과일 합치기 (수박게임)] 정식 출시 & 왕수박 대합성',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'NEW GAME',
        tagColor: 'amber',
        text: '[신규 16호 게임 도촌 과일 합치기 정식 오픈] 작은 체리부터 거대한 왕 수박까지 11단계 과일을 떨어뜨리고 합쳐 나가는 초인기 2D 물리 합성 캐주얼 퍼즐 게임 그랜드 오픈'
      },
      {
        tag: 'PHYSICS ENGINE',
        tagColor: 'blue',
        text: '[초정밀 2D 원형 물리 & 충돌 시뮬레이터 탑재] 6단계 서브스텝 물리 적분 연산으로 과일 간의 반발력, 탄성, 구름 마찰력, 쫀득한 탄성 변형(Squash & Stretch) 및 상자 내부 충돌을 완벽하게 재현'
      },
      {
        tag: '11 FRUITS VISUAL',
        tagColor: 'purple',
        text: '[11종 카와이 과일 그래픽 & 애니메이션] 체리🍒부터 딸기, 포도, 귤, 감, 사과, 배, 복숭아, 파인애플, 멜론, 수박🍉까지 고화질 2D 캔버스 프로시저럴 렌더링 및 눈 깜빡임 표정 애니메이션 적용'
      },
      {
        tag: 'AUDIO ENGINE',
        tagColor: 'emerald',
        text: '[Web Audio API 과즙 팡팡 사운드 신디사이저] 과일 낙하음, 통통 튀는 탄성음, 합성 시 음계가 상승하는 경쾌한 퐁! 효과음, 연속 콤보 하모니, 왕수박 달성 축하 팡파레 탑재'
      },
      {
        tag: 'SPECIAL SKILL',
        tagColor: 'amber',
        text: '[비상 상자 흔들기(Shake) 찬스] 구석이나 틈새에 끼인 과일을 탈출시킬 수 있는 흔들기 스킬(게임당 2회) 및 낙하 조준 가이드라인 지원'
      },
      {
        tag: 'LEADERBOARD',
        tagColor: 'amber',
        text: '[도촌초 실시간 명예의 전당 연동] 100점 초과 달성 시 실시간 전교 랭킹 등록 및 점수 등록 후 과일 합치기 탭 자동 선택 지원'
      }
    ]
  },
  {
    version: 'v1.19.0',
    date: '2026-08-17',
    title: '신규 순차 개장 준비(Coming Soon) 라인업 2종 [도촌 과일 합치기 & 도촌 벽돌격파왕] 등록',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'COMING SOON',
        tagColor: 'amber',
        text: '[도촌 과일 합치기 (수박게임 모티브) 등록] 떨어지는 과일을 합쳐 거대한 도촌 수박을 만드는 초인기 2D 물리 합성 퍼즐 게임 개장 준비 라인업 등록 및 나노바나나 고화질 3D 썸네일 탑재'
      },
      {
        tag: 'COMING SOON',
        tagColor: 'blue',
        text: '[도촌 벽돌격파왕 (알카노이드 / BB-TAN 모티브) 등록] 반사되는 공과 화려한 파워업 아이템으로 형형색색의 블록을 격파하는 클래식 아케이드 게임 개장 준비 라인업 등록 및 고화질 3D 썸네일 탑재'
      }
    ]
  },
  {
    version: 'v1.18.0',
    date: '2026-08-17',
    title: '신규 15호 드로잉 마법 액션 [도촌 매직 캣 아카데미] 공식 출시 & 대마법서 탈환 작전',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'NEW GAME',
        tagColor: 'amber',
        text: '[신규 15호 게임 도촌 매직 캣 아카데미 정식 오픈] 마법학교 신입생 고양이 모모와 함께 마우스 드래그 & 터치로 마법 문양을 그려 침공한 유령 군단을 물리치고 대마법서를 탈환하는 드로잉 제스처 액션 아케이드 출시'
      },
      {
        tag: 'GESTURE ENGINE',
        tagColor: 'blue',
        text: '[정밀 실시간 제스처 드로잉 인식 엔진 탑재] 6대 마법 심볼(가로선, 세로선, 산 모양 ∧, 골 모양 ∨, 번개 ⚡ 광역기, 하트 ❤️ 생명력 회복)을 60FPS로 즉시 분석 및 판정하는 기하학적 인식 알고리즘 구현'
      },
      {
        tag: '5 STAGES & BOSS',
        tagColor: 'purple',
        text: '[5대 마법학교 테마 스테이지 & 대형 보스전] 도서관 ➔ 식당 ➔ 교실 ➔ 체육관 ➔ 옥상으로 이어지는 고화질 배경과 5단 콤보 패턴을 요구하는 거대 대마법서 보스전 구현'
      },
      {
        tag: 'AUDIO ENGINE',
        tagColor: 'emerald',
        text: '[Web Audio API 마법 사운드 신디사이저] 지팡이 스파클링 사운드, 심볼별 독자 음계 캐스팅음, 유령 정화음, 천둥 번개 효과음, 하트 힐링 아르페지오 및 승리 팡파르 완비'
      },
      {
        tag: 'LEADERBOARD',
        tagColor: 'amber',
        text: '[도촌초 실시간 명예의 전당 연동] 100점 초과 득점 시 실시간 전교 랭킹 등록 및 점수 등록 후 해당 게임 리더보드 자동 탭 선택 지원'
      },
      {
        tag: 'UI & HUD',
        tagColor: 'blue',
        text: '[게임 UI 및 명예의 전당 입력창 디자인 전면 개편] 다크 글래스모피즘 이름 입력창, 전용 랭킹 등록 버튼, 게임방법 & 음소거 전용 디자인 버튼, 하단 드로잉 힌트 가이드 바 탑재'
      }
    ]
  },
  {
    version: 'v1.17.1',
    date: '2026-08-17',
    title: '명예의 전당 점수 등록 하이브리드 안정성 강화 & 오프라인 무중단 기록 보장',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'BUG FIX',
        tagColor: 'rose',
        text: '[점수 등록 실패 오류 완전 해결] 외부 네트워크 환경이나 클라우드 데이터베이스 상태와 무관하게 로컬 스토리지 선반영 및 즉각적인 점수 등록 성공을 보장하는 하이브리드 안전 저장 시스템 구축'
      },
      {
        tag: 'UI & LEADERBOARD',
        tagColor: 'amber',
        text: '[도촌초 명예의 전당 즉시 연동] 포니 익스프레스, 제리 로슨, 크리켓 등 전 게임에서 100점 초과 달성 시 랭킹 등록 완료 후 해당 게임 리더보드 모달이 안정적으로 자동 노출되도록 개선'
      }
    ]
  },
  {
    version: 'v1.17.0',
    date: '2026-08-17',
    title: '신규 14호 8비트 아케이드 [도촌 제리 로슨] 공식 출시 & 나만의 게임 제작기 오픈',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'NEW GAME',
        tagColor: 'amber',
        text: '[신규 14호 게임 도촌 제리 로슨 정식 오픈] 비디오 게임 롬 카트리지의 아버지 제럴드 "제리" 로슨의 업적을 기리는 8비트 레트로 플랫포머 & 인터랙티브 게임 메이커 정식 출시'
      },
      {
        tag: 'LEVEL MAKER',
        tagColor: 'blue',
        text: '[나만의 게임 제작 (레벨 에디터) 시스템 탑재] 마우스 클릭 & 드래그로 블록, 스프링, 코인, 글리치 버그, 골 카트리지를 자유롭게 배치하고 즉석에서 조작해볼 수 있는 테스트 플레이 빌더 제공'
      },
      {
        tag: '3 STAGES',
        tagColor: 'purple',
        text: '[3단계 레트로 어드벤처 모드] 1976 연구실 ➔ Fairchild 카트리지 시스템 ➔ 사이버 아케이드로 이어지는 3대 테마 스테이지와 정밀 60FPS 픽셀 물리 엔진 탑재'
      },
      {
        tag: 'AUDIO ENGINE',
        tagColor: 'emerald',
        text: '[Web Audio API 8비트 칩튠 신디사이저] 점프음, 코인 획득 아르페지오, 스프링 튕김음, 버그 스톰프 펀치음 및 클리어 축하 팡파르 사운드 완비'
      },
      {
        tag: 'LEADERBOARD',
        tagColor: 'amber',
        text: '[도촌초 실시간 명예의 전당 연동] 100점 초과 득점 시 실시간 전교 랭킹 등록 및 점수 등록 후 해당 게임 리더보드 자동 탭 선택 지원'
      }
    ]
  },
  {
    version: 'v1.16.0',
    date: '2026-08-17',
    title: '신규 13호 액션 아케이드 [도촌 포니 익스프레스] 공식 출시 & 100통 편지 배달 대작전',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'NEW GAME',
        tagColor: 'amber',
        text: '[신규 13호 게임 도촌 포니 익스프레스 정식 오픈] 서부 개척 시대의 전설적인 우편 배달원이 되어 3개 레인을 질주하며 100통의 편지를 수집하여 마을에 배달하는 횡스크롤 액션 러닝 아케이드 게임 출시'
      },
      {
        tag: '3 STAGES',
        tagColor: 'blue',
        text: '[3단계 테마 스테이지 & 다이내믹 환경 시스템] 서부 황무지 사막(Stage 1) ➔ 붉은 협곡 & 강(Stage 2) ➔ 설원 산맥 & 웨스턴 타운(Stage 3)으로 이어지는 패럴랙스 배경과 선인장·바위·울타리·무법자 장애물 시스템 탑재'
      },
      {
        tag: 'AUDIO ENGINE',
        tagColor: 'emerald',
        text: '[Web Audio API 서부 효과음 합성기 구축] 실감 나는 따가닥 말발굽 리듬 소리, 편지 획득 챠링음, 황금 편지 아르페지오, 피격음 및 웨스턴 승리 축하 팡파르 사운드 완비'
      },
      {
        tag: 'LEADERBOARD',
        tagColor: 'purple',
        text: '[도촌초 실시간 명예의 전당 연동] 100점 초과 득점 시 실시간 전교 랭킹 등록 및 점수 등록 후 해당 게임 리더보드 자동 탭 선택 지원'
      }
    ]
  },
  {
    version: 'v1.15.1',
    date: '2026-08-17',
    title: '크리켓 게임 멈춤 버그 완전 해결 & 위켓 피격 아웃 알림 연출 대폭 강화',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'BUG FIX',
        tagColor: 'rose',
        text: '[게임 멈춤(프리즈) 현상 완전 해결] 비동기 타이머 의존성을 전면 제거하고 60FPS 순수 타임스탬프 기반 상태 머신으로 전환하여 다회차 플레이 및 연속 타격 시 100% 무중단 안정성 확보'
      },
      {
        tag: 'UI & UX',
        tagColor: 'amber',
        text: '[위켓 피격 아웃 및 게임 오버 안내 대폭 강화] 위켓이 쓰러졌을 때 즉각적인 아웃 판정(BOWLED OUT) 태그, 명확한 아웃 원인 설명 박스, 최종 득점·최고 기록 요약 카드 및 100점 랭킹 달성 팁 제공'
      }
    ]
  },
  {
    version: 'v1.15.0',
    date: '2026-08-17',
    title: '신규 12호 원버튼 스포츠 [도촌 크리켓] 공식 출시 & 서든데스 타격 배틀 오픈',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'NEW GAME',
        tagColor: 'amber',
        text: '[신규 게임 도촌 크리켓(Cricket) 정식 출시] 귀뚜라미 타자가 되어 달팽이 볼러가 던지는 마구를 쳐내고 통쾌한 6점 홈런을 날리는 서든데스 스포츠 타격 아케이드 게임 오픈'
      },
      {
        tag: 'ASSETS & ENGINE',
        tagColor: 'emerald',
        text: '[고화질 전용 에셋 및 3D 바운드 물리 엔진 구축] 에메랄드 잔디 구장 스타디움 배경, 귀뚜라미 타자 & 달팽이 투수 캐릭터 스프라이트, 크리켓 특유의 잔디 바운드 포물선 궤적 및 회전 스핀 물리 연출 탑재'
      },
      {
        tag: '6 PITCH VARIATIONS',
        tagColor: 'purple',
        text: '[달팽이 볼러 6대 구종 시스템] 정통 직구, 바운드 아리랑볼, 감속 체인지업, 스네이크 슬라이더, 구글리 스핀, 불꽃 요커 등 스코어 비례 가속 및 다양한 구질 탑재'
      },
      {
        tag: 'RULES & LEADERBOARD',
        tagColor: 'teal',
        text: '[크리켓 득점 룰 및 도촌초 실시간 명예의 전당 연동] 6점 홈런·4점 바운더리·1~2점 주루 점수 시스템 및 100점 초과 달성 시 실시간 랭킹 등록 지원'
      }
    ]
  },
  {
    version: 'v1.14.0',
    date: '2026-08-16',
    title: '신규 11호 대작 RPG 스포츠 [도촌 챔피언 아일랜드] 공식 출시 & 4대 경기장 완비',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'NEW GAME',
        tagColor: 'amber',
        text: '[신규 게임 챔피언 아일랜드(Champion Island) 정식 출시] 삼색 닌자 고양이 럭키가 되어 전설의 섬을 탐험하고 4대 스포츠 챔피언들과 승부를 겨루는 16비트 레트로 RPG 스포츠 대작 오픈'
      },
      {
        tag: '4 SPORTS ARENA',
        tagColor: 'rose',
        text: '[4대 올림픽 스포츠 미니게임 완비] 텐구와의 랠리 스매시 대결(탁구), 요이치의 움직이는 표적 저격(양궁), 갓파와의 해변 장애물 레이스(마라톤), 후쿠로우의 낙석 빙설 정상 등반(클라이밍)'
      },
      {
        tag: 'TEAMS & OVERWORLD',
        tagColor: 'purple',
        text: '[4대 팀 진영 & 오픈월드 섬 탐험 시스템] 레드 키츠네·블루 우시·옐로우 이나리·그린 갓파 팀 선택 및 마을 주민 NPC들과의 대화 및 퀘스트'
      },
      {
        tag: 'SACRED SCROLLS',
        tagColor: 'blue',
        text: '[4대 성스러운 두루마리 컬렉션] 각 종목 승리 시 고유 성스러운 두루마리(바람·명사수·질풍·정복자) 획득 및 세레머니 연출'
      },
      {
        tag: 'HALL OF FAME',
        tagColor: 'teal',
        text: '[4종목 완주 통합 명예의 전당 등록 개편] 개별 미니게임 종료 시의 팝업을 수집 현황 카드로 간소화하고, 4개의 성스러운 두루마리를 모두 모아 대통합 챔피언에 등극했을 때 4종목 총 합계 점수를 명예의 전당에 단 한 번 등록하도록 시스템 고도화'
      },
      {
        tag: 'BALANCE',
        tagColor: 'emerald',
        text: '[스포츠 경기장 난이도 밸런스 완화] 탁구 패들 크기 30% 확장 및 AI 반응 오차 완화, 양궁 경기장 승리 기준 점수를 100점 이상으로 대폭 낮추어(불스아이 1~2발로도 승리 가능) 더욱 신나고 성취감 있는 두루마리 수집 플레이 지원'
      }
    ]
  },
  {
    version: 'v1.13.0',
    date: '2026-08-16',
    title: '신규 10호 두뇌 퍼즐 [도촌 도넛 틱택토] 공식 출시 & 도넛 토러스 룰 탑재',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'UI/UX EFFECT',
        tagColor: 'rose',
        text: '[즐겨찾기 하트 아이콘 & 인터랙션 이펙트 전면 개편] 고화질 베지어 곡선 SVG 루비 하트 디자인 적용, 설정/해제 시 통통 튀는 스프링 바운스·스파클 파티클 버스트·네온 링 파동 및 기분 좋은 차임 사운드 효과 탑재'
      },
      {
        tag: 'NEW GAME',
        tagColor: 'amber',
        text: '[신규 게임 도넛 틱택토(Donut Tic-Tac-Toe) 정식 출시] 달콤한 딸기 스프링클 도넛과 초코 글레이즈 도넛의 아기자기한 두뇌 전략 퍼즐 게임 런칭'
      },
      {
        tag: 'TORUS MODE',
        tagColor: 'purple',
        text: '[도넛 토러스 순환 룰 도입] 상하좌우가 도넛 표면처럼 연결되어 벽을 뚫고 지나가는 순환 대각선 4종 추가 (총 12개 승리 패턴)'
      },
      {
        tag: 'AI & 2P BATTLE',
        tagColor: 'blue',
        text: '[3단계 스마트 AI & 2인 로컬 대전] 초보·보통·마스터 난이도 인공지능 대전 및 친구와 함께 즐기는 2인용 보드게임 모드 완비'
      },
      {
        tag: 'HALL OF FAME',
        tagColor: 'teal',
        text: '[명예의 전당 랭킹 연동] 연승 콤보 및 마스터 보너스로 100점 초과 달성 시 실시간 도촌초 명예의 전당 점수 등록 지원'
      }
    ]
  },
  {
    version: 'v1.12.0',
    date: '2026-08-16',
    title: '신규 9호 아케이드 [도촌 팝콘 서바이벌] 공식 오픈 & 3종 알갱이 클래스 탑재',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'NEW GAME',
        tagColor: 'amber',
        text: '[신규 게임 팝콘(Popcorn) 정식 출시] 달궈진 프라이팬 위에서 쏟아지는 탄막과 보스의 열 공격을 피해 생존하는 아케이드 탄막 액션 게임 공식 런칭'
      },
      {
        tag: 'CLASSES',
        tagColor: 'purple',
        text: '[3대 옥수수 알갱이 클래스 시스템] 실드 나이트(투사체 반사), 힐링 위저드(하트 회복 및 탄막 정화), 스피드 러너(무적 질주 대시) 등 고유 특수 능력 탑재'
      },
      {
        tag: 'BOSS BATTLE',
        tagColor: 'rose',
        text: '[단계별 보스 스테이지] 거대 버터 킹과 화염 정령 보스의 공격 패턴 및 아슬아슬한 스침(Graze) 점수 보너스 시스템 도입'
      },
      {
        tag: 'HALL OF FAME',
        tagColor: 'teal',
        text: '[명예의 전당 랭킹 연동] 100점 초과 달성 시 최고 생존 점수를 등록하고 전교생과 랭킹을 겨루는 실시간 명예의 전당 시스템 지원'
      }
    ]
  },
  {
    version: 'v1.11.0',
    date: '2026-08-16',
    title: '즉시 플레이 게임 [실시간 랭킹 활성도 + 신작 부스트] 하이브리드 인기 순위 알고리즘 탑재',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'ALGORITHM',
        tagColor: 'amber',
        text: '[하이브리드 인기 순위 추천 엔진 탑재] Firebase 실시간 랭킹 등록 활성도(Activity Heat) + 신규 출시작 가중치(New Release Boost) + 학생 플레이 참여도를 종합 연산하는 동적 랭킹 차트 가동'
      },
      {
        tag: 'DYNAMIC BADGE',
        tagColor: 'purple',
        text: '[실시간 동적 순위 뱃지] 고정 텍스트 대신 실시간 연산 결과에 따라 🔥 핫인기 1위, ⚡ 핫배틀 2위, ✨ NEW 3위 등 생동감 넘치는 뱃지 자동 부여'
      },
      {
        tag: 'ENGAGEMENT',
        tagColor: 'teal',
        text: '[학생 실시간 플레이 카운팅] 게임 플레이 및 즐겨찾기(❤️) 인터랙션이 실시간으로 차트에 반영되어 학생들이 가장 좋아하는 게임이 상위권으로 자연스럽게 부상'
      }
    ]
  },
  {
    version: 'v1.10.2',
    date: '2026-08-16',
    title: '[도촌 솔리테어] 카드 유실/증발 버그 긴급 핫픽스 & [🔍 52장 카드 탐색기] 신설',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'HOTFIX',
        tagColor: 'rose',
        text: '[카드 유실 및 복제 버그 완벽 수정] 바닥 열 중간 카드를 완성칸으로 이동 시 컬럼 끝 카드가 소실되던 로직을 전면 수정하고 안전 검증을 강화하여 52장 카드 무결성 보장'
      },
      {
        tag: 'AUTO HEALER',
        tagColor: 'teal',
        text: '[덱 52장 무결성 실시간 자동 복구기 탑재] 플레이 중 누락된 카드가 발생하면 게임 내에서 즉시 감지하여 덱으로 안전하게 자동 복원하는 자가 치유 시스템 가동'
      },
      {
        tag: 'CARD TRACKER',
        tagColor: 'blue',
        text: '[🔍 52장 카드 탐색기 모달 신설] 상단 툴바의 [🔍 카드 찾기]를 통해 52장 전체 카드의 실시간 위치(완성칸, 바닥열, 남은 덱)를 한눈에 투명하게 확인 가능'
      },
      {
        tag: 'FOUNDATION UI',
        tagColor: 'amber',
        text: '[완성칸 누적 카드 장수 뱃지 표시] 상단 완성칸에 차곡차곡 쌓인 카드 장수(예: 7장 보관)를 뱃지로 표기하여 직관적인 시각 피드백 제공'
      },
      {
        tag: 'CLEANUP',
        tagColor: 'purple',
        text: '[강제 카드 뒤집기 기능 정리] 클래식 퍼즐 본연의 재미와 규칙성을 위해 임의 카드 뒤집기 기능을 깔끔하게 제거하고 마법의 셔플 및 스마트 힌트 기반으로 인터페이스 최적화'
      }
    ]
  },
  {
    version: 'v1.10.1',
    date: '2026-08-16',
    title: '[도촌 컬러 타일] 타일 재배치 무한 반복 오류 긴급 핫픽스 & 종료 정산 최적화',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'HOTFIX',
        tagColor: 'purple',
        text: '[타일 재배치 무한 반복 버그 완벽 수정] 게임 후반부 서로 다른 색상의 고아 타일만 남아 더 이상 동일 색상 쌍이 없을 때 자동 재배치가 무한 루프로 실행되던 문제를 수정하고, 색상 빈도수 검사(hasAnyMatchingColorPairs)를 통해 매칭 가능 타일 소진 시 정상 완료(ALL MATCHED) 화면으로 부드럽게 전환되도록 개선'
      },
      {
        tag: 'OPTIMIZATION',
        tagColor: 'blue',
        text: '[결정론적 라운드 종료 & 정산 보너스 추가] 남은 타일 개수 및 클리어 유형(퍼펙트 클리어 / 매칭 완료)에 따른 정산 보너스 시스템을 안정화하여 쾌적한 플레이 환경 보장'
      }
    ]
  },
  {
    version: 'v1.10.0',
    date: '2026-08-16',
    title: '신규 8번째 게임 [도촌 컬러 타일 (Color Tile)] 정식 출시 & 교차 매칭 엔진 탑재',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'NEW GAME',
        tagColor: 'emerald',
        text: '[도촌 컬러 타일 정식 출시] 빈 공간을 클릭하여 상·하·좌·우 십자 방향에서 마주치는 동일한 색상의 타일들을 파괴하는 클래식 명작 교차 매칭 퍼즐 게임 신규 오픈'
      },
      {
        tag: 'GAMEPLAY ENGINE',
        tagColor: 'blue',
        text: '[정밀 십자 레이캐스팅 & 콤보 시스템] 14×14 정방형 반응형 보드, 실시간 십자 가이드라인(Hover/Touch), 레이저 빔 광선 연출, 연속 매칭 시 배수가 상승하는 폭발적 콤보(Combo) 엔진 구축'
      },
      {
        tag: 'COLOR & SYMBOLS',
        tagColor: 'purple',
        text: '[6종 캔디 보석 & 색각 이상 배려 심볼] 루비(하트♥), 사파이어(다이아몬드◆), 에메랄드(클로버♣), 골드(별★), 아메시스트(달🌙), 핑크(원●) 6종의 선명한 글래스모피즘 타일 및 고유 심볼 적용'
      },
      {
        tag: 'DUAL GAME MODES',
        tagColor: 'amber',
        text: '[타임어택 & 힐링 퍼즐 듀얼 모드] 매칭 시 시간 보너스(+1.5s~4.0s)를 획득하며 랭킹을 겨루는 60초 타임어택 모드와 시간 제한 없이 편안하게 모든 타일을 지우는 힐링 퍼즐 모드 제공'
      },
      {
        tag: 'ITEMS & ASSIST',
        tagColor: 'teal',
        text: '[힌트 & 셔플 스마트 도우미 시스템] 막힐 때 최적의 매칭 빈 칸을 짚어주는 힌트(3회) 및 타일 위치를 재배치하는 셔플(2회/자동) 보조 도구 탑재'
      },
      {
        tag: 'WEB AUDIO & HALL OF FAME',
        tagColor: 'pink',
        text: '[Web Audio 효과음 및 명예의 전당 연동] 마림바/실로폰 상승 콤보음, 레이저 광선음, 클리어 팡파르 및 100점 초과 달성 시 실시간 학교 랭킹 점수 등록 완벽 지원'
      }
    ]
  },
  {
    version: 'v1.9.0',
    date: '2026-08-16',
    title: '신규 7번째 게임 [도촌 정원 요정 (Garden Gnomes)] 정식 출시 & 물리 엔진 탑재',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'COMFORT CAMERA 4-IN-1',
        tagColor: 'purple',
        text: '[시각 피로도 제로 편안한 카메라 & 속도 안정화 시스템 구축] ① 고속/고고도 비행 시 시야각(FOV)을 넓혀주는 동적 줌아웃(Dynamic Zoom-Out), ② 최적의 속도감과 제어를 제공하는 소프트 속도 상한선(Speed Cap), ③ 눈의 안정감을 부여하는 원경 패럴랙스(Parallax Anchor), ④ 앞쪽 아이템을 미리 파악할 수 있는 전방 시야 예측(Look-Ahead) 완충 시스템을 통합 적용하여 눈의 피로감을 완벽 해소'
      },
      {
        tag: 'DENSE ITEMS 3X',
        tagColor: 'emerald',
        text: '[지상/공중 아이템 3배 이상 초고밀도 배치 & 판정 영역 확장] 지상(버섯/트램펄린/통나무/해바라기) 및 공중(구름/무지개/나비떼/씨앗) 아이템을 기존 대비 3배 이상 촘촘하게 전 구간에 배치하고 히트박스/인터랙션 범위를 대폭 확장하여 연속 콤보 도약과 비행 몰입감 극대화'
      },
      {
        tag: 'CAMERA & SKY VIEW',
        tagColor: 'blue',
        text: '[카메라 동적 수직 추적 & 고고도 비행 시야 최적화] 요정이 비행하는 동안 항상 화면 중앙에 요정 캐릭터가 명확히 잡히도록 동적 카메라 Y축 추적을 구축하고, 고공 비행 시 땅이 화면을 가리는 문제를 해결하여 광활한 푸른 하늘과 부스터 아이템 시야 확보'
      },
      {
        tag: 'INTERACTIVE METER',
        tagColor: 'amber',
        text: '[실시간 발사 파워/각도 왕복 게이지 & 재시작 초기화 개선] 재시작 시 이전 파워가 잔존하던 문제를 수정하고, 좌우로 부드럽게 왕복하는 실시간 네온 바늘(Needle) 및 동적 파워 판정 뱃지(기본/부스트/슈퍼/PERFECT) 인터랙티브 UI 전면 적용'
      },
      {
        tag: 'UI/UX',
        tagColor: 'teal',
        text: '[메인 챔피언 배너 가독성 개선] 게임 타이틀과 챔피언 학생 이름 사이 간격(2칸 공백) 및 뱃지 스타일을 최적화하여 텍스트 겹침 완벽 해소'
      },
      {
        tag: 'NEW GAME',
        tagColor: 'emerald',
        text: '[도촌 정원 요정 정식 출시] 2018년 구글 두들 명작을 계승한 투석기 발사 & 거리 달성 물리 액션 캐주얼 게임 정식 오픈'
      },
      {
        tag: 'CHARACTERS',
        tagColor: 'purple',
        text: '[3종 요정 캐릭터 시스템] 클래식 요정(표준 밸런스), 통통이 요정(슈퍼 바운스), 나비 요정(공중 활공) 3인 3색 비행 물리 특성 제공'
      },
      {
        tag: 'PHYSICS & BOOST',
        tagColor: 'amber',
        text: '[지형지물 & 공중 제어 시스템] 점핑 버섯, 가속 통나무, 황금 해바라기, 스카이 구름, 무지개 링 등 다양한 인터랙티브 부스터 및 공중 급강하(Air Drop) 메커니즘 탑재'
      },
      {
        tag: 'AUDIO & LEADERBOARD',
        tagColor: 'blue',
        text: '[Web Audio 효과음 & 실시간 랭킹 연동] 투석기 텐션/발사음, 바운스음, 부스터음 및 100점 초과 시 명예의 전당 점수 등록 지원'
      }
    ]
  },
  {
    version: 'v1.8.1',
    date: '2026-08-16',
    title: '명예의 전당(리더보드) 탭바 UI 전면 개편 & 좌우 스크롤 제거 (줄바꿈 반응형 레이아웃)',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'NO SCROLL',
        tagColor: 'amber',
        text: '[좌우 스크롤 100% 제거] 명예의 전당 모달에서 좌우 스크롤바를 완전히 없애고 줄바꿈(Wrap) 반응형 그리드를 적용하여 모든 게임 탭을 한눈에 확인 가능'
      },
      {
        tag: 'COMPACT',
        tagColor: 'teal',
        text: '[게임 이름 도촌 접두사 축약] 탭 버튼 텍스트에서 "도촌 "을 제외하고 팩맨, 공룡 달리기, 스네이크, 솔리테어, 지뢰찾기, 야구왕으로 컴팩트화하여 가독성 및 클릭 편의성 극대화'
      },
      {
        tag: 'DESIGN',
        tagColor: 'purple',
        text: '[야구왕 전용 블루 그라데이션 탭 추가] 6개 전체 게임별 전용 시그니처 컬러 및 이모지(🟡🦖🐍🃏💣⚾) 일체형 테마 적용'
      }
    ]
  },
  {
    version: 'v1.8.0',
    date: '2026-08-16',
    title: '도촌 야구왕 [긴장감 극대화 난이도 밸런스 대패치 (플라이/땅볼 아웃 & 선구안 시스템)]',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'FLY/GROUND OUT',
        tagColor: 'rose',
        text: '[빗맞은 타구 즉시 아웃제] 타이밍이 너무 빠르거나 늦어 빗맞은 공은 외야 뜬공(FLY OUT) 또는 내야 땅볼(GROUND OUT)로 판정되어 즉시 아웃 카운트 +1'
      },
      {
        tag: 'DYNAMIC TIMING',
        tagColor: 'amber',
        text: '[점수/레벨 비례 타이밍 판정 창 수축] 고득점(Lv.1~Lv.6)으로 올라갈수록 홈런/안타 허용 오차폭이 점진적으로 좁아져 정밀한 타격 집중력 요구'
      },
      {
        tag: 'HYPER SPEED',
        tagColor: 'purple',
        text: '[최고 구속 1.85x 대폭 상향 & 마구 낙폭 강화] 고득점 구간 투구 속도를 최대 1.85배(950ms 한계)까지 가속하고 싱커/커브/지그재그 마구의 궤적을 더욱 날카롭게 강화'
      },
      {
        tag: 'EYE OF TIGER',
        tagColor: 'emerald',
        text: '[가짜 유인구 & 선구안(BALL) 시스템 도입] 스트라이크 존을 벗어나는 유인구에 스윙 시 헛스윙/아웃 처리, 참아내면 볼(BALL) 판정 및 4볼 밀어내기 득점 지원 (B/S/O 카운트 미터 전면 개편)'
      }
    ]
  },
  {
    version: 'v1.7.7',
    date: '2026-08-16',
    title: '도촌 야구왕 [400점 스피드 레벨업 시 발생하던 투구 정지 버그 긴급 해결]',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'BUG FIX',
        tagColor: 'amber',
        text: '[레벨업 사운드 메서드 누락 해결] 400점(Lv.2 진입) 및 홈런 시 호출되던 레벨업 사운드 신시사이저를 Web Audio API에 정식 탑재하고 호출 예외 방어 적용'
      },
      {
        tag: 'STABILITY',
        tagColor: 'blue',
        text: '[투구 상태 머신 오류 복구 엔진] startNextPitch 및 타격 처리부에 전역 try-catch 및 오류 복구(Fallback) 메커니즘을 적용하여 어떠한 예외 상황에서도 다음 투구가 반드시 이어지도록 보장'
      }
    ]
  },
  {
    version: 'v1.7.6',
    date: '2026-08-16',
    title: '도촌 야구왕 [점수 비례 점진적 투구 속도 가속 엔진 & SPEED Lv.1~MAX 시스템] 탑재',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'SPEED ENGINE',
        tagColor: 'amber',
        text: '[하이브리드 지수 감쇠형 투구 속도 가속] 점수가 올라갈수록 공의 속도가 점진적으로 빨라지며(기본 1.0x ~ 최대 1.55x), 최소 반응 한계 시간(800ms)을 보장하는 공정한 난이도 곡선 구현'
      },
      {
        tag: 'HUD BADGE',
        tagColor: 'blue',
        text: '[실시간 SPEED Level HUD] 상단 전광판에 현재 스피드 단계(Lv.1 루키 ~ Lv.MAX 레전드)를 직관적으로 표시'
      },
      {
        tag: 'LEVEL UP ALERT',
        tagColor: 'emerald',
        text: '[SPEED UP! 축하 팝업 알림] 스피드 레벨이 승급할 때마다 역동적인 레벨업 효과음과 함께 화려한 토스트 배너 연출 제공'
      }
    ]
  },
  {
    version: 'v1.7.5',
    date: '2026-08-16',
    title: '도촌 야구왕 [유령 마구 투구 프리징 근본 해결 & 캔버스 무중단 렌더 루프 보장]',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'CRASH-PROOF',
        tagColor: 'amber',
        text: '[무중단 렌더 루프 보장 아키텍처] 캔버스 렌더링 내에 try-catch-finally를 도입하여 어떤 연산 예외나 그래픽 글리치가 발생해도 requestAnimationFrame이 절대로 중단되지 않도록 원천 차단'
      },
      {
        tag: 'GHOST BALL',
        tagColor: 'purple',
        text: '[도촌 유령 마구 가시성 & 투명도 개선] 완전 투명화로 인한 시야 상실 및 타격 불능을 방지하고 멋진 반투명 고스트 구체(최저 투명도 25%)로 렌더링되도록 밸런스 개선'
      },
      {
        tag: 'PARAM SAFETY',
        tagColor: 'blue',
        text: '[캔버스 기하학 파라미터 안전 바운더리] 공/그림자/타이밍 링의 radius가 0 이하 또는 비정상 값이 되지 않도록 Math.max 방어 로직 전면 보강'
      }
    ]
  },
  {
    version: 'v1.7.4',
    date: '2026-08-16',
    title: '도촌 야구왕 [타자 타석 위치 최적화 & 캐릭터 바지/눈/글러브 색상 복원 & 타이밍 판정 개선]',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'POSITION',
        tagColor: 'blue',
        text: '[타자 타석 위치 정밀 보정] 타자 캐릭터를 가운데 홈플레이트 바로 왼쪽(X=400, Y=445) 타석 박스로 자연스럽게 이동 배치'
      },
      {
        tag: 'GRAPHICS',
        tagColor: 'purple',
        text: '[Flood Fill 배경 분리 엔진 탑재] 외곽 배경만 스마트하게 투명화하여 타자 및 투수의 흰색 바지, 눈동자, 글러브, 양말 색상을 100% 온전하게 복원'
      },
      {
        tag: 'TIMING & BUFFER',
        tagColor: 'emerald',
        text: '[타격 타이밍 판정 범위 확대 & 연타 방지 버퍼] 안타 판정 폭(±220ms) 확대 및 투구 직후(300ms) 실수 클릭으로 인한 즉시 스트라이크/아웃 방지 안전 버퍼 적용'
      }
    ]
  },
  {
    version: 'v1.7.3',
    date: '2026-08-16',
    title: '도촌 야구왕 [3D 원근 야구장 배경 & 우측 조준 좌타자 에셋] 전면 리뉴얼',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'NEW 3D BG',
        tagColor: 'blue',
        text: '[3D 원근 야구 경기장 배경 교체] 도촌초 교사, 관중석, 잔디 다이아몬드가 완벽한 3D 하향 시점으로 펼쳐지는 신규 전용 배경화면 탑재'
      },
      {
        tag: 'BATTER SPRITE',
        tagColor: 'amber',
        text: '[우측 지향 좌타자 스프라이트 교체] 좌측 타석에서 오른쪽(홈플레이트 & 투수 마운드)을 향해 배트를 들고 겨누는 자연스러운 타격 자세 및 스윙 모션 에셋 적용'
      },
      {
        tag: 'POSITIONING',
        tagColor: 'emerald',
        text: '[3D 마운드 & 홈플레이트 앵커링] 신규 3D 배경 다이아몬드 비율에 맞추어 투수 마운드(Y=350) 및 타석 위치 좌표 정밀 동기화'
      }
    ]
  },
  {
    version: 'v1.7.2',
    date: '2026-08-16',
    title: '도촌 야구왕 [5콤보 이상 고득점 체인지업 프리징 버그 완벽 해결] & 상태 머신 안정화',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: 'BUG FIX',
        tagColor: 'amber',
        text: '[5콤보/고득점 구간 멈춤 현상 수정] React State 클로저 지연으로 인해 발생하던 캔버스 렌더 루프 및 타격 이벤트 드롭 버그를 Ref 기반 상태 머신으로 전면 전환하여 100% 무중단 연속 플레이 보장'
      },
      {
        tag: 'CHANGEUP',
        tagColor: 'blue',
        text: '[마법 체인지업 물리 엔진 보강] 비선형 감속 궤적의 0 나누기 및 NaN 예외 방지 안전 로직 추가'
      },
      {
        tag: 'PROPORTION',
        tagColor: 'emerald',
        text: '[투수/타자 3D 크기 비율 최적화] 마운드 위 투수 크기(85px) 및 타자 크기(230px)를 고정 비율로 재설정하여 원근 시야 및 공 가시성 극대화'
      }
    ]
  },
  {
    version: 'v1.7.1',
    date: '2026-08-16',
    title: 'Google 야구 스타일 [3D 입체 원근 뷰 & 시야 100% 개방] 전면 업그레이드',
    badge: 'UPDATE',
    badgeColor: 'blue',
    items: [
      {
        tag: '3D PERSPECTIVE',
        tagColor: 'blue',
        text: '[3D 입체 원근 뷰 도입] 구글 두들 야구와 동일한 소실점 기반 3D 다이아몬드 그라운드 & Elevated Perspective 렌더링 구축'
      },
      {
        tag: 'CLEAR VIEW',
        tagColor: 'emerald',
        text: '[시야 완전 개방 (좌측 타석 배치)] 타자를 홈플레이트 왼쪽 아래로 배치하여 투수-홈플레이트 간 중앙 투구 궤적이 가려지지 않도록 전면 개선'
      },
      {
        tag: '3D SHADOW',
        tagColor: 'purple',
        text: '[3D 포물선 & 실시간 바닥 그림자] 공의 3D 고도와 지표면 그림자를 분리 렌더링하여 비행 높이와 착지 타이밍을 직관적으로 확인 가능'
      },
      {
        tag: 'SWEET SPOT',
        tagColor: 'amber',
        text: '[홈플레이트 타이밍 수렴 링] 공이 타격 존에 진입할 때 홈플레이트 위로 링이 수렴하는 시각 인디케이터 추가로 타격감 강화'
      }
    ]
  },
  {
    version: 'v1.7.0',
    date: '2026-08-16',
    title: 'Google 두들 스타일 캐주얼 스포츠 [도촌 야구왕] 정식 출시 & 타이밍 배팅 시스템',
    badge: 'UPDATE',
    badgeColor: 'blue',
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
