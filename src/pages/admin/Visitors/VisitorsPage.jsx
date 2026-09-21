import { useCallback, useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import {
  DataTable,
  ListToolbar,
  Pagination,
} from '@/components/common/index.js';
import { useListQuery } from '@/hooks/useListQuery.js';
import { normalizePagination } from '@/utils/listQuery.js';
import { ADMIN_ROUTES } from '@/constants/adminRoutes.js';
import { listVisitors } from '@/services/visitor.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const STATUS_FILTER = {
  key: 'isActive',
  label: 'Status',
  options: [
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ],
};

const COLUMNS = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'phone', label: 'Phone', sortable: true },
  { key: 'email', label: 'Email', sortable: false },
  { key: 'governmentIdType', label: 'ID Type', sortable: false },
  { key: 'governmentIdNumber', label: 'ID Number', sortable: false },
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

export default function VisitorsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, params, setPage, setSearch, setSort, setFilter } = useListQuery({
    sortBy: 'name',
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
      const apiParams = { ...params };
      if (apiParams.isActive === 'true') apiParams.isActive = true;
      else if (apiParams.isActive === 'false') apiParams.isActive = false;
      else delete apiParams.isActive;
      const { data } = await listVisitors(apiParams);
      setRows(data.data?.visitors || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setRows([]);
      setError(err.response?.data?.message || 'Failed to fetch visitors');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell
      active="visitors"
      onChange={(id) => {
        if (id === 'visitors') return;
        const path = ADMIN_ROUTES[id];
        if (path) navigate(path);
      }}
      breadcrumb={[{ label: 'Home' }, { label: 'Visitors' }]}
    >
      <PageHeader
        icon={Users}
        iconColor="#93c5fd"
        title="Visitors Directory"
        subtitle="Click a visitor row to open details, or register a new visitor."
      />

      {error && <div style={{ marginBottom: 12, color: '#fca5a5', fontSize: 14 }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac', fontSize: 14 }}>{success}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <ListToolbar
          search={state.search}
          onSearch={setSearch}
          searchPlaceholder="Search name, phone, ID..."
          filters={[STATUS_FILTER]}
          filterValues={state}
          onFilterChange={setFilter}
          newLabel="New Visitor"
          onNew={() => navigate('/admin/visitors/new')}
        />
        <DataTable
          columns={COLUMNS}
          rows={rows}
          rowKey="id"
          loading={loading}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onSort={setSort}
          onRowClick={(row) => navigate(`/admin/visitors/${row.id}`)}
          emptyTitle="No visitors found"
          emptyDescription="Add reusable visitor identities for gate operations."
        />
        {!loading && pagination && <Pagination {...pagination} onPageChange={setPage} />}
      </section>
    </AppShell>
  );
}
