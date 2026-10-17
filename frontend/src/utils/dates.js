/**
 * YYYY-MM-DD in the user's local timezone.
 * (toISOString() uses UTC, which gives the wrong calendar day near midnight
 * for anyone not in UTC — e.g. US evenings already read as "tomorrow".)
 */
export function localISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Local date `days` days from now as YYYY-MM-DD. */
export function localISODateOffset(days, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return localISODate(d);
}
