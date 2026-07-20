import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SlotScene, type ReelSymbol } from "./SlotScene";
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
  symbols: ReelSymbol[];
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

const BASE_STAKE = 50;
const BOOST_MULT = 2;

const GAMES: GameDef[] = [
  {
    id: "console",
    name: "Platinum Pad Live",
    blurb: "Console-cabinet megaways energy · trophies, portals, free spins",
    art: "art-console",
    theme: "console",
    featured: true,
    note: "Original console theme — not affiliated with Sony or PlayStation. Licensed console brands need a deal.",
    symbols: [
      { id: "pad", label: "PAD", color: "#3d6bff", accent: "#b6c7ff", icon: "pad" },
      { id: "disc", label: "DISC", color: "#868e96", accent: "#dee2e6", icon: "disc" },
      { id: "cart", label: "CART", color: "#15aabf", accent: "#99e9f2", icon: "cart" },
      { id: "phones", label: "AUDIO", color: "#ff6b4a", accent: "#ffc9b8", icon: "headset" },
      { id: "cup", label: "PLAT", color: "#fab005", accent: "#ffe8a3", kind: "wild", icon: "trophy" },
      { id: "port", label: "PORT", color: "#7950f2", accent: "#d0bfff", kind: "bonus", icon: "portal" },
      { id: "sc", label: "LIVE", color: "#ff4fd8", accent: "#ffc2ef", kind: "scatter", icon: "star" },
    ],
  },
  {
    id: "fruit",
    name: "Neon Orchard",
    blurb: "Classic fruit · Coral-style punchy wins",
    art: "art-fruit",
    theme: "orchard",
    symbols: [
      { id: "ch", label: "CHERRY", color: "#ff6b6b", accent: "#ffc9c9", icon: "cherry" },
      { id: "lm", label: "LEMON", color: "#ffd43b", accent: "#fff3bf", icon: "lemon" },
      { id: "bl", label: "BELL", color: "#748ffc", accent: "#dbe4ff", icon: "bell" },
      { id: "bn", label: "BAR", color: "#ff922b", accent: "#ffe8cc", icon: "coin" },
      { id: "wd", label: "WILD", color: "#20c997", accent: "#c3fae8", kind: "wild", icon: "star" },
      { id: "sc", label: "SCAT", color: "#f06595", accent: "#ffdeeb", kind: "scatter", icon: "star" },
    ],
  },
  {
    id: "vault",
    name: "Vault Rush",
    blurb: "Progressive vault · BetVictor-green jackpot trail",
    art: "art-vault",
    theme: "vault",
    symbols: [
      { id: "gem", label: "GEM", color: "#22b8cf", accent: "#c5f6fa", icon: "gem" },
      { id: "key", label: "KEY", color: "#fcc419", accent: "#fff3bf", icon: "bolt" },
      { id: "bag", label: "BAG", color: "#51cf66", accent: "#d3f9d8", icon: "coin" },
      { id: "bolt", label: "ZAP", color: "#ff922b", accent: "#ffe8cc", icon: "bolt" },
      { id: "safe", label: "SAFE", color: "#748ffc", accent: "#dbe4ff", kind: "wild", icon: "safe" },
      { id: "sc", label: "SCAT", color: "#e64980", accent: "#ffdeeb", kind: "scatter", icon: "star" },
    ],
  },
  {
    id: "raid",
    name: "Raid Spins",
    blurb: "Fast Sky-style storm multipliers",
    art: "art-raid",
    theme: "raid",
    symbols: [
      { id: "fire", label: "FIRE", color: "#ff6b4a", accent: "#ffd8ce", icon: "fire" },
      { id: "coin", label: "COIN", color: "#ffd43b", accent: "#fff3bf", icon: "coin" },
      { id: "tgt", label: "HIT", color: "#fa5252", accent: "#ffe3e3", icon: "star" },
      { id: "clk", label: "CLK", color: "#845ef7", accent: "#e5dbff", icon: "bolt" },
      { id: "wd", label: "WILD", color: "#20c997", accent: "#c3fae8", kind: "wild", icon: "star" },
      { id: "sc", label: "SCAT", color: "#f06595", accent: "#ffdeeb", kind: "scatter", icon: "star" },
    ],
  },
];

