import { useEffect, useMemo, useState, type CSSProperties } from "react";

export type GridSymbol = {
  id: string;
  label: string;
  color: string;
  accent: string;
  kind?: "normal" | "scatter" | "wild" | "bonus";
  glyph: string;
};

type Props = {
  title: string;
  subtitle?: string;
  theme: "orchard" | "vault" | "console" | "raid";
  symbols: GridSymbol[];
  /** 5 reels × 3 rows — column major: grid[col][row] */
  grid: GridSymbol[][];
  spinning: boolean;
  winCells?: Set<string>;
  message?: string;
  credit: number;
  bet: number;
  lines?: number;
  freeSpins?: number;
  boostOn?: boolean;
  onSpin: () => void;
  onBetUp: () => void;
  onBetDown: () => void;
  onToggleBoost?: () => void;
  disabled?: boolean;
};

const THEME_CLASS: Record<Props["theme"], string> = {
  orchard: "theme-orchard",
  vault: "theme-vault",
  console: "theme-console",
  raid: "theme-raid",
};

function cellKey(col: number, row: number) {
  return `${col}-${row}`;
}

export function SlotMachine({
  title,
  subtitle,
  theme,
  grid,
  spinning,
  winCells,
  message = "Good Luck!",
  credit,
  bet,
  lines = 10,
  freeSpins = 0,
  boostOn,
  onSpin,
  onBetUp,
  onBetDown,
  onToggleBoost,
  disabled,
}: Props) {
  const [tick, setTick] = useState(0);
  const totalBet = Number((bet * (boostOn ? 2 : 1)).toFixed(2));

  useEffect(() => {
    if (!spinning) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 60);
    return () => window.clearInterval(id);
  }, [spinning]);

  const displayGrid = useMemo(() => {
    if (!spinning) return grid;
    // blurry motion: shift glyphs while spinning
    return grid.map((col, c) =>
      col.map((sym, r) => {
        const pool = grid.flat();
        const idx = (c * 3 + r + tick) % pool.length;
        return pool[idx] ?? sym;
      }),
    );
  }, [grid, spinning, tick]);

  return (
    <div className={`vslot ${THEME_CLASS[theme]}`}>
      <div className="vslot-title">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="vslot-stage">
        <div className="payline-rail left" aria-hidden>
          {Array.from({ length: lines }, (_, i) => (
            <span key={i} style={{ background: lineColor(i) }}>
              {i + 1}
            </span>
          ))}
        </div>

        <div className={`vslot-grid${spinning ? " spinning" : ""}`}>
          {displayGrid.map((col, c) => (
            <div className="vslot-col" key={c}>
              {col.map((sym, r) => {
                const win = winCells?.has(cellKey(c, r));
                return (
                  <div
                    key={`${c}-${r}-${sym.id}`}
                    className={`vsym${sym.kind && sym.kind !== "normal" ? ` kind-${sym.kind}` : ""}${win ? " win" : ""}`}
                    style={
                      {
                        "--c1": sym.color,
                        "--c2": sym.accent,
                      } as CSSProperties
                    }
                  >
                    <div className="vsym-face">
                      <span className="vsym-glyph">{sym.glyph}</span>
                      <span className="vsym-label">{sym.label}</span>
                      {sym.kind && sym.kind !== "normal" && (
                        <span className="vsym-tag">{sym.kind}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="payline-rail right" aria-hidden>
          {Array.from({ length: lines }, (_, i) => (
            <span key={i} style={{ background: lineColor(lines - 1 - i) }}>
              {lines - i}
            </span>
          ))}
        </div>
      </div>

      <div className="vslot-msg">{message}</div>

      <div className="vslot-meter">
        <div>
          <small>CREDIT</small>
          <b>{credit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
        </div>
        <div>
          <small>BET/LINE</small>
          <b>{bet.toFixed(2)}</b>
        </div>
        <div>
          <small>TOTAL BET</small>
          <b>{totalBet.toFixed(2)}</b>
        </div>
      </div>

      <div className="vslot-controls">
        <div className="bet-stack">
          <button className="bet-arrow" onClick={onBetUp} aria-label="Increase bet">
            ▲
          </button>
          <div className="bet-orb">
            <small>BET</small>
            <b>{totalBet.toFixed(2)}</b>
          </div>
          <button className="bet-arrow" onClick={onBetDown} aria-label="Decrease bet">
            ▼
          </button>
        </div>

        <button
          className={`spin-orb${spinning ? " busy" : ""}${freeSpins > 0 ? " free" : ""}`}
          onClick={onSpin}
          disabled={disabled || spinning}
          aria-label="Spin"
        >
          <span className="spin-ring" />
          <span className="spin-core">{spinning ? "…" : freeSpins > 0 ? freeSpins : "↻"}</span>
          <small>{freeSpins > 0 ? "FREE" : "SPIN"}</small>
        </button>

        <button
          className={`boost-orb${boostOn ? " on" : ""}`}
          onClick={onToggleBoost}
          aria-pressed={!!boostOn}
        >
          <b>2×</b>
          <small>BOOST</small>
        </button>
      </div>
    </div>
  );
}

function lineColor(i: number) {
  const colors = [
    "#ff4d6d",
    "#ff922b",
    "#fcc419",
    "#51cf66",
    "#22b8cf",
    "#339af0",
    "#845ef7",
    "#f06595",
    "#ff6b6b",
    "#20c997",
  ];
  return colors[i % colors.length];
}

/** Build a random 5×3 grid from a symbol table. */
export function buildGrid(symbols: GridSymbol[], seed?: number): GridSymbol[][] {
  const rand = mulberry(seed ?? Date.now());
  return Array.from({ length: 5 }, () =>
    Array.from({ length: 3 }, () => symbols[Math.floor(rand() * symbols.length)]!),
  );
}

function mulberry(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function forceFeatureGrid(symbols: GridSymbol[], kind: "scatter" | "bonus" = "scatter"): GridSymbol[][] {
  const feature = symbols.find((s) => s.kind === kind) ?? symbols.find((s) => s.kind === "scatter") ?? symbols[0]!;
  const grid = buildGrid(symbols);
  // land feature on reels 0, 2, 4 middle row — classic scatter tease
  grid[0]![1] = feature;
  grid[2]![1] = feature;
  grid[4]![1] = feature;
  return grid;
}

export { cellKey };
