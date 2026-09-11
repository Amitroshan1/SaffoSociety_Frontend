import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CalendarClock } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import {
  ConfirmDialog,
  DataTable,
  ListToolbar,
  Pagination,
} from '../../../components/common/index.js';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes.js';
import { useListQuery } from '../../../hooks/useListQuery.js';
import { normalizePagination } from '../../../utils/listQuery.js';
import {
  SCHEDULE_STATUSES,
  cancelScheduledNotification,
  formatLabel,
  listScheduledNotifications,
} from '../../../services/notification.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

export default function ScheduledNotificationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, params, setPage, setSearch, setSort, setFilter } = useListQuery({
    sortBy: 'schedule_at',
    sortOrder: 'asc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);

  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const finalParams = { ...params };
      if (state.status) finalParams.status = state.status;
      const { data } = await listScheduledNotifications(finalParams);
      setRows(data.data?.scheduled || data.data?.items || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch scheduled notifications');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [params, state.status]);

  useEffect(() => {
    load();
  }, [load]);

  const onCancel = async () => {
    if (!cancelTarget) return;
    setSaving(true);
    setError('');
    try {
      await cancelScheduledNotification(cancelTarget.id);
      setSuccess('Schedule cancelled');
      setCancelTarget(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Cancel failed');
    } finally {
      setSaving(false);
    }
  };

  const COLUMNS = [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'targetType', label: 'Target', render: (r) => formatLabel(r.targetType) },
    {
      key: 'channels',
      label: 'Channels',
      render: (r) => (Array.isArray(r.channels) ? r.channels.map(formatLabel).join(', ') : '-'),
    },
    { key: 'scheduleAt', label: 'Schedule at', sortable: true },
    { key: 'recurrence', label: 'Recurrence', render: (r) => formatLabel(r.recurrence || 'none') },
    { key: 'status', label: 'Status', render: (r) => formatLabel(r.status) },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) =>
        r.status === 'scheduled' ? (
          <button
            type="button"
            className="crud-btn crud-btn-ghost"
            onClick={(e) => {
              e.stopPropagation();
              setCancelTarget(r);
            }}
          >
            Cancel
          </button>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <AppShell
      active="notifications"
      onChange={(navId) => ADMIN_ROUTES[navId] && navigate(ADMIN_ROUTES[navId])}
      breadcrumb={[{ label: 'Home' }, { label: 'Notifications' }, { label: 'Scheduled' }]}
    >
      <PageHeader
        icon={CalendarClock}
        iconColor="#fcd34d"
        title="Scheduled Notifications"
        subtitle="Schedule one-time or recurring broadcasts and cancel pending jobs."
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
        <ListToolbar
          search={state.search}
          onSearch={setSearch}
          searchPlaceholder="Search scheduled"
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: SCHEDULE_STATUSES.map((s) => ({ value: s, label: formatLabel(s) })),
            },
          ]}
          filterValues={state}
          onFilterChange={setFilter}
          newLabel="Schedule New"
          onNew={() => navigate('/admin/notifications/scheduled/new')}
        />
        <DataTable
          columns={COLUMNS}
          rows={rows}
          loading={loading}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onSort={setSort}
          emptyTitle="No scheduled notifications"
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

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel schedule"
        message="Cancel this scheduled notification?"
        confirmLabel="Cancel schedule"
        onConfirm={onCancel}
        onCancel={() => setCancelTarget(null)}
        busy={saving}
      />
    </AppShell>
  );
}
