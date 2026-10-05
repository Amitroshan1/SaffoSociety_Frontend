/**
 * Delivery API — backend PDF contract.
 */
import api from '@/services/api/axios';
import { gateUsesDummy } from '@/config/dataMode';
import { GUARD_GATE_ENDPOINTS as EP } from '@/modules/guard/constants/gateEndpoints';
import { delay } from '@/modules/guard/services/core/mockHttp';
import { mockDeliveries } from '@/modules/guard/services/gate/gateMockStore';
import {
  apiError,
  mediaUrl,
  normalizePhone,
  buildPagination,
  gateFlatLabel,
  requireGateAddress,
  splitStatuses,
  toPhotoFile,
  unwrapEnvelope,
  validatePhotoFile,
} from '@/modules/guard/services/core/http';

function displayPhoto(url) {
  if (!url) return null;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  return mediaUrl(url);
}

function mapDelivery(row) {
  if (!row) return null;
  const handover = row.handover
    ? { ...row.handover, photoDisplayUrl: displayPhoto(row.handover.photoUrl) }
    : row.handover;
  return {
    ...row,
    name: row.name || row.courierName,
    flat: row.flat || gateFlatLabel(row),
    handover,
    photoDisplayUrl: displayPhoto(row.photoUrl),
  };
}

function mapList(data) {
  const items = (data?.items || data?.deliveries || []).map(mapDelivery);
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

export async function getDeliveries(params = {}, options = {}) {
  try {
    if (gateUsesDummy() && options.live !== true) {
      await delay();
      const data = mockDeliveries.list(params);
      return { items: data.items.map(mapDelivery), pagination: data.pagination };
    }
    const statuses = splitStatuses(params.status);
    const page = Number(params.page || 1);
    const pageSize = Number(params.pageSize || 20);
    if (statuses.length > 1) {
      const lists = await Promise.all(
        statuses.map(async (status) => {
          const res = await api.get(EP.deliveries, {
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
    const res = await api.get(EP.deliveries, { params });
    return mapList(unwrapEnvelope(res));
  } catch (err) {
    throw apiError(err, 'Failed to load deliveries');
  }
}

export async function getDelivery(id) {
  try {
    if (gateUsesDummy()) {
      await delay();
      const row = mockDeliveries.get(id);
      if (!row) {
        const e = new Error('Delivery not found');
        e.status = 404;
        throw e;
      }
      return mapDelivery(row);
    }
    const res = await api.get(EP.deliveryById(id));
    return mapDelivery(unwrapEnvelope(res));
  } catch (err) {
    throw apiError(err, 'Failed to load delivery');
  }
}

export async function createDelivery(fields) {
  try {
    const phone = normalizePhone(fields.phone);
    if (phone.length !== 10) {
      const e = new Error('Enter a valid 10-digit phone number');
      e.status = 422;
      throw e;
    }
    const company = String(fields.company || '').trim().slice(0, 50);
    if (!company) {
      const e = new Error('Company is required');
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

    if (gateUsesDummy()) {
      await delay();
      return mapDelivery(
        mockDeliveries.create({
          courierName: fields.courierName || fields.name,
          phone,
          company,
          flat: fields.flat,
          trackingId: fields.trackingId,
          parcelNote: fields.parcelNote || fields.note,
          photoUrl: photoFile ? '/uploads/delivery_photo/mock.jpg' : null,
        }),
      );
    }

    const address = requireGateAddress(fields);
    const fd = new FormData();
    fd.append('courierName', fields.courierName || fields.name);
    fd.append('phone', phone);
    fd.append('company', company);
    fd.append('building', address.building);
    fd.append('wing', address.wing);
    fd.append('flat', address.flat);
    if (fields.trackingId) fd.append('trackingId', fields.trackingId);
    if (fields.parcelNote || fields.note) fd.append('parcelNote', fields.parcelNote || fields.note);
    if (photoFile) fd.append('photo', photoFile);

    const res = await api.post(EP.deliveries, fd);
    return mapDelivery(unwrapEnvelope(res));
  } catch (err) {
    throw apiError(err, 'Failed to create delivery');
  }
}

export async function checkInDelivery(id) {
  try {
    if (gateUsesDummy()) {
      await delay();
      return mapDelivery(mockDeliveries.checkIn(id));
    }
    const res = await api.patch(EP.deliveryCheckIn(id));
    return mapDelivery(unwrapEnvelope(res));
  } catch (err) {
    throw apiError(err, 'Check-in failed');
  }
}

export async function exitDelivery(id) {
  try {
    if (gateUsesDummy()) {
      await delay();
      return mapDelivery(mockDeliveries.exit(id));
    }
    const res = await api.patch(EP.deliveryExit(id));
    return mapDelivery(unwrapEnvelope(res));
  } catch (err) {
    throw apiError(err, 'Exit failed');
  }
}

/** Resident said "keep it at the gate, I'll collect it". */
export async function holdDeliveryAtGate(id) {
  try {
    if (gateUsesDummy()) {
      await delay();
      return mapDelivery(mockDeliveries.hold(id));
    }
    const error = new Error('The server does not provide a hold action for deliveries.');
    error.status = 404;
    throw error;
  } catch (err) {
    throw apiError(err, 'Could not keep delivery at gate');
  }
}

/** Resident picked up a parcel that was kept at the gate. `handover` is the security record. */
export async function collectDeliveryAtGate(id, handover = {}) {
  try {
    const photoFile = await toPhotoFile(handover.photo);
    if (photoFile) {
      const photoErr = validatePhotoFile(photoFile);
      if (photoErr) {
        const e = new Error(photoErr);
        e.status = 422;
        throw e;
      }
    }

    if (gateUsesDummy()) {
      await delay();
      return mapDelivery(mockDeliveries.collect(id, { ...handover, photoUrl: handover.photo || null }));
    }

    const error = new Error('The server does not provide a collect action for deliveries.');
    error.status = 404;
    throw error;
  } catch (err) {
    throw apiError(err, 'Could not mark parcel as collected');
  }
}

export async function __mockSetDeliveryStatus(id, status) {
  if (!gateUsesDummy()) throw new Error('Mock-only');
  await delay(100);
  return mapDelivery(mockDeliveries._setStatus(id, status));
}
