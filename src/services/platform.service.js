import api from '@/services/api';

export const platformService = {
  dashboard: () => api.get('/platform/dashboard'),
  health: () => api.get('/platform/health'),
  analytics: (key) => api.get(`/platform/analytics/${key}`),
  rollupMetrics: () => api.post('/platform/metrics/rollup'),
  jobs: () => api.get('/platform/jobs'),
  auditLogs: (params) => api.get('/platform/audit-logs', { params }),

  listTenants: (params) => api.get('/platform/tenants', { params }),
  getTenant: (id) => api.get(`/platform/tenants/${id}`),
  createTenant: (data) => api.post('/platform/tenants', data),
  updateTenant: (id, data) => api.patch(`/platform/tenants/${id}`, data),
  provisionTenant: (id) => api.post(`/platform/tenants/${id}/provision`),
  activateTenant: (id) => api.post(`/platform/tenants/${id}/activate`),
  suspendTenant: (id) => api.post(`/platform/tenants/${id}/suspend`),
  reactivateTenant: (id) => api.post(`/platform/tenants/${id}/reactivate`),
  archiveTenant: (id) => api.post(`/platform/tenants/${id}/archive`),
  deleteTenant: (id) => api.post(`/platform/tenants/${id}/delete`),
  cloneDemo: (id, data) => api.post(`/platform/tenants/${id}/clone-demo`, data),
  tenantHealth: (id) => api.get(`/platform/tenants/${id}/health`),
  tenantUsage: (id) => api.get(`/platform/tenants/${id}/usage`),
  impersonate: (id, reason) => api.post(`/platform/tenants/${id}/impersonate`, { reason }),
  endImpersonation: (sessionId) => api.post(`/platform/impersonation/${sessionId}/end`),
  setTenantFlags: (id, overrides) =>
    api.put(`/platform/tenants/${id}/feature-flags`, { overrides }),

  listPlans: () => api.get('/platform/plans'),
  upsertPlan: (data) => api.post('/platform/plans', data),
  listSubscriptions: (params) => api.get('/platform/subscriptions', { params }),
  assignSubscription: (tenantId, planCode) =>
    api.post(`/platform/tenants/${tenantId}/subscription`, { planCode }),
  renewSubscription: (id) => api.post(`/platform/subscriptions/${id}/renew`),
  cancelSubscription: (id) => api.post(`/platform/subscriptions/${id}/cancel`),

  listLicenses: (params) => api.get('/platform/licenses', { params }),
  issueLicense: (tenantId, data) => api.post(`/platform/tenants/${tenantId}/licenses`, data),
  renewLicense: (id) => api.post(`/platform/licenses/${id}/renew`),
  deactivateLicense: (id) => api.post(`/platform/licenses/${id}/deactivate`),

  listFlags: () => api.get('/platform/feature-flags'),
  upsertFlag: (data) => api.post('/platform/feature-flags', data),

  listSettings: () => api.get('/platform/settings'),
  getSettings: (group) => api.get(`/platform/settings/${group}`),
  patchSettings: (group, data) => api.patch(`/platform/settings/${group}`, data),

  getMaintenance: () => api.get('/platform/maintenance-mode'),
  setMaintenance: (data) => api.post('/platform/maintenance-mode', data),

  listAnnouncements: () => api.get('/platform/announcements'),
  createAnnouncement: (data) => api.post('/platform/announcements', data),
  sendAnnouncement: (id) => api.post(`/platform/announcements/${id}/send`),

  listUsers: () => api.get('/platform/users'),
  createUser: (data) => api.post('/platform/users', data),
  updateUser: (id, data) => api.patch(`/platform/users/${id}`, data),
  listRoles: () => api.get('/platform/roles'),

  myFeatures: () => api.get('/me/features'),
};
