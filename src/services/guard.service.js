// Guard panel API helpers — wraps existing backend routes (no mock data).
// Features without a guard-accessible backend stay as explicit stubs that throw.

import api from './api';
import { listOccupancies } from './occupancy.service';
import { getMyStaff } from './staff.service';
import {
  checkInVisit,
  checkOutVisit,
  createVisit,
  listVisits,
  approveVisit,
  rejectVisit,
} from './visit.service';
import { createVisitor, listVisitors } from './visitor.service';
import { listGuardNotifications } from './notification.service';

function unwrap(res) {
  return res?.data?.data;
}

function apiError(err, fallback) {
  return err?.response?.data?.message || err?.message || fallback;
}

function normalizeFlat(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-');
}

function formatTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
}

function minutesBetween(fromIso, to = Date.now()) {
  if (!fromIso) return 0;
  const ms = to - new Date(fromIso).getTime();
  return Math.max(0, Math.floor(ms / 60000));
}

function formatWait(iso) {
  const m = minutesBetween(iso);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

function formatDuration(iso) {
  return formatWait(iso);
}

function initialsOf(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return 'G';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Map UI purpose labels → backend visitorType enum. */
export function mapPurposeToVisitorType(purpose) {
  const key = String(purpose || '')
    .trim()
    .toLowerCase();
  if (key.includes('deliver')) return 'delivery';
  if (key.includes('work') || key.includes('service') || key.includes('tech')) return 'technician';
  if (key.includes('cab') || key.includes('driver')) return 'driver';
  if (key.includes('maid')) return 'maid';
  if (key.includes('vendor') || key.includes('courier')) return 'courier';
  if (key.includes('guest') || key.includes('visit')) return 'guest';
  return 'other';
}

export function mapVisitToUiRow(visit) {
  const status = visit.status;
  const timeSource =
    status === 'checked_in'
      ? visit.checkInTime
      : status === 'checked_out'
        ? visit.checkOutTime || visit.checkInTime
      : status === 'rejected'
        ? visit.updatedAt
        : visit.createdAt;

  return {
    id: visit.id,
    name: visit.visitorName || 'Visitor',
    phone: visit.visitorPhone || '',
    flat: visit.flatNo || '—',
    purpose: visit.purpose || visit.visitorType || '—',
    persons: visit.numberOfPeople || 1,
    time: formatTime(timeSource),
    wait: formatWait(visit.createdAt),
    duration: formatDuration(visit.checkInTime || visit.createdAt),
      by:
      status === 'rejected'
        ? String(visit.notes || '').toLowerCase().includes('guard')
          ? 'Guard'
          : 'Admin / Resident'
        : '',
    vehicle: visit.vehicleNumber || '',
    visitStatus: status,
    isPreapproved: Boolean(visit.isPreapproved),
    visitorType: visit.visitorType,
    occupancyId: visit.occupancyId,
    visitorId: visit.visitorId,
    flatId: visit.flatId,
    createdAt: visit.createdAt,
    checkInTime: visit.checkInTime,
    raw: visit,
  };
}

async function fetchVisits(params = {}) {
  const res = await listVisits({
    page: 1,
    pageSize: 100,
    sortBy: 'created_at',
    sortOrder: 'desc',
    ...params,
  });
  return unwrap(res)?.visits || [];
}

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Resolve occupancyId for a flat number without admin flat list.
 * 1) Match flatNo on recent visits
 * 2) Try GET /occupancies (admin-only today — may 403)
 */
export async function resolveOccupancyIdByFlat(flatNo) {
  const needle = normalizeFlat(flatNo);
  if (!needle) return null;

  const visits = await fetchVisits({ pageSize: 100 });
  const fromVisit = visits.find((v) => normalizeFlat(v.flatNo) === needle);
  if (fromVisit?.occupancyId) return fromVisit.occupancyId;

  try {
    const res = await listOccupancies({ page: 1, pageSize: 100, status: 'active' });
    const rows = unwrap(res)?.occupancies || [];
    const hit = rows.find((o) => normalizeFlat(o.flatNo) === needle);
    if (hit?.id) return hit.id;
  } catch {
    // Guard cannot list occupancies — expected until backend grants access.
  }

  return null;
}

async function findOrCreateVisitor({ name, phone, photoSrc, note }) {
  const listRes = await listVisitors({ phone: phone.trim(), page: 1, pageSize: 10 });
  const existing = (unwrap(listRes)?.visitors || []).find(
    (v) => String(v.phone || '').replace(/\D/g, '') === phone.trim().replace(/\D/g, ''),
  );
  if (existing) return existing;

  const payload = {
    name: name.trim(),
    phone: phone.trim(),
    notes: note || undefined,
    metadata: {},
  };
  // Backend expects URL string, not a data-URI — keep camera capture local-only.
  if (photoSrc && /^https?:\/\//i.test(photoSrc)) {
    payload.photoUrl = photoSrc;
  }

  const created = await createVisitor(payload);
  return unwrap(created)?.visitor;
}

