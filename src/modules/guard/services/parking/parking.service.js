/**
 * Parking API — 24 Sep 2026 contract.
 * Mock when USE_DUMMY_DATA=true; otherwise the documented Axios routes.
 */
import api from '@/services/api/axios';
import { panelUsesDummy } from '@/config/dataMode';
import { GUARD_PANEL_ENDPOINTS as EP } from '@/modules/guard/constants/panelEndpoints';
import { delay } from '@/modules/guard/services/core/mockHttp';
import {
  apiError,
  buildPagination,
  normalizePhone,
} from '@/modules/guard/services/core/http';
import { unwrapEnvelope } from '@/modules/guard/services/core/http';
import {
  enterResident,
  enterVisitor,
  exitResident,
  exitVisitor,
  findResident,
  listLogRows,
  listResidentRows,
  listVisitorRows,
  parkingCounts,
} from '@/modules/guard/services/parking/parkingDummyStore';

export const formatLabel = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const VEHICLE_TYPES = ['car', 'bike', 'scooter', 'ev', 'commercial', 'bicycle', 'other'];

function httpError(err, fallback) {
  const error = apiError(err, fallback);
  if (err?.status && !error.status) error.status = err.status;
  if (err?.response) error.response = err.response;
  return error;
}

function paginate(rows, page, pageSize) {
  const p = Math.max(1, Number(page) || 1);
  const size = Math.min(100, Math.max(1, Number(pageSize) || 20));
  const start = (p - 1) * size;
  return {
    items: rows.slice(start, start + size),
    pagination: buildPagination(rows.length, p, size),
  };
}

function includes(hay, needle) {
  return String(hay || '').toLowerCase().includes(needle);
}

function residentSearch(row, needle) {
  if (!needle) return true;
  return (
    includes(row.slotNumber, needle) ||
    includes(row.residentName, needle) ||
    includes(row.vehicleNumber, needle) ||
    includes(row.flatNo, needle) ||
    includes(row.wingNo, needle) ||
    includes(row.building, needle)
  );
}

function visitorSearch(row, needle) {
  if (!needle) return true;
  return (
    includes(row.slotNumber, needle) ||
    includes(row.building, needle) ||
    includes(row.wingNo, needle) ||
    includes(row.visitorName, needle) ||
    includes(row.phone, needle) ||
    includes(row.vehicleNumber, needle) ||
    includes(row.flatNo, needle) ||
    includes(row.flatWingNo, needle) ||
    includes(row.flatBuilding, needle)
  );
}

function logSearch(row, needle) {
  if (!needle) return true;
  return (
    includes(row.slotNumber, needle) ||
    includes(row.vehicleNumber, needle) ||
    includes(row.residentName, needle) ||
    includes(row.visitorName, needle) ||
    includes(row.phone, needle) ||
    includes(row.flatNo, needle) ||
    includes(row.wingNo, needle) ||
    includes(row.building, needle)
  );
}

function sortRows(rows, sortBy, sortOrder, fallback) {
  const key = sortBy || fallback;
  const dir = sortOrder === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => {
    const av = a[key] == null ? '' : String(a[key]);
    const bv = b[key] == null ? '' : String(b[key]);
    return av.localeCompare(bv) * dir;
  });
}

/**
 * Map an API resident row onto the slot object the current parking page renders.
 * vacant → available so the existing Free / no-action UI stays.
 */
export function toUiResidentSlot(row) {
  const status =
    row.status === 'inside' ? 'inside' : row.status === 'outside' ? 'outside' : 'available';
  const allotted = row.status !== 'vacant';
  return {
    id: row.id,
    slotCode: row.slotNumber,
    compartment: row.building || '—',
    category: 'resident',
    wingNo: row.wingNo,
    apiStatus: row.status,
    allottee: allotted
      ? {
          name: row.residentName,
          flat: row.flatNo,
          vehicleNumber: row.vehicleNumber,
          vehicleType: row.vehicleType,
        }
      : null,
    occupancy: {
      status,
      entryAt: row.entryTime,
      exitAt: null,
    },
    slotId: row.id,
  };
}

export function toUiVisitorSlot(row) {
  const occupied = row.status === 'occupied';
  return {
    id: row.id,
    slotCode: row.slotNumber,
    compartment: row.building || 'Visitor',
    category: 'visitor',
    wingNo: row.wingNo,
    apiStatus: row.status,
    allottee: null,
    occupancy: occupied
      ? {
          status: 'occupied',
          entryAt: row.entryTime,
          exitAt: null,
          visitorName: row.visitorName,
          visitingFlat: [row.flatBuilding, row.flatWingNo, row.flatNo].filter(Boolean).join(' · '),
          flatNo: row.flatNo,
          phone: row.phone,
          vehicleNumber: row.vehicleNumber,
          vehicleType: row.vehicleType,
          visitorLogId: row.logId,
        }
      : {
          status: 'available',
          entryAt: null,
          exitAt: null,
          visitorLogId: null,
        },
    slotId: row.id,
  };
}

/** One log row for the existing Live panel. exitTime null → entry/inside, else exit. */
export function toUiParkingLog(row) {
  const exited = row.exitTime != null;
  return {
    id: row.id,
    eventType: exited ? 'exit' : 'entry',
    category: row.parkingType === 'visitor' ? 'visitor' : 'resident',
    vehicleNumber: row.vehicleNumber,
    vehicleType: row.vehicleType,
    personName: row.visitorName || row.residentName,
    flatNumber: row.flatNo,
    parkingNumber: row.slotNumber,
    timestamp: exited ? row.exitTime : row.entryTime,
    entryTime: row.entryTime,
    recordedBy: row.recordedBy,
    phone: row.phone,
    building: row.building,
    wingNo: row.wingNo,
    derivedStatus: exited ? 'exited' : 'inside',
  };
}

