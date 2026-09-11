import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import {
  DataTable,
  ListToolbar,
  Pagination,
} from '../../../components/common/index.js';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes.js';
import { useListQuery } from '../../../hooks/useListQuery.js';
import { normalizePagination } from '../../../utils/listQuery.js';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CHANNELS,
  formatLabel,
  listNotificationTemplates,
} from '../../../services/notification.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const COLUMNS = [
  { key: 'code', label: 'Code', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'category', label: 'Category', render: (r) => formatLabel(r.category) },
  { key: 'channel', label: 'Channel', render: (r) => formatLabel(r.channel) },
  { key: 'priority', label: 'Priority', render: (r) => formatLabel(r.priority) },
  {
    key: 'isSystem',
    label: 'System',
    render: (r) => (r.isSystem ? 'Yes' : 'No'),
  },
];

export default function NotificationTemplatesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, params, setPage, setSearch, setSort, setFilter } = useListQuery({
    sortBy: 'created_at',
    sortOrder: 'desc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      if (state.category) finalParams.category = state.category;
      if (state.channel) finalParams.channel = state.channel;
      const { data } = await listNotificationTemplates(finalParams);
      setRows(data.data?.templates || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch templates');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [params, state.category, state.channel]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell
      active="notifications"
      onChange={(navId) => ADMIN_ROUTES[navId] && navigate(ADMIN_ROUTES[navId])}
      breadcrumb={[{ label: 'Home' }, { label: 'Notifications' }, { label: 'Templates' }]}
    >
      <PageHeader
        icon={FileText}
        iconColor="#fcd34d"
        title="Notification Templates"
        subtitle="Reusable subject/body templates with placeholder variables."
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

      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <ListToolbar
          search={state.search}
          onSearch={setSearch}
          searchPlaceholder="Search templates"
          filters={[
            {
              key: 'category',
              label: 'Category',
              options: NOTIFICATION_CATEGORIES.map((c) => ({ value: c, label: formatLabel(c) })),
            },
            {
              key: 'channel',
              label: 'Channel',
              options: NOTIFICATION_CHANNELS.map((c) => ({ value: c, label: formatLabel(c) })),
            },
          ]}
          filterValues={state}
          onFilterChange={setFilter}
          newLabel="New Template"
          onNew={() => navigate('/admin/notifications/templates/new')}
        />
        <DataTable
          columns={COLUMNS}
          rows={rows}
          loading={loading}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onSort={setSort}
          onRowClick={(row) =>
            navigate(`/admin/notifications/templates/${row.id}`, { state: { template: row } })
          }
          emptyTitle="No templates found"
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
