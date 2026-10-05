/**
 * Move-out clearance — 24 Sep 2026 contract.
 * Status values sent to the API: all | pending | ready | allowed.
 */
import api from '@/services/api/axios';
import { panelUsesDummy } from '@/config/dataMode';
import { GUARD_PANEL_ENDPOINTS as EP } from '@/modules/guard/constants/panelEndpoints';
import { delay } from '@/modules/guard/services/core/mockHttp';
import { apiError, unwrapEnvelope } from '@/modules/guard/services/core/http';
import { fetchAuthorizedFile } from '@/modules/guard/services/core/guardFile';
import {
  allowMoveOutRow,
  findMoveOut,
  listMoveOutRows,
} from '@/modules/guard/services/moveout/moveoutDummyStore';

const STATUSES = new Set(['all', 'pending', 'ready', 'allowed']);

function matches(row, needle) {
  if (!needle) return true;
  return (
    String(row.residentName || '').toLowerCase().includes(needle) ||
    String(row.flatNo || '').toLowerCase().includes(needle)
  );
}

export async function listMoveOutRequests(params = {}) {
  try {
    const status = params.status == null || params.status === '' ? 'all' : String(params.status);
    if (!STATUSES.has(status)) {
      const e = new Error('Unknown move-out status');
      e.status = 400;
      throw e;
    }
    if (panelUsesDummy()) {
      await delay();
      const needle = String(params.search || '').trim().toLowerCase();
      let items = listMoveOutRows().filter((row) => matches(row, needle));
      if (status !== 'all') items = items.filter((row) => row.status === status);
      items.sort((a, b) => String(a.moveOutDate).localeCompare(String(b.moveOutDate)));
      return { items };
    }
    const query = {};
    if (status !== 'all') query.status = status;
    if (params.search) query.search = params.search;
    const res = await api.get(EP.moveOut, { params: query });
    const data = unwrapEnvelope(res) || {};
    return { items: data.items || data.requests || [] };
  } catch (err) {
    throw apiError(err, 'Failed to load move-out requests');
  }
}

export async function getMoveOutRequest(id) {
  try {
    if (panelUsesDummy()) {
      await delay();
      const row = findMoveOut(id);
      if (!row) {
        const e = new Error('Move-out request not found');
        e.status = 404;
        throw e;
      }
      return row;
    }
    const res = await api.get(EP.moveOutById(id));
    return unwrapEnvelope(res);
  } catch (err) {
    throw apiError(err, 'Move-out request not found');
  }
}

export async function allowMoveOut(id) {
  try {
    if (panelUsesDummy()) {
      await delay();
      return allowMoveOutRow(id);
    }
    const res = await api.patch(EP.moveOutAllow(id));
    return unwrapEnvelope(res);
  } catch (err) {
    throw apiError(err, 'Allow to go failed');
  }
}

export async function viewMoveOutFile(viewUrl) {
  const { blob } = await fetchAuthorizedFile(viewUrl);
  return URL.createObjectURL(blob);
}
