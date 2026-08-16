// Dochon Color Tile Game Engine & Logic
import { GRID_SIZE, DEFAULT_SPAWN_RATE, TILE_COLORS } from './colortileConstants';

/**
 * Creates a new random board with balanced tile pairs
 */
export function createInitialBoard(gridSize = GRID_SIZE, spawnRate = DEFAULT_SPAWN_RATE) {
  const totalCells = gridSize * gridSize;
  const targetTiles = Math.floor(totalCells * spawnRate);
  
  // Make targetTiles an even number to ensure pairs
  const numPairs = Math.floor(targetTiles / 2);
  
  let board = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
  
  // Generate pairs of color IDs
  const tilePool = [];
  for (let i = 0; i < numPairs; i++) {
    const randomColor = TILE_COLORS[Math.floor(Math.random() * TILE_COLORS.length)];
    tilePool.push(randomColor.id, randomColor.id);
  }
  
  // Shuffle tile pool
  for (let i = tilePool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tilePool[i], tilePool[j]] = [tilePool[j], tilePool[i]];
  }
  
  // Get all coordinates and shuffle
  const coords = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      coords.push({ r, c });
    }
  }
  for (let i = coords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [coords[i], coords[j]] = [coords[j], coords[i]];
  }
  
  // Place tiles
  for (let i = 0; i < tilePool.length && i < coords.length; i++) {
    const { r, c } = coords[i];
    board[r][c] = tilePool[i];
  }
  
  // Ensure board has at least some initial valid moves
  let validMoves = findValidMoves(board);
  let retryCount = 0;
  while (validMoves.length < 3 && retryCount < 10) {
    board = shuffleExistingTiles(board);
    validMoves = findValidMoves(board);
    retryCount++;
  }
  
  return board;
}

/**
 * Raycasts in 4 directions from (row, col) to find the first encountered tile in each direction.
 */
export function findFirstTilesIn4Directions(board, row, col) {
  const gridSize = board.length;
  const directions = [
    { name: 'up', dr: -1, dc: 0 },
    { name: 'down', dr: 1, dc: 0 },
    { name: 'left', dr: 0, dc: -1 },
    { name: 'right', dr: 0, dc: 1 }
  ];

  const foundTiles = [];

  for (const { name, dr, dc } of directions) {
    let currR = row + dr;
    let currC = col + dc;

    while (currR >= 0 && currR < gridSize && currC >= 0 && currC < gridSize) {
      if (board[currR][currC] !== null) {
        foundTiles.push({
          dir: name,
          r: currR,
          c: currC,
          colorId: board[currR][currC],
          distance: Math.abs(currR - row) + Math.abs(currC - col)
        });
        break; // Stop at first tile found
      }
      currR += dr;
      currC += dc;
    }
  }

  return foundTiles;
}

/**
 * Evaluates whether clicking (row, col) triggers a match.
 * Returns matching tiles and ray traces.
 */
export function getMatchingTilesForCell(board, row, col) {
  if (board[row][col] !== null) {
    return { matched: false, matchedTiles: [], rays: [], allHitTiles: [] };
  }

  const hitTiles = findFirstTilesIn4Directions(board, row, col);
  
  // Group hit tiles by colorId
  const colorMap = new Map();
  for (const tile of hitTiles) {
    if (!colorMap.has(tile.colorId)) {
      colorMap.set(tile.colorId, []);
    }
    colorMap.get(tile.colorId).push(tile);
  }

  // Collect all groups with >= 2 tiles
  const matchedTiles = [];
  const matchedRays = [];

  for (const [colorId, tiles] of colorMap.entries()) {
    if (tiles.length >= 2) {
      for (const t of tiles) {
        matchedTiles.push(t);
        matchedRays.push({
          fromR: row,
          fromC: col,
          toR: t.r,
          toC: t.c,
          dir: t.dir,
          colorId: colorId
        });
      }
    }
  }

  return {
    matched: matchedTiles.length >= 2,
    matchedTiles,
    rays: matchedRays,
    allHitTiles: hitTiles
  };
}

/**
 * Finds all currently possible matching moves on the board.
 */
