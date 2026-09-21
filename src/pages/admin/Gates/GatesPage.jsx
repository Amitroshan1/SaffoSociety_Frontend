import { useCallback, useEffect, useState } from 'react';
import { DoorOpen } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import { DataTable, ListToolbar, Pagination } from '@/components/common/index.js';
import { useListQuery } from '@/hooks/useListQuery.js';
import { normalizePagination } from '@/utils/listQuery.js';
import { ADMIN_ROUTES } from '@/constants/adminRoutes.js';
import { listGates } from '@/services/gate.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const COLUMNS = [
  { key: 'code', label: 'Code', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'gateType', label: 'Type', sortable: true },
  { key: 'sequence', label: 'Seq', sortable: true },
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

export default function GatesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, params, setPage, setSearch, setSort } = useListQuery({
    sortBy: 'sequence',
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
    try {
      const { data } = await listGates(params);
      setRows(data.data?.gates || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch gates');
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
      active="gates"
      onChange={(id) => {
        if (id === 'gates') return;
        const path = ADMIN_ROUTES[id];
        if (path) navigate(path);
      }}
      breadcrumb={[{ label: 'Home' }, { label: 'Gates' }]}
    >
      <PageHeader
        icon={DoorOpen}
        iconColor="#93c5fd"
        title="Gates"
        subtitle="Click a gate row to open details, or register a new gate."
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}
      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <ListToolbar
          search={state.search}
          onSearch={setSearch}
          searchPlaceholder="Search gates..."
          newLabel="New Gate"
          onNew={() => navigate('/admin/gates/new')}
        />
        <DataTable
          columns={COLUMNS}
          rows={rows}
          rowKey="id"
          loading={loading}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onSort={setSort}
          onRowClick={(row) => navigate(`/admin/gates/${row.id}`)}
          emptyTitle="No gates"
          emptyDescription="Register MAIN, service, and pedestrian gates."
        />
        {!loading && pagination && <Pagination {...pagination} onPageChange={setPage} />}
      </section>
    </AppShell>
  );
}
