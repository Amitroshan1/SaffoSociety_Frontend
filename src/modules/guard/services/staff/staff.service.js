/**
 * Staff (domestic) API — backend PDF contract.
 * NOT guard duty schedule. No create-staff endpoint.
 */
import api from '@/services/api/axios';
import { gateUsesDummy } from '@/config/dataMode';
import { GUARD_GATE_ENDPOINTS as EP } from '@/modules/guard/constants/gateEndpoints';
import { delay } from '@/modules/guard/services/core/mockHttp';
import { mockStaff } from '@/modules/guard/services/gate/gateMockStore';
import { apiError, unwrapEnvelope } from '@/modules/guard/services/core/http';

function mapStaff(row) {
  if (!row) return null;
  return {
    ...row,
    building: row.building || row.buildingNo || '',
    wing: row.wing || row.wingNo || '',
    flat: row.flat || row.flatNo || '',
    owner: row.owner || row.ownerName || '',
    attendanceStatus: row.attendanceStatus || row.status || 'not_marked',
    aadhaarMasked: row.aadhaarMasked || row.aadhaar || '',
    checkInTime: row.checkInTime || row.checkIn || null,
    checkOutTime: row.checkOutTime || row.checkOut || null,
  };
}

function mapList(data) {
  const items = (data?.items || data?.staff || []).map(mapStaff);
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
    counts: data?.counts || {
      all: items.length,
      checkedIn: items.filter((s) => s.attendanceStatus === 'checked_in').length,
      checkedOut: items.filter((s) => s.attendanceStatus === 'checked_out').length,
    },
  };
}

/**
 * @param {object} params
 * status: 'all' | 'checked_in' | 'checked_out'  (never not_marked)
 */
export async function getStaff(params = {}, options = {}) {
  try {
    const clean = { ...params };
    if (clean.status === 'not_marked') delete clean.status;

    if (gateUsesDummy() && options.live !== true) {
      await delay();
      const data = mockStaff.list(clean);
      return {
        items: data.items.map(mapStaff),
        pagination: data.pagination,
        counts: data.counts,
      };
    }
    const res = await api.get(EP.staff, { params: clean });
    return mapList(unwrapEnvelope(res));
  } catch (err) {
    throw apiError(err, 'Failed to load staff');
  }
}

export async function checkInStaff(id) {
  try {
    if (gateUsesDummy()) {
      await delay();
      return mapStaff(mockStaff.entry(id));
    }
    const res = await api.post(EP.staffEntry(id));
    return mapStaff(unwrapEnvelope(res));
  } catch (err) {
    throw apiError(err, 'Staff check-in failed');
  }
}

export async function checkOutStaff(id) {
  try {
    if (gateUsesDummy()) {
      await delay();
      return mapStaff(mockStaff.exit(id));
    }
    const res = await api.post(EP.staffExit(id));
    return mapStaff(unwrapEnvelope(res));
  } catch (err) {
    throw apiError(err, 'Staff check-out failed');
  }
}

/** Used by Schedule/profile shims — not part of domestic Staff gate PDF */
export async function getMyStaff() {
  const { ok } = await import('@/modules/guard/services/core/mockHttp');
  const { DUMMY_GUARD_PROFILE } = await import('@/modules/guard/data/dummyData');
  return ok({
    staff: {
      id: 'staff-me',
      code: DUMMY_GUARD_PROFILE.employeeId,
      name: DUMMY_GUARD_PROFILE.name,
      assignedGateId: 'gate-1',
      assignedGateName: DUMMY_GUARD_PROFILE.gate,
      shiftStart: '06:00',
      shiftEnd: '14:00',
    },
  });
}

/** @deprecated — use getStaff / checkInStaff / checkOutStaff */
export const listStaff = getStaff;
export const createStaff = async () => {
  throw new Error('Create staff is not supported by the Guard Staff API');
};
export const updateStaff = async () => {
  throw new Error('updateStaff is not supported');
};
export const deactivateStaff = async () => {
  throw new Error('deactivateStaff is not supported');
};
export const activateStaff = async () => {
  throw new Error('activateStaff is not supported');
};
export const getStaff_legacy = getStaff;