export function findValidMoves(board) {
  const gridSize = board.length;
  const validMoves = [];

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (board[r][c] === null) {
        const result = getMatchingTilesForCell(board, r, c);
        if (result.matched) {
          validMoves.push({
            r,
            c,
            matchCount: result.matchedTiles.length,
            matchedTiles: result.matchedTiles
          });
        }
      }
    }
  }

  return validMoves;
}

/**
 * Finds the single best hint move (prioritizing 3+ matches or closest pairs)
 */
export function getHintMove(board) {
  const moves = findValidMoves(board);
  if (moves.length === 0) return null;

  // Sort by matchCount descending
  moves.sort((a, b) => b.matchCount - a.matchCount);
  return moves[0];
}

/**
 * Counts total remaining tiles on the board
 */
export function countRemainingTiles(board) {
  let count = 0;
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] !== null) count++;
    }
  }
  return count;
}

/**
 * Shuffles all existing tiles into random vacant positions
 */
export function shuffleExistingTiles(board) {
  const gridSize = board.length;
  const existingTiles = [];

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (board[r][c] !== null) {
        existingTiles.push(board[r][c]);
      }
    }
  }

  // Shuffle tile values
  for (let i = existingTiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [existingTiles[i], existingTiles[j]] = [existingTiles[j], existingTiles[i]];
  }

  // Get all coordinates
  const coords = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      coords.push({ r, c });
    }
  }
  for (let i = coords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [coords[i], coords[j]] = [coords[j], coords[i]];
  }

  const newBoard = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
  for (let i = 0; i < existingTiles.length && i < coords.length; i++) {
    const { r, c } = coords[i];
    newBoard[r][c] = existingTiles[i];
  }

  return newBoard;
}

// ----------------------------------------------------
// Web Audio API Sound Effects Synthesizer
// ----------------------------------------------------
class ColorTileAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
  }

  // Soft Hover / Click Tick
  playTick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.04);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  // Pleasant Match Chime (Ascending with combo)
  playMatch(combo = 1, matchCount = 2) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const baseFreqs = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 783.99, 1046.50];
      const scaleIndex = Math.min((combo - 1) % baseFreqs.length, baseFreqs.length - 2);
      const rootFreq = baseFreqs[scaleIndex];
      const thirdFreq = rootFreq * 1.25; // Major third
      const fifthFreq = rootFreq * 1.5;  // Perfect fifth
      const octaveFreq = rootFreq * 2.0; // Octave

      const now = this.ctx.currentTime;
      const notes = matchCount >= 4 
        ? [rootFreq, thirdFreq, fifthFreq, octaveFreq] 
        : matchCount === 3 
          ? [rootFreq, thirdFreq, fifthFreq] 
          : [rootFreq, fifthFreq];

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + idx * 0.04;
        const duration = matchCount >= 3 ? 0.35 : 0.25;

        osc.type = matchCount >= 3 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.02, startTime + duration);

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch (e) {}
  }

  // Miss / Penalty sound (Gentle thud)
  playMiss() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  // Sparkle / Hint Sound
  playHint() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + idx * 0.05;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.2);
      });
    } catch (e) {}
  }

  // Shuffle Whoosh Sound
  playShuffle() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [300, 450, 600, 400, 550, 700].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + idx * 0.04;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.8, startTime + 0.08);

        gain.gain.setValueAtTime(0.06, startTime);
        gain.gain.linearRampToValueAtTime(0.001, startTime + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.08);
      });
    } catch (e) {}
  }

  // Game Over Sound
  playGameOver() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [440, 392, 349.23, 329.63, 293.66].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + idx * 0.12;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.1, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.25);
      });
    } catch (e) {}
  }

  // All Cleared Victory Sound
  playVictory() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const fanfare = [
        { f: 523.25, d: 0.12 },
        { f: 523.25, d: 0.12 },
        { f: 523.25, d: 0.12 },
        { f: 659.25, d: 0.35 },
        { f: 587.33, d: 0.15 },
        { f: 659.25, d: 0.15 },
        { f: 783.99, d: 0.6 }
      ];

      let cumulativeTime = 0;
      fanfare.forEach(({ f, d }) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + cumulativeTime;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, startTime);

        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + d);

        cumulativeTime += d * 0.85;
      });
    } catch (e) {}
  }
}

export const soundManager = new ColorTileAudioEngine();
