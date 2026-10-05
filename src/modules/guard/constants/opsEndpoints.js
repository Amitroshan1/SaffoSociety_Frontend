/**
 * Ops module endpoints — SOS · Schedule · Booking (backend PDF).
 */
export const GUARD_OPS_ENDPOINTS = {
  sos: '/guard/sos',
  sosById: (id) => `/guard/sos/${id}`,
  sosResolve: (id) => `/guard/sos/${id}/resolve`,

  shifts: '/guard/schedule/shifts',
  attendance: '/guard/schedule/attendance',
  punches: '/guard/schedule/punches',
  punchIn: '/guard/schedule/punch-in',
  punchOut: '/guard/schedule/punch-out',

  bookings: '/guard/bookings',
  bookingById: (id) => `/guard/bookings/${id}`,
};

/** WebSocket path (token appended as query by client). */
export function guardAlertsWsUrl(apiOrigin, token) {
  const base = String(apiOrigin || 'http://localhost:8000').replace(/\/$/, '');
  const wsBase = base.replace(/^http/i, 'ws');
  const q = token ? `?token=${encodeURIComponent(token)}` : '';
  return `${wsBase}/ws/guard/alerts${q}`;
}
