import { adjustTemperatureForElevation, computeSnowfallAtAlt } from './forecastUtils.js';

/**
 * Ski-day conditions and style scoring.
 *
 * Inputs are Open-Meteo hourly series in resort-local time ("YYYY-MM-DDTHH:00").
 * "Fresh" snow is measured the way snow reports do it: in the 24h/48h before
 * lifts open (08:00). Ski hours are 09:00–16:59. All mountain values use the
 * mid-station elevation unless stated otherwise.
 */

export const STYLES = ['groomer', 'allmountain', 'powder'];

const SKI_START = 9;
const SKI_END = 16;
const SKI_HOURS = SKI_END - SKI_START + 1;
const LIFTS_OPEN = 8;

/** Fresh snow settles; ~70% of 72h snowfall is still on the ground as depth. */
const SETTLING = 0.7;

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const round1 = (x) => Math.round(x * 10) / 10;
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function elevationsOf(resort) {
  const base = resort.elevation_base || 0;
  const peak = resort.elevation_peak || base;
  return { base, mid: Math.round((base + peak) / 2), peak };
}

const timeIndexCache = new WeakMap();
function midnightIndex(hourly, date) {
  let index = timeIndexCache.get(hourly);
  if (!index) {
    index = new Map();
    hourly.time.forEach((t, i) => {
      if (t.endsWith('T00:00')) index.set(t.slice(0, 10), i);
    });
    timeIndexCache.set(hourly, index);
  }
  return index.get(date);
}

/**
 * Raw conditions for one resort on one date, or null if the date is outside the forecast.
 * `forecast` = { hourly, apiElevation } as cached by weatherCache.
 * Glacier resorts are evaluated on the upper mountain, where the skiing is
 * outside the main winter season.
 */
export function dayConditions(forecast, resort, date, { glacier = false } = {}) {
  const h = forecast?.hourly;
  if (!h?.time) return null;
  const i0 = midnightIndex(h, date);
  if (i0 === undefined) return null;

  const elev = elevationsOf(resort);
  const skiElev = glacier ? Math.round((elev.mid + elev.peak) / 2) : elev.mid;
  const apiElev = forecast.apiElevation ?? elev.base;
  const n = h.time.length;
  const at = (arr, i) => (i >= 0 && i < n ? arr?.[i] ?? null : null);
  const tempAt = (i, e) => {
    const t = at(h.temperature_2m, i);
    return t === null ? null : adjustTemperatureForElevation(t, apiElev, e);
  };
  const snowAt = (i, e) => {
    if (i < 0 || i >= n) return 0;
    return computeSnowfallAtAlt(at(h.snowfall, i) ?? 0, at(h.precipitation, i) ?? 0, tempAt(i, e));
  };
  const sumSnow = (from, to, e) => {
    let s = 0;
    for (let i = from; i <= to; i++) s += snowAt(i, e);
    return s;
  };

  const opening = i0 + LIFTS_OPEN;
  const fresh24 = sumSnow(opening - 24, opening - 1, skiElev);
  const fresh48 = sumSnow(opening - 48, opening - 1, skiElev);
  const snowDuring = sumSnow(i0 + SKI_START, i0 + SKI_END, skiElev);

  // Snow depth: the model's depth is a grid-cell mean at apiElev. Scale it with
  // altitude, but never below what recent snowfall at that altitude implies
  // (the grid can read 0 in the valley while the upper mountain is white).
  const gridDepthCm = (at(h.snow_depth, i0 + SKI_START) ?? 0) * 100;
  const depthAt = (e) => {
    const scaled = gridDepthCm * Math.min(3, Math.max(0.2, 1 + (e - apiElev) / 1500));
    const recent = sumSnow(i0 + SKI_START - 72, i0 + SKI_START - 1, e) * SETTLING;
    return Math.round(Math.max(scaled, recent));
  };

  const temps = [];
  const winds = [];
  const vis = [];
  const freezing = [];
  let sunHours = 0;
  let rainHours = 0;
  for (let i = i0 + SKI_START; i <= i0 + SKI_END; i++) {
    const t = tempAt(i, skiElev);
    if (t !== null) temps.push(t);
    const w = at(h.wind_speed_10m, i);
    if (w !== null) winds.push(w);
    const v = at(h.visibility, i);
    if (v !== null) vis.push(v / 1000);
    const f = at(h.freezing_level_height, i);
    if (f !== null) freezing.push(f);
    if ((at(h.cloud_cover, i) ?? 100) < 40) sunHours++;
    if ((at(h.precipitation, i) ?? 0) > 0.2 && t !== null && t > 1) rainHours++;
  }

  const tempMid = avg(temps);
  return {
    date,
    fresh24: round1(fresh24),
    fresh48: round1(fresh48),
    snowDuring: round1(snowDuring),
    depthBase: depthAt(elev.base),
    depthMid: depthAt(elev.mid),
    depthPeak: depthAt(elev.peak),
    tempMid: tempMid === null ? null : round1(tempMid),
    tempMin: temps.length ? round1(Math.min(...temps)) : null,
    tempMax: temps.length ? round1(Math.max(...temps)) : null,
    wind: winds.length ? Math.round(avg(winds)) : null,
    minVisKm: vis.length ? round1(Math.min(...vis)) : null,
    sunHours,
    rainHours,
    freezingLevel: freezing.length ? Math.round(avg(freezing)) : null,
  };
}

