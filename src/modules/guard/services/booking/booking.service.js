/**
 * Booking API — Guard PDF (READ-ONLY).
 * Status: approved. No create/approve/check-in/check-out.
 */
import api from '@/services/api/axios';
import { accountUsesDummy } from '@/config/dataMode';
import { GUARD_OPS_ENDPOINTS as EP } from '@/modules/guard/constants/opsEndpoints';
import { delay } from '@/modules/guard/services/core/mockHttp';
import { bookingDummyStore } from '@/modules/guard/services/booking/bookingDummyStore';
import {
  apiError,
  emptyPagination,
  unwrapEnvelope,
} from '@/modules/guard/services/core/http';

export const BOOKING_STATUS = {
  APPROVED: 'approved',
};

export const BOOKING_STATUS_COLORS = {
  approved: '#059669',
};

function mapBooking(row) {
  if (!row) return null;
  return {
    ...row,
    // UI aliases (same values)
    flatNumber: row.flatNo || row.flatNumber,
    amenityName: row.facility || row.amenityName,
    status: row.status || 'approved',
  };
}

function mapList(data) {
  const items = (data?.items || data?.bookings || []).map(mapBooking);
  return {
    items,
    pagination: data?.pagination || {
      ...emptyPagination(),
      pageSize: items.length,
      total: items.length,
      totalPages: 1,
    },
    counts: data?.counts || {
      today: 0,
      upcoming: 0,
      history: 0,
    },
  };
}

/**
 * GET /guard/bookings
 * params: view (today|upcoming|history|date), date, search, page, pageSize, sortBy, sortOrder
 */
export async function getBookings(params = {}) {
  try {
    if (accountUsesDummy()) {
      await delay();
      const data = bookingDummyStore.list(params);
      return {
        items: data.items.map(mapBooking),
        pagination: data.pagination,
        counts: data.counts,
      };
    }
    const res = await api.get(EP.bookings, { params });
    return mapList(unwrapEnvelope(res));
  } catch (err) {
    throw apiError(err, 'Failed to load bookings');
  }
}

export async function getBooking(id) {
  try {
    if (accountUsesDummy()) {
      await delay();
      const row = bookingDummyStore.get(id);
      if (!row) {
        const e = new Error('Booking not found');
        e.status = 404;
        throw e;
      }
      return mapBooking(row);
    }
    const res = await api.get(EP.bookingById(id));
    return mapBooking(unwrapEnvelope(res));
  } catch (err) {
    throw apiError(err, 'Failed to load booking');
  }
}
