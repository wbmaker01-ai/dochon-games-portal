// Champion Island (도촌 챔피언 아일랜드) Game Constants & Map Definitions

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 500;

// 4 Teams of Champion Island
export const TEAMS = [
  {
    id: 'kitsune',
    name: '키츠네 팀 (팀 레드)',
    color: '#EF4444',
    icon: '🦊',
    animal: '여우',
    motto: '열정과 불꽃의 승부사'
  },
  {
    id: 'ushi',
    name: '우시 팀 (팀 블루)',
    color: '#3B82F6',
    icon: '🐂',
    animal: '황소',
    motto: '흔들리지 않는 굳센 체력'
  },
  {
    id: 'inari',
    name: '이나리 팀 (팀 옐로우)',
    color: '#F59E0B',
    icon: '⚡',
    animal: '번개여우',
    motto: '빛처럼 빠른 민첩성과 재치'
  },
  {
    id: 'kappa',
    name: '갓파 팀 (팀 그린)',
    color: '#10B981',
    icon: '🐢',
    animal: '갓파',
    motto: '바다와 숲의 조화로운 지혜'
  }
];

// 4 Sacred Sports & Champions
export const SPORTS = {
  TABLE_TENNIS: {
    id: 'table_tennis',
    name: '탁구 (Table Tennis)',
    boss: '텐구 (Tengu)',
    bossIcon: '👺',
    area: '도조 경기장',
    color: '#EF4444',
    scrollName: '바람의 탁구 두루마리',
    targetScore: 500,
    desc: '텐구의 변화무쌍한 스핀 서브와 스매시를 받아치고 랠리를 이어가세요!'
  },
  ARCHERY: {
    id: 'archery',
    name: '양궁 (Archery)',
    boss: '요이치 (Yoichi)',
    bossIcon: '🎯',
    area: '안개 호수 사격장',
    color: '#F59E0B',
    scrollName: '명사수의 양궁 두루마리',
    targetScore: 100,
    desc: '움직이는 표적과 바람을 계산하여 과녁을 명중시키고 100점 이상을 달성하세요!'
  },
  MARATHON: {
    id: 'marathon',
    name: '마라톤 (Marathon)',
    boss: '갓파 (Kappa)',
    bossIcon: '🐢',
    area: '백사장 해안 레이스',
    color: '#10B981',
    scrollName: '질풍의 마라톤 두루마리',
    targetScore: 700,
    desc: '게와 모래 웅덩이를 피하고 수박 부스트를 획득하여 갓파를 제치고 1등으로 완주하세요!'
  },
  CLIMBING: {
    id: 'climbing',
    name: '클라이밍 (Climbing)',
    boss: '후쿠로우 (Fukuro)',
    bossIcon: '🦉',
    area: '빙설 화산 봉우리',
    color: '#8B5CF6',
    scrollName: '정복자의 등반 두루마리',
    targetScore: 800,
    desc: '암벽 홀드를 빠르게 타고 오르며 떨어지는 낙석과 눈보라를 회피하여 정상에 깃발을 꽂으세요!'
  }
};

// Overworld Map 25x16 Grid Layout
export const MAP_COLS = 25;
export const MAP_ROWS = 16;
export const TILE_SIZE = 32;

// Tile Types for Canvas Rendering
export const TILES = {
  GRASS: 0,
  PATH: 1,
  WATER: 2,
  SAND: 3,
  SNOW: 4,
  TREE: 5,
  TORII_GATE: 6,
  ARENA_PINGPONG: 7,
  ARENA_ARCHERY: 8,
  ARENA_MARATHON: 9,
  ARENA_CLIMBING: 10,
  SHRINE: 11,
  DOJO_WALL: 12,
  BRIDGE: 13,
  LANTERN: 14
};

// Pre-defined Overworld Map Grid
export const OVERWORLD_MAP = [
  [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 10, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1, 1, 1, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  [4, 4, 4, 5, 5, 5, 5, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 5, 5, 5, 5, 4, 4, 4, 4],
  [5, 5, 7, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 8, 5, 5, 5, 5],
  [5, 5, 1, 0, 0, 0, 5, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 5, 5, 5, 5],
  [0, 0, 1, 0, 14, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 14, 0, 0, 0, 1, 0, 0, 2, 2, 2],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 6, 1, 1, 11, 1, 1, 6, 1, 1, 1, 1, 0, 2, 2, 2, 2],
  [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 2, 2, 2, 2],
  [0, 0, 5, 5, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 5, 5, 0, 2, 2, 2, 2],
  [3, 3, 3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 3, 13, 2, 2, 2],
  [3, 3, 3, 3, 3, 3, 1, 3, 3, 3, 3, 3, 1, 3, 3, 3, 3, 3, 3, 3, 3, 1, 2, 2, 2],
  [3, 9, 1, 1, 1, 1, 1, 3, 3, 3, 3, 3, 1, 3, 3, 3, 3, 3, 3, 3, 3, 1, 2, 2, 2],
  [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 3, 3, 3, 3, 3, 3, 3, 3, 1, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 1, 3, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
];

// NPCs in the Overworld
export const NPCS = [
  {
    id: 'master_shrine',
    name: '성소의 장로',
    tileX: 12,
    tileY: 5,
    icon: '🧙‍♂️',
    speech: '용감한 닌자 고양이 럭키여! 섬의 4대 챔피언을 물리치고 4개의 성스러운 두루마리를 모아 섬의 진정한 전설이 되어보게나!'
  },
  {
    id: 'team_captain',
    name: '도촌 응원단장',
    tileX: 8,
    tileY: 6,
    icon: '📣',
    speech: '우리 팀의 승리를 위해 멋진 플레이를 보여줘! 미니게임에서 높은 점수를 낼수록 명예의 전당 랭킹이 올라가!'
  },
  {
    id: 'beach_guard',
    name: '해변 안전요원',
    tileX: 6,
    tileY: 10,
    icon: '🦀',
    speech: '남쪽 해변은 마라톤 경기장이야! 꽃게와 깊은 모래를 조심하고 수박 부스트를 놓치지 마!'
  },
  {
    id: 'mountain_guide',
    name: '설산 등반가',
    tileX: 14,
    tileY: 2,
    icon: '🧗',
    speech: '북쪽 정상은 빙설 화산 클라이밍 구역이야! 날아오는 얼음 덩어리를 잘 피해야 떨어지지 않아!'
  }
];
