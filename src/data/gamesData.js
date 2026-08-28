// Scalable Games Data Store for Dochon Games Portal
// Base URL helper ensures images load 100% reliably on GitHub Pages & Local Dev

const getThumb = (file) => `${import.meta.env.BASE_URL}thumbnails/${file}`;

export const PLAYABLE_GAMES = [
  {
    id: 'pacman',
    title: '도촌 팩맨',
    category: '클래식',
    imageSrc: getThumb('pacman.jpg'),
    isPlayable: true,
    badgeText: '🔥 인기 1위',
    description: '고스트를 피해 쿠키를 모두 먹고 최고 점수를 기록하세요!'
  },
  {
    id: 'dino',
    title: '도촌 공룡 달리기',
    category: '액션',
    imageSrc: getThumb('dino.jpg'),
    isPlayable: true,
    badgeText: '🦖 2위',
    description: '선인장과 익룡을 점프하며 끝없이 질주하세요!'
  },
  {
    id: 'snake',
    title: '도촌 스네이크',
    category: '클래식',
    imageSrc: getThumb('snake.jpg'),
    isPlayable: true,
    badgeText: '🐍 인기 3위',
    description: '사과를 먹고 몸집을 불려 도촌 스네이크 마스터가 되어보세요!'
  },
  {
    id: 'solitaire',
    title: '도촌 솔리테어',
    category: '카드',
    imageSrc: getThumb('solitaire.jpg'),
    isPlayable: true,
    badgeText: '🃏 4위',
    description: 'A부터 K까지 카드를 정리하는 초등학생 맞춤형 솔리테어 퍼즐!'
  },
  {
    id: 'minesweeper',
    title: '도촌 지뢰찾기',
    category: '퍼즐',
    imageSrc: getThumb('minesweeper.jpg'),
    isPlayable: true,
    badgeText: '💣 5위',
    description: '지뢰를 피해 잔디밭을 탐색하고 도촌 추리 마스터가 되어보세요!'
  },
  {
    id: 'baseball',
    title: '도촌 야구왕',
    category: '스포츠',
    imageSrc: getThumb('baseball.jpg'),
    isPlayable: true,
    badgeText: '⚾ 6위',
    description: '구속과 변화구를 예측하고 만루홈런을 날려 도촌 야구왕이 되어보세요!'
  },
  {
    id: 'colortile',
    title: '도촌 컬러 타일',
    category: '퍼즐',
    imageSrc: getThumb('colortile.jpg'),
    isPlayable: true,
    badgeText: '🧩 7위',
    description: '빈 칸을 클릭하여 십자 방향 같은 색 타일을 찾아 없애는 도촌 두뇌 퍼즐!'
  },
  {
    id: 'popcorn',
    title: '도촌 팝콘',
    category: '액션',
    imageSrc: getThumb('popcorn.jpg'),
    isPlayable: true,
    badgeText: '🍿 9위',
    description: '달궈진 프라이팬 위에서 쏟아지는 불꽃과 버터를 피해 생존하는 탄막 서바이벌!'
  },
  {
    id: 'tictactoe',
    title: '도촌 도넛 틱택토',
    category: '퍼즐',
    imageSrc: getThumb('donut-tictactoe.jpg'),
    isPlayable: true,
    badgeText: '🍩 10위',
    description: '벽을 뚫고 순환하는 도넛 토러스 룰과 달콤한 딸기/초코 도넛의 두뇌 대결!'
  },
  {
    id: 'champion',
    title: '도촌 챔피언 아일랜드',
    category: '어드벤처',
    imageSrc: getThumb('champion.jpg'),
    isPlayable: true,
    badgeText: '🥋 11위',
    description: '전설의 닌자 고양이 럭키와 함께 4대 스포츠 경기장에서 두루마리를 획득하고 섬의 챔피언이 되어보세요!'
  },
  {
    id: 'cricket',
    title: '도촌 크리켓',
    category: '스포츠',
    imageSrc: getThumb('cricket.jpg'),
    isPlayable: true,
    badgeText: '🏏 12위',
    description: '귀뚜라미 타자와 함께 달팽이 볼러의 마구를 쳐내고 통쾌한 6점 홈런을 날려보세요!'
  },
  {
    id: 'ponyexpress',
    title: '도촌 포니 익스프레스',
    category: '액션',
    imageSrc: getThumb('ponyexpress.jpg'),
    isPlayable: true,
    badgeText: '🐎 13위',
    description: '100통의 편지를 싣고 3개 레인의 황무지 사막과 설원을 질주하여 마을에 배달하세요!'
  },
  {
    id: 'jerrylawson',
    title: '도촌 제리 로슨',
    category: '액션',
    imageSrc: getThumb('jerrylawson.jpg'),
    isPlayable: true,
    badgeText: '🕹️ 14위',
    description: '비디오 게임 롬 카트리지의 아버지와 함께하는 8비트 레트로 모험 & 나만의 게임 만들기!'
  },
  {
    id: 'magic',
    title: '도촌 매직 캣 아카데미',
    category: '어드벤처',
    imageSrc: getThumb('magic.jpg'),
    isPlayable: true,
    badgeText: '🧙 15위',
    description: '마법 지팡이로 기호를 화면에 그려 침공한 유령들을 물리치고 대마법서를 되찾으세요!'
  },
  {
    id: 'fruitmerge',
    title: '도촌 과일 합치기',
    category: '퍼즐',
    imageSrc: getThumb('fruitmerge.jpg'),
    isPlayable: true,
    badgeText: '🍉 16위',
    description: '떨어지는 과일을 합쳐 거대한 도촌 수박을 만드는 초인기 2D 물리 합성 퍼즐!'
  },
  {
    id: 'brickbreaker',
    title: '도촌 벽돌 격파왕',
    category: '액션',
    imageSrc: getThumb('brickbreaker.jpg'),
    isPlayable: true,
    badgeText: '🧱 17위',
    description: '반사되는 공과 화려한 파워업 아이템으로 형형색색의 블록을 격파하는 클래식 아케이드!'
  },
  {
    id: 'skyjumper',
    title: '도촌 스카이 점퍼',
    category: '액션',
    imageSrc: getThumb('skyjumper.jpg'),
    isPlayable: true,
    badgeText: '🚀 18위',
    description: '발판을 딛고 하늘과 우주 끝까지 무한 점프하는 국민 점프 아케이드!'
  },
  {
    id: 'kidscoding',
    title: '도촌 코딩 토끼',
    category: '퍼즐',
    imageSrc: getThumb('kidscoding.jpg'),
    isPlayable: true,
    badgeText: '🥕 19위',
    description: '블록 코딩으로 토끼를 움직여 모든 당근을 수확하는 어린이 컴퓨팅 사고력 퍼즐!'
  },
  {
    id: 'bubbletea',
    title: '도촌 버블티 카페',
    category: '액션',
    imageSrc: getThumb('bubbletea.jpg'),
    isPlayable: true,
    badgeText: '🧋 20위',
    description: '귀여운 동물 손님들의 주문에 맞춰 쫀득한 펄과 달콤한 밀크티를 정량 채우는 힐링 타이쿤!'
  },
  {
    id: 'pizza',
    title: '도촌 피자 마스터',
    category: '퍼즐',
    imageSrc: getThumb('pizza.jpg'),
    isPlayable: true,
    badgeText: '🍕 21위',
    description: '손님의 주문에 맞게 피자를 정교하게 등분하여 분수와 기하학을 마스터하는 맛있는 수학 퍼즐!'
  },
  {
    id: 'earthbee',
    title: '도촌 꿀벌의 비행',
    category: '액션',
    imageSrc: getThumb('earthbee.jpg'),
    isPlayable: true,
    badgeText: '🐝 22위',
    description: '꽃가루를 묻혀 꽃을 피우고 도촌초 생태계를 가꾸는 구글 두들 모티브 힐링 비행 액션!'
  },
  {
    id: 'olympics',
    title: '도촌 미니 올림픽',
    category: '스포츠',
    imageSrc: getThumb('olympics.jpg'),
    isPlayable: true,
    badgeText: '🏅 23위',
    description: '100m 허들 달리기 · 3점슛 챌린지 · 급류 카누 슬라럼 3대 릴레이 스포츠 챔피언십!'
  },
  {
    id: 'pangolin',
    title: '도촌 천산갑의 모험',
    category: '어드벤처',
    imageSrc: getThumb('pangolin.jpg'),
    isPlayable: true,
    badgeText: '🦔 24위',
    description: '몸을 둥글게 말아 데굴데굴 질주하고 점프하는 구글 두들 모티브 4대 테마 횡스크롤 플랫폼 액션!'
  },
  {
    id: 'roswell',
    title: '도촌 UFO 탈출작전',
    category: '어드벤처',
    imageSrc: getThumb('roswell.jpg'),
    isPlayable: true,
    badgeText: '🛸 25위',
    description: '불시착한 외계인을 도와 흩어진 3대 부품을 찾아 UFO를 수리하고 탈출하는 포인트 앤 클릭 어드벤처!'
  },
  {
    id: 'petanque',
    title: '도촌 페탕크 마스터',
    category: '스포츠',
    imageSrc: getThumb('petanque.jpg'),
    isPlayable: true,
    badgeText: '🎯 26위',
    description: '노란 표적구(뷔슈)에 쇠구슬을 가깝게 붙이고 상대 공을 쳐내는 프랑스 전통 구기 스포츠 2.5D 물리 챌린지!'
  },
  {
    id: 'halfmoon',
    title: '반달 (Half Moon)',
    category: '카드',
    imageSrc: getThumb('halfmoon.jpg'),
    isPlayable: true,
    badgeText: '🌙 27위',
    description: '달의 8가지 위상(삭망월 주기)을 연결하고 보드를 점령하여 달의 정령 Luna를 이기는 천문 전략 카드 배틀!'
  },
  {
    id: 'panipuri',
    title: '파니 푸리 (Pani Puri)',
    category: '퍼즐',
    imageSrc: getThumb('panipuri.jpg'),
    isPlayable: true,
    badgeText: '🫓 28위',
    description: '바삭한 푸리에 4가지 맛있는 소스를 채워 손님들의 주문을 빠르게 서빙하는 인도 길거리 음식 타이쿤 퍼즐!'
  },
  {
    id: 'memory',
    title: '도촌 기억력 마스터',
    category: '퍼즐',
    imageSrc: getThumb('memory.jpg'),
    isPlayable: true,
    badgeText: '🧠 29위',
    description: '뒤집힌 카드의 짝을 맞추고 빛나는 멜로디의 순서를 기억하는 2가지 두뇌 트레이닝 퍼즐!'
  },
  {
    id: 'ghoulduel',
    title: '도촌 영혼 대결',
    category: '멀티',
    imageSrc: getThumb('ghoulduel.jpg'),
    isPlayable: true,
    badgeText: '👻 30위',
    description: '초록팀 vs 보라팀 4:4 실시간 대결! 영혼 불꽃을 모아 기지에 반납하고 상대 꼬리를 가로채세요!'
  },
  {
    id: 'snowball',
    title: '도촌 눈싸움 서바이벌',
    category: '멀티',
    imageSrc: getThumb('snowball.jpg'),
    isPlayable: true,
    badgeText: '☃️ 31위',
    description: '거대 눈덩이를 굴려 팽이처럼 상대를 밀쳐내고, 얼음이 깨지는 링 밖으로 날려버리는 실시간 서바이벌 배틀로얄!'
  },
  {
    id: 'schooltag',
    title: '도촌 야간 학교 숨바꼭질',
    category: '멀티',
    imageSrc: getThumb('schooltag.jpg'),
    isPlayable: true,
    badgeText: '🔦 NEW 32위',
    description: '불 꺼진 학교에서 손전등 빛과 발자국 소리만 감지하며 황금 열쇠 3개를 모아 비상구로 탈출하는 실시간 숨바꼭질!'
  }
];

