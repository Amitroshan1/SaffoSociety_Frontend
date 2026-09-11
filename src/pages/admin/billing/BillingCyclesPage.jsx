import { useCallback, useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';
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
import { listBillingCycles } from '../../../services/billing.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const FREQUENCIES = ['monthly', 'quarterly', 'half_yearly', 'yearly', 'manual', 'custom'];

const COLUMNS = [
  { key: 'code', label: 'Code', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'frequency', label: 'Frequency' },
  { key: 'dayOfMonth', label: 'Day' },
  { key: 'defaultDueDays', label: 'Due days' },
  {
    key: 'autoPublish',
    label: 'Auto publish',
    render: (row) => (row.autoPublish ? 'Yes' : 'No'),
  },
  {
    key: 'isActive',
    label: 'Active',
    render: (row) => (
      <span className={`crud-badge ${row.isActive ? 'crud-badge-active' : 'crud-badge-inactive'}`}>
        {row.isActive ? 'Active' : 'Inactive'}
      </span>
    ),
  },
];

export default function BillingCyclesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, params, setPage, setSearch, setSort, setFilter } = useListQuery({
    sortBy: 'name',
    sortOrder: 'asc',
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
      const { data } = await listBillingCycles(params);
      setRows(data.data?.billingCycles || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch billing cycles');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell
      active="billing-cycles"
      onChange={(id) => ADMIN_ROUTES[id] && navigate(ADMIN_ROUTES[id])}
      breadcrumb={[{ label: 'Home' }, { label: 'Billing Cycles' }]}
    >
      <PageHeader
        icon={CalendarClock}
        iconColor="#86efac"
        title="Billing Cycles"
        subtitle="Click a row to open details, or create a new cycle."
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <ListToolbar
          search={state.search}
          onSearch={setSearch}
          searchPlaceholder="Search cycles"
          filters={[
            {
              key: 'frequency',
              label: 'Frequency',
              options: FREQUENCIES.map((f) => ({ value: f, label: f.replace(/_/g, ' ') })),
            },
          ]}
          filterValues={state}
          onFilterChange={setFilter}
          newLabel="New Cycle"
          onNew={() => navigate('/admin/billing-cycles/new')}
        />
        <DataTable
          columns={COLUMNS}
          rows={rows}
          loading={loading}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onSort={setSort}
          onRowClick={(row) => navigate(`/admin/billing-cycles/${row.id}`)}
          emptyTitle="No billing cycles"
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
