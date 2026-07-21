export type Difficulty = "easy" | "medium" | "hard";

export type PinRule = {
  moveStep: number;
  affects: number[];
};

export type Puzzle = {
  difficulty: Difficulty;
  seed: number;
  pinCount: number;
  heightMin: number;
  heightMax: number;
  heights: number[];
  rules: PinRule[];
  moveCount: number;
  history: number[][];
  startTime: number | null;
  opened: boolean;
  showLinkages: boolean;
};

export const HEIGHT_MIN = -3;
export const HEIGHT_MAX = 3;

export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  if (s === 0) s = 0xdeadbeef;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

function pinCountFor(difficulty: Difficulty): number {
  return difficulty === "easy" ? 4 : difficulty === "medium" ? 5 : 6;
}

function scrambleCountFor(difficulty: Difficulty): number {
  return difficulty === "easy" ? 8 : difficulty === "medium" ? 13 : 18;
}

function makeRules(difficulty: Difficulty, seed: number, pinCount: number): PinRule[] {
  const rng = makeRng(seed * 7919 + 1);
  const rules: PinRule[] = [];
  for (let i = 0; i < pinCount; i++) {
    if (difficulty === "easy") {
      const affects: number[] = [];
      if (i > 0) affects.push(-1);
      if (i < pinCount - 1) affects.push(1);
      rules.push({ moveStep: 1, affects });
      continue;
    }
    if (difficulty === "medium") {
      const canSkip = i >= 2 && i <= pinCount - 3;
      const skip = canSkip && rng() < 0.35;
      const affects: number[] = [];
      if (skip) {
        affects.push(-2, 2);
      } else {
        if (i > 0) affects.push(-1);
        if (i < pinCount - 1) affects.push(1);
      }
      rules.push({ moveStep: 1, affects });
      continue;
    }
    const canSkip = i >= 2 && i <= pinCount - 3;
    const skip = canSkip && rng() < 0.25;
    const asymmetric = !skip && rng() < 0.3 && i > 0 && i < pinCount - 1;
    const doubleStep = rng() < 0.25;
    const affects: number[] = [];
    if (skip) {
      affects.push(-2, 2);
    } else if (asymmetric) {
      affects.push(rng() < 0.5 ? -1 : 1);
    } else {
      if (i > 0) affects.push(-1);
      if (i < pinCount - 1) affects.push(1);
    }
    rules.push({ moveStep: doubleStep ? 2 : 1, affects });
  }
  return rules;
}

export function canMove(puzzle: Puzzle, pinIdx: number, direction: 1 | -1): boolean {
  const rule = puzzle.rules[pinIdx]!;
  const newSelf = puzzle.heights[pinIdx]! + direction * rule.moveStep;
  if (newSelf < puzzle.heightMin || newSelf > puzzle.heightMax) return false;
  for (const offset of rule.affects) {
    const target = pinIdx + offset;
    if (target < 0 || target >= puzzle.pinCount) continue;
    const newN = puzzle.heights[target]! - direction;
    if (newN < puzzle.heightMin || newN > puzzle.heightMax) return false;
  }
  return true;
}

export function applyMove(
  puzzle: Puzzle,
  pinIdx: number,
  direction: 1 | -1,
): { crossedShearLine: number[]; leftShearLine: number[] } {
  const rule = puzzle.rules[pinIdx]!;
  const before = puzzle.heights.slice();
  puzzle.history.push(before);
  const next = before.slice();
  next[pinIdx] = next[pinIdx]! + direction * rule.moveStep;
  for (const offset of rule.affects) {
    const target = pinIdx + offset;
    if (target < 0 || target >= puzzle.pinCount) continue;
    next[target] = next[target]! - direction;
  }
  const crossed: number[] = [];
  const left: number[] = [];
  for (let i = 0; i < puzzle.pinCount; i++) {
    const b = before[i]!;
    const a = next[i]!;
    if (a === 0 && b !== 0) crossed.push(i);
    if (b === 0 && a !== 0) left.push(i);
  }
  puzzle.heights = next;
  puzzle.moveCount += 1;
  if (puzzle.heights.every((h) => h === 0)) {
    puzzle.opened = true;
  }
  return { crossedShearLine: crossed, leftShearLine: left };
}

export function undoLast(puzzle: Puzzle): boolean {
  const prev = puzzle.history.pop();
  if (!prev) return false;
  puzzle.heights = prev;
  puzzle.moveCount = Math.max(0, puzzle.moveCount - 1);
  puzzle.opened = puzzle.heights.every((h) => h === 0);
  return true;
}

export function restart(puzzle: Puzzle): void {
  while (puzzle.history.length) {
    const prev = puzzle.history.shift()!;
    puzzle.heights = prev;
  }
  puzzle.moveCount = 0;
  puzzle.opened = puzzle.heights.every((h) => h === 0);
  puzzle.startTime = null;
}

export function checkWin(puzzle: Puzzle): boolean {
  return puzzle.heights.every((h) => h === 0);
}

export function generatePuzzle(difficulty: Difficulty, seed: number): Puzzle {
  const pinCount = pinCountFor(difficulty);
  const rules = makeRules(difficulty, seed, pinCount);
  const puzzle: Puzzle = {
    difficulty,
    seed,
    pinCount,
    heightMin: HEIGHT_MIN,
    heightMax: HEIGHT_MAX,
    heights: new Array(pinCount).fill(0),
    rules,
    moveCount: 0,
    history: [],
    startTime: null,
    opened: false,
    showLinkages: difficulty === "easy",
  };

  const rng = makeRng(seed + 1);
  const target = scrambleCountFor(difficulty);
  let attempts = 0;
  let done = 0;
  let lastPin = -1;
  let lastDir: 1 | -1 = 1;
  while (done < target && attempts < 500) {
    attempts += 1;
    const pin = Math.floor(rng() * pinCount);
    const dir: 1 | -1 = rng() < 0.5 ? 1 : -1;
    if (pin === lastPin && dir === -lastDir) continue;
    if (!canMove(puzzle, pin, dir)) continue;
    applyMove(puzzle, pin, dir);
    lastPin = pin;
    lastDir = dir;
    done += 1;
  }

  if (puzzle.heights.every((h) => h === 0)) {
    for (let i = 0; i < pinCount; i++) {
      if (canMove(puzzle, i, 1)) {
        applyMove(puzzle, i, 1);
        break;
      }
    }
  }

  puzzle.moveCount = 0;
  puzzle.history = [];
  puzzle.startTime = null;
  puzzle.opened = false;
  return puzzle;
}
