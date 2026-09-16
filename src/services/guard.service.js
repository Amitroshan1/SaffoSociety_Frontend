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
    vehicleType: row.vehicleType || '',
    remarks: row.remarks || '',
    residentName: row.residentName || '',
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
  const vehicleType = String(row.vehicleType || row.raw?.vehicleType || '').toLowerCase();
  if (mode === 'delivery') {
    return ['delivery', 'courier'].includes(type) || purpose.includes('deliver');
  }
  if (mode === 'cab') {
    return (
      purpose.includes('cab') ||
      purpose.includes('taxi') ||
      purpose.startsWith('pickup') ||
      purpose.startsWith('drop') ||
      ['uber', 'ola', 'rapido', 'local', 'cab'].includes(vehicleType) ||
      (type === 'driver' &&
        (purpose.includes('cab') || vehicleType.includes('uber') || vehicleType.includes('ola')))
    );
  }
  return true;
}

/** Guests only — exclude delivery / cab / staff gate entries from Visitors module. */
export function isRegularVisitor(row) {
  const r = row?.raw || row || {};
  const purpose = String(row?.purpose || r.purpose || '').toLowerCase();
  const type = String(
    row?.visitorType || r.visitorType || r.visitor_type || mapPurposeToVisitorType(purpose),
  ).toLowerCase();

  if (['delivery', 'courier'].includes(type)) return false;
  if (purpose.includes('deliver') || purpose.includes('courier')) return false;

  if (
    purpose.includes('cab') ||
    purpose.includes('taxi') ||
    purpose.startsWith('pickup') ||
    purpose.startsWith('drop')
  ) {
    return false;
  }

  const vehicleType = String(row?.vehicleType || r.vehicleType || '').toLowerCase();
  if (['uber', 'ola', 'rapido', 'local', 'cab'].some((k) => vehicleType.includes(k))) {
    return false;
  }

  if (['maid', 'driver', 'technician'].includes(type)) return false;
  if (purpose.includes('work') || purpose.includes('service')) return false;

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

  const pending = pendingRows.map(mapGuardVisitorToUiRow).filter(isRegularVisitor);
  const inside = insideRows.map(mapGuardVisitorToUiRow).filter(isRegularVisitor);

  return {
    stats: {
      // Use the same filtered lists the UI shows — avoids card vs page mismatches
      visitorsInsideCount: inside.length,
      todaysVisitorCount: statsRaw.todaysVisitorCount ?? statsRaw.totalEntriesToday ?? 0,
      pendingApprovalsCount: pending.length,
      pendingDeliveriesCount: statsRaw.pendingDeliveriesCount ?? statsRaw.deliveriesPendingCount ?? 0,
      staffInsideCount: statsRaw.staffInsideCount ?? 0,
      activeSosCount: statsRaw.activeSosCount ?? alerts.filter((a) => a.status === 'active').length,
    },
    pending,
    approved: inside,
    rejected: (await fetchGuardVisitors({ status: 'rejected' }).catch(() => []))
      .map(mapGuardVisitorToUiRow)
      .filter(isRegularVisitor),
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

export async function listGuardVisitsByTab() {
  const [pending, approved, rejected] = await Promise.all([
    fetchGuardVisitors({ status: 'pending' }),
    fetchGuardVisitors({ status: 'approved' }),
    fetchGuardVisitors({ status: 'rejected' }),
  ]);
  const onlyVisitors = (rows) => rows.map(mapGuardVisitorToUiRow).filter(isRegularVisitor);
  return {
    pending: onlyVisitors(pending),
    approved: onlyVisitors(approved),
    rejected: onlyVisitors(rejected),
  };
}

/** Delivery lists — At Gate, Held, Completed. */
export async function listQuickEntryByMode(mode = 'delivery') {
  if (mode !== 'delivery') {
    return { pending: [], active: [], completed: [], rejected: [] };
  }

  const buckets = await listDeliveryBuckets();
  const toRow = (card, extra = {}) => ({
    id: card.id,
    name: card.courierName || 'Courier',
    phone: card.phone || '',
    flat: card.flat || '—',
    purpose: card.company || 'Delivery',
    company: card.company || 'Delivery',
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

/**
 * Recent unique visitors for Add Visitor quick-fill.
 * FE-only: uses existing GET /guard/visitors (+ optional search), then filters
 * last `days` (default 40, clamp 30–50) and dedupes by phone/visitorId.
 * Backend date-window support can replace this later.
 */
export async function searchRecentWalkIns({ q = '', days = 40, limit = 30 } = {}) {
  const daysN = Math.min(50, Math.max(30, Number(days) || 40));
  const limitN = Math.min(40, Math.max(1, Number(limit) || 30));
  const query = String(q || '').trim();
  const since = Date.now() - daysN * 24 * 60 * 60 * 1000;

  const raw = await fetchGuardVisitors({
    page: 1,
    pageSize: 100,
    ...(query ? { search: query } : {}),
  }).catch(() => []);

  const mapped = (raw || []).map(mapGuardVisitorToUiRow).filter(isRegularVisitor);

  const inWindow = mapped.filter((r) => {
    const stamp = r.createdAt || r.checkInTime;
    if (!stamp) return true;
    const t = new Date(stamp).getTime();
    return Number.isFinite(t) ? t >= since : true;
  });

  // Extra client filter when API search is empty / partial
  const needle = query.toLowerCase();
  const digits = query.replace(/\D/g, '');
  const matched = !needle
    ? inWindow
    : inWindow.filter((r) => {
        const name = String(r.name || '').toLowerCase();
        const phone = String(r.phone || '').replace(/\D/g, '');
        return name.includes(needle) || (digits && phone.includes(digits));
      });

  const seen = new Set();
  const unique = [];
  for (const row of matched) {
    const phoneKey = String(row.phone || '').replace(/\D/g, '').slice(-10);
    const key = phoneKey || row.visitorId || row.id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(row);
    if (unique.length >= limitN) break;
  }
  return unique;
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

function parseCabMeta(row) {
  const remarks = String(row.remarks || row.raw?.remarks || '');
  const serviceFromNote = remarks.match(/Service:\s*([^|]+)/i)?.[1]?.trim();
  const tripFromNote = remarks.match(/Trip:\s*([^|]+)/i)?.[1]?.trim();
  const purpose = String(row.purpose || '');
  const tripFromPurpose = purpose.replace(/^cab\s*[·\-]?\s*/i, '').trim();
  const service =
    serviceFromNote ||
    row.vehicleType ||
    row.raw?.vehicleType ||
    'Local / Other';
  let trip = tripFromNote || tripFromPurpose || 'Guest';
  if (/^cab$/i.test(trip)) trip = 'Guest';
  return { service, tripPurpose: trip };
}

/** Flat cab log list (no status tabs) — merges existing visit statuses. */
export async function listCabEntries() {
  const [pending, approved, exited, rejected] = await Promise.all([
    fetchGuardVisitors({ status: 'pending' }),
    fetchGuardVisitors({ status: 'approved' }),
    fetchGuardVisitors({ status: 'exited' }),
    fetchGuardVisitors({ status: 'rejected' }),
  ]);

  const rows = [...pending, ...approved, ...exited, ...rejected]
    .filter((r) => matchesQuickEntryMode(r, 'cab'))
    .map(mapGuardVisitorToUiRow)
    .map((row) => {
      const meta = parseCabMeta(row);
      return {
        id: row.id,
        driver: row.name || 'Driver',
        vehicle: row.vehicle || '—',
        flat: row.flat || '—',
        resident: row.residentName || row.raw?.residentName || '',
        service: meta.service,
        purpose: meta.tripPurpose,
        entryTime: row.time || '—',
        createdAt: row.createdAt || row.checkInTime || null,
        visitStatus: row.visitStatus || '',
        phone: row.phone || '',
        flatId: row.flatId || row.raw?.flatId || null,
        visitorId: row.visitorId || null,
        raw: row,
      };
    });

  rows.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

  return rows;
}

/**
 * Log cab at gate. Reuses POST /guard/visitors.
 * Phone is required by API — send placeholder; not shown in UI.
 * Lands in At Gate (pending) so guard can Call / Allow / Deny.
 */
export async function logCabEntry(form) {
  const service = form.service || 'Local / Other';
  const tripPurpose = form.tripPurpose || 'Guest';
  return logVisitor({
    name: (form.driverName || '').trim() || 'Driver',
    phone: '0000000000',
    flat: form.flat,
    purpose: `Cab ${tripPurpose}`,
    persons: 1,
    vehicle: form.vehicle,
    vtype: service,
    note: `Service: ${service} | Trip: ${tripPurpose}`,
    notify: false,
    preapprove: false,
    visitorType: 'driver',
    photoSrc: form.photoSrc || null,
  });
}

export { apiError };
