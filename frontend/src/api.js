const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function searchLocation(query) {
  const res = await fetch(`${API_BASE}/geocoding/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Geocoding failed');
  const data = await res.json();
  return data.results || [];
}

export async function getRecommendations({ lat, lon, date, radius, minSnowfall }) {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    date,
    radius: radius.toString(),
    minSnowfall: minSnowfall.toString(),
  });
  const res = await fetch(`${API_BASE}/recommend?${params}`);
  if (!res.ok) throw new Error('Failed to get recommendations');
  const data = await res.json();
  return data;
}

export async function getResortDetail(id, date) {
  const res = await fetch(`${API_BASE}/resort/${id}?date=${date}`);
  if (!res.ok) throw new Error('Failed to get resort detail');
  return res.json();
}

export async function getHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}
