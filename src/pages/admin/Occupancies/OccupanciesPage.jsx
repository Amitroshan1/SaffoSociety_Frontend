import { useCallback, useEffect, useMemo, useState } from 'react';
import { UserCheck } from 'lucide-react';
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
import { listOccupancies } from '@/services/occupancy.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const COLUMNS = [
  { key: 'flatNo', label: 'Flat', sortable: false },
  { key: 'wingCode', label: 'Wing', sortable: false },
  { key: 'buildingCode', label: 'Building', sortable: false },
  { key: 'residentName', label: 'Resident', sortable: false },
  { key: 'role', label: 'Role', sortable: true },
  {
    key: 'isPrimary',
    label: 'Primary',
    render: (row) => (row.isPrimary ? 'Yes' : '—'),
  },
  { key: 'moveInDate', label: 'Move-in', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

export default function OccupanciesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialFlatId = searchParams.get('flatId') || '';
  const initialResidentId = searchParams.get('residentId') || '';

  const { state, params, setPage, setSearch, setSort, setFilter, setState } = useListQuery({
    sortBy: 'move_in_date',
    sortOrder: 'desc',
    pageSize: 10,
    flatId: initialFlatId,
    residentId: initialResidentId,
    currentOnly: 'true',
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

  const filteredWings = useMemo(() => {
    if (!state.buildingId) return wings;
    return wings.filter((w) => w.buildingId === state.buildingId);
  }, [wings, state.buildingId]);

  useEffect(() => {
    Promise.all([
      listBuildings({ pageSize: 100, sortBy: 'name', sortOrder: 'asc', isActive: true }),
      listWings({ pageSize: 100, sortBy: 'sequence', sortOrder: 'asc', isActive: true }),
    ])
      .then(([b, w]) => {
        setBuildings(b.data.data?.buildings || []);
        setWings(w.data.data?.wings || []);
      })
      .catch(() => {});
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
      if (!apiParams.flatId) delete apiParams.flatId;
      if (!apiParams.residentId) delete apiParams.residentId;
      if (!apiParams.role) delete apiParams.role;
      if (!apiParams.status) delete apiParams.status;
      if (apiParams.currentOnly === 'true' || apiParams.currentOnly === true) {
        apiParams.currentOnly = true;
      } else if (apiParams.currentOnly === 'false' || apiParams.currentOnly === false) {
        apiParams.currentOnly = false;
      } else {
        delete apiParams.currentOnly;
      }

      const { data } = await listOccupancies(apiParams);
      const payload = data.data;
      setRows(payload.occupancies || []);
      setPagination(normalizePagination(payload));
    } catch (err) {
      setRows([]);
      setError(err.response?.data?.message || 'Failed to fetch occupancies');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    const q = new URLSearchParams();
    if (state.flatId) q.set('flatId', state.flatId);
    if (state.residentId) q.set('residentId', state.residentId);
    const qs = q.toString();
    navigate(`/admin/occupancies/new${qs ? `?${qs}` : ''}`);
  };

  const buildingFilter = {
    key: 'buildingId',
    label: 'Building',
    options: buildings.map((b) => ({ value: b.id, label: `${b.name} (${b.code})` })),
  };

  const wingFilter = {
    key: 'wingId',
    label: 'Wing',
    options: filteredWings.map((w) => ({ value: w.id, label: `${w.name} (${w.code})` })),
  };

  const statusFilter = {
    key: 'currentOnly',
    label: 'View',
    options: [
      { value: 'true', label: 'Current only' },
      { value: 'false', label: 'Include history' },
    ],
  };

  return (
    <AppShell
      active="occupancy"
      onChange={(id) => {
        if (id === 'occupancy') return;
        const path = ADMIN_ROUTES[id];
        if (path) navigate(path);
      }}
      breadcrumb={[{ label: 'Home' }, { label: 'Occupancy' }]}
    >
      <PageHeader
        icon={UserCheck}
        iconColor="#86efac"
        title="Occupancy Management"
        subtitle="Click a row to open occupancy details, or record a move-in."
      />

      {error && <div style={{ marginBottom: 12, color: '#fca5a5', fontSize: 14 }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac', fontSize: 14 }}>{success}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <ListToolbar
          search={state.search}
          onSearch={setSearch}
          searchPlaceholder="Search resident..."
          filters={[buildingFilter, wingFilter, statusFilter]}
          filterValues={state}
          onFilterChange={(key, value) => {
            if (key === 'buildingId') {
              setState((s) => ({ ...s, buildingId: value, wingId: '', page: 1 }));
            } else {
              setFilter(key, value);
            }
          }}
          newLabel="Move in"
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
          onRowClick={(row) => navigate(`/admin/occupancies/${row.id}`)}
          emptyTitle="No occupancies found"
          emptyDescription="Record a move-in to assign residents to flats."
        />
        {!loading && pagination && <Pagination {...pagination} onPageChange={setPage} />}
      </section>
    </AppShell>
  );
}
