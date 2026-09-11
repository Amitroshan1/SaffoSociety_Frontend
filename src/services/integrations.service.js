import api from './api';

export const integrationsService = {
  listProviders: (params) => api.get('/platform/integrations/providers', { params }),
  probeProviders: () => api.post('/platform/integrations/providers/probe'),

  listWebhookSubscriptions: () => api.get('/platform/integrations/webhooks/subscriptions'),
  createWebhookSubscription: (data) =>
    api.post('/platform/integrations/webhooks/subscriptions', data),
  testWebhookSubscription: (id) =>
    api.post(`/platform/integrations/webhooks/subscriptions/${id}/test`),
  listWebhookDeliveries: () => api.get('/platform/integrations/webhooks/deliveries'),
  listWebhookDlq: () => api.get('/platform/integrations/webhooks/dlq'),

  listApiClients: () => api.get('/platform/integrations/api-clients'),
  createApiClient: (data) => api.post('/platform/integrations/api-clients', data),
  listApiKeys: (params) => api.get('/platform/integrations/api-keys', { params }),
  createApiKey: (data) => api.post('/platform/integrations/api-keys', data),
  revokeApiKey: (id) => api.post(`/platform/integrations/api-keys/${id}/revoke`),

  listDevices: (params) => api.get('/platform/integrations/devices', { params }),
  removeDevice: (id) => api.post(`/platform/integrations/devices/${id}/remove`),

  listPaymentIntents: (params) =>
    api.get('/platform/integrations/payments/intents', { params }),
  reconcilePayments: () => api.post('/platform/integrations/payments/reconcile'),

  listIdentityLinks: (params) =>
    api.get('/platform/integrations/identity-links', { params }),

  getMetrics: () => api.get('/platform/integrations/metrics'),
  getStorageHealth: () => api.get('/platform/integrations/storage/health'),
};
