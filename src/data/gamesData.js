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
    id: 'gnome',
    title: '도촌 정원 요정',
    category: '액션',
    imageSrc: getThumb('gnome.jpg'),
    isPlayable: true,
    badgeText: '🌿 7위',
    description: '투석기로 요정을 힘차게 날려 꽃을 심고 최고 비행 거리를 달성하세요!'
  },
  {
    id: 'colortile',
    title: '도촌 컬러 타일',
    category: '퍼즐',
    imageSrc: getThumb('colortile.jpg'),
    isPlayable: true,
    badgeText: '🧩 NEW 8위',
    description: '빈 칸을 클릭하여 십자 방향 같은 색 타일을 찾아 없애는 도촌 두뇌 퍼즐!'
  }
];

export const COMING_SOON_GAMES = [
  {
    id: 'popcorn',
    title: '팝콘',
    category: '멀티플레이어',
    imageSrc: getThumb('popcorn.jpg'),
    isPlayable: false
  },
  {
    id: 'tictactoe',
    title: '틱택토',
    category: '퍼즐',
    imageSrc: getThumb('tictactoe.jpg'),
    isPlayable: false
  },
  {
    id: 'champion',
    title: '챔피언 아일랜드',
    category: '어드벤처',
    imageSrc: getThumb('champion.jpg'),
    isPlayable: false
  },
  {
    id: 'cricket',
    title: '크리켓',
    category: '스포츠',
    imageSrc: getThumb('cricket.jpg'),
    isPlayable: false
  },
  {
    id: 'jerrylawson',
    title: 'Jerry Lawson',
    category: '액션',
    imageSrc: getThumb('jerrylawson.jpg'),
    isPlayable: false
  },
  {
    id: 'ponyexpress',
    title: '포니 익스프레스',
    category: '액션',
    imageSrc: getThumb('ponyexpress.jpg'),
    isPlayable: false
  },
  {
    id: 'magic',
    title: '할로윈',
    category: '어드벤처',
    imageSrc: getThumb('magic.jpg'),
    isPlayable: false
  },
  {
    id: 'petanque',
    title: '페탕크',
    category: '스포츠',
    imageSrc: getThumb('petanque.jpg'),
    isPlayable: false
  },
  {
    id: 'halfmoon',
    title: '반달',
    category: '카드',
    imageSrc: getThumb('halfmoon.jpg'),
    isPlayable: false
  },
  {
    id: 'panipuri',
    title: '파니 푸리',
    category: '퍼즐',
    imageSrc: getThumb('panipuri.jpg'),
    isPlayable: false
  },
  {
    id: 'memory',
    title: '기억력 게임',
    category: '퍼즐',
    imageSrc: getThumb('memory.jpg'),
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
  { id: '멀티플레이어', label: '멀티', icon: '👥' }
];

export const CATEGORIES = CATEGORY_DEFINITIONS.map(c => c.id);
