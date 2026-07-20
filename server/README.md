# SpinKeep local API

JSON-file database · Fastify · JWT sessions · Google Sign-In ready.

## Run

```bash
cd server
npm install
npm run dev
```

API: **http://127.0.0.1:8787**

## Optional: real Google login

1. Create an OAuth Client ID (Web) in Google Cloud Console  
2. Add authorized JS origin: `http://127.0.0.1:5173`  
3. Export and start:

```bash
export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export JWT_SECRET="change-me"
npm run dev
```

Without `GOOGLE_CLIENT_ID`, `/auth/google` accepts `{ "demo": true }` so the UI works offline.

## Endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/health` | no | Liveness |
| GET | `/config` | no | Public client config |
| POST | `/auth/email` | no | Local email login/signup |
| POST | `/auth/guest` | no | Guest account |
| POST | `/auth/google` | no | Real or demo Google |
| GET | `/me` | JWT | Profile + balance |
| POST | `/daily/claim` | JWT | Streak bonus |
| POST | `/spin` | JWT | Server RNG 5×3 per `gameId`; body `{ stake, boost, freeSpin?, gameId }` — `stake` is base tokens, server doubles when `boost` |
| POST | `/gifts` | JWT | Send tokens |

Data file: `server/data/db.json`
