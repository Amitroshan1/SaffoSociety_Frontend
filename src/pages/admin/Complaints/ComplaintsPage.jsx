import { useCallback, useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import {
  DataTable,
  FilterBar,
  FormField,
  FormLayout,
  FormSelect,
  Pagination,
  SearchInput,
} from '../../../components/common/index.js';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes.js';
import { useListQuery } from '../../../hooks/useListQuery.js';
import { normalizePagination } from '../../../utils/listQuery.js';
import {
  addComplaintComment,
  assignComplaint,
  closeComplaint,
  getComplaint,
  getComplaintDashboard,
  listComplaints,
  reopenComplaint,
  resolveComplaint,
  updateComplaintPriority,
  updateComplaintStatus,
} from '../../../services/complaint.service.js';
import { listStaff } from '../../../services/staff.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const STATUSES = ['open', 'assigned', 'in_progress', 'waiting', 'resolved', 'closed', 'reopened', 'rejected'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const CATEGORIES = [
  'electrical',
  'plumbing',
  'housekeeping',
  'security',
  'parking',
  'lift',
  'water',
  'internet',
  'common_area',
  'other',
];

const COLUMNS = [
  { key: 'title', label: 'Title', sortable: true },
  { key: 'category', label: 'Category' },
  { key: 'priority', label: 'Priority', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'residentName', label: 'Resident' },
  { key: 'assignedStaffName', label: 'Assigned To' },
  { key: 'createdAt', label: 'Created', sortable: true },
];

