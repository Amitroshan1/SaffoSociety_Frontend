export const GUARD_PERMISSIONS = [
  'dashboard.view',
  'visitor.view',
  'visitor.approve',
  'visitor.reject',
  'delivery.view',
  'cab.view',
  'staff.view',
  'sos.view',
  'sos.resolve',
  'schedule.view',
  'booking.view',
  'booking.manage',
  'parking.view',
  'parking.manage',
  'documents.view',
  'notifications.view',
  'profile.view',
];

export const RESIDENT_PERMISSIONS = [
  'dashboard.view',
  'visitor.view',
  'visitor.create',
  'delivery.view',
  'cab.view',
  'booking.view',
  'booking.create',
  'parking.view',
  'documents.view',
  'notifications.view',
  'profile.view',
  'sos.view',
  'facility.view',
  'clearance.view',
];

export const GUARD_ROUTE_PERMISSION = {
  dashboard: 'dashboard.view',
  visitors: 'visitor.view',
  delivery: 'delivery.view',
  'staff-entry': 'staff.view',
  'cab-entry': 'cab.view',
  schedule: 'schedule.view',
  documents: 'documents.view',
  bookings: 'booking.view',
  parking: 'parking.view',
  notifications: 'notifications.view',
  sos: 'sos.view',
  profile: 'profile.view',
};

export const GUARD_NAV_PERMISSION = {
  Dashboard: 'dashboard.view',
  Visitors: 'visitor.view',
  Deliveries: 'delivery.view',
  'Staff Entry': 'staff.view',
  'Cab Entry': 'cab.view',
  'SOS Alerts': 'sos.view',
  'My Schedule': 'schedule.view',
  Bookings: 'booking.view',
  Parking: 'parking.view',
  Documents: 'documents.view',
  'My Profile': 'profile.view',
  Notifications: 'notifications.view',
};

export const RESIDENT_ROUTE_PERMISSION = {
  dashboard: 'dashboard.view',
  visitors: 'visitor.view',
  'visitor-invitations': 'visitor.create',
  'visitor-history': 'visitor.view',
  sos: 'sos.view',
  facilities: 'facility.view',
  bookings: 'booking.view',
  parking: 'parking.view',
  clearance: 'clearance.view',
  notifications: 'notifications.view',
  profile: 'profile.view',
};

export const RESIDENT_NAV_PERMISSION = {
  Dashboard: 'dashboard.view',
  Visitors: 'visitor.view',
  SOS: 'sos.view',
  Facilities: 'facility.view',
  Parking: 'parking.view',
  'Move-out Clearance': 'clearance.view',
  'My Profile': 'profile.view',
};

/**
 * UI permission checks fail closed.
 * An empty list, a missing name, or an unknown name does not grant access.
 * These checks only hide UI. The backend still enforces its own roles.
 */
export function permissionGranted(permissions, permission) {
  if (!permission || typeof permission !== 'string') return false;
  if (!Array.isArray(permissions) || permissions.length === 0) return false;
  return permissions.includes(permission);
}
