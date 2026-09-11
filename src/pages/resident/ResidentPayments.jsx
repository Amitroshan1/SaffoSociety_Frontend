import { useEffect, useState } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ListToolbar from '../../components/common/ListToolbar';
import Pagination from '../../components/common/Pagination';
import { useListQuery } from '../../hooks/useListQuery';
import { normalizePagination } from '../../utils/listQuery';
import { formatMoney, listResidentPayments } from '../../services/billing.service';

const columns = [
  { key: 'paymentNumber', label: 'Payment #', sortable: true },
  {
    key: 'amountMinor',
    label: 'Amount ₹',
    render: (row) => formatMoney(row.amountMinor),
  },
  { key: 'mode', label: 'Mode' },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'paymentDate', label: 'Date', sortable: true },
];

export default function ResidentPaymentsPage() {
  const { state, params, setPage, setSearch, setSort } = useListQuery({
    sortBy: 'payment_date',
    sortOrder: 'desc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await listResidentPayments(params);
        if (!mounted) return;
        setRows(res.data?.data?.payments || []);
        setPagination(normalizePagination(res.data?.data));
        setError('');
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || 'Failed to fetch payments');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [JSON.stringify(params)]);

  if (error && !rows.length) return <EmptyState title="Payments unavailable" description={error} />;

  return (
    <div>
      <h1 className="resident-page-title">My Payments</h1>
      <p className="resident-page-subtitle">Cleared and pending payments for your flat.</p>
      {error && <p className="resident-error">{error}</p>}
      <ListToolbar
        search={state.search}
        onSearch={setSearch}
        searchPlaceholder="Search payments"
      />
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        sortBy={state.sortBy}
        sortOrder={state.sortOrder}
        onSort={setSort}
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
