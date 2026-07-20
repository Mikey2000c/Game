import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  SlotMachine,
  buildGrid,
  type GridSymbol,
} from "./SlotMachine";
import { BonusGame, type BonusKind } from "./BonusGames";
import { AuthFlow } from "./AuthFlow";
import { api, getToken, setToken, type ApiUser } from "./api";
import { sfx } from "./audio";
import "./index.css";

type Tab = "home" | "slots" | "clan" | "account";
type Theme = "orchard" | "vault" | "console" | "raid";

type GameDef = {
  id: string;
  name: string;
  blurb: string;
  art: string;
  image: string;
  badge?: string;
  theme: Theme;
  symbols: GridSymbol[];
  note?: string;
  featured?: boolean;
};

type Mission = {
  id: string;
  title: string;
  detail: string;
  progress: number;
  target: number;
  reward: number;
};

const BET_STEPS = [0.1, 0.2, 0.5, 1, 2, 5];

const CASH_SYM: GridSymbol = {
  id: "cash",
  label: "CASH",
  color: "#fcc419",
  accent: "#fff3bf",
  kind: "money",
  glyph: "$",
};

const GAMES: GameDef[] = [
  {
    id: "console",
    name: "Platinum Pad Live",
    blurb: "Staggered 5×3 · portal mini-game · trophy wild collects cash",
    art: "art-console",
    image: "/tiles/pad.jpg",
    badge: "FEATURED",
    theme: "console",
    featured: true,
    note: "Original console theme — not affiliated with Sony or PlayStation.",
    symbols: [
      { id: "pad", label: "PAD", color: "#3d6bff", accent: "#b6c7ff", glyph: "P" },
      { id: "disc", label: "DISC", color: "#868e96", accent: "#dee2e6", glyph: "D" },
      { id: "cart", label: "CART", color: "#15aabf", accent: "#99e9f2", glyph: "C" },
      { id: "audio", label: "AUDIO", color: "#ff6b4a", accent: "#ffc9b8", glyph: "A" },
      { id: "ten", label: "10", color: "#845ef7", accent: "#e5dbff", glyph: "10" },
      { id: "j", label: "J", color: "#339af0", accent: "#a5d8ff", glyph: "J" },
      { id: "q", label: "Q", color: "#51cf66", accent: "#b2f2bb", glyph: "Q" },
      { id: "k", label: "K", color: "#ff6b6b", accent: "#ffc9c9", glyph: "K" },
      CASH_SYM,
      { id: "plat", label: "PLAT", color: "#fab005", accent: "#ffe8a3", kind: "wild", glyph: "W" },
      { id: "port", label: "PORT", color: "#7950f2", accent: "#d0bfff", kind: "bonus", glyph: "B" },
      { id: "live", label: "LIVE", color: "#ff922b", accent: "#ffe8a3", kind: "scatter", glyph: "S" },
    ],
  },
  {
    id: "fruit",
    name: "Neon Orchard",
    blurb: "Bass-style reel physics · money fish · angler free spins",
    art: "art-fruit",
    image: "/tiles/orchard.jpg",
    badge: "HOT",
    theme: "orchard",
    symbols: [
      { id: "fish", label: "FISH", color: "#339af0", accent: "#a5d8ff", glyph: "F" },
      { id: "bird", label: "BIRD", color: "#fff", accent: "#ffc9c9", glyph: "B" },
      { id: "ring", label: "RING", color: "#ff6b6b", accent: "#ffe3e3", glyph: "R" },
      { id: "ch", label: "CHERRY", color: "#fa5252", accent: "#ffc9c9", glyph: "C" },
      { id: "lm", label: "LEMON", color: "#ffd43b", accent: "#fff3bf", glyph: "L" },
      { id: "ten", label: "10", color: "#845ef7", accent: "#e5dbff", glyph: "10" },
      { id: "j", label: "J", color: "#339af0", accent: "#a5d8ff", glyph: "J" },
      { id: "q", label: "Q", color: "#51cf66", accent: "#b2f2bb", glyph: "Q" },
      { id: "k", label: "K", color: "#ff6b6b", accent: "#ffc9c9", glyph: "K" },
      CASH_SYM,
      { id: "wd", label: "WILD", color: "#20c997", accent: "#c3fae8", kind: "wild", glyph: "W" },
      { id: "sc", label: "SCATTER", color: "#ff922b", accent: "#ffe8a3", kind: "scatter", glyph: "S" },
    ],
  },
  {
    id: "vault",
    name: "Vault Rush",
    blurb: "Chrome reels · vault-crack mini-game · safe collects cash",
    art: "art-vault",
    image: "/tiles/vault.jpg",
    badge: "JACKPOT",
    theme: "vault",
    symbols: [
      { id: "gem", label: "GEM", color: "#22b8cf", accent: "#c5f6fa", glyph: "G" },
      { id: "key", label: "KEY", color: "#fcc419", accent: "#fff3bf", glyph: "K" },
      { id: "bag", label: "BAG", color: "#51cf66", accent: "#d3f9d8", glyph: "B" },
      { id: "bolt", label: "ZAP", color: "#ff922b", accent: "#ffe8cc", glyph: "Z" },
      { id: "ten", label: "10", color: "#845ef7", accent: "#e5dbff", glyph: "10" },
      { id: "j", label: "J", color: "#339af0", accent: "#a5d8ff", glyph: "J" },
      { id: "q", label: "Q", color: "#51cf66", accent: "#b2f2bb", glyph: "Q" },
      CASH_SYM,
      { id: "safe", label: "SAFE", color: "#748ffc", accent: "#dbe4ff", kind: "wild", glyph: "W" },
      { id: "sc", label: "SCAT", color: "#e64980", accent: "#ffdeeb", kind: "scatter", glyph: "S" },
    ],
  },
  {
    id: "raid",
    name: "Raid Spins",
    blurb: "Anticipation stops · storm wheel · wild money multipliers",
    art: "art-raid",
    image: "/tiles/raid.jpg",
    badge: "NEW",
    theme: "raid",
    symbols: [
      { id: "fire", label: "FIRE", color: "#ff6b4a", accent: "#ffd8ce", glyph: "F" },
      { id: "coin", label: "COIN", color: "#ffd43b", accent: "#fff3bf", glyph: "$" },
      { id: "hit", label: "HIT", color: "#fa5252", accent: "#ffe3e3", glyph: "H" },
      { id: "ten", label: "10", color: "#845ef7", accent: "#e5dbff", glyph: "10" },
      { id: "j", label: "J", color: "#339af0", accent: "#a5d8ff", glyph: "J" },
      { id: "q", label: "Q", color: "#51cf66", accent: "#b2f2bb", glyph: "Q" },
      CASH_SYM,
      { id: "wd", label: "WILD", color: "#20c997", accent: "#c3fae8", kind: "wild", glyph: "W" },
      { id: "sc", label: "SCAT", color: "#f06595", accent: "#ffdeeb", kind: "scatter", glyph: "S" },
    ],
  },
];

