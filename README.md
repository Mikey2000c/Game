# SpinKeep — online social slots

Playable local stack: React mobile UI + Fastify API with JWT auth, server RNG spins, daily streak, and gifts.

## Quick start

```bash
npm run install:all

# terminal A — API (http://127.0.0.1:8787)
npm run dev:api

# terminal B — Web UI (http://127.0.0.1:5173, proxies /api → API)
npm run dev:web
```

1. Open **http://127.0.0.1:5173**
2. Wait for the **API online** pill
3. Continue as guest, Google (demo), or email
4. Claim daily bonus → open a cabinet → spin (wallet updates from the server)

## Folders

| Path | What |
|------|------|
| `mockup/` | React mobile UI (Vite + Framer Motion) |
| `server/` | Fastify API + JSON DB (`server/data/db.json`) |

## Online game loop

- **Auth** → JWT session in `localStorage`
- **Lobby** → Home / Slots / Clan / Account
- **Spin** → `POST /spin` (per-cabinet symbols, boost, free spins)
- **Wallet** → server-authoritative token balance + XP/level
- **Daily** → `POST /daily/claim` streak rewards
- **Gifts** → `POST /gifts` to friend emails

Vite proxies `/api/*` to the Fastify server so LAN/cloud agents don't need `VITE_API_URL`.

## Docs

- Product plan: `mockup/PLAN.md`
- API surface: `server/README.md`
- Cloud agent notes: `AGENTS.md`
