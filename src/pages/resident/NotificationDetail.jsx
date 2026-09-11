import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EmptyState, SkeletonLoader } from '../../components/common/index.js';
import {
  archiveResidentNotification,
  formatLabel,
  getResidentNotification,
  markResidentNotificationRead,
} from '../../services/notification.service.js';

export default function ResidentNotificationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getResidentNotification(id);
      setNotification(res.data?.data?.notification || res.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notification');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onMarkRead = async () => {
    setBusy(true);
    setError('');
    try {
      await markResidentNotificationRead(id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark as read');
    } finally {
      setBusy(false);
    }
  };

  const onArchive = async () => {
    setBusy(true);
    setError('');
    try {
      await archiveResidentNotification(id);
      navigate('/resident/notifications');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to archive notification');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <SkeletonLoader rows={5} />;
  if (error || !notification) return <EmptyState title="Notification unavailable" description={error} />;

  return (
    <div>
      <button type="button" onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, marginBottom: 12 }}>
        ← Back
      </button>

      <h1 style={{ marginBottom: 4 }}>{notification.title || notification.subject || 'Notification'}</h1>
      <p style={{ color: '#6b7280', margin: '0 0 12px' }}>
        {formatLabel(notification.category || 'system')} · {formatLabel(notification.channel || 'in_app')} · {formatLabel(notification.status || (notification.isRead ? 'read' : 'unread'))}
      </p>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, whiteSpace: 'pre-wrap' }}>
        {notification.body || notification.message || '-'}
      </div>

      <div style={{ marginTop: 12, color: '#6b7280', fontSize: 13 }}>
        Received: {notification.createdAt || '-'}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button type="button" className="btn-primary" onClick={onMarkRead} disabled={busy}>
          Mark read
        </button>
        <button type="button" onClick={onArchive} disabled={busy} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 12px' }}>
          Archive
        </button>
      </div>

      <p style={{ marginTop: 20 }}>
        <Link to="/resident/notification-preferences">Manage notification preferences</Link>
      </p>
    </div>
  );
}
