/**
 * In-memory SOS dummy store — same data shape as backend PDF.
 * Used only when USE_DUMMY_DATA=true. UI must not call this directly.
 */
import { buildPagination, indiaTodayISO } from '@/modules/guard/services/core/http';

const listeners = new Set();

function isoNow() {
  return new Date().toISOString();
}

function seed() {
  const today = indiaTodayISO();
  return [
    {
      id: 'sos-d1',
      flat: 'B-204',
      residentName: 'Ananya Rao',
      note: 'Medical emergency — help needed',
      message: 'Medical emergency — help needed',
      status: 'active',
      createdAt: `${today}T08:15:00+05:30`,
      resolvedAt: null,
      time: '08:15 AM',
    },
  ];
}

/** Empty until dummy mode explicitly resets. A live session must not start with a fake SOS. */
let alerts = [];

function notify(event) {
  listeners.forEach((fn) => {
    try {
      fn(event);
    } catch {
      /* ignore */
    }
  });
}

function matchSearch(row, q) {
  if (!q) return true;
  const n = String(q).toLowerCase();
  return [row.flat, row.residentName, row.note, row.message, row.id].some((h) =>
    String(h || '')
      .toLowerCase()
      .includes(n),
  );
}

function inDateRange(iso, from, to) {
  if (!from && !to) return true;
  const day = String(iso || '').slice(0, 10);
  if (!day) return true;
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

function sortRows(rows, sortBy = 'createdAt', sortOrder = 'desc') {
  const dir = String(sortOrder).toLowerCase() === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = a[sortBy] ?? '';
    const bv = b[sortBy] ?? '';
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
}

export const sosDummyStore = {
  reset() {
    alerts = seed();
    notify({ type: 'store.reset' });
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  list(params = {}) {
    let rows = [...alerts];
    if (params.status) {
      rows = rows.filter((r) => r.status === params.status);
    }
    if (params.search) rows = rows.filter((r) => matchSearch(r, params.search));
    rows = rows.filter((r) => inDateRange(r.createdAt, params.from, params.to));
    rows = sortRows(rows, params.sortBy || 'createdAt', params.sortOrder || 'desc');
    const page = Math.max(1, Number(params.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20));
    const start = (page - 1) * pageSize;
    const items = rows.slice(start, start + pageSize);
    return {
      items,
      pagination: buildPagination(rows.length, page, pageSize),
      counts: {
        all: alerts.length,
        active: alerts.filter((a) => a.status === 'active').length,
        resolved: alerts.filter((a) => a.status === 'resolved').length,
      },
    };
  },

  get(id) {
    return alerts.find((a) => String(a.id) === String(id)) || null;
  },

  active() {
    return alerts.filter((a) => a.status === 'active');
  },

  resolve(id) {
    const row = alerts.find((a) => String(a.id) === String(id));
    if (!row) {
      const e = new Error('SOS alert not found');
      e.status = 404;
      throw e;
    }
    if (row.status !== 'active') {
      const e = new Error('SOS is already resolved');
      e.status = 409;
      throw e;
    }
    row.status = 'resolved';
    row.resolvedAt = isoNow();
    row.note = row.note || 'Resolved by guard';
    const copy = { ...row };
    notify({ type: 'sos.resolved', data: copy });
    return copy;
  },

  /** Simulate resident-raised SOS for UI/WebSocket testing in dummy mode */
  emitCreated(partial = {}) {
    const row = {
      id: `sos-${Date.now()}`,
      flat: partial.flat || 'A-210',
      residentName: partial.residentName || 'Demo Resident',
      note: partial.note || 'TEST SOS — emergency button pressed',
      message: partial.message || partial.note || 'TEST SOS — emergency button pressed',
      status: 'active',
      createdAt: isoNow(),
      resolvedAt: null,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    alerts = [row, ...alerts];
    notify({ type: 'sos.created', data: row });
    return row;
  },

  emitResolved(id) {
    return this.resolve(id);
  },
};
