/**
 * Schedule API — backend PDF contract.
 * Shifts / Attendance / Punches / Punch-in / Punch-out
 */
import api from '@/services/api/axios';
import { opsUsesDummy } from '@/config/dataMode';
import { GUARD_OPS_ENDPOINTS as EP } from '@/modules/guard/constants/opsEndpoints';
import { delay } from '@/modules/guard/services/core/mockHttp';
import { scheduleDummyStore } from '@/modules/guard/services/schedule/scheduleDummyStore';
import {
  apiError,
  emptyPagination,
  unwrapEnvelope,
} from '@/modules/guard/services/core/http';

/** PDF shift statuses */
export const SHIFT_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

export const SHIFT_STATUS_LABEL = {
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  completed: 'Completed',
};

export const SHIFT_STATUS_COLORS = {
  scheduled: '#2563eb',
  in_progress: '#059669',
  completed: '#64748b',
};

/** PDF attendance statuses */
export const ATTENDANCE_STATUS = {
  SCHEDULED: 'scheduled',
  PRESENT: 'present',
  ABSENT: 'absent',
};

export const ATTENDANCE_STATUS_COLORS = {
  scheduled: '#2563eb',
  present: '#22c55e',
  absent: '#ef4444',
};

function mapShift(row) {
  if (!row) return null;
  return { ...row };
}

function mapAttendance(row) {
  if (!row) return null;
  return {
    ...row,
    id: row.id ?? row.shiftId,
    checkInTime: row.checkInTime || row.punchInAt || null,
    checkOutTime: row.checkOutTime || row.punchOutAt || null,
  };
}

function mapList(data, key, mapRow = (row) => row) {
  const items = (data?.items || data?.[key] || []).map(mapRow);
  return {
    items,
    pagination: data?.pagination || {
      ...emptyPagination(),
      pageSize: items.length,
      total: items.length,
      totalPages: 1,
    },
  };
}

export async function getShifts(params = {}) {
  try {
    if (opsUsesDummy()) {
      await delay();
      return scheduleDummyStore.listShifts(params);
    }
    const res = await api.get(EP.shifts, { params });
    return mapList(unwrapEnvelope(res), 'shifts', mapShift);
  } catch (err) {
    throw apiError(err, 'Failed to load shifts');
  }
}

export async function getAttendance(params = {}) {
  try {
    if (opsUsesDummy()) {
      await delay();
      return scheduleDummyStore.listAttendance(params);
    }
    const res = await api.get(EP.attendance, { params });
    return mapList(unwrapEnvelope(res), 'attendance', mapAttendance);
  } catch (err) {
    throw apiError(err, 'Failed to load attendance');
  }
}

export async function getPunches(params = {}) {
  try {
    if (opsUsesDummy()) {
      await delay();
      return scheduleDummyStore.listPunches(params);
    }
    const res = await api.get(EP.punches, { params });
    return mapList(unwrapEnvelope(res), 'punches');
  } catch (err) {
    throw apiError(err, 'Failed to load punches');
  }
}

/**
 * POST /guard/schedule/punch-in
 * Body: { shiftId, latitude, longitude } only
 */
export async function punchIn({ shiftId, latitude, longitude }) {
  try {
    const payload = {
      shiftId: Number(shiftId),
      latitude: Number(latitude),
      longitude: Number(longitude),
    };
    if (!Number.isFinite(payload.shiftId)) {
      const e = new Error('shiftId is required');
      e.status = 422;
      throw e;
    }
    if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) {
      const e = new Error('Valid latitude and longitude are required');
      e.status = 422;
      throw e;
    }

    if (opsUsesDummy()) {
      await delay();
      return scheduleDummyStore.punchIn(payload);
    }
    const res = await api.post(EP.punchIn, payload);
    const data = unwrapEnvelope(res);
    return { ...data, attendance: data?.attendance || { id: data?.shiftId } };
  } catch (err) {
    throw apiError(err, 'Punch-in failed');
  }
}

/**
 * POST /guard/schedule/punch-out
 * Body: { shiftId, latitude, longitude } only
 */
export async function punchOut({ shiftId, latitude, longitude }) {
  try {
    const payload = {
      shiftId: Number(shiftId),
      latitude: Number(latitude),
      longitude: Number(longitude),
    };
    if (!Number.isFinite(payload.shiftId)) {
      const e = new Error('shiftId is required');
      e.status = 422;
      throw e;
    }
    if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) {
      const e = new Error('Valid latitude and longitude are required');
      e.status = 422;
      throw e;
    }

    if (opsUsesDummy()) {
      await delay();
      return scheduleDummyStore.punchOut(payload);
    }
    const res = await api.post(EP.punchOut, payload);
    const data = unwrapEnvelope(res);
    return { ...data, attendance: data?.attendance || { id: data?.shiftId } };
  } catch (err) {
    throw apiError(err, 'Punch-out failed');
  }
}

/** Formatting helpers used by UI (not API) */
export function formatShiftLabel(value) {
  return String(value || '').replace(/_/g, ' ');
}

export function formatShiftDate(isoDate) {
  try {
    return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return isoDate;
  }
}

export function formatShiftTime(iso) {
  if (!iso) return '—';
  const text = String(iso);
  if (/^\d{2}:\d{2}/.test(text) && text.length <= 8) return text.slice(0, 5);
  try {
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return text;
    return parsed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return text;
  }
}

export function formatShiftTimeRange(startIso, endIso) {
  return `${formatShiftTime(startIso)} – ${formatShiftTime(endIso)}`;
}

export { indiaTodayISO as toIsoDate } from '@/modules/guard/services/core/http';
