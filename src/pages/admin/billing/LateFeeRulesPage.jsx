import { useCallback, useEffect, useState } from 'react';
import { Percent } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import {
  DataTable,
  ListToolbar,
  Pagination,
} from '@/components/common/index.js';
import { ADMIN_ROUTES } from '@/constants/adminRoutes.js';
import { useListQuery } from '@/hooks/useListQuery.js';
import { normalizePagination } from '@/utils/listQuery.js';
import { formatMoney, listLateFeeRules } from '@/services/billing.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const COLUMNS = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'feeType', label: 'Type' },
  { key: 'graceDays', label: 'Grace days' },
  {
    key: 'fixedAmountMinor',
    label: 'Fixed ₹',
    render: (row) => (row.fixedAmountMinor != null ? formatMoney(row.fixedAmountMinor) : '—'),
  },
  { key: 'percentageBps', label: 'Bps' },
  { key: 'priority', label: 'Priority' },
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

export default function LateFeeRulesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, params, setPage, setSearch, setSort } = useListQuery({
    sortBy: 'priority',
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
      const { data } = await listLateFeeRules(params);
      setRows(data.data?.lateFeeRules || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch late fee rules');
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
      active="late-fee-rules"
      onChange={(id) => ADMIN_ROUTES[id] && navigate(ADMIN_ROUTES[id])}
      breadcrumb={[{ label: 'Home' }, { label: 'Late Fee Rules' }]}
    >
      <PageHeader
        icon={Percent}
        iconColor="#fca5a5"
        title="Late Fee Rules"
        subtitle="Click a row to open details, or create a new rule."
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <ListToolbar
          search={state.search}
          onSearch={setSearch}
          searchPlaceholder="Search rules"
          newLabel="New Rule"
          onNew={() => navigate('/admin/late-fee-rules/new')}
        />
        <DataTable
          columns={COLUMNS}
          rows={rows}
          loading={loading}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onSort={setSort}
          onRowClick={(row) => navigate(`/admin/late-fee-rules/${row.id}`)}
          emptyTitle="No late fee rules"
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
