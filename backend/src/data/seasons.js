/**
 * Typical ski seasons (MM-DD, inclusive). Approximate: real opening dates
 * shift with snowfall each year, so the UI always labels these "typical".
 * A window where open > close wraps the new year (e.g. 11-20 → 04-15).
 */

const SOUTHERN = { open: '06-15', close: '10-05' };

const COUNTRY_DEFAULTS = {
  // Southern hemisphere
  AU: SOUTHERN, NZ: SOUTHERN, CL: SOUTHERN, AR: { open: '06-15', close: '10-10' },
  ZA: SOUTHERN, LS: SOUTHERN,
  // North America
  US: { open: '11-22', close: '04-12' },
  CA: { open: '11-22', close: '04-12' },
  // Asia
  JP: { open: '12-10', close: '04-05' },
  KR: { open: '11-25', close: '03-15' },
  CN: { open: '11-25', close: '03-15' },
  IN: { open: '12-15', close: '03-31' },
  IR: { open: '12-10', close: '04-10' },
  KZ: { open: '12-01', close: '04-10' },
  // Nordics (long, cold seasons)
  SE: { open: '11-28', close: '04-25' },
  NO: { open: '11-28', close: '04-25' },
  FI: { open: '11-15', close: '05-01' },
};

const NORTHERN_DEFAULT = { open: '12-01', close: '04-15' };

/** Known exceptions by osm_id: glaciers and famously early/late resorts. */
const OVERRIDES = {
  // Glaciers (autumn or year-round skiing)
  osm_zermatt: { open: '01-01', close: '12-31', glacier: true },
  osm_kaprun: { open: '09-20', close: '06-30', glacier: true },
  osm_soelden: { open: '09-26', close: '05-05', glacier: true },
  osm_saasfee: { open: '07-15', close: '04-30', glacier: true },
  osm_cervinia: { open: '10-25', close: '05-05', glacier: true },
  osm_engelberg: { open: '10-25', close: '05-25', glacier: true },
  osm_les2alpes: { open: '12-01', close: '04-25', glacier: true },
  osm_passotonale: { open: '11-25', close: '05-01', glacier: true },
  osm_tignes: { open: '11-28', close: '05-05', glacier: true },
  // High Alps, early
  osm_valdisere: { open: '11-28', close: '05-03' },
  osm_hochgurgl: { open: '11-14', close: '05-01' },
  // North America early openers / late closers
  osm_abasin: { open: '10-20', close: '06-01' },
  osm_loveland: { open: '10-25', close: '05-05' },
  osm_keystone: { open: '10-25', close: '04-15' },
  osm_wolfcreek: { open: '10-30', close: '04-10' },
  osm_mammoth: { open: '11-05', close: '05-31' },
  osm_killington: { open: '11-05', close: '05-01' },
  osm_breckenridge: { open: '11-08', close: '05-25' },
  osm_copper: { open: '11-08', close: '04-20' },
  osm_winterpark: { open: '11-10', close: '04-20' },
  osm_sundayriver: { open: '11-10', close: '04-20' },
  osm_timberline: { open: '11-20', close: '09-05' },
  // Nordic early openers (stored snow)
  osm_levi: { open: '11-01', close: '05-03' },
  osm_ruka: { open: '10-25', close: '05-25' },
};

export function seasonFor(resort) {
  const override = OVERRIDES[resort.osm_id];
  if (override) return { glacier: false, ...override };
  const byCountry = COUNTRY_DEFAULTS[resort.country];
  if (byCountry) return { glacier: false, ...byCountry };
  // Unknown country: decide by hemisphere
  return { glacier: false, ...(resort.lat < 0 ? SOUTHERN : NORTHERN_DEFAULT) };
}

function inWindow(md, { open, close }) {
  return open <= close ? md >= open && md <= close : md >= open || md <= close;
}

/** Next calendar date (YYYY-MM-DD) on or after `isoDate` when the season opens. */
function nextOpening(isoDate, open) {
  const year = Number(isoDate.slice(0, 4));
  const thisYear = `${year}-${open}`;
  return thisYear >= isoDate ? thisYear : `${year + 1}-${open}`;
}

/**
 * Season status for a resort on a date.
 * { inSeason, glacier, open, close, opensOn } — opensOn only when out of season.
 */
export function seasonStatus(resort, isoDate) {
  const season = seasonFor(resort);
  const inSeason = inWindow(isoDate.slice(5), season);
  return {
    inSeason,
    glacier: season.glacier,
    open: season.open,
    close: season.close,
    opensOn: inSeason ? null : nextOpening(isoDate, season.open),
  };
}
