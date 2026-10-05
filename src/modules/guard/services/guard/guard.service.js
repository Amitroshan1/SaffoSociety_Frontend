/**
 * Mock guard.service — same exports as Frontend, dummy data only.
 */
import api from '@/services/api/axios';
import { USE_DUMMY_DATA, accountUsesDummy, gateUsesDummy } from '@/config/dataMode';
import {
  DUMMY_CAB_ENTRIES,
  DUMMY_DASHBOARD,
  DUMMY_DELIVERIES,
  DUMMY_FLATS,
  DUMMY_NOTIFICATIONS,
  DUMMY_VISITORS,
} from '@/modules/guard/data/dummyData';
import { GUARD_PANEL_ENDPOINTS as EP } from '@/modules/guard/constants/panelEndpoints';
import { delay } from '@/modules/guard/services/core/mockHttp';
import {
  apiError as httpApiError,
  unwrapEnvelope,
  validatePhotoFile,
  toPhotoFile,
} from '@/modules/guard/services/core/http';

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

let visitors = clone(DUMMY_VISITORS);
let deliveries = clone(DUMMY_DELIVERIES).map((d) => ({
  ...d,
  courierName: d.courier,
  company: d.courier,
  phone: '9800099999',
  held: false,
  visitStatus: d.status === 'collected' ? 'checked_out' : 'waiting',
}));
let cabs = clone(DUMMY_CAB_ENTRIES);
let notifications = clone(DUMMY_NOTIFICATIONS);

export function apiError(err, fallback = 'Something went wrong') {
  return err?.response?.data?.message || err?.message || fallback;
}

export function mapPurposeToVisitorType(purpose) {
  const key = String(purpose || '').toLowerCase();
  if (key.includes('deliver')) return 'delivery';
  if (key.includes('cab') || key.includes('driver')) return 'driver';
  if (key.includes('tech') || key.includes('work')) return 'technician';
  if (key.includes('guest')) return 'guest';
  return 'other';
}

export function mapGuardVisitorToUiRow(row) {
  const status = String(row?.status || '').toLowerCase();
  let visitStatus = status;
  if (status === 'pending') visitStatus = 'waiting';
  else if (status === 'approved') visitStatus = 'checked_in';
  else if (status === 'exited') visitStatus = 'checked_out';
  else if (status === 'rejected') visitStatus = 'rejected';

  return {
    id: row.id,
    name: row.name || 'Visitor',
    phone: row.phone || '',
    flat: row.flat || '—',
    purpose: row.purpose || '—',
    persons: row.persons || 1,
    time: row.time || '—',
    wait: row.wait || '0m',
    duration: row.duration || '0m',
    by: row.by || '',
    vehicle: row.vehicle || '',
    visitStatus,
    isPreapproved: Boolean(row.preApproved),
    visitorType: mapPurposeToVisitorType(row.purpose),
    occupancyId: row.occupancyId || null,
    visitorId: row.visitorId || null,
    flatId: row.flatId || null,
    photoUrl: row.photoUrl || null,
    createdAt: row.createdAt,
    checkInTime: row.checkInTime,
    vehicleType: row.vehicleType || '',
    remarks: row.remarks || '',
    residentName: row.residentName || '',
    raw: row,
  };
}

export function isRegularVisitor(row) {
  const type = row.visitorType || mapPurposeToVisitorType(row.purpose);
  return !['delivery', 'courier', 'driver'].includes(type);
}

function initialsOf(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'G';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export const GUARD_PROFILE_EVENT = 'guard-profile-updated';

/** Contract profile. Header identity comes from here, not from the dashboard payload. */
let guardProfile = {
  id: 'g-001',
  userId: 'u-001',
  name: 'Ravi Kumar',
  email: 'guard@society.com',
  phone: '9876543210',
  designation: 'Security Guard',
  staffCode: 'GRD-1024',
  gateName: 'Main Gate',
  gateCode: 'MG-01',
  photoUrl: null,
  joiningDate: '2024-03-12',
  isActive: true,
};

function presentProfile(row) {
  if (!row) return null;
  return {
    ...row,
    initials: initialsOf(row.name),
    role: row.designation || 'Security Guard',
    assignedGate: row.gateName || null,
    employeeId: row.staffCode || null,
  };
}

function emitProfile() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(GUARD_PROFILE_EVENT));
  }
}

export async function getGuardProfile() {
  try {
    if (accountUsesDummy()) {
      await delay();
      if (!guardProfile) {
        const e = new Error('Guard profile not found');
        e.status = 404;
        throw e;
      }
      return presentProfile(guardProfile);
    }
    const res = await api.get(EP.profile);
    return presentProfile(unwrapEnvelope(res));
  } catch (err) {
    if (err?.status === 404) throw err;
    const wrapped = httpApiError(err, 'Failed to load profile');
    if (wrapped.status === 404 || err?.response?.status === 404) {
      wrapped.status = 404;
      wrapped.message = err?.response?.data?.message || 'Guard profile not found';
    }
    throw wrapped;
  }
}

