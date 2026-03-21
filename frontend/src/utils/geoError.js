/**
 * Returns a human-readable error message for a GeolocationPositionError code.
 * Code 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT.
 */
export function getGeolocationErrorMessage(code) {
  if (code === 1) {
    return 'Location access was denied. Please allow location access in your browser settings and try again.';
  }
  if (code === 2) {
    return 'Your location could not be determined. Please type a location instead.';
  }
  if (code === 3) {
    return 'Location request timed out. Please type a location instead.';
  }
  return 'Location request timed out. Please type a location instead.';
}
