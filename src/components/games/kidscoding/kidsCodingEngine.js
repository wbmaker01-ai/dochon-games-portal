/**
 * Dochon Kids Coding - Pure Logic Interpreter & VM Engine
 * Handles block parsing, nested loop unrolling, step-by-step execution, and validation
 */

import {
  DIRECTION,
  DIRECTION_DELTA,
  TILE_TYPE,
  BLOCK_TYPE
} from './kidsCodingConstants';

/**
 * Counts total blocks in workspace recursively (including nested blocks)
 */
export function countTotalBlocks(blocks) {
  let count = 0;
  for (const block of blocks) {
    count += 1;
    if (block.type === BLOCK_TYPE.LOOP && Array.isArray(block.children)) {
      count += countTotalBlocks(block.children);
    }
  }
  return count;
}

/**
 * Flattens hierarchical block tree into linear executable atomic instruction list
 * Each instruction tracks its source blockId and optional parent loopId for UI glowing
 */
export function compileInstructions(blocks, maxSteps = 400) {
  const instructions = [];

  function unroll(list, parentLoopId = null) {
    for (const block of list) {
      if (instructions.length >= maxSteps) return;

      if (block.type === BLOCK_TYPE.LOOP) {
        const loopCount = Math.max(1, Math.min(block.count || 2, 12));
        const children = block.children || [];
        for (let iter = 0; iter < loopCount; iter++) {
          if (instructions.length >= maxSteps) break;
          // Step into loop body
          unroll(children, block.id);
        }
      } else {
        instructions.push({
          blockId: block.id,
          action: block.type,
          parentLoopId: parentLoopId
        });
      }
    }
  }

  unroll(blocks);
  return instructions;
}

/**
 * Creates initial simulation snapshot for a stage
 */
export function createInitialSimulationState(stage) {
  return {
    rabbit: { ...stage.rabbit },
    carrots: stage.carrots.map((c, idx) => ({ ...c, id: `c_${idx}`, collected: false })),
    isFailed: false,
    failReason: null, // 'FALL' | 'WATER' | 'BLOCKED' | 'NONE_LEFT'
    isClear: false,
    stepIndex: 0,
    activeBlockId: null
  };
}

/**
 * Executes a single atomic instruction on the simulation state
 */
export function executeStep(state, instruction, stage) {
  if (state.isFailed || state.isClear) return state;

  const nextState = {
    ...state,
    rabbit: { ...state.rabbit },
    carrots: state.carrots.map(c => ({ ...c })),
    activeBlockId: instruction ? instruction.blockId : null
  };

  if (!instruction) {
    // No more instructions - check if all carrots were collected
    const allCollected = nextState.carrots.every(c => c.collected);
    if (allCollected) {
      nextState.isClear = true;
    } else {
      nextState.isFailed = true;
      nextState.failReason = 'INCOMPLETE';
    }
    return nextState;
  }

  const { action } = instruction;

  if (action === BLOCK_TYPE.TURN_LEFT) {
    nextState.rabbit.dir = (nextState.rabbit.dir + 3) % 4;
  } else if (action === BLOCK_TYPE.TURN_RIGHT) {
    nextState.rabbit.dir = (nextState.rabbit.dir + 1) % 4;
  } else if (action === BLOCK_TYPE.FORWARD) {
    const delta = DIRECTION_DELTA[nextState.rabbit.dir];
    const targetX = nextState.rabbit.x + delta.dx;
    const targetY = nextState.rabbit.y + delta.dy;

    // Check bounds
    if (
      targetY < 0 ||
      targetY >= stage.grid.length ||
      targetX < 0 ||
      targetX >= stage.grid[0].length
    ) {
      nextState.rabbit.x = targetX;
      nextState.rabbit.y = targetY;
      nextState.isFailed = true;
      nextState.failReason = 'FALL';
      return nextState;
    }

    const tile = stage.grid[targetY][targetX];

    if (tile === TILE_TYPE.EMPTY) {
      nextState.rabbit.x = targetX;
      nextState.rabbit.y = targetY;
      nextState.isFailed = true;
      nextState.failReason = 'FALL';
      return nextState;
    }

    if (tile === TILE_TYPE.WATER) {
      nextState.rabbit.x = targetX;
      nextState.rabbit.y = targetY;
      nextState.isFailed = true;
      nextState.failReason = 'WATER';
      return nextState;
    }

    if (tile === TILE_TYPE.STONE) {
      nextState.isFailed = true;
      nextState.failReason = 'BLOCKED';
      return nextState;
    }

    // Valid Walkable Tile (GRASS or DIRT)
    nextState.rabbit.x = targetX;
    nextState.rabbit.y = targetY;

    // Check carrot pickup
    let pluckedAny = false;
    nextState.carrots = nextState.carrots.map(c => {
      if (!c.collected && c.x === targetX && c.y === targetY) {
        pluckedAny = true;
        return { ...c, collected: true };
      }
      return c;
    });

    // Check win on the fly
    if (nextState.carrots.every(c => c.collected)) {
      nextState.isClear = true;
    }
  }

  return nextState;
}
