import { useCallback, useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
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
import { listBuildings } from '@/services/building.service.js';
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
  { key: 'code', label: 'Code', sortable: true },
  { key: 'buildingType', label: 'Type', sortable: true },
  { key: 'plannedUnits', label: 'Planned Units', sortable: true },
  { key: 'occupiedUnits', label: 'Occupied Units', sortable: true },
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

export default function BuildingsPage() {
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

      const { data } = await listBuildings(apiParams);
      const payload = data.data;
      setRows(payload.buildings || []);
      setPagination(normalizePagination(payload));
    } catch (err) {
      setRows([]);
      setError(err.response?.data?.message || 'Failed to fetch buildings');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell
      active="buildings"
      onChange={(id) => {
        if (id === 'buildings') return;
        const path = ADMIN_ROUTES[id];
        if (path) navigate(path);
      }}
      breadcrumb={[{ label: 'Home' }, { label: 'Buildings' }]}
    >
      <PageHeader
        icon={Building2}
        iconColor="#93c5fd"
        title="Building Management"
        subtitle="Click a tower row to open details, or create a new building."
      />

      {error && <div style={{ marginBottom: 12, color: '#fca5a5', fontSize: 14 }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac', fontSize: 14 }}>{success}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <ListToolbar
          search={state.search}
          onSearch={setSearch}
          searchPlaceholder="Search buildings..."
          filters={[STATUS_FILTER]}
          filterValues={state}
          onFilterChange={setFilter}
          newLabel="New Building"
          onNew={() => navigate('/admin/buildings/new')}
        />

        <DataTable
          columns={COLUMNS}
          rows={rows}
          rowKey="id"
          loading={loading}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onSort={setSort}
          onRowClick={(row) => navigate(`/admin/buildings/${row.id}`)}
          emptyTitle="No buildings found"
          emptyDescription="Create your first building to start Wings/Flats setup in next phases."
        />

        {!loading && pagination && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <Pagination {...pagination} onPageChange={setPage} />
          </div>
        )}
      </section>
    </AppShell>
  );
}