export const COMING_SOON_GAMES = [
  {
    id: 'microkart',
    title: '도촌 마이크로 카트 레이싱',
    category: '멀티',
    imageSrc: getThumb('microkart.jpg'),
    isPlayable: false
  },
  {
    id: 'piratecoin',
    title: '도촌 해적선 코인 쟁탈전',
    category: '멀티',
    imageSrc: getThumb('piratecoin.jpg'),
    isPlayable: false
  },
  {
    id: 'bachai',
    title: '도촌 바흐 AI 작곡기',
    category: '퍼즐',
    imageSrc: getThumb('bachai.jpg'),
    isPlayable: false
  },
  {
    id: 'moogsynth',
    title: '도촌 레트로 신디사이저',
    category: '클래식',
    imageSrc: getThumb('moogsynth.jpg'),
    isPlayable: false
  },
  {
    id: 'rubikscube',
    title: '도촌 3D 루빅스 큐브',
    category: '퍼즐',
    imageSrc: getThumb('rubikscube.jpg'),
    isPlayable: false
  },
  {
    id: 'doctorwho',
    title: '도촌 타디스 탈출작전',
    category: '어드벤처',
    imageSrc: getThumb('doctorwho.jpg'),
    isPlayable: false
  },
  {
    id: 'turingmachine',
    title: '도촌 튜링 암호 머신',
    category: '퍼즐',
    imageSrc: getThumb('turingmachine.jpg'),
    isPlayable: false
  },
  {
    id: 'robotadventure',
    title: '도촌 로봇 사이버 어드벤처',
    category: '어드벤처',
    imageSrc: getThumb('robotadventure.jpg'),
    isPlayable: false
  }
];

export const CATEGORY_DEFINITIONS = [
  { id: 'ALL', label: '전체', icon: '🎮' },
  { id: 'FAVORITES', label: '즐겨찾기', icon: '❤️' },
  { id: '클래식', label: '클래식', icon: '👾' },
  { id: '액션', label: '액션', icon: '🏃' },
  { id: '퍼즐', label: '퍼즐', icon: '🧩' },
  { id: '카드', label: '카드', icon: '🃏' },
  { id: '스포츠', label: '스포츠', icon: '⚽' },
  { id: '어드벤처', label: '어드벤처', icon: '🗺️' },
  { id: '멀티', label: '멀티', icon: '👥' }
];

export const CATEGORIES = CATEGORY_DEFINITIONS.map(c => c.id);
