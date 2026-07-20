# AGENTS.md

## Cursor Cloud specific instructions

SpinKeep is an **online social-slots** stack: `mockup/` (Vite React UI) + `server/` (Fastify JWT API).

### Run (two processes)

```bash
npm run install:all
npm run dev:api    # http://127.0.0.1:8787
npm run dev:web    # http://127.0.0.1:5173 — proxies /api → :8787
```

- Lint UI: `npm run lint` (oxlint in `mockup/`)
- Build: `npm run build` (server `tsc` + mockup `tsc -b && vite build`)

### Gotchas

- Dev API calls use **`/api` via Vite proxy** by default (`mockup/src/api.ts`). Only set `VITE_API_URL` if you bypass the proxy.
- Wallet is **server-authoritative**. Client mission/bonus pick UI must not invent tokens; spins go through `POST /spin` with base stake (server applies boost once). Free spins send `freeSpin: true`.
- Per-cabinet symbol IDs live in both `server/src/slots.ts` and `mockup/src/App.tsx` `GAMES` — keep them aligned.
- Google Sign-In works in **demo mode** without `GOOGLE_CLIENT_ID`. Email password is not verified yet (local find-or-create).
- Data persists in `server/data/db.json` (created on first write).
- `SlotScene.tsx` (Three.js) is unused; live cabinets use `SlotMachine.tsx`.