// ---------- sub-scores (0..1) ----------

const windScore = (w) => (w === null ? 0.6 : clamp01(1 - (w - 15) / 35));

/** Comfort for cruising: −10…−2 °C ideal; colder bites, warmer turns slushy. */
function tempComfort(t) {
  if (t === null) return 0.6;
  if (t <= -25) return 0.3;
  if (t < -10) return 0.3 + (0.7 * (t + 25)) / 15;
  if (t <= -2) return 1;
  if (t <= 4) return 1 - (0.7 * (t + 2)) / 6;
  return 0.15;
}

/** Powder stays light and dry below about −6 °C. */
function coldness(t) {
  if (t === null) return 0.5;
  return clamp01((1 - t) / 7) * 0.9 + 0.1;
}

function terrainFactors(resort) {
  const known = resort.pct_easy != null;
  return {
    easyInter: known ? (resort.pct_easy + resort.pct_intermediate) / 100 : 0.5,
    advanced: known ? clamp01(resort.pct_advanced / 60) : 0.5,
    size: resort.piste_km != null ? clamp01(resort.piste_km / 200) : 0.4,
  };
}

/**
 * Score one day 0–100 for a ski style.
 * Glaciers keep a permanent base, so their cover never scores as "thin".
 */
export function scoreDay(c, resort, style, { glacier = false } = {}) {
  const t = terrainFactors(resort);
  const cover = (target) => {
    const s = clamp01(c.depthMid / target);
    return glacier ? Math.max(0.5, s) : s;
  };
  const sun = c.sunHours / SKI_HOURS;
  const rainPenalty = clamp01(c.rainHours / 3);

  let s;
  if (style === 'groomer') {
    // Corduroy cruising: sunshine, calm, comfortable temps, blue/red-heavy terrain
    s =
      0.3 * sun +
      0.2 * windScore(c.wind) +
      0.2 * tempComfort(c.tempMid) +
      0.1 * cover(60) +
      0.1 * (1 - clamp01(c.snowDuring / 8)) +
      0.1 * t.easyInter;
  } else if (style === 'powder') {
    // Fresh overnight snow dominates; cold keeps it dry; steeps make it count
    s =
      0.4 * clamp01(c.fresh24 / 25) +
      0.15 * clamp01(c.fresh48 / 40) +
      0.1 * clamp01(c.snowDuring / 10) +
      0.1 * coldness(c.tempMid) +
      0.1 * t.advanced +
      0.1 * cover(100) +
      0.05 * windScore(c.wind);
  } else {
    // All mountain: deep base so everything is open, a refresh, decent visibility, a big area
    s =
      0.25 * cover(120) +
      0.2 * clamp01(c.fresh48 / 40) +
      0.15 * sun +
      0.1 * windScore(c.wind) +
      0.1 * tempComfort(c.tempMid) +
      0.1 * t.size +
      0.1 * clamp01((c.minVisKm ?? 5) / 5);
  }
  return Math.round(100 * s * (1 - 0.35 * rainPenalty));
}

