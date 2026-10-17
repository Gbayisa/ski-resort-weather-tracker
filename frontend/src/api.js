const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'pr.token';

export async function searchLocation(query) {
  const res = await fetch(`${API_BASE}/geocoding/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Geocoding failed');
  const data = await res.json();
  return data.results || [];
}

/**
 * Ranked resorts for a trip.
 * @param {{lat:number, lon:number, today:string, dates:string[], trip:string, drive:string, style:string}} q
 */
export async function discover({ lat, lon, today, dates, trip, drive, style }, signal) {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    today,
    dates: dates.join(','),
    trip,
    drive,
    style,
  });
  const res = await fetch(`${API_BASE}/discover?${params}`, { signal });
  if (!res.ok) throw new Error('Could not load resorts');
  return res.json();
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

// ---------- Community (Meet riders) ----------

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Private mode: the profile lasts for this session only
  }
}

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || 'Something went wrong');
    this.status = status;
    this.code = body?.error;
    this.body = body;
  }
}

async function community(path, { method = 'GET', body } = {}) {
  const token = readToken();
  const res = await fetch(`${API_BASE}/community${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) writeToken(null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export const meetApi = {
  me: () => community('/me'),
  async saveProfile(profile) {
    const data = await community('/profile', { method: 'POST', body: profile });
    if (data.token) writeToken(data.token);
    return data;
  },
  async deleteProfile() {
    await community('/profile', { method: 'DELETE' });
    writeToken(null);
  },
  checkIn: (body) => community('/checkin', { method: 'POST', body }),
  updateCheckin: (body) => community('/checkin', { method: 'PATCH', body }),
  checkOut: () => community('/checkin', { method: 'DELETE' }),
  riders: (resortId) => community(`/resorts/${resortId}/riders`),
  connections: () => community('/connections'),
  connect: (toRiderId, intent) => community('/connections', { method: 'POST', body: { toRiderId, intent } }),
  respond: (id, accept) => community(`/connections/${id}/respond`, { method: 'POST', body: { accept } }),
  messages: (id, after = 0) => community(`/connections/${id}/messages?after=${after}`),
  send: (id, body) => community(`/connections/${id}/messages`, { method: 'POST', body: { body } }),
  block: (riderId) => community('/block', { method: 'POST', body: { riderId } }),
  report: (riderId, reason) => community('/report', { method: 'POST', body: { riderId, reason } }),
  devResorts: () => community('/dev/resorts'),
};
