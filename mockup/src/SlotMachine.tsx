import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { SymbolIcon } from "./SymbolIcons";

export type GridSymbol = {
  id: string;
  label: string;
  color: string;
  accent: string;
  kind?: "normal" | "scatter" | "wild" | "bonus" | "money";
  glyph: string;
  /** Stake-multiple for money symbols */
  value?: number;
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
  moneyCells?: Set<string>;
  message?: string;
  credit: number;
  bet: number;
  lines?: number;
  freeSpins?: number;
  boostOn?: boolean;
  featureLabel?: string;
  /** Increment when a new server result is ready to land */
  landToken?: number;
  onSpin: () => void;
  onBetUp: () => void;
  onBetDown: () => void;
  onToggleBoost?: () => void;
  /** Fired after staggered reel land physics finish */
  onReelsLanded?: () => void;
  disabled?: boolean;
};

const THEME_CLASS: Record<Props["theme"], string> = {
  orchard: "theme-orchard",
  vault: "theme-vault",
  console: "theme-console",
  raid: "theme-raid",
};

const CELL = 72;
const VISIBLE = 3;
const STRIP_LEN = 28;
const REEL_STOP_BASE = 480;
const REEL_STOP_STAGGER = 320;
const ANTICIPATION_EXTRA = 900;

function cellKey(col: number, row: number) {
  return `${col}-${row}`;
}

