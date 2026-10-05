/** Gate entry statuses — match backend PDF exactly */
export const GATE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  INSIDE: 'inside',
  EXITED: 'exited',
};

export const GATE_STATUS_LABEL = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  inside: 'Inside',
  exited: 'Exited',
};

/** Delivery-only: resident asked the guard to keep the parcel at the gate. */
export const DELIVERY_HELD = 'held';

export const STAFF_STATUS = {
  NOT_MARKED: 'not_marked',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
};

export const STAFF_STATUS_LABEL = {
  not_marked: 'Not marked',
  checked_in: 'Checked in',
  checked_out: 'Checked out',
};

export const VISITOR_PURPOSES = [
  'guest',
  'delivery',
  'courier',
  'cab',
  'maid',
  'driver',
  'technician',
  'vendor',
  'other',
];

/** Logged on their own pages (Deliveries, Cab Entry, Staff Entry) — not offered as visitor purposes. */
export const NON_VISITOR_PURPOSES = ['delivery', 'courier', 'cab', 'maid', 'driver', 'technician'];

export const GUARD_VISITOR_PURPOSES = VISITOR_PURPOSES.filter(
  (p) => !NON_VISITOR_PURPOSES.includes(p),
);

export const VEHICLE_TYPES = [
  'car',
  'bike',
  'scooter',
  'ev',
  'commercial',
  'bicycle',
  'other',
];

export function purposeLabel(value) {
  const v = String(value || '').toLowerCase();
  if (!v) return '—';
  return v.charAt(0).toUpperCase() + v.slice(1);
}
