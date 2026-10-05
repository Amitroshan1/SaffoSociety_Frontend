import api from '@/services/api/axios';
import { residentUsesDummy } from '@/config/dataMode';
import { RESIDENT_ENDPOINTS as EP } from '@/modules/resident/constants/endpoints';
import { apiMessage, delay, fail, unwrap } from '@/modules/resident/services/core/http';
import { mapSlotCard, mapVehicle, mapVisitorParking } from '@/modules/resident/services/map';
import {
  listParking,
  listParkingLogs,
  listVehicles,
  listVisitorParking,
  listVisitorSlots,
  removeVehicle,
  requestVisitorParking,
  saveVehicle,
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

function vehicleBody(form) {
  return {
    vehicle_number: String(form.vehicleNumber || '').replace(/\s+/g, '').toUpperCase(),
    vehicle_type: form.vehicleType,
    make: form.make || null,
    model: form.model || null,
    color: form.color || null,
    is_primary: Boolean(form.primary),
  };
}

export async function getMyParking() {
  if (residentUsesDummy()) {
    await delay();
    return listParking();
  }
  const [slotRes, vehicleRes] = await Promise.all([
    api.get(EP.parking),
    api.get(EP.vehicles),
  ]);
  const vehicles = (Array.isArray(unwrap(vehicleRes)) ? unwrap(vehicleRes) : []).map(mapVehicle);
  const primary = vehicles.find((item) => item.primary) || vehicles[0];
  const slots = unwrap(slotRes);
  return (Array.isArray(slots) ? slots : []).map((row, index) => (
    mapSlotCard(row, index === 0 ? primary?.parkingCode : '')
  ));
}

export function getMyVehicles() {
  return run(listVehicles, () => api.get(EP.vehicles), 'Failed to load vehicles').then((rows) => (
    residentUsesDummy() || !Array.isArray(rows) ? rows : rows.map(mapVehicle)
  ));
}

export function saveMyVehicle(form, id) {
  return run(
    () => saveVehicle(form, id),
    () => (id ? api.patch(EP.vehicle(id), vehicleBody(form)) : api.post(EP.vehicles, vehicleBody(form))),
    'Could not save vehicle',
  ).then((row) => (residentUsesDummy() ? row : mapVehicle(row)));
}

export function deleteMyVehicle(id) {
  if (residentUsesDummy()) {
    return run(() => removeVehicle(id), () => Promise.resolve(), 'Could not remove vehicle');
  }
  return Promise.reject(fail('The server does not provide a way to remove a vehicle.', 405));
}

export function getGuestParking() {
  return run(listVisitorParking, () => api.get(EP.parkingHistory), 'Failed to load visitor parking').then((rows) => (
    residentUsesDummy() || !Array.isArray(rows) ? rows : rows.map(mapVisitorParking)
  ));
}

/** The backend assigns a visitor slot. It does not list visitor slots. */
export function getVisitorSlots() {
  if (residentUsesDummy()) return run(listVisitorSlots, () => Promise.resolve([]), 'Failed to load visitor slots');
  return Promise.resolve([]);
}

export function getParkingLogs() {
  return run(listParkingLogs, () => api.get(EP.parkingHistory), 'Failed to load parking activity').then((rows) => (
    residentUsesDummy() || !Array.isArray(rows) ? rows : rows.map(mapVisitorParking)
  ));
}

export function requestGuestParking(form) {
  return run(
    () => requestVisitorParking(form),
    () => api.post(EP.visitorParking, {
      vehicle_number: String(form.vehicleNumber || '').replace(/\s+/g, '').toUpperCase(),
      vehicle_type: form.vehicleType,
      purpose: form.purpose || null,
      notes: form.notes || null,
    }),
    'Visitor parking request failed',
  ).then((row) => (residentUsesDummy() ? row : mapVisitorParking(row)));
}
