/**
 * Build backend/src/data/skiAreas.json from OpenSkiMap exports.
 *
 *   node src/scripts/importOpenSkiMap.js <ski_areas.geojson> <lifts.geojson>
 *
 * Downloads: https://tiles.openskimap.org/geojson/ski_areas.geojson
 *            https://tiles.openskimap.org/geojson/lifts.geojson
 *
 * Output (committed, so deployments need no download):
 *   areas       — ski areas to add to the catalogue (not already curated)
 *   curatedFill — terrain stats for curated resorts that have none
 *
 * Data © OpenStreetMap contributors (ODbL), via OpenSkiMap.org; skimap.org.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SEED_RESORTS } from './seedResorts.js';
import { RESORT_STATS } from '../data/resortStats.js';
import { haversineDistance } from '../services/forecastUtils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'data', 'skiAreas.json');

/** Smallest area worth listing: one real run, not a single beginner tow. */
const MIN_PISTE_KM = 1;
/** Areas without run data closer than this to a mapped area are assumed duplicates. */
const DUPLICATE_RADIUS_KM = 5;
/** A curated resort and an OpenSkiMap area sharing a name word within this distance are the same place. */
const NAME_MATCH_RADIUS_KM = 25;
const SAME_PLACE_RADIUS_KM = 2;

const GENERIC_WORDS = new Set(
  ('ski skiing resort resorts area areas mountain mountains mount mt mont monte montagne berg berge alpine alpin ' +
    'alps alpe alpes valley vallee valle tal village center centre park snow peak peaks lake big little the of de ' +
    'di del della des du la le les el los las san st ste saint sankt bad am an im in und and et e y').split(' ')
);

const normalize = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
const nameWords = (s) => new Set(normalize(s).split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !GENERIC_WORDS.has(w)));
const sharesWord = (a, b) => [...nameWords(a)].some((w) => nameWords(b).has(w));

function terrainFrom(stats) {
  const byDifficulty = stats?.runs?.byActivity?.downhill?.byDifficulty || {};
  const len = (keys) => keys.reduce((s, k) => s + (byDifficulty[k]?.lengthInKm || 0), 0);
  const easy = len(['novice', 'easy']);
  const inter = len(['intermediate']);
  const adv = len(['advanced', 'expert', 'freeride', 'extreme']);
  const pisteKm = Object.values(byDifficulty).reduce((s, d) => s + (d.lengthInKm || 0), 0);
  const lifts = Object.entries(stats?.lifts?.byType || {})
    .filter(([type]) => type !== 'magic_carpet')
    .reduce((s, [, d]) => s + (d.count || 0), 0);

  const graded = easy + inter + adv;
  let pct = null;
  if (graded > 0) {
    const e = Math.round((100 * easy) / graded);
    const i = Math.round((100 * inter) / graded);
    pct = { easy: e, inter: i, adv: 100 - e - i };
  }
  return { pisteKm, lifts, pct };
}

function centroid(geometry) {
  if (geometry.type === 'Point') return geometry.coordinates;
  const ring = geometry.type === 'Polygon' ? geometry.coordinates[0] : geometry.coordinates[0][0];
  const n = ring.length;
  return [ring.reduce((s, c) => s + c[0], 0) / n, ring.reduce((s, c) => s + c[1], 0) / n];
}

/**
 * From the lifts export: the lowest lift station per ski area (where people
 * park and start), and which areas share lifts (to detect umbrella domains).
 */
function liftIndex(liftFeatures) {
  const lowest = new Map();
  const liftCount = new Map(); // area id → number of lifts
  const shared = new Map(); // "a|b" → lifts both areas contain
  for (const lift of liftFeatures) {
    const p = lift.properties;
    if (p.status && p.status !== 'operating') continue;
    if (lift.geometry?.type !== 'LineString') continue;
    const ids = [...new Set((p.skiAreas || []).map((a) => a.properties?.id).filter(Boolean))];
    for (const id of ids) {
      liftCount.set(id, (liftCount.get(id) || 0) + 1);
      for (const [lon, lat, ele] of lift.geometry.coordinates) {
        if (ele == null) continue;
        const cur = lowest.get(id);
        if (!cur || ele < cur.ele) lowest.set(id, { lon, lat, ele });
      }
    }
    for (const a of ids) for (const b of ids) if (a !== b) shared.set(`${a}|${b}`, (shared.get(`${a}|${b}`) || 0) + 1);
  }
  return { lowest, liftCount, shared };
}

