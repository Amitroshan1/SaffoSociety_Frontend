import api from './api';

/* ── Enums ────────────────────────────────────────────────────────────────── */
export const NOTIFICATION_CHANNELS = ['in_app', 'email', 'sms', 'push', 'webhook'];

export const NOTIFICATION_STATUSES = [
  'pending',
  'queued',
  'sending',
  'delivered',
  'read',
  'failed',
  'cancelled',
  'archived',
];

export const DELIVERY_STATUSES = ['queued', 'sending', 'delivered', 'failed', 'cancelled'];

export const NOTIFICATION_PRIORITIES = ['low', 'normal', 'high', 'critical'];

export const NOTIFICATION_CATEGORIES = [
  'system',
  'billing',
  'complaint',
  'visitor',
  'notice',
  'document',
  'amenity',
  'parking',
  'auth',
  'emergency',
  'marketing',
  'other',
];

export const TARGET_TYPES = [
  'society',
  'building',
  'wing',
  'flat',
  'resident',
  'role',
  'user',
];

export const SCHEDULE_STATUSES = [
  'scheduled',
  'processing',
  'completed',
  'cancelled',
  'failed',
];

export const RECURRENCE_OPTIONS = ['none', 'daily', 'weekly', 'monthly'];

export const NOTIFICATION_REPORT_KEYS = [
  'summary',
  'delivery-success',
  'failed-deliveries',
  'channel-usage',
  'read-rate',
  'unread',
  'scheduled',
  'volume',
];

export const TEMPLATE_PLACEHOLDERS = [
  '{{resident_name}}',
  '{{society_name}}',
  '{{building}}',
  '{{wing}}',
  '{{flat}}',
  '{{amount}}',
  '{{invoice_number}}',
  '{{visitor_name}}',
  '{{booking_number}}',
  '{{parking_slot}}',
  '{{document_name}}',
  '{{notice_title}}',
];

/* ── Admin: templates ─────────────────────────────────────────────────────── */
export const listNotificationTemplates = (params) =>
  api.get('/notifications/templates', { params });
export const createNotificationTemplate = (payload) =>
  api.post('/notifications/templates', payload);
export const updateNotificationTemplate = (id, payload) =>
  api.patch(`/notifications/templates/${id}`, payload);
export const deleteNotificationTemplate = (id) =>
  api.delete(`/notifications/templates/${id}`);

/* ── Admin: broadcast / schedule / queue ──────────────────────────────────── */
export const broadcastNotification = (payload) =>
  api.post('/notifications/broadcast', payload);
export const scheduleNotification = (payload) =>
  api.post('/notifications/schedule', payload);
export const listScheduledNotifications = (params) =>
  api.get('/notifications/scheduled', { params });
export const cancelScheduledNotification = (id) =>
  api.post(`/notifications/scheduled/${id}/cancel`);
export const listNotifications = (params) => api.get('/notifications', { params });
export const listNotificationDeliveries = (params) =>
  api.get('/notifications/deliveries', { params });
export const retryNotificationDelivery = (id) =>
  api.post(`/notifications/retry/${id}`);
export const processDueNotifications = () => api.post('/notifications/process-due');

export const getNotificationsDashboard = () => api.get('/notifications/dashboard');
export const getNotificationReport = (reportKey, params) =>
  api.get(`/notifications/reports/${reportKey}`, { params });

/* ── Finance ──────────────────────────────────────────────────────────────── */
export const sendPaymentReminder = (payload) =>
  api.post('/finance/notifications/payment-reminder', payload);
export const sendInvoiceNotification = (payload) =>
  api.post('/finance/notifications/invoice', payload);
export const sendReceiptNotification = (payload) =>
  api.post('/finance/notifications/receipt', payload);
export const listFinanceNotificationHistory = (params) =>
  api.get('/finance/notifications/history', { params });

/* ── Guard ────────────────────────────────────────────────────────────────── */
export const listGuardNotifications = (params) =>
  api.get('/guard/notifications', { params });
export const markGuardNotificationRead = (id) =>
  api.post(`/guard/notifications/${id}/read`);

/* ── Resident ─────────────────────────────────────────────────────────────── */
export const listResidentNotifications = (params) =>
  api.get('/resident/notifications', { params });
export const getResidentNotification = (id) =>
  api.get(`/resident/notifications/${id}`);
export const markResidentNotificationRead = (id) =>
  api.post(`/resident/notifications/${id}/read`);
export const markAllResidentNotificationsRead = () =>
  api.post('/resident/notifications/mark-all-read');
export const archiveResidentNotification = (id) =>
  api.post(`/resident/notifications/${id}/archive`);
export const getResidentNotificationPreferences = () =>
  api.get('/resident/notification-preferences');
export const updateResidentNotificationPreferences = (payload) =>
  api.patch('/resident/notification-preferences', payload);

/* ── Helpers ──────────────────────────────────────────────────────────────── */
export function formatLabel(value) {
  if (!value) return '-';
  return String(value)
    .split(/[_-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export const NOTIFICATION_STATUS_COLORS = {
  pending: '#6b7280',
  queued: '#3b82f6',
  sending: '#a855f7',
  delivered: '#22c55e',
  read: '#14b8a6',
  failed: '#ef4444',
  cancelled: '#f97316',
  archived: '#9ca3af',
};

export const PRIORITY_COLORS = {
  low: '#6b7280',
  normal: '#3b82f6',
  high: '#f59e0b',
  critical: '#ef4444',
};
