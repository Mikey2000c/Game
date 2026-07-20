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
  value?: number;
};

type Props = {
  title: string;
  subtitle?: string;
  theme: "orchard" | "vault" | "console" | "raid";
  symbols: GridSymbol[];
  grid: GridSymbol[][];
  spinning: boolean;
  winCells?: Set<string>;
  moneyCells?: Set<string>;
  message?: string;
  lastWin?: number;
  credit: number;
  bet: number;
  lines?: number;
  freeSpins?: number;
  boostOn?: boolean;
  featureLabel?: string;
  landToken?: number;
  soundOn?: boolean;
  onSpin: () => void;
  onBetUp: () => void;
  onBetDown: () => void;
  onToggleBoost?: () => void;
  onReelsLanded?: () => void;
  onReelStop?: (reelIndex: number) => void;
  disabled?: boolean;
};

const THEME_CLASS: Record<Props["theme"], string> = {
  orchard: "theme-orchard",
  vault: "theme-vault",
  console: "theme-console",
  raid: "theme-raid",
};

const CELL = 82;
const VISIBLE = 3;
const STRIP_LEN = 30;

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
  lastWin = 0,
  credit,
  bet,
  lines = 10,
  freeSpins = 0,
  boostOn,
  featureLabel,
  landToken = 0,
  soundOn: _soundOn = true,
  onSpin,
  onBetUp,
  onBetDown,
  onToggleBoost,
  onReelsLanded,
  onReelStop,
  disabled,
}: Props) {
  const totalBet = Number((bet * (boostOn ? 2 : 1)).toFixed(2));
  const [reels, setReels] = useState<ReelRuntime[]>([]);
  const [anticipation, setAnticipation] = useState(false);
  const [collectPulse, setCollectPulse] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [auto, setAuto] = useState(false);
  const [ledTick, setLedTick] = useState(0);
  const rafRef = useRef(0);
  const lastTs = useRef(0);
  const phaseRef = useRef<"idle" | "blur" | "landing">("idle");
  const landedRef = useRef(false);
  const stopAtRef = useRef<number[]>([]);
  const stoppedAnnounced = useRef<boolean[]>([]);
  const onLandedRef = useRef(onReelsLanded);
  const onReelStopRef = useRef(onReelStop);
  onLandedRef.current = onReelsLanded;
  onReelStopRef.current = onReelStop;

  const stopBase = turbo ? 220 : 520;
  const stopStagger = turbo ? 140 : 300;
  const anticExtra = turbo ? 420 : 950;

  const staticReady = useMemo(() => {
    if (grid.length !== 5) return false;
    return grid.every((c) => c.length === 3);
  }, [grid]);

  const winLines = useMemo(() => {
    if (!winCells || winCells.size === 0) return [] as number[];
    const rows: number[] = [];
    for (let r = 0; r < 3; r++) {
      let hits = 0;
      for (let c = 0; c < 5; c++) if (winCells.has(cellKey(c, r))) hits += 1;
      if (hits >= 3) rows.push(r);
    }
    return rows;
  }, [winCells]);

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

  useEffect(() => {
    if (spinning || !staticReady) return;
    if (phaseRef.current !== "idle") return;
    syncIdleReels(grid);
  }, [grid, spinning, staticReady, syncIdleReels]);

  // LED chase
  useEffect(() => {
    const id = window.setInterval(() => setLedTick((t) => t + 1), spinning || anticipation ? 70 : 160);
    return () => window.clearInterval(id);
  }, [spinning, anticipation]);

  useEffect(() => {
    if (!spinning) {
      phaseRef.current = "idle";
      landedRef.current = false;
      setAnticipation(false);
      return;
    }

    phaseRef.current = "blur";
    landedRef.current = false;
    stoppedAnnounced.current = [false, false, false, false, false];
    setAnticipation(false);
    setCollectPulse(false);

    setReels(
      Array.from({ length: 5 }, (_, c) => {
        const seed = grid[c] ?? buildGrid(symbols)[c]!;
        const strip = buildSpinStrip(symbols, seed);
        return {
          strip,
          offset: 0,
          velocity: (turbo ? 68 : 54) + c * 3 + Math.random() * 6,
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

  useEffect(() => {
    if (!spinning || !staticReady || landToken <= 0) return;
    if (phaseRef.current !== "blur") return;

    let scatters = 0;
    for (let c = 0; c < 4; c++) {
      for (const cell of grid[c] ?? []) {
        if (cell.kind === "scatter") scatters += 1;
      }
    }
    const anticipate = scatters >= 2 && !turbo;
    setAnticipation(anticipate);

    const now = performance.now();
    stopAtRef.current = Array.from({ length: 5 }, (_, i) => {
      const extra = anticipate && i === 4 ? anticExtra : 0;
      return now + stopBase + i * stopStagger + extra;
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
  }, [landToken, spinning, staticReady, symbols, grid, turbo, stopBase, stopStagger, anticExtra]);

  useEffect(() => {
    if (spinning) return;
    if (moneyCells && moneyCells.size > 0 && winCells && winCells.size > 0) {
      setCollectPulse(true);
      const t = window.setTimeout(() => setCollectPulse(false), 1400);
      return () => window.clearTimeout(t);
    }
  }, [moneyCells, winCells, spinning]);

  // Auto-spin when idle
  useEffect(() => {
    if (!auto || spinning || disabled || freeSpins < 0) return;
    if (phaseRef.current !== "idle") return;
    const t = window.setTimeout(() => onSpin(), turbo ? 350 : 650);
    return () => window.clearTimeout(t);
  }, [auto, spinning, disabled, freeSpins, onSpin, turbo, landToken, message]);

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
              if (!stoppedAnnounced.current[i]) {
                stoppedAnnounced.current[i] = true;
                queueMicrotask(() => onReelStopRef.current?.(i));
              }
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
            const landFrom = reel.offset - CELL * (turbo ? 5 : 8 + i * 2);
            return {
              ...reel,
              landing: true,
              spinning: true,
              landFrom,
              landT: 0,
              landDur: anticipation && i === 4 ? 0.85 : turbo ? 0.32 : 0.48 + i * 0.04,
              offset: landFrom,
            };
          }

          allStopped = false;
          let velocity = reel.velocity;
          if (anticipation && i === 4 && phaseRef.current === "landing") {
            velocity = Math.max(16, velocity * 0.982);
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
  }, [spinning, anticipation, turbo]);

  const showReels = reels.length === 5 ? reels : null;

  return (
    <div className="vslot-wrap">
      <div
        className={`vslot bass-cab premium realistic ${THEME_CLASS[theme]}${freeSpins > 0 ? " in-feature" : ""}${anticipation ? " anticipating" : ""}${collectPulse ? " collecting" : ""}${lastWin > 0 && !spinning ? " has-win" : ""}${spinning ? " is-live" : ""}`}
      >
        <div className="cab-ambient" aria-hidden />
        <div className="cab-rim" aria-hidden />
        <div className="vslot-chrome" aria-hidden>
          <i className="chrome-bolt tl" />
          <i className="chrome-bolt tr" />
          <i className="chrome-bolt bl" />
          <i className="chrome-bolt br" />
        </div>

        <div className="led-chase" aria-hidden>
          {Array.from({ length: 24 }, (_, i) => (
            <span
              key={i}
              className={i % 24 === ledTick % 24 || (i + 12) % 24 === ledTick % 24 ? "on" : ""}
            />
          ))}
        </div>

        <div className="vslot-title">
          <div className="title-plate">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
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

          <div className="reel-bezel">
            <div className="reel-glass" aria-hidden />
            <div className="reel-vignette" aria-hidden />
            <div
              className={`vslot-grid${spinning ? " spinning" : ""}${anticipation ? " anticipate" : ""}`}
              style={{ "--cell": `${CELL}px` } as CSSProperties}
            >
              {winLines.map((r) => (
                <div
                  key={`wl-${r}`}
                  className="win-line"
                  style={{ top: `calc(${r} * var(--cell) + var(--cell) / 2)` }}
                />
              ))}

              {showReels
                ? showReels.map((reel, c) => (
                    <div
                      className={`vslot-col${reel.spinning ? " is-spin" : ""}${reel.stopped && spinning ? " is-thud" : ""}${!reel.spinning && !spinning && winCells?.size ? " settled" : ""}`}
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
                              <div className="vsym-depth" aria-hidden />
                              <div className="vsym-shine" aria-hidden />
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
                      {col.map((sym, r) => (
                        <div
                          key={`${c}-${r}-${sym.id}`}
                          className={`vsym${sym.kind && sym.kind !== "normal" ? ` kind-${sym.kind}` : ""}${winCells?.has(cellKey(c, r)) ? " win" : ""}`}
                          style={
                            {
                              "--c1": sym.color,
                              "--c2": sym.accent,
                              height: CELL,
                            } as CSSProperties
                          }
                        >
                          <div className="vsym-depth" aria-hidden />
                          <div className="vsym-shine" aria-hidden />
                          <div className="vsym-face">
                            <SymbolIcon id={sym.id} />
                            <span className="vsym-label">{sym.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}

              {lastWin > 0 && !spinning && (
                <div className="win-float" key={lastWin}>
                  +{lastWin.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          <div className="payline-rail right" aria-hidden>
            {Array.from({ length: lines }, (_, i) => (
              <span key={i} style={{ background: lineColor(lines - 1 - i) }}>
                {lines - i}
              </span>
            ))}
          </div>
        </div>

        <div className={`vslot-msg${lastWin > 0 && !spinning ? " winny" : ""}`}>
          <span>{message}</span>
        </div>

        <div className="vslot-meter lcd-row">
          <div className="lcd">
            <small>CREDIT</small>
            <b>{credit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
          </div>
          <div className="lcd win-lcd">
            <small>WIN</small>
            <b className={lastWin > 0 ? "lit" : ""}>
              {(lastWin / 100).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </b>
          </div>
          <div className="lcd">
            <small>BET</small>
            <b>{totalBet.toFixed(2)}</b>
          </div>
        </div>

        <div className="vslot-controls deck">
          <div className="bet-stack">
            <button className="bet-arrow" onClick={onBetUp} aria-label="Increase bet" disabled={spinning}>
              ▲
            </button>
            <div className="bet-orb">
              <span className="orb-gloss" aria-hidden />
              <small>BET</small>
              <b>{totalBet.toFixed(2)}</b>
            </div>
            <button className="bet-arrow" onClick={onBetDown} aria-label="Decrease bet" disabled={spinning}>
              ▼
            </button>
          </div>

          <button
            className={`spin-orb${spinning ? " busy" : ""}${freeSpins > 0 ? " free" : ""}${auto ? " auto" : ""}`}
            onClick={onSpin}
            disabled={disabled || spinning}
            aria-label="Spin"
          >
            <span className="spin-glow" aria-hidden />
            <span className="spin-ring" />
            <span className="spin-core">{spinning ? "…" : freeSpins > 0 ? freeSpins : "SPIN"}</span>
            <small>{freeSpins > 0 ? "FREE" : auto ? "AUTO" : "HOLD"}</small>
          </button>

          <div className="side-orbs">
            <button
              className={`boost-orb${boostOn ? " on" : ""}`}
              onClick={onToggleBoost}
              aria-pressed={!!boostOn}
              disabled={spinning}
            >
              <span className="orb-gloss" aria-hidden />
              <b>2×</b>
              <small>BOOST</small>
            </button>
            <button
              className={`mini-orb${turbo ? " on" : ""}`}
              onClick={() => setTurbo((v) => !v)}
              aria-pressed={turbo}
            >
              <b>TURBO</b>
            </button>
            <button
              className={`mini-orb${auto ? " on" : ""}`}
              onClick={() => setAuto((v) => !v)}
              aria-pressed={auto}
            >
              <b>AUTO</b>
            </button>
          </div>
        </div>
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
