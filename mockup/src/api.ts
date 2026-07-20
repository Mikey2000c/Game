/** Prefer Vite proxy in dev; fall back to direct URL when set. */
const API_URL = import.meta.env.VITE_API_URL || "/api";

export type ApiUser = {
  id: string;
  email: string;
  name: string;
  method: "google" | "apple" | "email" | "guest";
  tokens: number;
  level: number;
  xp: number;
  streakDay: number;
  lastDailyClaim: string | null;
};

type AuthResponse = { token: string; user: ApiUser; demo?: boolean };

const TOKEN_KEY = "spinkeep_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  }
  return data as T;
}

export const api = {
  url: API_URL,
  health: () => request<{ ok: boolean; googleAuth: boolean }>("/health"),
  config: () =>
    request<{ googleClientId: string | null; googleAuthEnabled: boolean }>("/config"),
  authEmail: (email: string, name?: string, mode: "login" | "signup" = "login") =>
    request<AuthResponse>("/auth/email", {
      method: "POST",
      body: JSON.stringify({ email, name, mode }),
    }),
  authGuest: () => request<AuthResponse>("/auth/guest", { method: "POST", body: "{}" }),
  authGoogleDemo: (name?: string, email?: string) =>
    request<AuthResponse>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ demo: true, name, email }),
    }),
  authGoogle: (idToken: string) =>
    request<AuthResponse>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    }),
  me: () => request<{ user: ApiUser }>("/me"),
  claimDaily: () => request<{ reward: number; user: ApiUser }>("/daily/claim", { method: "POST", body: "{}" }),
  spin: (stake: number, boost: boolean, gameId: string, freeSpin = false) =>
    request<{
      grid: { id: string; kind: string; value?: number }[][];
      payout: number;
      wins: string[];
      scatters: number;
      feature: boolean;
      collected: number;
      moneyCells: string[];
      wildCells: string[];
      freeSpinsAwarded: number;
      cost: number;
      user: ApiUser;
    }>("/spin", {
      method: "POST",
      body: JSON.stringify({ stake, boost, gameId, freeSpin }),
    }),
  gift: (toEmail: string, amount: number) =>
    request<{ ok: boolean; user: ApiUser }>("/gifts", {
      method: "POST",
      body: JSON.stringify({ toEmail, amount }),
    }),
};