const FEED = [
  { id: 1, who: "Maya", color: "#ff5a3d", text: "hit 3 scatters on Neon Orchard", when: "1m" },
  { id: 2, who: "Rex", color: "#5b8cff", text: "Bet Boost → Platinum Pad free spins", when: "6m" },
  { id: 3, who: "Keep", color: "#f0c14b", text: "Clan jackpot contribution +420", when: "22m" },
];

const FRIENDS = [
  { id: "m", name: "Maya", status: "Online · Neon Orchard", gift: 100 },
  { id: "r", name: "Rex", status: "In Platinum Pad", gift: 250 },
  { id: "j", name: "Jules", status: "Offline", gift: 50 },
];

const TROPHIES = [
  { id: "bronze", label: "Bronze", ico: "🥉" },
  { id: "silver", label: "Silver", ico: "🥈" },
  { id: "gold", label: "Gold", ico: "🥇" },
  { id: "plat", label: "Platinum", ico: "💎" },
  { id: "live", label: "Live", ico: "📡" },
];

function formatTokens(n: number) {
  return n.toLocaleString("en-US");
}

export default function App() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [tokens, setTokens] = useState(12840);
  const [claimed, setClaimed] = useState(false);
  const [showBonus, setShowBonus] = useState(false);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [streakDay, setStreakDay] = useState(1);
  const [activeGame, setActiveGame] = useState<GameDef | null>(null);
  const [grid, setGrid] = useState<GridSymbol[][]>([]);
  const [spinning, setSpinning] = useState(false);
  const [winCells, setWinCells] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("Good Luck!");
  const [toast, setToast] = useState<string | null>(null);
  const [betBoost, setBetBoost] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [betIndex, setBetIndex] = useState(2);
  const [bonusOpen, setBonusOpen] = useState(false);
  const [bonusTitle, setBonusTitle] = useState("Bonus Round");
  const [bonusKind, setBonusKind] = useState<BonusKind>("angler");
  const [jackpot, setJackpot] = useState(248_560);
  const [freeSpins, setFreeSpins] = useState(0);
  const [moneyCells, setMoneyCells] = useState<Set<string>>(new Set());
  const [pendingResult, setPendingResult] = useState<null | {
    payout: number;
    wins: string[];
    scatters: number;
    feature: boolean;
    collected: number;
    moneyCells: string[];
    freeSpinsAwarded: number;
    usingFree: boolean;
  }>(null);
  const [landToken, setLandToken] = useState(0);
  const [spinCount, setSpinCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [unlocked, setUnlocked] = useState<string[]>(["bronze"]);
  const [bigWin, setBigWin] = useState<number | null>(null);
  const [missions, setMissions] = useState<Mission[]>([
    { id: "m1", title: "Warm-up spins", detail: "Spin 8 times today", progress: 0, target: 8, reward: 200 },
    { id: "m2", title: "Scatter hunter", detail: "Trigger 1 bonus feature", progress: 0, target: 1, reward: 350 },
    { id: "m3", title: "Boost believer", detail: "Win with Bet Boost on", progress: 0, target: 1, reward: 250 },
  ]);

  const dailyReward = 500 + (streakDay - 1) * 100;
  const bet = BET_STEPS[betIndex] ?? 0.5;
  /** Base stake in tokens — server applies boost once. */
  const stakeTokens = Math.round(bet * 100);
  const chargeTokens = betBoost ? stakeTokens * 2 : stakeTokens;
  const xpPct = Math.min(100, xp);
  const streakDays = Array.from({ length: 7 }, (_, i) => {
    const day = i + 1;
    return {
      day,
      done: day < streakDay || (day === streakDay && claimed),
      today: !claimed && day === Math.min(7, streakDay || 1),
      bonus: day === 7,
    };
  });

  function applyUser(u: ApiUser) {
    setUser(u);
    setTokens(u.tokens);
    setLevel(u.level);
    setXp(u.xp);
    setStreakDay(u.streakDay);
    const today = new Date().toISOString().slice(0, 10);
    setClaimed(u.lastDailyClaim === today);
  }

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api
      .me()
      .then((res) => {
        applyUser(res.user);
        setShowBonus(res.user.lastDailyClaim !== new Date().toISOString().slice(0, 10));
      })
      .catch(() => setToken(null));
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setJackpot((v) => v + Math.floor(Math.random() * 17) + 3);
    }, 900);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const nav = useMemo(
    () =>
      [
        { id: "home" as const, label: "Home", ico: "⌂" },
        { id: "slots" as const, label: "Slots", ico: "◎" },
        { id: "clan" as const, label: "Clan", ico: "⚑" },
        { id: "account" as const, label: "Account", ico: "◉" },
      ] as const,
    [],
  );

  function beep(fn: () => void) {
    if (soundOn) fn();
  }

  function bumpMission(id: string, by = 1) {
    setMissions((list) =>
      list.map((m) => {
        if (m.id !== id || m.progress >= m.target) return m;
        const progress = Math.min(m.target, m.progress + by);
        if (progress >= m.target && m.progress < m.target) {
          // Cosmetic only — wallet stays server-authoritative
          setToast(`Mission clear: ${m.title}`);
          beep(sfx.claim);
        }
        return { ...m, progress };
      }),
    );
  }

  function unlockTrophy(id: string) {
    setUnlocked((u) => (u.includes(id) ? u : [...u, id]));
  }

  function claimDaily() {
    if (claimed) return;
    void (async () => {
      try {
        const res = await api.claimDaily();
        applyUser(res.user);
        setShowBonus(false);
        beep(sfx.claim);
        setToast(`+${res.reward} daily tokens claimed`);
      } catch (e) {
        setToast(e instanceof Error ? e.message : "Claim failed");
        beep(sfx.lose);
      }
    })();
  }

  function sendGift(amount: number, name: string) {
    const emailMap: Record<string, string> = {
      Maya: "maya@spinkeep.local",
      Rex: "rex@spinkeep.local",
      Jules: "jules@spinkeep.local",
    };
    void (async () => {
      try {
        const res = await api.gift(emailMap[name] || `${name.toLowerCase()}@spinkeep.local`, amount);
        applyUser(res.user);
        beep(sfx.click);
        setToast(`Gifted ${amount} to ${name}`);
      } catch (e) {
        setToast(e instanceof Error ? e.message : "Gift failed");
      }
    })();
  }

  function openGame(g: GameDef) {
    beep(sfx.unlock);
    beep(sfx.click);
    setActiveGame(g);
    setGrid(buildGrid(g.symbols));
    setMessage("Good Luck!");
    setWinCells(new Set());
    setMoneyCells(new Set());
    setBonusOpen(false);
    setPendingResult(null);
    setCombo(0);
    setFreeSpins(0);
  }

  function startBonus(kind: BonusKind) {
    const titles: Record<BonusKind, string> = {
      angler: "Angler's Catch",
      heist: "Vault Crack",
      storm: "Multiplier Storm",
      pad: "Platinum Portal",
    };
    setBonusKind(kind);
    setBonusTitle(titles[kind]);
    setBonusOpen(true);
    bumpMission("m2");
    beep(sfx.bonus);
    if (kind === "pad") unlockTrophy("live");
  }

  function mapServerGrid(
    game: GameDef,
    raw: { id: string; kind: string; value?: number }[][],
  ): GridSymbol[][] {
    return raw.map((col) =>
      col.map((cell) => {
        const byId = game.symbols.find((s) => s.id === cell.id);
        if (byId) {
          return cell.value != null ? { ...byId, value: cell.value } : byId;
        }
        if (cell.kind === "money") {
          return { ...CASH_SYM, value: cell.value ?? 1 };
        }
        if (cell.kind === "wild") {
          return game.symbols.find((s) => s.kind === "wild") || game.symbols[0]!;
        }
        if (cell.kind === "scatter") {
          return (
            game.symbols.find((s) => s.kind === "scatter") ||
            game.symbols.find((s) => s.kind === "bonus") ||
            game.symbols[0]!
          );
        }
        return game.symbols[0]!;
      }),
    );
  }

  function resolvePending() {
    const res = pendingResult;
    if (!res || !activeGame) {
      setSpinning(false);
      return;
    }
    setPendingResult(null);
    setSpinning(false);
    beep(sfx.reelStop);

    setWinCells(new Set(res.wins));
    setMoneyCells(new Set(res.moneyCells));

    if (res.usingFree) setFreeSpins((f) => Math.max(0, f - 1));
    if (res.freeSpinsAwarded > 0) {
      setFreeSpins((f) => f + res.freeSpinsAwarded);
    }

    if (res.feature) {
      setMessage(`${res.scatters} SCATTERS! Mini-game unlocked`);
      setCombo((c) => c + 1);
      beep(sfx.winBig);
      const kind: BonusKind =
        activeGame.id === "console"
          ? "pad"
          : activeGame.id === "vault"
            ? "heist"
            : activeGame.id === "raid"
              ? "storm"
              : "angler";
      window.setTimeout(() => startBonus(kind), 550);
      return;
    }

    if (res.collected > 0) {
      setMessage(`COLLECT +${res.collected}!`);
      setCombo((c) => c + 1);
      beep(sfx.winBig);
      if (res.payout >= chargeTokens * 8) {
        setBigWin(res.payout);
        unlockTrophy("plat");
      }
      return;
    }

    if (res.payout > 0) {
      setMessage(`WIN ${res.payout}!`);
      setCombo((c) => c + 1);
      beep(res.payout >= chargeTokens * 8 ? sfx.winBig : sfx.winSmall);
      if (betBoost) bumpMission("m3");
      if (res.payout >= chargeTokens * 8) {
        setBigWin(res.payout);
        unlockTrophy("silver");
      }
      return;
    }

    setCombo(0);
    setMessage(res.usingFree ? "Free spin — good luck!" : "Good Luck!");
    beep(sfx.lose);
  }

  function spin() {
    if (spinning || !activeGame || bonusOpen || pendingResult) return;
    const usingFree = freeSpins > 0;
    if (!usingFree && tokens < chargeTokens) {
      setToast(`Need ${chargeTokens} tokens`);
      return;
    }

    beep(sfx.spinStart);
    setSpinning(true);
    setWinCells(new Set());
    setMoneyCells(new Set());
    setMessage(usingFree ? "Free spin…" : "Good Luck!");
    setBigWin(null);
    setSpinCount((c) => c + 1);
    bumpMission("m1");

    void (async () => {
      try {
        const res = await api.spin(stakeTokens, betBoost, activeGame.id, usingFree);
        const final = mapServerGrid(activeGame, res.grid);
        applyUser(res.user);
        setPendingResult({
          payout: res.payout,
          wins: res.wins,
          scatters: res.scatters,
          feature: res.feature,
          collected: res.collected ?? 0,
          moneyCells: res.moneyCells ?? [],
          freeSpinsAwarded: res.freeSpinsAwarded ?? 0,
          usingFree,
        });
        setGrid(final);
        setLandToken((n) => n + 1);
      } catch (e) {
        setSpinning(false);
        setPendingResult(null);
        setToast(e instanceof Error ? e.message : "Spin failed");
        beep(sfx.lose);
      }
    })();
  }

  return (
    <div className="stage">
      <div className="stage-label">
        <h1>SpinKeep</h1>
        <p>
          Online social slots — guest/email login, server RNG cabinets, daily streak,
          gifts, and a live token wallet.
        </p>
      </div>

      <div className="phone-shell">
        <div className="phone-notch" />
        <div className="phone-screen">
          {!user ? (
            <AuthFlow
              soundOn={soundOn}
              onAuthenticated={(u) => {
                applyUser(u);
                setShowBonus(u.lastDailyClaim !== new Date().toISOString().slice(0, 10));
                setToast(`Welcome, ${u.name}`);
              }}
            />
          ) : (
          <div className="app">
            <div className="status-bar">
              <span>9:41</span>
              <span>5G · 86%</span>
            </div>

            <header className="top-bar">
              <button
                className="brand-mark"
                onClick={() => {
                  beep(sfx.click);
                  setTab("account");
                }}
              >
                <div className="crest" aria-hidden>
                  <span>{user.name.slice(0, 1).toUpperCase()}</span>
                </div>
                <div>
                  <strong>{user.name}</strong>
                  <small>Lvl {level} · Gold Keep</small>
                </div>
              </button>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button
                  className={`chip${soundOn ? " gold" : " hot"}`}
                  onClick={() => {
                    setSoundOn((v) => !v);
                    if (!soundOn) sfx.unlock();
                  }}
                >
                  {soundOn ? "SND" : "MUTE"}
                </button>
                <div className="wallet">
                  <span className="coin" />
                  <b>{formatTokens(tokens)}</b>
                </div>
              </div>
            </header>

            <div className="scroll">
              <AnimatePresence mode="wait">
                {activeGame ? (
                  <motion.div
                    key="play"
                    className="screen-pad"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                  >
                    <button
                      className="linkish"
                      onClick={() => {
                        beep(sfx.click);
                        setActiveGame(null);
                        setBonusOpen(false);
                      }}
                    >
                      ← Lobby
                    </button>

                    <div className="jackpot-ticker" style={{ marginTop: 8 }}>
                      <div>
                        <div className="label">Progressive jackpot</div>
                        <div className="amount">{formatTokens(jackpot)}</div>
                      </div>
                      <span className="chip hot">{combo > 0 ? `COMBO x${combo}` : "LIVE"}</span>
                    </div>

                    {grid.length > 0 && (
                      <SlotMachine
                        title={activeGame.name}
                        subtitle={activeGame.blurb}
                        theme={activeGame.theme}
                        symbols={activeGame.symbols}
                        grid={grid}
                        spinning={spinning}
                        winCells={winCells}
                        moneyCells={moneyCells}
                        message={message}
                        credit={tokens / 100}
                        bet={bet}
                        freeSpins={freeSpins}
                        boostOn={betBoost}
                        featureLabel={
                          freeSpins > 0
                            ? activeGame.id === "fruit"
                              ? "ANGLER FREE SPINS"
                              : activeGame.id === "vault"
                                ? "VAULT FREE SPINS"
                                : activeGame.id === "raid"
                                  ? "STORM FREE SPINS"
                                  : "PORTAL FREE SPINS"
                            : undefined
                        }
                        landToken={landToken}
                        onSpin={spin}
                        onReelsLanded={resolvePending}
                        onBetUp={() => {
                          beep(sfx.click);
                          setBetIndex((i) => Math.min(BET_STEPS.length - 1, i + 1));
                        }}
                        onBetDown={() => {
                          beep(sfx.click);
                          setBetIndex((i) => Math.max(0, i - 1));
                        }}
                        onToggleBoost={() => {
                          setBetBoost((v) => {
                            const next = !v;
                            if (next) beep(sfx.boostOn);
                            else beep(sfx.click);
                            return next;
                          });
                        }}
                        disabled={bonusOpen}
                      />
                    )}

                    <div className="xp-card" style={{ marginTop: 10 }}>
                      <div className="row">
                        <strong>Keep XP · Lvl {level}</strong>
                        <span>
                          {xp}/100 · spins {spinCount}
                        </span>
                      </div>
                      <div className="xp-bar">
                        <i style={{ width: `${xpPct}%` }} />
                      </div>
                    </div>

                    {activeGame.id === "console" && (
                      <>
                        <div className="section-head" style={{ marginTop: 10, marginBottom: 6 }}>
                          <h3 style={{ fontSize: "0.9rem" }}>Trophy hunt</h3>
                          <span className="chip gold">
                            {unlocked.length}/{TROPHIES.length}
                          </span>
                        </div>
                        <div className="trophy-row">
                          {TROPHIES.map((t) => (
                            <div key={t.id} className={`trophy-pip${unlocked.includes(t.id) ? " on" : ""}`}>
                              <span className="ico">{t.ico}</span>
                              {t.label}
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {activeGame.note && <p className="notice">{activeGame.note}</p>}

                    <div className="section-head">
                      <h3>Daily hooks</h3>
                    </div>
                    <div className="mission-list">
                      {missions.map((m) => (
                        <div key={m.id} className={`mission-card${m.progress >= m.target ? " done" : ""}`}>
                          <div>
                            <strong>{m.title}</strong>
                            <span>
                              {m.detail} · {m.progress}/{m.target}
                            </span>
                          </div>
                          <span className="chip gold">+{m.reward}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : tab === "home" ? (
                  <motion.div
                    key="home"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="jackpot-ticker">
                      <div>
                        <div className="label">Network jackpot</div>
                        <div className="amount">{formatTokens(jackpot)}</div>
                      </div>
                      <span className="chip hot">LIVE</span>
                    </div>

                    <section className="hero-claim">
                      <div className="eyebrow">Daily Keep Bonus</div>
                      <h2>{claimed ? "Streak locked in" : "Claim before reset"}</h2>
                      <p>Day {streakDay} streak · come back tomorrow for a bigger drop.</p>
                      <div className="cta-row">
                        <button
                          className="btn btn-primary"
                          onClick={() => (claimed ? setToast("Already claimed today") : setShowBonus(true))}
                        >
                          {claimed ? "Streak safe" : `Claim ${dailyReward}`}
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => {
                            beep(sfx.click);
                            setTab("clan");
                          }}
                        >
                          Clan chest
                        </button>
                      </div>
                    </section>

                    <div className="section-head">
                      <h3>Your streak</h3>
                      <span className="chip gold">Day {streakDay}/7</span>
                    </div>
                    <div className="streak-row">
                      {streakDays.map((d) => (
                        <div
                          key={d.day}
                          className={`day-pip${d.done ? " done" : ""}${d.today ? " today" : ""}`}
                        >
                          {d.bonus ? "★" : d.day}
                        </div>
                      ))}
                    </div>

                    <div className="section-head">
                      <h3>Featured floor</h3>
                      <button onClick={() => setTab("slots")}>All slots</button>
                    </div>
                    <div className="game-rail">
                      {GAMES.map((g) => (
                        <button key={g.id} className="game-tile" onClick={() => openGame(g)}>
                          <img className="tile-img" src={g.image} alt="" loading="lazy" />
                          <div className={`art ${g.art}`} aria-hidden />
                          <span className="tile-shine" aria-hidden />
                          {g.badge && <span className={`badge-live badge-${g.badge.toLowerCase()}`}>{g.badge}</span>}
                          <div className="meta">
                            <strong>{g.name}</strong>
                            <span>{g.blurb}</span>
                            <em className="play-chip">PLAY</em>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="section-head">
                      <h3>Keep activity</h3>
                      <button onClick={() => setTab("account")}>Account</button>
                    </div>
                    <div className="feed">
                      {FEED.map((f) => (
                        <div className="feed-item" key={f.id}>
                          <div className="avatar" style={{ background: f.color }}>
                            {f.who.slice(0, 1)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p>
                              <b>{f.who}</b> {f.text}
                            </p>
                            <time>{f.when} ago</time>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : tab === "slots" ? (
                  <motion.div
                    key="slots"
                    className="screen-pad"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <h2 className="page-title">Slots</h2>
                    <p className="page-sub">Premium 5×3 cabinets — tap a tile and spin.</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {GAMES.map((g) => (
                        <button
                          key={g.id}
                          className="game-tile game-tile-wide"
                          style={{ minHeight: 168, width: "100%" }}
                          onClick={() => openGame(g)}
                        >
                          <img className="tile-img" src={g.image} alt="" loading="lazy" />
                          <div className={`art ${g.art}`} aria-hidden />
                          <span className="tile-shine" aria-hidden />
                          {g.badge && <span className={`badge-live badge-${g.badge.toLowerCase()}`}>{g.badge}</span>}
                          <div className="meta">
                            <strong>{g.name}</strong>
                            <span>{g.blurb}</span>
                            <em className="play-chip">PLAY</em>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : tab === "clan" ? (
                  <motion.div
                    key="clan"
                    className="screen-pad"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <h2 className="page-title">Your clan</h2>
                    <p className="page-sub">Shared jackpots, raid nights, gift pressure.</p>
                    <div className="clan-banner">
                      <div className="badge">VK</div>
                      <div>
                        <strong>Velvet Kings</strong>
                        <small>32 members · Clan lvl 8 · War ready</small>
                      </div>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "8px 10px" }}
                        onClick={() => {
                          beep(sfx.click);
                          setToast("Invite link copied");
                        }}
                      >
                        Invite
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="account"
                    className="screen-pad account-page"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <h2 className="page-title">Account</h2>
                    <p className="page-sub">Profile, wallet, preferences, and gifts.</p>

                    <div className="account-hero">
                      <div className="crest xl">
                        <span>{user.name.slice(0, 1).toUpperCase()}</span>
                      </div>
                      <div>
                        <strong>{user.name}</strong>
                        <small>{user.email}</small>
                        <span className="chip gold" style={{ marginTop: 6 }}>
                          Gold Keep · Lvl {level}
                        </span>
                      </div>
                    </div>

                    <div className="account-card">
                      <div className="account-row">
                        <div>
                          <strong>Sign-in method</strong>
                          <span>{user.method}</span>
                        </div>
                        <button className="linkish" onClick={() => setToast("Manage sign-in in full build")}>
                          Manage
                        </button>
                      </div>
                      <div className="account-row">
                        <div>
                          <strong>Token balance</strong>
                          <span>{formatTokens(tokens)} tokens</span>
                        </div>
                        <button className="btn btn-primary" style={{ padding: "8px 12px" }} onClick={() => setToast("Shop comes in phase 2")}>
                          Get coins
                        </button>
                      </div>
                      <div className="account-row">
                        <div style={{ flex: 1 }}>
                          <strong>Level & XP</strong>
                          <span>
                            Lvl {level} · {xp}/100 XP
                          </span>
                          <div className="xp-bar" style={{ marginTop: 8 }}>
                            <i style={{ width: `${xpPct}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="account-card">
                      <div className="account-row">
                        <div>
                          <strong>Game SFX</strong>
                          <span>{soundOn ? "On" : "Muted"}</span>
                        </div>
                        <button
                          className={`switch${soundOn ? " on" : ""}`}
                          onClick={() => {
                            setSoundOn((v) => !v);
                            if (!soundOn) sfx.unlock();
                          }}
                          aria-label="Toggle sound"
                        >
                          <i />
                        </button>
                      </div>
                      <div className="account-row dim">
                        <div>
                          <strong>Notifications</strong>
                          <span>Coming soon</span>
                        </div>
                        <span className="chip">Soon</span>
                      </div>
                    </div>

                    <div className="section-head">
                      <h3>Send gifts</h3>
                    </div>
                    <div className="gift-list">
                      {FRIENDS.map((f) => (
                        <div className="gift-row" key={f.id}>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <div className="avatar" style={{ background: "#5b8cff" }}>
                              {f.name.slice(0, 1)}
                            </div>
                            <div>
                              <strong>{f.name}</strong>
                              <span>{f.status}</span>
                            </div>
                          </div>
                          <button
                            className="btn btn-accent"
                            style={{ padding: "8px 12px" }}
                            onClick={() => sendGift(f.gift, f.name)}
                          >
                            Gift {f.gift}
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="account-card" style={{ marginTop: 14 }}>
                      <button className="account-link" onClick={() => setToast("Privacy policy placeholder")}>
                        Privacy policy
                      </button>
                      <button className="account-link" onClick={() => setToast("Terms placeholder")}>
                        Terms & conditions
                      </button>
                      <button className="account-link" onClick={() => setToast("Support placeholder")}>
                        Help & support
                      </button>
                    </div>

                    <button
                      className="btn btn-accent"
                      style={{ width: "100%", marginTop: 12 }}
                      onClick={() => {
                        beep(sfx.click);
                        setToken(null);
                        setUser(null);
                        setActiveGame(null);
                        setShowBonus(false);
                        setTab("home");
                      }}
                    >
                      Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {!activeGame && (
              <nav className="bottom-nav">
                {nav.map((item) => (
                  <button
                    key={item.id}
                    className={`nav-btn${tab === item.id ? " active" : ""}`}
                    onClick={() => {
                      beep(sfx.click);
                      setTab(item.id);
                    }}
                  >
                    <span className="ico">{item.ico}</span>
                    {item.label}
                  </button>
                ))}
              </nav>
            )}

            <AnimatePresence>
              {showBonus && !claimed && !activeGame && (
                <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.div className="modal" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}>
                    <div className="reward-burst">+{dailyReward}</div>
                    <h2>Daily Keep Bonus</h2>
                    <p>Streak day {streakDay}. Day 7 drops a mega chest.</p>
                    <button className="btn btn-primary" style={{ width: "100%" }} onClick={claimDaily}>
                      Claim {dailyReward} tokens
                    </button>
                    <button className="btn btn-ghost" style={{ width: "100%", marginTop: 8 }} onClick={() => setShowBonus(false)}>
                      Later
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {bonusOpen && (
                <BonusGame
                  kind={bonusKind}
                  title={bonusTitle}
                  onClose={() => setBonusOpen(false)}
                  onComplete={({ freeSpins: fs, label }) => {
                    setFreeSpins((f) => f + fs);
                    setMessage(label);
                    setToast(label);
                    beep(sfx.winBig);
                    unlockTrophy(fs >= 20 ? "plat" : "gold");
                    window.setTimeout(() => setBonusOpen(false), 400);
                  }}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {bigWin !== null && !bonusOpen && (
                <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setBigWin(null)}>
                  <motion.div className="modal bigwin-modal" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                    <div style={{ color: "#ffb09e", letterSpacing: "0.16em", fontWeight: 800, fontSize: "0.7rem" }}>BIG WIN</div>
                    <h2 style={{ fontSize: "2rem", color: "#ffd28a" }}>+{formatTokens(bigWin)}</h2>
                    <p>That’s the hook. Spin again while it’s hot.</p>
                    <button className="btn btn-spin" style={{ width: "100%" }} onClick={() => setBigWin(null)}>
                      Keep spinning
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {toast && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: "absolute",
                    left: 20,
                    right: 20,
                    bottom: activeGame ? 24 : 86,
                    zIndex: 40,
                    textAlign: "center",
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: "rgba(8,12,28,0.94)",
                    border: "1px solid rgba(240,193,75,0.4)",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                  }}
                >
                  {toast}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  className="modal-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowProfile(false)}
                >
                  <motion.div
                    className="modal profile-modal"
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 24, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="profile-head">
                      <div className="crest xl">
                        <span>{user.name.slice(0, 1).toUpperCase()}</span>
                      </div>
                      <div>
                        <h2>{user.name}</h2>
                        <p>{user.email}</p>
                      </div>
                    </div>
                    <div className="stat-strip">
                      <div className="stat">
                        <b>{level}</b>
                        <span>Level</span>
                      </div>
                      <div className="stat">
                        <b>{formatTokens(tokens)}</b>
                        <span>Tokens</span>
                      </div>
                      <div className="stat">
                        <b>{user.method}</b>
                        <span>Sign-in</span>
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost"
                      style={{ width: "100%", marginBottom: 8 }}
                      onClick={() => {
                        setShowProfile(false);
                        setToast("Settings coming in full build");
                      }}
                    >
                      Account settings
                    </button>
                    <button
                      className="btn btn-accent"
                      style={{ width: "100%" }}
                      onClick={() => {
                        beep(sfx.click);
                        setShowProfile(false);
                        setToken(null);
                        setUser(null);
                        setActiveGame(null);
                        setShowBonus(false);
                        setTab("home");
                      }}
                    >
                      Log out
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          )}
        </div>
      </div>

      <div className="legend">
        <span>Login · Guest / Google demo / email</span>
        <span>5×3 mobile slots</span>
        <span>Polished UI</span>
      </div>
    </div>
  );
}
