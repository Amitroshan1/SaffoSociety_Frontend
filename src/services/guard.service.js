// Guard panel API helpers — wired to dedicated /guard/* backend routes (no backend changes).

import api from './api';
import { getMyStaff } from './staff.service';
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

function initialsOf(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return 'G';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Map UI purpose labels → backend purpose / visitor type. */
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

/**
 * Guard list API returns UI statuses: pending | approved | rejected | exited
 * Map to the visitStatus values used by Visitors / QuickEntry tables.
 */
export function mapGuardVisitorToUiRow(row) {
  const status = String(row?.status || '').toLowerCase();
  let visitStatus = status;
  if (status === 'pending') visitStatus = 'waiting';
  // Guard approve already checks the visitor in → treat as inside
  else if (status === 'approved') visitStatus = 'checked_in';
  else if (status === 'exited') visitStatus = 'checked_out';
  else if (status === 'rejected') visitStatus = 'rejected';

  return {
    id: row.id || row.visitId || row._id,
    name: row.name || 'Visitor',
    phone: row.phone || '',
    flat: row.flat || '—',
    purpose: row.purpose || '—',
    persons: row.persons || 1,
    time: row.time || '—',
    wait: row.wait || '0m',
    duration: row.duration || '0m',
    by: row.by || (visitStatus === 'rejected' ? 'Guard' : ''),
    vehicle: row.vehicle || '',
    visitStatus,
    isPreapproved: Boolean(row.preApproved),
    visitorType: mapPurposeToVisitorType(row.purpose),
    occupancyId: row.occupancyId || null,
    visitorId: row.visitorId || null,
    flatId: row.flatId || null,
    photoUrl: row.photoUrl || row.photo_url || null,
    createdAt: row.createdAt,
    checkInTime: row.checkInTime,
    raw: row,
  };
}

async function fetchGuardVisitors(params = {}) {
  const res = await api.get('/guard/visitors', {
    params: {
      page: 1,
      pageSize: 100,
      sortBy: 'created_at',
      sortOrder: 'desc',
      ...params,
    },
  });
  return unwrap(res)?.visitors || [];
}

function matchesQuickEntryMode(row, mode) {
  const purpose = String(row.purpose || '').toLowerCase();
  const type = mapPurposeToVisitorType(row.purpose);
  if (mode === 'delivery') {
    return ['delivery', 'courier'].includes(type) || purpose.includes('deliver');
  }
  if (mode === 'cab') {
    return purpose.includes('cab') || purpose.includes('taxi') || type === 'driver';
  }
  if (mode === 'staff') {
    if (purpose.includes('cab') || purpose.includes('taxi')) return false;
    return (
      ['maid', 'driver', 'technician'].includes(type) ||
      purpose.includes('work') ||
      purpose.includes('service')
    );
  }
  return true;
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

export async function changeGuardPassword(payload) {
  const res = await api.patch('/guard/change-password', payload);
  return unwrap(res);
}

// ─────────────────────────────────────────────
// FLATS
// ─────────────────────────────────────────────

export async function searchGuardFlats(q, limit = 20) {
  const res = await api.get('/guard/flats', {
    params: { q: q || undefined, limit },
  });
  return unwrap(res)?.flats || [];
}

export async function getFlatContact(flatId) {
  const res = await api.get(`/guard/flats/${flatId}/contact`);
  return unwrap(res);
}

/** Resolve flat label via GET /guard/flats (preferred over admin occupancies). */
export async function resolveOccupancyIdByFlat(flatNo) {
  const needle = normalizeFlat(flatNo);
  if (!needle) return null;
  const flats = await searchGuardFlats(flatNo, 50);
  const hit = flats.find(
    (f) =>
      normalizeFlat(f.flat_number) === needle ||
      normalizeFlat(f.flatNo) === needle ||
      normalizeFlat(`${f.wingCode}-${f.flatNo}`) === needle,
  );
  return hit?.occupancyId || null;
}

export async function resolveFlatForWalkIn(flatNo) {
  const needle = normalizeFlat(flatNo);
  if (!needle) return null;
  const flats = await searchGuardFlats(flatNo, 50);
  const hit = flats.find(
    (f) =>
      normalizeFlat(f.flat_number) === needle ||
      normalizeFlat(f.flatNo) === needle ||
      normalizeFlat(`${f.wingCode}-${f.flatNo}`) === needle,
  );
  if (!hit) return null;
  return {
    flatId: hit.flatId || hit.id,
    occupancyId: hit.occupancyId || null,
    flatLabel: hit.flat_number || hit.flatNo,
  };
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────

export async function getDashboardBundle() {
  const [statsRes, sosRes, deliveriesRes, staffRes, activityRes, pendingRows, insideRows] =
    await Promise.all([
      api.get('/guard/dashboard/stats'),
      api.get('/guard/sos').catch(() => ({ data: { data: { alerts: [] } } })),
      api.get('/guard/deliveries', { params: { collected: false, limit: 20 } }).catch(() => ({
        data: { data: { deliveries: [] } },
      })),
      api.get('/guard/staff-inside', { params: { limit: 20 } }).catch(() => ({
        data: { data: { staff: [] } },
      })),
      api.get('/guard/activity', { params: { limit: 20 } }).catch(() => ({
        data: { data: { activities: [] } },
      })),
      fetchGuardVisitors({ status: 'pending' }),
      fetchGuardVisitors({ status: 'inside' }),
    ]);

  const statsRaw = unwrap(statsRes) || {};
  const alerts = unwrap(sosRes)?.alerts || [];
  const deliveries = unwrap(deliveriesRes)?.deliveries || [];
  const staff = unwrap(staffRes)?.staff || [];
  const activities = unwrap(activityRes)?.activities || [];

  const pending = pendingRows.map(mapGuardVisitorToUiRow);
  const inside = insideRows.map(mapGuardVisitorToUiRow);

  return {
    stats: {
      visitorsInsideCount: statsRaw.visitorsInsideCount ?? statsRaw.activeVisitorsCount ?? 0,
      todaysVisitorCount: statsRaw.todaysVisitorCount ?? statsRaw.totalEntriesToday ?? 0,
      pendingApprovalsCount: statsRaw.pendingApprovalsCount ?? 0,
      pendingDeliveriesCount: statsRaw.pendingDeliveriesCount ?? statsRaw.deliveriesPendingCount ?? 0,
      staffInsideCount: statsRaw.staffInsideCount ?? 0,
      activeSosCount: statsRaw.activeSosCount ?? alerts.filter((a) => a.status === 'active').length,
    },
    pending,
    approved: inside,
    rejected: (await fetchGuardVisitors({ status: 'rejected' }).catch(() => [])).map(
      mapGuardVisitorToUiRow,
    ),
    inside,
    deliveries,
    staff,
    activity: activities,
    sosAlerts: activeSosFromApi(alerts),
  };
}

function activeSosFromApi(alerts) {
  return (alerts || []).filter((a) => String(a.status || '').toLowerCase() === 'active');
}

export async function getDashboardStats() {
  const res = await api.get('/guard/dashboard/stats');
  const s = unwrap(res) || {};
  return {
    visitorsInsideCount: s.visitorsInsideCount ?? s.activeVisitorsCount ?? 0,
    todaysVisitorCount: s.todaysVisitorCount ?? s.totalEntriesToday ?? 0,
    pendingApprovalsCount: s.pendingApprovalsCount ?? 0,
    pendingDeliveriesCount: s.pendingDeliveriesCount ?? s.deliveriesPendingCount ?? 0,
    staffInsideCount: s.staffInsideCount ?? 0,
    activeSosCount: s.activeSosCount ?? 0,
  };
}

export async function getVisitorsInside() {
  const rows = await fetchGuardVisitors({ status: 'inside' });
  return rows.map((row) => {
    const mapped = mapGuardVisitorToUiRow(row);
    return {
      _id: mapped.id,
      id: mapped.id,
      name: mapped.name,
      initials: initialsOf(mapped.name),
      flat: mapped.flat,
      entryTime: mapped.time,
      purpose: mapped.purpose,
      totalPersons: mapped.persons,
      duration: mapped.duration,
    };
  });
}

export async function listGuardVisitsByTab() {
  const [pending, approved, rejected] = await Promise.all([
    fetchGuardVisitors({ status: 'pending' }),
    fetchGuardVisitors({ status: 'approved' }),
    fetchGuardVisitors({ status: 'rejected' }),
  ]);
  return {
    pending: pending.map(mapGuardVisitorToUiRow),
    approved: approved.map(mapGuardVisitorToUiRow),
    rejected: rejected.map(mapGuardVisitorToUiRow),
  };
}

/** Delivery / Staff / Cab lists — Pending, Active, Completed (+ Rejected). */
export async function listQuickEntryByMode(mode) {
  if (mode === 'delivery') {
    const buckets = await listDeliveryBuckets();
    const toRow = (card, extra = {}) => ({
      id: card.id,
      name: card.courierName || 'Courier',
      phone: card.phone || '',
      flat: card.flat || '—',
      purpose: 'Delivery',
      persons: 1,
      time: card.time || '—',
      wait: card.raw?.wait || card.time || '0m',
      duration: '—',
      by: card.held ? 'Guard' : '',
      vehicle: '',
      visitStatus: card.visitStatus || 'waiting',
      visitorId: card.visitorId || null,
      flatId: card.flatId || card.raw?.flatId || null,
      raw: card.raw || card,
      ...extra,
    });
    return {
      pending: buckets.atGate.map((c) => toRow(c)),
      active: [],
      completed: buckets.completed.map((c) =>
        toRow(c, { visitStatus: 'checked_out', by: '' }),
      ),
      rejected: buckets.held.map((c) =>
        toRow(c, { visitStatus: 'rejected', by: 'Guard', held: true }),
      ),
    };
  }

  const [pending, active, completed, rejected] = await Promise.all([
    fetchGuardVisitors({ status: 'pending' }),
    fetchGuardVisitors({ status: 'approved' }),
    fetchGuardVisitors({ status: 'exited' }),
    fetchGuardVisitors({ status: 'rejected' }),
  ]);

  const filter = (rows) =>
    rows.filter((r) => matchesQuickEntryMode(r, mode)).map(mapGuardVisitorToUiRow);

  return {
    pending: filter(pending),
    active: filter(active),
    completed: filter(completed),
    rejected: filter(rejected),
  };
}

/**
 * Create walk-in via POST /guard/visitors (flat label or flatId/occupancyId).
 */
export async function logVisitor(form) {
  const flatLabel = String(form.flat || '').trim();
  if (!flatLabel) {
    const err = new Error('Flat is required.');
    err.code = 'FLAT_OCCUPANCY_UNAVAILABLE';
    throw err;
  }

  const flatInfo = await resolveFlatForWalkIn(flatLabel).catch(() => null);

  let photoUrl = null;
  const photoSrc = form.photoSrc;
  if (photoSrc && /^https?:\/\//i.test(photoSrc)) {
    photoUrl = photoSrc;
  } else if (photoSrc && String(photoSrc).startsWith('data:')) {
    try {
      const up = await api.post('/guard/visitors/photo', { photo: photoSrc });
      photoUrl = unwrap(up)?.photoUrl || unwrap(up)?.photo_url || null;
    } catch {
      // Fall through — create accepts inline photo field too
    }
  }

  const payload = {
    name: form.name?.trim(),
    phone: form.phone?.trim(),
    purpose: form.purpose || 'Guest',
    persons: Number(form.persons) || 1,
    vehicle: form.vehicle || undefined,
    vehicleType: form.vtype || undefined,
    flat: flatLabel,
    flatId: flatInfo?.flatId || undefined,
    occupancyId: flatInfo?.occupancyId || undefined,
    remarks: form.note || undefined,
    notify: form.notify !== false,
    preapprove: Boolean(form.preapprove),
    photoUrl: photoUrl || undefined,
    photo: !photoUrl && photoSrc?.startsWith?.('data:') ? photoSrc : undefined,
  };

  const res = await api.post('/guard/visitors', payload);
  const visitor = unwrap(res)?.visitor;
  if (!visitor) throw new Error('Visit create failed');
  return mapGuardVisitorToUiRow(visitor);
}

/** Guard approve → PATCH /guard/visitors/:id/approve (checks visitor in). */
export async function tryGuardApprove(visitRow) {
  const res = await api.patch(`/guard/visitors/${visitRow.id}/approve`);
  return mapGuardVisitorToUiRow(unwrap(res)?.visitor || { ...visitRow.raw, status: 'approved' });
}

/** Guard deny → PATCH /guard/visitors/:id/deny */
export async function tryGuardDeny(visitRow) {
  const res = await api.patch(`/guard/visitors/${visitRow.id}/deny`, {
    rejectedBy: 'Guard',
    notes: 'Rejected by guard',
  });
  return mapGuardVisitorToUiRow(unwrap(res)?.visitor || { ...visitRow.raw, status: 'rejected' });
}

/** Already-approved path: no separate check-in needed on guard API. */
export async function checkInVisitor(visitId) {
  const res = await api.patch(`/guard/visitors/${visitId}/approve`);
  return mapGuardVisitorToUiRow(unwrap(res)?.visitor || { id: visitId, status: 'approved' });
}

export async function markVisitorExit(visitId) {
  const res = await api.patch(`/guard/visitors/${visitId}/exit`);
  return unwrap(res)?.visitor;
}

/** Re-queue rejected visit → PATCH /guard/visitors/:id/readd */
export async function readdRejectedVisit(visitRow) {
  const res = await api.patch(`/guard/visitors/${visitRow.id}/readd`);
  const visitor = unwrap(res)?.visitor;
  if (!visitor) throw new Error('Re-add failed');
  return mapGuardVisitorToUiRow(visitor);
}

export async function verifyVisitorOTP(visitId, otp) {
  const res = await api.post(`/guard/visitors/${visitId}/verify-otp`, { otp });
  return mapGuardVisitorToUiRow(unwrap(res)?.visitor || { id: visitId, status: 'approved' });
}

export async function logGuardCall(visitorId, notes) {
  if (!visitorId) return null;
  const res = await api.post('/guard/call-logs', {
    visitorId,
    notes: notes || undefined,
  });
  return unwrap(res);
}

export async function getRecentWalkIns(limit = 5) {
  const res = await api.get('/guard/visitors/recent', { params: { limit } });
  return (unwrap(res)?.visitors || unwrap(res)?.items || []).map(mapGuardVisitorToUiRow);
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
// DELIVERIES / SOS
// ─────────────────────────────────────────────

export async function getPendingDeliveries() {
  const res = await api.get('/guard/deliveries', { params: { collected: false, limit: 50 } });
  return unwrap(res)?.deliveries || [];
}

export async function getCollectedDeliveries(limit = 50) {
  const res = await api.get('/guard/deliveries', { params: { collected: true, limit } });
  return unwrap(res)?.deliveries || [];
}

export async function markDeliveryCollected(deliveryId) {
  const res = await api.patch(`/guard/deliveries/${deliveryId}/collect`);
  return unwrap(res)?.delivery;
}

const HELD_MARKER = 'HELD_AT_GATE';
const HELD_BY = 'GateHold';

function parseDeliveryMeta(remarks = '') {
  const text = String(remarks || '');
  const company = text.match(/Company:\s*([^|]+)/i)?.[1]?.trim() || '';
  const tracking = text.match(/Tracking:\s*([^|]+)/i)?.[1]?.trim() || '';
  const parts = text
    .split('|')
    .map((p) => p.trim())
    .filter(
      (p) =>
        p &&
        !/^Company:/i.test(p) &&
        !/^Tracking:/i.test(p) &&
        !/^HELD_AT_GATE$/i.test(p),
    );
  return { company: company || 'Delivery', tracking, parcelNote: parts.join(' · ') };
}

function isHeldDelivery(row) {
  const by = String(row.by || row.raw?.by || '');
  const remarks = String(row.raw?.remarks || row.note || '');
  return by === HELD_BY || remarks.includes(HELD_MARKER);
}

function isDeliveryRow(row) {
  return matchesQuickEntryMode(row.raw || row, 'delivery') || matchesQuickEntryMode(row, 'delivery');
}

function toDeliveryCard(row) {
  const meta = parseDeliveryMeta(row.raw?.remarks || row.note || '');
  return {
    id: row.id,
    courierName: row.name || 'Courier',
    phone: row.phone || '',
    flat: row.flat || '—',
    flatId: row.flatId || row.raw?.flatId || null,
    company: meta.company,
    tracking: meta.tracking,
    parcelNote: meta.parcelNote,
    time: row.time || '—',
    visitStatus: row.visitStatus,
    visitorId: row.visitorId,
    held: isHeldDelivery(row),
    raw: row.raw || row,
  };
}

/**
 * Gate-level delivery buckets (FE convention on existing visit APIs):
 * - atGate: waiting/inside delivery, not collected, not held
 * - held: denied with GateHold / HELD_AT_GATE marker
 * - completed: collect API (collected=true)
 */
export async function listDeliveryBuckets() {
  const [pending, approved, rejected, collectedApi] = await Promise.all([
    fetchGuardVisitors({ status: 'pending' }),
    fetchGuardVisitors({ status: 'approved' }),
    fetchGuardVisitors({ status: 'rejected' }),
    getCollectedDeliveries(100).catch(() => []),
  ]);

  const mapUi = (rows) => rows.map(mapGuardVisitorToUiRow).filter(isDeliveryRow);

  // Held uses deny+GateHold. Backend treats rejected as "collected", so keep held
  // out of Completed until Mark Collected (readd → collect) runs on the FE.
  const heldRows = mapUi(rejected).filter((r) => isHeldDelivery(r));
  const heldIds = new Set(heldRows.map((r) => r.id));
  const collectedIds = new Set((collectedApi || []).map((d) => d.id));

  const atGate = mapUi([...pending, ...approved])
    .filter((r) => !isHeldDelivery(r) && !collectedIds.has(r.id) && !heldIds.has(r.id))
    .map(toDeliveryCard);

  const held = heldRows.map(toDeliveryCard);

  const completed = (collectedApi || [])
    .filter((d) => !heldIds.has(d.id))
    .map((d) => ({
      id: d.id,
      courierName: d.person || d.courier || 'Courier',
      phone: '',
      flat: d.flat || '—',
      flatId: null,
      company: d.company || 'Delivery',
      tracking: '',
      parcelNote: '',
      time: d.arrivedTime || '—',
      visitStatus: 'checked_out',
      held: false,
      completedLabel: 'Collected',
      raw: d,
    }));

  return { atGate, held, completed };
}

/** Resident confirmed receipt — uses existing collect API (no courier-inside tracking). */
export async function markResidentReceived(deliveryId) {
  return markDeliveryCollected(deliveryId);
}

/** Parcel stays with security — reuse deny + GateHold marker (no new BE route). */
export async function holdDeliveryAtGate(deliveryId, existingRemarks = '') {
  const base = String(existingRemarks || '')
    .replace(/\s*\|\s*HELD_AT_GATE\b/gi, '')
    .trim();
  const notes = base ? `${base} | ${HELD_MARKER}` : HELD_MARKER;
  const res = await api.patch(`/guard/visitors/${deliveryId}/deny`, {
    rejectedBy: HELD_BY,
    notes,
  });
  return unwrap(res)?.visitor;
}

/**
 * Resident collected a held parcel.
 * Backend treats rejected as already-collected, so re-open (readd) then collect.
 */
export async function markHeldParcelCollected(deliveryId) {
  await api.patch(`/guard/visitors/${deliveryId}/readd`);
  return markDeliveryCollected(deliveryId);
}

/** Call resident for a delivery — logs call; does NOT change delivery status. */
export async function callResidentForDelivery(card) {
  let phone = '';
  let residentName = 'Resident';
  let flatId = card?.flatId || card?.raw?.flatId || null;

  if (!flatId && card?.flat && card.flat !== '—') {
    try {
      const info = await resolveFlatForWalkIn(card.flat);
      flatId = info?.flatId || null;
    } catch {
      // fall through
    }
  }

  if (flatId) {
    try {
      const contact = await getFlatContact(flatId);
      phone = String(contact?.phone || '').replace(/[^\d+]/g, '');
      residentName = contact?.name || residentName;
    } catch {
      // fall through to courier phone
    }
  }

  // Fallback: dial courier if resident contact is missing (call must still work)
  if (!phone) {
    phone = String(card?.phone || card?.raw?.phone || '').replace(/[^\d+]/g, '');
    if (phone) residentName = card?.name || 'Courier';
  }

  if (!phone) {
    const err = new Error('No phone available for this delivery.');
    err.code = 'NO_PHONE';
    throw err;
  }

  try {
    await logGuardCall(
      card.id,
      `Called ${residentName} · Flat ${card.flat || ''} · delivery`,
    );
  } catch {
    // Dial anyway
  }
  return { phone, residentName };
}

/** Prefer logVisitor with purpose Delivery — dedicated create not required. */
export async function logDelivery(form) {
  return logVisitor({
    ...form,
    purpose: form.purpose || 'Delivery',
    visitorType: 'delivery',
    // Always land in At Gate — Guard confirms outcome later
    preapprove: false,
  });
}

export async function getSosAlerts() {
  const res = await api.get('/guard/sos');
  return unwrap(res)?.alerts || [];
}

export async function respondToSOS(sosId) {
  const res = await api.patch(`/guard/sos/${sosId}/respond`);
  return unwrap(res)?.alert;
}

// ─────────────────────────────────────────────
// UNAVAILABLE ON BACKEND (keep explicit stubs)
// ─────────────────────────────────────────────

export async function submitShiftHandover() {
  throw Object.assign(new Error('Shift handover API is not available on backend.'), {
    code: 'BACKEND_UNAVAILABLE',
  });
}

export async function getHandoverHistory() {
  return [];
}

export { apiError };
