import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ListToolbar from '../../components/common/ListToolbar';
import Pagination from '../../components/common/Pagination';
import { useListQuery } from '../../hooks/useListQuery';
import { normalizePagination } from '../../utils/listQuery';
import {
  addResidentComplaintComment,
  closeResidentComplaint,
  getResidentComplaint,
  listResidentComplaints,
} from '../../services/complaint.service';

const columns = [
  { key: 'title', label: 'Title', sortable: true },
  { key: 'category', label: 'Category' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'createdAt', label: 'Created' },
];

export default function ResidentComplaintsPage() {
  const navigate = useNavigate();
  const { state, params, setPage, setSearch, setSort } = useListQuery({
    sortBy: 'created_at',
    sortOrder: 'desc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listResidentComplaints(params);
      setRows(res.data?.data?.complaints || []);
      setPagination(normalizePagination(res.data?.data));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  const openDetail = async (row) => {
    const res = await getResidentComplaint(row.id);
    setSelected(res.data?.data?.complaint || null);
  };

  const postComment = async () => {
    if (!selected || !comment.trim()) return;
    await addResidentComplaintComment(selected.id, { message: comment.trim() });
    setComment('');
    const res = await getResidentComplaint(selected.id);
    setSelected(res.data?.data?.complaint);
    await load();
  };

  const closeComplaint = async () => {
    if (!selected) return;
    await closeResidentComplaint(selected.id, {});
    const res = await getResidentComplaint(selected.id);
    setSelected(res.data?.data?.complaint);
    await load();
  };

  if (error && !rows.length) return <EmptyState title="Complaints unavailable" description={error} />;

  return (
    <div>
      <h1 className="resident-page-title">My Complaints</h1>
      <p className="resident-page-subtitle">Track and follow up on service requests.</p>
      {error && <p className="resident-error">{error}</p>}
      <ListToolbar
        search={state.search}
        onSearch={setSearch}
        searchPlaceholder="Search complaints"
        newLabel="New"
        onNew={() => navigate('/resident/complaints/new')}
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
            <h3>{selected.title}</h3>
            <button type="button" className="resident-link" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
          <p>{selected.description}</p>
          <p>Status: {selected.status} | Priority: {selected.priority}</p>
          <h4>Timeline</h4>
          <ul>
            {(selected.comments || []).map((c) => (
              <li key={c.id}>{c.authorType}: {c.message}</li>
            ))}
          </ul>
          <h4>Attachments</h4>
          <ul>
            {(selected.attachments || []).map((a) => (
              <li key={a.id}><a href={a.fileUrl}>{a.fileName}</a></li>
            ))}
          </ul>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Add comment" />
          <div className="resident-inline-actions">
            <button type="button" className="btn-primary" onClick={postComment}>Comment</button>
            {selected.status === 'resolved' && (
              <button type="button" onClick={closeComplaint}>Close Complaint</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