// ─────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────

export async function getGuardProfile() {
  const [profileRes, staffRes] = await Promise.all([
    api.get('/guard/profile'),
    getMyStaff().catch(() => null),
  ]);
  const user = unwrap(profileRes)?.user;
  const staff = unwrap(staffRes)?.staff;
  if (!user) throw new Error('Profile not found');

  const name = user.name || 'Guard';
  return {
    id: user.id,
    name,
    initials: initialsOf(name),
    role: user.designation || 'Security Guard',
    phone: user.phone || '',
    email: user.email || '',
    employeeId: staff?.code || staff?.id || null,
    assignedGate: staff?.assignedGateName || staff?.assignedGateId || null,
    shiftStart: staff?.shiftStart || null,
    photoUrl: null,
    staff,
    user,
  };
}

export async function updateGuardProfile(data) {
  const res = await api.patch('/guard/profile', data);
  return unwrap(res);
}

// ─────────────────────────────────────────────
// DASHBOARD / VISITS
// ─────────────────────────────────────────────

export async function getDashboardBundle() {
  const today = startOfTodayIso();
  const [
    waiting,
    approved,
    checkedIn,
    rejected,
    recent,
    deliveriesWaiting,
    deliveriesApproved,
  ] = await Promise.all([
    fetchVisits({ status: 'waiting' }),
    fetchVisits({ status: 'approved' }),
    fetchVisits({ status: 'checked_in' }),
    fetchVisits({ status: 'rejected' }),
    fetchVisits({ fromDate: today, pageSize: 20 }),
    fetchVisits({ status: 'waiting', visitorType: 'delivery' }),
    fetchVisits({ status: 'approved', visitorType: 'delivery' }),
  ]);

  const courierWaiting = await fetchVisits({ status: 'waiting', visitorType: 'courier' }).catch(
    () => [],
  );
  const courierApproved = await fetchVisits({ status: 'approved', visitorType: 'courier' }).catch(
    () => [],
  );

  const latest = latestVisitsOnly([...waiting, ...approved, ...checkedIn, ...rejected]);
  const pendingLatest = latest.filter((v) => v.status === 'waiting');
  const insideLatest = latest.filter((v) => v.status === 'checked_in');

  const deliveryVisits = [
    ...deliveriesWaiting,
    ...deliveriesApproved,
    ...courierWaiting,
    ...courierApproved,
  ];
  const uniqueDeliveries = latestVisitsOnly(deliveryVisits).filter((v) =>
    ['waiting', 'approved'].includes(v.status),
  );

  const staffInside = insideLatest.filter((v) =>
    ['maid', 'driver'].includes(String(v.visitorType || '').toLowerCase()),
  );

  const entriesToday = recent.filter((v) =>
    ['checked_in', 'checked_out', 'approved', 'waiting'].includes(v.status),
  );

  return {
    stats: {
      visitorsInsideCount: insideLatest.length,
      todaysVisitorCount: entriesToday.length,
      pendingApprovalsCount: pendingLatest.length,
      pendingDeliveriesCount: uniqueDeliveries.length,
      staffInsideCount: staffInside.length,
      activeSosCount: 0,
    },
    pending: pendingLatest.map(mapVisitToUiRow),
    approved: latest
      .filter((v) => v.status === 'approved' || v.status === 'checked_in')
      .map(mapVisitToUiRow),
    rejected: latest.filter((v) => v.status === 'rejected').map(mapVisitToUiRow),
    inside: insideLatest.map(mapVisitToUiRow),
    deliveries: uniqueDeliveries.map((v) => ({
      id: v.id,
      person: v.visitorName || 'Courier',
      flat: v.flatNo || '—',
      company: v.purpose || v.visitorType || 'Delivery',
      status: v.status === 'approved' ? 'Approved' : 'At Gate',
    })),
    staff: staffInside.map((v) => ({
      id: v.id,
      name: v.visitorName || 'Staff',
      role: v.visitorType || 'Staff',
      flat: v.flatNo || '—',
      since: formatTime(v.checkInTime),
    })),
    activity: recent.slice(0, 10).map((v) => {
      const name = v.visitorName || 'Visitor';
      const flat = v.flatNo || '—';
      let message = `${name} — ${v.status.replace(/_/g, ' ')} for Flat ${flat}`;
      let type = 'visitor';
      if (['delivery', 'courier'].includes(v.visitorType)) {
        type = 'delivery';
        message = `Delivery ${name} for Flat ${flat}`;
      } else if (['maid', 'driver'].includes(v.visitorType)) {
        type = 'staff';
        message = `Staff ${name} (${v.visitorType}) — Flat ${flat}`;
      } else if (v.status === 'checked_out') {
        type = 'exit';
        message = `${name} exited Flat ${flat}`;
      }
      return {
        id: v.id,
        message,
        time: formatTime(v.updatedAt || v.createdAt),
        type,
      };
    }),
  };
}