/**
 * Umbrella domains and lift-pass alliances (Dolomiti Superski, Les Trois
 * Vallées…) contain most of the lifts of several other areas. Skiers drive to
 * the member areas, so the umbrellas are dropped.
 */
function umbrellaIds(areaIds, { liftCount, shared }) {
  const umbrellas = new Set();
  for (const a of areaIds) {
    let members = 0;
    for (const b of areaIds) {
      if (a === b) continue;
      const bLifts = liftCount.get(b) || 0;
      if (bLifts > 0 && bLifts < (liftCount.get(a) || 0) && (shared.get(`${a}|${b}`) || 0) >= 0.5 * bLifts) members++;
      if (members >= 2) break;
    }
    if (members >= 2) umbrellas.add(a);
  }
  return umbrellas;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Open-Meteo elevation API. Each coordinate counts as a call against the free
 * tier's 600/minute limit, so batches are paced to ~430/minute and a 429 waits
 * out the minute.
 */
async function elevations(points) {
  const out = [];
  for (let i = 0; i < points.length; i += 40) {
    const batch = points.slice(i, i + 40);
    const params = new URLSearchParams({
      latitude: batch.map((p) => p.lat.toFixed(5)).join(','),
      longitude: batch.map((p) => p.lon.toFixed(5)).join(','),
    });
    for (let attempt = 1; ; attempt++) {
      const res = await fetch(`https://api.open-meteo.com/v1/elevation?${params}`);
      if (res.ok) {
        out.push(...(await res.json()).elevation);
        break;
      }
      if (attempt === 5) throw new Error(`Elevation API ${res.status}`);
      await sleep(res.status === 429 ? 65000 : 2000 * attempt);
    }
    await sleep(5500);
    process.stdout.write(`\r  elevations ${Math.min(i + 40, points.length)}/${points.length}`);
  }
  return out;
}

const round = (x, d = 4) => Math.round(x * 10 ** d) / 10 ** d;

async function main() {
  const [areasPath, liftsPath] = process.argv.slice(2);
  if (!areasPath || !liftsPath) {
    console.error('Usage: node src/scripts/importOpenSkiMap.js <ski_areas.geojson> <lifts.geojson>');
    process.exit(1);
  }

  const areas = JSON.parse(fs.readFileSync(areasPath, 'utf8')).features.filter((f) => {
    const p = f.properties;
    return (p.status === 'operating' || p.status == null) && (p.activities || []).includes('downhill') && p.name;
  });
  const lifts = liftIndex(JSON.parse(fs.readFileSync(liftsPath, 'utf8')).features);
  const bases = lifts.lowest;

  const candidates = areas.map((f) => {
    const p = f.properties;
    const terrain = terrainFrom(p.statistics);
    const base = bases.get(p.id);
    const [lon, lat] = base ? [base.lon, base.lat] : centroid(f.geometry);
    const runs = p.statistics?.runs || {};
    return {
      id: p.id,
      name: p.name.trim(),
      lat,
      lon,
      country: p.places?.[0]?.iso3166_1Alpha2 || null,
      region: p.places?.[0]?.localized?.en?.region || null,
      website: (p.websites || []).find((w) => /^https?:\/\//.test(w)) || null,
      base: base?.ele ?? runs.minElevation ?? p.statistics?.minElevation ?? null,
      peak: runs.maxElevation ?? p.statistics?.maxElevation ?? null,
      terrain,
      mapped: terrain.pisteKm > 0,
    };
  });

  const allMapped = candidates.filter((c) => c.mapped && c.terrain.pisteKm >= MIN_PISTE_KM);
  const umbrellas = umbrellaIds(
    allMapped.map((c) => c.id),
    lifts
  );
  const mapped = allMapped.filter((c) => !umbrellas.has(c.id));
  const unmapped = candidates.filter(
    (c) => !c.mapped && !mapped.some((m) => haversineDistance(c.lat, c.lon, m.lat, m.lon) <= DUPLICATE_RADIUS_KM)
  );

  // Areas that are the same place as a curated resort fill its stats instead of being added
  const curatedFill = {};
  const isCurated = (c) => {
    let matched = false;
    for (const r of SEED_RESORTS) {
      const d = haversineDistance(c.lat, c.lon, r.lat, r.lon);
      if (d <= SAME_PLACE_RADIUS_KM || (d <= NAME_MATCH_RADIUS_KM && sharesWord(c.name, r.name))) {
        matched = true;
        const prev = curatedFill[r.osm_id];
        if (!RESORT_STATS[r.osm_id] && c.mapped && (!prev || c.terrain.pisteKm > prev.pisteKm)) {
          curatedFill[r.osm_id] = c.terrain;
        }
      }
    }
    return matched;
  };
  const newMapped = mapped.filter((c) => !isCurated(c));
  const newUnmapped = unmapped.filter((c) => !isCurated(c));

  // Areas without run data have no elevation: use the terrain height at their location
  console.log(`Looking up elevation for ${newUnmapped.length} unmapped areas…`);
  const est = await elevations(newUnmapped);
  console.log('');
  newUnmapped.forEach((c, i) => {
    c.base = Math.round(est[i]);
    c.peak = c.base;
  });

  const out = [...newMapped, ...newUnmapped]
    .filter((c) => c.base != null && c.country)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({
      id: c.id,
      name: c.name,
      lat: round(c.lat),
      lon: round(c.lon),
      country: c.country,
      region: c.region,
      website: c.website,
      base: Math.round(c.base),
      peak: Math.round(Math.max(c.peak ?? c.base, c.base)),
      ...(c.mapped
        ? {
            pisteKm: Math.round(c.terrain.pisteKm),
            lifts: c.terrain.lifts,
            ...(c.terrain.pct ? { easy: c.terrain.pct.easy, inter: c.terrain.pct.inter, adv: c.terrain.pct.adv } : {}),
          }
        : {}),
    }));

  const fill = Object.fromEntries(
    Object.entries(curatedFill).map(([osmId, t]) => [
      osmId,
      {
        pisteKm: Math.round(t.pisteKm),
        lifts: t.lifts,
        ...(t.pct ? { easy: t.pct.easy, inter: t.pct.inter, adv: t.pct.adv } : {}),
      },
    ])
  );

  fs.writeFileSync(
    OUT,
    JSON.stringify({
      source: 'OpenSkiMap.org (© OpenStreetMap contributors, ODbL; skimap.org)',
      generatedAt: new Date().toISOString().slice(0, 10),
      areas: out,
      curatedFill: fill,
    })
  );

  console.log(`Ski areas considered: ${areas.length} (lift base stations found for ${bases.size})`);
  console.log(`Mapped areas ≥ ${MIN_PISTE_KM} km: ${allMapped.length}; umbrella domains dropped: ${umbrellas.size}`);
  console.log(
    `  e.g. ${allMapped
      .filter((c) => umbrellas.has(c.id))
      .sort((a, b) => b.terrain.pisteKm - a.terrain.pisteKm)
      .slice(0, 12)
      .map((c) => c.name)
      .join(' · ')}`
  );
  console.log(`Unmapped kept after de-duplication: ${unmapped.length}`);
  console.log(`New areas written: ${out.length} (${newMapped.length} mapped, ${newUnmapped.length} unmapped)`);
  console.log(`Curated resorts given terrain stats: ${Object.keys(fill).length}`);
  console.log(`→ ${path.relative(process.cwd(), OUT)} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
