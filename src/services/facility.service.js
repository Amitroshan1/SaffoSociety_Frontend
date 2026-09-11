import api from './api';

/* ── Enums ────────────────────────────────────────────────────────────────── */
export const FACILITY_CATEGORIES = [
  'clubhouse',
  'gym',
  'swimming_pool',
  'banquet_hall',
  'sports_court',
  'garden',
  'party_hall',
  'guest_room',
  'community_hall',
  'other',
];

export const FACILITY_STATUSES = ['active', 'inactive', 'maintenance', 'disabled'];

export const BOOKING_STATUSES = [
  'pending',
  'approved',
  'confirmed',
  'checked_in',
  'checked_out',
  'completed',
  'cancelled',
  'rejected',
  'expired',
];

export const PAYMENT_STATUSES = ['not_required', 'pending', 'paid', 'refunded', 'failed'];

export const FACILITY_REPORT_KEYS = [
  'booking-summary',
  'revenue-summary',
  'popular-amenities',
  'peak-hours',
  'cancelled-bookings',
  'maintenance-utilization',
  'resident-usage',
  'amenity-occupancy',
];

export const WEEK_DAYS = [
  { value: '0', label: 'Sun' },
  { value: '1', label: 'Mon' },
  { value: '2', label: 'Tue' },
  { value: '3', label: 'Wed' },
  { value: '4', label: 'Thu' },
  { value: '5', label: 'Fri' },
  { value: '6', label: 'Sat' },
];

/* ── Admin: facilities ───────────────────────────────────────────────────── */
export const listFacilities = (params) => api.get('/facilities', { params });
export const createFacility = (payload) => api.post('/facilities', payload);
export const getFacility = (id) => api.get(`/facilities/${id}`);
export const updateFacility = (id, payload) => api.patch(`/facilities/${id}`, payload);
export const deleteFacility = (id) => api.delete(`/facilities/${id}`);

export const generateFacilitySlots = (id, payload) => api.post(`/facilities/${id}/slots`, payload);
export const addFacilityMaintenance = (id, payload) =>
  api.post(`/facilities/${id}/maintenance`, payload);
export const listFacilityMaintenance = (id) => api.get(`/facilities/${id}/maintenance`);
export const deleteFacilityMaintenance = (blockId) =>
  api.delete(`/facilities/maintenance/${blockId}`);

export const getFacilitiesDashboard = () => api.get('/facilities/dashboard');
export const getFacilityReport = (reportKey, params) =>
  api.get(`/facilities/reports/${reportKey}`, { params });

/* ── Admin: bookings ─────────────────────────────────────────────────────── */
export const listBookings = (params) => api.get('/bookings', { params });
export const getBooking = (id) => api.get(`/bookings/${id}`);
export const approveBooking = (id) => api.post(`/bookings/${id}/approve`);
export const rejectBooking = (id, reason) => api.post(`/bookings/${id}/reject`, { reason });

/* ── Finance ─────────────────────────────────────────────────────────────── */
export const getFacilityRevenue = (params) => api.get('/finance/facilities/revenue', { params });
export const listFacilityPayments = (params) => api.get('/finance/facilities/payments', { params });
export const refundFacilityBooking = (payload) => api.post('/finance/facilities/refund', payload);

/* ── Guard ───────────────────────────────────────────────────────────────── */
export const listTodayGuardBookings = () => api.get('/guard/bookings/today');
export const checkinBooking = (id) => api.post(`/guard/bookings/${id}/checkin`);
export const checkoutBooking = (id) => api.post(`/guard/bookings/${id}/checkout`);

/* ── Resident ────────────────────────────────────────────────────────────── */
export const listResidentFacilities = (params) => api.get('/resident/facilities', { params });
export const getResidentFacility = (id, params) =>
  api.get(`/resident/facilities/${id}`, { params });
export const createResidentBooking = (payload) => api.post('/resident/bookings', payload);
export const listResidentBookings = (params) => api.get('/resident/bookings', { params });
export const getResidentBooking = (id) => api.get(`/resident/bookings/${id}`);
export const cancelResidentBooking = (id, reason) =>
  api.post(`/resident/bookings/${id}/cancel`, { reason });
export const getResidentBookingReceipt = (id) => api.get(`/resident/bookings/${id}/receipt`);

/* ── Helpers ──────────────────────────────────────────────────────────────── */
export function formatAmount(value) {
  const n = Number(value);
  if (!n || Number.isNaN(n)) return 'Free';
  return `₹${n.toLocaleString('en-IN')}`;
}

export function formatCategory(category) {
  if (!category) return '-';
  return category
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function formatAvailableDays(availableDays) {
  if (!availableDays) return 'All week';
  const days = String(availableDays).split('');
  if (days.length === 7) return 'All week';
  const map = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
  return days.map((d) => map[d] || d).join(', ');
}

export const BOOKING_STATUS_COLORS = {
  pending: '#f59e0b',
  approved: '#3b82f6',
  confirmed: '#22c55e',
  checked_in: '#a855f7',
  checked_out: '#14b8a6',
  completed: '#22c55e',
  cancelled: '#ef4444',
  rejected: '#ef4444',
  expired: '#6b7280',
};

export const FACILITY_STATUS_COLORS = {
  active: '#22c55e',
  inactive: '#6b7280',
  maintenance: '#f59e0b',
  disabled: '#ef4444',
};

/* Back-compat aliases */
export const AMENITY_CATEGORIES = FACILITY_CATEGORIES;
export const AMENITY_STATUSES = FACILITY_STATUSES;
export const AMENITY_REPORT_KEYS = FACILITY_REPORT_KEYS;
export const AMENITY_STATUS_COLORS = FACILITY_STATUS_COLORS;
export const listAmenities = listFacilities;
export const createAmenity = createFacility;
export const getAmenity = getFacility;
export const updateAmenity = updateFacility;
export const deleteAmenity = deleteFacility;
export const generateAmenitySlots = generateFacilitySlots;
export const addAmenityMaintenance = addFacilityMaintenance;
export const listAmenityMaintenance = listFacilityMaintenance;
export const deleteAmenityMaintenance = deleteFacilityMaintenance;
export const getAmenitiesDashboard = getFacilitiesDashboard;
export const getAmenityReport = getFacilityReport;
export const getAmenityRevenue = getFacilityRevenue;
export const listAmenityPayments = listFacilityPayments;
export const refundAmenityBooking = refundFacilityBooking;
export const listResidentAmenities = listResidentFacilities;
export const getResidentAmenity = getResidentFacility;
