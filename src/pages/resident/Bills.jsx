import { useEffect, useState } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ListToolbar from '../../components/common/ListToolbar';
import Pagination from '../../components/common/Pagination';
import { useListQuery } from '../../hooks/useListQuery';
import { normalizePagination } from '../../utils/listQuery';
import {
  formatMoney,
  getResidentBill,
  listResidentBills,
} from '../../services/billing.service';

const columns = [
  { key: 'billNumber', label: 'Bill #', sortable: true },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'dueDate', label: 'Due' },
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

export default function ResidentBillsPage() {
  const { state, params, setPage, setSearch, setSort } = useListQuery({
    sortBy: 'created_at',
    sortOrder: 'desc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listResidentBills(params);
      setRows(res.data?.data?.bills || []);
      setPagination(normalizePagination(res.data?.data));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  const openDetail = async (row) => {
    try {
      const res = await getResidentBill(row.id);
      setSelected(res.data?.data?.bill || res.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bill');
    }
  };

  if (error && !rows.length) return <EmptyState title="Bills unavailable" description={error} />;

  return (
    <div>
      <h1 className="resident-page-title">My Bills</h1>
      <p className="resident-page-subtitle">Click a row to view bill details and line items.</p>
      {error && <p className="resident-error">{error}</p>}
      <ListToolbar
        search={state.search}
        onSearch={setSearch}
        searchPlaceholder="Search bills"
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
            <h3>{selected.billNumber || selected.title}</h3>
            <button type="button" className="resident-link" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
          <p>Status: {selected.status}</p>
          <p>Due: {selected.dueDate}</p>
          <p>Net: ₹ {formatMoney(selected.netMinor)}</p>
          <p>Outstanding: ₹ {formatMoney(selected.outstandingMinor)}</p>
          <h4>Line items</h4>
          <ul>
            {(selected.lines || []).map((line) => (
              <li key={line.id}>
                {line.description}: ₹ {formatMoney(line.lineTotalMinor)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
