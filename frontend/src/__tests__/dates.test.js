import { describe, it, expect } from 'vitest';
import {
  localISODate,
  localISODateOffset,
  addDaysISO,
  defaultDayOffset,
  weekendDates,
  weekDates,
  tripDates,
} from '../utils/dates.js';

// new Date(y, m, d, h) is local time, so these hold in every timezone
const at = (y, m, d, h = 9) => new Date(y, m - 1, d, h);

describe('localISODate', () => {
  it('uses the local calendar day, not the UTC day, near midnight', () => {
    expect(localISODate(at(2026, 1, 14, 23))).toBe('2026-01-14');
    expect(localISODate(at(2026, 1, 14, 0))).toBe('2026-01-14');
  });

  it('offsets across month and year boundaries', () => {
    expect(localISODateOffset(1, at(2026, 1, 31, 22))).toBe('2026-02-01');
    expect(localISODateOffset(7, at(2026, 12, 28, 23))).toBe('2027-01-04');
    expect(addDaysISO('2026-02-28', 1)).toBe('2026-03-01');
  });
});

describe('trip dates', () => {
  it('defaults a day trip to today in the morning and tomorrow later on', () => {
    expect(defaultDayOffset(at(2026, 1, 14, 8))).toBe(0);
    expect(defaultDayOffset(at(2026, 1, 14, 14))).toBe(1);
  });

  it('picks the coming Saturday and Sunday on a weekday', () => {
    // Wed 14 Jan 2026
    expect(weekendDates(at(2026, 1, 14))).toEqual({ dates: ['2026-01-17', '2026-01-18'], label: 'This weekend' });
  });

  it('means today and tomorrow on a Saturday', () => {
    expect(weekendDates(at(2026, 1, 17)).dates).toEqual(['2026-01-17', '2026-01-18']);
  });

  it('rolls to next weekend on a Sunday', () => {
    expect(weekendDates(at(2026, 1, 18))).toEqual({ dates: ['2026-01-24', '2026-01-25'], label: 'Next weekend' });
  });

  it('plans a week as the 7 days starting tomorrow', () => {
    const week = weekDates(at(2026, 1, 14));
    expect(week).toHaveLength(7);
    expect(week[0]).toBe('2026-01-15');
    expect(week[6]).toBe('2026-01-21');
  });

  it('builds dates for each trip type', () => {
    const now = at(2026, 1, 14);
    expect(tripDates('day', 2, now)).toEqual(['2026-01-16']);
    expect(tripDates('weekend', 0, now)).toHaveLength(2);
    expect(tripDates('week', 0, now)).toHaveLength(7);
  });
});
