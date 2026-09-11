import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ListToolbar from '../../components/common/ListToolbar';
import Pagination from '../../components/common/Pagination';
import { useListQuery } from '../../hooks/useListQuery';
import {
  listResidentVisitors,
  residentVisitorApproval,
} from '../../services/residentPortal.service';

const columns = [
  { key: 'visitorName', label: 'Visitor', sortable: true },
  { key: 'purpose', label: 'Purpose' },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'expectedAt', label: 'Expected At' },
];

export default function ResidentVisitorsPage() {
  const navigate = useNavigate();
  const { state, params, setPage, setSearch, setSort } = useListQuery({
    page: 1,
    pageSize: 10,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setBusy(true);
      const res = await listResidentVisitors(params);
      setRows(res.data?.data?.visits || []);
      setPagination(res.data?.data?.pagination || {});
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch visitors');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  const actOnVisit = async (visitId, action) => {
    try {
      await residentVisitorApproval({ visitId, action });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} visitor`);
    }
  };

  return (
    <div>
      <h1 className="resident-page-title">Visitors</h1>
      <p className="resident-page-subtitle">Approve, reject, or invite guests to your flat.</p>
      {error ? <EmptyState title="Visitors unavailable" description={error} /> : null}
      <ListToolbar
        search={state.search}
        onSearch={setSearch}
        searchPlaceholder="Search visitors"
        newLabel="Invite"
        onNew={() => navigate('/resident/visitor-invitations')}
      />
      <DataTable
        columns={[
          ...columns,
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
              <div className="resident-inline-actions">
                <button type="button" onClick={() => actOnVisit(row.id, 'approve')}>Approve</button>
                <button type="button" onClick={() => actOnVisit(row.id, 'reject')}>Reject</button>
                <button type="button" onClick={() => actOnVisit(row.id, 'cancel')}>Cancel</button>
              </div>
            ),
          },
        ]}
        rows={rows}
        loading={busy}
        sortBy={state.sortBy}
        sortOrder={state.sortOrder}
        onSort={setSort}
      />
      <Pagination
        page={pagination.page || state.page}
        pageSize={pagination.pageSize || state.pageSize}
        total={pagination.total || 0}
        totalPages={pagination.totalPages || 1}
        hasPrev={pagination.hasPrev || false}
        hasNext={pagination.hasNext || false}
        onPageChange={setPage}
      />
    </div>
  );
}
