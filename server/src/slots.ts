/** Per-cabinet RNG — Big-Bass-style money collect on free spins, unique features per game. */

export type CellKind = "normal" | "wild" | "scatter" | "money";

export type Cell = {
  id: string;
  kind: CellKind;
  /** Present on money symbols — stake multiples (e.g. 2 = 2× stake). */
  value?: number;
};

const SHARED_ROYALS: Cell[] = [
  { id: "ten", kind: "normal" },
  { id: "j", kind: "normal" },
  { id: "q", kind: "normal" },
  { id: "k", kind: "normal" },
];

const MONEY_VALUES = [1, 2, 3, 5, 8, 10, 15, 20, 50, 100];

const CATALOGS: Record<string, Cell[]> = {
  /** Neon Orchard — angler / money-fish feature (original; BBB-inspired physics only). */
  fruit: [
    { id: "fish", kind: "normal" },
    { id: "bird", kind: "normal" },
    { id: "ring", kind: "normal" },
    { id: "ch", kind: "normal" },
    { id: "lm", kind: "normal" },
    ...SHARED_ROYALS,
    { id: "cash", kind: "money" },
    { id: "wd", kind: "wild" },
    { id: "sc", kind: "scatter" },
  ],
  /** Platinum Pad — portal free spins + trophy wild. */
  console: [
    { id: "pad", kind: "normal" },
    { id: "disc", kind: "normal" },
    { id: "cart", kind: "normal" },
    { id: "audio", kind: "normal" },
    ...SHARED_ROYALS,
    { id: "cash", kind: "money" },
    { id: "plat", kind: "wild" },
    { id: "live", kind: "scatter" },
  ],
  /** Vault Rush — gem bags as money, safe wild cracks vault. */
  vault: [
    { id: "gem", kind: "normal" },
    { id: "key", kind: "normal" },
    { id: "bag", kind: "normal" },
    { id: "bolt", kind: "normal" },
    { id: "ten", kind: "normal" },
    { id: "j", kind: "normal" },
    { id: "q", kind: "normal" },
    { id: "cash", kind: "money" },
    { id: "safe", kind: "wild" },
    { id: "sc", kind: "scatter" },
  ],
  /** Raid Spins — coin money + wild storm multipliers. */
  raid: [
    { id: "fire", kind: "normal" },
    { id: "coin", kind: "normal" },
    { id: "hit", kind: "normal" },
    { id: "ten", kind: "normal" },
    { id: "j", kind: "normal" },
    { id: "q", kind: "normal" },
    { id: "cash", kind: "money" },
    { id: "wd", kind: "wild" },
    { id: "sc", kind: "scatter" },
  ],
};

function catalogFor(gameId: string): Cell[] {
  return CATALOGS[gameId] ?? CATALOGS.fruit!;
}

function moneyValue(boost: boolean): number {
  const pool = boost ? MONEY_VALUES : MONEY_VALUES.slice(0, 7);
  return pool[Math.floor(Math.random() * pool.length)]!;
}

function pick(symbols: Cell[], boost: boolean, freeSpin: boolean): Cell {
  const r = Math.random();
  const scatterOdds = freeSpin ? 0.04 : boost ? 0.11 : 0.055;
  const wildOdds = freeSpin ? (boost ? 0.14 : 0.1) : boost ? 0.09 : 0.055;
  const moneyOdds = freeSpin ? (boost ? 0.22 : 0.16) : boost ? 0.08 : 0.04;

  const scatters = symbols.filter((s) => s.kind === "scatter");
  const wilds = symbols.filter((s) => s.kind === "wild");
  const moneys = symbols.filter((s) => s.kind === "money");
  const normals = symbols.filter((s) => s.kind === "normal");

  if (r < scatterOdds && scatters.length) {
    return { ...scatters[Math.floor(Math.random() * scatters.length)]! };
  }
  if (r < scatterOdds + wildOdds && wilds.length) {
    return { ...wilds[Math.floor(Math.random() * wilds.length)]! };
  }
  if (r < scatterOdds + wildOdds + moneyOdds && moneys.length) {
    const base = moneys[Math.floor(Math.random() * moneys.length)]!;
    return { ...base, value: moneyValue(boost) };
  }
  return { ...normals[Math.floor(Math.random() * normals.length)]! };
}

