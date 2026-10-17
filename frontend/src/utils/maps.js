/**
 * Google Maps driving-directions link (official "Maps URLs" format). It is a
 * universal link: it opens the Google Maps app on Android and iOS when
 * installed, otherwise Google Maps in the browser. No API key needed.
 *
 * Destination is coordinates rather than the resort name: several resort
 * names are also towns elsewhere (e.g. Loveland, CO is ~100 km from
 * Loveland Ski Area), and a text search would route skiers to the wrong place.
 */
export function buildDirectionsUrl(resort, origin) {
  // Car-free resorts (Zermatt, Wengen…) carry an `access` point: where you leave the car
  const target = resort.access ?? resort;
  const params = new URLSearchParams({
    api: '1',
    destination: `${target.lat},${target.lon}`,
    travelmode: 'driving',
  });

  if (origin?.fromDevice) {
    // No origin: Maps uses the phone's live GPS and starts turn-by-turn navigation
    params.set('dir_action', 'navigate');
  } else if (origin) {
    params.set('origin', `${origin.latitude},${origin.longitude}`);
  }

  return `https://www.google.com/maps/dir/?${params}`;
}
