/** Dashboard, profile, parking, documents, move-out — 24 Sep 2026 contracts. */
export const GUARD_PANEL_ENDPOINTS = {
  dashboard: '/guard/dashboard',

  profile: '/guard/profile',
  profilePhoto: '/guard/profile/photo',

  parkingResidents: '/guard/parking/residents',
  parkingResidentEntry: (id) => `/guard/parking/residents/${id}/entry`,
  parkingResidentExit: (id) => `/guard/parking/residents/${id}/exit`,
  parkingVisitors: '/guard/parking/visitors',
  parkingVisitorEntry: '/guard/parking/visitors/entry',
  parkingVisitorExit: (logId) => `/guard/parking/visitors/${logId}/exit`,
  parkingLogs: '/guard/parking/logs',

  documents: '/guard/documents',
  documentById: (id) => `/guard/documents/${id}`,

  moveOut: '/guard/move-out',
  moveOutById: (id) => `/guard/move-out/${id}`,
  moveOutAllow: (id) => `/guard/move-out/${id}/allow`,
};
