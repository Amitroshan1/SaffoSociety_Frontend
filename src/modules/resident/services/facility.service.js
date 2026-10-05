import api from '@/services/api/axios';
import { residentUsesDummy } from '@/config/dataMode';
import { RESIDENT_ENDPOINTS as EP } from '@/modules/resident/constants/endpoints';
import { apiMessage, delay, fail, unwrap } from '@/modules/resident/services/core/http';
import { mapAmenity, mapBooking, mapSlot } from '@/modules/resident/services/map';
import {
  cancelBooking,
  createBooking,
  getFacility,
  listBookings,
  listFacilities,
} from '@/modules/resident/data/residentStore';

async function run(dummy, request, fallback) {
  try {
    if (residentUsesDummy()) {
      await delay();
      return dummy();
    }
    return unwrap(await request());
  } catch (err) {
    throw fail(apiMessage(err, fallback), err?.status || err?.response?.status);
  }
}

export async function listBookableFacilities() {
  const rows = await run(listFacilities, () => api.get(EP.facilities), 'Failed to load facilities');
  if (residentUsesDummy() || !Array.isArray(rows)) return rows;
  return rows.map(mapAmenity);
}

export async function getBookableFacility(id, day) {
  if (residentUsesDummy()) {
    await delay();
    return getFacility(id);
  }
  const [listRes, slotRes] = await Promise.all([
    api.get(EP.facilities),
    api.get(EP.facilitySlots(id), { params: { day } }),
  ]);
  const amenities = unwrap(listRes);
  const amenity = (Array.isArray(amenities) ? amenities : []).find((row) => String(row.id) === String(id));
  if (!amenity) throw fail('Facility not found', 404);
  const slots = unwrap(slotRes);
  return {
    ...mapAmenity(amenity),
    slots: (Array.isArray(slots) ? slots : []).map(mapSlot).filter((slot) => !slot.isBooked),
  };
}

export function bookFacility(form) {
  return run(
    () => createBooking(form),
    () => {
      const [start_time, end_time] = String(form.slotId || '').split('|');
      return api.post(EP.bookings, {
        amenity_id: Number(form.facilityId),
        booking_date: form.date,
        start_time,
        end_time,
        guest_count: Math.max(1, Number(form.guests) || 1),
        purpose: form.purpose || null,
      });
    },
    'Booking failed',
  ).then((row) => (residentUsesDummy() ? row : mapBooking(row)));
}

export function listMyBookings() {
  return run(listBookings, () => api.get(EP.bookings), 'Failed to load bookings').then((rows) => (
    residentUsesDummy() || !Array.isArray(rows) ? rows : rows.map(mapBooking)
  ));
}

export function cancelMyBooking(id) {
  return run(
    () => cancelBooking(id),
    () => api.post(EP.bookingCancel(id), { reason: null }),
    'Could not cancel booking',
  ).then((row) => (residentUsesDummy() ? row : mapBooking(row)));
}