export function coverLabel(depthMid, glacier) {
  if (glacier && depthMid < 60) return 'glacier';
  if (depthMid >= 120) return 'deep';
  if (depthMid >= 60) return 'good';
  if (depthMid >= 25) return 'fair';
  return 'thin';
}

/** Short badges shown on cards. */
export function tagsFor(c, { glacier = false } = {}) {
  const tags = [];
  if (c.fresh24 >= 15) tags.push('powder');
  else if (c.fresh48 >= 5) tags.push('fresh');
  if (c.sunHours >= 6 && (c.wind ?? 0) < 25) tags.push('bluebird');
  if (c.snowDuring >= 3) tags.push('snowing');
  if ((c.wind ?? 0) >= 40) tags.push('windy');
  if (c.rainHours >= 2) tags.push('rain');
  if (c.tempMax !== null && c.tempMax <= -15) tags.push('cold');
  if (c.tempMax !== null && c.tempMax >= 3 && c.fresh48 < 5) tags.push('spring');
  if (c.depthMid < 15 && c.depthPeak >= 30) tags.push('upper-only');
  if (glacier) tags.push('glacier');
  return tags;
}

/** Up to three human reasons, ordered by what matters for the chosen style. */
export function reasonsFor(c, resort, style, { glacier = false } = {}) {
  const r = [];
  const fresh = () => {
    if (c.fresh24 >= 5) r.push(`${Math.round(c.fresh24)} cm fresh overnight`);
    else if (c.fresh48 >= 8) r.push(`${Math.round(c.fresh48)} cm in the last 48 h`);
  };
  const sky = () => {
    if (c.sunHours >= 5) r.push(`${c.sunHours} h of sunshine`);
    else if (c.snowDuring >= 2) r.push(`${Math.round(c.snowDuring)} cm falling during the day`);
  };
  const terrain = () => {
    if (resort.pct_easy == null) return;
    const naColors = resort.country === 'US' || resort.country === 'CA';
    if (style === 'powder') r.push(`${resort.pct_advanced}% black & expert terrain`);
    else if (style === 'groomer')
      r.push(`${resort.pct_easy + resort.pct_intermediate}% ${naColors ? 'green & blue' : 'blue & red'} runs`);
    else if (resort.piste_km) r.push(`${resort.piste_km} km of pistes`);
  };

  if (style === 'powder') {
    fresh();
    terrain();
    sky();
  } else if (style === 'groomer') {
    sky();
    if ((c.wind ?? 99) < 15) r.push('Calm winds');
    terrain();
    fresh();
  } else {
    if (c.depthMid >= 60) r.push(`${c.depthMid} cm base (est.)`);
    fresh();
    sky();
    terrain();
  }
  if (glacier && r.length < 3) r.push('Glacier — reliable snow');
  return r.slice(0, 3);
}

/**
 * Combine daily scores for a trip.
 * Weekend: mostly the average, with credit for one standout day.
 * Week: consistency matters, and bigger ski areas keep a week interesting.
 */
export function aggregateTrip(dayScores, trip, resort) {
  if (dayScores.length === 0) return 0;
  const mean = avg(dayScores);
  const best = Math.max(...dayScores);
  if (trip === 'day' || dayScores.length === 1) return dayScores[0];
  if (trip === 'weekend') return Math.round(0.6 * mean + 0.4 * best);
  const sizeBonus = 8 * terrainFactors(resort).size;
  return Math.min(100, Math.round(0.75 * mean + 0.25 * best + sizeBonus));
}

/** Forecast confidence by how many days ahead the furthest trip day is. */
export function confidenceFor(dates, today) {
  const ahead = Math.max(
    ...dates.map((d) => Math.round((Date.parse(`${d}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000))
  );
  if (ahead <= 2) return 'high';
  if (ahead <= 4) return 'medium';
  return 'low';
}