export async function getDashboardStats() {
  const bundle = await getDashboardBundle();
  return bundle.stats;
}

export async function getVisitorsInside() {
  const visits = await fetchVisits({ status: 'checked_in' });
  return visits.map((v) => {
    const row = mapVisitToUiRow(v);
    return {
      _id: row.id,
      id: row.id,
      name: row.name,
      initials: initialsOf(row.name),
      flat: row.flat,
      entryTime: row.time,
      purpose: row.purpose,
      totalPersons: row.persons,
      duration: row.duration,
    };
  });
}

function visitSortTime(visit) {
  const t = visit.updatedAt || visit.createdAt || 0;
  return new Date(t).getTime();
}

/** One row per visitor+flat — keep the newest visit so they don't appear in two tabs. */
function latestVisitsOnly(visits) {
  const map = new Map();
  for (const visit of visits) {
    const key = `${visit.visitorId || visit.visitorPhone || visit.id}:${visit.occupancyId || visit.flatId || visit.flatNo || ''}`;
    const prev = map.get(key);
    if (!prev || visitSortTime(visit) >= visitSortTime(prev)) {
      map.set(key, visit);
    }
  }
  return [...map.values()];
}

export async function listGuardVisitsByTab() {
  const [waiting, approved, checkedIn, rejected] = await Promise.all([
    fetchVisits({ status: 'waiting' }),
    fetchVisits({ status: 'approved' }),
    fetchVisits({ status: 'checked_in' }),
    fetchVisits({ status: 'rejected' }),
  ]);

  const latest = latestVisitsOnly([...waiting, ...approved, ...checkedIn, ...rejected]);

  return {
    pending: latest.filter((v) => v.status === 'waiting').map(mapVisitToUiRow),
    approved: latest
      .filter((v) => v.status === 'approved' || v.status === 'checked_in')
      .map(mapVisitToUiRow),
    rejected: latest.filter((v) => v.status === 'rejected').map(mapVisitToUiRow),
  };
}

function matchesQuickEntryMode(visit, mode) {
  const type = String(visit.visitorType || '').toLowerCase();
  const purpose = String(visit.purpose || '').toLowerCase();
  if (mode === 'delivery') {
    return ['delivery', 'courier'].includes(type) || purpose.includes('deliver');
  }
  if (mode === 'cab') {
    return purpose.includes('cab') || purpose.includes('taxi');
  }
  if (mode === 'staff') {
    if (purpose.includes('cab') || purpose.includes('taxi')) return false;
    return ['maid', 'driver', 'technician'].includes(type) || purpose.includes('work');
  }
  return true;
}

/** Delivery / Staff / Cab lists — Pending, Active, Completed (+ Rejected). */
export async function listQuickEntryByMode(mode) {
  const [waiting, approved, checkedIn, checkedOut, rejected] = await Promise.all([
    fetchVisits({ status: 'waiting' }),
    fetchVisits({ status: 'approved' }),
    fetchVisits({ status: 'checked_in' }),
    fetchVisits({ status: 'checked_out' }),
    fetchVisits({ status: 'rejected' }),
  ]);

  const scoped = latestVisitsOnly([
    ...waiting,
    ...approved,
    ...checkedIn,
    ...checkedOut,
    ...rejected,
  ]).filter((v) => matchesQuickEntryMode(v, mode));

  return {
    pending: scoped.filter((v) => v.status === 'waiting').map(mapVisitToUiRow),
    active: scoped
      .filter((v) => v.status === 'approved' || v.status === 'checked_in')
      .map(mapVisitToUiRow),
    completed: scoped.filter((v) => v.status === 'checked_out').map(mapVisitToUiRow),
    rejected: scoped.filter((v) => v.status === 'rejected').map(mapVisitToUiRow),
  };
}

/**
 * Create visitor identity + visit for a flat.
 * Requires occupancyId — resolved from prior visits or occupancies list.
 */
