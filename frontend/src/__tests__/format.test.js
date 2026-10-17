import { describe, it, expect } from 'vitest';
import { formatDuration, formatRange, formatHour, flag, scoreTone, dayLabel } from '../utils/format.js';
import { terrainLevels } from '../components/TerrainBar.jsx';

describe('formatDuration', () => {
  it('shows minutes under an hour and h + padded minutes above', () => {
    expect(formatDuration(49)).toBe('49 min');
    expect(formatDuration(135)).toBe('2h 15');
    expect(formatDuration(61)).toBe('1h 01');
    expect(formatDuration(120)).toBe('2h');
  });

  it('marks estimates with a tilde', () => {
    expect(formatDuration(45, 'estimate')).toBe('~45 min');
  });
});

describe('dates for humans', () => {
  it('labels today and tomorrow', () => {
    expect(dayLabel('2026-01-14', '2026-01-14').name).toBe('Today');
    expect(dayLabel('2026-01-15', '2026-01-14').name).toBe('Tomorrow');
    expect(dayLabel('2026-01-16', '2026-01-14').name).toBe('Fri');
  });

  it('formats weekend and cross-month ranges', () => {
    expect(formatRange(['2026-01-17', '2026-01-18'])).toBe('Sat 17 – Sun 18 Jan');
    expect(formatRange(['2026-01-30', '2026-02-05'])).toBe('Fri 30 Jan – Thu 5 Feb');
  });

  it('formats hours', () => {
    expect(formatHour(0)).toBe('12am');
    expect(formatHour(9)).toBe('9am');
    expect(formatHour(12)).toBe('12pm');
    expect(formatHour(15)).toBe('3pm');
  });
});

describe('scores and flags', () => {
  it('puts a word on every score', () => {
    expect(scoreTone(85).label).toBe('Epic');
    expect(scoreTone(66).label).toBe('Great');
    expect(scoreTone(20).label).toBe('Meh');
  });

  it('turns country codes into flags', () => {
    expect(flag('CH')).toBe('🇨🇭');
    expect(flag('x')).toBe('');
  });
});

describe('terrainLevels', () => {
  const terrain = { pctEasy: 20, pctIntermediate: 50, pctAdvanced: 30 };

  it('uses Green/Blue/Black in North America and Blue/Red/Black in Europe', () => {
    expect(terrainLevels(terrain, 'US').map((l) => l.label)).toEqual(['Green', 'Blue', 'Black']);
    expect(terrainLevels(terrain, 'FR').map((l) => l.label)).toEqual(['Blue', 'Red', 'Black']);
  });

  it('drops missing or zero segments', () => {
    expect(terrainLevels({ pctEasy: null, pctIntermediate: 60, pctAdvanced: 0 }, 'AT').map((l) => l.label)).toEqual(['Red']);
  });
});