function easeOutBack(t: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

type ReelRuntime = {
  strip: GridSymbol[];
  offset: number;
  velocity: number;
  spinning: boolean;
  landing: boolean;
  landFrom: number;
  landTo: number;
  landT: number;
  landDur: number;
  stopped: boolean;
};

function buildSpinStrip(symbols: GridSymbol[], finalCol: GridSymbol[]): GridSymbol[] {
  const strip: GridSymbol[] = [];
  for (let i = 0; i < STRIP_LEN - VISIBLE; i++) {
    strip.push(symbols[Math.floor(Math.random() * symbols.length)]!);
  }
  // Final visible window sits at the end of the strip
  strip.push(...finalCol);
  return strip;
}

export function SlotMachine({
  title,
  subtitle,
  theme,
  symbols,
  grid,
  spinning,
  winCells,
  moneyCells,
  message = "Good Luck!",
  credit,
  bet,
  lines = 10,
  freeSpins = 0,
  boostOn,
  featureLabel,
  landToken = 0,
  onSpin,
  onBetUp,
  onBetDown,
  onToggleBoost,
  onReelsLanded,
  disabled,
}: Props) {
  const totalBet = Number((bet * (boostOn ? 2 : 1)).toFixed(2));
  const [reels, setReels] = useState<ReelRuntime[]>([]);
  const [anticipation, setAnticipation] = useState(false);
  const [collectPulse, setCollectPulse] = useState(false);
  const rafRef = useRef(0);
  const lastTs = useRef(0);
  const phaseRef = useRef<"idle" | "blur" | "landing">("idle");
  const landedRef = useRef(false);
  const stopAtRef = useRef<number[]>([]);
  const onLandedRef = useRef(onReelsLanded);
  onLandedRef.current = onReelsLanded;

  const staticReady = useMemo(() => {
    if (grid.length !== 5) return false;
    return grid.every((c) => c.length === 3);
  }, [grid]);

  const syncIdleReels = useCallback(
    (g: GridSymbol[][]) => {
      setReels(
        g.map((col) => {
          const strip = buildSpinStrip(symbols, col);
          const offset = -(strip.length - VISIBLE) * CELL;
          return {
            strip,
            offset,
            velocity: 0,
            spinning: false,
            landing: false,
            landFrom: offset,
            landTo: offset,
            landT: 1,
            landDur: 1,
            stopped: true,
          };
        }),
      );
    },
    [symbols],
  );

  // Keep idle display in sync when not spinning
  useEffect(() => {
    if (spinning || !staticReady) return;
    if (phaseRef.current !== "idle") return;
    syncIdleReels(grid);
  }, [grid, spinning, staticReady, syncIdleReels]);

  // Start blur when spin begins
  useEffect(() => {
    if (!spinning) {
      phaseRef.current = "idle";
      landedRef.current = false;
      setAnticipation(false);
      return;
    }

    phaseRef.current = "blur";
    landedRef.current = false;
    setAnticipation(false);
    setCollectPulse(false);

    setReels(
      Array.from({ length: 5 }, (_, c) => {
        const seed = grid[c] ?? buildGrid(symbols)[c]!;
        const strip = buildSpinStrip(symbols, seed);
        return {
          strip,
          offset: 0,
          velocity: 52 + c * 3 + Math.random() * 6,
          spinning: true,
          landing: false,
          landFrom: 0,
          landTo: 0,
          landT: 0,
          landDur: 0.55,
          stopped: false,
        };
      }),
    );
  }, [spinning]); // eslint-disable-line react-hooks/exhaustive-deps

  // When parent bumps landToken with a fresh result → schedule staggered land
  useEffect(() => {
    if (!spinning || !staticReady || landToken <= 0) return;
    if (phaseRef.current !== "blur") return;

    // Count scatters on first 4 reels for anticipation on reel 5
    let scatters = 0;
    for (let c = 0; c < 4; c++) {
      for (const cell of grid[c] ?? []) {
        if (cell.kind === "scatter") scatters += 1;
      }
    }
    const anticipate = scatters >= 2;
    setAnticipation(anticipate);

    const now = performance.now();
    stopAtRef.current = Array.from({ length: 5 }, (_, i) => {
      const extra = anticipate && i === 4 ? ANTICIPATION_EXTRA : 0;
      return now + REEL_STOP_BASE + i * REEL_STOP_STAGGER + extra;
    });

    phaseRef.current = "landing";

    setReels((prev) =>
      prev.map((reel, c) => {
        const finalCol = grid[c]!;
        const strip = buildSpinStrip(symbols, finalCol);
        const landTo = -(strip.length - VISIBLE) * CELL;
        return {
          ...reel,
          strip,
          offset: reel.offset % (CELL * 4),
          spinning: true,
          landing: false,
          landTo,
          stopped: false,
        };
      }),
    );
  }, [landToken, spinning, staticReady, symbols, grid]);

  // Collect pulse when money cells light up after land
  useEffect(() => {
    if (spinning) return;
    if (moneyCells && moneyCells.size > 0 && winCells && winCells.size > 0) {
      setCollectPulse(true);
      const t = window.setTimeout(() => setCollectPulse(false), 1200);
      return () => window.clearTimeout(t);
    }
  }, [moneyCells, winCells, spinning]);

  // Physics loop
  useEffect(() => {
    if (!spinning && phaseRef.current === "idle") return;

    const tick = (ts: number) => {
      const dt = lastTs.current ? Math.min(34, ts - lastTs.current) / 16.67 : 1;
      lastTs.current = ts;

      setReels((prev) => {
        if (!prev.length) return prev;
        let allStopped = true;
        const next = prev.map((reel, i) => {
          if (reel.stopped) return reel;

          const stopAt = stopAtRef.current[i] ?? 0;
          const shouldLand = phaseRef.current === "landing" && ts >= stopAt;

          if (reel.landing) {
            const landT = Math.min(1, reel.landT + dt / (60 * reel.landDur));
            const eased = anticipation && i === 4 ? easeOutCubic(landT) : easeOutBack(landT);
            const offset = reel.landFrom + (reel.landTo - reel.landFrom) * eased;
            if (landT >= 1) {
              return {
                ...reel,
                offset: reel.landTo,
                landT: 1,
                landing: false,
                spinning: false,
                stopped: true,
                velocity: 0,
              };
            }
            allStopped = false;
            return { ...reel, offset, landT, velocity: 0 };
          }

          if (shouldLand) {
            allStopped = false;
            const landFrom = reel.offset - CELL * (8 + i * 2);
            return {
              ...reel,
              landing: true,
              spinning: true,
              landFrom,
              landT: 0,
              landDur: anticipation && i === 4 ? 0.85 : 0.5 + i * 0.04,
              offset: landFrom,
            };
          }

          // Blur scroll
          allStopped = false;
          let velocity = reel.velocity;
          if (anticipation && i === 4 && phaseRef.current === "landing") {
            velocity = Math.max(18, velocity * 0.985);
          }
          return {
            ...reel,
            offset: reel.offset - velocity * dt,
            velocity,
          };
        });

        if (allStopped && phaseRef.current === "landing" && !landedRef.current) {
          landedRef.current = true;
          phaseRef.current = "idle";
          queueMicrotask(() => onLandedRef.current?.());
        }

        return next;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTs.current = 0;
    };
  }, [spinning, anticipation]);

  const showReels = reels.length === 5 ? reels : null;

  return (
    <div
      className={`vslot bass-cab ${THEME_CLASS[theme]}${freeSpins > 0 ? " in-feature" : ""}${anticipation ? " anticipating" : ""}${collectPulse ? " collecting" : ""}`}
    >
      <div className="vslot-chrome" aria-hidden>
        <i className="chrome-bolt tl" />
        <i className="chrome-bolt tr" />
        <i className="chrome-bolt bl" />
        <i className="chrome-bolt br" />
      </div>

      <div className="vslot-title">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>

      {(freeSpins > 0 || featureLabel) && (
        <div className="feature-banner">
          <span>{featureLabel || "FREE SPINS"}</span>
          {freeSpins > 0 && <b>{freeSpins} LEFT</b>}
        </div>
      )}

      <div className="vslot-stage">
        <div className="payline-rail left" aria-hidden>
          {Array.from({ length: lines }, (_, i) => (
            <span key={i} style={{ background: lineColor(i) }}>
              {i + 1}
            </span>
          ))}
        </div>

        <div
          className={`vslot-grid${spinning ? " spinning" : ""}${anticipation ? " anticipate" : ""}`}
          style={{ "--cell": `${CELL}px` } as CSSProperties}
        >
          {showReels
            ? showReels.map((reel, c) => (
                <div
                  className={`vslot-col${reel.spinning ? " is-spin" : ""}${reel.stopped && spinning ? " is-thud" : ""}`}
                  key={c}
                >
                  <div
                    className="vslot-strip"
                    style={{ transform: `translate3d(0, ${reel.offset}px, 0)` }}
                  >
                    {reel.strip.map((sym, idx) => {
                      const rowInView = Math.round(-reel.offset / CELL);
                      const r = idx - rowInView;
                      const inWindow = r >= 0 && r < VISIBLE;
                      const win = inWindow && winCells?.has(cellKey(c, r));
                      const money = inWindow && moneyCells?.has(cellKey(c, r));
                      return (
                        <div
                          key={`${c}-${idx}-${sym.id}-${sym.value ?? ""}`}
                          className={`vsym${sym.kind && sym.kind !== "normal" ? ` kind-${sym.kind}` : ""}${win ? " win" : ""}${money ? " money-lit" : ""}`}
                          style={
                            {
                              "--c1": sym.color,
                              "--c2": sym.accent,
                              height: CELL,
                            } as CSSProperties
                          }
                        >
                          <div className="vsym-face">
                            <SymbolIcon id={sym.id} />
                            <span className="vsym-label">{sym.label}</span>
                            {sym.kind === "money" && sym.value != null && (
                              <span className="vsym-cash">{sym.value}×</span>
                            )}
                            {sym.kind && sym.kind !== "normal" && sym.kind !== "money" && (
                              <span className="vsym-tag">{sym.kind}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {anticipation && c === 4 && spinning && <div className="anticipate-glow" />}
                </div>
              ))
            : grid.map((col, c) => (
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
                            height: CELL,
                          } as CSSProperties
                        }
                      >
                        <div className="vsym-face">
                          <SymbolIcon id={sym.id} />
                          <span className="vsym-label">{sym.label}</span>
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
  grid[0]![1] = feature;
  grid[2]![1] = feature;
  grid[4]![1] = feature;
  return grid;
}

export { cellKey };
