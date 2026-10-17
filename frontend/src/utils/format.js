const at = (iso) => new Date(`${iso}T12:00:00`); // local noon: no timezone day-shift

export function formatDuration(minutes, source) {
  const prefix = source === 'estimate' ? '~' : '';
  if (minutes < 60) return `${prefix}${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${prefix}${h}h${m > 0 ? ` ${String(m).padStart(2, '0')}` : ''}`;
}

export function formatDate(iso, opts = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return at(iso).toLocaleDateString('en-GB', opts);
}

/** "Today" / "Tomorrow" / "Thu" plus the day number, for day chips. */
export function dayLabel(iso, todayIso) {
  const diff = Math.round((at(iso) - at(todayIso)) / 86400000);
  const name = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : formatDate(iso, { weekday: 'short' });
  return { name, day: at(iso).getDate(), month: formatDate(iso, { month: 'short' }) };
}

/** "Sat 24 – Sun 25 Oct", or "Fri 30 Oct – Thu 5 Nov" across months. */
export function formatRange(dates) {
  const first = dates[0];
  const last = dates[dates.length - 1];
  if (first === last) return formatDate(first);
  const sameMonth = first.slice(0, 7) === last.slice(0, 7);
  const start = formatDate(first, sameMonth ? { weekday: 'short', day: 'numeric' } : undefined);
  return `${start} – ${formatDate(last)}`;
}

export function formatHour(h) {
  if (h === 0) return '12am';
  if (h < 12) return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
}

export function flag(countryCode) {
  if (!/^[A-Z]{2}$/.test(countryCode || '')) return '';
  return String.fromCodePoint(...[...countryCode].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export const formatTemp = (t) => (t === null || t === undefined ? '—' : `${Math.round(t)}°`);

/** Words for a 0–100 score, so a number never stands alone. */
export function scoreTone(score) {
  if (score >= 80) return { label: 'Epic', tone: 'epic' };
  if (score >= 65) return { label: 'Great', tone: 'great' };
  if (score >= 50) return { label: 'Good', tone: 'good' };
  if (score >= 35) return { label: 'Fair', tone: 'fair' };
  return { label: 'Meh', tone: 'poor' };
}

export const TAGS = {
  powder: { label: 'Powder day', tone: 'powder' },
  fresh: { label: 'Fresh snow', tone: 'ice' },
  bluebird: { label: 'Bluebird', tone: 'sun' },
  snowing: { label: 'Snowing', tone: 'ice' },
  windy: { label: 'Windy', tone: 'warn' },
  rain: { label: 'Rain risk', tone: 'bad' },
  cold: { label: 'Very cold', tone: 'ice' },
  spring: { label: 'Spring snow', tone: 'sun' },
  'upper-only': { label: 'Upper mountain only', tone: 'warn' },
  glacier: { label: 'Glacier', tone: 'ice' },
};

export const COVER = {
  deep: 'Deep base',
  good: 'Good base',
  fair: 'Fair base',
  thin: 'Thin — mostly snowmaking',
  glacier: 'Glacier snow',
};