export async function uploadGuardPhoto(file) {
  try {
    const photoFile = await toPhotoFile(file);
    const photoErr = validatePhotoFile(photoFile);
    if (photoErr) {
      const e = new Error(photoErr);
      e.status = 422;
      throw e;
    }
    if (accountUsesDummy()) {
      await delay();
      if (!guardProfile) {
        const e = new Error('Guard profile not found');
        e.status = 404;
        throw e;
      }
      guardProfile = { ...guardProfile, photoUrl: '/uploads/guard_photo/mock.jpg' };
      emitProfile();
      return presentProfile(guardProfile);
    }
    const fd = new FormData();
    fd.append('photo', photoFile);
    const res = await api.post(EP.profilePhoto, fd);
    const next = presentProfile(unwrapEnvelope(res));
    emitProfile();
    return next;
  } catch (err) {
    throw httpApiError(err, 'Photo upload failed');
  }
}

export async function removeGuardPhoto() {
  try {
    if (accountUsesDummy()) {
      await delay();
      if (!guardProfile) {
        const e = new Error('Guard profile not found');
        e.status = 404;
        throw e;
      }
      guardProfile = { ...guardProfile, photoUrl: null };
      emitProfile();
      return presentProfile(guardProfile);
    }
    const res = await api.delete(EP.profilePhoto);
    const next = presentProfile(unwrapEnvelope(res));
    emitProfile();
    return next;
  } catch (err) {
    throw httpApiError(err, 'Photo remove failed');
  }
}

const DASHBOARD_MOCK = {
  counts: {
    waitingApproval: 3,
    approvedAtGate: 0,
    insideNow: 3,
    sosActive: 1,
    moveOutReady: 1,
    parkingInUse: 2,
    bookingsToday: 2,
  },
  shift: {
    id: 'sh-today',
    shiftType: 'Morning',
    gateName: 'East Gate',
    startTime: '2026-09-27T06:00:00+05:30',
    endTime: '2026-09-27T14:00:00+05:30',
    status: 'in_progress',
    punchedIn: true,
  },
  waiting: [
    { type: 'visitor', id: 'w-1', name: 'Amit Shah', flatNo: 'A-302', purpose: 'Guest', createdAt: '2026-09-27T10:18:00+05:30' },
    { type: 'delivery', id: 'w-2', name: 'Amazon', flatNo: 'A-402', purpose: 'Parcel', createdAt: '2026-09-27T10:12:00+05:30' },
    { type: 'cab', id: 'w-3', name: 'Ajay Verma', flatNo: 'B-114', purpose: 'Pickup', createdAt: '2026-09-27T10:05:00+05:30' },
  ],
  inside: [
    { type: 'visitor', id: 'i-1', name: 'Priya Mehta', flatNo: 'A-101', checkInTime: '2026-09-27T09:40:00+05:30' },
    { type: 'cab', id: 'i-3', name: 'Vikas More', flatNo: 'B-501', checkInTime: '2026-09-27T09:05:00+05:30' },
    { type: 'staff', id: 'i-2', name: 'Sunita Devi', flatNo: 'Tower A', checkInTime: '2026-09-27T07:10:00+05:30' },
  ],
  moveOutReadyItems: [
    { id: 'mo-3', residentName: 'Anita Desai', flatNo: 'A1-102', moveOutDate: '2026-09-12' },
  ],
  bookings: [
    { id: 'bk-2', facility: 'Tennis Court', flatNo: 'C-501', startTime: '07:00', endTime: '08:00' },
    { id: 'bk-1', facility: 'Clubhouse', flatNo: 'A-101', startTime: '16:00', endTime: '18:00' },
  ],
  sos: [
    { id: 'sos-1', residentName: 'Ananya Rao', flatNo: 'B-804', message: 'Medical help needed', createdAt: '2026-09-27T10:01:00+05:30' },
  ],
};

/**
 * GET /guard/dashboard — no query params. Does not include guard identity.
 * Pass `{ live: true }` to hit the backend even while other Guard screens stay on dummy data.
 */
export async function getDashboard(options = {}) {
  try {
    if (USE_DUMMY_DATA && options.live !== true) {
      await delay();
      return JSON.parse(JSON.stringify(DASHBOARD_MOCK));
    }
    const res = await api.get(EP.dashboard);
    return unwrapEnvelope(res);
  } catch (err) {
    throw httpApiError(err, 'Failed to load dashboard');
  }
}

