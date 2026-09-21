import { useEffect, useState } from 'react';
import DataTable from '@/components/common/DataTable';
import EmptyState from '@/components/common/EmptyState';
import ListToolbar from '@/components/common/ListToolbar';
import Pagination from '@/components/common/Pagination';
import { useListQuery } from '@/hooks/useListQuery';
import { normalizePagination } from '@/utils/listQuery';
import {
  formatMoney,
  getResidentReceipt,
  listResidentReceipts,
} from '@/services/billing.service';

const columns = [
  { key: 'receiptNumber', label: 'Receipt #', sortable: true },
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

export default function ResidentReceiptsPage() {
  const { state, params, setPage, setSearch, setSort } = useListQuery({
    sortBy: 'issued_at',
    sortOrder: 'desc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await listResidentReceipts(params);
        if (!mounted) return;
        setRows(res.data?.data?.receipts || []);
        setPagination(normalizePagination(res.data?.data));
        setError('');
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || 'Failed to fetch receipts');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [JSON.stringify(params)]);

  const openDetail = async (row) => {
    try {
      const res = await getResidentReceipt(row.id);
      setSelected(res.data?.data?.receipt || res.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load receipt');
    }
  };

  if (error && !rows.length) return <EmptyState title="Receipts unavailable" description={error} />;

  return (
    <div>
      <h1 className="resident-page-title">My Receipts</h1>
      <p className="resident-page-subtitle">Payment receipts issued for your account.</p>
      {error && <p className="resident-error">{error}</p>}
      <ListToolbar
        search={state.search}
        onSearch={setSearch}
        searchPlaceholder="Search receipts"
      />
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        sortBy={state.sortBy}
        sortOrder={state.sortOrder}
        onSort={setSort}
        onRowClick={openDetail}
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
      {selected && (
        <div className="resident-panel">
          <div className="resident-section-header">
            <h3>{selected.receiptNumber}</h3>
            <button type="button" className="resident-link" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
          <p>Amount: ₹ {formatMoney(selected.amountMinor)}</p>
          <p>Issued: {selected.issuedAt}</p>
          <p>Void: {selected.isVoid ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
}
