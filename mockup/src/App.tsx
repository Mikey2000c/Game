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
};

const BASE_STAKE = 50;
const BOOST_MULT = 2;

const GAMES: GameDef[] = [
  {
    id: "fruit",
    name: "Neon Orchard",
    blurb: "Fruit reels · scatters unlock fruit frenzy",
    art: "art-fruit",
    theme: "orchard",
    symbols: [
      { id: "ch", label: "CH", color: "#ff6b6b", accent: "#ffd6d6" },
      { id: "lm", label: "LM", color: "#ffd43b", accent: "#fff3bf" },
      { id: "bl", label: "BL", color: "#748ffc", accent: "#dbe4ff" },
      { id: "bn", label: "BN", color: "#ff922b", accent: "#ffe8cc" },
      { id: "wd", label: "WD", color: "#20c997", accent: "#c3fae8", kind: "wild" },
      { id: "sc", label: "SC", color: "#f06595", accent: "#ffdeeb", kind: "scatter" },
    ],
  },
  {
    id: "console",
    name: "Circuit Pad",
    blurb: "Original console-cabinet theme · pad, disc, trophy reels",
    art: "art-console",
    theme: "console",
    note: "Original art only — not affiliated with Sony or PlayStation. Official console brands need a license.",
    symbols: [
      { id: "pad", label: "PAD", color: "#3d6bff", accent: "#d0dbff" },
      { id: "disc", label: "DISC", color: "#868e96", accent: "#e9ecef" },
      { id: "cart", label: "CART", color: "#15aabf", accent: "#c5f6fa" },
      { id: "joy", label: "JOY", color: "#ff6b4a", accent: "#ffd8ce" },
      { id: "cup", label: "CUP", color: "#fab005", accent: "#fff3bf", kind: "wild" },
      { id: "port", label: "PORT", color: "#7950f2", accent: "#e5dbff", kind: "bonus" },
      { id: "sc", label: "SC", color: "#ff4fd8", accent: "#ffd6f5", kind: "scatter" },
    ],
  },
  {
    id: "vault",
    name: "Vault Rush",
    blurb: "Jackpot trail · random vault heist bonus",
    art: "art-vault",
    theme: "vault",
    symbols: [
      { id: "gem", label: "GEM", color: "#22b8cf", accent: "#c5f6fa" },
      { id: "key", label: "KEY", color: "#fcc419", accent: "#fff3bf" },
      { id: "bag", label: "BAG", color: "#51cf66", accent: "#d3f9d8" },
      { id: "bolt", label: "ZAP", color: "#ff922b", accent: "#ffe8cc" },
      { id: "safe", label: "SAFE", color: "#748ffc", accent: "#dbe4ff", kind: "wild" },
      { id: "sc", label: "SC", color: "#e64980", accent: "#ffdeeb", kind: "scatter" },
    ],
  },
  {
    id: "raid",
    name: "Raid Spins",
    blurb: "Fast raids · random multiplier storm",
    art: "art-raid",
    theme: "raid",
    symbols: [
      { id: "fire", label: "FIRE", color: "#ff6b4a", accent: "#ffd8ce" },
      { id: "coin", label: "COIN", color: "#ffd43b", accent: "#fff3bf" },
      { id: "tgt", label: "TGT", color: "#fa5252", accent: "#ffe3e3" },
      { id: "clk", label: "CLK", color: "#845ef7", accent: "#e5dbff" },
      { id: "wd", label: "WD", color: "#20c997", accent: "#c3fae8", kind: "wild" },
      { id: "sc", label: "SC", color: "#f06595", accent: "#ffdeeb", kind: "scatter" },
    ],
  },
];

const FEED = [
  { id: 1, who: "Maya", color: "#ff6b4a", text: "hit Circuit Pad bonus round", when: "2m" },
  { id: 2, who: "Rex", color: "#3d6bff", text: "Bet Boost → 18× storm", when: "8m" },
  { id: 3, who: "Keep", color: "#ffb020", text: "Clan chest unlocked — claim soon", when: "1h" },
];

