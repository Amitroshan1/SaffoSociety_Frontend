/**
 * In-memory mock store shaped like backend PDF responses.
 * Used only when VITE_USE_DUMMY_DATA is true.
 */
import { DUMMY_VISITORS, DUMMY_DELIVERIES, DUMMY_CAB_ENTRIES, DUMMY_STAFF_ENTRIES } from '@/modules/guard/data/dummyData';
import { DELIVERY_HELD, GATE_STATUS, STAFF_STATUS } from '@/modules/guard/services/gate/gateStatus';
import { buildPagination, indiaTodayISO } from '@/modules/guard/services/core/http';

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

function mapLegacyVisitorStatus(s) {
  const x = String(s || '').toLowerCase();
  if (x === 'exited' || x === 'checked_out') return GATE_STATUS.EXITED;
  if (x === 'approved' || x === 'checked_in') return GATE_STATUS.APPROVED;
  if (x === 'inside') return GATE_STATUS.INSIDE;
  if (x === 'rejected') return GATE_STATUS.REJECTED;
  return GATE_STATUS.PENDING;
}

function seedVisitors() {
  return clone(DUMMY_VISITORS).map((v) => {
    let status = mapLegacyVisitorStatus(v.status);
    // Seed: treat former "approved" as approved (awaiting check-in), not inside
    if (v.status === 'approved') status = GATE_STATUS.APPROVED;
    return {
      id: v.id,
      name: v.name,
      phone: String(v.phone || '').replace(/\D/g, '').slice(-10),
      purpose: String(v.purpose || 'guest').toLowerCase().includes('guest')
        ? 'guest'
        : String(v.purpose || 'other').toLowerCase().split(/[\s/]+/)[0] || 'other',
      flat: v.flat,
      personCount: v.persons || 1,
      vehicleNumber: v.vehicle || null,
      vehicleType: v.vehicleType || null,
      notifyResident: true,
      preApproved: false,
      remarks: v.remarks || null,
      photoUrl: null,
      status,
      createdAt: v.createdAt || new Date().toISOString(),
      checkInTime: status === GATE_STATUS.INSIDE ? v.createdAt : null,
      exitTime: status === GATE_STATUS.EXITED ? v.createdAt : null,
    };
  });
}

function seedDeliveries() {
  const rows = clone(DUMMY_DELIVERIES).map((d, i) => {
    let status = GATE_STATUS.PENDING;
    if (d.status === 'collected') status = GATE_STATUS.EXITED;
    if (i === 1 && status === GATE_STATUS.PENDING) status = DELIVERY_HELD;
    return {
      id: d.id,
      courierName: d.courier,
      phone: '9800099999',
      company: String(d.company || d.courier || 'other').toLowerCase().slice(0, 50),
      flat: d.flat,
      trackingId: d.trackingId || null,
      parcelNote: null,
      photoUrl: null,
      status,
      createdAt: new Date().toISOString(),
      entryTime: status === GATE_STATUS.INSIDE || status === GATE_STATUS.EXITED ? new Date().toISOString() : null,
      exitTime: status === GATE_STATUS.EXITED ? new Date().toISOString() : null,
    };
  });
  return rows;
}

function seedCabs() {
  return clone(DUMMY_CAB_ENTRIES).map((c, i) => {
    let status = GATE_STATUS.PENDING;
    if (c.status === 'approved') status = GATE_STATUS.APPROVED;
    if (c.status === 'exited') status = GATE_STATUS.EXITED;
    // Ensure at least one approved cab for check-in testing
    if (i === 0 && status === GATE_STATUS.PENDING) status = GATE_STATUS.APPROVED;
    return {
      id: c.id,
      vehicleNumber: String(c.vehicle || '').replace(/\s+/g, '').toUpperCase(),
      cabService: c.company || 'Local',
      flat: c.flat,
      purpose: c.tripType || 'Pickup',
      driverName: c.driver || null,
      photoUrl: null,
      status,
      createdAt: new Date().toISOString(),
      entryTime: status === GATE_STATUS.INSIDE || status === GATE_STATUS.EXITED ? new Date().toISOString() : null,
      exitTime: status === GATE_STATUS.EXITED ? new Date().toISOString() : null,
    };
  });
}

