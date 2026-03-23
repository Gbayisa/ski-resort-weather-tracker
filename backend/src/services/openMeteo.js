const OPEN_METEO_FORECAST = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_GEOCODING = 'https://geocoding-api.open-meteo.com/v1/search';
const USER_AGENT = 'SkiResortWeatherTracker/1.0 (local-dev)';

/**
 * Fetch hourly forecast + historical data for a resort location.
 * Requests 3 past days plus the forecast range from Open-Meteo.
 */
export async function fetchWeatherData(lat, lon, forecastDate) {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    hourly: 'snowfall,precipitation,temperature_2m,snow_depth,freezing_level_height,wind_speed_10m,visibility,cloud_cover',
    past_days: '3',
    forecast_days: '16',
    timezone: 'auto',
  });

  const url = `${OPEN_METEO_FORECAST}?${params}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`Open-Meteo forecast error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Geocode a text query using Open-Meteo's geocoding API.
 */
export async function geocodeLocation(query) {
  if (!query || query.length < 2) return [];

  const params = new URLSearchParams({
    name: query,
    count: '5',
    language: 'en',
    format: 'json',
  });

  const url = `${OPEN_METEO_GEOCODING}?${params}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`Open-Meteo geocoding error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return (data.results || []).map((r) => ({
    name: r.name,
    country: r.country,
    admin1: r.admin1,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}
