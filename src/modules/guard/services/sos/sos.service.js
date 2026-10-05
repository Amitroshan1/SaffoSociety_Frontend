/**
 * SOS API — backend PDF contract.
 * Dummy when USE_DUMMY_DATA=true; HTTP + WebSocket when false.
 */
import api from '@/services/api/axios';
import { opsUsesDummy } from '@/config/dataMode';
import { GUARD_OPS_ENDPOINTS as EP } from '@/modules/guard/constants/opsEndpoints';
import { delay } from '@/modules/guard/services/core/mockHttp';
import { sosDummyStore } from '@/modules/guard/services/sos/sosDummyStore';
import { connectSosAlertsSocket } from '@/modules/guard/services/sos/sosAlertsWs';
import {
  apiError,
  emptyPagination,
  gateFlatLabel,
  unwrapEnvelope,
} from '@/modules/guard/services/core/http';

/** Clear any prior multi-alert dummy session so UI starts with one SOS. */
if (opsUsesDummy()) {
  sosDummyStore.reset();
}

function mapAlert(row) {
  if (!row) return null;
  return {
    ...row,
    flat: row.flat || gateFlatLabel(row),
    phone: row.phone || row.residentPhone || '',
    note: row.note || row.message || '',
    message: row.message || row.note || '',
    time:
      row.time ||
      (row.createdAt
        ? new Date(row.createdAt).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '—'),
  };
}

function mapList(data) {
  const items = (data?.items || data?.alerts || []).map(mapAlert);
  return {
    items,
    pagination: data?.pagination || {
      ...emptyPagination(),
      pageSize: items.length,
      total: items.length,
      totalPages: 1,
    },
    counts: data?.counts || {
      all: items.length,
      active: items.filter((a) => a.status === 'active').length,
      resolved: items.filter((a) => a.status === 'resolved').length,
    },
  };
}

async function countStatus(status) {
  const params = { page: 1, pageSize: 1, sortBy: 'createdAt', sortOrder: 'desc' };
  if (status) params.status = status;
  const res = await api.get(EP.sos, { params });
  return Number(unwrapEnvelope(res)?.pagination?.total ?? 0);
}

async function sosCounts() {
  const [all, active, resolved] = await Promise.all([
    countStatus(),
    countStatus('active'),
    countStatus('resolved'),
  ]);
  return { all, active, resolved };
}

export async function getSosAlerts(params = {}) {
  try {
    if (opsUsesDummy()) {
      await delay();
      const data = sosDummyStore.list(params);
      return {
        items: data.items.map(mapAlert),
        pagination: data.pagination,
        counts: data.counts,
      };
    }
    const res = await api.get(EP.sos, { params });
    const data = mapList(unwrapEnvelope(res));
    data.counts = await sosCounts();
    if (params.status === 'active') data.counts.active = data.pagination?.total ?? data.counts.active;
    if (params.status === 'resolved') data.counts.resolved = data.pagination?.total ?? data.counts.resolved;
    if (!params.status) data.counts.all = data.pagination?.total ?? data.counts.all;
    return data;
  } catch (err) {
    throw apiError(err, 'Failed to load SOS alerts');
  }
}

export async function getSosAlert(id) {
  try {
    if (opsUsesDummy()) {
      await delay();
      const row = sosDummyStore.get(id);
      if (!row) {
        const e = new Error('SOS alert not found');
        e.status = 404;
        throw e;
      }
      return mapAlert(row);
    }
    const res = await api.get(EP.sosById(id));
    return mapAlert(unwrapEnvelope(res));
  } catch (err) {
    throw apiError(err, 'Failed to load SOS alert');
  }
}

export async function getActiveSosAlerts() {
  const data = await getSosAlerts({
    status: 'active',
    page: 1,
    pageSize: 50,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  return data.items.filter((a) => a.status === 'active');
}

export async function resolveSos(id) {
  try {
    if (opsUsesDummy()) {
      await delay();
      return mapAlert(sosDummyStore.resolve(id));
    }
    const res = await api.patch(EP.sosResolve(id));
    return mapAlert(unwrapEnvelope(res));
  } catch (err) {
    throw apiError(err, 'Failed to resolve SOS');
  }
}

/**
 * Subscribe to SOS realtime updates.
 * Dummy: in-process events from sosDummyStore (no fake WebSocket).
 * Real: WebSocket + refetch on reconnect.
 *
 * @param {object} handlers
 * @param {(alert: object) => void} handlers.onCreated
 * @param {(alert: object) => void} handlers.onResolved
 * @param {(err: Error) => void} [handlers.onError]
 * @param {() => Promise<void>} [handlers.onReconnectNeedRefetch]
 */
export function subscribeSosAlerts(handlers = {}) {
  if (opsUsesDummy()) {
    const unsub = sosDummyStore.subscribe((event) => {
      if (event.type === 'sos.created') handlers.onCreated?.(mapAlert(event.data));
      if (event.type === 'sos.resolved') handlers.onResolved?.(mapAlert(event.data));
    });
    return { close: unsub };
  }
  return connectSosAlertsSocket(handlers);
}

/** Dummy-only: simulate resident raising SOS */
export async function __dummyEmitSosCreated(partial) {
  if (!opsUsesDummy()) throw new Error('Mock-only');
  await delay(100);
  return mapAlert(sosDummyStore.emitCreated(partial));
}

/** Dummy-only helpers for tests */
export async function __dummyResetSos() {
  if (!opsUsesDummy()) throw new Error('Mock-only');
  sosDummyStore.reset();
}
