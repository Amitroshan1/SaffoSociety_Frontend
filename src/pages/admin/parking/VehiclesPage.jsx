import { useCallback, useEffect, useState } from 'react';
import { Car } from 'lucide-react';
import { AppShell } from '@/layout/admin/AppShell.jsx';
import { PageHeader } from '@/layout/admin/PageHeader.jsx';
import {
  DataTable,
  FilterBar,
  Pagination,
  SearchInput,
  StatusBadge,
} from '@/components/common/index.js';
import { useListQuery } from '@/hooks/useListQuery.js';
import { normalizePagination } from '@/utils/listQuery.js';
import {
  VEHICLE_STATUSES,
  VEHICLE_STATUS_COLORS,
  VEHICLE_TYPES,
  formatLabel,
  listParkingVehicles,
} from '@/services/parking.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const COLUMNS = [
  { key: 'vehicleNumber', label: 'Number', sortable: true },
  { key: 'vehicleType', label: 'Type', render: (r) => formatLabel(r.vehicleType) },
  {
    key: 'makeModel',
    label: 'Make / Model',
    render: (r) => [r.make, r.model].filter(Boolean).join(' ') || '-',
  },
  { key: 'color', label: 'Color', render: (r) => r.color || '-' },
  { key: 'residentName', label: 'Resident', render: (r) => r.residentName || '-' },
  { key: 'parkingCode', label: 'Parking code', render: (r) => r.parkingCode || '-' },
  {
    key: 'isPrimary',
    label: 'Primary',
    render: (r) => (r.isPrimary ? 'Yes' : 'No'),
  },
  {
    key: 'isVerified',
    label: 'Verified',
    render: (r) => (r.isVerified ? 'Yes' : 'No'),
  },
  {
    key: 'status',
    label: 'Status',
    render: (r) => <StatusBadge status={r.status} colors={VEHICLE_STATUS_COLORS} />,
  },
];

export default function VehiclesPage() {
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
      if (state.status) finalParams.status = state.status;
      if (state.vehicleType) finalParams.vehicleType = state.vehicleType;
      const { data } = await listParkingVehicles(finalParams);
      setRows(data.data?.vehicles || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch vehicles');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [params, state.status, state.vehicleType]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell
      active="parking"
      breadcrumb={[{ label: 'Home' }, { label: 'Parking' }, { label: 'Vehicles' }]}
    >
      <PageHeader
        icon={Car}
        iconColor="#93c5fd"
        title="Vehicles"
        subtitle="Registered resident vehicles across the society."
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
        <div className="crud-toolbar">
          <SearchInput value={state.search} onChange={setSearch} placeholder="Search vehicles" />
          <FilterBar
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: VEHICLE_STATUSES.map((s) => ({ value: s, label: formatLabel(s) })),
              },
              {
                key: 'vehicleType',
                label: 'Type',
                options: VEHICLE_TYPES.map((t) => ({ value: t, label: formatLabel(t) })),
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
          emptyTitle="No vehicles found"
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
