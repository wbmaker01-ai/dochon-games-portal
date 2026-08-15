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
    badgeText: '🔥 인기 1위'
  },
  {
    id: 'dino',
    title: '도촌 공룡 달리기',
    category: '액션',
    imageSrc: getThumb('dino.jpg'),
    isPlayable: true,
    badgeText: '🦖 2위'
  },
  {
    id: 'snake',
    title: '도촌 스네이크',
    category: '클래식',
    imageSrc: getThumb('snake.jpg'),
    isPlayable: true,
    badgeText: '🐍 NEW 3위'
  }
];

export const COMING_SOON_GAMES = [
  {
    id: 'solitaire',
    title: '솔리테어',
    category: '카드',
    imageSrc: getThumb('solitaire.jpg'),
    isPlayable: false
  },
  {
    id: 'minesweeper',
    title: '지뢰찾기',
    category: '퍼즐',
    imageSrc: getThumb('minesweeper.jpg'),
    isPlayable: false
  },
  {
    id: 'baseball',
    title: '야구',
    category: '스포츠',
    imageSrc: getThumb('baseball.jpg'),
    isPlayable: false
  },
  {
    id: 'gnome',
    title: '정원 요정',
    category: '액션',
    imageSrc: getThumb('gnome.jpg'),
    isPlayable: false
  },
  {
    id: 'colortile',
    title: '컬러 타일',
    category: '퍼즐',
    imageSrc: getThumb('colortile.jpg'),
    isPlayable: false
  },
  {
    id: 'popcorn',
    title: '팝콘',
    category: '멀티플레이어',
    imageSrc: getThumb('popcorn.jpg'),
    isPlayable: false
  },
  {
    id: 'tictactoe',
    title: '틱택고',
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

export const CATEGORIES = ['ALL', '클래식', '액션', '퍼즐', '카드', '스포츠', '어드벤처', '멀티플레이어'];
