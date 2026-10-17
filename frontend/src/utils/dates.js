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

/** Pure calendar arithmetic on YYYY-MM-DD strings (timezone-independent). */
export function addDaysISO(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** How many days ahead of today the day picker offers (today + 7). */
export const DAY_PICKER_DAYS = 8;

/** After 11:00 it's too late to head out today, so the lazy default is tomorrow. */
export function defaultDayOffset(now = new Date()) {
  return now.getHours() < 11 ? 0 : 1;
}

/**
 * The weekend a skier means right now: on Saturday it's today + tomorrow;
 * on Sunday the weekend is basically over, so it's next weekend.
 */
export function weekendDates(now = new Date()) {
  const today = localISODate(now);
  const dow = now.getDay(); // 0 = Sunday … 6 = Saturday
  if (dow === 6) return { dates: [today, addDaysISO(today, 1)], label: 'This weekend' };
  if (dow === 0) return { dates: [addDaysISO(today, 6), addDaysISO(today, 7)], label: 'Next weekend' };
  const saturday = addDaysISO(today, 6 - dow);
  return { dates: [saturday, addDaysISO(saturday, 1)], label: 'This weekend' };
}

/** A ski week: the next 7 days starting tomorrow. */
export function weekDates(now = new Date()) {
  const today = localISODate(now);
  return Array.from({ length: 7 }, (_, i) => addDaysISO(today, i + 1));
}

export function tripDates(trip, dayOffset, now = new Date()) {
  if (trip === 'weekend') return weekendDates(now).dates;
  if (trip === 'week') return weekDates(now);
  return [localISODateOffset(dayOffset, now)];
}
