import { useCallback, useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import {
  DataTable,
  ListToolbar,
  Pagination,
} from '../../../components/common/index.js';
import { ADMIN_ROUTES, FINANCE_ROUTES } from '../../../constants/adminRoutes.js';
import { useListQuery } from '../../../hooks/useListQuery.js';
import { normalizePagination } from '../../../utils/listQuery.js';
import { formatMoney, listBills } from '../../../services/billing.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const STATUSES = [
  'draft',
  'generated',
  'published',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled',
  'write_off',
];

const COLUMNS = [
  { key: 'billNumber', label: 'Bill #', sortable: true },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'residentName', label: 'Resident' },
  { key: 'dueDate', label: 'Due', sortable: true },
  {
    key: 'netMinor',
    label: 'Net ₹',
    render: (row) => formatMoney(row.netMinor),
  },
  {
    key: 'outstandingMinor',
    label: 'Outstanding ₹',
    render: (row) => formatMoney(row.outstandingMinor),
  },
];

export default function BillsPage({ basePath = '/admin' } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isFinance = basePath.startsWith('/finance');
  const routeMap = isFinance ? FINANCE_ROUTES : ADMIN_ROUTES;
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
      const { data } = await listBills(params);
      setRows(data.data?.bills || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch bills');
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
      active="bills"
      routes={routeMap}
      breadcrumb={[{ label: 'Home' }, { label: 'Bills' }]}
    >
      <PageHeader
        icon={FileText}
        iconColor="#93c5fd"
        title="Bills"
        subtitle="Click a bill row to open details and actions."
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
        <ListToolbar
          search={state.search}
          onSearch={setSearch}
          searchPlaceholder="Search bills"
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
            },
          ]}
          filterValues={state}
          onFilterChange={setFilter}
          newLabel={!isFinance ? 'Generate Bills' : undefined}
          onNew={!isFinance ? () => navigate(`${basePath}/bills/generate`) : undefined}
        />
        <DataTable
          columns={COLUMNS}
          rows={rows}
          loading={loading}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onSort={setSort}
          onRowClick={(row) => navigate(`${basePath}/bills/${row.id}`)}
          emptyTitle="No bills found"
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