const FEED = [
  { id: 1, who: "Maya", color: "#ff5a3d", text: "unlocked Platinum trophy on Pad Live", when: "1m" },
  { id: 2, who: "Rex", color: "#5b8cff", text: "Bet Boost → portal free spins", when: "6m" },
  { id: 3, who: "Keep", color: "#f0c14b", text: "Clan jackpot contribution +420", when: "22m" },
];

const FRIENDS = [
  { id: "m", name: "Maya", status: "Online · Platinum Pad", gift: 100 },
  { id: "r", name: "Rex", status: "In Raid Spins", gift: 250 },
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

function randFace(len: number) {
  return Math.floor(Math.random() * len);
}

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [tokens, setTokens] = useState(12840);
  const [claimed, setClaimed] = useState(false);
  const [showBonus, setShowBonus] = useState(true);
  const [activeGame, setActiveGame] = useState<GameDef | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [faces, setFaces] = useState<[number, number, number]>([0, 1, 2]);
  const [highlight, setHighlight] = useState<"none" | "win" | "scatter" | "bonus">("none");
  const [winText, setWinText] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [betBoost, setBetBoost] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [bonusOpen, setBonusOpen] = useState(false);
  const [bonusTitle, setBonusTitle] = useState("Bonus Round");
  const [bonusPicks, setBonusPicks] = useState<(number | null)[]>(Array(9).fill(null));
  const [bonusDone, setBonusDone] = useState(false);
  const [jackpot, setJackpot] = useState(248_560);
  const [xp, setXp] = useState(62);
  const [level, setLevel] = useState(14);
  const [freeSpins, setFreeSpins] = useState(0);
  const [spinCount, setSpinCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [unlocked, setUnlocked] = useState<string[]>(["bronze"]);
  const [bigWin, setBigWin] = useState<number | null>(null);
  const [missions, setMissions] = useState<Mission[]>([
    { id: "m1", title: "Warm-up spins", detail: "Spin 8 times today", progress: 0, target: 8, reward: 200 },
    { id: "m2", title: "Portal hunter", detail: "Trigger 1 bonus feature", progress: 0, target: 1, reward: 350 },
    { id: "m3", title: "Boost believer", detail: "Win with Bet Boost on", progress: 0, target: 1, reward: 250 },
  ]);

  const streakDay = 4;
  const dailyReward = 500 + (streakDay - 1) * 100;
  const stake = freeSpins > 0 ? 0 : betBoost ? BASE_STAKE * BOOST_MULT : BASE_STAKE;
  const xpPct = Math.min(100, xp);

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

  function addXp(amount: number) {
    setXp((v) => {
      const next = v + amount;
      if (next >= 100) {
        setLevel((l) => l + 1);
        setToast("Level up! Keep perks unlocked");
        beep(sfx.winBig);
        return next - 100;
      }
      return next;
    });
  }

  function unlockTrophy(id: string) {
    setUnlocked((u) => (u.includes(id) ? u : [...u, id]));
  }

  function claimDaily() {
    if (claimed) return;
    beep(sfx.claim);
    setTokens((v) => v + dailyReward);
    setClaimed(true);
    setShowBonus(false);
    setToast(`+${dailyReward} daily tokens claimed`);
  }

  function sendGift(amount: number, name: string) {
    if (tokens < amount) {
      setToast("Not enough tokens");
      return;
    }
    beep(sfx.click);
    setTokens((v) => v - amount);
    setToast(`Gifted ${amount} to ${name}`);
  }

  function openGame(g: GameDef) {
    beep(sfx.unlock);
    beep(sfx.click);
    setActiveGame(g);
    setFaces([0, 1, 2]);
    setWinText("");
    setHighlight("none");
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
    setHighlight("bonus");
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
      setWinText(`Bonus banked +${boosted}`);
      setFreeSpins((f) => f + (betBoost ? 5 : 3));
      setBigWin(boosted);
      beep(sfx.winBig);
      unlockTrophy(boosted >= 800 ? "plat" : "gold");
      setTimeout(() => setBonusOpen(false), 700);
    }
  }

  function spin() {
    if (spinning || !activeGame || bonusOpen) return;
    if (freeSpins <= 0 && tokens < stake) {
      setToast(`Need ${stake} tokens to spin`);
      return;
    }

    beep(sfx.spinStart);
    setSpinning(true);
    setWinText("");
    setHighlight("none");
    setBigWin(null);

    if (freeSpins > 0) {
      setFreeSpins((f) => f - 1);
    } else {
      setTokens((v) => v - stake);
    }

    setSpinCount((c) => c + 1);
    bumpMission("m1");
    addXp(betBoost ? 8 : 5);

    const len = activeGame.symbols.length;
    let ticks = 0;
    const id = window.setInterval(() => {
      beep(sfx.reelTick);
      setFaces([randFace(len), randFace(len), randFace(len)]);
      ticks += 1;
      if (ticks > 14) {
        window.clearInterval(id);
        finishSpin(activeGame);
      }
    }, 70);
  }

  function finishSpin(game: GameDef) {
    const len = game.symbols.length;
    const forceFeature = Math.random() < (betBoost ? 0.32 : 0.16);
    let final: [number, number, number];

    if (forceFeature) {
      const sc = game.symbols.findIndex((s) => s.kind === "scatter" || s.kind === "bonus");
      const idx = sc >= 0 ? sc : 0;
      final = [idx, idx, randFace(len)];
    } else {
      const roll = () => {
        const r = Math.random();
        const bonusChance = betBoost ? 0.24 : 0.12;
        if (r < bonusChance) {
          const sc = game.symbols.findIndex((s) => s.kind === "scatter" || s.kind === "bonus");
          if (sc >= 0) return sc;
        }
        return randFace(len);
      };
      final = [roll(), roll(), roll()];
    }

    setFaces(final);
    setSpinning(false);
    beep(sfx.reelStop);

    const landed = final.map((i) => game.symbols[i]);
    const scatterCount = landed.filter((s) => s.kind === "scatter" || s.kind === "bonus").length;
    const allSame = landed[0].id === landed[1].id && landed[1].id === landed[2].id;
    const pair =
      landed[0].id === landed[1].id || landed[1].id === landed[2].id || landed[0].id === landed[2].id;
    const wildAssist = landed.some((s) => s.kind === "wild") && pair;
    const randomFeature = Math.random() < (betBoost ? 0.14 : 0.07);
    const effectiveStake = betBoost ? BASE_STAKE * BOOST_MULT : BASE_STAKE;

    if (scatterCount >= 2 || (landed.some((s) => s.kind === "bonus") && Math.random() < 0.75)) {
      setHighlight("scatter");
      setWinText("PORTAL / SCATTER LOCKED!");
      setCombo((c) => c + 1);
      const kind =
        game.id === "console" ? "pad" : game.id === "vault" ? "heist" : game.id === "raid" ? "storm" : "scatter";
      setTimeout(() => startBonus(kind), 420);
      return;
    }

    if (randomFeature) {
      setHighlight("bonus");
      setWinText("RANDOM FEATURE DROP!");
      setCombo((c) => c + 1);
      setTimeout(() => startBonus(game.id === "raid" ? "storm" : game.id === "console" ? "pad" : "scatter"), 380);
      return;
    }

    if (allSame || wildAssist) {
      const payout = Math.round(effectiveStake * (allSame ? 12 : 5) * (1 + combo * 0.15));
      setTokens((v) => v + payout);
      setHighlight("win");
      setWinText(allSame ? `TRIPLE HIT +${payout}` : `WILD ASSIST +${payout}`);
      setCombo((c) => c + 1);
      beep(sfx.winBig);
      if (betBoost) bumpMission("m3");
      if (payout >= effectiveStake * 8) setBigWin(payout);
      if (allSame) unlockTrophy("silver");
      // progressive bite
      if (allSame && Math.random() < 0.2) {
        const jp = Math.floor(jackpot * 0.02);
        setJackpot((j) => j - jp);
        setTokens((v) => v + jp);
        setWinText(`JACKPOT NIBBLE +${jp}`);
        unlockTrophy("plat");
      }
      return;
    }

    if (pair) {
      const payout = Math.round(effectiveStake * 2.4 * (1 + combo * 0.08));
      setTokens((v) => v + payout);
      setHighlight("win");
      setWinText(`LINE WIN +${payout}`);
      setCombo((c) => c + 1);
      beep(sfx.winSmall);
      if (betBoost) bumpMission("m3");
      return;
    }

    setCombo(0);
    setWinText(freeSpins > 0 ? "Free spin miss — keep going" : "No win — Boost for more portals");
    beep(sfx.lose);
  }

  return (
    <div className="stage">
      <div className="stage-label">
        <h1>SpinKeep</h1>
        <p>
          Sky Vegas / Coral / BetVictor-inspired polish — chrome cabinets, progressive
          jackpot, missions, free spins, trophies. Platinum Pad Live is an original
          console theme (not PlayStation-licensed).
        </p>
      </div>

      <div className="phone-shell">
        <div className="phone-notch" />
        <div className="phone-screen">
          <div className="app">
            <div className="status-bar">
              <span>9:41</span>
              <span>5G · 86%</span>
            </div>

            <header className="top-bar">
              <div className="brand-mark">
                <div className="crest" aria-hidden>
                  <span>SK</span>
                </div>
                <div>
                  <strong>SpinKeep</strong>
                  <small>Lvl {level} · Gold Keep</small>
                </div>
              </div>
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

                    <h2 className="page-title">{activeGame.name}</h2>
                    <p className="page-sub">{activeGame.blurb}</p>

                    <div className="slot-stage">
                      <div className="hud-row">
                        <span className="chip gold">3D HQ</span>
                        <span className="chip hot">{freeSpins > 0 ? `FREE ${freeSpins}` : `STAKE ${stake || BASE_STAKE}`}</span>
                        {betBoost && <span className="chip boost">BOOST</span>}
                        <span className="chip">SPINS {spinCount}</span>
                      </div>

                      <SlotScene
                        symbols={activeGame.symbols}
                        faces={faces}
                        spinning={spinning}
                        theme={activeGame.theme}
                        highlight={highlight}
                      />

                      <div className="xp-card">
                        <div className="row">
                          <strong>Keep XP · Lvl {level}</strong>
                          <span>{xp}/100 to next</span>
                        </div>
                        <div className="xp-bar">
                          <i style={{ width: `${xpPct}%` }} />
                        </div>
                      </div>

                      {activeGame.id === "console" && (
                        <>
                          <div className="section-head" style={{ marginTop: 10, marginBottom: 6 }}>
                            <h3 style={{ fontSize: "0.9rem" }}>Trophy hunt</h3>
                            <span className="chip gold">{unlocked.length}/{TROPHIES.length}</span>
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

                      <div
                        className={`boost-toggle${betBoost ? " on" : ""}`}
                        onClick={() => {
                          setBetBoost((v) => {
                            const next = !v;
                            if (next) beep(sfx.boostOn);
                            else beep(sfx.click);
                            return next;
                          });
                        }}
                        role="switch"
                        aria-checked={betBoost}
                      >
                        <div>
                          <strong>Bet Boost</strong>
                          <span>2× stake · double portal / scatter odds</span>
                        </div>
                        <div className={`switch${betBoost ? " on" : ""}`}>
                          <i />
                        </div>
                      </div>

                      <div className="feature-row">
                        <div className="feature-card">
                          <strong>Scatters & portals</strong>
                          <span>2+ LIVE/PORT → free-pick + free spins</span>
                        </div>
                        <div className="feature-card">
                          <strong>Random drops</strong>
                          <span>Surprise features keep sessions sticky</span>
                        </div>
                      </div>

                      <div className="spin-controls">
                        <button className="btn btn-ghost" onClick={() => setToast("Hold / nudge in full build")}>
                          Hold
                        </button>
                        <button className="btn btn-spin" onClick={spin} disabled={spinning || bonusOpen}>
                          {spinning ? "…" : freeSpins > 0 ? "FREE SPIN" : "SPIN"}
                        </button>
                        <div className="stake">
                          Stake
                          <b>{stake || "FREE"}</b>
                        </div>
                      </div>
                      <div className="win-toast">{winText}</div>
                      {activeGame.note && <p className="notice">{activeGame.note}</p>}
                    </div>

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
                      <p>
                        Day {streakDay} streak · Coral-punch rewards. Miss a day, heat cools.
                      </p>
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
                    <p className="page-sub">Premium cabinets · jackpots · hooks that pull you back.</p>
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
                    <div className="stat-strip" style={{ marginTop: 14 }}>
                      <div className="stat">
                        <b>18</b>
                        <span>Donations</span>
                      </div>
                      <div className="stat">
                        <b>2.4k</b>
                        <span>Chest pts</span>
                      </div>
                      <div className="stat">
                        <b>#41</b>
                        <span>Local rank</span>
                      </div>
                    </div>
                    <div className="feed">
                      <div className="feed-item">
                        <div className="avatar" style={{ background: "#f0c14b" }}>★</div>
                        <div>
                          <p><b>Pad Live raid</b> — clan spins feed the network jackpot</p>
                          <time>Ends in 1d 4h</time>
                        </div>
                      </div>
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
                    <p className="page-sub">Gift tokens → pull friends online. Caps stop abuse.</p>
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
                    <div className="section-head">
                      <h3>Later: token shop</h3>
                    </div>
                    <div className="clan-banner">
                      <div className="badge">$</div>
                      <div>
                        <strong>Buy packs</strong>
                        <small>IAP placeholder — App Store / Play only</small>
                      </div>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "8px 10px" }}
                        onClick={() => setToast("Purchases come in phase 2")}
                      >
                        Soon
                      </button>
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
                    <p>Streak day {streakDay}. Day 7 drops a mega chest — don’t break the chain.</p>
                    <div className="streak-row" style={{ marginBottom: 16 }}>
                      {STREAK.map((d) => (
                        <div key={d.day} className={`day-pip${d.done ? " done" : ""}${d.today ? " today" : ""}`}>
                          {d.bonus ? "★" : d.day}
                        </div>
                      ))}
                    </div>
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
                <motion.div
                  className="modal-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setBigWin(null)}
                >
                  <motion.div
                    className="modal bigwin-modal"
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                  >
                    <div className="eyebrow" style={{ color: "#ffb09e", letterSpacing: "0.16em", fontWeight: 800, fontSize: "0.7rem" }}>
                      BIG WIN
                    </div>
                    <h2 style={{ fontSize: "2rem", color: "#ffd28a" }}>+{formatTokens(bigWin)}</h2>
                    <p>That’s the hook. Spin again while the combo’s hot.</p>
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
          </div>
        </div>
      </div>

      <div className="legend">
        <span>UK casino gloss</span>
        <span>Platinum Pad Live</span>
        <span>Jackpot · XP · missions</span>
        <span>Free spins · trophies</span>
      </div>
    </div>
  );
}
