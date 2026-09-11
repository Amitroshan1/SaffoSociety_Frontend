import api from './api';

/* ── Enums ────────────────────────────────────────────────────────────────── */
export const PARKING_ZONE_TYPES = [
  'basement',
  'open',
  'covered',
  'podium',
  'visitor',
  'ev',
  'other',
];

export const SLOT_STATUSES = [
  'available',
  'allocated',
  'reserved',
  'occupied',
  'visitor',
  'maintenance',
  'blocked',
  'inactive',
];

export const SLOT_CATEGORIES = [
  'standard',
  'reserved',
  'visitor',
  'ev',
  'disabled',
  'commercial',
];

export const VEHICLE_TYPES = [
  'car',
  'bike',
  'scooter',
  'ev',
  'commercial',
  'bicycle',
  'other',
];

export const ALLOCATION_STATUSES = ['active', 'transferred', 'revoked', 'expired'];

export const ALLOCATION_TYPES = ['permanent', 'temporary', 'reserved'];

export const VEHICLE_STATUSES = ['active', 'inactive', 'blocked'];

export const VISITOR_PARKING_STATUSES = [
  'requested',
  'active',
  'exited',
  'cancelled',
  'expired',
];

export const PAYMENT_STATUSES = ['not_required', 'pending', 'paid', 'refunded'];

export const PARKING_REPORT_KEYS = [
  'occupancy',
  'available-slots',
  'allocated-slots',
  'visitor-parking',
  'revenue',
  'vehicle-type-summary',
  'reserved-utilization',
  'monthly-statistics',
];

/* ── Admin: zones ─────────────────────────────────────────────────────────── */
export const listParkingZones = (params) => api.get('/parking/zones', { params });
export const createParkingZone = (payload) => api.post('/parking/zones', payload);
export const updateParkingZone = (id, payload) => api.patch(`/parking/zones/${id}`, payload);
export const deleteParkingZone = (id) => api.delete(`/parking/zones/${id}`);

/* ── Admin: slots ─────────────────────────────────────────────────────────── */
export const listParkingSlots = (params) => api.get('/parking/slots', { params });
export const createParkingSlot = (payload) => api.post('/parking/slots', payload);
export const updateParkingSlot = (id, payload) => api.patch(`/parking/slots/${id}`, payload);

/* ── Admin: allocations ───────────────────────────────────────────────────── */
export const listParkingAllocations = (params) => api.get('/parking/allocations', { params });
export const allocateParking = (payload) => api.post('/parking/allocate', payload);
export const transferParking = (payload) => api.post('/parking/transfer', payload);
export const revokeParking = (payload) => api.post('/parking/revoke', payload);

/* ── Admin: vehicles & visitor logs ───────────────────────────────────────── */
export const listParkingVehicles = (params) => api.get('/parking/vehicles', { params });
export const listVisitorParkingLogs = (params) => api.get('/parking/visitor-logs', { params });

export const getParkingDashboard = () => api.get('/parking/dashboard');
export const getParkingReport = (reportKey, params) =>
  api.get(`/parking/reports/${reportKey}`, { params });

/* ── Finance ──────────────────────────────────────────────────────────────── */
export const getParkingRevenue = (params) => api.get('/finance/parking/revenue', { params });
export const listParkingPayments = (params) => api.get('/finance/parking/payments', { params });
export const refundParking = (payload) => api.post('/finance/parking/refund', payload);

/* ── Guard ────────────────────────────────────────────────────────────────── */
export const listTodayGuardParking = () => api.get('/guard/parking/today');
export const recordParkingEntry = (payload) => api.post('/guard/parking/entry', payload);
export const recordParkingExit = (payload) => api.post('/guard/parking/exit', payload);
export const createGuardVisitorParking = (payload) =>
  api.post('/guard/visitor-parking', payload);

/* ── Resident ─────────────────────────────────────────────────────────────── */
export const listResidentParking = (params) => api.get('/resident/parking', { params });
export const listResidentVehicles = (params) => api.get('/resident/vehicles', { params });
export const createResidentVehicle = (payload) => api.post('/resident/vehicles', payload);
export const updateResidentVehicle = (id, payload) =>
  api.patch(`/resident/vehicles/${id}`, payload);
export const createResidentVisitorParking = (payload) =>
  api.post('/resident/visitor-parking', payload);
export const listResidentParkingHistory = (params) =>
  api.get('/resident/parking/history', { params });
export const getResidentParkingReceipt = (id) =>
  api.get(`/resident/parking/receipt/${id}`);

/* ── Helpers ──────────────────────────────────────────────────────────────── */
export function formatFee(minor) {
  const n = Number(minor);
  if (!n || Number.isNaN(n)) return '₹0.00';
  return `₹${(n / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatLabel(value) {
  if (!value) return '-';
  return String(value)
    .split(/[_-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export const SLOT_STATUS_COLORS = {
  available: '#22c55e',
  allocated: '#3b82f6',
  reserved: '#a855f7',
  occupied: '#f59e0b',
  visitor: '#14b8a6',
  maintenance: '#f97316',
  blocked: '#ef4444',
  inactive: '#6b7280',
};

export const ALLOCATION_STATUS_COLORS = {
  active: '#22c55e',
  transferred: '#3b82f6',
  revoked: '#ef4444',
  expired: '#6b7280',
};

export const VEHICLE_STATUS_COLORS = {
  active: '#22c55e',
  inactive: '#6b7280',
  blocked: '#ef4444',
};

export const VISITOR_STATUS_COLORS = {
  requested: '#f59e0b',
  active: '#22c55e',
  exited: '#14b8a6',
  cancelled: '#ef4444',
  expired: '#6b7280',
};
