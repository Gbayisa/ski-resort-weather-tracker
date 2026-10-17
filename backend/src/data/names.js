const LATIN = /^[\p{Script=Latin}\p{N}\p{P}\p{Zs}\p{S}]+$/u;

/**
 * OpenStreetMap names sometimes carry every translation joined by commas
 * ("国家高山滑雪中心, Nationales Ski-Alpin-Zentrum Xiaohaituo, National Alpine…").
 * Long multi-part names keep their first Latin-script variant; short names
 * with a comma ("Pale, Bosnia") and bracketed asides are left alone.
 */
export function cleanAreaName(name) {
  const trimmed = name.trim();
  const parts = trimmed
    .split(/,\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  // Commas inside brackets are part of the name ("Black Mountain (formerly X, now private)")
  if (parts.length < 2 || trimmed.length <= 40 || trimmed.includes('(')) return trimmed;
  return parts.find((p) => p.length > 3 && LATIN.test(p)) ?? parts[0];
}
