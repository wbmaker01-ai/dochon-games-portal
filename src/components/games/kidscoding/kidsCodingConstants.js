/**
 * Dochon Kids Coding (도촌 코딩 토끼) - Constants & Stage Configurations
 * Motivated by Google Doodle "Celebrating 50 Years of Kids Coding"
 */

export const DIRECTION = {
  UP: 0,
  RIGHT: 1,
  DOWN: 2,
  LEFT: 3
};

export const DIRECTION_DELTA = {
  [DIRECTION.UP]: { dx: 0, dy: -1, angle: 0 },
  [DIRECTION.RIGHT]: { dx: 1, dy: 0, angle: 90 },
  [DIRECTION.DOWN]: { dx: 0, dy: 1, angle: 180 },
  [DIRECTION.LEFT]: { dx: -1, dy: 0, angle: 270 }
};

export const TILE_TYPE = {
  EMPTY: 0,     // 낭떠러지 / 허공
  GRASS: 1,     // 일반 잔디 타일
  DIRT: 2,      // 당근 밭 타일 (부드러운 흙)
  WATER: 3,     // 물웅덩이 (진입 시 빠짐)
  STONE: 4      // 돌/장애물 (통과 불가)
};

export const BLOCK_TYPE = {
  FORWARD: 'FORWARD',
  TURN_LEFT: 'TURN_LEFT',
  TURN_RIGHT: 'TURN_RIGHT',
  LOOP: 'LOOP'
};

export const BLOCK_INFO = {
  [BLOCK_TYPE.FORWARD]: {
    id: BLOCK_TYPE.FORWARD,
    name: '앞으로 가기',
    symbol: '⬆️',
    color: '#3B82F6',       // Blue
    hoverColor: '#2563EB',
    iconColor: '#93C5FD',
    description: '토끼가 바라보는 방향으로 1칸 점프하여 이동합니다.'
  },
  [BLOCK_TYPE.TURN_LEFT]: {
    id: BLOCK_TYPE.TURN_LEFT,
    name: '왼쪽으로 돌기',
    symbol: '↪️',
    color: '#10B981',       // Emerald Green
    hoverColor: '#059669',
    iconColor: '#6EE7B7',
    description: '토끼가 왼쪽으로 90도 회전합니다.'
  },
  [BLOCK_TYPE.TURN_RIGHT]: {
    id: BLOCK_TYPE.TURN_RIGHT,
    name: '오른쪽으로 돌기',
    symbol: '↩️',
    color: '#F59E0B',       // Amber
    hoverColor: '#D97706',
    iconColor: '#FDE68A',
    description: '토끼가 오른쪽으로 90도 회전합니다.'
  },
  [BLOCK_TYPE.LOOP]: {
    id: BLOCK_TYPE.LOOP,
    name: '반복하기',
    symbol: '🔁',
    color: '#8B5CF6',       // Purple
    hoverColor: '#7C3AED',
    iconColor: '#C4B5FD',
    description: '내부의 블록들을 지정한 횟수만큼 반복해서 실행합니다.'
  }
};

/**
 * 8 점진적 교육 스테이지 정의
 */
