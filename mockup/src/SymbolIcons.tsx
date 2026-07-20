/** Premium SVG symbol glyphs for 5×3 reels (~60px readable). */

import { useId, type ReactNode } from "react";

type IconProps = { className?: string };

export function IconFish({ className }: IconProps) {
  const id = useId();
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="8" y1="12" x2="56" y2="52">
          <stop stopColor="#7ad7ff" />
          <stop offset="1" stopColor="#1c7ed6" />
        </linearGradient>
      </defs>
      <ellipse cx="30" cy="32" rx="22" ry="14" fill={`url(#${id})`} stroke="#fff" strokeWidth="2" />
      <path d="M48 32 L58 22 V42 Z" fill="#ff922b" stroke="#fff" strokeWidth="1.5" />
      <circle cx="20" cy="28" r="3" fill="#0b1020" />
      <circle cx="21" cy="27" r="1" fill="#fff" />
      <path d="M14 32 Q10 38 16 40" stroke="#ff6b6b" strokeWidth="2" fill="none" />
    </svg>
  );
}

export function IconCherry({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <path d="M28 28 C20 10 40 8 36 26" stroke="#2f9e44" strokeWidth="3" fill="none" />
      <circle cx="24" cy="40" r="12" fill="#e03131" stroke="#fff" strokeWidth="2" />
      <circle cx="40" cy="44" r="11" fill="#c92a2a" stroke="#fff" strokeWidth="2" />
      <ellipse cx="20" cy="36" rx="4" ry="2.5" fill="rgba(255,255,255,0.45)" />
    </svg>
  );
}

export function IconLemon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <ellipse cx="32" cy="34" rx="20" ry="14" transform="rotate(-18 32 34)" fill="#ffd43b" stroke="#fff" strokeWidth="2" />
      <ellipse cx="26" cy="28" rx="6" ry="3" transform="rotate(-18 26 28)" fill="rgba(255,255,255,0.45)" />
      <path d="M44 18 C48 16 52 20 50 24" stroke="#2f9e44" strokeWidth="2.5" fill="none" />
    </svg>
  );
}

export function IconBell({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <path d="M20 28 C20 16 44 16 44 28 V38 H20 Z" fill="#fcc419" stroke="#fff" strokeWidth="2" />
      <rect x="16" y="38" width="32" height="8" rx="2" fill="#f08c00" stroke="#fff" strokeWidth="1.5" />
      <circle cx="32" cy="50" r="4" fill="#ffe8a3" stroke="#fff" strokeWidth="1.5" />
      <circle cx="32" cy="16" r="3" fill="#ffd43b" />
    </svg>
  );
}

export function IconPad({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect x="8" y="22" width="48" height="26" rx="12" fill="#1c3faa" stroke="#9ec0ff" strokeWidth="2" />
      <circle cx="22" cy="35" r="7" fill="#0b1020" stroke="#fff" strokeWidth="1.5" />
      <circle cx="42" cy="32" r="3.5" fill="#ff6b6b" />
      <circle cx="48" cy="38" r="3.5" fill="#51cf66" />
      <circle cx="38" cy="38" r="3" fill="#ffd43b" />
      <circle cx="46" cy="28" r="3" fill="#74c0fc" />
    </svg>
  );
}