const FRIENDS = [
  { id: "m", name: "Maya", status: "Online · Circuit Pad", gift: 100 },
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

  const streakDay = 4;
  const dailyReward = 500 + (streakDay - 1) * 100;
  const stake = betBoost ? BASE_STAKE * BOOST_MULT : BASE_STAKE;

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
  }

  function startBonus(kind: "scatter" | "heist" | "storm" | "pad") {
    const titles = {
      scatter: "Scatter Free-Pick",
      heist: "Vault Heist Bonus",
      storm: "Multiplier Storm",
      pad: "Circuit Pad Portal",
    };
    setBonusTitle(titles[kind]);
    setBonusPicks(Array(9).fill(null));
    setBonusDone(false);
    setBonusOpen(true);
    setHighlight("bonus");
    beep(sfx.bonus);
  }

  function pickBonusCell(i: number) {
    if (bonusDone || bonusPicks[i] !== null) return;
    const values = [50, 100, 150, 250, 400, 800, 50, 100, 1200];
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
      beep(sfx.winBig);
      setTimeout(() => {
        setBonusOpen(false);
        setHighlight("win");
      }, 900);
    }
  }

  function spin() {
    if (spinning || !activeGame || bonusOpen) return;
    if (tokens < stake) {
      setToast(`Need ${stake} tokens to spin`);
      return;
    }

    beep(sfx.spinStart);
    setSpinning(true);
    setWinText("");
    setHighlight("none");
    setTokens((v) => v - stake);

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
    }, 75);
  }

  function finishSpin(game: GameDef) {
    const len = game.symbols.length;
    // Weighted-ish random with boost raising bonus/scatter odds
    const rollFace = () => {
      const r = Math.random();
      const bonusChance = betBoost ? 0.22 : 0.11;
      const scatterChance = betBoost ? 0.2 : 0.1;
      if (r < bonusChance) {
        const bonusIdx = game.symbols.findIndex((s) => s.kind === "bonus" || s.kind === "scatter");
        if (bonusIdx >= 0 && Math.random() < 0.55) return bonusIdx;
      }
      if (r < bonusChance + scatterChance) {
        const sc = game.symbols.findIndex((s) => s.kind === "scatter");
        if (sc >= 0) return sc;
      }
      return randFace(len);
    };

    // Occasionally force feature for demo feel
    const forceFeature = Math.random() < (betBoost ? 0.28 : 0.14);
    let final: [number, number, number];
    if (forceFeature) {
      const sc = game.symbols.findIndex((s) => s.kind === "scatter" || s.kind === "bonus");
      const idx = sc >= 0 ? sc : 0;
      final = [idx, idx, randFace(len)];
    } else {
      final = [rollFace(), rollFace(), rollFace()];
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

    // Random win feature independent of reels
    const randomFeature = Math.random() < (betBoost ? 0.12 : 0.06);

    if (scatterCount >= 2 || (landed.some((s) => s.kind === "bonus") && Math.random() < 0.7)) {
      setHighlight("scatter");
      setWinText("SCATTER / PORTAL!");
      const kind =
        game.id === "console" ? "pad" : game.id === "vault" ? "heist" : game.id === "raid" ? "storm" : "scatter";
      setTimeout(() => startBonus(kind), 450);
      return;
    }

    if (randomFeature) {
      setHighlight("bonus");
      setWinText("RANDOM FEATURE!");
      setTimeout(() => startBonus(game.id === "raid" ? "storm" : "scatter"), 400);
      return;
    }

    if (allSame || wildAssist) {
      const payout = Math.round(stake * (allSame ? 10 : 4) * (betBoost ? 1.25 : 1));
      setTokens((v) => v + payout);
      setHighlight("win");
      setWinText(allSame ? `TRIPLE HIT +${payout}` : `WILD ASSIST +${payout}`);
      beep(sfx.winBig);
      return;
    }

    if (pair) {
      const payout = Math.round(stake * 2.2);
      setTokens((v) => v + payout);
      setHighlight("win");
      setWinText(`LINE WIN +${payout}`);
      beep(sfx.winSmall);
      return;
    }

    setWinText("No win — boost for more bonus odds");
    beep(sfx.lose);
  }

  return (
    <div className="stage">
      <div className="stage-label">
        <h1>SpinKeep</h1>
        <p>
          Bright social-slots mockup — 3D reels, sound, Bet Boost (2× bonus chance),
          scatters & random bonus games. Circuit Pad is an original console theme
          (not PlayStation-licensed).
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
                  <small>Lvl 14 · Gold Keep</small>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button
                  className={`chip${soundOn ? "" : " hot"}`}
                  onClick={() => {
                    setSoundOn((v) => !v);
                    if (!soundOn) sfx.unlock();
                  }}
                  aria-label="Toggle sound"
                >
                  {soundOn ? "SND" : "MUTE"}
                </button>
                <div className="wallet" aria-label="Token balance">
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
                      ← Back to lobby
                    </button>
                    <h2 className="page-title" style={{ marginTop: 8 }}>
                      {activeGame.name}
                    </h2>
                    <p className="page-sub">{activeGame.blurb}</p>

                    <div className="slot-stage">
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                        <span className="chip">3D HQ demo</span>
                        <span className="chip hot">Stake {stake}</span>
                        {betBoost && <span className="chip boost">Boost ON</span>}
                      </div>

                      <div style={{ marginTop: 10 }}>
                        <SlotScene
                          symbols={activeGame.symbols}
                          faces={faces}
                          spinning={spinning}
                          theme={activeGame.theme}
                          highlight={highlight}
                        />
                      </div>

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
                          <span>2× stake · double bonus / scatter chance</span>
                        </div>
                        <div className={`switch${betBoost ? " on" : ""}`}>
                          <i />
                        </div>
                      </div>

                      <div className="feature-row">
                        <div className="feature-card">
                          <strong>Scatters</strong>
                          <span>2+ SC / PORT → free-pick bonus</span>
                        </div>
                        <div className="feature-card">
                          <strong>Random win</strong>
                          <span>Surprise heist / storm features</span>
                        </div>
                      </div>

                      <div className="spin-controls">
                        <button
                          className="btn btn-ghost"
                          onClick={() => setToast("Hold / nudge arrives in full build")}
                        >
                          Hold
                        </button>
                        <button className="btn btn-accent" onClick={spin} disabled={spinning || bonusOpen}>
                          {spinning ? "Spinning…" : "SPIN"}
                        </button>
                        <div className="stake">
                          Stake
                          <b>{stake}</b>
                        </div>
                      </div>
                      <div className="win-toast">{winText}</div>
                      {activeGame.note && <p className="notice">{activeGame.note}</p>}
                    </div>
                  </motion.div>
                ) : tab === "home" ? (
                  <motion.div
                    key="home"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <section className="hero-claim">
                      <div className="eyebrow">Daily Keep Bonus</div>
                      <h2>{claimed ? "You’re stacked for today" : "Claim before it resets"}</h2>
                      <p>
                        Day {streakDay} streak · brighter drops tomorrow. Miss a day,
                        streak cools off.
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
                      <span className="chip">Day {streakDay}/7</span>
                    </div>
                    <div className="streak-row" aria-label="Weekly login streak">
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
                      <h3>Hot games</h3>
                      <button onClick={() => setTab("games")}>See all</button>
                    </div>
                    <div className="game-rail">
                      {GAMES.map((g) => (
                        <button key={g.id} className="game-tile" onClick={() => openGame(g)}>
                          <div className={`art ${g.art}`} />
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
                    <p className="page-sub">
                      3D cabinets, sound, Bet Boost, scatters & surprise bonuses.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {GAMES.map((g) => (
                        <button
                          key={g.id}
                          className="game-tile"
                          style={{ minHeight: 140, width: "100%" }}
                          onClick={() => openGame(g)}
                        >
                          <div className={`art ${g.art}`} />
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
                    <p className="page-sub">Donate, raid weekends, share chests — Clash energy.</p>

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

                    <div className="section-head">
                      <h3>Clan goals</h3>
                    </div>
                    <div className="feed">
                      <div className="feed-item">
                        <div className="avatar" style={{ background: "#ffb020" }}>
                          ★
                        </div>
                        <div>
                          <p>
                            <b>Weekend raid</b> — Circuit Pad portal spins for shared loot
                          </p>
                          <time>Ends in 1d 4h</time>
                        </div>
                      </div>
                      <div className="feed-item">
                        <div className="avatar" style={{ background: "#3d6bff" }}>
                          ⇪
                        </div>
                        <div>
                          <p>
                            <b>Donation board</b> — top gifters unlock banners
                          </p>
                          <time>Resets Monday</time>
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
                    <p className="page-sub">Send tokens to pull friends back. Caps stop abuse.</p>

                    <div className="gift-list">
                      {FRIENDS.map((f) => (
                        <div className="gift-row" key={f.id}>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <div className="avatar" style={{ background: "#3d6bff" }}>
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
              <nav className="bottom-nav" aria-label="Primary">
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
                <motion.div
                  className="modal-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="modal"
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 30, opacity: 0 }}
                  >
                    <div className="reward-burst">+{dailyReward}</div>
                    <h2>Daily Keep Bonus</h2>
                    <p>
                      Streak day {streakDay}. Claim now — day 7 drops a mega chest.
                    </p>
                    <div className="streak-row" style={{ marginBottom: 16 }}>
                      {STREAK.map((d) => (
                        <div
                          key={d.day}
                          className={`day-pip${d.done ? " done" : ""}${d.today ? " today" : ""}`}
                        >
                          {d.bonus ? "★" : d.day}
                        </div>
                      ))}
                    </div>
                    <button className="btn btn-accent" style={{ width: "100%" }} onClick={claimDaily}>
                      Claim {dailyReward} tokens
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ width: "100%", marginTop: 8 }}
                      onClick={() => setShowBonus(false)}
                    >
                      Later
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {bonusOpen && (
                <motion.div
                  className="modal-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="modal bonus-modal"
                    initial={{ y: 40, opacity: 0, scale: 0.96 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 24, opacity: 0 }}
                  >
                    <h2>{bonusTitle}</h2>
                    <p>Pick 3 tiles. Bet Boost doubles the banked total.</p>
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
                    background: "rgba(255,255,255,0.94)",
                    border: "1px solid rgba(255,107,74,0.35)",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    boxShadow: "0 10px 24px rgba(40,60,100,0.12)",
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
        <span>Bright UI</span>
        <span>3D reels + SFX</span>
        <span>Bet Boost</span>
        <span>Scatter / random bonuses</span>
        <span>Circuit Pad (original)</span>
      </div>
    </div>
  );
}
