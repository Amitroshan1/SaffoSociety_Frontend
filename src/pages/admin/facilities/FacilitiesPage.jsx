import { useCallback, useEffect, useState } from 'react';
import { CalendarCheck, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../../layout/admin/AppShell.jsx';
import { PageHeader } from '../../../layout/admin/PageHeader.jsx';
import {
  DataTable,
  FilterBar,
  Pagination,
  SearchInput,
  StatusBadge,
} from '../../../components/common/index.js';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes.js';
import { useListQuery } from '../../../hooks/useListQuery.js';
import { normalizePagination } from '../../../utils/listQuery.js';
import {
  AMENITY_CATEGORIES,
  AMENITY_STATUSES,
  AMENITY_STATUS_COLORS,
  formatAmount,
  formatCategory,
  listAmenities,
} from '../../../services/facility.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const COLUMNS = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'category', label: 'Category', render: (row) => formatCategory(row.category) },
  { key: 'capacity', label: 'Capacity' },
  {
    key: 'pricePerSlot',
    label: 'Price',
    render: (row) => (row.isPaid ? formatAmount(row.pricePerSlot) : 'Free'),
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => <StatusBadge status={row.status} colors={AMENITY_STATUS_COLORS} />,
  },
  { key: 'bookingsToday', label: 'Bookings today', render: (row) => row.bookingsToday ?? row.todayBookingCount ?? 0 },
];

export default function FacilitiesPage() {
  const navigate = useNavigate();
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
      if (state.category) finalParams.category = state.category;
      if (state.isActive !== undefined && state.isActive !== '') {
        finalParams.isActive = state.isActive;
      }
      const { data } = await listAmenities(finalParams);
      setRows(data.data?.facilities || data.data?.amenities || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch facilities');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [params, state.status, state.category, state.isActive]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell
      active="facilities"
      onChange={(id) => ADMIN_ROUTES[id] && navigate(ADMIN_ROUTES[id])}
      breadcrumb={[{ label: 'Home' }, { label: 'Facilities' }, { label: 'All facilities' }]}
    >
      <PageHeader
        icon={CalendarCheck}
        iconColor="#93c5fd"
        title="Facilities"
        subtitle="Manage bookable facilities, pricing, and availability."
        action={
          <button
            className="btn-primary"
            type="button"
            onClick={() => navigate(ADMIN_ROUTES['facilities-new'])}
          >
            <Plus size={14} /> New facility
          </button>
        }
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
        <div className="crud-toolbar">
          <SearchInput value={state.search} onChange={setSearch} placeholder="Search facilities" />
          <FilterBar
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: AMENITY_STATUSES.map((s) => ({ value: s, label: s })),
              },
              {
                key: 'category',
                label: 'Category',
                options: AMENITY_CATEGORIES.map((c) => ({ value: c, label: formatCategory(c) })),
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
          onRowClick={(row) => navigate(`/admin/facilities/${row.id}`)}
          emptyTitle="No facilities found"
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
