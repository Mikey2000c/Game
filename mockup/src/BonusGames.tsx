import { useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";

export type BonusKind = "angler" | "heist" | "storm" | "pad";

type Props = {
  kind: BonusKind;
  title: string;
  onComplete: (result: { freeSpins: number; label: string }) => void;
  onClose: () => void;
};

/** Distinct mini-games per cabinet — styles differ; free-spin awards only (wallet stays on /spin). */
export function BonusGame({ kind, title, onComplete, onClose }: Props) {
  if (kind === "angler") return <AnglerCatch title={title} onComplete={onComplete} onClose={onClose} />;
  if (kind === "heist") return <VaultCrack title={title} onComplete={onComplete} onClose={onClose} />;
  if (kind === "storm") return <StormWheel title={title} onComplete={onComplete} onClose={onClose} />;
  return <PortalPick title={title} onComplete={onComplete} onClose={onClose} />;
}

function Shell({
  title,
  kicker,
  children,
  onClose,
}: {
  title: string;
  kicker: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop bonus-game-backdrop">
      <motion.div
        className="modal bonus-modal bonus-game"
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
      >
        <button className="bonus-x" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="eyebrow">{kicker}</div>
        <h2>{title}</h2>
        {children}
      </motion.div>
    </div>
  );
}

/** Neon Orchard — cast & catch money fish (collect vibe, original art). */
function AnglerCatch({
  title,
  onComplete,
  onClose,
}: {
  title: string;
  onComplete: Props["onComplete"];
  onClose: () => void;
}) {
  const fish = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        value: [2, 3, 5, 8, 10, 15, 20, 50][i % 8]!,
        caught: false,
      })),
    [],
  );
  const [caught, setCaught] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  function catchFish(id: number) {
    if (done || caught.includes(id)) return;
    const next = [...caught, id];
    setCaught(next);
    if (next.length >= 3) {
      setDone(true);
      const fs = 10 + Math.min(10, next.length * 2);
      window.setTimeout(() => onComplete({ freeSpins: fs, label: `Angler packed ${fs} free spins` }), 500);
    }
  }

  return (
    <Shell title={title} kicker="Money Fish Feature" onClose={onClose}>
      <p className="bonus-lead">Tap 3 fish to fill the keep net — wilds will collect cash in free spins.</p>
      <div className="angler-pond">
        {fish.map((f) => (
          <button
            key={f.id}
            className={`pond-fish${caught.includes(f.id) ? " caught" : ""}`}
            onClick={() => catchFish(f.id)}
            disabled={done}
          >
            <span className="pond-ico" aria-hidden />
            <b>{f.value}×</b>
          </button>
        ))}
      </div>
      <div className="bonus-progress">Caught {caught.length}/3</div>
    </Shell>
  );
}

/** Vault Rush — crack three dials. */
function VaultCrack({
  title,
  onComplete,
  onClose,
}: {
  title: string;
  onComplete: Props["onComplete"];
  onClose: () => void;
}) {
  const [locks, setLocks] = useState([false, false, false]);
  const [spins, setSpins] = useState([0, 0, 0]);

  function crack(i: number) {
    if (locks[i]) return;
    const nextSpins = [...spins];
    nextSpins[i] = 2 + Math.floor(Math.random() * 4);
    setSpins(nextSpins);
    const next = [...locks];
    next[i] = true;
    setLocks(next);
    if (next.every(Boolean)) {
      const fs = 12 + nextSpins.reduce((a, b) => a + b, 0);
      window.setTimeout(() => onComplete({ freeSpins: fs, label: `Vault open · ${fs} free spins` }), 450);
    }
  }

  return (
    <Shell title={title} kicker="Vault Heist" onClose={onClose}>
      <p className="bonus-lead">Crack each lock. Higher dials mean more free spins inside the vault.</p>
      <div className="vault-dials">
        {locks.map((open, i) => (
          <button key={i} className={`vault-dial${open ? " open" : ""}`} onClick={() => crack(i)}>
            <span className="dial-ring" style={{ transform: `rotate(${spins[i]! * 40}deg)` }} />
            <b>{open ? `${spins[i]}` : "LOCK"}</b>
          </button>
        ))}
      </div>
    </Shell>
  );
}

/** Raid Spins — multiplier storm wheel. */
function StormWheel({
  title,
  onComplete,
  onClose,
}: {
  title: string;
  onComplete: Props["onComplete"];
  onClose: () => void;
}) {
  const slices = [8, 10, 12, 15, 10, 20, 12, 25];
  const [spinning, setSpinning] = useState(false);
  const [rot, setRot] = useState(0);
  const [result, setResult] = useState<number | null>(null);

  function spin() {
    if (spinning || result != null) return;
    setSpinning(true);
    const idx = Math.floor(Math.random() * slices.length);
    const fs = slices[idx]!;
    const turns = 4 + Math.random() * 2;
    const angle = turns * 360 + idx * (360 / slices.length);
    setRot(angle);
    window.setTimeout(() => {
      setSpinning(false);
      setResult(fs);
      onComplete({ freeSpins: fs, label: `Storm awards ${fs} free spins` });
    }, 2200);
  }

  return (
    <Shell title={title} kicker="Multiplier Storm" onClose={onClose}>
      <p className="bonus-lead">Spin the storm wheel — free spins fuel wild money collects.</p>
      <div className="storm-wheel-wrap">
        <div className="storm-pointer" />
        <div
          className={`storm-wheel${spinning ? " go" : ""}`}
          style={{ transform: `rotate(${rot}deg)` }}
        >
          {slices.map((n, i) => (
            <span key={i} style={{ transform: `rotate(${i * (360 / slices.length)}deg)` }}>
              {n}
            </span>
          ))}
        </div>
      </div>
      <button className="btn btn-primary" disabled={spinning || result != null} onClick={spin}>
        {spinning ? "Spinning…" : result != null ? `${result} FREE SPINS` : "SPIN STORM"}
      </button>
    </Shell>
  );
}

/** Platinum Pad — portal tile pick. */
function PortalPick({
  title,
  onComplete,
  onClose,
}: {
  title: string;
  onComplete: Props["onComplete"];
  onClose: () => void;
}) {
  const [picks, setPicks] = useState<(number | null)[]>(Array(9).fill(null));
  const [done, setDone] = useState(false);

  function pick(i: number) {
    if (done || picks[i] !== null) return;
    const values = [8, 10, 10, 12, 15, 15, 20, 10, 25];
    const value = values[Math.floor(Math.random() * values.length)]!;
    const next = [...picks];
    next[i] = value;
    setPicks(next);
    const revealed = next.filter((v) => v !== null).length;
    if (revealed >= 3) {
      setDone(true);
      const best = Math.max(...next.filter((v): v is number => v != null));
      window.setTimeout(
        () => onComplete({ freeSpins: best, label: `Portal unlocked ${best} free spins` }),
        450,
      );
    }
  }

  return (
    <Shell title={title} kicker="Platinum Portal" onClose={onClose}>
      <p className="bonus-lead">Pick 3 portals — the highest value becomes your free-spin count.</p>
      <div className="bonus-grid portal-grid">
        {picks.map((v, i) => (
          <button key={i} className={`bonus-cell${v != null ? " on" : ""}`} onClick={() => pick(i)}>
            {v == null ? "?" : v}
          </button>
        ))}
      </div>
    </Shell>
  );
}
