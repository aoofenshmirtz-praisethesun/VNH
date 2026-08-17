const BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  health: () => request('/api/health'),
  meta: () => request('/api/meta'),
  points: () => request('/api/points'),
  point: (id) => request(`/api/points/${id}`),
  nearest: (lat, lon) => request(`/api/nearest?lat=${lat}&lon=${lon}`),
  crops: () => request('/api/crops'),
  cropVerdict: (body) => request('/api/crop-verdict', { method: 'POST', body: JSON.stringify(body) }),
  addCitizenReading: (body) =>
    request('/api/citizen-readings', { method: 'POST', body: JSON.stringify(body) }),
};
