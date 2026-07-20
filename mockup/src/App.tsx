import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  SlotMachine,
  buildGrid,
  type GridSymbol,
} from "./SlotMachine";
import { AuthFlow } from "./AuthFlow";
import { api, getToken, setToken, type ApiUser } from "./api";
import { sfx } from "./audio";
import "./index.css";

type Tab = "home" | "games" | "clan" | "social";
type Theme = "orchard" | "vault" | "console" | "raid";

type GameDef = {
  id: string;
  name: string;
  blurb: string;
  art: string;
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

const GAMES: GameDef[] = [
  {
    id: "console",
    name: "Platinum Pad Live",
    blurb: "5×3 console cabinet · trophies, portals, free spins",
    art: "art-console",
    theme: "console",
    featured: true,
    note: "Original console theme — not affiliated with Sony or PlayStation.",
    symbols: [
      { id: "pad", label: "PAD", color: "#3d6bff", accent: "#b6c7ff", glyph: "🎮" },
      { id: "disc", label: "DISC", color: "#868e96", accent: "#dee2e6", glyph: "💿" },
      { id: "cart", label: "CART", color: "#15aabf", accent: "#99e9f2", glyph: "📦" },
      { id: "audio", label: "AUDIO", color: "#ff6b4a", accent: "#ffc9b8", glyph: "🎧" },
      { id: "ten", label: "10", color: "#845ef7", accent: "#e5dbff", glyph: "10" },
      { id: "j", label: "J", color: "#339af0", accent: "#a5d8ff", glyph: "J" },
      { id: "q", label: "Q", color: "#51cf66", accent: "#b2f2bb", glyph: "Q" },
      { id: "k", label: "K", color: "#ff6b6b", accent: "#ffc9c9", glyph: "K" },
      { id: "plat", label: "PLAT", color: "#fab005", accent: "#ffe8a3", kind: "wild", glyph: "💎" },
      { id: "port", label: "PORT", color: "#7950f2", accent: "#d0bfff", kind: "bonus", glyph: "🌀" },
      { id: "live", label: "LIVE", color: "#ff922b", accent: "#ffe8a3", kind: "scatter", glyph: "📡" },
    ],
  },
  {
    id: "fruit",
    name: "Neon Orchard",
    blurb: "Fishin’-style fruit frenzy · scatters & free picks",
    art: "art-fruit",
    theme: "orchard",
    symbols: [
      { id: "fish", label: "FISH", color: "#339af0", accent: "#a5d8ff", glyph: "🐟" },
      { id: "bird", label: "BIRD", color: "#fff", accent: "#ffc9c9", glyph: "🐦" },
      { id: "ring", label: "RING", color: "#ff6b6b", accent: "#ffe3e3", glyph: "⭕" },
      { id: "ch", label: "CHERRY", color: "#fa5252", accent: "#ffc9c9", glyph: "🍒" },
      { id: "lm", label: "LEMON", color: "#ffd43b", accent: "#fff3bf", glyph: "🍋" },
      { id: "ten", label: "10", color: "#845ef7", accent: "#e5dbff", glyph: "10" },
      { id: "j", label: "J", color: "#339af0", accent: "#a5d8ff", glyph: "J" },
      { id: "q", label: "Q", color: "#51cf66", accent: "#b2f2bb", glyph: "Q" },
      { id: "k", label: "K", color: "#ff6b6b", accent: "#ffc9c9", glyph: "K" },
      { id: "wd", label: "WILD", color: "#20c997", accent: "#c3fae8", kind: "wild", glyph: "⭐" },
      { id: "sc", label: "SCATTER", color: "#ff922b", accent: "#ffe8a3", kind: "scatter", glyph: "🌅" },
    ],
  },
  {
    id: "vault",
    name: "Vault Rush",
    blurb: "5×3 vault trail · progressive jackpot bites",
    art: "art-vault",
    theme: "vault",
    symbols: [
      { id: "gem", label: "GEM", color: "#22b8cf", accent: "#c5f6fa", glyph: "💎" },
      { id: "key", label: "KEY", color: "#fcc419", accent: "#fff3bf", glyph: "🔑" },
      { id: "bag", label: "BAG", color: "#51cf66", accent: "#d3f9d8", glyph: "💰" },
      { id: "bolt", label: "ZAP", color: "#ff922b", accent: "#ffe8cc", glyph: "⚡" },
      { id: "ten", label: "10", color: "#845ef7", accent: "#e5dbff", glyph: "10" },
      { id: "j", label: "J", color: "#339af0", accent: "#a5d8ff", glyph: "J" },
      { id: "q", label: "Q", color: "#51cf66", accent: "#b2f2bb", glyph: "Q" },
      { id: "safe", label: "SAFE", color: "#748ffc", accent: "#dbe4ff", kind: "wild", glyph: "🔐" },
      { id: "sc", label: "SCAT", color: "#e64980", accent: "#ffdeeb", kind: "scatter", glyph: "🌅" },
    ],
  },
  {
    id: "raid",
    name: "Raid Spins",
    blurb: "Fast 5×3 storm · random multipliers",
    art: "art-raid",
    theme: "raid",
    symbols: [
      { id: "fire", label: "FIRE", color: "#ff6b4a", accent: "#ffd8ce", glyph: "🔥" },
      { id: "coin", label: "COIN", color: "#ffd43b", accent: "#fff3bf", glyph: "🪙" },
      { id: "hit", label: "HIT", color: "#fa5252", accent: "#ffe3e3", glyph: "🎯" },
      { id: "ten", label: "10", color: "#845ef7", accent: "#e5dbff", glyph: "10" },
      { id: "j", label: "J", color: "#339af0", accent: "#a5d8ff", glyph: "J" },
      { id: "q", label: "Q", color: "#51cf66", accent: "#b2f2bb", glyph: "Q" },
      { id: "wd", label: "WILD", color: "#20c997", accent: "#c3fae8", kind: "wild", glyph: "⭐" },
      { id: "sc", label: "SCAT", color: "#f06595", accent: "#ffdeeb", kind: "scatter", glyph: "🌅" },
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

const STREAK = [
  { day: 1, done: true },
  { day: 2, done: true },
  { day: 3, done: true },
  { day: 4, done: false, today: true },
  { day: 5, done: false },
  { day: 6, done: false },
  { day: 7, done: false, bonus: true },
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
  const [bonusPicks, setBonusPicks] = useState<(number | null)[]>(Array(9).fill(null));
  const [bonusDone, setBonusDone] = useState(false);
  const [jackpot, setJackpot] = useState(248_560);
  const [freeSpins, setFreeSpins] = useState(0);
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
  const totalBet = bet * (betBoost ? 2 : 1);
  const stakeTokens = Math.round(totalBet * 100);
  const xpPct = Math.min(100, xp);

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
        { id: "home" as const, label: "Keep", ico: "⌂" },
        { id: "games" as const, label: "Spins", ico: "◎" },
        { id: "clan" as const, label: "Clan", ico: "⚑" },
        { id: "social" as const, label: "Gifts", ico: "✦" },
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
          setTokens((t) => t + m.reward);
          setToast(`Mission clear +${m.reward}`);
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
    setBonusOpen(false);
    setCombo(0);
  }

  function startBonus(kind: "scatter" | "heist" | "storm" | "pad") {
    const titles = {
      scatter: "Scatter Free-Pick",
      heist: "Vault Heist Bonus",
      storm: "Multiplier Storm",
      pad: "Platinum Portal",
    };
    setBonusTitle(titles[kind]);
    setBonusPicks(Array(9).fill(null));
    setBonusDone(false);
    setBonusOpen(true);
    bumpMission("m2");
    beep(sfx.bonus);
    if (kind === "pad") unlockTrophy("live");
  }

  function pickBonusCell(i: number) {
    if (bonusDone || bonusPicks[i] !== null) return;
    const values = [50, 100, 150, 250, 400, 800, 50, 100, 1500];
    const value = values[Math.floor(Math.random() * values.length)];
    const next = [...bonusPicks];
    next[i] = value;
    setBonusPicks(next);
    beep(sfx.click);

    const revealed = next.filter((v) => v !== null).length;
    if (revealed >= 3) {
      const total = next.reduce<number>((sum, v) => sum + (v ?? 0), 0);
      const boosted = betBoost ? total * 2 : total;
      setBonusDone(true);
      setTokens((v) => v + boosted);
      setMessage(`Bonus +${boosted} · Free spins awarded!`);
      setFreeSpins((f) => f + (betBoost ? 5 : 3));
      setBigWin(boosted);
      beep(sfx.winBig);
      unlockTrophy(boosted >= 800 ? "plat" : "gold");
      setTimeout(() => setBonusOpen(false), 700);
    }
  }

  function mapServerGrid(game: GameDef, raw: { id: string; kind: string }[][]): GridSymbol[][] {
    return raw.map((col) =>
      col.map((cell) => {
        const match =
          game.symbols.find((s) => s.id === cell.id) ||
          game.symbols.find((s) => s.kind === cell.kind) ||
          game.symbols.find((s) => s.label.toLowerCase().includes(cell.id)) ||
          game.symbols[0]!;
        return match;
      }),
    );
  }

  function spin() {
    if (spinning || !activeGame || bonusOpen) return;
    if (freeSpins <= 0 && tokens < stakeTokens) {
      setToast(`Need ${stakeTokens} tokens`);
      return;
    }

    beep(sfx.spinStart);
    setSpinning(true);
    setWinCells(new Set());
    setMessage("Good Luck!");
    setBigWin(null);
    setSpinCount((c) => c + 1);
    bumpMission("m1");

    void (async () => {
      try {
        // animate locally while server resolves
        const anim = window.setInterval(() => {
          setGrid(buildGrid(activeGame.symbols));
        }, 70);

        const res = await api.spin(stakeTokens, betBoost, activeGame.id);
        window.clearInterval(anim);

        const final = mapServerGrid(activeGame, res.grid);
        setGrid(final);
        setSpinning(false);
        applyUser(res.user);
        beep(sfx.reelStop);

        if (freeSpins > 0) setFreeSpins((f) => Math.max(0, f - 1));

        if (res.feature || res.scatters >= 3) {
          setWinCells(new Set(res.wins));
          setMessage(`${res.scatters} SCATTERS! Feature unlocked`);
          setCombo((c) => c + 1);
          beep(sfx.winBig);
          const kind =
            activeGame.id === "console"
              ? "pad"
              : activeGame.id === "vault"
                ? "heist"
                : activeGame.id === "raid"
                  ? "storm"
                  : "scatter";
          setTimeout(() => startBonus(kind), 500);
          return;
        }

        if (res.payout > 0) {
          setWinCells(new Set(res.wins));
          setMessage(`WIN ${res.payout}!`);
          setCombo((c) => c + 1);
          beep(res.payout >= stakeTokens * 8 ? sfx.winBig : sfx.winSmall);
          if (betBoost) bumpMission("m3");
          if (res.payout >= stakeTokens * 8) {
            setBigWin(res.payout);
            unlockTrophy("silver");
          }
          return;
        }

        setCombo(0);
        setMessage("Good Luck!");
        beep(sfx.lose);
      } catch (e) {
        setSpinning(false);
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
          Polished mobile social casino mockup — login, 5×3 slots, clans, gifts,
          and daily hooks.
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
                  setShowProfile(true);
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
                        message={message}
                        credit={tokens / 100}
                        bet={bet}
                        freeSpins={freeSpins}
                        boostOn={betBoost}
                        onSpin={spin}
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
                      {STREAK.map((d) => (
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
                      <button onClick={() => setTab("games")}>All games</button>
                    </div>
                    <div className="game-rail">
                      {GAMES.map((g) => (
                        <button key={g.id} className="game-tile" onClick={() => openGame(g)}>
                          <div className={`art ${g.art}`} />
                          {g.featured && <span className="badge-live">FEATURED</span>}
                          <div className="meta">
                            <strong>{g.name}</strong>
                            <span>{g.blurb}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="section-head">
                      <h3>Keep activity</h3>
                      <button onClick={() => setTab("social")}>Gifts</button>
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
                ) : tab === "games" ? (
                  <motion.div
                    key="games"
                    className="screen-pad"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <h2 className="page-title">Spin floor</h2>
                    <p className="page-sub">Mobile 5×3 cabinets — tap in and spin.</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {GAMES.map((g) => (
                        <button
                          key={g.id}
                          className="game-tile"
                          style={{ minHeight: 148, width: "100%" }}
                          onClick={() => openGame(g)}
                        >
                          <div className={`art ${g.art}`} />
                          {g.featured && <span className="badge-live">FEATURED</span>}
                          <div className="meta">
                            <strong>{g.name}</strong>
                            <span>{g.blurb}</span>
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
                    key="social"
                    className="screen-pad"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <h2 className="page-title">Friends & gifts</h2>
                    <p className="page-sub">Gift tokens → pull friends online.</p>
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
                <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.div className="modal bonus-modal" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}>
                    <h2>{bonusTitle}</h2>
                    <p>Pick 3 tiles. Boost doubles the bank · awards free spins.</p>
                    <div className="pick-grid">
                      {bonusPicks.map((v, i) => (
                        <button
                          key={i}
                          className={`pick-cell${v !== null ? " revealed" : ""}`}
                          onClick={() => pickBonusCell(i)}
                          disabled={bonusDone}
                        >
                          {v === null ? "?" : v}
                        </button>
                      ))}
                    </div>
                    {bonusDone && (
                      <button className="btn btn-blue" style={{ width: "100%" }} onClick={() => setBonusOpen(false)}>
                        Back to reels
                      </button>
                    )}
                  </motion.div>
                </motion.div>
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
        <span>Login · Apple / Google / email</span>
        <span>5×3 mobile slots</span>
        <span>Polished UI</span>
      </div>
    </div>
  );
}
