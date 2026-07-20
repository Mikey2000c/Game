import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./index.css";

type Tab = "home" | "games" | "clan" | "social";

const GAMES = [
  {
    id: "fruit",
    name: "Neon Orchard",
    blurb: "Classic fruit reels · nudge & hold",
    art: "art-fruit",
    emoji: ["🍒", "🍋", "🔔"],
  },
  {
    id: "vault",
    name: "Vault Rush",
    blurb: "Jackpot trail · clan boosts",
    art: "art-vault",
    emoji: ["💎", "🔐", "⚡"],
  },
  {
    id: "raid",
    name: "Raid Spins",
    blurb: "Fast rounds · gift multipliers",
    art: "art-raid",
    emoji: ["🔥", "🪙", "🎯"],
  },
];

const FEED = [
  { id: 1, who: "Maya", color: "#e07a3a", text: "sent you 250 tokens", when: "2m" },
  { id: 2, who: "Rex", color: "#3dd6c3", text: "hit a 12× on Vault Rush", when: "8m" },
  { id: 3, who: "Keep", color: "#f0c14b", text: "Clan chest unlocked — claim soon", when: "1h" },
];

const FRIENDS = [
  { id: "m", name: "Maya", status: "Online · spinning", gift: 100 },
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

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [tokens, setTokens] = useState(12840);
  const [claimed, setClaimed] = useState(false);
  const [showBonus, setShowBonus] = useState(true);
  const [activeGame, setActiveGame] = useState<(typeof GAMES)[0] | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState(["🍒", "🍋", "🔔"]);
  const [winText, setWinText] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const streakDay = 4;
  const dailyReward = 500 + (streakDay - 1) * 100;

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

  function claimBonus() {
    if (claimed) return;
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
    setTokens((v) => v - amount);
    setToast(`Gifted ${amount} to ${name}`);
  }

  function spin() {
    if (spinning || !activeGame) return;
    if (tokens < 50) {
      setToast("Need 50 tokens to spin");
      return;
    }
    setSpinning(true);
    setWinText("");
    setTokens((v) => v - 50);

    const symbols = activeGame.emoji;
    let ticks = 0;
    const id = window.setInterval(() => {
      setReels([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ]);
      ticks += 1;
      if (ticks > 12) {
        window.clearInterval(id);
        const final = [
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
        ];
        setReels(final);
        setSpinning(false);
        if (final[0] === final[1] && final[1] === final[2]) {
          const payout = 500;
          setTokens((v) => v + payout);
          setWinText(`JACKPOT +${payout}`);
        } else if (final[0] === final[1] || final[1] === final[2] || final[0] === final[2]) {
          const payout = 120;
          setTokens((v) => v + payout);
          setWinText(`Nice hit +${payout}`);
        } else {
          setWinText("No win — spin again");
        }
      }
    }, 70);
  }

  return (
    <div className="stage">
      <div className="stage-label">
        <h1>SpinKeep</h1>
        <p>
          Viral social slots mockup — daily streak, clans, gifts, and multiple
          games. Tap through the phone UI.
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
              <div className="wallet" aria-label="Token balance">
                <span className="coin" />
                <b>{formatTokens(tokens)}</b>
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
                    <button className="linkish" onClick={() => setActiveGame(null)}>
                      ← Back to lobby
                    </button>
                    <h2 className="page-title" style={{ marginTop: 8 }}>
                      {activeGame.name}
                    </h2>
                    <p className="page-sub">{activeGame.blurb}</p>

                    <div className="slot-stage">
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span className="chip">Demo RTP</span>
                        <span className="chip">Stake 50</span>
                      </div>
                      <div className="reels">
                        {reels.map((symbol, i) => (
                          <div className="reel" key={i}>
                            <motion.span
                              key={`${symbol}-${spinning}-${i}`}
                              animate={spinning ? { y: [0, -8, 0] } : { y: 0 }}
                              transition={{ repeat: spinning ? Infinity : 0, duration: 0.12 }}
                            >
                              {symbol}
                            </motion.span>
                            <div className="payline" />
                          </div>
                        ))}
                      </div>
                      <div className="spin-controls">
                        <button className="btn btn-ghost" onClick={() => setToast("Hold coming in build")}>
                          Hold
                        </button>
                        <button className="btn btn-primary" onClick={spin} disabled={spinning}>
                          {spinning ? "Spinning…" : "SPIN"}
                        </button>
                        <div className="stake">
                          Stake
                          <b>50</b>
                        </div>
                      </div>
                      <div className="win-toast">{winText}</div>
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
                        Day {streakDay} streak · come back tomorrow for a bigger
                        drop. Miss a day, streak cools off.
                      </p>
                      <div className="cta-row">
                        <button
                          className="btn btn-primary"
                          onClick={() => (claimed ? setToast("Already claimed today") : setShowBonus(true))}
                        >
                          {claimed ? "Streak safe" : `Claim ${dailyReward}`}
                        </button>
                        <button className="btn btn-ghost" onClick={() => setTab("clan")}>
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
                          title={d.bonus ? "Mega day" : `Day ${d.day}`}
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
                        <button
                          key={g.id}
                          className="game-tile"
                          onClick={() => {
                            setActiveGame(g);
                            setReels(g.emoji);
                            setWinText("");
                          }}
                        >
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
                    <p className="page-sub">Multiple cabinets, one wallet. Pick a vibe and spin.</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {GAMES.map((g) => (
                        <button
                          key={g.id}
                          className="game-tile"
                          style={{ minHeight: 132, width: "100%" }}
                          onClick={() => {
                            setActiveGame(g);
                            setReels(g.emoji);
                            setWinText("");
                          }}
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
                    <p className="page-sub">Clash-style keep energy — donate, raid weekends, share chests.</p>

                    <div className="clan-banner">
                      <div className="badge">VK</div>
                      <div>
                        <strong>Velvet Kings</strong>
                        <small>32 members · Clan lvl 8 · War ready</small>
                      </div>
                      <button className="btn btn-ghost" style={{ padding: "8px 10px" }} onClick={() => setToast("Invite link copied")}>
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
                        <div className="avatar" style={{ background: "#f0c14b" }}>
                          ★
                        </div>
                        <div>
                          <p>
                            <b>Weekend raid</b> — members spin Vault Rush for shared loot
                          </p>
                          <time>Ends in 1d 4h</time>
                        </div>
                      </div>
                      <div className="feed-item">
                        <div className="avatar" style={{ background: "#3dd6c3" }}>
                          ⇪
                        </div>
                        <div>
                          <p>
                            <b>Donation board</b> — top gifters unlock cosmetic banners
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
                    <p className="page-sub">Send tokens to pull friends back online. Caps stop abuse.</p>

                    <div className="gift-list">
                      {FRIENDS.map((f) => (
                        <div className="gift-row" key={f.id}>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <div className="avatar" style={{ background: "#234" }}>
                              {f.name.slice(0, 1)}
                            </div>
                            <div>
                              <strong>{f.name}</strong>
                              <span>{f.status}</span>
                            </div>
                          </div>
                          <button className="btn btn-primary" style={{ padding: "8px 12px" }} onClick={() => sendGift(f.gift, f.name)}>
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
                      <button className="btn btn-ghost" style={{ padding: "8px 10px" }} onClick={() => setToast("Purchases come in phase 2")}>
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
                    onClick={() => setTab(item.id)}
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
                      Streak day {streakDay}. Claim now, then come back tomorrow —
                      day 7 drops a mega chest.
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
                    <button className="btn btn-primary" style={{ width: "100%" }} onClick={claimBonus}>
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
                    background: "rgba(5,12,16,0.92)",
                    border: "1px solid rgba(240,193,75,0.35)",
                    fontSize: "0.82rem",
                    fontWeight: 600,
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
        <span>Daily streak claim</span>
        <span>Clans / keeps</span>
        <span>Friends & gifts</span>
        <span>Multi-game lobby</span>
        <span>IAP placeholder</span>
      </div>
    </div>
  );
}
