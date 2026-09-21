import api from '@/services/api';

export const listShifts = (params) => api.get('/shifts', { params });
export const getTodayShifts = () => api.get('/shifts/today');
export const getShift = (id) => api.get(`/shifts/${id}`);
export const createShift = (payload) => api.post('/shifts', payload);
export const updateShift = (id, payload) => api.patch(`/shifts/${id}`, payload);
export const startShift = (id, payload) => api.post(`/shifts/${id}/start`, payload || {});
export const completeShift = (id, payload) => api.post(`/shifts/${id}/complete`, payload || {});
export const cancelShift = (id, payload) => api.post(`/shifts/${id}/cancel`, payload || {});
export const markNoShow = (id, payload) => api.post(`/shifts/${id}/no-show`, payload || {});

export const SHIFT_STATUS_COLORS = {
  scheduled: '#3b82f6',
  active: '#22c55e',
  completed: '#64748b',
  cancelled: '#ef4444',
  no_show: '#f59e0b',
};

export function formatShiftLabel(value) {
  if (!value) return '—';
  return String(value)
    .split(/[_-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function toIsoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatShiftDate(isoDate) {
  if (!isoDate) return '—';
  try {
    return new Date(`${isoDate}T12:00:00`).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

export function formatShiftTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${hours}.${minutes} ${ampm}`;
  } catch {
    return '';
  }
}

export function formatShiftTimeRange(startIso, endIso) {
  const start = formatShiftTime(startIso);
  const end = formatShiftTime(endIso);
  if (!start && !end) return '—';
  if (!end) return start;
  if (!start) return end;
  return `${start} - ${end}`;
}
