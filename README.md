# 🏔️ Ski Resort Weather Tracker

A local MVP website that helps users find ski resorts near them with the best snow conditions on a chosen future date.

## Features

- **Location search** — type a city/zip code or use browser geolocation
- **Date picker** — select any date up to 16 days ahead
- **Smart filtering** — adjustable search radius and minimum snowfall threshold
- **Resort ranking** — sorted by proximity, filtered by expected snowfall
- **Detailed forecasts** — morning (6am–12pm) and afternoon (12pm–6pm) blocks showing:
  - Snowfall (cm)
  - Wind speed (km/h)
  - Visibility (label + numeric)
  - Sky condition (sunny / partly cloudy / cloudy)
- **3-day snowfall history** for each resort
- **Live weather data** from [Open-Meteo](https://open-meteo.com/)
- **87 ski resorts** seeded from OpenStreetMap-derived data (worldwide)
- **Background jobs** for cache warming and cleanup
- **Placeholder ad slots** (AdSense-ready)
- **Mobile responsive** design
- **OSM and Open-Meteo attribution** in footer

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | SQLite (via better-sqlite3) |
| Background Jobs | node-cron |
| Weather API | Open-Meteo (free, no API key needed) |
| Geocoding | Open-Meteo Geocoding API |
| Distance | Haversine formula |

## Quick Start

### Prerequisites

- **Node.js 18+** (tested with v24)
- **npm 9+**

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Seed Resort Data

```bash
cd backend
npm run seed
```

This creates a SQLite database with 87 ski resorts worldwide.

### 3. Start the Backend

```bash
cd backend
npm run dev
```

Backend runs on **http://localhost:3001**

### 4. Start the Frontend (new terminal)

```bash
cd frontend
npm run dev
```

Frontend runs on **http://localhost:5173** — open this in your browser.

The Vite dev server proxies `/api` requests to the backend automatically.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/health` | GET | App status + resort/cache counts |
| `GET /api/geocoding/search?q=...` | GET | Location search (min 2 chars) |
| `GET /api/recommend?lat=...&lon=...&date=...&radius=...&minSnowfall=...` | GET | Resort recommendations |
| `GET /api/resort/:id?date=...` | GET | Single resort detail with forecast |

## Project Structure

```
ski-resort-weather-tracker/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express server entry
│   │   ├── db/
│   │   │   └── database.js       # SQLite setup & schema
│   │   ├── routes/
│   │   │   ├── health.js         # Health check endpoint
│   │   │   ├── geocoding.js      # Location search proxy
│   │   │   ├── recommend.js      # Resort recommendations
│   │   │   └── resort.js         # Resort detail
│   │   ├── services/
│   │   │   ├── forecastUtils.js   # Haversine, forecast parsing
│   │   │   ├── openMeteo.js       # Open-Meteo API client
│   │   │   ├── weatherCache.js    # Weather caching layer
│   │   │   └── recommendations.js # Recommendation engine
│   │   ├── jobs/
│   │   │   └── scheduler.js       # Background job scheduler
│   │   └── scripts/
│   │       └── seedResorts.js     # Resort database seeder
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── index.css
│   │   ├── hooks/
│   │   │   └── useGeocoding.js
│   │   └── components/
│   │       ├── Hero.jsx
│   │       ├── SearchPanel.jsx
│   │       ├── LocationInput.jsx
│   │       ├── ResultsList.jsx
│   │       ├── ResortCard.jsx
│   │       ├── ForecastBlock.jsx
│   │       ├── AdSlot.jsx
│   │       └── Footer.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Environment Variables

No environment variables are required for local development. The app uses:

- **Open-Meteo** — free, no API key needed
- **SQLite** — local file database (auto-created on first seed)

## How It Works

### Forecast Logic

- **Morning** = hours 06:00–11:59 local resort time
- **Afternoon** = hours 12:00–17:59 local resort time
- Snowfall is **summed** across the time block
- Wind speed is **averaged** across the time block
- Visibility uses the **worst** (minimum) value in the period
- Sky condition is derived from **average cloud cover**:
  - Sunny: < 25% cloud cover
  - Partly Cloudy: 25–70%
  - Cloudy: > 70%
- Visibility labels:
  - Low: < 1 km
  - Medium: 1–5 km
  - High: > 5 km

### Caching

- Weather data is cached in SQLite with a 3-hour TTL
- Background jobs warm the cache every 2 hours for upcoming dates
- Expired cache entries are cleaned every 6 hours

### Resort Discovery

The MVP uses a seeded database of 87 resorts. In production, these would be refreshed
from OpenStreetMap's Overpass API using winter sports tags (`sport=skiing`, `landuse=winter_sports`, etc.).

## Production Notes

### AdSense Integration

Ad placeholder slots are already in the layout. To activate:

1. Sign up for [Google AdSense](https://www.google.com/adsense/)
2. Replace `<AdSlot />` placeholder content with your AdSense `<ins>` tags
3. Add the AdSense script to `index.html`:
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXX" crossorigin="anonymous"></script>
   ```

### EU Consent (CMP)

For EU/EEA/UK/Switzerland traffic with AdSense:

1. Integrate a [Google-certified CMP](https://support.google.com/adsense/answer/13554116)
2. Display cookie consent banners before loading personalized ads
3. Use Google's Consent Mode v2 for compliant signal handling

### Open-Meteo Commercial Use

Sites with advertising are considered commercial use under Open-Meteo's terms.
For production with ads, purchase an [Open-Meteo API subscription](https://open-meteo.com/en/pricing).

## License

This project is for local development and testing. See attribution requirements for
Open-Meteo and OpenStreetMap data in the footer.
