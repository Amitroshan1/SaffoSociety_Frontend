import { useCallback, useEffect, useState } from 'react';
import { Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { formatMoney, listReceipts } from '@/services/billing.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const COLUMNS = [
  { key: 'receiptNumber', label: 'Receipt #', sortable: true },
  { key: 'residentName', label: 'Resident' },
  {
    key: 'amountMinor',
    label: 'Amount ₹',
    render: (row) => formatMoney(row.amountMinor),
  },
  { key: 'issuedAt', label: 'Issued', sortable: true },
  {
    key: 'isVoid',
    label: 'Void',
    render: (row) => (row.isVoid ? 'Yes' : 'No'),
  },
];

export default function ReceiptsPage({ basePath = '/admin' } = {}) {
  const navigate = useNavigate();
  const isFinance = basePath.startsWith('/finance');
  const routeMap = isFinance ? FINANCE_ROUTES : ADMIN_ROUTES;
  const { state, params, setPage, setSearch, setSort, setFilter } = useListQuery({
    sortBy: 'issued_at',
    sortOrder: 'desc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listReceipts(params);
      setRows(data.data?.receipts || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch receipts');
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
      active="receipts"
      routes={routeMap}
      breadcrumb={[{ label: 'Home' }, { label: 'Receipts' }]}
    >
      <PageHeader
        icon={Receipt}
        iconColor="#86efac"
        title="Receipts"
        subtitle="Click a receipt row to open details."
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
        <ListToolbar
          search={state.search}
          onSearch={setSearch}
          searchPlaceholder="Search receipts"
          filters={[
            {
              key: 'isVoid',
              label: 'Void',
              options: [
                { value: 'false', label: 'Active' },
                { value: 'true', label: 'Void' },
              ],
            },
          ]}
          filterValues={state}
          onFilterChange={setFilter}
        />
        <DataTable
          columns={COLUMNS}
          rows={rows}
          loading={loading}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onSort={setSort}
          onRowClick={(row) => navigate(`${basePath}/receipts/${row.id}`)}
          emptyTitle="No receipts"
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