export async function searchGuardFlats(q = '', limit = 20) {
  if (!gateUsesDummy()) return [];
  await delay();
  const needle = String(q).toLowerCase();
  return clone(DUMMY_FLATS)
    .filter(
      (f) =>
        !needle ||
        f.label.toLowerCase().includes(needle) ||
        f.resident.toLowerCase().includes(needle),
    )
    .slice(0, limit)
    .map((f) => ({
      id: f.id,
      flatId: f.id,
      flat_number: f.label,
      flatNo: f.label,
      occupancyId: `occ-${f.id}`,
      resident: f.resident,
    }));
}

export async function getFlatContact(flatId) {
  await delay();
  const flat = DUMMY_FLATS.find((f) => f.id === flatId) || DUMMY_FLATS[0];
  return { name: flat.resident, phone: '9876500000', flat: flat.label };
}

export async function resolveFlatForWalkIn(flatNo) {
  const flats = await searchGuardFlats(flatNo, 50);
  const needle = String(flatNo || '').toLowerCase().replace(/\s+/g, '');
  const hit = flats.find((f) => String(f.flat_number).toLowerCase().replace(/\s+/g, '') === needle) || flats[0];
  if (!hit) return null;
  return { flatId: hit.flatId, occupancyId: hit.occupancyId, flatLabel: hit.flat_number };
}

export async function getDashboardBundle() {
  await delay();
  const pending = visitors.filter((v) => v.status === 'pending').map(mapGuardVisitorToUiRow);
  const inside = visitors.filter((v) => v.status === 'approved').map(mapGuardVisitorToUiRow).filter(isRegularVisitor);
  const rejected = visitors.filter((v) => v.status === 'rejected').map(mapGuardVisitorToUiRow).filter(isRegularVisitor);
  const deliveryRows = deliveries
    .filter((d) => d.status === 'pending')
    .map((d) => ({
      id: d.id,
      person: d.courierName || d.courier,
      courier: d.courier,
      company: d.company || d.courier,
      flat: d.flat,
      time: d.time,
    }));
  const staff = (DUMMY_DASHBOARD.staffInside || []).map((s) => ({
    id: s.id,
    name: s.name,
    role: s.role,
    flat: s.flat,
    since: s.inAt,
  }));

  return {
    stats: {
      visitorsInsideCount: inside.length,
      todaysVisitorCount: DUMMY_DASHBOARD.stats.todaysVisitorCount,
      pendingApprovalsCount: pending.length,
      pendingDeliveriesCount: deliveryRows.length,
      staffInsideCount: staff.length,
      activeSosCount: 1,
    },
    pending,
    approved: inside,
    rejected,
    inside,
    deliveries: deliveryRows,
    staff,
    activity: clone(DUMMY_DASHBOARD.activity).map((a) => ({
      id: a.id,
      message: a.text,
      text: a.text,
      time: a.time,
      type: a.type,
    })),
    sosAlerts: [], // SOS banner driven by test Activate/Resolve on /guard/sos only
  };
}

export async function listGuardVisitsByTab() {
  await delay();
  const mapRows = (status) =>
    visitors.filter((v) => v.status === status).map(mapGuardVisitorToUiRow).filter(isRegularVisitor);
  return {
    pending: mapRows('pending'),
    approved: mapRows('approved'),
    rejected: mapRows('rejected'),
  };
}

export async function listDeliveryBuckets() {
  await delay();
  const atGate = deliveries.filter((d) => d.status === 'pending' && !d.held);
  const held = deliveries.filter((d) => d.held);
  const completed = deliveries.filter((d) => d.status === 'collected');
  return { atGate, held, completed };
}

export async function listQuickEntryByMode(mode = 'delivery') {
  if (mode !== 'delivery') {
    return { pending: [], active: [], completed: [], rejected: [] };
  }
  const buckets = await listDeliveryBuckets();
  const toRow = (card, extra = {}) => ({
    id: card.id,
    name: card.courierName || card.courier || 'Courier',
    phone: card.phone || '',
    flat: card.flat || '—',
    purpose: card.company || 'Delivery',
    company: card.company || 'Delivery',
    persons: 1,
    time: card.time || '—',
    wait: card.time || '0m',
    duration: '—',
    by: card.held ? 'Guard' : '',
    vehicle: '',
    visitStatus: card.visitStatus || 'waiting',
    raw: card,
    ...extra,
  });
  return {
    pending: buckets.atGate.map((c) => toRow(c)),
    active: [],
    completed: buckets.completed.map((c) => toRow(c, { visitStatus: 'checked_out' })),
    rejected: buckets.held.map((c) => toRow(c, { visitStatus: 'rejected', by: 'Guard', held: true })),
  };
}

