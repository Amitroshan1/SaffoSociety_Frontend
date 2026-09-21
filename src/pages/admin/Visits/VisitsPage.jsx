import { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock3 } from 'lucide-react';
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
import { listVisits } from '@/services/visit.service.js';
import '@/styles/admin/AdminDashboard.css';
import '@/styles/common/crud.css';

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'approved', label: 'Approved' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'checked_out', label: 'Checked Out' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
];

const VISITOR_TYPE_OPTIONS = [
  'guest',
  'delivery',
  'maid',
  'driver',
  'technician',
  'vendor',
  'courier',
  'other',
];

const COLUMNS = [
  { key: 'visitorName', label: 'Visitor', sortable: false },
  { key: 'visitorType', label: 'Type', sortable: true },
  { key: 'passType', label: 'Pass', sortable: true },
  { key: 'flatNo', label: 'Flat', sortable: false },
  { key: 'purpose', label: 'Purpose', sortable: false },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'expectedAt', label: 'Expected', sortable: true },
  { key: 'checkInTime', label: 'In', sortable: true },
  { key: 'checkOutTime', label: 'Out', sortable: true },
];

export default function VisitsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialFlatId = searchParams.get('flatId') || '';
  const initialOccupancyId = searchParams.get('occupancyId') || '';
  const initialVisitorId = searchParams.get('visitorId') || '';

  const { state, params, setPage, setSearch, setSort, setFilter } = useListQuery({
    sortBy: 'created_at',
    sortOrder: 'desc',
    pageSize: 10,
    flatId: initialFlatId,
    occupancyId: initialOccupancyId,
    visitorId: initialVisitorId,
  });

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

  const statusFilter = {
    key: 'status',
    label: 'Status',
    options: STATUS_OPTIONS,
  };

  const typeFilter = useMemo(
    () => ({
      key: 'visitorType',
      label: 'Type',
      options: VISITOR_TYPE_OPTIONS.map((v) => ({ value: v, label: v })),
    }),
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const apiParams = { ...params };
      if (!apiParams.flatId) delete apiParams.flatId;
      if (!apiParams.occupancyId) delete apiParams.occupancyId;
      if (!apiParams.visitorId) delete apiParams.visitorId;
      if (!apiParams.status) delete apiParams.status;
      if (!apiParams.visitorType) delete apiParams.visitorType;
      const { data } = await listVisits(apiParams);
      setRows(data.data?.visits || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setRows([]);
      setError(err.response?.data?.message || 'Failed to fetch visits');
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
    if (state.occupancyId) q.set('occupancyId', state.occupancyId);
    if (state.visitorId) q.set('visitorId', state.visitorId);
    const qs = q.toString();
    navigate(`/admin/visits/new${qs ? `?${qs}` : ''}`);
  };

  return (
    <AppShell
      active="visits"
      onChange={(id) => {
        if (id === 'visits') return;
        const path = ADMIN_ROUTES[id];
        if (path) navigate(path);
      }}
      breadcrumb={[{ label: 'Home' }, { label: 'Visits' }]}
    >
      <PageHeader
        icon={Clock3}
        iconColor="#86efac"
        title="Visit Management"
        subtitle="Click a visit row to open ops actions, or create a new visit."
      />

      {error && <div style={{ marginBottom: 12, color: '#fca5a5', fontSize: 14 }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac', fontSize: 14 }}>{success}</div>}

      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <ListToolbar
          search={state.search}
          onSearch={setSearch}
          searchPlaceholder="Search visitor, vehicle, purpose..."
          filters={[statusFilter, typeFilter]}
          filterValues={state}
          onFilterChange={setFilter}
          newLabel="New Visit"
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
          onRowClick={(row) => navigate(`/admin/visits/${row.id}`)}
          emptyTitle="No visits found"
          emptyDescription="Create expected visitors or walk-ins for gate operations."
        />
        {!loading && pagination && <Pagination {...pagination} onPageChange={setPage} />}
      </section>
    </AppShell>
  );
}
