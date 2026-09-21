import api from '@/services/api';

/* ── Enums (shared across admin + finance + guard + resident document UI) ─── */
export const DOCUMENT_SCOPES = [
  'society',
  'building',
  'wing',
  'flat',
  'finance',
  'guard',
  'committee',
  'other',
];

export const DOCUMENT_STATUSES = ['draft', 'published', 'archived', 'expired', 'deleted'];

export const DOCUMENT_PERMISSION_TYPES = [
  'everyone',
  'role',
  'building',
  'wing',
  'flat',
  'resident',
];

export const DOCUMENT_REPORT_KEYS = [
  'by-category',
  'downloads',
  'most-viewed',
  'expired',
  'archived',
  'finance-docs',
  'resident-downloads',
  'storage-summary',
];

/** MIME types accepted by the backend (Schemas/document.py ALLOWED_DOC_MIMES). */
export const DOCUMENT_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'text/plain',
  'text/csv',
];

/* ── Admin / finance documents ───────────────────────────────────────────── */
export const listDocuments = (params) => api.get('/documents', { params });
export const createDocument = (payload) => api.post('/documents', payload);
export const getDocument = (id) => api.get(`/documents/${id}`);
export const updateDocument = (id, payload) => api.patch(`/documents/${id}`, payload);
export const deleteDocument = (id) => api.delete(`/documents/${id}`);

export const archiveDocument = (id) => api.post(`/documents/${id}/archive`);
export const restoreDocument = (id) => api.post(`/documents/${id}/restore`);
export const publishDocument = (id) => api.post(`/documents/${id}/publish`);

export const setDocumentPermissions = (id, permissions) =>
  api.put(`/documents/${id}/permissions`, { permissions });

export const addDocumentVersion = (id, payload) => api.post(`/documents/${id}/versions`, payload);
export const listDocumentVersions = (id) => api.get(`/documents/${id}/versions`);

export const getDocumentsDashboard = () => api.get('/documents/dashboard');
export const getDocumentReport = (reportKey, params) =>
  api.get(`/documents/reports/${reportKey}`, { params });

/* ── Document categories ─────────────────────────────────────────────────── */
export const listDocumentCategories = (params) => api.get('/document-categories', { params });
export const createDocumentCategory = (payload) => api.post('/document-categories', payload);
export const updateDocumentCategory = (id, payload) =>
  api.patch(`/document-categories/${id}`, payload);
export const deactivateDocumentCategory = (id) =>
  api.post(`/document-categories/${id}/deactivate`);

/* ── Finance documents ───────────────────────────────────────────────────── */
export const listFinanceDocuments = (params) => api.get('/finance/documents', { params });
export const createFinanceDocument = (payload) => api.post('/finance/documents', payload);
export const getFinanceDocument = (id) => api.get(`/finance/documents/${id}`);
export const downloadFinanceDocument = (id) => api.get(`/finance/documents/${id}/download`);

/* ── Guard documents (read-only) ─────────────────────────────────────────── */
export const listGuardDocuments = (params) => api.get('/guard/documents', { params });
export const getGuardDocument = (id) => api.get(`/guard/documents/${id}`);
export const downloadGuardDocument = (id) => api.get(`/guard/documents/${id}/download`);

/* ── Resident documents ───────────────────────────────────────────────────── */
export const listResidentDocuments = (params) => api.get('/resident/documents', { params });
export const getResidentDocument = (id) => api.get(`/resident/documents/${id}`);
export const downloadResidentDocument = (id) => api.get(`/resident/documents/${id}/download`);
export const favoriteResidentDocument = (id) => api.post(`/resident/documents/${id}/favorite`);

/* ── Helpers ──────────────────────────────────────────────────────────────── */
export function formatFileSize(bytes) {
  const n = Number(bytes);
  if (!n || Number.isNaN(n)) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = n;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/** Trigger a browser download/open using the fileUrl from a download response. */
export function openDownloadedFile(responseData, fallbackUrl) {
  const doc = responseData?.data?.document || responseData?.data || {};
  const url = doc.fileUrl || doc.downloadUrl || fallbackUrl;
  if (url) window.open(url, '_blank', 'noopener');
}
