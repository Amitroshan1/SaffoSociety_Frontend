/**
 * Guard notifications page.
 * The existing inbox routes are GET/POST /resident/notifications*.
 * There is no /guard/notifications API.
 */
import api from '@/services/api/axios';
import { apiError } from '@/modules/guard/services/core/http';

export const formatLabel = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

function mapNote(row) {
  if (!row) return null;
  const isRead = Boolean(row.is_read ?? row.isRead);
  return {
    ...row,
    isRead,
    status: isRead ? 'read' : 'unread',
    createdAt: row.created_at || row.createdAt || '',
    body: row.body || row.message || '',
  };
}

function inboxRows(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.notifications)) return body.notifications;
  return [];
}

export const listGuardNotifications = async (params = {}) => {
  try {
    const res = await api.get('/resident/notifications');
    let list = inboxRows(res.data).map(mapNote).filter(Boolean);
    const q = String(params.search || '').trim().toLowerCase();
    if (q) {
      list = list.filter(
        (n) =>
          String(n.title || '').toLowerCase().includes(q) ||
          String(n.body || '').toLowerCase().includes(q),
      );
    }
    return { data: { data: { notifications: list } } };
  } catch (err) {
    throw apiError(err, 'Failed to load notifications');
  }
};

export const markGuardNotificationRead = async (id) => {
  try {
    const res = await api.post(`/resident/notifications/${id}/read`);
    const row = res.data?.data || res.data;
    return mapNote(row);
  } catch (err) {
    throw apiError(err, 'Failed to mark as read');
  }
};
