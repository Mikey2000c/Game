# SpinKeep (local first)

Desktop shortcut (this VM): `~/Desktop/SpinKeep` → this repo.

## Quick start

```bash
# one-time
npm run install:all

# terminal A — API (http://127.0.0.1:8787)
npm run dev:api

# terminal B — Web UI (http://127.0.0.1:5173)
npm run dev:web
```

1. Open **http://127.0.0.1:5173**
2. Wait for **API online** pill on the auth screen
3. Use **Google (demo)**, email, or guest
4. Spins + daily claim hit the local API (`server/data/db.json`)

## Folders

| Path | What |
|------|------|
| `mockup/` | React mobile UI |
| `server/` | Fastify API + JSON DB |
| `server/data/db.json` | Local users, balances, ledger |

## Google login

**Works now in demo mode** (no Google Cloud project).

For **real** Google Sign-In later:

1. Google Cloud Console → OAuth Client ID (Web)
2. Authorized JS origin: `http://127.0.0.1:5173`
3. `export GOOGLE_CLIENT_ID=...` in `server/`
4. Put the same ID in `mockup/.env` as `VITE_GOOGLE_CLIENT_ID`

## API surface

See `server/README.md` — `/auth/*`, `/me`, `/spin`, `/daily/claim`, `/gifts`.
