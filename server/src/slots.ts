const SYMBOLS = [
  { id: "fish", kind: "normal" },
  { id: "bird", kind: "normal" },
  { id: "cherry", kind: "normal" },
  { id: "lemon", kind: "normal" },
  { id: "10", kind: "normal" },
  { id: "j", kind: "normal" },
  { id: "q", kind: "normal" },
  { id: "k", kind: "normal" },
  { id: "wild", kind: "wild" },
  { id: "scatter", kind: "scatter" },
] as const;

export type Cell = (typeof SYMBOLS)[number];

function pick(boost: boolean): Cell {
  const r = Math.random();
  const scatterOdds = boost ? 0.12 : 0.06;
  const wildOdds = boost ? 0.1 : 0.06;
  if (r < scatterOdds) return SYMBOLS.find((s) => s.id === "scatter")!;
  if (r < scatterOdds + wildOdds) return SYMBOLS.find((s) => s.id === "wild")!;
  const normals = SYMBOLS.filter((s) => s.kind === "normal");
  return normals[Math.floor(Math.random() * normals.length)]!;
}

/** 5×3 grid, column-major */
export function spinReels(boost: boolean): Cell[][] {
  return Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => pick(boost)));
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
