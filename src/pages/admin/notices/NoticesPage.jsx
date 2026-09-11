import { useCallback, useEffect, useState } from 'react';
import { Bell, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import { DataTable, FilterBar, Pagination, SearchInput } from '../../../components/common/index.js';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes.js';
import { useListQuery } from '../../../hooks/useListQuery.js';
import { normalizePagination } from '../../../utils/listQuery.js';
import {
  NOTICE_CATEGORIES,
  NOTICE_PRIORITIES,
  NOTICE_STATUSES,
  listNotices,
} from '../../../services/notice.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const COLUMNS = [
  { key: 'noticeNumber', label: 'Notice #', sortable: true },
  { key: 'title', label: 'Title' },
  { key: 'category', label: 'Category' },
  { key: 'priority', label: 'Priority' },
  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <span
        className={`crud-badge ${
          row.status === 'published' ? 'crud-badge-active' : 'crud-badge-inactive'
        }`}
      >
        {row.status}
      </span>
    ),
  },
  {
    key: 'isPinned',
    label: 'Pinned',
    render: (row) => (row.isPinned ? 'Yes' : 'No'),
  },
  { key: 'publishAt', label: 'Publish at', sortable: true },
  { key: 'expiresAt', label: 'Expires at' },
];

export default function NoticesPage({ basePath = '/admin' } = {}) {
  const navigate = useNavigate();
  const routeMap = ADMIN_ROUTES;
  const { state, params, setPage, setSearch, setSort, setFilter } = useListQuery({
    sortBy: 'created_at',
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
      const finalParams = { ...params };
      if (state.isPinned !== undefined && state.isPinned !== '') {
        finalParams.isPinned = state.isPinned;
      }
      const { data } = await listNotices(finalParams);
      setRows(data.data?.notices || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch notices');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [params, state.isPinned]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell
      active="notices"
      onChange={(id) => routeMap[id] && navigate(routeMap[id])}
      breadcrumb={[{ label: 'Home' }, { label: 'Notices' }]}
    >
      <PageHeader
        icon={Bell}
        iconColor="#fde68a"
        title="Notices"
        subtitle="Manage announcements, targeting, scheduling, and publishing."
        action={
          <button
            className="btn-primary"
            type="button"
            onClick={() => navigate(`${basePath}/notices/new`)}
          >
            <Plus size={14} /> New notice
          </button>
        }
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
        <div className="crud-toolbar">
          <SearchInput value={state.search} onChange={setSearch} placeholder="Search notices" />
          <FilterBar
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: NOTICE_STATUSES.map((s) => ({ value: s, label: s })),
              },
              {
                key: 'category',
                label: 'Category',
                options: NOTICE_CATEGORIES.map((c) => ({ value: c, label: c })),
              },
              {
                key: 'priority',
                label: 'Priority',
                options: NOTICE_PRIORITIES.map((p) => ({ value: p, label: p })),
              },
              {
                key: 'isPinned',
                label: 'Pinned',
                options: [
                  { value: 'true', label: 'Pinned' },
                  { value: 'false', label: 'Not pinned' },
                ],
              },
            ]}
            values={state}
            onChange={setFilter}
          />
        </div>

        <DataTable
          columns={COLUMNS}
          rows={rows}
          loading={loading}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onSort={setSort}
          onRowClick={(row) => navigate(`${basePath}/notices/${row.id}`)}
          emptyTitle="No notices found"
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
