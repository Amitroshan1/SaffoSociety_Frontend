import api from '@/services/api/axios';
import { residentUsesDummy } from '@/config/dataMode';
import { RESIDENT_ENDPOINTS as EP } from '@/modules/resident/constants/endpoints';
import { apiMessage, delay, fail, unwrap } from '@/modules/resident/services/core/http';
import { mapFlat, mapMember, mapProfile, mapVisit } from '@/modules/resident/services/map';
import { readSession } from '@/auth/session';
import {
  actOnVisit,
  createInvite,
  gateDashboard,
  listVisits,
  storeFlat,
  storeHousehold,
  storeProfile,
  updateProfile,
  changePassword,
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

function sessionEmail() {
  return readSession()?.user?.email || '';
}

function mapDashboard(data) {
  const flatLabel = data?.flat || '';
  return {
    resident: { name: data?.welcome || '', flatNo: flatLabel },
    pendingAtGate: (data?.pending_at_gate || []).map(mapVisit),
    upcomingInvites: (data?.upcoming_invites || []).map(mapVisit),
    activeSos: (data?.active_sos || []).map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status === 'open' ? 'active' : item.status,
      priority: item.priority,
      flatNo: flatLabel,
      createdAt: null,
    })),
    todaysBookings: (data?.todays_bookings || []).map((item) => ({
      id: item.id,
      code: item.amenity_name || `BK-${item.id}`,
      amenity: item.amenity_name || '',
      startTime: item.start_time || '',
      endTime: item.end_time || '',
      status: item.status === 'booked' ? 'confirmed' : item.status,
    })),
    parkingCode: data?.primary_parking_code || null,
  };
}

export async function getGateDashboard() {
  const data = await run(gateDashboard, () => api.get(EP.gateDashboard), 'Failed to load dashboard');
  if (residentUsesDummy() || !data) return data;
  return mapDashboard(data);
}

export function getMyFlat() {
  return run(storeFlat, () => api.get(EP.flat), 'Failed to load flat').then((row) => (
    residentUsesDummy() ? row : mapFlat(row)
  ));
}

export function getHousehold() {
  return run(storeHousehold, () => api.get(EP.household), 'Failed to load household').then((rows) => (
    residentUsesDummy() || !Array.isArray(rows) ? rows : rows.map(mapMember)
  ));
}

export function getMyProfile() {
  return run(storeProfile, () => api.get(EP.profile), 'Failed to load profile').then((row) => (
    residentUsesDummy() ? row : mapProfile(row, sessionEmail())
  ));
}

export function saveMyProfile(patch) {
  return run(
    () => updateProfile(patch),
    () => api.patch(EP.profile, {
      phone: String(patch.phone || '').replace(/\D/g, '').slice(0, 10),
      emergency_name: patch.emergencyName || null,
      emergency_phone: patch.emergencyPhone ? String(patch.emergencyPhone).replace(/\D/g, '').slice(0, 10) : null,
    }),
    'Failed to save profile',
  ).then((row) => (residentUsesDummy() ? row : mapProfile(row, sessionEmail())));
}

export function savePassword(body) {
  return run(
    () => changePassword(body),
    () => api.patch(EP.password, {
      current_password: body.currentPassword,
      new_password: body.newPassword,
    }),
    'Failed to change password',
  );
}

export async function listMyVisits() {
  const rows = await run(listVisits, () => api.get(EP.visitors), 'Failed to load visitors');
  if (residentUsesDummy() || !Array.isArray(rows)) return rows;
  return rows.map(mapVisit);
}

export function submitVisitorApproval(body) {
  return run(
    () => actOnVisit(body.visitId, body.action),
    () => api.post(EP.approval, {
      visit_id: body.visitId,
      action: body.action,
      notes: body.notes || null,
    }),
    'Could not update this visit',
  ).then((row) => (residentUsesDummy() ? row : mapVisit(row)));
}

export function sendVisitorInvite(form) {
  return run(
    () => createInvite(form),
    () => api.post(EP.invite, {
      name: String(form.name || '').trim(),
      phone: String(form.phone || '').replace(/\D/g, ''),
      visitor_type: form.type || 'guest',
      purpose: form.purpose || null,
      expected_now: false,
    }),
    'Invite failed',
  ).then((row) => (residentUsesDummy() ? row : mapVisit(row)));
}