function seedStaff() {
  return clone(DUMMY_STAFF_ENTRIES).map((s) => {
    let attendanceStatus = STAFF_STATUS.NOT_MARKED;
    if (s.status === 'in') attendanceStatus = STAFF_STATUS.CHECKED_IN;
    if (s.status === 'out') attendanceStatus = STAFF_STATUS.CHECKED_OUT;
    return {
      id: s.id,
      name: s.name,
      role: s.role || 'Staff',
      phone: s.phone || null,
      building: null,
      wing: null,
      flat: s.flat || null,
      owner: null,
      aadhaarMasked: 'XXXX-XXXX-1234',
      attendanceStatus,
      checkInTime: s.inAt ? `${indiaTodayISO()}T${normalizeTime(s.inAt)}` : null,
      checkOutTime: s.outAt ? `${indiaTodayISO()}T${normalizeTime(s.outAt)}` : null,
    };
  });
}

function normalizeTime(t) {
  // "07:10 AM" → rough ISO time — mock only
  try {
    const d = new Date(`1970-01-01 ${t}`);
    if (!Number.isNaN(d.getTime())) {
      return d.toTimeString().slice(0, 8);
    }
  } catch {
    /* ignore */
  }
  return '09:00:00';
}

let visitors = seedVisitors();
let deliveries = seedDeliveries();
let cabs = seedCabs();
let staff = seedStaff();

export function resetGateMockStore() {
  visitors = seedVisitors();
  deliveries = seedDeliveries();
  cabs = seedCabs();
  staff = seedStaff();
}

function paginate(list, { page = 1, pageSize = 20 } = {}) {
  const p = Math.max(1, Number(page) || 1);
  const ps = Math.min(100, Math.max(1, Number(pageSize) || 20));
  const start = (p - 1) * ps;
  const items = list.slice(start, start + ps);
  return { items, pagination: buildPagination(list.length, p, ps) };
}

function matchSearch(haystacks, q) {
  if (!q) return true;
  const needle = String(q).toLowerCase();
  return haystacks.some((h) => String(h || '').toLowerCase().includes(needle));
}