export function IconDisc({ className }: IconProps) {
  const id = useId();
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="20" fill={`url(#${id})`} stroke="#fff" strokeWidth="2" />
      <circle cx="32" cy="32" r="5" fill="#0b1020" stroke="#dee2e6" strokeWidth="2" />
      <defs>
        <linearGradient id={id} x1="12" y1="12" x2="52" y2="52">
          <stop stopColor="#e9ecef" />
          <stop offset="0.5" stopColor="#748ffc" />
          <stop offset="1" stopColor="#495057" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconTrophy({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <path d="M20 14 H44 V28 C44 38 36 42 32 42 C28 42 20 38 20 28 Z" fill="#fcc419" stroke="#fff" strokeWidth="2" />
      <path d="M44 18 H52 C52 28 46 32 44 32" stroke="#ff922b" strokeWidth="3" fill="none" />
      <path d="M20 18 H12 C12 28 18 32 20 32" stroke="#ff922b" strokeWidth="3" fill="none" />
      <rect x="28" y="42" width="8" height="8" fill="#e67700" />
      <rect x="22" y="50" width="20" height="6" rx="2" fill="#ffe8a3" stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

export function IconGem({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <path d="M32 8 L52 28 L32 56 L12 28 Z" fill="#22b8cf" stroke="#fff" strokeWidth="2" />
      <path d="M32 8 L40 28 H24 Z" fill="#66d9e8" />
      <path d="M12 28 H52 L32 56 Z" fill="#0c8599" opacity="0.85" />
      <path d="M22 22 L28 18" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconSafe({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect x="12" y="14" width="40" height="40" rx="6" fill="#495057" stroke="#fcc419" strokeWidth="2.5" />
      <circle cx="32" cy="34" r="10" fill="#212529" stroke="#ffd43b" strokeWidth="2" />
      <circle cx="32" cy="34" r="3" fill="#ffd43b" />
      <rect x="18" y="20" width="8" height="4" rx="1" fill="#868e96" />
    </svg>
  );
}

export function IconFire({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <path d="M32 54 C18 54 14 40 20 30 C24 36 28 34 28 26 C28 18 34 12 40 10 C38 20 48 24 48 36 C48 48 42 54 32 54 Z" fill="#ff6b4a" stroke="#fff" strokeWidth="2" />
      <path d="M32 50 C24 50 24 40 28 36 C30 40 34 38 34 32 C36 38 40 40 40 44 C40 48 36 50 32 50 Z" fill="#ffd43b" />
    </svg>
  );
}

export function IconCoin({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="20" fill="#fcc419" stroke="#fff" strokeWidth="2" />
      <circle cx="32" cy="32" r="14" fill="none" stroke="#f08c00" strokeWidth="2" />
      <text x="32" y="38" textAnchor="middle" fontSize="18" fontWeight="800" fill="#7a4f01" fontFamily="Syne,sans-serif">$</text>
    </svg>
  );
}

/** Money-fish / cash symbol for collect features */
export function IconCashFish({ className }: IconProps) {
  const id = useId();
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="8" y1="10" x2="56" y2="54">
          <stop stopColor="#ffe066" />
          <stop offset="1" stopColor="#f08c00" />
        </linearGradient>
      </defs>
      <ellipse cx="30" cy="34" rx="20" ry="13" fill={`url(#${id})`} stroke="#fff" strokeWidth="2" />
      <path d="M46 34 L58 24 V44 Z" fill="#fab005" stroke="#fff" strokeWidth="1.5" />
      <circle cx="22" cy="30" r="2.5" fill="#0b1020" />
      <text x="30" y="39" textAnchor="middle" fontSize="11" fontWeight="800" fill="#7a4f01" fontFamily="Syne,sans-serif">$</text>
    </svg>
  );
}

export function IconStar({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <path d="M32 8 L38 24 H56 L42 34 L48 52 L32 42 L16 52 L22 34 L8 24 H26 Z" fill="#ffd43b" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPortal({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <ellipse cx="32" cy="32" rx="14" ry="22" fill="#7950f2" stroke="#d0bfff" strokeWidth="3" />
      <ellipse cx="32" cy="32" rx="6" ry="12" fill="#212529" />
      <ellipse cx="28" cy="24" rx="4" ry="6" fill="rgba(255,255,255,0.35)" />
    </svg>
  );
}

export function IconScatter({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect x="10" y="10" width="44" height="44" rx="10" fill="#ff922b" stroke="#ffe8a3" strokeWidth="3" />
      <circle cx="32" cy="30" r="10" fill="#ffd43b" />
      <path d="M18 44 Q32 34 46 44" fill="#ff6b6b" />
      <text x="32" y="56" textAnchor="middle" fontSize="7" fontWeight="800" fill="#fff" fontFamily="Figtree,sans-serif">SCATTER</text>
    </svg>
  );
}

export function IconLetter({ letter, color = "#339af0", className }: IconProps & { letter: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect x="8" y="8" width="48" height="48" rx="12" fill={color} stroke="#fff" strokeWidth="2.5" />
      <text x="32" y="42" textAnchor="middle" fontSize="28" fontWeight="800" fill="#fff" fontFamily="Syne,sans-serif">
        {letter}
      </text>
    </svg>
  );
}

export function IconHeadset({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <path d="M14 34 V28 A18 18 0 0 1 50 28 V34" stroke="#ff6b4a" strokeWidth="4" fill="none" />
      <rect x="8" y="32" width="12" height="18" rx="4" fill="#ff922b" stroke="#fff" strokeWidth="1.5" />
      <rect x="44" y="32" width="12" height="18" rx="4" fill="#ff922b" stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

export function IconCart({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect x="14" y="16" width="36" height="36" rx="4" fill="#15aabf" stroke="#fff" strokeWidth="2" />
      <rect x="20" y="24" width="24" height="10" rx="2" fill="#0b7285" />
      <circle cx="24" cy="48" r="2" fill="#ffe8a3" />
      <circle cx="40" cy="48" r="2" fill="#ffe8a3" />
    </svg>
  );
}

export function IconKey({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="24" cy="28" r="12" fill="#fcc419" stroke="#fff" strokeWidth="2" />
      <circle cx="24" cy="28" r="4" fill="#0b1020" />
      <rect x="34" y="25" width="20" height="6" rx="2" fill="#ffd43b" stroke="#fff" strokeWidth="1.5" />
      <rect x="46" y="31" width="4" height="8" fill="#ffd43b" />
      <rect x="40" y="31" width="4" height="6" fill="#ffd43b" />
    </svg>
  );
}

export function IconBag({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <path d="M18 28 H46 V48 C46 52 42 54 32 54 C22 54 18 52 18 48 Z" fill="#51cf66" stroke="#fff" strokeWidth="2" />
      <path d="M24 28 V22 H40 V28" stroke="#2f9e44" strokeWidth="3" fill="none" />
      <rect x="28" y="34" width="8" height="10" rx="1" fill="#fff3bf" />
    </svg>
  );
}

export function IconBolt({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <path d="M34 8 L18 34 H30 L26 56 L48 28 H34 Z" fill="#ff922b" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function IconTarget({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="20" fill="#fff" stroke="#fa5252" strokeWidth="3" />
      <circle cx="32" cy="32" r="13" fill="#fa5252" />
      <circle cx="32" cy="32" r="6" fill="#fff" />
      <circle cx="32" cy="32" r="2.5" fill="#c92a2a" />
    </svg>
  );
}

export function IconBird({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <ellipse cx="32" cy="34" rx="16" ry="14" fill="#f8f9fa" stroke="#adb5bd" strokeWidth="2" />
      <circle cx="38" cy="30" r="3" fill="#0b1020" />
      <path d="M46 32 L56 28 L48 36 Z" fill="#ff922b" />
      <path d="M20 36 Q12 28 18 24" stroke="#868e96" strokeWidth="3" fill="none" />
      <ellipse cx="28" cy="48" rx="6" ry="3" fill="#ff6b6b" />
    </svg>
  );
}

export function IconRing({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="16" fill="none" stroke="#ff6b6b" strokeWidth="8" />
      <circle cx="32" cy="32" r="16" fill="none" stroke="#fff" strokeWidth="2" />
      <circle cx="32" cy="32" r="8" fill="none" stroke="#ffa8a8" strokeWidth="3" />
    </svg>
  );
}

export function IconLive({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="38" r="10" fill="#ff922b" stroke="#fff" strokeWidth="2" />
      <path d="M32 28 V14" stroke="#ffd43b" strokeWidth="3" />
      <path d="M32 14 L40 20" stroke="#ffd43b" strokeWidth="3" />
      <circle cx="32" cy="38" r="4" fill="#fff" />
      <path d="M18 28 Q32 18 46 28" stroke="#ffe8a3" strokeWidth="2" fill="none" />
    </svg>
  );
}

const MAP: Record<string, () => ReactNode> = {
  fish: () => <IconFish className="sym-svg" />,
  bird: () => <IconBird className="sym-svg" />,
  ring: () => <IconRing className="sym-svg" />,
  ch: () => <IconCherry className="sym-svg" />,
  cherry: () => <IconCherry className="sym-svg" />,
  lm: () => <IconLemon className="sym-svg" />,
  lemon: () => <IconLemon className="sym-svg" />,
  bl: () => <IconBell className="sym-svg" />,
  pad: () => <IconPad className="sym-svg" />,
  disc: () => <IconDisc className="sym-svg" />,
  cart: () => <IconCart className="sym-svg" />,
  audio: () => <IconHeadset className="sym-svg" />,
  phones: () => <IconHeadset className="sym-svg" />,
  plat: () => <IconTrophy className="sym-svg" />,
  cup: () => <IconTrophy className="sym-svg" />,
  gem: () => <IconGem className="sym-svg" />,
  key: () => <IconKey className="sym-svg" />,
  bag: () => <IconBag className="sym-svg" />,
  bolt: () => <IconBolt className="sym-svg" />,
  zap: () => <IconBolt className="sym-svg" />,
  safe: () => <IconSafe className="sym-svg" />,
  fire: () => <IconFire className="sym-svg" />,
  coin: () => <IconCoin className="sym-svg" />,
  hit: () => <IconTarget className="sym-svg" />,
  tgt: () => <IconTarget className="sym-svg" />,
  port: () => <IconPortal className="sym-svg" />,
  live: () => <IconLive className="sym-svg" />,
  sc: () => <IconScatter className="sym-svg" />,
  scat: () => <IconScatter className="sym-svg" />,
  scatter: () => <IconScatter className="sym-svg" />,
  wd: () => <IconStar className="sym-svg" />,
  wild: () => <IconStar className="sym-svg" />,
  ten: () => <IconLetter letter="10" color="#845ef7" className="sym-svg" />,
  "10": () => <IconLetter letter="10" color="#845ef7" className="sym-svg" />,
  j: () => <IconLetter letter="J" color="#339af0" className="sym-svg" />,
  q: () => <IconLetter letter="Q" color="#51cf66" className="sym-svg" />,
  k: () => <IconLetter letter="K" color="#ff6b6b" className="sym-svg" />,
  bn: () => <IconCoin className="sym-svg" />,
  clk: () => <IconBolt className="sym-svg" />,
  cash: () => <IconCashFish className="sym-svg" />,
  money: () => <IconCashFish className="sym-svg" />,
};

export function SymbolIcon({ id }: { id: string }) {
  const key = id.toLowerCase();
  const render = MAP[key];
  if (render) return <>{render()}</>;
  return <IconStar className="sym-svg" />;
}
