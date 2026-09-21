import api from '@/services/api';

/* ── Enums (shared across admin + resident notice UI) ────────────────────── */
export const NOTICE_CATEGORIES = [
  'general',
  'maintenance',
  'emergency',
  'events',
  'committee',
  'security',
  'water',
  'electricity',
  'parking',
  'festival',
  'finance',
  'other',
];

export const NOTICE_PRIORITIES = ['low', 'normal', 'high', 'critical'];

export const NOTICE_STATUSES = [
  'draft',
  'scheduled',
  'published',
  'expired',
  'archived',
  'cancelled',
];

export const NOTICE_TARGET_TYPES = [
  'society',
  'building',
  'wing',
  'flat',
  'resident',
  'committee_role',
];

export const NOTICE_REPORT_KEYS = [
  'read-percentage',
  'unread-residents',
  'acknowledgement-status',
  'published-notices',
  'expired-notices',
  'category-summary',
  'priority-summary',
];

/* ── Admin / finance notices ──────────────────────────────────────────────── */
export const listNotices = (params) => api.get('/notices', { params });
export const getNotice = (id) => api.get(`/notices/${id}`);
export const createNotice = (payload) => api.post('/notices', payload);
export const updateNotice = (id, payload) => api.patch(`/notices/${id}`, payload);

export const publishNotice = (id, payload) => api.post(`/notices/${id}/publish`, payload || {});
export const cancelNotice = (id, payload) => api.post(`/notices/${id}/cancel`, payload || {});
export const archiveNotice = (id, payload) => api.post(`/notices/${id}/archive`, payload || {});
export const pinNotice = (id, payload) => api.post(`/notices/${id}/pin`, payload || {});
export const unpinNotice = (id) => api.post(`/notices/${id}/unpin`);

export const setNoticeTargets = (id, targets) => api.put(`/notices/${id}/targets`, { targets });

export const addNoticeAttachment = (id, payload) => api.post(`/notices/${id}/attachments`, payload);
export const deleteNoticeAttachment = (id, attachmentId) =>
  api.delete(`/notices/${id}/attachments/${attachmentId}`);

export const getNoticeReads = (id, params) => api.get(`/notices/${id}/reads`, { params });
export const getNoticeAcknowledgements = (id, params) =>
  api.get(`/notices/${id}/acknowledgements`, { params });

export const getNoticesDashboard = () => api.get('/notices/dashboard');
export const getNoticeReport = (reportKey, params) =>
  api.get(`/notices/reports/${reportKey}`, { params });

export const processDueNotices = () => api.post('/notices/process-due');

/* ── Resident notices ─────────────────────────────────────────────────────── */
export const listResidentNotices = (params) => api.get('/resident/notices', { params });
export const getResidentPinnedNotices = (params) => api.get('/resident/notices/pinned', { params });
export const getResidentUnreadNotices = (params) => api.get('/resident/notices/unread', { params });
export const getResidentArchivedNotices = (params) => api.get('/resident/notices/archive', { params });
export const getResidentNotice = (id) => api.get(`/resident/notices/${id}`);
export const markResidentNoticeRead = (id) => api.post(`/resident/notices/${id}/read`);
export const acknowledgeResidentNotice = (id) => api.post(`/resident/notices/${id}/acknowledge`);
export const getResidentNoticeAttachments = (id) => api.get(`/resident/notices/${id}/attachments`);