export async function logVisitor(form) {
  await delay();
  const row = {
    id: `v-${Date.now()}`,
    name: form.name,
    phone: form.phone,
    flat: form.flat,
    purpose: form.purpose || 'Guest',
    persons: Number(form.persons) || 1,
    vehicle: form.vehicle || '',
    status: 'pending',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: new Date().toISOString(),
  };
  visitors = [row, ...visitors];
  return mapGuardVisitorToUiRow(row);
}

export async function tryGuardApprove(visitRow) {
  await delay();
  visitors = visitors.map((v) => (v.id === visitRow.id ? { ...v, status: 'approved' } : v));
  return mapGuardVisitorToUiRow(visitors.find((v) => v.id === visitRow.id));
}

export async function tryGuardDeny(visitRow) {
  await delay();
  visitors = visitors.map((v) => (v.id === visitRow.id ? { ...v, status: 'rejected' } : v));
  return mapGuardVisitorToUiRow(visitors.find((v) => v.id === visitRow.id));
}

export async function checkInVisitor(visitId) {
  return tryGuardApprove({ id: visitId });
}

export async function markVisitorExit(visitId) {
  await delay();
  visitors = visitors.map((v) => (v.id === visitId ? { ...v, status: 'exited' } : v));
  return mapGuardVisitorToUiRow(visitors.find((v) => v.id === visitId));
}

export async function readdRejectedVisit(visitRow) {
  await delay();
  visitors = visitors.map((v) => (v.id === visitRow.id ? { ...v, status: 'pending' } : v));
  return mapGuardVisitorToUiRow(visitors.find((v) => v.id === visitRow.id));
}

export async function verifyVisitorOTP() {
  await delay();
  return { ok: true };
}

export async function logGuardCall() {
  await delay();
  return { ok: true };
}

export async function searchRecentWalkIns({ q = '' } = {}) {
  await delay();
  const needle = String(q).toLowerCase();
  return visitors
    .filter(
      (v) =>
        !needle ||
        v.name.toLowerCase().includes(needle) ||
        v.phone.includes(needle) ||
        v.flat.toLowerCase().includes(needle),
    )
    .slice(0, 8)
    .map(mapGuardVisitorToUiRow);
}

export async function getUnreadNotificationCount() {
  if (accountUsesDummy()) {
    await delay();
    return notifications.filter((n) => !n.read).length;
  }
  try {
    const res = await api.get('/resident/notifications/unread-count');
    const body = res?.data;
    return Number(body?.count ?? body?.data?.count ?? 0);
  } catch {
    return 0;
  }
}

export async function getCollectedDeliveries() {
  await delay();
  return deliveries.filter((d) => d.status === 'collected');
}

export async function markDeliveryCollected(deliveryId) {
  await delay();
  deliveries = deliveries.map((d) =>
    d.id === deliveryId ? { ...d, status: 'collected', visitStatus: 'checked_out' } : d,
  );
  return deliveries.find((d) => d.id === deliveryId);
}

export async function markResidentReceived(deliveryId) {
  return markDeliveryCollected(deliveryId);
}

export async function holdDeliveryAtGate(deliveryId) {
  await delay();
  deliveries = deliveries.map((d) =>
    d.id === deliveryId ? { ...d, held: true, visitStatus: 'rejected' } : d,
  );
  return deliveries.find((d) => d.id === deliveryId);
}

export async function markHeldParcelCollected(deliveryId) {
  return markDeliveryCollected(deliveryId);
}

export async function callResidentForDelivery() {
  await delay();
  return { ok: true };
}

export async function logDelivery(form) {
  await delay();
  const row = {
    id: `d-${Date.now()}`,
    courier: form.company || form.courier || 'Courier',
    courierName: form.name || 'Courier',
    company: form.company || 'Delivery',
    flat: form.flat,
    phone: form.phone || '',
    status: 'pending',
    held: false,
    visitStatus: 'waiting',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  deliveries = [row, ...deliveries];
  return row;
}

export async function listCabEntries() {
  await delay();
  return {
    pending: cabs.filter((c) => c.status === 'pending'),
    approved: cabs.filter((c) => c.status === 'approved'),
    exited: cabs.filter((c) => c.status === 'exited'),
    all: clone(cabs),
  };
}

export async function logCabEntry(form) {
  await delay();
  const row = {
    id: `c-${Date.now()}`,
    driver: form.name || form.driver,
    vehicle: form.vehicle,
    company: form.company || 'Cab',
    flat: form.flat,
    tripType: form.tripType || 'Pickup',
    status: 'pending',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  cabs = [row, ...cabs];
  return row;
}