/** 5×3 grid, column-major */
export function spinReels(boost: boolean, gameId = "fruit", freeSpin = false): Cell[][] {
  const symbols = catalogFor(gameId);
  return Array.from({ length: 5 }, () =>
    Array.from({ length: 3 }, () => pick(symbols, boost, freeSpin)),
  );
}

export type SpinEvaluation = {
  grid: Cell[][];
  payout: number;
  wins: string[];
  scatters: number;
  feature: boolean;
  /** Free-spin money collected by wilds (stake multiples already applied). */
  collected: number;
  moneyCells: string[];
  wildCells: string[];
  freeSpinsAwarded: number;
};

export function evaluateSpin(
  grid: Cell[][],
  stake: number,
  opts: { freeSpin?: boolean; gameId?: string } = {},
): SpinEvaluation {
  let payout = 0;
  const wins: string[] = [];
  let scatters = 0;
  const moneyCells: string[] = [];
  const wildCells: string[] = [];
  let moneySumMultiples = 0;
  let wildCount = 0;

  for (let row = 0; row < 3; row++) {
    const line = grid.map((col) => col[row]!);
    let run = 1;
    let base = line[0]!;
    for (let i = 1; i < 5; i++) {
      const cur = line[i]!;
      if (
        cur.id === base.id ||
        cur.kind === "wild" ||
        base.kind === "wild" ||
        cur.kind === "money" ||
        base.kind === "money"
      ) {
        // money never substitutes for line wins
        if (cur.kind === "money" || base.kind === "money") break;
        run += 1;
        if (base.kind === "wild" && cur.kind !== "wild") base = cur;
      } else break;
    }
    if (run >= 3 && base.kind !== "money") {
      for (let c = 0; c < run; c++) wins.push(`${c}-${row}`);
      payout += stake * (run === 5 ? 20 : run === 4 ? 8 : 3);
    }
  }

  grid.forEach((col, c) =>
    col.forEach((cell, r) => {
      const key = `${c}-${r}`;
      if (cell.kind === "scatter") {
        scatters += 1;
        wins.push(key);
      }
      if (cell.kind === "money") {
        moneyCells.push(key);
        moneySumMultiples += cell.value ?? 1;
      }
      if (cell.kind === "wild") {
        wildCells.push(key);
        wildCount += 1;
      }
    }),
  );

  // Base-game scatter pays a little; 3+ triggers feature
  if (scatters >= 3) payout += stake * 5 * scatters;

  // Big-Bass-style: during free spins, each wild collects ALL money on the grid
  let collected = 0;
  if (opts.freeSpin && wildCount > 0 && moneySumMultiples > 0) {
    // Raid gets a storm multiplier; others collect 1× per wild
    const perWild =
      opts.gameId === "raid"
        ? moneySumMultiples * (1 + Math.min(3, wildCount))
        : moneySumMultiples * wildCount;
    collected = Math.round(stake * perWild);
    payout += collected;
    wins.push(...moneyCells, ...wildCells);
  } else if (!opts.freeSpin && moneySumMultiples > 0 && wildCount >= 2) {
    // Tease: rare base-game collect if 2+ wilds land with money
    collected = Math.round(stake * moneySumMultiples);
    payout += collected;
    wins.push(...moneyCells, ...wildCells);
  }

  const freeSpinsAwarded =
    !opts.freeSpin && scatters >= 3
      ? scatters >= 5
        ? 20
        : scatters >= 4
          ? 15
          : 10
      : opts.freeSpin && wildCount >= 4
        ? 10 // retrigger
        : 0;

  return {
    grid,
    payout: Math.round(payout),
    wins: [...new Set(wins)],
    scatters,
    feature: !opts.freeSpin && scatters >= 3,
    collected,
    moneyCells,
    wildCells,
    freeSpinsAwarded,
  };
}
