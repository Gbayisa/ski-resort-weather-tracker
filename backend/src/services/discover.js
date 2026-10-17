import { getDb } from '../db/database.js';
import { haversineDistance } from './forecastUtils.js';
import { ensureForecasts, readForecasts } from './weatherCache.js';
import { getDriveInfoBatch } from './driveTime.js';
import { activeCheckinCounts } from './community.js';
import { seasonStatus } from '../data/seasons.js';
import { CAR_FREE_ACCESS, driveTarget } from '../data/access.js';
import {
  dayConditions,
  scoreDay,
  aggregateTrip,
  tagsFor,
  reasonsFor,
  coverLabel,
  confidenceFor,
  elevationsOf,
} from './conditions.js';

/**
 * How far people are willing to drive, and how much a longer drive should
 * cost a resort in the ranking. Most skiers won't drive more than 4 hours.
 */
export const DRIVE_BUCKETS = {
  short: { maxMinutes: 90, driveWeight: 0.35 },
  happy: { maxMinutes: 150, driveWeight: 0.2 },
  best: { maxMinutes: 240, driveWeight: 0.08 },
};
export const TRIPS = ['day', 'weekend', 'week'];

/** Upper bound on straight-line km covered per hour of driving (motorways); prefilter only. */
const PREFILTER_KMH = 110;
const MAX_RESULTS = 24;
const OUTLOOK_DAYS = 8;
const POWDER_ALERT_CM = 15;
/** Beyond this, "open elsewhere" suggestions stop being a realistic trip. */
const OPEN_ELSEWHERE_MAX_KM = 1500;

export function terrainOf(resort) {
  if (resort.pct_easy == null && resort.piste_km == null && resort.lifts == null) return null;
  return {
    pisteKm: resort.piste_km,
    lifts: resort.lifts,
    snowparks: resort.snowparks,
    pctEasy: resort.pct_easy,
    pctIntermediate: resort.pct_intermediate,
    pctAdvanced: resort.pct_advanced,
  };
}

export function matchScore(conditionsScore, driveMinutes, bucket) {
  const { maxMinutes, driveWeight } = DRIVE_BUCKETS[bucket];
  return Math.round(conditionsScore * (1 - driveWeight * Math.min(1, driveMinutes / maxMinutes)));
}

const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/**
 * @param {object} q { lat, lon, dates[], today, trip, drive, style }
 */
