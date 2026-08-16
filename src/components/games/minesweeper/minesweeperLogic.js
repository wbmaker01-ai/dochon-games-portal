// Dochon Minesweeper Logic Engine
// Handles 100% Safe First Click, Cascade Reveal, Chording, Win Check, and Smart Coaching Hints

import { TILE_STATUS } from './minesweeperConstants';

/**
 * Creates an initial blank board with hidden uninitialized cells.
 */
export function createEmptyBoard(rows, cols) {
  const board = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        row: r,
        col: c,
        isMine: false,
        adjacentMines: 0,
        status: TILE_STATUS.HIDDEN,
        isHinted: false,
        isWrongFlag: false
      });
    }
    board.push(row);
  }
  return board;
}

/**
 * Get all 8 valid neighbor coordinates for a given cell.
 */
export function getNeighbors(r, c, rows, cols) {
  const neighbors = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        neighbors.push({ r: nr, c: nc });
      }
    }
  }
  return neighbors;
}

/**
 * Initializes board with mines AFTER first click.
 * Guaranteed 100% Safe Opening: First click and its 8 neighbors are forbidden from containing mines.
 */
export function initializeBoard(rows, cols, mineCount, firstRow, firstCol) {
  const board = createEmptyBoard(rows, cols);

  // Set of forbidden coordinates (first click + 8 neighbors for wide 0-area cascade opening)
  const forbidden = new Set();
  forbidden.add(`${firstRow},${firstCol}`);
  const initialNeighbors = getNeighbors(firstRow, firstCol, rows, cols);
  initialNeighbors.forEach(n => forbidden.add(`${n.r},${n.c}`));

  // All available cells
  const candidateCells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!forbidden.has(`${r},${c}`)) {
        candidateCells.push({ r, c });
      }
    }
  }

  // Shuffle candidate cells (Fisher-Yates)
  for (let i = candidateCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidateCells[i], candidateCells[j]] = [candidateCells[j], candidateCells[i]];
  }

  // Cap mine count if candidates are fewer than requested mines
  const actualMines = Math.min(mineCount, candidateCells.length);
  for (let i = 0; i < actualMines; i++) {
    const { r, c } = candidateCells[i];
    board[r][c].isMine = true;
  }

  // Calculate adjacent mine counts for all non-mine cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!board[r][c].isMine) {
        const neighbors = getNeighbors(r, c, rows, cols);
        let count = 0;
        neighbors.forEach(n => {
          if (board[n.r][n.c].isMine) count++;
        });
        board[r][c].adjacentMines = count;
      }
    }
  }

  return board;
}

/**
 * Reveal a tile at (row, col).
 * If the tile has 0 adjacent mines, automatically flood-fills and reveals the entire zero region.
 */
export function revealTile(board, startR, startC) {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard = board.map(row => row.map(tile => ({ ...tile })));
  
  const target = newBoard[startR][startC];

  // If already revealed or flagged, do nothing
  if (target.status === TILE_STATUS.REVEALED || target.status === TILE_STATUS.FLAGGED) {
    return { board: newBoard, newlyRevealed: 0, hitMine: false };
  }

  // If mine is clicked
  if (target.isMine) {
    target.status = TILE_STATUS.EXPLODED;
    return { board: newBoard, newlyRevealed: 0, hitMine: true };
  }

  // Safe tile reveal with Breadth-First-Search (BFS) flood fill
  let newlyRevealed = 0;
  const queue = [{ r: startR, c: startC }];
  target.status = TILE_STATUS.REVEALED;
  target.isHinted = false;
  newlyRevealed++;

  while (queue.length > 0) {
    const { r, c } = queue.shift();
    const curr = newBoard[r][c];

    // Only spread flood fill if current tile has 0 adjacent mines
    if (curr.adjacentMines === 0) {
      const neighbors = getNeighbors(r, c, rows, cols);
      for (const n of neighbors) {
        const neighborTile = newBoard[n.r][n.c];
        if (
          neighborTile.status === TILE_STATUS.HIDDEN &&
          !neighborTile.isMine
        ) {
          neighborTile.status = TILE_STATUS.REVEALED;
          neighborTile.isHinted = false;
          newlyRevealed++;
          if (neighborTile.adjacentMines === 0) {
            queue.push({ r: n.r, c: n.c });
          }
        }
      }
    }
  }

  return { board: newBoard, newlyRevealed, hitMine: false };
}

/**
 * Toggles flag on a hidden tile.
 */
export function toggleFlag(board, r, c) {
  const newBoard = board.map(row => row.map(tile => ({ ...tile })));
  const tile = newBoard[r][c];

  if (tile.status === TILE_STATUS.REVEALED) {
    return { board: newBoard, flagCountDelta: 0, newStatus: tile.status };
  }

  let flagCountDelta = 0;
  if (tile.status === TILE_STATUS.FLAGGED) {
    tile.status = TILE_STATUS.HIDDEN;
    flagCountDelta = -1;
  } else if (tile.status === TILE_STATUS.HIDDEN) {
    tile.status = TILE_STATUS.FLAGGED;
    tile.isHinted = false;
    flagCountDelta = 1;
  }

  return { board: newBoard, flagCountDelta, newStatus: tile.status };
}

/**
 * Chording: When clicking on an already revealed number tile,
 * if surrounding flags count === adjacentMines, open all other surrounding hidden cells.
 */
