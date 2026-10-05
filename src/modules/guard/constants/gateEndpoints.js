/** Guard gate module endpoints — match backend PDF */
export const GUARD_GATE_ENDPOINTS = {
  visitors: '/guard/visitors',
  visitorRecent: '/guard/visitors/recent',
  visitorById: (id) => `/guard/visitors/${id}`,
  visitorCheckIn: (id) => `/guard/visitors/${id}/check-in`,
  visitorExit: (id) => `/guard/visitors/${id}/exit`,

  deliveries: '/guard/deliveries',
  deliveryById: (id) => `/guard/deliveries/${id}`,
  deliveryCheckIn: (id) => `/guard/deliveries/${id}/check-in`,
  deliveryExit: (id) => `/guard/deliveries/${id}/exit`,
  /** Not in the backend PDF yet — needs backend support for the "held" status. */
  deliveryHold: (id) => `/guard/deliveries/${id}/hold`,
  deliveryCollect: (id) => `/guard/deliveries/${id}/collect`,

  cabs: '/guard/cabs',
  cabById: (id) => `/guard/cabs/${id}`,
  cabCheckIn: (id) => `/guard/cabs/${id}/check-in`,
  cabExit: (id) => `/guard/cabs/${id}/exit`,

  staff: '/guard/staff',
  staffEntry: (id) => `/guard/staff/${id}/entry`,
  staffExit: (id) => `/guard/staff/${id}/exit`,
};
