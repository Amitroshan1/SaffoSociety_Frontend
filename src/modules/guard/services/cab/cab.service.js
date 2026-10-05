/**
 * Cab API — backend PDF contract.
 */
import api from '@/services/api/axios';
import { gateUsesDummy } from '@/config/dataMode';
import { GUARD_GATE_ENDPOINTS as EP } from '@/modules/guard/constants/gateEndpoints';
import { delay } from '@/modules/guard/services/core/mockHttp';
import { mockCabs } from '@/modules/guard/services/gate/gateMockStore';
import {
  apiError,
  mediaUrl,
  buildPagination,
  gateFlatLabel,
  requireGateAddress,
  splitStatuses,
  toPhotoFile,
  unwrapEnvelope,
  validatePhotoFile,
} from '@/modules/guard/services/core/http';

function mapCab(row) {
  if (!row) return null;
  return {
    ...row,
    flat: row.flat || gateFlatLabel(row),
    photoDisplayUrl: mediaUrl(row.photoUrl),
  };
}

function mapList(data) {
  const items = (data?.items || data?.cabs || []).map(mapCab);
  return {
    items,
    pagination: data?.pagination || {
      page: 1,
      pageSize: items.length,
      total: items.length,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  };
}

export async function getCabs(params = {}) {
  try {
    if (gateUsesDummy()) {
      await delay();
      const data = mockCabs.list(params);
      return { items: data.items.map(mapCab), pagination: data.pagination };
    }
    const statuses = splitStatuses(params.status);
    const page = Number(params.page || 1);
    const pageSize = Number(params.pageSize || 20);
    if (statuses.length > 1) {
      const lists = await Promise.all(
        statuses.map(async (status) => {
          const res = await api.get(EP.cabs, {
            params: { ...params, status, page: 1, pageSize: 100 },
          });
          return mapList(unwrapEnvelope(res));
        }),
      );
      const items = lists
        .flatMap((list) => list.items)
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      const total = lists.reduce(
        (sum, list) => sum + Number(list.pagination?.total ?? list.items.length),
        0,
      );
      const start = (page - 1) * pageSize;
      return {
        items: items.slice(start, start + pageSize),
        pagination: buildPagination(total, page, pageSize),
      };
    }
    const res = await api.get(EP.cabs, { params });
    return mapList(unwrapEnvelope(res));
  } catch (err) {
    throw apiError(err, 'Failed to load cabs');
  }
}

export async function getCab(id) {
  try {
    if (gateUsesDummy()) {
      await delay();
      const row = mockCabs.get(id);
      if (!row) {
        const e = new Error('Cab not found');
        e.status = 404;
        throw e;
      }
      return mapCab(row);
    }
    const res = await api.get(EP.cabById(id));
    return mapCab(unwrapEnvelope(res));
  } catch (err) {
    throw apiError(err, 'Failed to load cab');
  }
}

export async function createCab(fields) {
  try {
    const vehicleNumber = String(fields.vehicleNumber || fields.vehicle || '')
      .replace(/\s+/g, '')
      .toUpperCase()
      .slice(0, 20);
    if (!vehicleNumber) {
      const e = new Error('Vehicle number is required');
      e.status = 422;
      throw e;
    }
    if (!fields.flat) {
      const e = new Error('Flat is required');
      e.status = 422;
      throw e;
    }

    const photoFile = await toPhotoFile(fields.photo || fields.photoSrc || fields.photoFile);
    if (photoFile) {
      const photoErr = validatePhotoFile(photoFile);
      if (photoErr) {
        const e = new Error(photoErr);
        e.status = 422;
        throw e;
      }
    }

    const payload = {
      vehicleNumber,
      cabService: fields.cabService || fields.service || 'Local',
      flat: fields.flat,
      purpose: fields.purpose || fields.tripPurpose || 'Pickup',
      driverName: fields.driverName || fields.name || null,
    };

    if (gateUsesDummy()) {
      await delay();
      return mapCab(
        mockCabs.create({
          ...payload,
          photoUrl: photoFile ? '/uploads/cab_photo/mock.jpg' : null,
        }),
      );
    }

    const address = requireGateAddress(fields);
    const fd = new FormData();
    fd.append('vehicleNumber', payload.vehicleNumber);
    fd.append('cabService', String(payload.cabService).slice(0, 50));
    fd.append('building', address.building);
    fd.append('wing', address.wing);
    fd.append('flat', address.flat);
    fd.append('purpose', String(payload.purpose).slice(0, 50));
    if (payload.driverName) fd.append('driverName', String(payload.driverName).slice(0, 150));
    if (photoFile) fd.append('photo', photoFile);

    const res = await api.post(EP.cabs, fd);
    return mapCab(unwrapEnvelope(res));
  } catch (err) {
    throw apiError(err, 'Failed to create cab entry');
  }
}

export async function checkInCab(id) {
  try {
    if (gateUsesDummy()) {
      await delay();
      return mapCab(mockCabs.checkIn(id));
    }
    const res = await api.patch(EP.cabCheckIn(id));
    return mapCab(unwrapEnvelope(res));
  } catch (err) {
    throw apiError(err, 'Check-in failed');
  }
}

export async function exitCab(id) {
  try {
    if (gateUsesDummy()) {
      await delay();
      return mapCab(mockCabs.exit(id));
    }
    const res = await api.patch(EP.cabExit(id));
    return mapCab(unwrapEnvelope(res));
  } catch (err) {
    throw apiError(err, 'Exit failed');
  }
}

export async function __mockSetCabStatus(id, status) {
  if (!gateUsesDummy()) throw new Error('Mock-only');
  await delay(100);
  return mapCab(mockCabs._setStatus(id, status));
}
