# SpinKeep — Product Plan (from mockup)

Viral **social casino** for iOS/Android: fun slots + Clash-style retention. Virtual tokens only (no cash-out) in v1.

## North star

Players open the app every day for the streak claim, spin a few rounds, gift friends, and contribute to their clan — then come back tomorrow.

## Retention loops (Clash DNA → slots)

| Hook | How it works |
|------|----------------|
| Daily Keep Bonus | Escalating 7-day streak; miss a day → streak cools |
| Clan pressure | Donations, weekend raids, shared clan chest |
| Social gifts | Send tokens → push friend to open app |
| Short sessions | Multiple cabinets, 30–90s spins |
| Progression | Player level + Keep tier (cosmetic + soft perks) |
| Later IAP | Buy token packs when soft currency runs low |

## Screens in this mockup

1. **Daily claim modal** — first thing on open  
2. **Keep (home)** — streak, hot games, activity feed  
3. **Spins** — multi-game lobby + playable demo cabinet  
4. **Clan** — membership, stats, goals  
5. **Gifts** — friends list + send tokens; shop placeholder  

## Build phases after mockup sign-off

1. **Expo app shell** + auth (Apple/Google) + token ledger  
2. **Real daily bonus** (server-authoritative streak)  
3. **Game engine v1** (one polished slot; hold/nudge optional)  
4. **Friends + gifts** with caps/cooldowns  
5. **Clans** (create/invite/roles + chest progress)  
6. **Games 2–3** + events  
7. **IAP** via RevenueCat + receipt validation  

## Stack suggestion

- Mobile: Expo (React Native) + TypeScript  
- Backend: Supabase (Auth, Postgres, Realtime) or Nest + Postgres  
- Economy: append-only ledger rows for every spin/gift/purchase/bonus  

## Open decisions

- Final brand name (mock uses **SpinKeep**)  
- Art direction: keep the gold-on-felt look, or brighter arcade?  
- How spicy should features be (nudge/gamble vs simple spin)?  
- Chat inside clans in v1, or activity-only?
