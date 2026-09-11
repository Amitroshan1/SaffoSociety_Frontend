import { useEffect, useState } from 'react';
import { Megaphone, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import { EmptyState, SkeletonLoader } from '../../../components/common/index.js';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes.js';
import {
  formatLabel,
  getNotificationsDashboard,
} from '../../../services/notification.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const LINKS = [
  { id: 'notification-templates', label: 'Templates' },
  { id: 'notification-scheduled', label: 'Scheduled' },
  { id: 'notification-deliveries', label: 'Delivery queue' },
];

export default function NotificationsDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    getNotificationsDashboard()
      .then((r) => {
        if (mounted) setStats(r.data?.data || null);
      })
      .catch((err) => {
        if (mounted) setError(err.response?.data?.message || 'Failed to load dashboard');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const recent = stats?.recentNotifications || stats?.recent || [];

  return (
    <AppShell active="notifications" breadcrumb={[{ label: 'Home' }, { label: 'Notifications' }]}>
      <PageHeader
        icon={Megaphone}
        iconColor="#fcd34d"
        title="Notifications Dashboard"
        subtitle="Templates, broadcasts, delivery health, and communication volume."
        action={
          <button
            className="btn-primary"
            type="button"
            onClick={() => navigate(ADMIN_ROUTES['notification-broadcast'])}
          >
            <Plus size={14} /> Broadcast
          </button>
        }
      />

      {error && <p style={{ color: '#fca5a5' }}>{error}</p>}
      {loading && <SkeletonLoader rows={4} />}

      {!loading && !stats && !error && (
        <EmptyState title="No notification data" description="Dashboard metrics will appear once notifications are sent." />
      )}

      {!loading && stats && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div className="crud-stat-card">Total: {stats.totalNotifications ?? stats.total ?? 0}</div>
            <div className="crud-stat-card">Queued: {stats.queued ?? 0}</div>
            <div className="crud-stat-card">Delivered: {stats.delivered ?? 0}</div>
            <div className="crud-stat-card">Failed: {stats.failed ?? 0}</div>
            <div className="crud-stat-card">Unread: {stats.unread ?? 0}</div>
            <div className="crud-stat-card">Scheduled: {stats.scheduled ?? 0}</div>
            <div className="crud-stat-card">Templates: {stats.templates ?? stats.totalTemplates ?? 0}</div>
            <div className="crud-stat-card">Today: {stats.todayCount ?? stats.sentToday ?? 0}</div>
          </div>

          <section className="glass-card" style={{ padding: 12, borderRadius: 16, marginBottom: 16 }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'nowrap',
                gap: 8,
                alignItems: 'center',
                overflowX: 'auto',
              }}
            >
              {LINKS.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  className="btn-primary crud-btn-sm"
                  style={{ flex: '1 1 0', justifyContent: 'center', minWidth: 0 }}
                  onClick={() => ADMIN_ROUTES[link.id] && navigate(ADMIN_ROUTES[link.id])}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </section>

          <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
            <h3 style={{ marginTop: 0 }}>Recent notifications</h3>
            {recent.length ? (
              <div className="crud-table-wrap">
                <table className="crud-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((n) => (
                      <tr key={n.id}>
                        <td>{n.title}</td>
                        <td>{formatLabel(n.category)}</td>
                        <td>{formatLabel(n.priority)}</td>
                        <td>{formatLabel(n.status)}</td>
                        <td>{n.createdAt || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: 'var(--t3)' }}>No recent notifications.</p>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
