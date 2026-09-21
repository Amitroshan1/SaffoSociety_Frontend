import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigateGuard } from '@/constants/guardRoutes.js';
import '@/styles/guard/guard-main.css';
import '@/styles/common/crud.css';
import Sidebar from '@/components/guard/Sidebar';
import DashboardHeader from '@/components/guard/DashboardHeader';
import { SearchInput } from '@/components/common/index.js';
import {
  formatLabel,
  listGuardNotifications,
  markGuardNotificationRead,
} from '@/services/notification.service.js';

export default function GuardNotificationsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listGuardNotifications({ page: 1, pageSize: 50, search: search.trim() || undefined });
      setRows(data.data?.notifications || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load guard notifications');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSidebarNav(label) {
    navigateGuard(navigate, label);
  }

  const onRead = async (id) => {
    try {
      await markGuardNotificationRead(id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark as read');
    }
  };

  return (
    <div className="gm-root">
      <Sidebar activePage="Notifications" onNavigate={handleSidebarNav} />
      <div className="gm-content">
        <DashboardHeader />
        <main className="gm-main">
          <h2 className="gm-park-page-title">Notifications</h2>
          {error && <div style={{ color: '#fca5a5', marginBottom: 10 }}>{error}</div>}

          <div className="gm-park-toolbar">
            <div className="gm-park-search">
              <SearchInput value={search} onChange={setSearch} placeholder="Search notifications" />
            </div>
          </div>

          {loading ? (
            <p>Loading…</p>
          ) : (
            <div className="glass-card gm-park-table-card">
              <table className="crud-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5}>No notifications found.</td>
                    </tr>
                  )}
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{row.title || 'Untitled notification'}</div>
                        <div style={{ opacity: 0.75, fontSize: 13 }}>{row.body || row.message || '-'}</div>
                      </td>
                      <td>{formatLabel(row.category)}</td>
                      <td>{formatLabel(row.status || (row.isRead ? 'read' : 'unread'))}</td>
                      <td>{row.createdAt || '-'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {!row.isRead && row.status !== 'read' ? (
                          <button type="button" className="btn-primary" onClick={() => onRead(row.id)}>
                            Mark read
                          </button>
                        ) : (
                          <span style={{ opacity: 0.75 }}>Read</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
