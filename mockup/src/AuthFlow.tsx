import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { sfx } from "./audio";

export type AuthUser = {
  name: string;
  email: string;
  method: "apple" | "google" | "email" | "guest";
};

type Step = "splash" | "welcome" | "login" | "signup";

type Props = {
  onAuthenticated: (user: AuthUser) => void;
  soundOn?: boolean;
};

export function AuthFlow({ onAuthenticated, soundOn = true }: Props) {
  const [step, setStep] = useState<Step>("splash");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function beep(fn: () => void) {
    if (soundOn) fn();
  }

  function go(next: Step) {
    beep(sfx.click);
    setError(null);
    setStep(next);
  }

  function finish(user: AuthUser) {
    setBusy(true);
    beep(sfx.claim);
    window.setTimeout(() => {
      setBusy(false);
      onAuthenticated(user);
    }, 650);
  }

  function submitEmail(mode: "login" | "signup") {
    if (!email.includes("@") || password.length < 4) {
      setError("Enter a valid email and password (4+ chars).");
      beep(sfx.lose);
      return;
    }
    if (mode === "signup" && name.trim().length < 2) {
      setError("Add a display name.");
      beep(sfx.lose);
      return;
    }
    finish({
      name: mode === "signup" ? name.trim() : email.split("@")[0] || "Player",
      email: email.trim(),
      method: "email",
    });
  }

  return (
    <div className="auth-root">
      <div className="auth-aurora" aria-hidden />
      <div className="auth-orb auth-orb-a" aria-hidden />
      <div className="auth-orb auth-orb-b" aria-hidden />

      <AnimatePresence mode="wait">
        {step === "splash" && (
          <motion.div
            key="splash"
            className="auth-panel splash"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45 }}
            onAnimationComplete={() => {
              window.setTimeout(() => setStep("welcome"), 1100);
            }}
          >
            <motion.div
              className="auth-crest xl"
              animate={{ rotate: [0, 8, -6, 0], scale: [1, 1.04, 1] }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
            >
              <span>SK</span>
            </motion.div>
            <h1>SpinKeep</h1>
            <p>Social slots · clans · daily drops</p>
            <div className="splash-bar">
              <i />
            </div>
          </motion.div>
        )}

        {step === "welcome" && (
          <motion.div
            key="welcome"
            className="auth-panel welcome"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
          >
            <div className="auth-crest">
              <span>SK</span>
            </div>
            <p className="auth-kicker">Welcome to</p>
            <h1>SpinKeep</h1>
            <p className="auth-lead">
              Claim daily bonuses, spin premium cabinets, gift friends, and climb
              with your clan.
            </p>

            <div className="auth-feature-row">
              <div className="auth-feature">
                <b>Daily</b>
                <span>Streak drops</span>
              </div>
              <div className="auth-feature">
                <b>Clans</b>
                <span>Shared chests</span>
              </div>
              <div className="auth-feature">
                <b>Spins</b>
                <span>5×3 live</span>
              </div>
            </div>

            <button className="btn btn-primary auth-cta" onClick={() => go("signup")}>
              Create account
            </button>
            <button className="btn btn-ghost auth-cta" onClick={() => go("login")}>
              Log in
            </button>
            <button
              className="auth-guest"
              onClick={() =>
                finish({ name: "Guest Player", email: "guest@spinkeep.local", method: "guest" })
              }
            >
              Continue as guest
            </button>
          </motion.div>
        )}

        {(step === "login" || step === "signup") && (
          <motion.div
            key={step}
            className="auth-panel form"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.3 }}
          >
            <button className="auth-back" onClick={() => go("welcome")}>
              ← Back
            </button>
            <h2>{step === "login" ? "Welcome back" : "Join SpinKeep"}</h2>
            <p className="auth-sub">
              {step === "login"
                ? "Pick up your streak, gifts, and clan."
                : "One account across iOS & Android."}
            </p>

            <div className="social-col">
              <button
                className="social-btn apple"
                disabled={busy}
                onClick={() => finish({ name: "Alex", email: "alex@icloud.com", method: "apple" })}
              >
                <span className="sico"></span> Continue with Apple
              </button>
              <button
                className="social-btn google"
                disabled={busy}
                onClick={() => finish({ name: "Jordan", email: "jordan@gmail.com", method: "google" })}
              >
                <span className="sico g">G</span> Continue with Google
              </button>
            </div>

            <div className="auth-or">
              <i />
              <span>or email</span>
              <i />
            </div>

            {step === "signup" && (
              <label className="field">
                <span>Display name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your keep name"
                  autoComplete="nickname"
                />
              </label>
            )}
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={step === "login" ? "current-password" : "new-password"}
              />
            </label>

            {error && <p className="auth-error">{error}</p>}

            <button
              className="btn btn-accent auth-cta"
              disabled={busy}
              onClick={() => submitEmail(step)}
            >
              {busy ? "Signing in…" : step === "login" ? "Log in" : "Create account"}
            </button>

            <p className="auth-switch">
              {step === "login" ? (
                <>
                  New here?{" "}
                  <button onClick={() => go("signup")}>Create an account</button>
                </>
              ) : (
                <>
                  Already spinning?{" "}
                  <button onClick={() => go("login")}>Log in</button>
                </>
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
