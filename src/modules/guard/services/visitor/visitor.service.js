/**
 * Visitor API — backend PDF contract.
 * Dummy when gate screens are in mock mode; otherwise HTTP to /guard/visitors*
 */
import api from '@/services/api/axios';
import { gateUsesDummy } from '@/config/dataMode';
import { GUARD_GATE_ENDPOINTS as EP } from '@/modules/guard/constants/gateEndpoints';
import { delay } from '@/modules/guard/services/core/mockHttp';
import { mockVisitors } from '@/modules/guard/services/gate/gateMockStore';
import {
  apiError,
  mediaUrl,
  normalizePhone,
  toPhotoFile,
  gateFlatLabel,
  requireGateAddress,
  unwrapEnvelope,
  validatePhotoFile,
} from '@/modules/guard/services/core/http';

function mapVisitor(row) {
  if (!row) return null;
  return {
    ...row,
    flat: row.flat || gateFlatLabel(row),
    persons: row.persons ?? row.personCount ?? 1,
    vehicle: row.vehicle || row.vehicleNumber || '',
    photoDisplayUrl: mediaUrl(row.photoUrl),
  };
}

function mapList(data) {
  const items = (data?.items || data?.visitors || []).map(mapVisitor);
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

export async function getVisitors(params = {}, options = {}) {
  try {
    if (gateUsesDummy() && options.live !== true) {
      await delay();
      const data = mockVisitors.list(params);
      return { items: data.items.map(mapVisitor), pagination: data.pagination };
    }
    const res = await api.get(EP.visitors, { params });
    return mapList(unwrapEnvelope(res));
  } catch (err) {
    throw apiError(err, 'Failed to load visitors');
  }
}

export async function getVisitor(id) {
  try {
    if (gateUsesDummy()) {
      await delay();
      const row = mockVisitors.get(id);
      if (!row) {
        const e = new Error('Visitor not found');
        e.status = 404;
        throw e;
      }
      return mapVisitor(row);
    }
    const res = await api.get(EP.visitorById(id));
    return mapVisitor(unwrapEnvelope(res));
  } catch (err) {
    throw apiError(err, 'Failed to load visitor');
  }
}

export async function getRecentVisitors(params = {}) {
  try {
    if (gateUsesDummy()) {
      await delay();
      return mockVisitors.recent(params).map(mapVisitor);
    }
    const res = await api.get(EP.visitorRecent, { params });
    const data = unwrapEnvelope(res);
    return (Array.isArray(data) ? data : data?.items || []).map(mapVisitor);
  } catch (err) {
    throw apiError(err, 'Failed to load recent visitors');
  }
}

/**
 * Create visitor — FormData when photo present.
 * fields: name, phone, purpose, flat, personCount?, vehicleNumber?, vehicleType?,
 *         notifyResident?, preApproved?, remarks?, photo?
 */
export async function createVisitor(fields) {
  try {
    const phone = normalizePhone(fields.phone);
    if (phone.length !== 10) {
      const e = new Error('Enter a valid 10-digit phone number');
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
      const row = mockVisitors.create({
        name: fields.name,
        phone,
        purpose: fields.purpose,
        flat: fields.flat,
        personCount: fields.personCount,
        vehicleNumber: fields.vehicleNumber,
        vehicleType: fields.vehicleType,
        notifyResident: fields.notifyResident,
        preApproved: fields.preApproved,
        remarks: fields.remarks,
        photoUrl: photoFile ? '/uploads/visitor_photo/mock.jpg' : null,
      });
      return mapVisitor(row);
    }

    const address = requireGateAddress(fields);
    const fd = new FormData();
    fd.append('name', fields.name);
    fd.append('phone', phone);
    fd.append('purpose', fields.purpose);
    fd.append('building', address.building);
    fd.append('flat', address.flat);
    if (address.wing && address.wing !== address.building) fd.append('wing', address.wing);
    if (fields.personCount != null) fd.append('personCount', String(fields.personCount));
    if (fields.vehicleNumber) fd.append('vehicleNumber', fields.vehicleNumber);
    if (fields.vehicleType) fd.append('vehicleType', fields.vehicleType);
    if (fields.notifyResident != null) fd.append('notifyResident', String(Boolean(fields.notifyResident)));
    if (fields.preApproved != null) fd.append('preApproved', String(Boolean(fields.preApproved)));
    if (fields.remarks) fd.append('remarks', fields.remarks);
    if (photoFile) fd.append('photo', photoFile);

    const res = await api.post(EP.visitors, fd);
    return mapVisitor(unwrapEnvelope(res));
  } catch (err) {
    throw apiError(err, 'Failed to create visitor');
  }
}

export async function checkInVisitor(id) {
  try {
    if (gateUsesDummy()) {
      await delay();
      return mapVisitor(mockVisitors.checkIn(id));
    }
    const res = await api.patch(EP.visitorCheckIn(id));
    return mapVisitor(unwrapEnvelope(res));
  } catch (err) {
    throw apiError(err, 'Check-in failed');
  }
}

export async function exitVisitor(id, options = {}) {
  try {
    if (gateUsesDummy() && options.live !== true) {
      await delay();
      return mapVisitor(mockVisitors.exit(id));
    }
    const res = await api.patch(EP.visitorExit(id));
    return mapVisitor(unwrapEnvelope(res));
  } catch (err) {
    throw apiError(err, 'Exit failed');
  }
}

/** Dev helper: simulate resident approve/reject while backend is absent */
export async function __mockSetVisitorStatus(id, status) {
  if (!gateUsesDummy()) throw new Error('Mock-only');
  await delay(100);
  return mapVisitor(mockVisitors._setStatus(id, status));
}
