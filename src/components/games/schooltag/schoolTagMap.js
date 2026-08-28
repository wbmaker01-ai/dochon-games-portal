// Dochon Games Portal - School Tag Map Generator & Grid Layout
// Dochon Elementary School Layout (Classrooms, Science Lab, Music Room, Infirmary, Exit)

import { SCHOOL_TAG_CONSTANTS } from './schoolTagConstants';

export const TILE_TYPES = {
  FLOOR: 0,
  WALL: 1,
  DESK: 2,
  LOCKER: 3,
  JAIL: 4,
  EXIT_GATE: 5,
};

// 26 Columns x 18 Rows Grid Map
// 0: Floor, 1: Outer/Inner Walls, 2: Classroom Desks, 3: Lockers, 4: Infirmary Bed, 5: Exit Gate
export const RAW_MAP_DATA = [
  // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
  [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ], // 0
  [ 1, 0, 0, 2, 0, 1, 0, 0, 2, 0, 2, 0, 1, 1, 0, 2, 0, 2, 0, 1, 0, 0, 2, 0, 0, 1 ], // 1
  [ 1, 0, 2, 0, 0, 1, 0, 2, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 2, 0, 2, 0, 1 ], // 2
  [ 1, 3, 0, 0, 0, 1, 0, 0, 2, 0, 2, 0, 0, 0, 0, 2, 0, 2, 0, 1, 0, 0, 0, 0, 3, 1 ], // 3
  [ 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1 ], // 4  (Doorways)
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ], // 5  (Upper Hallway)
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ], // 6  (Upper Hallway)
  [ 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1 ], // 7  (Middle Partition)
  [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ], // 8  (Special Rooms)
  [ 1, 3, 2, 0, 0, 1, 0, 2, 2, 0, 1, 0, 0, 0, 0, 1, 0, 4, 4, 0, 1, 0, 2, 2, 3, 1 ], // 9  (Jail is in col 17-18)
  [ 1, 0, 0, 2, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 4, 4, 0, 1, 0, 0, 0, 0, 1 ], // 10 (Infirmary Beds)
  [ 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1 ], // 11 (Lower Partition)
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ], // 12 (Lower Hallway)
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ], // 13 (Lower Hallway)
  [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 5, 5, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ], // 14 (Exit Area Wall)
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ], // 15 (Main Entrance Lobby)
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ], // 16 (Exit Target Pad)
  [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ], // 17
];

export const ROOM_LABELS = [
  { name: '1학년 1반', col: 2, row: 1 },
  { name: '과학실', col: 8, row: 1 },
  { name: '음악실', col: 15, row: 1 },
  { name: '도서관', col: 21, row: 1 },
  { name: '컴퓨터실', col: 2, row: 8 },
  { name: '방송실', col: 8, row: 8 },
  { name: '보건실 (수감실)', col: 17, row: 8 },
  { name: '교무실', col: 22, row: 8 },
  { name: '중앙현관 비상구', col: 12, row: 15 },
];

export const KEY_SPAWN_CANDIDATES = [
  { col: 3, row: 2, room: '1학년 1반' },
  { col: 9, row: 3, room: '과학실' },
  { col: 16, row: 2, room: '음악실' },
  { col: 22, row: 3, room: '도서관' },
  { col: 3, row: 10, room: '컴퓨터실' },
  { col: 8, row: 10, room: '방송실' },
  { col: 23, row: 10, room: '교무실' },
];

export function createSchoolMap() {
  const { TILE_SIZE, MAP_COLS, MAP_ROWS } = SCHOOL_TAG_CONSTANTS;
  const grid = [];
  const walls = [];
  const lockers = [];
  const jailBeds = [];
  let exitGate = null;

  for (let r = 0; r < MAP_ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < MAP_COLS; c++) {
      const type = RAW_MAP_DATA[r] ? RAW_MAP_DATA[r][c] || 0 : 0;
      grid[r][c] = type;

      const x = c * TILE_SIZE;
      const y = r * TILE_SIZE;

      if (type === TILE_TYPES.WALL || type === TILE_TYPES.DESK) {
        walls.push({
          x,
          y,
          w: TILE_SIZE,
          h: TILE_SIZE,
          isDesk: type === TILE_TYPES.DESK,
        });
      } else if (type === TILE_TYPES.LOCKER) {
        lockers.push({
          id: `locker_${c}_${r}`,
          x: x + TILE_SIZE / 2,
          y: y + TILE_SIZE / 2,
          col: c,
          row: r,
          occupiedBy: null,
        });
      } else if (type === TILE_TYPES.JAIL) {
        jailBeds.push({
          x: x + TILE_SIZE / 2,
          y: y + TILE_SIZE / 2,
          col: c,
          row: r,
        });
      } else if (type === TILE_TYPES.EXIT_GATE) {
        if (!exitGate) {
          exitGate = {
            x: 12 * TILE_SIZE,
            y: 14 * TILE_SIZE,
            w: 2 * TILE_SIZE,
            h: 3 * TILE_SIZE,
            isOpen: false,
          };
        }
      }
    }
  }

  // Pre-generate Wall Line Segments for Fast Raycasting
  const segments = [];
  walls.forEach((w) => {
    // Top
    segments.push({ a: { x: w.x, y: w.y }, b: { x: w.x + w.w, y: w.y } });
    // Right
    segments.push({ a: { x: w.x + w.w, y: w.y }, b: { x: w.x + w.w, y: w.y + w.h } });
    // Bottom
    segments.push({ a: { x: w.x + w.w, y: w.y + w.h }, b: { x: w.x, y: w.y + w.h } });
    // Left
    segments.push({ a: { x: w.x, y: w.y + w.h }, b: { x: w.x, y: w.y } });
  });

  return {
    grid,
    walls,
    segments,
    lockers,
    jailBeds,
    exitGate,
    width: MAP_COLS * TILE_SIZE,
    height: MAP_ROWS * TILE_SIZE,
    tileSize: TILE_SIZE,
  };
}

// Select 3 Unique Random Spawn Points for Golden Keys
export function pickRandomKeyLocations(count = 3) {
  const shuffled = [...KEY_SPAWN_CANDIDATES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map((item, idx) => ({
    id: `key_${idx + 1}`,
    col: item.col,
    row: item.row,
    x: (item.col + 0.5) * SCHOOL_TAG_CONSTANTS.TILE_SIZE,
    y: (item.row + 0.5) * SCHOOL_TAG_CONSTANTS.TILE_SIZE,
    room: item.room,
    isCollected: false,
  }));
}
