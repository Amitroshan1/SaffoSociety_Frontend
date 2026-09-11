import { useCallback, useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import {
  DataTable,
  ListToolbar,
  Pagination,
} from '../../../components/common/index.js';
import { useListQuery } from '../../../hooks/useListQuery.js';
import { normalizePagination } from '../../../utils/listQuery.js';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes.js';
import { listResidents } from '../../../services/resident.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const STATUS_FILTER = {
  key: 'isActive',
  label: 'Status',
  options: [
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ],
};

const COLUMNS = [
  { key: 'code', label: 'Code', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'phone', label: 'Phone', sortable: false },
  { key: 'email', label: 'Email', sortable: false },
  {
    key: 'currentOccupancies',
    label: 'Current flat',
    render: (row) => {
      const occ = row.currentOccupancies?.[0];
      return occ ? `${occ.role} @ ${occ.flatId.slice(0, 8)}…` : '—';
    },
  },
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

export default function ResidentsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('residentId') || '';

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
    if (highlightId) {
      navigate(`/admin/residents/${highlightId}`, { replace: true });
    }
  }, [highlightId, navigate]);

  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
      navigate(location.pathname + location.search, { replace: true, state: {} });
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

      const { data } = await listResidents(apiParams);
      const payload = data.data;
      setRows(payload.residents || []);
      setPagination(normalizePagination(payload));
    } catch (err) {
      setRows([]);
      setError(err.response?.data?.message || 'Failed to fetch residents');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell
      active="residents"
      onChange={(id) => {
        if (id === 'residents') return;
        const path = ADMIN_ROUTES[id];
        if (path) navigate(path);
      }}
      breadcrumb={[{ label: 'Home' }, { label: 'Residents' }]}
    >
      <PageHeader
        icon={Users}
        iconColor="#93c5fd"
        title="Residents Directory"
        subtitle="Click a resident row to open details, or register a new resident."
      />

      {error && <div style={{ marginBottom: 12, color: '#fca5a5', fontSize: 14 }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac', fontSize: 14 }}>{success}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <ListToolbar
          search={state.search}
          onSearch={setSearch}
          searchPlaceholder="Search name, code, phone..."
          filters={[STATUS_FILTER]}
          filterValues={state}
          onFilterChange={setFilter}
          newLabel="New Resident"
          onNew={() => navigate('/admin/residents/new')}
        />

        <DataTable
          columns={COLUMNS}
          rows={rows}
          rowKey="id"
          loading={loading}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onSort={setSort}
          onRowClick={(row) => navigate(`/admin/residents/${row.id}`)}
          emptyTitle="No residents found"
          emptyDescription="Register people before assigning them to flats via Occupancy."
        />
        {!loading && pagination && <Pagination {...pagination} onPageChange={setPage} />}
      </section>
    </AppShell>
  );
}
