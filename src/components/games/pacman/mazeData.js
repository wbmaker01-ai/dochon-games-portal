// Dochon Pac-Man Maze Data - Spells out "DOCHON" in maze wall tiles
// Tile values:
// 1 = Wall (Forms D-O-C-H-O-N letters and borders)
// 2 = Dot / Cookie (Gold Star)
// 3 = Power Pellet (Dochon School Lunch Burger)
// 0 = Empty Corridor / Teleport Portal (Walkable, no dot)
// 9 = Ghost House Interior

export const DOCHON_MAZE_GRID = [
  // Row 0: Top outer wall (33 tiles)
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],

  // Row 1: Top corridor with Power Pellets at corners (33 tiles)
  [1,3,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,2,3,1],

  // Row 2: "D O C H O N" - Top edge of letters (33 tiles)
  [1,2, 1,1,1,0, 2, 0,1,1,0, 2, 0,1,1,1, 2, 1,0,0,1, 2, 0,1,1,0, 2, 1,0,0,1, 2,1],

  // Row 3: "D O C H O N" - Upper loop (33 tiles)
  [1,2, 1,0,0,1, 2, 1,0,0,1, 2, 1,0,0,0, 2, 1,0,0,1, 2, 1,0,0,1, 2, 1,1,0,1, 2,1],

  // Row 4: "D O C H O N" - Middle crossbar (33 tiles)
  [1,2, 1,0,0,1, 2, 1,0,0,1, 2, 1,0,0,0, 2, 1,1,1,1, 2, 1,0,0,1, 2, 1,0,1,1, 2,1],

  // Row 5: "D O C H O N" - Lower loop (33 tiles)
  [1,2, 1,0,0,1, 2, 1,0,0,1, 2, 1,0,0,0, 2, 1,0,0,1, 2, 1,0,0,1, 2, 1,0,0,1, 2,1],

  // Row 6: "D O C H O N" - Bottom edge of letters (33 tiles)
  [1,2, 1,1,1,0, 2, 0,1,1,0, 2, 0,1,1,1, 2, 1,0,0,1, 2, 0,1,1,0, 2, 1,0,0,1, 2,1],

  // Row 7: 5-Tile Teleport Zone Row 1 (Col 0 = Left Open, Col 32 = Right Open) (33 tiles)
  [0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0],

  // Row 8: 5-Tile Teleport Zone Row 2 (Col 0 = Left Open, Col 32 = Right Open) (33 tiles)
  [0,0, 1,1,1, 2, 1,1,1, 2, 1, 1,1,9,9,9,9,9,1,1, 1, 2, 1,1,1, 2, 1,1,1, 2,0,0],

  // Row 9: 5-Tile Teleport Zone Row 3 (Col 0 = Left Open, Col 32 = Right Open) (33 tiles)
  [0,0, 2,2,2, 2, 2,2,2, 2, 1, 1,1,9,9,9,9,9,1,1, 1, 2, 2,2,2, 2, 2,2,2, 2,0,0],

  // Row 10: 5-Tile Teleport Zone Row 4 (Col 0 = Left Open, Col 32 = Right Open) (33 tiles)
  [0,0, 1,1,1, 2, 1,1,1, 2, 1, 1,1,1,0,0,0,1,1,1, 1, 2, 1,1,1, 2, 1,1,1, 2,0,0],

  // Row 11: 5-Tile Teleport Zone Row 5 (Col 0 = Left Open, Col 32 = Right Open) (33 tiles)
  [0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0],

  // Row 12: Sub-maze obstacles (33 tiles)
  [1,2, 1,1,1,2, 1,1,1,2, 1,1,1,2, 1,1,1,2, 1,1,1,2, 1,1,1,2, 1,1,1, 2,2,1],

  // Row 13: Sub-maze inner corridors (33 tiles)
  [1,2, 1,0,1,2, 1,0,1,2, 1,0,1,2, 1,0,1,2, 1,0,1,2, 1,0,1,2, 1,0,1, 2,2,1],

  // Row 14: Sub-maze lower walls (33 tiles)
  [1,2, 1,1,1,2, 1,1,1,2, 1,1,1,2, 1,1,1,2, 1,1,1,2, 1,1,1,2, 1,1,1, 2,2,1],

  // Row 15: Lower corridor (33 tiles)
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],

  // Row 16: Bottom obstacles with Power Pellets (33 tiles)
  [1,3, 1,1,1,2, 1,1,1,2, 1,1,1,2, 1,1,1,2, 1,1,1,2, 1,1,1,2, 1,1,1, 2,3,1],

  // Row 17: Bottom-most corridor (33 tiles)
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],

  // Row 18: Bottom outer wall (33 tiles)
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

export const TILE_SIZE = 24;
export const COLS = 33;
export const ROWS = 19;

// Letter coordinates for visual highlight tags in Canvas header
export const LETTER_REGIONS = [
  { letter: 'D', startCol: 2, endCol: 5 },
  { letter: 'O', startCol: 7, endCol: 10 },
  { letter: 'C', startCol: 12, endCol: 15 },
  { letter: 'H', startCol: 17, endCol: 20 },
  { letter: 'O', startCol: 22, endCol: 25 },
  { letter: 'N', startCol: 27, endCol: 30 }
];
