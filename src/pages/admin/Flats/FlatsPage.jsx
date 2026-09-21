import { useCallback, useEffect, useMemo, useState } from 'react';
import { DoorOpen } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
import { listBuildings } from '@/services/building.service.js';
import { listWings } from '@/services/wing.service.js';
import { listFlats } from '@/services/flat.service.js';
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
  { key: 'flatNo', label: 'Flat', sortable: true },
  { key: 'floorNo', label: 'Floor', sortable: true },
  { key: 'wingCode', label: 'Wing', sortable: true },
  { key: 'buildingCode', label: 'Building', sortable: true },
  { key: 'flatType', label: 'Type', sortable: true },
  { key: 'usageType', label: 'Usage', sortable: true },
  { key: 'status', label: 'Occupancy', sortable: true },
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

export default function FlatsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialBuildingId = searchParams.get('buildingId') || '';
  const initialWingId = searchParams.get('wingId') || '';

  const { state, params, setPage, setSearch, setSort, setFilter, setState } = useListQuery({
    sortBy: 'sequence',
    sortOrder: 'asc',
    pageSize: 10,
    buildingId: initialBuildingId,
    wingId: initialWingId,
  });

  const [buildings, setBuildings] = useState([]);
  const [wings, setWings] = useState([]);
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

  const filteredWings = useMemo(() => {
    if (!state.buildingId) return wings;
    return wings.filter((w) => w.buildingId === state.buildingId);
  }, [wings, state.buildingId]);

  const wingFilter = useMemo(
    () => ({
      key: 'wingId',
      label: 'Wing',
      options: filteredWings.map((w) => ({ value: w.id, label: `${w.name} (${w.code})` })),
    }),
    [filteredWings],
  );

  useEffect(() => {
    listBuildings({ pageSize: 100, sortBy: 'name', sortOrder: 'asc', isActive: true })
      .then(({ data }) => setBuildings(data.data?.buildings || []))
      .catch(() => setBuildings([]));
    listWings({ pageSize: 100, sortBy: 'sequence', sortOrder: 'asc', isActive: true })
      .then(({ data }) => setWings(data.data?.wings || []))
      .catch(() => setWings([]));
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
      if (!apiParams.wingId) delete apiParams.wingId;

      const { data } = await listFlats(apiParams);
      const payload = data.data;
      setRows(payload.flats || []);
      setPagination(normalizePagination(payload));
    } catch (err) {
      setRows([]);
      setError(err.response?.data?.message || 'Failed to fetch flats');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    const q = new URLSearchParams();
    if (state.buildingId) q.set('buildingId', state.buildingId);
    if (state.wingId) q.set('wingId', state.wingId);
    const qs = q.toString();
    navigate(`/admin/flats/new${qs ? `?${qs}` : ''}`);
  };

  return (
    <AppShell
      active="flats"
      onChange={(id) => {
        if (id === 'flats') return;
        const path = ADMIN_ROUTES[id];
        if (path) navigate(path);
      }}
      breadcrumb={[{ label: 'Home' }, { label: 'Flats' }]}
    >
      <PageHeader
        icon={DoorOpen}
        iconColor="#93c5fd"
        title="Flat Management"
        subtitle="Click a flat row to open details, or create a new flat."
      />

      {error && <div style={{ marginBottom: 12, color: '#fca5a5', fontSize: 14 }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac', fontSize: 14 }}>{success}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <ListToolbar
          search={state.search}
          onSearch={setSearch}
          searchPlaceholder="Search flats..."
          filters={[buildingFilter, wingFilter, STATUS_FILTER]}
          filterValues={state}
          onFilterChange={(key, value) => {
            if (key === 'buildingId') {
              setState((s) => ({ ...s, [key]: value, wingId: '', page: 1 }));
            } else {
              setFilter(key, value);
            }
          }}
          newLabel="New Flat"
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
          onRowClick={(row) => navigate(`/admin/flats/${row.id}`)}
          emptyTitle="No flats found"
          emptyDescription="Create flats under a wing to prepare for Residents."
        />

        {!loading && pagination && <Pagination {...pagination} onPageChange={setPage} />}
      </section>
    </AppShell>
  );
}
