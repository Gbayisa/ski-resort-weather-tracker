# ⛷️ PowderRadar

**Your perfect ski day in three taps.** PowderRadar ranks ski resorts by real drive time and live snow
conditions, and lets solo skiers and snowboarders meet other riders on the mountain.

## What it does

### Discover — built for the lazy skier
Open the app, tap three times, go skiing. Your starting point and choices are remembered, and results
re-rank instantly on every tap.

1. **When** — *Day* (chips for the next 8 days, each showing the best snow and score, best day crowned),
   *Weekend* (this Sat–Sun; rolls to next weekend on Sundays) or *Week* (the next 7 days).
2. **How far** — *Short drive* (≤ 1h 30), *Happy to drive for better* (≤ 2h 30) or *I want the best* (≤ 4h).
   Real road drive times, not straight-line distance. Defaults follow trip length (day → short, week → best).
3. **What kind of day** — *Groomer Day* (sunshine, calm, comfortable temps, blue/red-heavy terrain),
   *All Mountain* (deep base, a refresh, big area) or *Powder Day* (fresh snow overnight, cold, steeps).

Every resort gets a **match score** (conditions weighed against drive time for your drive group), a
**top pick**, plain-English reasons ("24 cm fresh overnight", "6 h of sunshine", "58% black & expert"),
estimated **snow cover** at base/mid/peak, fresh snow, sun, wind, temperature, terrain split, an
on-demand hour-by-hour forecast and one-tap **Google Maps navigation**.

Built-in judgement:
- **Season-aware** — closed resorts are never recommended; glaciers (Zermatt, Sölden, Kaprun…) count as open
  and are judged on the upper mountain. Off-season, it tells you when resorts near you typically open.
- **Auto-widen** — nothing open in your drive range? It shows the best within 4 h and says so.
- **Powder alerts** — fresh snow ≥ 15 cm in range surfaces a one-tap switch to *Powder Day*.
- **Car-free villages** — Zermatt, Saas-Fee, Wengen and Mürren route to where you leave the car (Täsch,
  the Saas-Fee car park, Lauterbrunnen).
- **Forecast confidence** — labelled high / medium / low by days ahead.

### Meet riders — never ski alone
Solo on the mountain? Make a 30-second profile (first name, age, ski/snowboard, gender, level, short bio),
check in at your resort, and wave at riders there to **ride together**, **grab a coffee** or go for **après**.
Chat opens when both say yes.

**Safety model (enforced server-side):**
- 18+ only. No photos, no surnames, no email or phone number.
- **Resort-level location only** — GPS is used once to find which resort you're at (within 6 km) and is
  never stored or shown.
- You only see riders at a resort **while you're checked in there yourself**, so nobody can browse who
  is where from home. Check-ins expire after 9 hours.
- Women can choose **women-only visibility**.
- Block and report everywhere (reporting also blocks); delete your profile and all data at any time.
- Requests are rate-limited (20/day); chats are deleted after 7 days.

In development, demo riders (badged "Demo") are checked in at open resorts and auto-reply, and a
**dev-only check-in simulator** lets you try the flow without being at a resort.

### Works on phones
Phone-first layout with a bottom tab bar, safe-area support (notch / home bar), 16 px inputs (no iOS
zoom-on-focus), touch-friendly targets and no sticky hover effects. Verified in iOS Safari (iPhone 16
simulator, including Google Maps hand-off) and Android Chrome (Blink, emulated Pixel at 375 px).

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, lucide-react icons, hand-written CSS design system |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Jobs | node-cron (forecast refresh every 3 h, cache/chat cleanup every 6 h) |
| Weather | Open-Meteo forecast API (batched multi-location requests) |
| Geocoding | Open-Meteo geocoding API |
| Drive times | OSRM `table` API, cached 7 days, labelled estimate fallback |
| Hero video | Mixkit stock footage (free commercial licence), 720p |

## Quick start

Requires Node.js 18+.

