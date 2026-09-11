import { useCallback, useEffect, useMemo, useState } from 'react';
import { Layers } from 'lucide-react';
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
import { listBuildings } from '../../../services/building.service.js';
import { listWings } from '../../../services/wing.service.js';
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
  { key: 'name', label: 'Name', sortable: true },
  { key: 'code', label: 'Code', sortable: true },
  { key: 'buildingCode', label: 'Building', sortable: true },
  { key: 'wingType', label: 'Type', sortable: true },
  { key: 'totalFlats', label: 'Flats', sortable: true },
  { key: 'sequence', label: 'Seq', sortable: true },
  {
    key: 'isActive',
    label: 'Status',
    render: (row) => (
      <span className={`crud-badge ${row.isActive ? 'crud-badge-active' : 'crud-badge-inactive'}`}>
        {row.isActive ? 'Active' : 'Inactive'}
      </span>
    ),
  },
];

export default function WingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialBuildingId = searchParams.get('buildingId') || '';

  const { state, params, setPage, setSearch, setSort, setFilter } = useListQuery({
    sortBy: 'sequence',
    sortOrder: 'asc',
    pageSize: 10,
    buildingId: initialBuildingId,
  });

  const [buildings, setBuildings] = useState([]);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(normalizePagination());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const buildingFilter = useMemo(
    () => ({
      key: 'buildingId',
      label: 'Building',
      options: buildings.map((b) => ({ value: b.id, label: `${b.name} (${b.code})` })),
    }),
    [buildings],
  );

  useEffect(() => {
    listBuildings({ pageSize: 100, sortBy: 'name', sortOrder: 'asc', isActive: true })
      .then(({ data }) => setBuildings(data.data?.buildings || []))
      .catch(() => setBuildings([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const apiParams = { ...params };
      if (apiParams.isActive === 'true') apiParams.isActive = true;
      else if (apiParams.isActive === 'false') apiParams.isActive = false;
      else delete apiParams.isActive;
      if (!apiParams.buildingId) delete apiParams.buildingId;

      const { data } = await listWings(apiParams);
      const payload = data.data;
      setRows(payload.wings || []);
      setPagination(normalizePagination(payload));
    } catch (err) {
      setRows([]);
      setError(err.response?.data?.message || 'Failed to fetch wings');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    const q = state.buildingId ? `?buildingId=${state.buildingId}` : '';
    navigate(`/admin/wings/new${q}`);
  };

  return (
    <AppShell
      active="wings"
      onChange={(id) => {
        if (id === 'wings') return;
        const path = ADMIN_ROUTES[id];
        if (path) navigate(path);
      }}
      breadcrumb={[{ label: 'Home' }, { label: 'Wings' }]}
    >
      <PageHeader
        icon={Layers}
        iconColor="#a5b4fc"
        title="Wing Management"
        subtitle="Click a wing row to open details, or create a new wing."
      />

      {error && <div style={{ marginBottom: 12, color: '#fca5a5', fontSize: 14 }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac', fontSize: 14 }}>{success}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <ListToolbar
          search={state.search}
          onSearch={setSearch}
          searchPlaceholder="Search wings..."
          filters={[buildingFilter, STATUS_FILTER]}
          filterValues={state}
          onFilterChange={setFilter}
          newLabel="New Wing"
          onNew={openCreate}
        />

        <DataTable
          columns={COLUMNS}
          rows={rows}
          rowKey="id"
          loading={loading}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onSort={setSort}
          onRowClick={(row) => navigate(`/admin/wings/${row.id}`)}
          emptyTitle="No wings found"
          emptyDescription="Create wings under a building to prepare for Flats."
        />

        {!loading && pagination && <Pagination {...pagination} onPageChange={setPage} />}
      </section>
    </AppShell>
  );
}