export async function discover({ lat, lon, dates, today, trip, drive, style }) {
  const db = getDb();
  const maxKm = (DRIVE_BUCKETS.best.maxMinutes / 60) * PREFILTER_KMH;
  const candidates = db
    .prepare('SELECT * FROM resorts')
    .all()
    .map((r) => ({ ...r, crowKm: haversineDistance(lat, lon, r.lat, r.lon) }))
    .filter((r) => r.crowKm <= maxKm);

  const [, driveInfo] = await Promise.all([ensureForecasts(candidates), getDriveInfoBatch(lat, lon, candidates.map(driveTarget))]);
  const forecasts = readForecasts(candidates.map((r) => r.id));
  const riders = activeCheckinCounts();
  const outlookDates = Array.from({ length: OUTLOOK_DAYS }, (_, i) => addDays(today, i));

  // Conditions are reused across trip days, outlook days and styles — compute each once
  const memo = new Map();
  const conditionsFor = (resort, date) => {
    const key = `${resort.id}|${date}`;
    if (!memo.has(key)) memo.set(key, dayConditions(forecasts.get(resort.id), resort, date, seasonStatus(resort, date)));
    return memo.get(key);
  };

  const evaluated = [];
  for (const resort of candidates) {
    const info = driveInfo.get(resort.id);
    if (!info || !forecasts.has(resort.id)) continue;
    const season = seasonStatus(resort, dates[0]);
    const days = dates
      .map((d) => {
        const c = conditionsFor(resort, d);
        if (!c) return null;
        const open = seasonStatus(resort, d).inSeason;
        return { c, open, score: open ? scoreDay(c, resort, style, season) : 0 };
      })
      .filter(Boolean);
    if (days.length === 0) continue;

    const openDays = days.filter((d) => d.open);
    const conditionsScore = openDays.length ? aggregateTrip(openDays.map((d) => d.score), trip, resort) : 0;
    const best = openDays.length ? openDays.reduce((a, b) => (b.score > a.score ? b : a)) : days[0];
    const focus = best.c;

    evaluated.push({
      resort,
      info,
      inSeason: openDays.length > 0,
      season,
      conditionsScore,
      focus,
      days,
      bestDate: best.c.date,
    });
  }

  const shape = (e, bucket) => ({
    id: e.resort.id,
    name: e.resort.name,
    region: e.resort.region,
    country: e.resort.country,
    lat: e.resort.lat,
    lon: e.resort.lon,
    website: e.resort.website,
    access: CAR_FREE_ACCESS[e.resort.osm_id] || null,
    drive: { minutes: e.info.durationMin, km: e.info.distanceKm, source: e.info.source },
    match: matchScore(e.conditionsScore, e.info.durationMin, bucket),
    score: e.conditionsScore,
    bestDate: e.bestDate,
    confidence: confidenceFor(dates, today),
    tags: tagsFor(e.focus, e.season),
    reasons: reasonsFor(e.focus, e.resort, style, e.season),
    snow: {
      fresh24: e.focus.fresh24,
      fresh48: e.focus.fresh48,
      // 08:00→08:00 windows tile back to back, so their sum plus the last day's ski hours = snow over the trip
      tripSnow: Math.round(e.days.reduce((s, d) => s + d.c.fresh24, 0) + e.days[e.days.length - 1].c.snowDuring),
      depthBase: e.focus.depthBase,
      depthMid: e.focus.depthMid,
      depthPeak: e.focus.depthPeak,
      cover: coverLabel(e.focus.depthMid, e.season.glacier),
    },
    weather: {
      tempMid: e.focus.tempMid,
      tempMin: e.focus.tempMin,
      tempMax: e.focus.tempMax,
      wind: e.focus.wind,
      sunHours: e.focus.sunHours,
      minVisKm: e.focus.minVisKm,
      rainHours: e.focus.rainHours,
      freezingLevel: e.focus.freezingLevel,
    },
    days: e.days.map((d) => ({
      date: d.c.date,
      open: d.open,
      score: d.score,
      fresh24: d.c.fresh24,
      snowDuring: d.c.snowDuring,
      sunHours: d.c.sunHours,
      tempMid: d.c.tempMid,
      wind: d.c.wind,
    })),
    season: e.season,
    terrain: terrainOf(e.resort),
    elevations: elevationsOf(e.resort),
    ridersToday: riders.get(e.resort.id) || 0,
  });

  const rank = (bucket) =>
    evaluated
      .filter((e) => e.inSeason && e.info.durationMin <= DRIVE_BUCKETS[bucket].maxMinutes)
      .map((e) => shape(e, bucket))
      .sort((a, b) => b.match - a.match || a.drive.minutes - b.drive.minutes);

  let results = rank(drive);
  let widened = false;
  if (results.length === 0 && drive !== 'best') {
    results = rank('best');
    widened = results.length > 0;
  }

  // Outlook for the day picker: best match per day within the chosen drive range
  const inRange = evaluated.filter((e) => e.info.durationMin <= DRIVE_BUCKETS[widened ? 'best' : drive].maxMinutes);
  let powderAlert = null;
  const outlook = outlookDates.map((date) => {
    let bestScore = 0;
    let maxFresh = 0;
    let sunny = false;
    for (const e of inRange) {
      if (!seasonStatus(e.resort, date).inSeason) continue;
      const c = conditionsFor(e.resort, date);
      if (!c) continue;
      bestScore = Math.max(bestScore, matchScore(scoreDay(c, e.resort, style, e.season), e.info.durationMin, drive));
      if (c.fresh24 > maxFresh) maxFresh = c.fresh24;
      if (c.sunHours >= 6) sunny = true;
      if (c.fresh24 >= POWDER_ALERT_CM && (!powderAlert || c.fresh24 > powderAlert.fresh24)) {
        powderAlert = { resortId: e.resort.id, name: e.resort.name, date, fresh24: Math.round(c.fresh24) };
      }
    }
    return { date, bestScore, maxFresh: Math.round(maxFresh), sunny };
  });

  // Nothing open within 4 h: say when the season starts and where snow is now
  let notice = null;
  if (results.length === 0) {
    const openings = evaluated.map((e) => e.season.opensOn).filter(Boolean).sort();
    const openElsewhere = db
      .prepare('SELECT * FROM resorts')
      .all()
      .filter((r) => seasonStatus(r, dates[0]).inSeason)
      .map((r) => ({ id: r.id, name: r.name, country: r.country, distanceKm: Math.round(haversineDistance(lat, lon, r.lat, r.lon)) }))
      .filter((r) => r.distanceKm <= OPEN_ELSEWHERE_MAX_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 3);
    notice = {
      type: 'off-season',
      nextOpening: openings[0] || null,
      resortsNearby: evaluated.length,
      openElsewhere,
    };
  }

  return {
    query: { trip, drive, style, dates, today },
    widened,
    results: results.slice(0, MAX_RESULTS),
    totalMatches: results.length,
    outlook,
    powderAlert,
    notice,
    stats: { resortsWithin4h: evaluated.length, openNow: evaluated.filter((e) => e.inSeason).length },
  };
}