```bash
cd backend && npm install && npm run dev      # API on http://localhost:3001 (seeds resorts + demo riders)
cd frontend && npm install && npm run dev     # App on http://localhost:5173 (proxies /api)
```

Tests: `npm test` in `backend/` (96 tests) and `frontend/` (35 tests).

## Configuration

| Variable | Where | Purpose |
|----------|-------|---------|
| `OPEN_METEO_API_KEY` | backend | Switches to Open-Meteo's commercial endpoint (required once the site is commercial, e.g. shows ads) |
| `OSRM_URL` | backend | OSRM-compatible routing server; defaults to the public demo server (not for production traffic) |
| `DEMO_COMMUNITY=off` | backend | Disables development demo riders (they never run when `NODE_ENV=production`) |
| `DB_PATH` | backend | SQLite file path (`:memory:` is used by tests) |
| `VITE_API_BASE_URL` | frontend build | API base when the frontend is hosted separately (default `/api`) |
| `VITE_ADSENSE_CLIENT` | frontend build | Enables AdSense units (otherwise no ad slots render at all) |

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/discover?lat&lon&today&dates&trip&drive&style` | Ranked resorts, outlook, powder alert, notices |
| `GET /api/resort/:id?date=` | Hour-by-hour forecast for one resort and date |
| `GET /api/geocoding/search?q=` | Town search |
| `GET /api/health` | Status, resort count, fresh forecasts |
| `/api/community/*` | Profile, check-in, riders at a resort, connections, chat, block, report (Bearer token) |

`today` and `dates` (YYYY-MM-DD) come from the client so trips follow the user's local calendar.

## How it works

**Conditions** (`backend/src/services/conditions.js`): fresh snow is measured like snow reports (the 24 h /
48 h before lifts open at 08:00); ski hours are 09:00–16:59; snowfall is re-derived per altitude from the
lapse rate. Snow cover scales the model's grid-cell depth with altitude but never below what recent
snowfall at that altitude implies. Each style has its own weighted score; rain at mid-mountain is
penalised; weekend and week trips blend daily scores (weeks also reward bigger ski areas).

**Seasons** (`backend/src/data/seasons.js`): typical season windows per region plus overrides for glaciers
and early openers. These are typical dates — the UI never presents them as guaranteed.

**Caching & cost**: one forecast per resort covers every date (fetched in batches of 50, 12 days per
location so each counts as a single Open-Meteo call). All resorts refresh every 3 h ≈ 2,400 calls/day —
a fixed cost regardless of traffic, under 10% of Open-Meteo's smallest commercial plan.

## Launch checklist

- **Hosting & storage** — `render.yaml` deploys one service (Express serves the built frontend). Render's
  free plan has an ephemeral disk and sleeps after 15 min idle: community profiles and chats would be
  wiped on every deploy/restart and the forecast job pauses while asleep. For launch, use a paid instance
  with a persistent disk (or move community data to a managed database).
- **Accounts** — riders are identified by a device token (only its hash is stored). Before a public launch,
  add verified sign-in (Apple / Google / phone) so bans and reports stick to a person, plus a privacy
  policy and moderation process for reports.
- **Weather licence** — free Open-Meteo is non-commercial; set `OPEN_METEO_API_KEY` once you run ads.
- **Routing** — point `OSRM_URL` at a self-hosted or commercial OSRM-compatible server.
- **Video** — the hero streams from Mixkit's CDN; self-host the three 720p clips for reliability.
- **Ads (EU)** — AdSense needs a Google-certified consent banner for EU/EEA/UK/CH traffic.

## Data & attribution

Weather: [Open-Meteo](https://open-meteo.com/) (CC BY 4.0). Resorts and roads:
© [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL). Routing:
[OSRM](https://project-osrm.org/). Terrain stats compiled from resort-published figures for 104 major
resorts. Hero video: [Mixkit](https://mixkit.co/). Forecasts and snow cover are model estimates; drive
times exclude traffic.