export const STAGES = [
  {
    id: 1,
    title: '스테이지 1: 첫 번째 수확',
    subtitle: '앞으로 가기 블록으로 당근을 향해 깡총 뛰어보세요!',
    hint: '‘앞으로 가기’ 블록을 2개 조립하고 실행 버튼(▶️)을 누르세요.',
    gridWidth: 5,
    gridHeight: 3,
    grid: [
      [0, 0, 0, 0, 0],
      [0, 1, 2, 2, 0],
      [0, 0, 0, 0, 0]
    ],
    rabbit: { x: 1, y: 1, dir: DIRECTION.RIGHT },
    carrots: [
      { x: 2, y: 1, collected: false },
      { x: 3, y: 1, collected: false }
    ],
    allowedBlocks: [BLOCK_TYPE.FORWARD],
    targetBlocks: 2, // Optimal count
    clearScore: 200,
    optimalBonus: 100
  },
  {
    id: 2,
    title: '스테이지 2: 꺾인 길 돌파',
    subtitle: '오른쪽으로 돌기 블록을 사용하여 꺾인 길의 당근을 모으세요!',
    hint: '앞으로 간 뒤 오른쪽으로 회전하고 다시 앞으로 이동해보세요.',
    gridWidth: 5,
    gridHeight: 5,
    grid: [
      [0, 0, 0, 0, 0],
      [0, 1, 2, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 2, 0, 0],
      [0, 0, 0, 0, 0]
    ],
    rabbit: { x: 1, y: 1, dir: DIRECTION.RIGHT },
    carrots: [
      { x: 2, y: 1, collected: false },
      { x: 2, y: 3, collected: false }
    ],
    allowedBlocks: [BLOCK_TYPE.FORWARD, BLOCK_TYPE.TURN_RIGHT],
    targetBlocks: 4, // FORWARD, TURN_RIGHT, FORWARD, FORWARD
    clearScore: 250,
    optimalBonus: 150
  },
  {
    id: 3,
    title: '스테이지 3: 지그재그 탐험',
    subtitle: '좌우로 방향을 번갈아 바꾸며 당근을 모두 수확하세요!',
    hint: '좌회전과 우회전을 적절히 섞어 지그재그 길을 개척하세요.',
    gridWidth: 5,
    gridHeight: 5,
    grid: [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 2, 0],
      [0, 0, 2, 1, 0],
      [0, 1, 1, 0, 0],
      [0, 0, 0, 0, 0]
    ],
    rabbit: { x: 1, y: 3, dir: DIRECTION.RIGHT },
    carrots: [
      { x: 2, y: 2, collected: false },
      { x: 3, y: 1, collected: false }
    ],
    allowedBlocks: [BLOCK_TYPE.FORWARD, BLOCK_TYPE.TURN_LEFT, BLOCK_TYPE.TURN_RIGHT],
    targetBlocks: 6, // FORWARD, TURN_LEFT, FORWARD, TURN_RIGHT, FORWARD, TURN_LEFT, FORWARD
    clearScore: 300,
    optimalBonus: 150
  },
  {
    id: 4,
    title: '스테이지 4: 반복(Loop)의 마법',
    subtitle: '반복 블록을 활용하면 똑같은 동작을 단 몇 개의 블록으로 해결할 수 있어요!',
    hint: '반복하기(🔁 4회) 블록 안에 ‘앞으로 가기’ 블록을 쏙 넣어보세요!',
    gridWidth: 7,
    gridHeight: 3,
    grid: [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 1, 2, 2, 2, 2, 0],
      [0, 0, 0, 0, 0, 0, 0]
    ],
    rabbit: { x: 1, y: 1, dir: DIRECTION.RIGHT },
    carrots: [
      { x: 2, y: 1, collected: false },
      { x: 3, y: 1, collected: false },
      { x: 4, y: 1, collected: false },
      { x: 5, y: 1, collected: false }
    ],
    allowedBlocks: [BLOCK_TYPE.FORWARD, BLOCK_TYPE.LOOP],
    targetBlocks: 2, // 1 Loop + 1 Forward (Total 2)
    clearScore: 350,
    optimalBonus: 200
  },
  {
    id: 5,
    title: '스테이지 5: 계단 패턴 정복',
    subtitle: '계단처럼 반복되는 일정한 패턴을 찾아 루프로 묶어보세요.',
    hint: '[앞으로 -> 우회전 -> 앞으로 -> 좌회전] 세트를 2회 반복해보세요.',
    gridWidth: 6,
    gridHeight: 6,
    grid: [
      [0, 0, 0, 0, 2, 0],
      [0, 0, 0, 1, 1, 0],
      [0, 0, 2, 1, 0, 0],
      [0, 1, 1, 0, 0, 0],
      [0, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0]
    ],
    rabbit: { x: 1, y: 4, dir: DIRECTION.UP },
    carrots: [
      { x: 2, y: 2, collected: false },
      { x: 4, y: 0, collected: false }
    ],
    allowedBlocks: [BLOCK_TYPE.FORWARD, BLOCK_TYPE.TURN_LEFT, BLOCK_TYPE.TURN_RIGHT, BLOCK_TYPE.LOOP],
    targetBlocks: 5, // Loop(2, [FORWARD, TURN_RIGHT, FORWARD, TURN_LEFT])
    clearScore: 400,
    optimalBonus: 250
  },
  {
    id: 6,
    title: '스테이지 6: 사각 순환 회랑',
    subtitle: '네 모서리를 회전하며 도는 사각형 둘레의 당근을 모두 수확하세요!',
    hint: '[앞으로 2칸 -> 우회전] 동작을 4회 반복하면 완벽한 사각 순환이 완성됩니다.',
    gridWidth: 5,
    gridHeight: 5,
    grid: [
      [0, 0, 0, 0, 0],
      [0, 1, 2, 1, 0],
      [0, 2, 0, 2, 0],
      [0, 1, 2, 1, 0],
      [0, 0, 0, 0, 0]
    ],
    rabbit: { x: 1, y: 1, dir: DIRECTION.RIGHT },
    carrots: [
      { x: 2, y: 1, collected: false },
      { x: 3, y: 2, collected: false },
      { x: 2, y: 3, collected: false },
      { x: 1, y: 2, collected: false }
    ],
    allowedBlocks: [BLOCK_TYPE.FORWARD, BLOCK_TYPE.TURN_RIGHT, BLOCK_TYPE.LOOP],
    targetBlocks: 4, // Loop(4, [FORWARD, FORWARD, TURN_RIGHT])
    clearScore: 450,
    optimalBonus: 300
  },
  {
    id: 7,
    title: '스테이지 7: 나선형 미로',
    subtitle: '중심을 향해 점점 좁아지는 나선형 타일 길을 완벽하게 주파하세요!',
    hint: '외곽에서 안쪽으로 회전하며 들어갈 때 필요한 스텝을 계산해보세요.',
    gridWidth: 6,
    gridHeight: 6,
    grid: [
      [0, 0, 0, 0, 0, 0],
      [0, 1, 2, 1, 2, 0],
      [0, 0, 0, 0, 2, 0],
      [0, 2, 2, 0, 1, 0],
      [0, 1, 1, 2, 1, 0],
      [0, 0, 0, 0, 0, 0]
    ],
    rabbit: { x: 1, y: 1, dir: DIRECTION.RIGHT },
    carrots: [
      { x: 2, y: 1, collected: false },
      { x: 4, y: 1, collected: false },
      { x: 4, y: 2, collected: false },
      { x: 3, y: 4, collected: false },
      { x: 1, y: 3, collected: false },
      { x: 2, y: 3, collected: false }
    ],
    allowedBlocks: [BLOCK_TYPE.FORWARD, BLOCK_TYPE.TURN_RIGHT, BLOCK_TYPE.LOOP],
    targetBlocks: 7,
    clearScore: 500,
    optimalBonus: 350
  },
  {
    id: 8,
    title: '스테이지 8: 도촌 코딩 마스터',
    subtitle: '물웅덩이와 돌 장애물을 피해 당근을 가장 효율적인 코드로 수확하세요!',
    hint: '장애물에 부딪히지 않도록 최적의 경로를 설계하고 루프를 과감하게 활용하세요!',
    gridWidth: 7,
    gridHeight: 7,
    grid: [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 1, 2, 1, 2, 1, 0],
      [0, 2, 3, 4, 3, 2, 0],
      [0, 1, 4, 2, 4, 1, 0],
      [0, 2, 3, 4, 3, 2, 0],
      [0, 1, 2, 1, 2, 1, 0],
      [0, 0, 0, 0, 0, 0, 0]
    ],
    rabbit: { x: 1, y: 1, dir: DIRECTION.RIGHT },
    carrots: [
      { x: 2, y: 1, collected: false },
      { x: 4, y: 1, collected: false },
      { x: 1, y: 2, collected: false },
      { x: 5, y: 2, collected: false },
      { x: 3, y: 3, collected: false },
      { x: 1, y: 4, collected: false },
      { x: 5, y: 4, collected: false },
      { x: 2, y: 5, collected: false },
      { x: 4, y: 5, collected: false }
    ],
    allowedBlocks: [BLOCK_TYPE.FORWARD, BLOCK_TYPE.TURN_LEFT, BLOCK_TYPE.TURN_RIGHT, BLOCK_TYPE.LOOP],
    targetBlocks: 6,
    clearScore: 700,
    optimalBonus: 500
  }
];
