/** Per-cabinet symbol tables — IDs must match mockup/src/App.tsx GAMES. */

export type Cell = { id: string; kind: "normal" | "wild" | "scatter" };

const SHARED_ROYALS: Cell[] = [
  { id: "ten", kind: "normal" },
  { id: "j", kind: "normal" },
  { id: "q", kind: "normal" },
  { id: "k", kind: "normal" },
];

const CATALOGS: Record<string, Cell[]> = {
  fruit: [
    { id: "fish", kind: "normal" },
    { id: "bird", kind: "normal" },
    { id: "ring", kind: "normal" },
    { id: "ch", kind: "normal" },
    { id: "lm", kind: "normal" },
    ...SHARED_ROYALS,
    { id: "wd", kind: "wild" },
    { id: "sc", kind: "scatter" },
  ],
  console: [
    { id: "pad", kind: "normal" },
    { id: "disc", kind: "normal" },
    { id: "cart", kind: "normal" },
    { id: "audio", kind: "normal" },
    ...SHARED_ROYALS,
    { id: "plat", kind: "wild" },
    { id: "live", kind: "scatter" },
  ],
  vault: [
    { id: "gem", kind: "normal" },
    { id: "key", kind: "normal" },
    { id: "bag", kind: "normal" },
    { id: "bolt", kind: "normal" },
    { id: "ten", kind: "normal" },
    { id: "j", kind: "normal" },
    { id: "q", kind: "normal" },
    { id: "safe", kind: "wild" },
    { id: "sc", kind: "scatter" },
  ],
  raid: [
    { id: "fire", kind: "normal" },
    { id: "coin", kind: "normal" },
    { id: "hit", kind: "normal" },
    { id: "ten", kind: "normal" },
    { id: "j", kind: "normal" },
    { id: "q", kind: "normal" },
    { id: "wd", kind: "wild" },
    { id: "sc", kind: "scatter" },
  ],
};

function catalogFor(gameId: string): Cell[] {
  return CATALOGS[gameId] ?? CATALOGS.fruit!;
}

function pick(symbols: Cell[], boost: boolean): Cell {
  const r = Math.random();
  const scatterOdds = boost ? 0.12 : 0.06;
  const wildOdds = boost ? 0.1 : 0.06;
  const scatters = symbols.filter((s) => s.kind === "scatter");
  const wilds = symbols.filter((s) => s.kind === "wild");
  const normals = symbols.filter((s) => s.kind === "normal");

  if (r < scatterOdds && scatters.length) {
    return scatters[Math.floor(Math.random() * scatters.length)]!;
  }
  if (r < scatterOdds + wildOdds && wilds.length) {
    return wilds[Math.floor(Math.random() * wilds.length)]!;
  }
  return normals[Math.floor(Math.random() * normals.length)]!;
}

/** 5×3 grid, column-major */
export function spinReels(boost: boolean, gameId = "fruit"): Cell[][] {
  const symbols = catalogFor(gameId);
  return Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => pick(symbols, boost)));
}

export function evaluateSpin(grid: Cell[][], stake: number) {
  let payout = 0;
  const wins: string[] = [];
  let scatters = 0;

  for (let row = 0; row < 3; row++) {
    const line = grid.map((col) => col[row]!);
    let run = 1;
    let base = line[0]!;
    for (let i = 1; i < 5; i++) {
      const cur = line[i]!;
      if (cur.id === base.id || cur.kind === "wild" || base.kind === "wild") {
        run += 1;
        if (base.kind === "wild" && cur.kind !== "wild") base = cur;
      } else break;
    }
    if (run >= 3) {
      for (let c = 0; c < run; c++) wins.push(`${c}-${row}`);
      payout += stake * (run === 5 ? 20 : run === 4 ? 8 : 3);
    }
  }

  grid.forEach((col, c) =>
    col.forEach((cell, r) => {
      if (cell.kind === "scatter") {
        scatters += 1;
        wins.push(`${c}-${r}`);
      }
    }),
  );

  if (scatters >= 3) payout += stake * 5 * scatters;

  return {
    grid,
    payout: Math.round(payout),
    wins: [...new Set(wins)],
    scatters,
    feature: scatters >= 3,
  };
}
