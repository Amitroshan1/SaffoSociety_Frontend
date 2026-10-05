/** Shared guard panel navigation map. */
export const GUARD_ROUTES = {
  Dashboard: '/guard/dashboard',
  Visitors: '/guard/visitors',
  Deliveries: '/guard/delivery',
  'Add Delivery': '/guard/delivery?tab=add',
  'Staff Entry': '/guard/staff-entry',
  Staff: '/guard/staff-entry',
  'Cab Entry': '/guard/cab-entry?tab=add',
  'My Schedule': '/guard/schedule',
  Documents: '/guard/documents',
  Notifications: '/guard/notifications',
  Bookings: '/guard/bookings',
  Parking: '/guard/parking',
  'SOS Alerts': '/guard/sos',
  'My Profile': '/guard/profile',
};

export function navigateGuard(navigate, label) {
  const path = GUARD_ROUTES[label];
  if (path) navigate(path);
}
