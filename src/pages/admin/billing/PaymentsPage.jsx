import { useCallback, useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import {
  DataTable,
  ListToolbar,
  Pagination,
} from '@/components/common/index.js';
import { ADMIN_ROUTES, FINANCE_ROUTES } from '@/constants/adminRoutes.js';
import { useListQuery } from '@/hooks/useListQuery.js';
import { normalizePagination } from '@/utils/listQuery.js';
import { formatMoney, listPayments } from '@/services/billing.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const MODES = ['cash', 'cheque', 'upi', 'bank_transfer', 'card', 'online_gateway'];
const STATUSES = ['pending', 'cleared', 'failed', 'reversed'];

const COLUMNS = [
  { key: 'paymentNumber', label: 'Payment #', sortable: true },
  { key: 'residentName', label: 'Resident' },
  {
    key: 'amountMinor',
    label: 'Amount ₹',
    render: (row) => formatMoney(row.amountMinor),
  },
  { key: 'mode', label: 'Mode' },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'paymentDate', label: 'Date', sortable: true },
];

export default function PaymentsPage({ basePath = '/admin' } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isFinance = basePath.startsWith('/finance');
  const routeMap = isFinance ? FINANCE_ROUTES : ADMIN_ROUTES;
  const { state, params, setPage, setSearch, setSort, setFilter } = useListQuery({
    sortBy: 'payment_date',
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
      const { data } = await listPayments(params);
      setRows(data.data?.payments || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch payments');
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
      active="payments"
      routes={routeMap}
      breadcrumb={[{ label: 'Home' }, { label: 'Payments' }]}
    >
      <PageHeader
        icon={CreditCard}
        iconColor="#fde68a"
        title="Payments"
        subtitle="Click a row to open details, or record a new payment."
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <ListToolbar
          search={state.search}
          onSearch={setSearch}
          searchPlaceholder="Search payments"
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: STATUSES.map((s) => ({ value: s, label: s })),
            },
            {
              key: 'mode',
              label: 'Mode',
              options: MODES.map((m) => ({ value: m, label: m.replace(/_/g, ' ') })),
            },
          ]}
          filterValues={state}
          onFilterChange={setFilter}
          newLabel="New Payment"
          onNew={() => navigate(`${basePath}/payments/new`)}
        />
        <DataTable
          columns={COLUMNS}
          rows={rows}
          loading={loading}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onSort={setSort}
          onRowClick={(row) => navigate(`${basePath}/payments/${row.id}`)}
          emptyTitle="No payments"
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
