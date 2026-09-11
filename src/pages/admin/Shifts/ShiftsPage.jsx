import { useCallback, useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { listShifts } from '../../../services/shift.service.js';
import '../../../styles/admin/AdminDashboard.css';
import '../../../styles/common/crud.css';

const COLUMNS = [
  { key: 'staffName', label: 'Staff' },
  { key: 'gateName', label: 'Gate' },
  { key: 'shiftDate', label: 'Date', sortable: true },
  { key: 'shiftType', label: 'Type' },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'scheduledStart', label: 'Start' },
  { key: 'scheduledEnd', label: 'End' },
];

export default function ShiftsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, params, setPage, setSearch, setSort, setFilter } = useListQuery({
    sortBy: 'scheduled_start',
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
      const { data } = await listShifts(params);
      setRows(data.data?.shifts || []);
      setPagination(normalizePagination(data.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch shifts');
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
      active="shifts"
      onChange={(id) => {
        if (id === 'shifts') return;
        const path = ADMIN_ROUTES[id];
        if (path) navigate(path);
      }}
      breadcrumb={[{ label: 'Home' }, { label: 'Shifts' }]}
    >
      <PageHeader
        icon={Clock3}
        iconColor="#fde68a"
        title="Shift Management"
        subtitle="Click a shift row to open details, or schedule a new shift."
      />
      {error && <div style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}
      {success && <div style={{ marginBottom: 12, color: '#86efac' }}>{success}</div>}
      <section className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
        <ListToolbar
          search={state.search}
          onSearch={setSearch}
          searchPlaceholder="Search staff..."
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: ['scheduled', 'active', 'completed', 'cancelled', 'no_show'].map((s) => ({
                value: s,
                label: s,
              })),
            },
          ]}
          filterValues={state}
          onFilterChange={setFilter}
          newLabel="New Shift"
          onNew={() => navigate('/admin/shifts/new')}
        />
        <DataTable
          columns={COLUMNS}
          rows={rows}
          rowKey="id"
          loading={loading}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onSort={setSort}
          onRowClick={(row) => navigate(`/admin/shifts/${row.id}`)}
          emptyTitle="No shifts"
          emptyDescription="Schedule guard and facility shifts."
        />
        {!loading && pagination && <Pagination {...pagination} onPageChange={setPage} />}
      </section>
    </AppShell>
  );
}
