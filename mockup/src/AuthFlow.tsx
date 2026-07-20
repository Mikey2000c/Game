import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api, setToken, type ApiUser } from "./api";
import { sfx } from "./audio";

type Step = "splash" | "welcome" | "login" | "signup";

type Props = {
  onAuthenticated: (user: ApiUser) => void;
  soundOn?: boolean;
};

export function AuthFlow({ onAuthenticated, soundOn = true }: Props) {
  const [step, setStep] = useState<Step>("splash");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  function beep(fn: () => void) {
    if (soundOn) fn();
  }

  useEffect(() => {
    api
      .health()
      .then((h) => {
        setApiOnline(true);
        setGoogleEnabled(h.googleAuth);
      })
      .catch(() => setApiOnline(false));
  }, []);

  function go(next: Step) {
    beep(sfx.click);
    setError(null);
    setStep(next);
  }

  async function finish(run: () => Promise<{ token: string; user: ApiUser }>) {
    if (apiOnline === false) {
      setError("API offline — start server with: cd server && npm run dev");
      beep(sfx.lose);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await run();
      setToken(res.token);
      beep(sfx.claim);
      onAuthenticated(res.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
      beep(sfx.lose);
    } finally {
      setBusy(false);
    }
  }

  function submitEmail(mode: "login" | "signup") {
    if (!email.includes("@")) {
      setError("Enter a valid email.");
      beep(sfx.lose);
      return;
    }
    // Local API has no password store yet — field is UX-only for the mock.
    if (password.length > 0 && password.length < 4) {
      setError("Password must be at least 4 characters (local demo).");
      beep(sfx.lose);
      return;
    }
    if (mode === "signup" && name.trim().length < 2) {
      setError("Add a display name.");
      beep(sfx.lose);
      return;
    }
    void finish(() => api.authEmail(email.trim(), name.trim() || undefined, mode));
  }

  return (
    <div className="auth-root">
      <div className="auth-aurora" aria-hidden />
      <div className="auth-orb auth-orb-a" aria-hidden />
      <div className="auth-orb auth-orb-b" aria-hidden />

      {apiOnline !== null && (
        <div className={`api-pill${apiOnline ? " on" : ""}`}>
          {apiOnline ? "API online" : "API offline"}
        </div>
      )}

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
              window.setTimeout(() => setStep("welcome"), 900);
            }}
          >
            <motion.div
              className="auth-crest xl"
              animate={{ rotate: [0, 8, -6, 0], scale: [1, 1.04, 1] }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
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
              Local API accounts, Google-ready login, daily bonuses, and live 5×3 cabinets.
            </p>

            <div className="auth-feature-row">
              <div className="auth-feature">
                <b>Daily</b>
                <span>Server streak</span>
              </div>
              <div className="auth-feature">
                <b>Spins</b>
                <span>Server RNG</span>
              </div>
              <div className="auth-feature">
                <b>Google</b>
                <span>{googleEnabled ? "Live" : "Demo"}</span>
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
              disabled={busy}
              onClick={() => void finish(() => api.authGuest())}
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
                ? "Your balance and streak sync from the local API."
                : "Creates a real account in the local server database."}
            </p>

            <div className="social-col">
              <button
                className="social-btn google"
                disabled={busy}
                onClick={() =>
                  void finish(() =>
                    api.authGoogleDemo(name || "Google Player", email || undefined),
                  )
                }
              >
                <span className="sico g">G</span>
                {googleEnabled
                  ? "Continue with Google (demo fallback)"
                  : "Continue with Google (demo)"}
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
              <span>Password <em className="field-hint">(local demo — not verified)</em></span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="optional for now"
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
                  New here? <button onClick={() => go("signup")}>Create an account</button>
                </>
              ) : (
                <>
                  Already spinning? <button onClick={() => go("login")}>Log in</button>
                </>
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