export async function listResidentParking(params = {}) {
  try {
    if (panelUsesDummy()) {
      await delay();
      const status = params.status && params.status !== 'all' ? params.status : null;
      const needle = String(params.search || '').trim().toLowerCase();
      const building = String(params.building || '').trim().toLowerCase();
      let rows = listResidentRows().filter((row) => {
        if (status && row.status !== status) return false;
        if (building && String(row.building || '').toLowerCase() !== building) return false;
        return residentSearch(row, needle);
      });
      rows = sortRows(rows, params.sortBy, params.sortOrder || 'asc', 'building');
      const page = paginate(rows, params.page, params.pageSize || 100);
      return { ...page, counts: parkingCounts() };
    }
    const res = await api.get(EP.parkingResidents, { params });
    return unwrapEnvelope(res);
  } catch (err) {
    throw httpError(err, 'Failed to load resident parking');
  }
}

export async function enterResidentParking(id) {
  try {
    if (panelUsesDummy()) {
      await delay();
      return enterResident(id);
    }
    const res = await api.post(EP.parkingResidentEntry(id));
    return unwrapEnvelope(res);
  } catch (err) {
    throw httpError(err, 'Resident entry failed');
  }
}

export async function exitResidentParking(id) {
  try {
    if (panelUsesDummy()) {
      await delay();
      return exitResident(id);
    }
    const res = await api.post(EP.parkingResidentExit(id));
    return unwrapEnvelope(res);
  } catch (err) {
    throw httpError(err, 'Resident exit failed');
  }
}

export async function listVisitorParking(params = {}) {
  try {
    if (panelUsesDummy()) {
      await delay();
      const status = params.status && params.status !== 'all' ? params.status : null;
      const needle = String(params.search || '').trim().toLowerCase();
      let rows = listVisitorRows().filter((row) => {
        if (status && row.status !== status) return false;
        return visitorSearch(row, needle);
      });
      rows = sortRows(rows, params.sortBy, params.sortOrder || 'asc', 'building');
      const page = paginate(rows, params.page, params.pageSize || 100);
      return { ...page, counts: parkingCounts() };
    }
    const res = await api.get(EP.parkingVisitors, { params });
    return unwrapEnvelope(res);
  } catch (err) {
    throw httpError(err, 'Failed to load visitor parking');
  }
}

export async function enterVisitorParking(body) {
  try {
    const phone = normalizePhone(body.phone);
    if (phone.length !== 10) {
      const e = new Error('Enter a valid 10-digit phone number');
      e.status = 422;
      throw e;
    }
    const vehicleType = String(body.vehicleType || '').toLowerCase();
    if (!VEHICLE_TYPES.includes(vehicleType)) {
      const e = new Error('Unsupported vehicle type');
      e.status = 422;
      throw e;
    }
    const payload = {
      visitorName: String(body.visitorName || '').trim(),
      phone,
      vehicleNumber: String(body.vehicleNumber || '').replace(/\s+/g, '').toUpperCase(),
      vehicleType,
      building: String(body.building || '').trim(),
      wingNo: String(body.wingNo || '').trim(),
      flatNo: String(body.flatNo || '').trim(),
      parkingId: body.parkingId,
    };
    if (!payload.visitorName || !payload.vehicleNumber || !payload.flatNo || !payload.building || !payload.parkingId) {
      const e = new Error('Visitor name, phone, vehicle, flat and parking slot are required');
      e.status = 422;
      throw e;
    }
    if (panelUsesDummy()) {
      await delay();
      return enterVisitor(payload);
    }
    const res = await api.post(EP.parkingVisitorEntry, payload);
    return unwrapEnvelope(res);
  } catch (err) {
    throw httpError(err, 'Visitor entry failed');
  }
}

export async function exitVisitorParking(logId) {
  try {
    if (!logId) {
      const e = new Error('Visitor exit requires a log id');
      e.status = 422;
      throw e;
    }
    if (panelUsesDummy()) {
      await delay();
      return exitVisitor(logId);
    }
    const res = await api.post(EP.parkingVisitorExit(logId));
    return unwrapEnvelope(res);
  } catch (err) {
    throw httpError(err, 'Visitor exit failed');
  }
}

export async function listParkingLogs(params = {}) {
  try {
    if (panelUsesDummy()) {
      await delay();
      const type = params.parkingType && params.parkingType !== 'all' ? params.parkingType : null;
      const needle = String(params.search || '').trim().toLowerCase();
      let rows = listLogRows().filter((row) => {
        if (type && row.parkingType !== type) return false;
        return logSearch(row, needle);
      });
      rows = sortRows(rows, params.sortBy || 'entryTime', params.sortOrder || 'desc', 'entryTime');
      const page = paginate(rows, params.page, params.pageSize || 100);
      return { ...page, counts: parkingCounts() };
    }
    const res = await api.get(EP.parkingLogs, { params });
    return unwrapEnvelope(res);
  } catch (err) {
    throw httpError(err, 'Failed to load parking logs');
  }
}

export { findResident };