export async function logVisitor(form) {
  const occupancyId = await resolveOccupancyIdByFlat(form.flat);
  if (!occupancyId) {
    const err = new Error(
      `Cannot resolve flat "${form.flat}" to an occupancy. Guard cannot list flats/occupancies until that backend access exists (or the flat has a prior visit).`,
    );
    err.code = 'FLAT_OCCUPANCY_UNAVAILABLE';
    throw err;
  }

  const visitor = await findOrCreateVisitor({
    name: form.name,
    phone: form.phone,
    photoSrc: form.photoSrc,
    note: form.note,
  });
  if (!visitor?.id) throw new Error('Failed to create visitor');

  const isPreapproved = Boolean(form.preapprove);
  const visitRes = await createVisit({
    occupancyId,
    visitorId: visitor.id,
    purpose: form.purpose || 'Guest',
    visitorType: form.visitorType || mapPurposeToVisitorType(form.purpose),
    status: 'waiting',
    vehicleNumber: form.vehicle || undefined,
    numberOfPeople: Number(form.persons) || 1,
    isPreapproved,
    notes: form.note || undefined,
    metadata: {
      notifyResident: form.notify !== false,
      vehicleType: form.vtype || undefined,
      source: 'guard_panel',
    },
  });

  const visit = unwrap(visitRes)?.visit;
  if (!visit) throw new Error('Visit create failed');
  return mapVisitToUiRow(visit);
}

export async function checkInVisitor(visitId) {
  const res = await checkInVisit(visitId, {});
  return mapVisitToUiRow(unwrap(res)?.visit || { id: visitId, status: 'checked_in' });
}

export async function markVisitorExit(visitId) {
  const res = await checkOutVisit(visitId, {});
  return unwrap(res)?.visit;
}

/**
 * Guard approve — POST /visits/:id/approve
 */
export async function tryGuardApprove(visitRow) {
  const res = await approveVisit(visitRow.id, { notes: 'Approved by guard' });
  return mapVisitToUiRow(unwrap(res)?.visit || { ...visitRow.raw, status: 'approved' });
}

/**
 * Guard deny — POST /visits/:id/reject
 */
export async function tryGuardDeny(visitRow) {
  const res = await rejectVisit(visitRow.id, { notes: 'Rejected by guard' });
  return mapVisitToUiRow(unwrap(res)?.visit || { ...visitRow.raw, status: 'rejected' });
}

/** Re-queue a rejected visit by creating a new waiting visit with same links. */
export async function readdRejectedVisit(visitRow) {
  if (!visitRow.occupancyId || !visitRow.visitorId) {
    throw new Error('Missing occupancy/visitor ids to re-add');
  }
  const visitRes = await createVisit({
    occupancyId: visitRow.occupancyId,
    visitorId: visitRow.visitorId,
    purpose: visitRow.purpose || 'Guest',
    visitorType: mapPurposeToVisitorType(visitRow.purpose || visitRow.visitorType),
    status: 'waiting',
    vehicleNumber: visitRow.vehicle || undefined,
    numberOfPeople: visitRow.persons || 1,
    isPreapproved: false,
    metadata: { source: 'guard_readd', previousVisitId: visitRow.id },
  });
  const visit = unwrap(visitRes)?.visit;
  if (!visit) throw new Error('Re-add failed');
  return mapVisitToUiRow(visit);
}

export async function getUnreadNotificationCount() {
  try {
    const res = await listGuardNotifications({ page: 1, pageSize: 20 });
    const rows = unwrap(res)?.notifications || unwrap(res)?.items || [];
    return rows.filter((n) => !n.isRead && n.status !== 'read').length;
  } catch {
    return 0;
  }
}

// ─────────────────────────────────────────────
// UNAVAILABLE BACKEND (explicit stubs)
// ─────────────────────────────────────────────

export async function verifyVisitorOTP() {
  throw Object.assign(new Error('Visitor OTP verify API is not available on backend.'), {
    code: 'BACKEND_UNAVAILABLE',
  });
}

export async function getPendingDeliveries() {
  const bundle = await getDashboardBundle();
  return bundle.deliveries;
}

export async function logDelivery() {
  throw Object.assign(
    new Error('Dedicated deliveries API is not available — use Add Visitor with purpose Delivery.'),
    { code: 'BACKEND_UNAVAILABLE' },
  );
}

export async function markDeliveryCollected() {
  throw Object.assign(new Error('Delivery collect API is not available on backend.'), {
    code: 'BACKEND_UNAVAILABLE',
  });
}

export async function getSosAlerts() {
  return [];
}

export async function respondToSOS() {
  throw Object.assign(new Error('SOS alerts API is not available on backend.'), {
    code: 'BACKEND_UNAVAILABLE',
  });
}

export async function submitShiftHandover() {
  throw Object.assign(new Error('Shift handover API is not available on backend.'), {
    code: 'BACKEND_UNAVAILABLE',
  });
}

export async function getHandoverHistory() {
  return [];
}

export { apiError };