export function chordTile(board, r, c) {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard = board.map(row => row.map(tile => ({ ...tile })));
  const target = newBoard[r][c];

  if (target.status !== TILE_STATUS.REVEALED || target.adjacentMines === 0) {
    return { board: newBoard, newlyRevealed: 0, hitMine: false, openedCoords: [] };
  }

  const neighbors = getNeighbors(r, c, rows, cols);
  let flagCount = 0;
  neighbors.forEach(n => {
    if (newBoard[n.r][n.c].status === TILE_STATUS.FLAGGED) flagCount++;
  });

  // Only chord if number of flags matches the tile's number
  if (flagCount !== target.adjacentMines) {
    return { board: newBoard, newlyRevealed: 0, hitMine: false, openedCoords: [] };
  }

  let totalRevealed = 0;
  let hitMine = false;
  const openedCoords = [];

  for (const n of neighbors) {
    const tile = newBoard[n.r][n.c];
    if (tile.status === TILE_STATUS.HIDDEN) {
      if (tile.isMine) {
        tile.status = TILE_STATUS.EXPLODED;
        hitMine = true;
      } else {
        const res = revealTile(newBoard, n.r, n.c);
        // Sync board updates
        for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
          for (let colIdx = 0; colIdx < cols; colIdx++) {
            newBoard[rowIdx][colIdx] = res.board[rowIdx][colIdx];
          }
        }
        totalRevealed += res.newlyRevealed;
        openedCoords.push({ r: n.r, c: n.c });
      }
    }
  }

  return { board: newBoard, newlyRevealed: totalRevealed, hitMine, openedCoords };
}

/**
 * Checks whether all non-mine cells have been revealed (Win condition).
 */
export function checkWinCondition(board, totalMines) {
  const rows = board.length;
  const cols = board[0].length;
  let revealedCount = 0;
  const totalCells = rows * cols;
  const nonMineTarget = totalCells - totalMines;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].status === TILE_STATUS.REVEALED && !board[r][c].isMine) {
        revealedCount++;
      }
    }
  }

  return revealedCount === nonMineTarget;
}

/**
 * On Win: Automatically flags all unflagged mines.
 */
export function autoFlagRemainingMines(board) {
  return board.map(row =>
    row.map(tile => {
      if (tile.isMine) {
        return { ...tile, status: TILE_STATUS.FLAGGED };
      }
      return tile;
    })
  );
}

/**
 * On Game Over: Reveals all mines and highlights wrong flags.
 */
export function revealAllMines(board, explodedR = -1, explodedC = -1) {
  return board.map((row, r) =>
    row.map((tile, c) => {
      if (r === explodedR && c === explodedC) {
        return { ...tile, status: TILE_STATUS.EXPLODED };
      }
      if (tile.isMine && tile.status !== TILE_STATUS.FLAGGED) {
        return { ...tile, status: TILE_STATUS.REVEALED };
      }
      if (!tile.isMine && tile.status === TILE_STATUS.FLAGGED) {
        return { ...tile, isWrongFlag: true };
      }
      return tile;
    })
  );
}

/**
 * Smart Hint Coaching Solver:
 * Finds 100% logically provable Safe Tiles or Mine Tiles.
 */
export function findSmartHint(board) {
  const rows = board.length;
  const cols = board[0].length;

  // 1. Obvious Safe Check:
  // If a revealed number tile already has all its required flags surrounding it,
  // all other hidden surrounding tiles are 100% SAFE!
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = board[r][c];
      if (tile.status === TILE_STATUS.REVEALED && tile.adjacentMines > 0) {
        const neighbors = getNeighbors(r, c, rows, cols);
        const flags = neighbors.filter(n => board[n.r][n.c].status === TILE_STATUS.FLAGGED);
        const hidden = neighbors.filter(n => board[n.r][n.c].status === TILE_STATUS.HIDDEN);

        if (flags.length === tile.adjacentMines && hidden.length > 0) {
          const target = hidden[0];
          return {
            r: target.r,
            c: target.c,
            type: 'safe',
            title: '💡 100% 안전한 잔디밭 발견!',
            message: `(${r + 1}, ${c + 1}) 위치의 숫자 [${tile.adjacentMines}] 주변에 깃발이 모두 꽂혔어요. 표시된 칸은 안심하고 열어도 돼요! ✨`
          };
        }
      }
    }
  }

  // 2. Obvious Mine Check:
  // If (unrevealed hidden neighbors + flagged neighbors) === adjacentMines,
  // then every unflagged hidden neighbor is 100% a MINE!
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = board[r][c];
      if (tile.status === TILE_STATUS.REVEALED && tile.adjacentMines > 0) {
        const neighbors = getNeighbors(r, c, rows, cols);
        const flags = neighbors.filter(n => board[n.r][n.c].status === TILE_STATUS.FLAGGED);
        const hidden = neighbors.filter(n => board[n.r][n.c].status === TILE_STATUS.HIDDEN);

        const needed = tile.adjacentMines - flags.length;
        if (hidden.length > 0 && hidden.length === needed) {
          const target = hidden[0];
          return {
            r: target.r,
            c: target.c,
            type: 'mine',
            title: '🚩 100% 지뢰 위치 포착!',
            message: `(${r + 1}, ${c + 1}) 위치의 숫자 [${tile.adjacentMines}]에 지뢰가 ${needed}개 더 필요해요. 표시된 칸에 깃발(🚩)을 꽂아보세요!`
          };
        }
      }
    }
  }

  // 3. Fallback: Find any hidden tile with low risk or corner
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].status === TILE_STATUS.HIDDEN) {
        return {
          r,
          c,
          type: 'safe',
          title: '🔎 탐색 추천 칸',
          message: '아직 열리지 않은 잔디밭이에요. 조심스럽게 파서 힌트를 얻어보세요!'
        };
      }
    }
  }

  return null;
}