function sortByField(list, sortBy, sortOrder = 'desc') {
  const dir = String(sortOrder).toLowerCase() === 'asc' ? 1 : -1;
  const key = sortBy || 'createdAt';
  return [...list].sort((a, b) => {
    const av = a[key] ?? '';
    const bv = b[key] ?? '';
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
}

function inDateRange(iso, from, to) {
  if (!from && !to) return true;
  const day = String(iso || '').slice(0, 10);
  if (!day) return true;
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

/* ── Visitors ── */
export const mockVisitors = {
  list(params = {}) {
    let rows = [...visitors];
    if (params.status) rows = rows.filter((r) => r.status === params.status);
    if (params.search) {
      rows = rows.filter((r) =>
        matchSearch([r.name, r.phone, r.flat, r.vehicleNumber], params.search),
      );
    }
    rows = rows.filter((r) => inDateRange(r.createdAt, params.from, params.to));
    rows = sortByField(rows, params.sortBy || 'createdAt', params.sortOrder || 'desc');
    return paginate(rows, params);
  },
  recent({ limit = 10 } = {}) {
    const n = Math.min(50, Math.max(1, Number(limit) || 10));
    return sortByField(visitors, 'createdAt', 'desc').slice(0, n);
  },
  get(id) {
    return visitors.find((v) => v.id === id) || null;
  },
  create(payload) {
    const status = payload.preApproved ? GATE_STATUS.INSIDE : GATE_STATUS.PENDING;
    const row = {
      id: `v-${Date.now()}`,
      name: payload.name,
      phone: payload.phone,
      purpose: payload.purpose,
      flat: payload.flat,
      personCount: payload.personCount ?? 1,
      vehicleNumber: payload.vehicleNumber || null,
      vehicleType: payload.vehicleType || null,
      notifyResident: payload.notifyResident !== false,
      preApproved: Boolean(payload.preApproved),
      remarks: payload.remarks || null,
      photoUrl: payload.photoUrl || null,
      status,
      createdAt: new Date().toISOString(),
      checkInTime: status === GATE_STATUS.INSIDE ? new Date().toISOString() : null,
      exitTime: null,
    };
    visitors = [row, ...visitors];
    return row;
  },
  checkIn(id) {
    const row = visitors.find((v) => v.id === id);
    if (!row) {
      const e = new Error('Visitor not found');
      e.status = 404;
      throw e;
    }
    if (row.status !== GATE_STATUS.APPROVED) {
      const e = new Error('Visitor must be approved before check-in');
      e.status = 409;
      throw e;
    }
    row.status = GATE_STATUS.INSIDE;
    row.checkInTime = new Date().toISOString();
    return { ...row };
  },
  exit(id) {
    const row = visitors.find((v) => v.id === id);
    if (!row) {
      const e = new Error('Visitor not found');
      e.status = 404;
      throw e;
    }
    if (row.status !== GATE_STATUS.INSIDE) {
      const e = new Error('Visitor must be inside before exit');
      e.status = 409;
      throw e;
    }
    row.status = GATE_STATUS.EXITED;
    row.exitTime = new Date().toISOString();
    return { ...row };
  },
  /** Dev-only: simulate resident decision for local UI testing */
  _setStatus(id, status) {
    visitors = visitors.map((v) => (v.id === id ? { ...v, status } : v));
    return visitors.find((v) => v.id === id);
  },
};

/* ── Deliveries ── */
export const mockDeliveries = {
  list(params = {}) {
    let rows = [...deliveries];
    if (params.status) {
      const statuses = String(params.status).split(',').map((s) => s.trim()).filter(Boolean);
      rows = rows.filter((r) => statuses.includes(r.status));
    }
    if (params.collectedAtGate === 'true') rows = rows.filter((r) => r.collectedAtGate);
    else if (params.collectedAtGate === 'false') rows = rows.filter((r) => !r.collectedAtGate);
    if (params.search) {
      rows = rows.filter((r) =>
        matchSearch(
          [r.courierName, r.phone, r.flat, r.company, r.trackingId, r.handover?.collectedByName],
          params.search,
        ),
      );
    }
    rows = rows.filter((r) => inDateRange(r.createdAt, params.from, params.to));
    rows = sortByField(rows, params.sortBy || 'createdAt', params.sortOrder || 'desc');
    return paginate(rows, params);
  },
  get(id) {
    return deliveries.find((d) => d.id === id) || null;
  },
  create(payload) {
    const row = {
      id: `d-${Date.now()}`,
      courierName: payload.courierName,
      phone: payload.phone,
      company: String(payload.company || '').toLowerCase(),
      flat: payload.flat,
      trackingId: payload.trackingId || null,
      parcelNote: payload.parcelNote || null,
      photoUrl: payload.photoUrl || null,
      status: GATE_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      entryTime: null,
      exitTime: null,
    };
    deliveries = [row, ...deliveries];
    return row;
  },
  checkIn(id) {
    const row = deliveries.find((d) => d.id === id);
    if (!row) {
      const e = new Error('Delivery not found');
      e.status = 404;
      throw e;
    }
    if (row.status !== GATE_STATUS.APPROVED) {
      const e = new Error('Delivery must be approved before check-in');
      e.status = 409;
      throw e;
    }
    row.status = GATE_STATUS.INSIDE;
    row.entryTime = new Date().toISOString();
    return { ...row };
  },
  exit(id) {
    const row = deliveries.find((d) => d.id === id);
    if (!row) {
      const e = new Error('Delivery not found');
      e.status = 404;
      throw e;
    }
    if (row.status !== GATE_STATUS.INSIDE) {
      const e = new Error('Delivery must be inside before exit');
      e.status = 409;
      throw e;
    }
    row.status = GATE_STATUS.EXITED;
    row.exitTime = new Date().toISOString();
    return { ...row };
  },
  hold(id) {
    const row = deliveries.find((d) => d.id === id);
    if (!row) {
      const e = new Error('Delivery not found');
      e.status = 404;
      throw e;
    }
    if (row.status !== GATE_STATUS.PENDING && row.status !== GATE_STATUS.APPROVED) {
      const e = new Error('Only a delivery waiting at the gate can be kept at the gate');
      e.status = 409;
      throw e;
    }
    row.status = DELIVERY_HELD;
    row.heldAt = new Date().toISOString();
    return { ...row };
  },
  collect(id, handover = {}) {
    const row = deliveries.find((d) => d.id === id);
    if (!row) {
      const e = new Error('Delivery not found');
      e.status = 404;
      throw e;
    }
    if (row.status !== DELIVERY_HELD) {
      const e = new Error('Delivery is not kept at the gate');
      e.status = 409;
      throw e;
    }
    const handedAt = new Date().toISOString();
    row.status = GATE_STATUS.EXITED;
    row.collectedAtGate = true;
    row.exitTime = handedAt;
    row.handover = {
      collectedByName: handover.collectedByName || null,
      collectedByRelation: handover.collectedByRelation || null,
      collectedByPhone: handover.collectedByPhone || null,
      idProof: handover.idProof || null,
      parcelCondition: handover.parcelCondition || null,
      remarks: handover.remarks || null,
      photoUrl: handover.photoUrl || null,
      handedAt,
    };
    return { ...row, handover: { ...row.handover } };
  },
  _setStatus(id, status) {
    deliveries = deliveries.map((d) => (d.id === id ? { ...d, status } : d));
    return deliveries.find((d) => d.id === id);
  },
};

/* ── Cabs ── */
export const mockCabs = {
  list(params = {}) {
    let rows = [...cabs];
    if (params.status) {
      const statuses = String(params.status).split(',').map((s) => s.trim()).filter(Boolean);
      rows = rows.filter((r) => statuses.includes(r.status));
    }
    if (params.search) {
      rows = rows.filter((r) =>
        matchSearch([r.vehicleNumber, r.driverName, r.flat, r.cabService, r.purpose], params.search),
      );
    }
    rows = rows.filter((r) => inDateRange(r.createdAt, params.from, params.to));
    rows = sortByField(rows, params.sortBy || 'createdAt', params.sortOrder || 'desc');
    return paginate(rows, params);
  },
  get(id) {
    return cabs.find((c) => c.id === id) || null;
  },
  create(payload) {
    const row = {
      id: `c-${Date.now()}`,
      vehicleNumber: String(payload.vehicleNumber || '').replace(/\s+/g, '').toUpperCase().slice(0, 20),
      cabService: String(payload.cabService || '').slice(0, 50),
      flat: payload.flat,
      purpose: String(payload.purpose || '').slice(0, 50),
      driverName: payload.driverName ? String(payload.driverName).slice(0, 150) : null,
      photoUrl: payload.photoUrl || null,
      status: GATE_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      entryTime: null,
      exitTime: null,
    };
    cabs = [row, ...cabs];
    return row;
  },
  checkIn(id) {
    const row = cabs.find((c) => c.id === id);
    if (!row) {
      const e = new Error('Cab not found');
      e.status = 404;
      throw e;
    }
    if (row.status !== GATE_STATUS.APPROVED) {
      const e = new Error('Cab must be approved before check-in');
      e.status = 409;
      throw e;
    }
    row.status = GATE_STATUS.INSIDE;
    row.entryTime = new Date().toISOString();
    return { ...row };
  },
  exit(id) {
    const row = cabs.find((c) => c.id === id);
    if (!row) {
      const e = new Error('Cab not found');
      e.status = 404;
      throw e;
    }
    if (row.status !== GATE_STATUS.INSIDE) {
      const e = new Error('Cab must be inside before exit');
      e.status = 409;
      throw e;
    }
    row.status = GATE_STATUS.EXITED;
    row.exitTime = new Date().toISOString();
    return { ...row };
  },
  _setStatus(id, status) {
    cabs = cabs.map((c) => (c.id === id ? { ...c, status } : c));
    return cabs.find((c) => c.id === id);
  },
};

/* ── Staff ── */
export const mockStaff = {
  list(params = {}) {
    let rows = [...staff];
    const status = params.status;
    if (status && status !== 'all') {
      rows = rows.filter((r) => r.attendanceStatus === status);
    }
    if (params.search) {
      rows = rows.filter((r) =>
        matchSearch(
          [r.name, r.role, r.building, r.wing, r.flat, r.owner, r.phone, r.aadhaarMasked],
          params.search,
        ),
      );
    }
    rows = sortByField(rows, params.sortBy || 'name', params.sortOrder || 'asc');
    const page = paginate(rows, params);
    const counts = {
      all: staff.length,
      checkedIn: staff.filter((s) => s.attendanceStatus === STAFF_STATUS.CHECKED_IN).length,
      checkedOut: staff.filter((s) => s.attendanceStatus === STAFF_STATUS.CHECKED_OUT).length,
    };
    return { ...page, counts };
  },
  entry(id) {
    const row = staff.find((s) => s.id === id);
    if (!row) {
      const e = new Error('Staff not found');
      e.status = 404;
      throw e;
    }
    if (row.attendanceStatus === STAFF_STATUS.CHECKED_IN) {
      const e = new Error('Staff already checked in');
      e.status = 409;
      throw e;
    }
    row.attendanceStatus = STAFF_STATUS.CHECKED_IN;
    row.checkInTime = new Date().toISOString();
    row.checkOutTime = null;
    return { ...row };
  },
  exit(id) {
    const row = staff.find((s) => s.id === id);
    if (!row) {
      const e = new Error('Staff not found');
      e.status = 404;
      throw e;
    }
    if (row.attendanceStatus !== STAFF_STATUS.CHECKED_IN) {
      const e = new Error('Staff must be checked in before exit');
      e.status = 409;
      throw e;
    }
    row.attendanceStatus = STAFF_STATUS.CHECKED_OUT;
    row.checkOutTime = new Date().toISOString();
    return { ...row };
  },
};
