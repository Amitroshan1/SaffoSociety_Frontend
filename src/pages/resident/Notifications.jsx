import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, ListToolbar, Pagination } from '../../components/common/index.js';
import { useListQuery } from '../../hooks/useListQuery.js';
import { normalizePagination } from '../../utils/listQuery.js';
import {
  archiveResidentNotification,
  formatLabel,
  listResidentNotifications,
  markAllResidentNotificationsRead,
  markResidentNotificationRead,
} from '../../services/notification.service.js';

const columns = [
  { key: 'title', label: 'Title', render: (row) => row.title || row.subject || 'Untitled notification' },
  { key: 'category', label: 'Category', render: (row) => formatLabel(row.category || 'system') },
  { key: 'channel', label: 'Channel', render: (row) => formatLabel(row.channel || 'in_app') },
  { key: 'status', label: 'Status', render: (row) => formatLabel(row.status || (row.isRead ? 'read' : 'unread')) },
  { key: 'createdAt', label: 'Created', render: (row) => row.createdAt || '-' },
];

export default function ResidentNotificationsPage() {
  const navigate = useNavigate();
  const { state, params, setPage, setSearch, setFilter } = useListQuery({
    sortBy: 'created_at',
    sortOrder: 'desc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const finalParams = { ...params };
      if (state.channel) finalParams.channel = state.channel;
      if (state.status) finalParams.status = state.status;
      const res = await listResidentNotifications(finalParams);
      setRows(res.data?.data?.notifications || []);
      setPagination(normalizePagination(res.data?.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch notifications');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [params, state.channel, state.status]);

  useEffect(() => {
    load();
  }, [load]);

  const onMarkAllRead = async () => {
    setBusy(true);
    setError('');
    try {
      await markAllResidentNotificationsRead();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark all as read');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="resident-page-title">Notification Center</h1>
      <p className="resident-page-subtitle">
        Track updates from billing, visitors, notices, and operations.
      </p>

      {error && <p className="resident-error">{error}</p>}

      <ListToolbar
        search={state.search}
        onSearch={setSearch}
        searchPlaceholder="Search notifications"
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'unread', label: 'Unread' },
              { value: 'read', label: 'Read' },
              { value: 'archived', label: 'Archived' },
            ],
          },
          {
            key: 'channel',
            label: 'Channel',
            options: [
              { value: 'in_app', label: 'In app' },
              { value: 'email', label: 'Email' },
              { value: 'sms', label: 'SMS' },
              { value: 'push', label: 'Push' },
            ],
          },
        ]}
        filterValues={state}
        onFilterChange={setFilter}
      />

      <div className="resident-actions resident-actions-row" style={{ marginBottom: 12 }}>
        <button type="button" className="btn-primary crud-btn-sm" onClick={onMarkAllRead} disabled={busy}>
          Mark all read
        </button>
        <button
          type="button"
          className="resident-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          onClick={() => navigate('/resident/notification-preferences')}
        >
          Preferences →
        </button>
      </div>

      <DataTable
        columns={[
          ...columns,
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
              <div className="resident-inline-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await markResidentNotificationRead(row.id);
                      await load();
                    } catch (err) {
                      setError(err.response?.data?.message || 'Failed to mark as read');
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Mark read
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await archiveResidentNotification(row.id);
                      await load();
                    } catch (err) {
                      setError(err.response?.data?.message || 'Failed to archive');
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Archive
                </button>
              </div>
            ),
          },
        ]}
        rows={rows}
        loading={loading}
        onRowClick={(row) => navigate(`/resident/notifications/${row.id}`)}
        emptyTitle="No notifications found"
      />

      <Pagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.total}
        totalPages={pagination.totalPages}
        hasNext={pagination.hasNext}
        hasPrev={pagination.hasPrev}
        onPageChange={setPage}
      />
    </div>
  );
}
