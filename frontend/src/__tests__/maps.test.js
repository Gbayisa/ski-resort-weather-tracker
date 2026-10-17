import { describe, it, expect } from 'vitest';
import { buildDirectionsUrl } from '../utils/maps.js';

const chamonix = { name: 'Chamonix', lat: 45.9237, lon: 6.8694 };
const params = (url) => new URL(url).searchParams;

describe('buildDirectionsUrl', () => {
  it('uses the official Google Maps directions URL format', () => {
    const url = buildDirectionsUrl(chamonix, { latitude: 46.2, longitude: 6.15 });
    expect(url.startsWith('https://www.google.com/maps/dir/?')).toBe(true);
    expect(params(url).get('api')).toBe('1');
    expect(params(url).get('travelmode')).toBe('driving');
  });

  it('routes to the resort coordinates, not its (possibly ambiguous) name', () => {
    expect(params(buildDirectionsUrl(chamonix, null)).get('destination')).toBe('45.9237,6.8694');
  });

  it('starts from the searched place when the user typed a location', () => {
    const url = buildDirectionsUrl(chamonix, { latitude: 46.2, longitude: 6.15 });
    expect(params(url).get('origin')).toBe('46.2,6.15');
    expect(params(url).has('dir_action')).toBe(false);
  });

  it('omits the origin and starts navigation when the location came from the device GPS', () => {
    const url = buildDirectionsUrl(chamonix, { latitude: 46.2, longitude: 6.15, fromDevice: true });
    expect(params(url).has('origin')).toBe(false);
    expect(params(url).get('dir_action')).toBe('navigate');
  });
});