export default function ComplaintsPage() {
  const navigate = useNavigate();
  const { state, params, setPage, setSearch, setSort, setFilter } = useListQuery({
    sortBy: 'created_at',
    sortOrder: 'desc',
    pageSize: 10,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [stats, setStats] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState('');
  const [assignStaffId, setAssignStaffId] = useState('');
  const [statusValue, setStatusValue] = useState('in_progress');
  const [priorityValue, setPriorityValue] = useState('medium');

  useEffect(() => {
    getComplaintDashboard()
      .then((r) => setStats(r.data?.data || null))
      .catch(() => {});
    listStaff({ pageSize: 100, isActive: true, sortBy: 'name', sortOrder: 'asc' })
      .then((r) => setStaff(r.data?.data?.staff || []))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listComplaints(params);
      setRows(data.data?.complaints || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (row) => {
    try {
      const { data } = await getComplaint(row.id);
      const c = data.data?.complaint;
      setSelected(c);
      setAssignStaffId(c?.assignedStaffId || '');
      setStatusValue(c?.status || 'open');
      setPriorityValue(c?.priority || 'medium');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaint');
    }
  };

  const refreshSelected = async (id) => {
    const { data } = await getComplaint(id);
    setSelected(data.data?.complaint);
    await load();
  };

  const handleAssign = async () => {
    if (!selected || !assignStaffId) return;
    try {
      await assignComplaint(selected.id, { staffId: assignStaffId });
      await refreshSelected(selected.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Assign failed');
    }
  };

  const handleStatus = async () => {
    if (!selected) return;
    try {
      await updateComplaintStatus(selected.id, { status: statusValue });
      await refreshSelected(selected.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Status update failed');
    }
  };

  const handlePriority = async () => {
    if (!selected) return;
    try {
      await updateComplaintPriority(selected.id, { priority: priorityValue });
      await refreshSelected(selected.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Priority update failed');
    }
  };

  const handleComment = async () => {
    if (!selected || !comment.trim()) return;
    try {
      await addComplaintComment(selected.id, { message: comment.trim() });
      setComment('');
      await refreshSelected(selected.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Comment failed');
    }
  };

  const handleResolve = async () => {
    if (!selected) return;
    try {
      await resolveComplaint(selected.id, {});
      await refreshSelected(selected.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Resolve failed');
    }
  };

  const handleReopen = async () => {
    if (!selected) return;
    try {
      await reopenComplaint(selected.id, {});
      await refreshSelected(selected.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Reopen failed');
    }
  };

  const handleClose = async () => {
    if (!selected) return;
    try {
      await closeComplaint(selected.id, {});
      await refreshSelected(selected.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Close failed');
    }
  };

  return (
    <AppShell
      active="complaints"
      onChange={(id) => ADMIN_ROUTES[id] && navigate(ADMIN_ROUTES[id])}
      breadcrumb={[{ label: 'Home' }, { label: 'Complaints' }]}
    >
      <PageHeader
        icon={MessageSquare}
        iconColor="#fca5a5"
        title="Complaint Management"
        subtitle="Track, assign, and resolve resident maintenance issues."
      />

      {stats && (
        <div
          className="crud-stats-row"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div className="crud-stat-card">Total: {stats.total}</div>
          <div className="crud-stat-card">Open: {stats.openCount}</div>
          <div className="crud-stat-card">In Progress: {stats.inProgressCount}</div>
          <div className="crud-stat-card">Resolved: {stats.resolvedCount}</div>
          <div className="crud-stat-card">Unassigned: {stats.unassigned}</div>
        </div>
      )}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <div className="crud-toolbar">
          <SearchInput value={state.search} onChange={setSearch} placeholder="Search complaints" />
          <FilterBar
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') })),
              },
              {
                key: 'priority',
                label: 'Priority',
                options: PRIORITIES.map((p) => ({ value: p, label: p })),
              },
              {
                key: 'category',
                label: 'Category',
                options: CATEGORIES.map((c) => ({ value: c, label: c.replace('_', ' ') })),
              },
            ]}
            values={state}
            onChange={setFilter}
          />
        </div>

        {error && <p style={{ color: '#fca5a5' }}>{error}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 16 }}>
          <div>
            <DataTable
              columns={COLUMNS}
              rows={rows}
              loading={loading}
              sortBy={state.sortBy}
              sortOrder={state.sortOrder}
              onSort={setSort}
              onRowClick={openDetail}
              emptyTitle="No complaints found"
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

          {selected && (
            <div>
              <h3 style={{ marginTop: 0 }}>{selected.title}</h3>
              <p>
                <strong>Status:</strong> {selected.status}
              </p>
              <p>
                <strong>Priority:</strong> {selected.priority}
              </p>
              <p>
                <strong>Resident:</strong> {selected.residentName}
              </p>
              <p>
                <strong>Description:</strong> {selected.description}
              </p>

              <FormLayout
                sections={[
                  {
                    title: 'Actions',
                    content: (
                      <>
                        <FormSelect
                          label="Assign staff"
                          value={assignStaffId}
                          options={staff.map((s) => ({
                            value: s.id,
                            label: `${s.name} (${s.staffRole})`,
                          }))}
                          onChange={setAssignStaffId}
                        />
                        <button className="btn-primary" type="button" onClick={handleAssign}>
                          Assign
                        </button>

                        <FormSelect
                          label="Status"
                          value={statusValue}
                          options={STATUSES}
                          onChange={setStatusValue}
                        />
                        <button className="btn-primary" type="button" onClick={handleStatus}>
                          Update Status
                        </button>

                        <FormSelect
                          label="Priority"
                          value={priorityValue}
                          options={PRIORITIES}
                          onChange={setPriorityValue}
                        />
                        <button className="btn-primary" type="button" onClick={handlePriority}>
                          Update Priority
                        </button>

                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button className="btn-primary" type="button" onClick={handleResolve}>
                            Resolve
                          </button>
                          <button className="btn-primary" type="button" onClick={handleReopen}>
                            Reopen
                          </button>
                          <button className="btn-primary" type="button" onClick={handleClose}>
                            Close
                          </button>
                        </div>

                        <FormField
                          textarea
                          label="Add comment"
                          value={comment}
                          onChange={setComment}
                        />
                        <button className="btn-primary" type="button" onClick={handleComment}>
                          Post Comment
                        </button>
                      </>
                    ),
                  },
                ]}
              />

              <h4>Timeline</h4>
              <ul>
                {(selected.comments || []).map((c) => (
                  <li key={c.id}>
                    <strong>{c.authorType}</strong>: {c.message}
                  </li>
                ))}
              </ul>

              <h4>Attachments</h4>
              <ul>
                {(selected.attachments || []).map((a) => (
                  <li key={a.id}>
                    <a href={a.fileUrl} target="_blank" rel="noreferrer">
                      {a.fileName}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
