import { describe, it, expect } from 'vitest';
import { getGeolocationErrorMessage } from '../utils/geoError.js';

describe('getGeolocationErrorMessage', () => {
  it('returns a permission-denied message for code 1', () => {
    const msg = getGeolocationErrorMessage(1);
    expect(msg).toContain('denied');
    expect(msg).toContain('browser settings');
  });

  it('returns a position-unavailable message for code 2', () => {
    const msg = getGeolocationErrorMessage(2);
    expect(msg).toContain('could not be determined');
  });

  it('returns a timeout message for code 3', () => {
    const msg = getGeolocationErrorMessage(3);
    expect(msg).toContain('timed out');
  });

  it('returns the timeout message for unknown codes', () => {
    // Treat anything outside 1–2 as timeout (code 3 is the only other standard code)
    const msg = getGeolocationErrorMessage(99);
    expect(msg).toContain('timed out');
  });
});
