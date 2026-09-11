import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import {
  DataTable,
  FilterBar,
  Pagination,
  SearchInput,
} from '../../../components/common/index.js';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes.js';
import { useListQuery } from '../../../hooks/useListQuery.js';
import { normalizePagination } from '../../../utils/listQuery.js';
import {
  DELIVERY_STATUSES,
  NOTIFICATION_CHANNELS,
  formatLabel,
  listNotificationDeliveries,
  processDueNotifications,
  retryNotificationDelivery,
} from '../../../services/notification.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

export default function DeliveryQueuePage() {
  const navigate = useNavigate();
  const { state, params, setPage, setSearch, setSort, setFilter } = useListQuery({
    sortBy: 'created_at',
    sortOrder: 'desc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const finalParams = { ...params };
      if (state.status) finalParams.status = state.status;
      if (state.channel) finalParams.channel = state.channel;
      const { data } = await listNotificationDeliveries(finalParams);
      setRows(data.data?.deliveries || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch deliveries');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [params, state.status, state.channel]);

  useEffect(() => {
    load();
  }, [load]);

  const onRetry = async (row) => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await retryNotificationDelivery(row.id);
      setSuccess('Retry queued');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Retry failed');
    } finally {
      setBusy(false);
    }
  };

  const onProcessDue = async () => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await processDueNotifications();
      setSuccess('Due notifications processed');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Process failed');
    } finally {
      setBusy(false);
    }
  };

  const COLUMNS = [
    {
      key: 'notificationTitle',
      label: 'Notification',
      render: (r) => r.notificationTitle || r.title || r.notificationId || '-',
    },
    { key: 'channel', label: 'Channel', render: (r) => formatLabel(r.channel) },
    {
      key: 'recipient',
      label: 'Recipient',
      render: (r) => r.recipientAddress || r.recipientUserId || r.recipientResidentId || '-',
    },
    { key: 'status', label: 'Status', render: (r) => formatLabel(r.status) },
    {
      key: 'attempts',
      label: 'Attempts',
      render: (r) => `${r.attemptCount ?? 0}/${r.maxAttempts ?? 3}`,
    },
    { key: 'lastAttemptAt', label: 'Last attempt', render: (r) => r.lastAttemptAt || '-' },
    {
      key: 'errorMessage',
      label: 'Error',
      render: (r) => r.errorMessage || '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) =>
        r.status === 'failed' ? (
          <button
            type="button"
            className="crud-btn crud-btn-ghost"
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              onRetry(r);
            }}
          >
            Retry
          </button>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <AppShell
      active="notifications"
      breadcrumb={[{ label: 'Home' }, { label: 'Notifications' }, { label: 'Delivery queue' }]}
    >
      <PageHeader
        icon={Inbox}
        iconColor="#fcd34d"
        title="Delivery Queue"
        subtitle="Track channel deliveries and retry failed attempts."
        action={
          <button className="btn-primary" type="button" onClick={onProcessDue} disabled={busy}>
            Process due
          </button>
        }
      />

      <div style={{ marginBottom: 12 }}>
        <button
          className="btn-ghost"
          type="button"
          onClick={() => navigate(ADMIN_ROUTES.notifications || '/admin/notifications')}
        >
          <ArrowLeft size={14} />
          Back
        </button>
      </div>

      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
        <div className="crud-toolbar">
          <SearchInput value={state.search} onChange={setSearch} placeholder="Search deliveries" />
          <FilterBar
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: DELIVERY_STATUSES.map((s) => ({ value: s, label: formatLabel(s) })),
              },
              {
                key: 'channel',
                label: 'Channel',
                options: NOTIFICATION_CHANNELS.map((c) => ({ value: c, label: formatLabel(c) })),
              },
            ]}
            values={state}
            onChange={setFilter}
          />
        </div>
        <DataTable
          columns={COLUMNS}
          rows={rows}
          loading={loading}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onSort={setSort}
          emptyTitle="No deliveries found"
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
      </section>
    </AppShell>
  );
}
