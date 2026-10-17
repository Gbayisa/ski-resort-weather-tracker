import { getGeolocationErrorMessage } from './geoError.js';

/** Promise wrapper around the browser's geolocation with friendly error messages. */
export function getCurrentPosition({ timeout = 10000, highAccuracy = false } = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location is not available in this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(new Error(getGeolocationErrorMessage(err.code))),
      { timeout, enableHighAccuracy: highAccuracy, maximumAge: 5 * 60 * 1000 }
    );
  });
}
